import { useMemo, useState } from 'react';

const API_BASE =
    ((process.env.API_URL as string | undefined) ?? '').replace(/\/+$/, '') || 'http://localhost:39143';

interface ConvertOption {
    value: string;
    label: string;
}

interface ConvertGroup {
    label: string;
    options: ConvertOption[];
}

const GROUPS: ConvertGroup[] = [
    {
        label: 'Текст и структуры',
        options: [
            { value: 'csv2json', label: 'CSV → JSON' },
            { value: 'json2csv', label: 'JSON → CSV' },
            { value: 'json', label: 'JSON (формат)' },
            { value: 'jsonl', label: 'JSONL → JSON' },
            { value: 'yaml2json', label: 'YAML → JSON' },
            { value: 'json2yaml', label: 'JSON → YAML' },
            { value: 'xml2json', label: 'XML → JSON' },
            { value: 'json2xml', label: 'JSON → XML' },
            { value: 'html2json', label: 'HTML → JSON' },
            { value: 'json2html', label: 'JSON → HTML' },
            { value: 'html', label: 'HTML → текст' },
            { value: 'markdown', label: 'Markdown → HTML' },
            { value: 'ini', label: 'INI → JSON' },
            { value: 'tsv', label: 'TSV → JSON' },
        ],
    },
    {
        label: 'Субтитры',
        options: [
            { value: 'srt2json', label: 'SRT → JSON' },
            { value: 'vtt2json', label: 'VTT → JSON' },
            { value: 'ass2json', label: 'ASS → JSON' },
            { value: 'json2srt', label: 'JSON → SRT' },
            { value: 'json2vtt', label: 'JSON → VTT' },
            { value: 'json2ass', label: 'JSON → ASS' },
            { value: 'srt2vtt', label: 'SRT → VTT' },
            { value: 'vtt2srt', label: 'VTT → SRT' },
            { value: 'text2srt', label: 'Текст → SRT' },
            { value: 'text2vtt', label: 'Текст → VTT' },
            { value: 'text2ass', label: 'Текст → ASS' },
        ],
    },
    {
        label: 'Таблицы',
        options: [
            { value: 'json2xlsx', label: 'JSON → XLSX' },
            { value: 'xlsx2json', label: 'XLSX → JSON' },
            { value: 'csv2xlsx', label: 'CSV → XLSX' },
            { value: 'xlsx2csv', label: 'XLSX → CSV' },
            { value: 'json2htmltable', label: 'JSON → HTML-таблица' },
            { value: 'htmltable2json', label: 'HTML-таблица → JSON' },
        ],
    },
    {
        label: 'Фото',
        options: [
            { value: 'image2json', label: 'Фото → JSON (метаданные)' },
            { value: 'image2png', label: 'Фото → PNG' },
            { value: 'image2jpeg', label: 'Фото → JPEG' },
            { value: 'image2webp', label: 'Фото → WEBP' },
            { value: 'image2avif', label: 'Фото → AVIF' },
            { value: 'image2gif', label: 'Фото → GIF' },
            { value: 'image2tiff', label: 'Фото → TIFF' },
        ],
    },
    {
        label: 'Видео',
        options: [
            { value: 'video2json', label: 'Видео → JSON (метаданные)' },
            { value: 'video2frame', label: 'Видео → кадр PNG' },
            { value: 'video2subtitles', label: 'Видео → SRT (встроенные субтитры)' },
            { value: 'video2audio', label: 'Извлечь аудио из видео' },
        ],
    },
    {
        label: 'Аудио',
        options: [
            { value: 'audio2mp3', label: 'Аудио → MP3' },
            { value: 'audio2wav', label: 'Аудио → WAV' },
            { value: 'audio2ogg', label: 'Аудио → OGG' },
            { value: 'audio2aac', label: 'Аудио → AAC (M4A)' },
            { value: 'audio2flac', label: 'Аудио → FLAC' },
            { value: 'audio2json', label: 'Аудио → JSON (метаданные)' },
            { value: 'audio2srt', label: 'Аудио → транскрипция (SRT)' },
            { value: 'audio2vtt', label: 'Аудио → транскрипция (VTT)' },
        ],
    },
    {
        label: 'PDF',
        options: [
            { value: 'pdf2text', label: 'PDF → текст' },
            { value: 'pdf2json', label: 'PDF → JSON (метаданные + текст)' },
            { value: 'text2pdf', label: 'Текст → PDF' },
            { value: 'html2pdf', label: 'HTML → PDF' },
            { value: 'markdown2pdf', label: 'Markdown → PDF' },
        ],
    },
    {
        label: 'Сайты',
        options: [
            { value: 'site2json', label: 'Сайт → JSON' },
            { value: 'site2tables', label: 'Сайт → таблицы' },
            { value: 'site2images', label: 'Сайт → картинки' },
            { value: 'site2links', label: 'Сайт → ссылки' },
            { value: 'site2text', label: 'Сайт → текст' },
            { value: 'site2html', label: 'Сайт → HTML' },
        ],
    },
];

