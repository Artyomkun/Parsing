import * as cheerio from 'cheerio';
import escapeHtml from 'escape-html';
import * as XLSX from 'xlsx';
import sharp from 'sharp';
import ffmpeg from '@gumlet/fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import Papa from 'papaparse';
import * as yaml from 'js-yaml';
import ini from 'ini';
import { extractText, getMeta } from 'unpdf';
import {
    PARSER_ERRORS,
    htmlToJson,
    jsonToHtml,
    jsonToXml,
    markdownToHtml,
    parseDelimited,
    xmlToJson,
} from './parser';

type JsonNode =
    | { type: 'element'; name: string; attributes: Record<string, string>; children: JsonNode[] }
    | { type: 'text'; content: string }
    | { type: 'comment'; content: string }
    | { type: 'cdata'; content: string }
    | { type: 'directive'; name: string; data: string };

const ERROR_MESSAGES = {
    NO_CONTENT: 'Отсутствует контент для обработки',
    INVALID_HTML: 'Некорректная HTML-структура',
    PROCESSING_ERROR: 'Ошибка обработки узла',
};

const stringifyUnknown = (value: unknown): string => {
    if (value === null || value === undefined) {return '';}
    switch (typeof value) {
        case 'string':
            return value;
        case 'number':
        case 'boolean':
        case 'bigint':
        case 'symbol':
        case 'function':
            return String(value);
        default:
            try {
                return JSON.stringify(value) ?? '';
            } catch {
                return '';
            }
    }
};

const stringifyMetadata = (metadata: unknown): string => {
    if (metadata && typeof metadata === 'object') {
        const reader = metadata as { getRaw?: () => unknown; getAll?: () => unknown };
        if (typeof reader.getRaw === 'function') {return stringifyUnknown(reader.getRaw());}
        if (typeof reader.getAll === 'function') {return stringifyUnknown(reader.getAll());}
    }
    return stringifyUnknown(metadata);
};

const runAsync = <T>(operation: () => T): Promise<T> => {
    try {
        return Promise.resolve(operation());
    } catch (error) {
        return Promise.reject(error);
    }
};

export const convertHtmlToJson = (html: string): string => {
    if (!html.trim()) {throw new Error(ERROR_MESSAGES.NO_CONTENT);}

    try {
        const $ = cheerio.load(html, {
            xmlMode: true,
        });

        const rootNodes = $.root().children().toArray() as any[];
        if (rootNodes.length === 0) {throw new Error(ERROR_MESSAGES.INVALID_HTML);}
        const doctypeNode = rootNodes.find(
            (node) => node.type === 'directive' && node.name?.toLowerCase() === '!doctype',
        );

        const result = {
            documentType: doctypeNode ? doctypeNode.data?.toString().trim() || 'html' : 'html',
            nodes: rootNodes
                .filter((node) => node.type !== 'directive')
                .map((node) => processNode(node))
                .filter(Boolean) as JsonNode[],
        };

        return JSON.stringify(result, null, 2);
    } catch (error) {
        const message =
            error instanceof Error
                ? `${ERROR_MESSAGES.PROCESSING_ERROR}: ${error.message}`
                : ERROR_MESSAGES.PROCESSING_ERROR;
        throw new Error(message, { cause: error });
    }
};

const processNode = (node: any): JsonNode | null => {
    if (!node || typeof node !== 'object') {return null;}

    switch (node.type) {
        case 'tag':
        case 'script':
        case 'style': {
            return {
                type: 'element',
                name: node.name || 'unknown',
                attributes: node.attribs || {},
                children: (node.children || [])
                    .map((child: any) => processNode(child))
                    .filter(Boolean) as JsonNode[],
            };
        }
        case 'text': {
            const content = (node.data || '').trim();
            return content ? { type: 'text', content } : null;
        }
        case 'comment': {
            const content = (node.data || '').trim();
            return content ? { type: 'comment', content } : null;
        }
        case 'cdata': {
            const content = node.children?.[0]?.data?.trim() || '';
            return content ? { type: 'cdata', content } : null;
        }
        case 'directive': {
            const name = node.name || '';
            const data = (node.data || '').toString().trim();
            if (['!doctype', '?xml'].includes(name)) {
                return { type: 'directive', name, data };
            }
            return null;
        }
        default:
            return null;
    }
};

export interface SubtitleCue {
    id: number;
    start: number;
    end: number;
    text: string;
}

export interface TextToCuesOptions {
    duration?: number;
    gap?: number;
    startAt?: number;
}

const pad = (value: number, length = 2): string => String(Math.trunc(value)).padStart(length, '0');

