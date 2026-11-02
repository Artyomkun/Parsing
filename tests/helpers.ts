import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { generate as generateSelfSignedCert } from 'selfsigned';

export type TestStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface TestResult {
    suite: string;
    name: string;
    status: TestStatus;
    ms: number;
    detail?: string;
}

export class Suite {
    private readonly results: TestResult[] = [];

    constructor(readonly name: string) {}

    async test(name: string, fn: () => unknown): Promise<void> {
        const started = Date.now();
        try {
            await fn();
            this.results.push({ suite: this.name, name, status: 'PASS', ms: Date.now() - started });
            console.log(`  [PASS] ${name}`);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            this.results.push({ suite: this.name, name, status: 'FAIL', ms: Date.now() - started, detail });
            console.log(`  [FAIL] ${name}: ${detail}`);
        }
    }

    skip(name: string, reason: string): void {
        this.results.push({ suite: this.name, name, status: 'SKIP', ms: 0, detail: reason });
        console.log(`  [SKIP] ${name}: ${reason}`);
    }

    getResults(): TestResult[] {
        return [...this.results];
    }
}

export const assert = (condition: unknown, message: string): void => {
    if (!condition) {throw new Error(message);}
};

export const message = (error: unknown): string => error instanceof Error ? error.message : String(error);

export const isDirectRun = (metaUrl: string): boolean => process.argv[1] !== undefined && metaUrl === pathToFileURL(process.argv[1]).href;

export const CACHE_DIR = path.join(import.meta.dirname, '.cache');

const TEMP_TAG = `smoke_${process.pid}_${Date.now()}`;

const withTempFile = async <T>(
    buffer: Buffer, 
    ext: string, 
    fn: (file: string) => T | Promise<T>
): Promise<T> => {
    if (TEMP_TAG.includes('..') || TEMP_TAG.includes('/') || TEMP_TAG.includes('\\')) {
        throw new Error('Invalid TEMP_TAG');
    }
    const file = path.join(os.tmpdir(), `${TEMP_TAG}_${randomUUID()}.${ext}`);
    await fs.promises.writeFile(file, buffer);
    try {
        return await fn(file);
    } finally {
        await fs.promises.rm(file, { force: true });
    }
};

export const runFfmpeg = (args: string[]): void => {
    const result = spawnSync(ffmpegPath as string, ['-hide_banner', '-loglevel', 'error', ...args], {
        encoding: 'utf-8',
        maxBuffer: 32 * 1024 * 1024,
    });
    
    if (result.status !== 0) {
        const reason = result.stderr?.trim() || `exit ${result.status}`;
        throw new Error(`ffmpeg ${args.join(' ')} -> ${reason}`);
    }
};

export interface ProbeStream {
    codec_type?: string;
    codec_name?: string;
    sample_rate?: string;
    channels?: number;
    [key: string]: unknown;
}

export interface ProbeResult {
    streams: ProbeStream[];
    format: Record<string, unknown>;
}

export const probe = (buffer: Buffer, ext: string): Promise<ProbeResult> => {
    return withTempFile<ProbeResult>(buffer, ext, (file) => {
        const result = spawnSync(
            ffprobeStatic.path,
            ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
            { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 },
        );
        if (result.status !== 0) {
            throw new Error(`ffprobe: ${result.stderr?.trim() || 'exit ' + result.status}`);
        }
        return JSON.parse(result.stdout) as ProbeResult;
    });
};

export interface ToneOptions {
    seconds?: number;
    sampleRate?: number;
    channels?: number;
}

export const generateToneWav = (options: ToneOptions = {}): Buffer => {
    const { seconds = 2, sampleRate = 44100, channels = 1 } = options;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `${TEMP_TAG}_tone_`));
    const out = path.join(tmpDir, `tone.wav`);

    try {
        runFfmpeg([
            '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}:sample_rate=${sampleRate}`,
            '-ac', String(channels), '-y', out,
        ]);
        return fs.readFileSync(out);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
};

export const generateVideo = (withAudio: boolean, seconds = 2): Buffer => {
    const out = path.join(os.tmpdir(), `${TEMP_TAG}_video_${withAudio ? 'av' : 'vonly'}.mp4`);
    const args = ['-f', 'lavfi', '-i', `color=c=blue:s=320x240:d=${seconds}`];
    if (withAudio) {
        args.push('-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}`, '-shortest', '-c:a', 'aac');
    }
    args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-y', out);
    runFfmpeg(args);
    const buffer = fs.readFileSync(out);
    fs.rmSync(out, { force: true });
    return buffer;
};

export const generateMinimalPdf = (text = 'Hello unpdf'): Buffer =>
    Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
            '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
            '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
            `4 0 obj<</Length ${68 + text.length}>>stream\nBT /F1 18 Tf 20 100 Td (${text}) Tj ET\nendstream\nendobj\n` +
            '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
            'trailer<</Root 1 0 R/Size 6>>\n%%EOF\n',
        'latin1',
    );