const FILE_INPUT = new Set([
    'image2json',
    'image2png',
    'image2jpeg',
    'image2webp',
    'image2avif',
    'image2gif',
    'image2tiff',
    'video2json',
    'video2frame',
    'video2subtitles',
    'video2audio',
    'audio2mp3',
    'audio2wav',
    'audio2ogg',
    'audio2aac',
    'audio2flac',
    'audio2json',
    'audio2srt',
    'audio2vtt',
    'pdf2text',
    'pdf2json',
    'xlsx2json',
    'xlsx2csv',
]);

const URL_INPUT = new Set([
    'site2json',
    'site2tables',
    'site2images',
    'site2links',
    'site2text',
    'site2html',
]);

const VIDEO_INPUT = new Set(['video2json', 'video2frame', 'video2subtitles']);

const MEDIA_INPUT = new Set([
    ...VIDEO_INPUT,
    'video2audio',
    'audio2mp3',
    'audio2wav',
    'audio2ogg',
    'audio2aac',
    'audio2flac',
    'audio2json',
    'audio2srt',
    'audio2vtt',
]);

const BINARY_OUTPUT: Record<string, { ext: string; mime: string }> = {
    json2xlsx: { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    image2png: { ext: 'png', mime: 'image/png' },
    image2jpeg: { ext: 'jpg', mime: 'image/jpeg' },
    image2webp: { ext: 'webp', mime: 'image/webp' },
    image2avif: { ext: 'avif', mime: 'image/avif' },
    image2gif: { ext: 'gif', mime: 'image/gif' },
    image2tiff: { ext: 'tiff', mime: 'image/tiff' },
    video2frame: { ext: 'png', mime: 'image/png' },
    video2audio: { ext: 'mp3', mime: 'audio/mpeg' },
    audio2mp3: { ext: 'mp3', mime: 'audio/mpeg' },
    audio2wav: { ext: 'wav', mime: 'audio/wav' },
    audio2ogg: { ext: 'ogg', mime: 'audio/ogg' },
    audio2aac: { ext: 'm4a', mime: 'audio/mp4' },
    audio2flac: { ext: 'flac', mime: 'audio/flac' },
    text2pdf: { ext: 'pdf', mime: 'application/pdf' },
    html2pdf: { ext: 'pdf', mime: 'application/pdf' },
    markdown2pdf: { ext: 'pdf', mime: 'application/pdf' },
};

const acceptFor = (type: string): string => {
    if (type.startsWith('image')) {return 'image/*';}
    if (type.startsWith('video')) {return 'video/*';}
    if (type.startsWith('audio')) {return 'audio/*';}
    if (type.startsWith('pdf')) {return '.pdf';}
    return '.xlsx,.xls,.ods,.csv,.tsv';
};

const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
    });

