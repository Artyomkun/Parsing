/* electron/parsing.ts */
import * as Papa from "papaparse";
import { XMLBuilder } from "fast-xml-parser";
import * as yaml from "js-yaml";
import * as XLSX from "xlsx";

/* ===== Типы ===== */
export type ParserType =
  | "csv"
  | "tsv"
  | "html"
  | "json"
  | "xml"
  | "markdown"
  | "xlsx"
  | "json2yaml";

/* ===== Константы ===== */
const DELIMITERS: Record<string, string> = {
  csv: ",",
  tsv: "\t",
};

/* ===== Универсальная функция парсинга ===== */
export const globalParse = async ({
  type,
  data,
  arrayBuffer,
}: {
  type: ParserType;
  data?: string;
  arrayBuffer?: ArrayBuffer;
}): Promise<string> => {
  switch (type) {
    case "csv":
    case "tsv":
      if (!data) throw new Error("No CSV/TSV data provided");
      return await parseCsvTsv(data, type);

    case "html":
      if (!data) throw new Error("No HTML data");
      return parseHtml(data);

    case "json":
      if (!data) throw new Error("No JSON data");
      return parseJson(data);

    case "xml":
      if (!data) throw new Error("No XML data");
      return parseXml(data);

    case "markdown":
      if (!data) throw new Error("No Markdown data");
      return markdownToHtml(data);

    case "xlsx":
      if (!arrayBuffer) throw new Error("No XLSX file");
      return parseXlsx(arrayBuffer);

    case "json2yaml":
      if (!data) throw new Error("No JSON data");
      return jsonToYaml(data);

    default:
      throw new Error(`Unsupported parser type: ${type}`);
  }
};

/* ===== Парсеры ===== */
const parseCsvTsv = (data: string, type: "csv" | "tsv"): Promise<string> =>
  new Promise((resolve, reject) => {
    Papa.parse(data, {
      delimiter: DELIMITERS[type],
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors?.length)
          reject(new Error(result.errors.map((e) => e.message).join(", ")));
        else resolve(JSON.stringify(result.data, null, 2));
      },
      error: (err) => reject(err),
    });
  });

const parseHtml = (data: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, "text/html");
  doc.querySelectorAll("script, style").forEach((el) => el.remove());
  return doc.body.textContent?.trim() || "";
};

const parseJson = (data: string) => JSON.stringify(JSON.parse(data), null, 2);

const parseXml = (data: string) => {
  const builder = new XMLBuilder({ format: true, indentBy: "  " });
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, "application/xml");
  if (doc.getElementsByTagName("parsererror").length)
    throw new Error("Invalid XML");
  return builder.build(doc);
};

const markdownToHtml = (md: string) => {
  if (!md) return "";
  return md
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
};

const parseXlsx = async (arrayBuffer: ArrayBuffer) => {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const out: Record<string, unknown> = {};
  wb.SheetNames.forEach((name) => {
    try {
      out[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null });
    } catch (e) {
      out[name] = { error: e instanceof Error ? e.message : String(e) };
    }
  });
  return JSON.stringify(out, null, 2);
};

const jsonToYaml = (data: string) => {
  const obj = JSON.parse(data);
  return yaml.dump(obj);
};