const AUDIO_MAGIC: Record<string, (buf: Buffer) => boolean> = {
    mp3: (b) => b.subarray(0, 3).toString('latin1') === 'ID3' || (b[0] === 0xff && (b[1]! & 0xe0) === 0xe0),
    wav: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WAVE',
    ogg: (b) => b.subarray(0, 4).toString('latin1') === 'OggS',
    aac: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp',
    flac: (b) => b.subarray(0, 4).toString('latin1') === 'fLaC',
};

export type AudioMagicFormat = keyof typeof AUDIO_MAGIC;

export const assertAudioMagic = (buffer: Buffer, format: AudioMagicFormat): void => {
    assert(buffer.length > 0, `${format}: пустой выход`);
    assert(
        AUDIO_MAGIC[format]?.(buffer) === true,
        `${format}: неожиданный контейнер, magic=${JSON.stringify(buffer.subarray(0, 12).toString('latin1'))}`,
    );
};

export const payload = (input: string | Buffer, options: Record<string, unknown> = {}): string => {
    const b64 = typeof input === 'string' ? input : input.toString('base64');
    return JSON.stringify({ input: b64, ...options });
};

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) smoke-tests; Parsing project e2e';

export const download = async (url: string, fileName: string): Promise<Buffer> => {
    const base = path.resolve(CACHE_DIR);
    if (fileName.includes('..') || path.isAbsolute(fileName)) {
        throw new Error('Access denied: invalid file name');
    }
    const target = path.resolve(base, fileName);
    const rel = path.relative(base, target);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new Error('Access denied: path traversal detected');
    }
    if (fs.existsSync(target) && fs.statSync(target).size > 0) {
        return fs.readFileSync(target);
    }
    let lastError = 'unknown';
    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            const parsedUrl = new URL(url);
            const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
            const fetchOptions: {
                headers: Record<string, string>;
                signal: AbortSignal;
                agent?: https.Agent;
            } = {
                headers: { 'User-Agent': USER_AGENT },
                signal: AbortSignal.timeout(60_000),
            };
            if (isLocalhost && parsedUrl.protocol === 'https:') {
                fetchOptions.agent = new https.Agent({ rejectUnauthorized: false });
            }
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {throw new Error(`HTTP ${response.status}`);}
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.mkdirSync(CACHE_DIR, { recursive: true });
            fs.writeFileSync(target, buffer);
            return buffer;
        } catch (error) {
            lastError = message(error);
        }
    }
    throw new Error(`Скачивание не удалось (${url}): ${lastError}`);
};

export interface WhisperMockResponse {
    status?: number;
    body: unknown;
    minFileSize?: number;
}

export interface WhisperMockCall {
    authorization?: string;
    bodySize: number;
    hasModel: boolean;
    hasLanguage: boolean;
}

interface MockTlsMaterial {
    key: string;
    cert: string;
}

let mockTlsMaterial: Promise<MockTlsMaterial> | undefined;

const getMockTlsMaterial = (): Promise<MockTlsMaterial> => {
    mockTlsMaterial ??= generateSelfSignedCert(
        [{name: 'commonName', value: '127.0.0.1'}],
        {
            keySize: 2048,
            algorithm: 'sha256',
            notBeforeDate: new Date(),
            notAfterDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            extensions: [
                {name: 'basicConstraints', cA: false},
                {name: 'keyUsage', digitalSignature: true, keyEncipherment: true},
                {name: 'extKeyUsage', serverAuth: true},
                {name: 'subjectAltName', altNames: [
                    {type: 7, ip: '127.0.0.1'},
                    {type: 2, value: 'localhost'},
                ]},
            ],
        },
    ).then((pems) => ({key: pems.private, cert: pems.cert}));
    return mockTlsMaterial;
};

export const startWhisperMock = async (
    response: WhisperMockResponse,
): Promise<{ url: string; cert: string; calls: WhisperMockCall[]; close: () => Promise<void> }> => {
    const calls: WhisperMockCall[] = [];
    const {key, cert} = await getMockTlsMaterial();
    const server = https.createServer({key, cert}, (req, res) => {
        let size = 0;
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
            size += chunk.length;
            chunks.push(chunk);
        });
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('latin1');
            calls.push({
                authorization: req.headers.authorization,
                bodySize: size,
                hasModel: raw.includes('name="model"'),
                hasLanguage: raw.includes('name="language"'),
            });
            const ok = (response.minFileSize ?? 0) <= size && (response.status ?? 200) < 400;
            res.writeHead(ok ? response.status ?? 200 : response.status ?? 400, {
                'Content-Type': 'application/json',
            });
            res.end(JSON.stringify(response.body));
        });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as { port: number }).port;
    return {
        url: `https://127.0.0.1:${port}/v1/audio/transcriptions`,
        cert,
        calls,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    };
};