export const msToTimestamp = (ms: number, separator = ','): string => {
    const safe = Math.max(0, Math.round(ms));
    const hours = Math.floor(safe / 3_600_000);
    const minutes = Math.floor((safe % 3_600_000) / 60_000);
    const seconds = Math.floor((safe % 60_000) / 1000);
    const millis = safe % 1000;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(millis, 3)}`;
};

const isAsciiDigit = (value: string): boolean => value >= '0' && value <= '9';

const isAsciiDigits = (value: string): boolean => {
    if (!value) {return false;}
    for (const char of value) {
        if (!isAsciiDigit(char)) {return false;}
    }
    return true;
};

const skipLeadingNonDigits = (text: string, from: number): number => {
    let index = from;
    while (index < text.length && !isAsciiDigit(text[index])) {index++;}
    return index;
};

const consumeTimeChars = (text: string, from: number): number => {
    let index = from;
    while (index < text.length && (isAsciiDigit(text[index]) || text[index] === ':')) {index++;}
    return index;
};

const isValidTimeParts = (hours: string, minutes: string, seconds: string): boolean =>
    isAsciiDigits(hours) &&
    isAsciiDigits(minutes) &&
    isAsciiDigits(seconds) &&
    minutes.length <= 2 &&
    seconds.length <= 2;

const extractMillis = (text: string, end: number, partsCount: number): string => {
    if (partsCount !== 3 || (text[end] !== '.' && text[end] !== ',')) {return '';}
    let millis = '';
    let fraction = end + 1;
    while (fraction < text.length && isAsciiDigit(text[fraction]) && millis.length < 3) {
        millis += text[fraction];
        fraction++;
    }
    return millis;
};

const computeTimestampMs = (hours: string, minutes: string, seconds: string, millis: string): number =>
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1000 +
    Number(millis.padEnd(3, '0'));

const parseTimestamp = (value: string): number | null => {
    const trimmed = value.trim();
    let search = 0;

    while (search < trimmed.length) {
        const start = skipLeadingNonDigits(trimmed, search);
        if (start >= trimmed.length) {return null;}

        const end = consumeTimeChars(trimmed, start);
        const parts = trimmed.slice(start, end).split(':');

        if (parts.length >= 3) {
            const [hours, minutes, seconds] = parts;
            if (isValidTimeParts(hours, minutes, seconds)) {
                return computeTimestampMs(hours, minutes, seconds, extractMillis(trimmed, end, parts.length));
            }
        }

        search = parts.length === 1 ? end : start + 1;
    }

    return null;
};

export const timestampToMs = (value: string): number => parseTimestamp(value) ?? 0;

const normalizeCues = (cues: SubtitleCue[]): SubtitleCue[] =>
    cues
        .slice()
        .sort((a, b) => a.start - b.start)
        .map((cue, index) => ({ ...cue, id: index + 1 }));

const parseBlocks = (input: string, timePattern: RegExp): SubtitleCue[] => {
    const blocks = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n{2,}/);
    const cues: SubtitleCue[] = [];

    for (const block of blocks) {
        const lines = block
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        const timeIndex = lines.findIndex((line) => timePattern.test(line));
        if (timeIndex === -1) {continue;}

        const [startRaw, endRaw] = lines[timeIndex].split('-->');
        if (startRaw === undefined || endRaw === undefined) {continue;}
        const start = parseTimestamp(startRaw);
        const end = parseTimestamp(endRaw);
        if (start === null || end === null) {continue;}

        cues.push({
            id: cues.length + 1,
            start,
            end,
            text: lines.slice(timeIndex + 1).join('\n'),
        });
    }

    return cues;
};

export const parseSrt = (input: string): SubtitleCue[] => parseBlocks(input, /-->/);

export const parseVtt = (input: string): SubtitleCue[] => {
    const withoutHeader = input.replace(/^\uFEFF?WEBVTT[^\n]*\n/, '');
    return parseBlocks(withoutHeader, /-->/);
};

const stripAssOverrides = (text: string): string => {
    let result = '';
    let index = 0;
    while (index < text.length) {
        const open = text.indexOf('{', index);
        if (open === -1) {
            result += text.slice(index);
            break;
        }
        result += text.slice(index, open);
        const close = text.indexOf('}', open + 1);
        if (close === -1) {
            result += text.slice(open);
            break;
        }
        index = close + 1;
    }
    return result;
};

export const parseAss = (input: string): SubtitleCue[] => {
    const lines = input.replace(/\r\n?/g, '\n').split('\n');
    const cues: SubtitleCue[] = [];
    let format: string[] = [];
    let inEvents = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (/^\[events\]/i.test(trimmed)) {
            inEvents = true;
            continue;
        }
        if (trimmed.startsWith('[')) {
            inEvents = false;
            continue;
        }
        if (!inEvents) {continue;}

        if (/^format:/i.test(trimmed)) {
            format = trimmed
                .slice(trimmed.indexOf(':') + 1)
                .split(',')
                .map((part) => part.trim().toLowerCase());
            continue;
        }

        if (/^dialogue:/i.test(trimmed)) {
            const parts = trimmed.slice(trimmed.indexOf(':') + 1).split(',');
            const pick = (name: string, fallback: number): string => {
                const index = format.indexOf(name);
                if (index === -1) {return parts[fallback] ?? '';}
                return index === format.length - 1 ? parts.slice(index).join(',') : parts[index] ?? '';
            };
            const text = stripAssOverrides(pick('text', 9).replace(/\\N/gi, '\n')).trim();
            cues.push({
                id: cues.length + 1,
                start: timestampToMs(pick('start', 1)),
                end: timestampToMs(pick('end', 2)),
                text,
            });
        }
    }

    return cues;
};

export const jsonToCues = (input: string): SubtitleCue[] => {
    const parsed: unknown = JSON.parse(input);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map((item, index) => {
        const cue = item as {
            id?: number;
            start?: number | string;
            end?: number | string;
            text?: unknown;
        };
        const start = typeof cue.start === 'string' ? timestampToMs(cue.start) : Number(cue.start ?? 0);
        const end = typeof cue.end === 'string' ? timestampToMs(cue.end) : Number(cue.end ?? 0);
        return {
            id: Number(cue.id ?? index + 1),
            start: Number.isFinite(start) ? start : 0,
            end: Number.isFinite(end) ? end : 0,
            text: stringifyUnknown(cue.text),
        };
    });
};

export const cuesToJson = (cues: SubtitleCue[]): string =>
    JSON.stringify(
        normalizeCues(cues).map((cue) => ({
            id: cue.id,
            start: cue.start,
            end: cue.end,
            startTime: msToTimestamp(cue.start),
            endTime: msToTimestamp(cue.end),
            text: cue.text,
        })),
        null,
        2,
    );

export const cuesToSrt = (cues: SubtitleCue[]): string =>
    normalizeCues(cues)
        .map((cue) => `${cue.id}\n${msToTimestamp(cue.start)} --> ${msToTimestamp(cue.end)}\n${cue.text}`)
        .join('\n\n') + '\n';

export const cuesToVtt = (cues: SubtitleCue[]): string =>
    'WEBVTT\n\n' +
    normalizeCues(cues)
        .map(
            (cue) =>
                `${cue.id}\n${msToTimestamp(cue.start, '.')} --> ${msToTimestamp(cue.end, '.')}\n${cue.text}`,
        )
        .join('\n\n') +
    '\n';

const ASS_LINE_BREAK = String.raw`\N`;

export const cuesToAss = (cues: SubtitleCue[]): string => {
    const toAssTime = (ms: number): string => {
        const centis = Math.max(0, Math.round(ms / 10));
        const hours = Math.floor(centis / 360_000);
        const minutes = Math.floor((centis % 360_000) / 6000);
        const seconds = Math.floor((centis % 6000) / 100);
        return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centis % 100)}`;
    };

    const header = [
        '[Script Info]',
        'ScriptType: v4.00+',
        '',
        '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize',
        'Style: Default,Arial,20',
        '',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ].join('\n');

    const events = normalizeCues(cues).map(
        (cue) =>
            `Dialogue: 0,${toAssTime(cue.start)},${toAssTime(cue.end)},Default,,0,0,0,,${cue.text.replaceAll('\n', ASS_LINE_BREAK)}`,
    );

    return `${header}\n${events.join('\n')}\n`;
};

