import { Transform, TransformCallback } from "node:stream";
import { Parser as CsvParser } from "@json2csv/plainjs";
import json2xml from "json2xml";
import { parse as csvParse } from "papaparse";
import xml2js from "xml2js";
import { ParserType } from "../types/types";

export async function createParseStream(type: ParserType): Promise<Transform> {
	switch (type) {
		case "csv2json":
			return await createCsvToJsonStream();
		case "json2csv":
			return await createJsonToCsvStream();
		case "xml2json":
			return await createXmlToJsonStream();
		case "json2xml":
			return await createJsonToXmlStream();
		case "json":
			return await createJsonFormatterStream();
		default:
			throw new Error(`Streaming not supported for type: ${type}`);
	}
}

export function createCsvToJsonStream(): Promise<Transform> {
	let firstChunk = true;

	return Promise.resolve(new Transform({
		writableObjectMode: false,
		readableObjectMode: false,

		async transform(chunk, _encoding, callback) {
			try {
				const data = chunk.toString();
				const result = csvParse(data, {
					header: true,
					skipEmptyLines: true,
					dynamicTyping: true,
					preview: 0,
				});

				let output = "";
				if (firstChunk) {
					output = "[\n";
					firstChunk = false;
				} else {
					output = ",\n";
				}

				output += result.data.map((item: unknown) => JSON.stringify(item)).join(",\n");

				this.push(output);
				callback();
			} catch (error) {
				callback(await handleParserError(error, "csv2json"));
			}
		},

		flush(callback) {
			if (firstChunk) {
				this.push("[]");
			} else {
				this.push("\n]");
			}
			callback();
		},
	}));
}

export function createJsonToCsvStream(): Promise<Transform> {
	const parser = new CsvParser();
	let headersWritten = false;

	return Promise.resolve(new Transform({
		writableObjectMode: true,
		readableObjectMode: false,

		async transform(chunk, _encoding, callback) {
			try {
				let data = chunk;

				if (typeof chunk === "string") {
					try {
						data = JSON.parse(chunk);
					} catch {
						return callback(new Error("Invalid JSON input"));
					}
				}

				if (!Array.isArray(data)) {
					data = [data];
				}

				let csv = "";
				if (!headersWritten) {
					csv = parser.parse(data);
					headersWritten = true;
					this.push(csv);
				} else {
					csv = data
						.map((item: { [s: string]: unknown } | ArrayLike<unknown>) =>
						Object.values(item)
							.map((val) => (typeof val === "string" ? `"${val.replaceAll('"', '""')}"` : val))
							.join(","),
						)
						.join("\n");
					this.push("\n" + csv);
				}

				callback();
			} catch (error) {
				callback(await handleParserError(error, "json2csv"));
			}
		},
	}));
}

export function createXmlToJsonStream(): Promise<Transform> {
	const parser = new xml2js.Parser({
		explicitArray: false,
		explicitRoot: false,
		mergeAttrs: true,
		charkey: "value",
	});

	let buffer = "";

	return Promise.resolve(new Transform({
		writableObjectMode: false,
		readableObjectMode: false,

		async transform(chunk, _encoding, callback) {
			try {
				buffer += chunk.toString();
				callback();
			} catch (error) {
				callback(await handleParserError(error, "xml2json"));
			}
		},

		async flush(callback) {
			try {
				if (!buffer.trim()) {
					this.push("null");
					return callback();
				}

				const result = await parser.parseStringPromise(buffer);
				this.push(JSON.stringify(result, null, 2));
				callback();
			} catch (error) {
				callback(await handleParserError(error, "xml2json"));
			}
		},
	}));
}

export function createJsonToXmlStream(): Promise<Transform> {
	let buffer = "";

	return Promise.resolve(new Transform({
		writableObjectMode: false,
		readableObjectMode: false,

		async transform(chunk, _encoding, callback) {
			try {
				buffer += chunk.toString();
				callback();
			} catch (error) {
				callback(await handleParserError(error, "json2xml"));
			}
		},

		async flush(callback) {
			try {
				if (!buffer.trim()) {
					this.push("");
					return callback();
				}

				const jsonObj = JSON.parse(buffer);
				const xml = json2xml(jsonObj, {
					attributes_key: "_attributes",
					header: true,
				});

				this.push(xml);
				callback();
			} catch (error) {
				callback(await handleParserError(error, "json2xml"));
			}
		},
	}));
}

export function createJsonFormatterStream(): Promise<Transform> {
	let buffer = "";

	return Promise.resolve(new Transform({
		writableObjectMode: false,
		readableObjectMode: false,

		async transform(chunk: Buffer | string, _encoding: BufferEncoding, callback: TransformCallback) {
			try {
				buffer += chunk.toString();
				callback();
			} catch (error) {
				callback(await handleParserError(error, "json"));
			}
		},

		async flush(callback: TransformCallback) {
			try {
				const trimmed = buffer.trim();

				if (!trimmed) {
					this.push("{}");
					return callback();
				}

				const data = JSON.parse(trimmed);
				this.push(JSON.stringify(data, null, 2));
				callback();
			} catch (error) {
				callback(await handleParserError(error, "json"));
			}
		},
	}));
}

