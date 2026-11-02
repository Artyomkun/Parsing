import {
    Suite,
    assert,
    assertAudioMagic,
    download,
    isDirectRun,
    message,
    payload,
    probe,
    TestResult,
} from './helpers';
import {
    audioToJson,
    convert,
    convertAudio,
    pdfToText,
    pdfToJson,
    videoToAudio,
} from '../server/parser/converter';

export const runRealWorldSuite = async (): Promise<TestResult[]> => {
    const suite = new Suite('Реальные данные (интернет)');
    const SOURCES = {
        mp3: { url: 'https://mdn.github.io/shared-assets/audio/t-rex-roar.mp3', file: 'trex-roar.mp3' },
        wav: { url: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.wav', file: 'sample.wav' },
        ogg: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg', file: 'example.ogg' },
        m4a: { url: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.m4a', file: 'sample.m4a' },
        video: { url: 'https://www.w3schools.com/html/mov_bbb.mp4', file: 'mov_bbb.mp4' },
        pdf: { url: 'https://pdfobject.com/pdf/sample.pdf', file: 'sample.pdf' },
    } as const;

    const fixtures: Partial<Record<keyof typeof SOURCES, Buffer>> = {};

    const fixture = async (key: keyof typeof SOURCES): Promise<Buffer> => {
        const cached = fixtures[key];
        if (cached) {return cached;}
        const source = SOURCES[key];
        const buffer = await download(source.url, source.file);
        fixtures[key] = buffer;
        return buffer;
    };

    const withFixture = async (
        key: keyof typeof SOURCES,
        fn: (buffer: Buffer) => Promise<void>,
    ): Promise<void> => {
        try {
            await fn(await fixture(key));
        } catch (error) {
            const text = message(error);
            if (text.includes('Скачивание не удалось')) {
                suite.skip(`${key}: прогон`, text);
                return;
            }
            throw error;
        }
    };

    await suite.test('Скачивание всех реальных фикстур', async () => {
        for (const key of Object.keys(SOURCES) as Array<keyof typeof SOURCES>) {
            const buffer = await fixture(key);
            assert(buffer.length > 1000, `${key}: подозрительно маленький файл (${buffer.length} байт)`);
        }
    });

    await suite.test('Реальный MP3 (MDN, roar) -> WAV: RIFF/WAVE + аудиодорожка', async () => {
        await withFixture('mp3', async (mp3) => {
            const out = Buffer.from(await convertAudio(payload(mp3, { ext: 'mp3' }), 'wav'), 'base64');
            assertAudioMagic(out, 'wav');
            const info = await probe(out, 'wav');
            assert(info.streams[0]?.codec_type === 'audio', 'нет аудиодорожки');
        });
    });

    await suite.test('Реальный MP3 -> FLAC, OGG, AAC(M4A)', async () => {
        await withFixture('mp3', async (mp3) => {
            const flac = Buffer.from(await convertAudio(payload(mp3, { ext: 'mp3' }), 'flac'), 'base64');
            assertAudioMagic(flac, 'flac');
            const ogg = Buffer.from(await convertAudio(payload(mp3, { ext: 'mp3' }), 'ogg'), 'base64');
            assertAudioMagic(ogg, 'ogg');
            const m4a = Buffer.from(await convertAudio(payload(mp3, { ext: 'mp3' }), 'aac'), 'base64');
            assertAudioMagic(m4a, 'aac');
        });
    });

    await suite.test('Реальный WAV (GitHub sample) -> MP3 + метаданные', async () => {
        await withFixture('wav', async (wav) => {
            const out = Buffer.from(
                await convertAudio(payload(wav, { ext: 'wav', bitrate: '128k' }), 'mp3'),
                'base64',
            );
            assertAudioMagic(out, 'mp3');
            const meta = JSON.parse(await audioToJson(payload(out, { ext: 'mp3' })));
            assert(meta.format?.format_name === 'mp3', `format_name=${meta.format?.format_name}`);
            assert(Number(meta.format?.duration) > 0, 'duration=0');
        });
    });

    await suite.test('Реальный OGG (Wikimedia) -> MP3', async () => {
        await withFixture('ogg', async (ogg) => {
            const out = Buffer.from(await convertAudio(payload(ogg, { ext: 'ogg' }), 'mp3'), 'base64');
            assertAudioMagic(out, 'mp3');
        });
    });

    await suite.test('Реальный M4A -> WAV и OGG (m4a-контейнер читается)', async () => {
        await withFixture('m4a', async (m4a) => {
            const wav = Buffer.from(await convertAudio(payload(m4a, { ext: 'm4a' }), 'wav'), 'base64');
            assertAudioMagic(wav, 'wav');
            const ogg = Buffer.from(await convertAudio(payload(m4a, { ext: 'm4a' }), 'ogg'), 'base64');
            assertAudioMagic(ogg, 'ogg');
        });
    });

    await suite.test('Реальное видео (Big Buck Bunny) -> MP3 + метаданные дорожки', async () => {
        await withFixture('video', async (video) => {
            const out = Buffer.from(await videoToAudio(payload(video, { ext: 'mp4' })), 'base64');
            assertAudioMagic(out, 'mp3');
            const info = await probe(out, 'mp3');
            assert(info.streams.every((s) => s.codec_type === 'audio'), 'в аудио-выходе есть видео');
            const meta = JSON.parse(await audioToJson(payload(out, { ext: 'mp3' })));
            assert(Number(meta.format?.duration) > 0, 'duration=0');
        });
    });

    await suite.test('Реальный PDF (pdfobject sample) -> текст через диспетчер convert()', async () => {
        await withFixture('pdf', async (pdf) => {
            const result = JSON.parse(await convert('pdf2text', payload(pdf)));
            assert(Number(result.totalPages) >= 1, `totalPages=${result.totalPages}`);
            const text = Array.isArray(result.text) ? result.text.join(' ') : String(result.text);
            assert(text.trim().length > 0, 'текст пустой');
        });
    });

    await suite.test('Реальный PDF -> JSON: метаданные info + страницы', async () => {
        await withFixture('pdf', async (pdf) => {
            const result = JSON.parse(await pdfToJson(payload(pdf)));
            assert(Number(result.totalPages) >= 1, `totalPages=${result.totalPages}`);
            assert(Array.isArray(result.pages), 'pages не массив');
            assert(typeof result.info === 'object' && result.info !== null, 'нет info');
        });
    });

    await suite.test('Реальный PDF -> pdfToText (mergePages=false)', async () => {
        await withFixture('pdf', async (pdf) => {
            const result = JSON.parse(await pdfToText(payload(pdf, { mergePages: false })));
            assert(Array.isArray(result.text), 'text не массив');
        });
    });

    return suite.getResults();
};

if (isDirectRun(import.meta.url)) {
    void runRealWorldSuite().then((results) => {
        const failed = results.filter((r) => r.status === 'FAIL');
        console.log(`\nИтог: ${results.length - failed.length}/${results.length} PASS`);
        process.exit(failed.length ? 1 : 0);
    });
}