export const textToCues = (input: string, options: TextToCuesOptions = {}): SubtitleCue[] => {
    const { gap = 0.2, startAt = 0, duration } = options;
    const sentences = input
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[.!?…])\s+|;\s+/)
        .map((part) => part.trim())
        .filter(Boolean);

    let cursor = startAt * 1000;
    return sentences.map((text, index) => {
        const seconds = duration ?? Math.min(8, Math.max(1.5, text.length / 15));
        const start = cursor;
        const end = start + seconds * 1000;
        cursor = end + gap * 1000;
        return { id: index + 1, start, end, text };
    });
};

export const srtToJson = (input: string): string => cuesToJson(parseSrt(input));
export const vttToJson = (input: string): string => cuesToJson(parseVtt(input));
export const assToJson = (input: string): string => cuesToJson(parseAss(input));
export const jsonToSrt = (input: string): string => cuesToSrt(jsonToCues(input));
export const jsonToVtt = (input: string): string => cuesToVtt(jsonToCues(input));
export const jsonToAss = (input: string): string => cuesToAss(jsonToCues(input));
export const srtToVtt = (input: string): string => cuesToVtt(parseSrt(input));
export const vttToSrt = (input: string): string => cuesToSrt(parseVtt(input));
export const textToSrt = (input: string): string => cuesToSrt(textToCues(input));
export const textToVtt = (input: string): string => cuesToVtt(textToCues(input));
export const textToAss = (input: string): string => cuesToAss(textToCues(input));

export interface ExtractedTable {
    headers: string[];
    rows: string[][];
}

const toRows = (json: string): Array<Record<string, unknown>> => {
    const parsed: unknown = JSON.parse(json);
    if (Array.isArray(parsed)) {
        return parsed.map((item) =>
            item && typeof item === 'object' ? (item as Record<string, unknown>) : { value: item },
        );
    }
    if (parsed && typeof parsed === 'object') {
        const values = Object.values(parsed as Record<string, unknown>);
        if (values.every((value) => value && typeof value === 'object' && !Array.isArray(value))) {
            return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
                sheet: key,
                ...(value as Record<string, unknown>),
            }));
        }
        return [parsed as Record<string, unknown>];
    }
    return [{ value: parsed }];
};

export const jsonToXlsx = (json: string): Buffer => {
    const data = JSON.parse(json) as unknown;
    const rows = Array.isArray(data) ? data : [data];
    const worksheet = XLSX.utils.json_to_sheet(rows as Array<Record<string, unknown>>);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};

export const xlsxToJson = (buffer: Buffer): string => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const result: Record<string, unknown[]> = {};
    for (const name of workbook.SheetNames) {
        result[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: null });
    }
    return JSON.stringify(result, null, 2);
};

export const csvToXlsx = (csv: string): Buffer => XLSX.write(XLSX.read(csv, { type: 'string' }), { type: 'buffer', bookType: 'xlsx' }) as Buffer;

export const xlsxToCsv = (buffer: Buffer): string => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
};