export const App = () => {
    const [type, setType] = useState('csv2json');
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [fileData, setFileData] = useState('');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const inputKind = FILE_INPUT.has(type) ? 'file' : URL_INPUT.has(type) ? 'url' : 'text';
    const binary = BINARY_OUTPUT[type];
    const outputHref = useMemo(
        () => (result && binary ? `data:${binary.mime};base64,${result}` : ''),
        [result, binary],
    );

    const resetOutput = () => {
        setResult('');
        setError('');
    };

    const handleFile = async (file: File | null) => {
        setFileName(file?.name ?? '');
        setFileData('');
        if (!file) {return;}
        try {
            setFileData(await readAsDataUrl(file));
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleConvert = async () => {
        setLoading(true);
        setResult('');
        setError('');
        try {
            let data: string;
            if (inputKind === 'file') {
                if (!fileData) {throw new Error('Сначала выберите файл');}
                data = MEDIA_INPUT.has(type)
                    ? JSON.stringify({
                        input: fileData,
                        ext: (fileName.split('.').pop() || 'bin').toLowerCase(),
                    })
                    : fileData;
            } else if (inputKind === 'url') {
                if (!url.trim()) {throw new Error('Введите URL');}
                data = url.trim();
            } else {
                if (!text.trim()) {throw new Error('Введите данные');}
                data = text;
            }

            let response: Response;
            try {
                response = await fetch(`${API_BASE}/convert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data }),
                });
            } catch {
                throw new Error(`Сервер конвертаций недоступен (${API_BASE}). Запущен ли он?`);
            }

            const payload = (await response.json().catch(() => null)) as {
                success?: boolean;
                data?: string;
                error?: string;
            } | null;

            if (!response.ok || !payload?.success || typeof payload.data !== 'string') {
                throw new Error(payload?.error ?? `HTTP ${response.status}`);
            }
            setResult(payload.data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(result);
        } catch {
            setError('Не удалось скопировать в буфер обмена');
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Data Parser Pro</h1>
                <p className="text-gray-600">
                    Конвертация текста, таблиц, фото, видео, субтитров и парсинг сайтов
                </p>
            </header>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="space-y-4">
                    <select
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            setFileName('');
                            setFileData('');
                            resetOutput();
                        }}
                        disabled={loading}
                        className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {GROUPS.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                                {group.options.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    {inputKind === 'text' && (
                        <textarea
                            className="w-full p-2 border rounded min-h-25 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Введите данные"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={loading}
                        />
                    )}

                    {inputKind === 'url' && (
                        <input
                            type="url"
                            className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={loading}
                        />
                    )}

                    {inputKind === 'file' && (
                        <div>
                            <input
                                type="file"
                                accept={acceptFor(type)}
                                onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
                                disabled={loading}
                                className="w-full p-2 border rounded bg-white"
                            />
                            {fileName && (
                                <p className="text-sm text-gray-500 mt-1">Выбран: {fileName}</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => void handleConvert()}
                        disabled={loading}
                        className={`px-4 py-2 text-white rounded w-full transition-colors duration-200 ${
                            loading
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                    >
                        {loading ? 'Обработка...' : 'Конвертировать'}
                    </button>
                </div>
            </div>

            {(result || error) && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {error ? 'Ошибка' : 'Результат'}
                        </h2>
                        <div className="flex space-x-2">
                            {result && !binary && (
                                <button
                                    onClick={() => void copyToClipboard()}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                >
                                    Копировать
                                </button>
                            )}
                            <button
                                onClick={resetOutput}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                            >
                                Очистить
                            </button>
                        </div>
                    </div>

                    {error ? (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500">
                            <p className="text-red-700">{error}</p>
                        </div>
                    ) : binary ? (
                        <div className="space-y-4">
                            {binary.mime.startsWith('image/') && (
                                <img
                                    src={outputHref}
                                    alt="Результат"
                                    className="max-w-full border rounded"
                                />
                            )}
                            <a
                                href={outputHref}
                                download={`result.${binary.ext}`}
                                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                                Скачать .{binary.ext}
                            </a>
                        </div>
                    ) : (
                        <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm max-h-96">
                            {result}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};
