import net from 'node:net';
import {
    Suite,
    assert,
    assertAudioMagic,
    generateMinimalPdf,
    generateToneWav,
    isDirectRun,
    payload,
    TestResult,
} from './helpers';

export const runHttpSuite = async (): Promise<TestResult[]> => {
    const suite = new Suite('E2E через HTTP (express /convert)');
    const probe = net.createServer();
    await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const port = (probe.address() as net.AddressInfo).port;
    await new Promise<void>((resolve) => probe.close(() => resolve()));

    process.env.SERVER_PORT = String(port);
    process.env.STATIC_ROOT = process.cwd();
    await import('../server/express/main');
    const base = `http://127.0.0.1:${port}`;

    for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
            await fetch(`${base}/api/info`, { signal: AbortSignal.timeout(1000) });
            break;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    const post = async (
        path: string,
        body: unknown,
    ): Promise<{ status: number; json: { success?: boolean; data?: string; error?: string; types?: string[] } }> => {
        const response = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return { status: response.status, json: await response.json() };
    };

    const tone = generateToneWav({ seconds: 1 });
    const pdf = generateMinimalPdf('HTTP e2e PDF');

    await suite.test('GET /convert/types отдаёт все аудио/PDF-типы', async () => {
        const response = await fetch(`${base}/convert/types`);
        const json = (await response.json()) as { types: string[] };
        for (const type of ['audio2mp3', 'audio2flac', 'audio2srt', 'video2audio', 'pdf2text']) {
            assert(json.types.includes(type), `нет типа ${type}`);
        }
    });

    await suite.test('POST /convert: audio2wav по HTTP возвращает валидный WAV', async () => {
        const { status, json } = await post('/convert', { type: 'audio2wav', data: payload(tone, { ext: 'wav' }) });
        assert(status === 200 && json.success === true, `status=${status} error=${json.error}`);
        assertAudioMagic(Buffer.from(json.data ?? '', 'base64'), 'wav');
    });

    await suite.test('POST /convert: audio2mp3 -> ogg -> flac цепочка по HTTP', async () => {
        const mp3 = await post('/convert', { type: 'audio2mp3', data: payload(tone, { ext: 'wav' }) });
        assert(mp3.json.success === true, `mp3: ${mp3.json.error}`);
        assertAudioMagic(Buffer.from(mp3.json.data ?? '', 'base64'), 'mp3');

        const ogg = await post('/convert', { type: 'audio2ogg', data: payload(mp3.json.data ?? '', { ext: 'mp3' }) });
        assert(ogg.json.success === true, `ogg: ${ogg.json.error}`);
        const oggBuf = Buffer.from(ogg.json.data ?? '', 'base64');
        assertAudioMagic(oggBuf, 'ogg');

        const flac = await post('/convert', { type: 'audio2flac', data: payload(oggBuf, { ext: 'ogg' }) });
        assert(flac.json.success === true, `flac: ${flac.json.error}`);
        assertAudioMagic(Buffer.from(flac.json.data ?? '', 'base64'), 'flac');
    });

    await suite.test('POST /convert: audio2json по HTTP', async () => {
        const { status, json } = await post('/convert', { type: 'audio2json', data: payload(tone, { ext: 'wav' }) });
        assert(status === 200 && json.success === true, `status=${status}`);
        const meta = JSON.parse(json.data ?? '{}');
        assert(meta.format?.duration > 0.5, `duration=${meta.format?.duration}`);
    });

    await suite.test('POST /convert: pdf2text по HTTP', async () => {
        const { status, json } = await post('/convert', { type: 'pdf2text', data: payload(pdf) });
        assert(status === 200 && json.success === true, `status=${status} error=${json.error}`);
        assert((json.data ?? '').includes('HTTP e2e PDF'), `data=${(json.data ?? '').slice(0, 150)}`);
    });

    await suite.test('EDGE HTTP: неизвестный тип -> 500 + { success: false }', async () => {
        const { status, json } = await post('/convert', { type: 'audio2teleport', data: 'x' });
        assert(status === 500, `status=${status}`);
        assert(json.success === false && Boolean(json.error), 'нет success=false/error');
    });

    await suite.test('EDGE HTTP: нет type/data в теле -> 400', async () => {
        const { status, json } = await post('/convert', { foo: 'bar' });
        assert(status === 400, `status=${status}`);
        assert(json.success === false, 'нет success=false');
    });

    return suite.getResults();
};

if (isDirectRun(import.meta.url)) {
    void runHttpSuite().then((results) => {
        const failed = results.filter((r) => r.status === 'FAIL');
        console.log(`\nИтог: ${results.length - failed.length}/${results.length} PASS`);
        process.exit(failed.length ? 1 : 0);
    });
}