export const jsonToHtmlTable = (json: string): string => {
    const rows = toRows(json);
    if (!rows.length) {return '<table></table>';}

    const headers: string[] = [];
    for (const row of rows) {
        for (const key of Object.keys(row)) {
            if (!headers.includes(key)) {headers.push(key);}
        }
    }

    const headCells = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
    const head = `<thead><tr>${headCells}</tr></thead>`;
    const bodyRows = rows
        .map((row) => {
            const cells = headers
                .map((h) => `<td>${escapeHtml(stringifyUnknown(row[h]))}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');
    const body = `<tbody>${bodyRows}</tbody>`;

    return `<table>\n${head}\n${body}\n</table>`;
};

export const extractTables = (html: string): ExtractedTable[] => {
    const $ = cheerio.load(html);
    const tables: ExtractedTable[] = [];

    $('table').each((_, element) => {
        const $table = $(element);
        const headers: string[] = [];
        const rows: string[][] = [];

        $table.find('thead th, thead td').each((_, cell) => {
            headers.push($(cell).text().trim());
        });

        $table.find('tr').each((_, row) => {
            const cells: string[] = [];
            $(row)
                .find('th, td')
                .each((_, cell) => {
                    cells.push($(cell).text().trim());
                });
            if (!cells.length) {return;}
            if (headers.length && cells.join('\u0000') === headers.join('\u0000')) {return;}
            rows.push(cells);
        });

        if (!headers.length && rows.length) {
            headers.push(...(rows.shift() as string[]));
        }

        tables.push({ headers, rows });
    });

    return tables;
};

const tableToObjects = (table: ExtractedTable): Array<Record<string, string>> =>
    table.rows.map((row) => {
        const record: Record<string, string> = {};
        row.forEach((cell, index) => {
            record[table.headers[index] ?? `column_${index + 1}`] = cell;
        });
        return record;
    });

export const htmlToTablesJson = (html: string): string => {
    const tables = extractTables(html);
    if (tables.length === 1) {
        return JSON.stringify(tableToObjects(tables[0]), null, 2);
    }
    return JSON.stringify(
        tables.map((table, index) => ({
            index,
            headers: table.headers,
            rows: table.rows,
            objects: tableToObjects(table),
        })),
        null,
        2,
    );
};

ffmpeg.setFfmpegPath(ffmpegPath ?? '');
ffmpeg.setFfprobePath(ffprobeStatic.path);

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'gif' | 'tiff';
export type ImageFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export interface ImageOptions {
    format?: ImageFormat;
    width?: number;
    height?: number;
    quality?: number;
    fit?: ImageFit;
    rotate?: number;
    grayscale?: boolean;
    flip?: boolean;
    flop?: boolean;
}

export interface VideoOptions {
    ext?: string;
    time?: string;
    streamIndex?: number;
}

export const decodeBase64 = (data: string): Buffer => {
    const match = /^data:[^;]+;base64,(.*)$/s.exec(data);
    return Buffer.from((match ? match[1] : data).trim(), 'base64');
};

export const encodeBase64 = (buffer: Buffer): string => buffer.toString('base64');

interface Payload<T> {
    input: string;
    options: T;
}

const parseJsonObject = <T>(raw: string, what: string): T => {
    try {
        return JSON.parse(raw) as T;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Некорректный JSON (${what}): ${message}`, { cause: error });
    }
};

const parsePayload = <T extends object>(data: string): Payload<T> => {
    const trimmed = data.trim();
    if (trimmed.startsWith('{')) {
        const parsed = parseJsonObject<{ input?: string } & T>(trimmed, 'параметры конвертации');
        if (typeof parsed.input === 'string') {
            const { input, ...options } = parsed;
            return { input, options: options as T };
        }
    }
    return { input: trimmed, options: {} as T };
};

const withTempFile = async <T>(
    buffer: Buffer,
    extension: string,
    handler: (file: string) => Promise<T>,
): Promise<T> => {
    const file = path.join(
        os.tmpdir(),
        `convert_${Date.now()}_${randomUUID()}.${extension.replace(/^\./, '')}`,
    );
    await fs.writeFile(file, buffer);
    try {
        return await handler(file);
    } finally {
        await fs.rm(file, { force: true });
    }
};

export const imageToJson = async (data: string): Promise<string> => {
    const { input } = parsePayload<ImageOptions>(data);
    const metadata = await sharp(decodeBase64(input)).metadata();
    return JSON.stringify(metadata, null, 2);
};

export const convertImage = async (data: string, forced?: ImageFormat): Promise<string> => {
    const { input, options } = parsePayload<ImageOptions>(data);
    const format = forced ?? options.format ?? 'png';

    let pipeline = sharp(decodeBase64(input));
    if (options.rotate) {pipeline = pipeline.rotate(options.rotate);}
    if (options.grayscale) {pipeline = pipeline.grayscale();}
    if (options.flip) {pipeline = pipeline.flip();}
    if (options.flop) {pipeline = pipeline.flop();}
    if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height, {
            fit: options.fit ?? 'inside',
            withoutEnlargement: true,
        });
    }

    const quality = options.quality ?? 80;
    switch (format) {
        case 'jpeg':
            pipeline = pipeline.jpeg({ quality });
            break;
        case 'webp':
            pipeline = pipeline.webp({ quality });
            break;
        case 'avif':
            pipeline = pipeline.avif({ quality: Math.min(quality, 80) });
            break;
        case 'gif':
            pipeline = pipeline.gif();
            break;
        case 'tiff':
            pipeline = pipeline.tiff({ quality });
            break;
        case 'png':
        default:
            pipeline = pipeline.png();
            break;
    }

    return encodeBase64(await pipeline.toBuffer());
};

export const videoToJson = async (data: string): Promise<string> => {
    const { input, options } = parsePayload<VideoOptions>(data);
    return withTempFile(decodeBase64(input), options.ext ?? 'mp4', async (file) => {
        const metadata = await new Promise<unknown>((resolve, reject) => {
            ffmpeg.ffprobe(file, (error, info) => (error ? reject(error) : resolve(info)));
        });
        return JSON.stringify(metadata, null, 2);
    });
};

export const videoToFrame = async (data: string): Promise<string> => {
    const { input, options } = parsePayload<VideoOptions>(data);
    return withTempFile(decodeBase64(input), options.ext ?? 'mp4', async (file) => {
        const out = `${file}.png`;
        await new Promise<void>((resolve, reject) => {
            ffmpeg(file)
                .seekInput(options.time ?? '00:00:00')
                .frames(1)
                .output(out)
                .on('end', () => resolve())
                .on('error', reject)
                .run();
        });
        const buffer = await fs.readFile(out);
        await fs.rm(out, { force: true });
        return encodeBase64(buffer);
    });
};

export const videoToSubtitles = async (data: string): Promise<string> => {
    const { input, options } = parsePayload<VideoOptions>(data);
    return withTempFile(decodeBase64(input), options.ext ?? 'mp4', async (file) => {
        const out = `${file}.srt`;
        await new Promise<void>((resolve, reject) => {
            ffmpeg(file)
                .outputOptions([`-map 0:s:${options.streamIndex ?? 0}`, '-c:s srt'])
                .output(out)
                .on('end', () => resolve())
                .on('error', (error) =>
                    reject(new Error(`No embedded subtitle stream found: ${error.message}`)),
                )
                .run();
        });
        return fs.readFile(out, 'utf-8');
    });
};

export interface PdfOptions {
    mergePages?: boolean;
}