export function handleParserError(error: unknown, type: ParserType): Promise<Error> {
	let errorMessage = "Parsing error";

	if (error instanceof Error) {
		errorMessage += `: ${error.message}`;
	} else if (typeof error === "string") {
		errorMessage += `: ${error}`;
	}

	switch (type) {
		case "json":
			errorMessage += "\n• Ensure valid JSON format";
			break;
		case "xml":
			errorMessage += "\n• Check XML structure and closing tags";
			break;
		case "xml2json":
			errorMessage += "\n• Verify XML is well-formed";
			break;
		case "csv2json":
			errorMessage += "\n• Check CSV headers and consistent columns";
			break;
		case "yaml":
			errorMessage += "\n• Verify YAML indentation and syntax";
			break;
		case "json2yaml":
			errorMessage += "\n• Input must be valid JSON";
			break;
		case "ini":
			errorMessage += "\n• INI files should use [sections] and key=value pairs";
			break;
		case "html2text":
			errorMessage += "\n• Input must be valid HTML";
			break;
		case "json2csv":
			errorMessage += "\n• Input must be a JSON array of objects";
			break;
		case "json2xml":
			errorMessage += "\n• Input must be a valid JSON object";
			break;
	}

	return Promise.resolve(new Error(errorMessage));
}

function detectFormatSync(data: string): ParserType | null {
	const first100 = data.trim().substring(0, 100);

	try {
		JSON.parse(first100 + (first100.includes("]") ? "]" : "}"));
		return "json";
	} catch {}

	if (/^<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/.test(first100)) {
		return "xml";
	}

	if (/^[a-zA-Z]+[ \t]*:\s*\S/.test(first100)) {
		return "yaml";
	}

	if (/,/.test(first100) && /\n/.test(first100)) {
		return "csv2json";
	}

	if (/^\[[^\]]+\]/.test(first100)) {
		return "ini";
	}

	if (/<html|<!DOCTYPE html|<head|<body/i.test(first100)) {
		return "html2text";
	}

	return null;
}

export function detectFormat(data: string): Promise<ParserType | null> {
	return Promise.resolve(detectFormatSync(data));
}

export type FileFilter = {
	name: string;
	extensions: string[];
};

const filters: Record<string, FileFilter> = {
	json: { name: "JSON Files", extensions: ["json"] },
	yaml: { name: "YAML Files", extensions: ["yaml", "yml"] },
	xml: { name: "XML Files", extensions: ["xml"] },
	csv: { name: "CSV Files", extensions: ["csv"] },
	ini: { name: "INI Files", extensions: ["ini", "cfg"] },
	html: { name: "HTML Files", extensions: ["html", "htm"] },
	subtitle: { name: "Subtitle Files", extensions: ["srt", "vtt", "ass", "ssa"] },
	spreadsheet: { name: "Spreadsheet Files", extensions: ["xlsx", "xls", "ods", "csv", "tsv"] },
	image: {
		name: "Image Files",
		extensions: ["png", "jpg", "jpeg", "webp", "avif", "gif", "tiff", "bmp"],
	},
	video: { name: "Video Files", extensions: ["mp4", "mkv", "mov", "webm", "avi", "m4v"] },
	audio: {
		name: "Audio Files",
		extensions: ["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac", "opus", "webm", "wma", "aiff"],
	},
	pdf: { name: "PDF Files", extensions: ["pdf"] },
};

function getFileFiltersSync(type: ParserType): FileFilter[] {
	switch (type) {
		case "json2yaml":
		case "json2xml":
		case "json2csv":
			return [filters.json];
		case "yaml":
			return [filters.yaml];
		case "xml2json":
			return [filters.xml];
		case "csv2json":
			return [filters.csv];
		case "ini":
			return [filters.ini];
		case "html2text":
		case "htmltable2json":
		case "htmltables2json":
			return [filters.html];
		case "srt2json":
		case "vtt2json":
		case "ass2json":
		case "srt2vtt":
		case "vtt2srt":
			return [filters.subtitle];
		case "xlsx2json":
		case "xlsx2csv":
			return [filters.spreadsheet];
		case "csv2xlsx":
			return [filters.csv];
		case "image2json":
		case "image2png":
		case "image2jpeg":
		case "image2webp":
		case "image2avif":
		case "image2gif":
		case "image2tiff":
			return [filters.image];
		case "video2json":
		case "video2frame":
		case "video2subtitles":
		case "video2audio":
			return [filters.video];
		case "audio2mp3":
		case "audio2wav":
		case "audio2ogg":
		case "audio2aac":
		case "audio2flac":
		case "audio2json":
		case "audio2srt":
		case "audio2vtt":
			return [filters.audio];
		case "pdf2text":
		case "pdf2json":
			return [filters.pdf];
		default:
			return [
				filters.json,
				filters.yaml,
				filters.xml,
				filters.csv,
				filters.ini,
				filters.html,
				filters.subtitle,
				filters.spreadsheet,
				filters.image,
				filters.video,
				{ name: "All Files", extensions: ["*"] },
			];
	}
}

export function getFileFilters(type: ParserType): Promise<FileFilter[]> {
	return Promise.resolve(getFileFiltersSync(type));
}
