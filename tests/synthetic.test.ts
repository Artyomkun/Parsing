import tls from 'node:tls';
import {
    Suite,
    assert,
    assertAudioMagic,
    generateMinimalPdf,
    generateToneWav,
    generateVideo,
    isDirectRun,
    message,
    payload,
    probe,
    startWhisperMock,
    TestResult
} from './helpers';
import {
    audioToJson,
    audioToSubtitles,
    convert,
    convertAudio,
    convertTypes,
    decodeBase64,
    pdfToText,
    pdfToJson,
    videoToAudio,
} from '../server/parser/converter';

export const runSyntheticSuite = async (): Promise<TestResult[]> => {
    const suite = new Suite('Синтетика (ffmpeg-фикстуры)');
    const tone = generateToneWav({ seconds: 2 });
    const mono22k = generateToneWav({ seconds: 1, sampleRate: 22050, channels: 1 });
    const videoAv = generateVideo(true);
    const videoSilent = generateVideo(false);

    await suite.test('WAV -> MP3 (магические байты контейнера)', async () => {
        const out = Buffer.from(await convertAudio(payload(tone, { ext: 'wav' }), 'mp3'), 'base64');
        assertAudioMagic(out, 'mp3');
    });
    await suite.test('WAV -> WAV (roundtrip без перекодирования контейнера)', async () => {
        const out = Buffer.from(await convertAudio(payload(tone, { ext: 'wav' }), 'wav'), 'base64');
        assertAudioMagic(out, 'wav');
    });
    await suite.test('WAV -> OGG (Vorbis)', async () => {
        const out = Buffer.from(await convertAudio(payload(tone, { ext: 'wav' }), 'ogg'), 'base64');
        assertAudioMagic(out, 'ogg');
    });
    await suite.test('WAV -> AAC/M4A', async () => {
        const out = Buffer.from(await convertAudio(payload(tone, { ext: 'wav' }), 'aac'), 'base64');
        assertAudioMagic(out, 'aac');
    });
    await suite.test('WAV -> FLAC', async () => {
        const out = Buffer.from(await convertAudio(payload(tone, { ext: 'wav' }), 'flac'), 'base64');
        assertAudioMagic(out, 'flac');
    });

    await suite.test('WAV -> MP3: ffprobe подтверждает mp3/codec mp3', async () => {
        const out = Buffer.from(await convertAudio(payload(tone, { ext: 'wav' }), 'mp3'), 'base64');
        const info = await probe(out, 'mp3');
        assert(info.format.format_name === 'mp3', `format_name=${info.format.format_name}`);
        assert(info.streams[0]?.codec_name === 'libmp3lame' || info.streams[0]?.codec_name === 'mp3', `codec=${info.streams[0]?.codec_name}`);
    });

    await suite.test('Опции: sampleRate=22050, channels=1 применяются', async () => {
        const out = Buffer.from(
            await convertAudio(payload(mono22k, { ext: 'wav', sampleRate: 22050, channels: 1 }), 'mp3'),
            'base64',
        );
        const info = await probe(out, 'mp3');
        assert(info.streams[0]?.sample_rate === '22050', `sample_rate=${info.streams[0]?.sample_rate}`);
        assert(info.streams[0]?.channels === 1, `channels=${info.streams[0]?.channels}`);
    });

    await suite.test('Опция bitrate=64k применяется к MP3', async () => {
        const out = Buffer.from(
            await convertAudio(payload(tone, { ext: 'wav', bitrate: '64k' }), 'mp3'),
            'base64',
        );
        const info = await probe(out, 'mp3');
        const bitrate = Number(info.format.bit_rate ?? 0);
        assert(bitrate > 50_000 && bitrate < 80_000, `bit_rate=${info.format.bit_rate}`);
    });

    await suite.test('"Голый" base64 без JSON-payload тоже работает', async () => {
        const out = Buffer.from(await convertAudio(tone.toString('base64'), 'ogg'), 'base64');
        assertAudioMagic(out, 'ogg');
    });

    await suite.test('data: URL во входе распознаётся decodeBase64', () => {
        const dataUrl = `data:audio/wav;base64,${tone.toString('base64')}`;
        assert(decodeBase64(dataUrl).equals(tone), 'data: URL -> исходный буфер');
    });

    await suite.test('audio2json: ffprobe видит wav, дорожку и длительность ~2с', async () => {
        const meta = JSON.parse(await audioToJson(payload(tone, { ext: 'wav' })));
        assert(String(meta.format?.format_name).includes('wav'), `format_name=${meta.format?.format_name}`);
        assert(Math.abs(Number(meta.format?.duration) - 2) < 0.2, `duration=${meta.format?.duration}`);
        assert(meta.streams?.[0]?.codec_type === 'audio', 'нет аудиодорожки');
    });

    await suite.test('video2audio: из mp4 извлекается только звук (видео отброшено)', async () => {
        const out = Buffer.from(await videoToAudio(payload(videoAv, { ext: 'mp4' })), 'base64');
        assertAudioMagic(out, 'mp3');
        const info = await probe(out, 'mp3');
        assert(info.streams.every((s) => s.codec_type === 'audio'), 'в результате есть не-аудио дорожки');
    });

    await suite.test('video2audio с format=wav возвращает WAV-контейнер', async () => {
        const out = Buffer.from(await videoToAudio(payload(videoAv, { ext: 'mp4', format: 'wav' })), 'base64');
        assertAudioMagic(out, 'wav');
    });

    await suite.test('EDGE: видео без аудиодорожки -> понятная ошибка ffmpeg', async () => {
        try {
            await videoToAudio(payload(videoSilent, { ext: 'mp4' }));
        } catch (error) {
            assert(message(error).length > 0, 'пустое сообщение об ошибке');
            return;
        }
        throw new Error('ожидалась ошибка для видео без звука');
    });

    await suite.test('EDGE: мусор вместо аудиофайла -> ошибка, а не зависание/криш', async () => {
        try {
            await convertAudio(payload(Buffer.from('это точно не аудио'), { ext: 'mp3' }), 'wav');
        } catch (error) {
            assert(message(error).length > 0, 'пустое сообщение об ошибке');
            return;
        }
        throw new Error('ожидалась ошибка для битого входа');
    });

    await suite.test('EDGE: пустой вход -> NO_CONTENT', async () => {
        const result = await convert('audio2mp3', '   ');
        assert(result.includes('No content'), `result=${result}`);
    });

    await suite.test('EDGE: неизвестный тип конвертации -> Unsupported', async () => {
        try {
            await convert('audio2teleport', 'x');
        } catch (error) {
            assert(message(error).includes('Unsupported'), `message=${message(error)}`);
            return;
        }
        throw new Error('ожидалась ошибка Unsupported');
    });

    await suite.test('EDGE: битый JSON-payload -> понятная ошибка', async () => {
        try {
            await convertAudio('{"input": не json', 'mp3');
        } catch (error) {
            assert(message(error).includes('JSON'), `message=${message(error)}`);
            return;
        }
        throw new Error('ожидалась ошибка некорректного JSON');
    });

    await suite.test('Все новые типы зарегистрированы в диспетчере', () => {
        for (const type of [
            'audio2mp3', 'audio2wav', 'audio2ogg', 'audio2aac', 'audio2flac',
            'audio2json', 'audio2srt', 'audio2vtt', 'video2audio', 'pdf2text', 'pdf2json',
        ]) {
            assert(convertTypes.includes(type), `тип не найден: ${type}`);
        }
    });

    const savedKey = process.env.WHISPER_API_KEY;
    const savedUrl = process.env.WHISPER_API_URL;

    const withMockEnv = async (
        mock: Awaited<ReturnType<typeof startWhisperMock>>,
        fn: () => Promise<void>,
    ): Promise<void> => {
        process.env.WHISPER_API_KEY = 'test-key';
        process.env.WHISPER_API_URL = mock.url;
        const savedCAs = tls.getCACertificates('default');
        tls.setDefaultCACertificates([...savedCAs, mock.cert]);
        try {
            await fn();
        } finally {
            tls.setDefaultCACertificates(savedCAs);
            await mock.close();
            if (savedKey) {process.env.WHISPER_API_KEY = savedKey;}
            else {delete process.env.WHISPER_API_KEY;}
            if (savedUrl) {process.env.WHISPER_API_URL = savedUrl;}
            else {delete process.env.WHISPER_API_URL;}
        }
    };

    await suite.test('EDGE: транскрипция без API-ключа -> понятная ошибка', async () => {
        delete process.env.WHISPER_API_KEY;
        delete process.env.OPENAI_API_KEY;
        try {
            await audioToSubtitles(payload(tone, { ext: 'wav' }), 'srt');
        } catch (error) {
            assert(message(error).includes('WHISPER_API_KEY'), `message=${message(error)}`);
            return;
        }
        throw new Error('ожидалась ошибка об отсутствии ключа');
    });

    await suite.test('audio2srt: сегменты API превращаются в SRT-таймкоды', async () => {
        const mock = await startWhisperMock({
            minFileSize: 50_000,
            body: {
                text: 'Привет мир',
                segments: [
                    { start: 0, end: 1.5, text: ' Привет ' },
                    { start: 1.5, end: 3.25, text: ' мир' },
                ],
            },
        });
        await withMockEnv(mock, async () => {
            const srt = await audioToSubtitles(payload(tone, { ext: 'wav', language: 'ru' }), 'srt');
            assert(srt.includes('00:00:00,000 --> 00:00:01,500'), `нет первой cue: ${srt}`);
            assert(srt.includes('00:00:01,500 --> 00:00:03,250'), `нет второй cue: ${srt}`);
            assert(srt.includes('Привет') && srt.includes('мир'), `нет текста: ${srt}`);
            assert(mock.calls[0]?.authorization === 'Bearer test-key', 'нет Authorization-заголовка');
            assert(mock.calls[0]?.hasModel === true, 'нет поля model в multipart');
            assert(mock.calls[0]?.hasLanguage === true, 'нет поля language в multipart');
        });
    });

    await suite.test('audio2vtt: VTT-формат таймкодов (точка вместо запятой)', async () => {
        const mock = await startWhisperMock({
            body: { text: 'ok', segments: [{ start: 0.25, end: 1, text: ' ok ' }] },
        });
        await withMockEnv(mock, async () => {
            const vtt = await audioToSubtitles(payload(tone, { ext: 'wav' }), 'vtt');
            assert(vtt.startsWith('WEBVTT'), 'нет заголовка WEBVTT');
            assert(vtt.includes('00:00:00.250 --> 00:00:01.000'), `таймкоды: ${vtt}`);
        });
    });

    await suite.test('EDGE: API без сегментов -> один cue на всю длительность', async () => {
        const mock = await startWhisperMock({ body: { text: 'Просто текст без сегментов' } });
        await withMockEnv(mock, async () => {
            const srt = await audioToSubtitles(payload(tone, { ext: 'wav' }), 'srt');
            assert(srt.includes('00:00:00,000 --> 00:00:02,000'), `длительность не подставилась: ${srt}`);
            assert(srt.includes('Просто текст'), `текст потерялся: ${srt}`);
        });
    });

    await suite.test('EDGE: API вернул 500 -> ошибка со статусом в сообщении', async () => {
        const mock = await startWhisperMock({ status: 500, body: { error: 'model exploded' } });
        await withMockEnv(mock, async () => {
            try {
                await audioToSubtitles(payload(tone, { ext: 'wav' }), 'srt');
            } catch (error) {
                assert(message(error).includes('500'), `message=${message(error)}`);
                return;
            }
            throw new Error('ожидалась ошибка HTTP 500');
        });
    });

    await suite.test('EDGE: API вернул пустой текст -> «Пустой результат транскрипции»', async () => {
        const mock = await startWhisperMock({ body: { text: '   ', segments: [] } });
        await withMockEnv(mock, async () => {
            try {
                await audioToSubtitles(payload(tone, { ext: 'wav' }), 'srt');
            } catch (error) {
                assert(message(error).includes('Пустой'), `message=${message(error)}`);
                return;
            }
            throw new Error('ожидалась ошибка пустого результата');
        });
    });

    await suite.test('pdf2text: текст извлекается из минимального PDF', async () => {
        const result = await pdfToText(payload(generateMinimalPdf('Edge Case PDF')));
        assert(result.includes('Edge Case PDF'), `result=${result.slice(0, 200)}`);
    });

    await suite.test('pdf2json: totalPages=1 и текст страницы', async () => {
        const result = JSON.parse(await pdfToJson(payload(generateMinimalPdf())));
        assert(result.totalPages === 1, `totalPages=${result.totalPages}`);
        assert(
            Array.isArray(result.pages) && String(result.pages[0]).includes('Hello unpdf'),
            `pages=${JSON.stringify(result.pages)}`,
        );
    });

    await suite.test('EDGE: битый PDF -> ошибка, а не криш', async () => {
        try {
            await pdfToText(payload(Buffer.from('%PDF-1.4\nмусор без структуры')));
        } catch (error) {
            assert(message(error).length > 0, 'пустое сообщение об ошибке');
            return;
        }
        throw new Error('ожидалась ошибка для битого PDF');
    });

    await suite.test('EDGE: пустой PDF-буфер -> ошибка', async () => {
        try {
            await pdfToText(payload(Buffer.alloc(0)));
        } catch (error) {
            assert(message(error).length > 0, 'пустое сообщение об ошибке');
            return;
        }
        throw new Error('ожидалась ошибка для пустого PDF');
    });

    return suite.getResults();
};

if (isDirectRun(import.meta.url)) {
    void runSyntheticSuite().then((results) => {
        const failed = results.filter((r) => r.status === 'FAIL');
        console.log(`\nИтог: ${results.length - failed.length}/${results.length} PASS`);
        process.exit(failed.length ? 1 : 0);
    });
}