export const pdfToText = async (data: string): Promise<string> => {
    const { input, options } = parsePayload<PdfOptions>(data);
    const buffer = new Uint8Array(decodeBase64(input));
    const result = await extractText(buffer, {
        mergePages: options.mergePages ?? false,
    });
    if (typeof result.text === 'string' ? !result.text.trim() : !result.text.length) {
        throw new Error(PARSER_ERRORS.NO_CONTENT);
    }
    return JSON.stringify(result, null, 2);
};

export const pdfToJson = async (data: string): Promise<string> => {
    const { input } = parsePayload<PdfOptions>(data);
    const bytes = decodeBase64(input);
    const [meta, text] = await Promise.all([
        getMeta(new Uint8Array(bytes), { parseDates: false }),
        extractText(new Uint8Array(bytes), { mergePages: false }),
    ]);
    return JSON.stringify(
        {
            totalPages: text.totalPages,
            info: meta.info ?? {},
            metadata: stringifyMetadata(meta.metadata),
            pages: text.text,
        },
        null,
        2,
    );
};

export interface PdfCreateOptions {
    title?: string;
    fontSize?: number;
    margin?: number;
    lineHeight?: number;
}

const DEFAULT_PDF_CREATE_OPTIONS: Required<PdfCreateOptions> = {
    title: 'Generated PDF',
    fontSize: 12,
    margin: 72,
    lineHeight: 1.5,
};

function escapePdfString(str: string): string {
    return str
        .replaceAll('\\', String.raw`\\`)
        .replaceAll('(', String.raw`\(`)
        .replaceAll(')', String.raw`\)`)
        .replaceAll('\n', String.raw`\n`);
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        const width = test.length * fontSize * 0.5;
        if (width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) {lines.push(current);}
    return lines;
}

function generatePdfBuffer(textContent: string, opts: PdfCreateOptions): Buffer {
    const options = { ...DEFAULT_PDF_CREATE_OPTIONS, ...opts };
    const lines = wrapText(textContent, 500 - options.margin * 2, options.fontSize);
    const pageHeight = 792;
    const pageWidth = 612;
    const yStart = pageHeight - options.margin;
    const lineHeight = options.fontSize * options.lineHeight;
    const contentStream: string[] = [];
    contentStream.push('BT', '/F1 12 Tf', `1 0 0 1 ${options.margin} ${yStart} Tm`);
    let y = 0;
    for (const line of lines) {
        contentStream.push(`(${escapePdfString(line)}) Tj`);
        y -= lineHeight;
        contentStream.push(`0 ${y} Td`);
    }
    contentStream.push('ET');
    const content = contentStream.join('\n');
    const contentLength = Buffer.byteLength(content);
    const objects: Buffer[] = [];
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    objects.push(Buffer.from(obj1, 'utf-8'));
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    objects.push(Buffer.from(obj2, 'utf-8'));
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
    objects.push(Buffer.from(obj3, 'utf-8'));
    const obj4 = `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${content}\nendstream\nendobj\n`;
    objects.push(Buffer.from(obj4, 'utf-8'));
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    objects.push(Buffer.from(obj5, 'utf-8'));
    let offset = 0;
    const xrefOffsets: number[] = [0];
    for (const obj of objects) {
        xrefOffsets.push(offset);
        offset += obj.length;
    }
    const xrefLines: string[] = [];
    xrefLines.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
    for (const off of xrefOffsets.slice(1)) {
        xrefLines.push(`${off.toString().padStart(10, '0')} 00000 n \n`);
    }
    const xrefStr = xrefLines.join('');
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
    const header = Buffer.from('%PDF-1.4\n', 'utf-8');
    const allParts = [header, ...objects, Buffer.from(xrefStr, 'utf-8'), Buffer.from(trailer, 'utf-8')];
    return Buffer.concat(allParts);
}

const stripHtmlTags = (html: string): string => {
    let result = '';
    let index = 0;
    while (index < html.length) {
        const open = html.indexOf('<', index);
        if (open === -1) {
            result += html.slice(index);
            break;
        }
        result += html.slice(index, open);
        const close = html.indexOf('>', open + 1);
        if (close === -1) {
            result += html.slice(open);
            break;
        }
        result += ' ';
        index = close + 1;
    }
    return result;
};

const stripMarkdownLinks = (text: string): string => {
    let result = '';
    let index = 0;
    while (index < text.length) {
        const open = text.indexOf('[', index);
        if (open === -1) {
            result += text.slice(index);
            break;
        }
        const close = text.indexOf(']', open + 1);
        if (close === -1) {
            result += text.slice(index);
            break;
        }
        if (text[close + 1] !== '(') {
            result += text.slice(index, open + 1);
            index = open + 1;
            continue;
        }
        const urlEnd = text.indexOf(')', close + 2);
        if (urlEnd === -1) {
            result += text.slice(index, open + 1);
            index = open + 1;
            continue;
        }
        result += text.slice(index, open);
        result += text.slice(open + 1, close);
        index = urlEnd + 1;
    }
    return result;
};

export const textToPdf = (data: string): Promise<string> =>
    runAsync(() => {
        const { input, options } = parsePayload<PdfCreateOptions>(data);
        const text = Buffer.from(input, 'base64').toString('utf-8');
        if (!text.trim()) {throw new Error('Отсутствует контент для PDF');}
        return generatePdfBuffer(text, options).toString('base64');
    });

export const htmlToPdf = (data: string): Promise<string> =>
    runAsync(() => {
        const { input, options } = parsePayload<PdfCreateOptions>(data);
        const html = Buffer.from(input, 'base64').toString('utf-8');
        if (!html.trim()) {throw new Error('Отсутствует контент для PDF');}
        const text = stripHtmlTags(
            html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''),
        )
            .replaceAll('&nbsp;', ' ')
            .replaceAll('&amp;', '&')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&quot;', '"')
            .replaceAll('&#39;', "'")
            .replace(/\s+/g, ' ')
            .trim();
        if (!text) {throw new Error('Не удалось извлечь текст из HTML');}
        return generatePdfBuffer(text, options).toString('base64');
    });

export const markdownToPdf = (data: string): Promise<string> =>
    runAsync(() => {
        const { input, options } = parsePayload<PdfCreateOptions>(data);
        const md = Buffer.from(input, 'base64').toString('utf-8');
        if (!md.trim()) {throw new Error('Отсутствует контент для PDF');}
        const text = stripMarkdownLinks(
            md
                .replace(/#{1,6}\s+/g, '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/`(.*?)`/g, '$1'),
        )
            .replace(/^- /gm, '• ')
            .replace(/^\d+\. /gm, '')
            .replace(/>\s*/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        if (!text) {throw new Error('Не удалось извлечь текст из Markdown');}
        return generatePdfBuffer(text, options).toString('base64');
    });

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac' | 'flac';

export interface AudioOptions {
    ext?: string;
    format?: AudioFormat;
    bitrate?: string;
    sampleRate?: number;
    channels?: number;
    quality?: number;
    language?: string;
    model?: string;
}

const AUDIO_OUTPUT_EXT: Record<AudioFormat, string> = {
    mp3: 'mp3',
    wav: 'wav',
    ogg: 'ogg',
    aac: 'm4a',
    flac: 'flac',
};

const AUDIO_MIME: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    oga: 'audio/ogg',
    opus: 'audio/ogg',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    webm: 'audio/webm',
    wma: 'audio/x-ms-wma',
    aiff: 'audio/aiff',
};

const audioOutputOptions = (format: AudioFormat, options: AudioOptions): string[] => {
    const args = ['-vn'];
    switch (format) {
        case 'wav':
            args.push('-codec:a', 'pcm_s16le');
            break;
        case 'flac':
            args.push('-codec:a', 'flac');
            break;
        case 'ogg':
            args.push('-codec:a', 'libvorbis');
            if (options.bitrate) {args.push('-b:a', options.bitrate);}
            else {args.push('-q:a', String(options.quality ?? 4));}
            break;
        case 'aac':
            args.push('-codec:a', 'aac', '-b:a', options.bitrate ?? '192k');
            break;
        case 'mp3':
        default:
            args.push('-codec:a', 'libmp3lame', '-b:a', options.bitrate ?? '192k');
            break;
    }
    if (options.sampleRate) {args.push('-ar', String(options.sampleRate));}
    if (options.channels) {args.push('-ac', String(options.channels));}
    return args;
};

const runFfmpeg = (command: ReturnType<typeof ffmpeg>): Promise<void> =>
    new Promise((resolve, reject) => {
        command.on('end', () => resolve()).on('error', reject).run();
    });

const runAudioConversion = async (
    input: string,
    sourceExt: string,
    format: AudioFormat,
    options: AudioOptions,
): Promise<string> =>
    withTempFile(decodeBase64(input), sourceExt, async (file) => {
        const out = `${file}.${AUDIO_OUTPUT_EXT[format]}`;
        await runFfmpeg(
            ffmpeg(file).outputOptions(audioOutputOptions(format, options)).output(out),
        );
        try {
            return encodeBase64(await fs.readFile(out));
        } finally {
            await fs.rm(out, { force: true });
        }
    });

export const convertAudio = async (data: string, forced?: AudioFormat): Promise<string> => {
    const { input, options } = parsePayload<AudioOptions>(data);
    const format = forced ?? options.format ?? 'mp3';
    return runAudioConversion(input, options.ext ?? 'mp3', format, options);
};

export const videoToAudio = async (data: string): Promise<string> => {
    const { input, options } = parsePayload<AudioOptions>(data);
    const format = options.format ?? 'mp3';
    return runAudioConversion(input, options.ext ?? 'mp4', format, options);
};

export const audioToJson = async (data: string): Promise<string> => {
    const { input, options } = parsePayload<AudioOptions>(data);
    return withTempFile(decodeBase64(input), options.ext ?? 'mp3', async (file) => {
        const metadata = await new Promise<unknown>((resolve, reject) => {
            ffmpeg.ffprobe(file, (error, info) => (error ? reject(error) : resolve(info)));
        });
        return JSON.stringify(metadata, null, 2);
    });
};

const probeDurationMs = (buffer: Buffer, ext: string): Promise<number> =>
    withTempFile(buffer, ext, async (file) => {
        const info = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
            ffmpeg.ffprobe(file, (error, data) => (error ? reject(error) : resolve(data)));
        });
        const seconds = Number(info.format?.duration ?? 0);
        return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
    });

export const audioToSubtitles = async (
    data: string,
    format: 'srt' | 'vtt',
): Promise<string> => {
    const { input, options } = parsePayload<AudioOptions>(data);
    const apiKey = process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
        throw new Error(
            'Для транскрипции задайте WHISPER_API_KEY (или OPENAI_API_KEY) в окружении сервера',
        );
    }

    const buffer = decodeBase64(input);
    const ext = (options.ext ?? 'mp3').replace(/^\./, '').toLowerCase();

    const form = new FormData();
    form.append(
        'file',
        new Blob([new Uint8Array(buffer)], { type: AUDIO_MIME[ext] ?? 'application/octet-stream' }),
        `audio.${ext}`,
    );
    form.append('model', options.model ?? process.env.WHISPER_MODEL ?? 'whisper-1');
    form.append('response_format', 'verbose_json');
    if (options.language) {form.append('language', options.language);}

    const endpoint =
        process.env.WHISPER_API_URL ?? 'https://api.openai.com/v1/audio/transcriptions';
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
    });
    if (!response.ok) {
        const details = (await response.text()).slice(0, 500);
        throw new Error(`Транскрипция не удалась (HTTP ${response.status}): ${details}`);
    }

    const payload = (await response.json()) as {
        segments?: Array<{ start: number; end: number; text: string }>;
        text?: string;
    };

    const cues: SubtitleCue[] = (payload.segments ?? []).map((segment, index) => ({
        id: index + 1,
        start: Math.round(segment.start * 1000),
        end: Math.round(segment.end * 1000),
        text: segment.text.trim(),
    }));

    if (!cues.length && payload.text?.trim()) {
        const durationMs = await probeDurationMs(buffer, ext);
        cues.push({ id: 1, start: 0, end: durationMs, text: payload.text.trim() });
    }
    if (!cues.length) {throw new Error('Пустой результат транскрипции');}

    return format === 'vtt' ? cuesToVtt(cues) : cuesToSrt(cues);
};

export interface SiteOptions {
    selector?: string;
    timeout?: number;
    headers?: Record<string, string>;
    includeHtml?: boolean;
}

export interface SiteHeading {
    level: string;
    text: string;
}

export interface SiteLink {
    text: string;
    href: string;
}

export interface SiteImage {
    alt: string;
    src: string;
}

export interface SiteDocument {
    url: string;
    title: string;
    description: string;
    lang: string;
    headings: SiteHeading[];
    links: SiteLink[];
    images: SiteImage[];
    tables: ExtractedTable[];
    text: string;
    html?: string;
}

const DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const fetchHtml = async (
    url: string,
    options: SiteOptions = {},
): Promise<{ html: string; finalUrl: string }> => {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error(`Invalid URL: ${url}`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only http/https URLs are supported');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout ?? 20_000);
    try {
        const response = await fetch(parsed, {
            headers: {
                'User-Agent': DEFAULT_USER_AGENT,
                Accept: 'text/html,application/xhtml+xml',
                ...options.headers,
            },
            redirect: 'follow',
            signal: controller.signal,
        });
        if (!response.ok) {throw new Error(`HTTP ${response.status}`);}
        return { html: await response.text(), finalUrl: response.url || url };
    } finally {
        clearTimeout(timer);
    }
};

const absolute = (href: string, base: string): string => {
    try {
        return new URL(href, base).toString();
    } catch {
        return href;
    }
};

export const siteToJson = async (url: string, options: SiteOptions = {}): Promise<string> => {
    const { html, finalUrl } = await fetchHtml(url, options);
    const $ = cheerio.load(html);

    $('script, style, noscript, template, svg, iframe').remove();

    const headings: SiteHeading[] = $('h1, h2, h3, h4, h5, h6')
        .map((_, element) => ({
            level: (element as { tagName?: string }).tagName?.toLowerCase() ?? '',
            text: $(element).text().trim(),
        }))
        .get();

    const links: SiteLink[] = $('a[href]')
        .map((_, element) => ({
            text: $(element).text().trim(),
            href: absolute($(element).attr('href') ?? '', finalUrl),
        }))
        .get();

    const images: SiteImage[] = $('img')
        .map((_, element) => ({
            alt: $(element).attr('alt') ?? '',
            src: absolute($(element).attr('src') ?? '', finalUrl),
        }))
        .get();

    const scope = options.selector ? $(options.selector) : $.root();

    const page: SiteDocument = {
        url: finalUrl,
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') ?? '',
        lang: $('html').attr('lang') ?? '',
        headings,
        links,
        images,
        tables: extractTables(options.selector ? $.html(scope) : html),
        text: scope.text().replace(/\s+/g, ' ').trim(),
    };

    if (options.includeHtml) {page.html = html;}

    return JSON.stringify(page, null, 2);
};

export const siteToTables = async (url: string, options: SiteOptions = {}): Promise<string> => {
    const parsed = JSON.parse(await siteToJson(url, options)) as SiteDocument;
    return JSON.stringify(parsed.tables.map((table) => table.rows), null, 2);
};

export const siteToImages = async (url: string, options: SiteOptions = {}): Promise<string> => {
    const parsed = JSON.parse(await siteToJson(url, options)) as SiteDocument;
    return JSON.stringify(parsed.images, null, 2);
};

export const siteToLinks = async (url: string, options: SiteOptions = {}): Promise<string> => {
    const parsed = JSON.parse(await siteToJson(url, options)) as SiteDocument;
    return JSON.stringify(parsed.links, null, 2);
};

export const siteToText = async (url: string, options: SiteOptions = {}): Promise<string> => {
    const parsed = JSON.parse(await siteToJson(url, options)) as SiteDocument;
    return parsed.text;
};

const bufferToBase64 = (buffer: Buffer): string => buffer.toString('base64');

const base64ToBuffer = (data: string): Buffer =>
    Buffer.from(data.replace(/^data:[^;]+;base64,/, '').trim(), 'base64');

interface SitePayload extends SiteOptions {
    url: string;
}

const parseSitePayload = (data: string): SitePayload => {
    const trimmed = data.trim();
    if (trimmed.startsWith('{')) {
        const parsed = parseJsonObject<Partial<SitePayload>>(trimmed, 'параметры сайта');
        if (typeof parsed.url === 'string') {return parsed as SitePayload;}
    }
    return { url: trimmed };
};

type Handler = (data: string) => Promise<string> | string;

const handlers: Record<string, Handler> = {
    html: (data) => cheerio.load(data).text().trim() || PARSER_ERRORS.NO_CONTENT,
    html2text: (data) => cheerio.load(data).text().trim() || PARSER_ERRORS.NO_CONTENT,
    text: (data) => data.trim() || PARSER_ERRORS.NO_CONTENT,
    markdown: (data) => markdownToHtml(data) || PARSER_ERRORS.NO_CONTENT,
    json: (data) => JSON.stringify(JSON.parse(data), null, 2),
    jsonl: (data) =>
        JSON.stringify(
            data
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => JSON.parse(line)),
            null,
            2,
        ),
    yaml: (data) => {
        try {
            const parsed = yaml.load(data, { schema: yaml.FAILSAFE_SCHEMA });
            return JSON.stringify(parsed, null, 2);
        } catch {
            return PARSER_ERRORS.INVALID_YAML;
        }
    },
    ini: (data) => JSON.stringify(ini.parse(data), null, 2),
    ini2json: (data) => JSON.stringify(ini.parse(data), null, 2),
    csv: async (data) => JSON.stringify(await parseDelimited(data, ','), null, 2),
    tsv: async (data) => JSON.stringify(await parseDelimited(data, '\t'), null, 2),
    xml: async (data) => {
        try {
            if (typeof DOMParser !== 'undefined') {
                return new XMLSerializer().serializeToString(
                    new DOMParser().parseFromString(data, 'application/xml'),
                );
            }
            return jsonToXml(await xmlToJson(data));
        } catch {
            return PARSER_ERRORS.NO_CONTENT;
        }
    },
    xml2json: async (data) => JSON.stringify(await xmlToJson(data), null, 2),
    html2json: (data) => JSON.stringify(htmlToJson(data), null, 2),
    json2html: (data) => jsonToHtml(JSON.parse(data)) || PARSER_ERRORS.NO_CONTENT,
    csv2json: async (data) => JSON.stringify(await parseDelimited(data, ','), null, 2),
    json2csv: (data) => Papa.unparse(JSON.parse(data)),
    yaml2json: (data) => {
        try {
            const parsed = yaml.load(data, { schema: yaml.FAILSAFE_SCHEMA });
            return JSON.stringify(parsed, null, 2);
        } catch {
            return PARSER_ERRORS.INVALID_YAML;
        }
    },
    json2yaml: (data) => yaml.dump(JSON.parse(data)) || PARSER_ERRORS.NO_CONTENT,
    xml2yaml: async (data) => yaml.dump(await xmlToJson(data)) || PARSER_ERRORS.NO_CONTENT,
    yaml2xml: (data) => {
        try {
            const parsed = yaml.load(data, { schema: yaml.FAILSAFE_SCHEMA }) as object;
            return jsonToXml(parsed);
        } catch {
            return PARSER_ERRORS.INVALID_YAML;
        }
    },
    json2xml: (data) => jsonToXml(JSON.parse(data)),
    xml2jsonl: async (data) => {
        const json = await xmlToJson(data);
        return Object.entries(json)
            .map(([key, value]) => JSON.stringify({ [key]: value }))
            .join('\n');
    },
    srt2json: (data) => srtToJson(data),
    vtt2json: (data) => vttToJson(data),
    ass2json: (data) => assToJson(data),
    json2srt: (data) => jsonToSrt(data),
    json2vtt: (data) => jsonToVtt(data),
    json2ass: (data) => jsonToAss(data),
    srt2vtt: (data) => srtToVtt(data),
    vtt2srt: (data) => vttToSrt(data),
    text2srt: (data) => textToSrt(data),
    text2vtt: (data) => textToVtt(data),
    text2ass: (data) => textToAss(data),
    json2xlsx: (data) => bufferToBase64(jsonToXlsx(data)),
    xlsx2json: (data) => xlsxToJson(base64ToBuffer(data)),
    csv2xlsx: (data) => bufferToBase64(csvToXlsx(data)),
    xlsx2csv: (data) => xlsxToCsv(base64ToBuffer(data)),
    json2htmltable: (data) => jsonToHtmlTable(data),
    htmltable2json: (data) => htmlToTablesJson(data),
    htmltables2json: (data) => htmlToTablesJson(data),
    image2json: (data) => imageToJson(data),
    image2png: (data) => convertImage(data, 'png'),
    image2jpeg: (data) => convertImage(data, 'jpeg'),
    image2webp: (data) => convertImage(data, 'webp'),
    image2avif: (data) => convertImage(data, 'avif'),
    image2gif: (data) => convertImage(data, 'gif'),
    image2tiff: (data) => convertImage(data, 'tiff'),
    video2json: (data) => videoToJson(data),
    video2frame: (data) => videoToFrame(data),
    video2subtitles: (data) => videoToSubtitles(data),
    video2audio: (data) => videoToAudio(data),
    audio2mp3: (data) => convertAudio(data, 'mp3'),
    audio2wav: (data) => convertAudio(data, 'wav'),
    audio2ogg: (data) => convertAudio(data, 'ogg'),
    audio2aac: (data) => convertAudio(data, 'aac'),
    audio2flac: (data) => convertAudio(data, 'flac'),
    audio2json: (data) => audioToJson(data),
    audio2srt: (data) => audioToSubtitles(data, 'srt'),
    audio2vtt: (data) => audioToSubtitles(data, 'vtt'),
    pdf2text: (data) => pdfToText(data),
    pdf2json: (data) => pdfToJson(data),
    text2pdf: (data) => textToPdf(data),
    html2pdf: (data) => htmlToPdf(data),
    markdown2pdf: (data) => markdownToPdf(data),
    site2json: (data) => siteToJson(parseSitePayload(data).url, parseSitePayload(data)),
    site2tables: (data) => siteToTables(parseSitePayload(data).url, parseSitePayload(data)),
    site2images: (data) => siteToImages(parseSitePayload(data).url, parseSitePayload(data)),
    site2links: (data) => siteToLinks(parseSitePayload(data).url, parseSitePayload(data)),
    site2text: (data) => siteToText(parseSitePayload(data).url, parseSitePayload(data)),
    site2html: async (data) => {
        const payload = parseSitePayload(data);
        return await siteToJson(payload.url, { ...payload, includeHtml: true });
    },
};

export const convertTypes: string[] = Object.keys(handlers);

export const isConvertType = (type: string): boolean => type.toLowerCase() in handlers;

export const convert = async (type: string, data: string): Promise<string> => {
    if (!data.trim()) {return PARSER_ERRORS.NO_CONTENT;}
    const key = type.toLowerCase();
    const handler = handlers[key];
    if (!handler) {throw new Error(PARSER_ERRORS.UNSUPPORTED_TYPE(type));}
    return await handler(data);
};
