/// <reference lib="webworker" />
import * as XLSX from "xlsx";
import Papa from "papaparse";
import yaml from "js-yaml";
import { load } from "cheerio";
import { XMLBuilder, parse as parseXML } from "fast-xml-parser";

/** ===== SHA256 ===== */
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/** ===== Парсеры ===== */
async function parseCsvTsv(data: string, delimiter: string) {
  return new Promise((resolve, reject) => {
    Papa.parse(data, {
      delimiter,
      header: true,
      skipEmptyLines: true,
      complete: r => resolve(JSON.stringify(r.data, null, 2)),
      error: e => reject(e),
    });
  });
}

function parseHtml(data: string) {
  const $ = load(data);
  $('script, style, noscript').remove();
  return $('body').text().trim();
}

function parseMarkdown(md: string) {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

async function parseXlsx(arrayBuffer: ArrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const out: Record<string, unknown> = {};
  for (const name of wb.SheetNames) {
    try {
      const ws = wb.Sheets[name];
      out[name] = XLSX.utils.sheet_to_json(ws, { defval: null });
    } catch (err) {
      out[name] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return JSON.stringify(out, null, 2);
}

function parseJson(data: string) {
  return JSON.stringify(JSON.parse(data), null, 2);
}

function parseYaml(data: string) {
  return JSON.stringify(yaml.load(data), null, 2);
}

function parseXml(data: string) {
  const jsonObj = parseXML(data, { ignoreAttributes: false });
  const builder = new XMLBuilder({ format: true, indentBy: "  " });
  return builder.build(jsonObj);
}

/** ===== Worker message ===== */
self.addEventListener("message", async (evt: MessageEvent) => {
  const msg = evt.data;
  if (!msg || !msg.type) return;

  self.postMessage({ type: "progress", stage: "start", info: "Worker started" });

  try {
    let result: string = "";
    switch (msg.type) {
      case "csv": case "tsv":
        self.postMessage({ type: "progress", stage: "parsing", info: "Parsing CSV/TSV" });
        result = await parseCsvTsv(msg.data, msg.type === "csv" ? "," : "\t");
        break;

      case "html":
        self.postMessage({ type: "progress", stage: "parsing", info: "Parsing HTML" });
        result = parseHtml(msg.data);
        break;

      case "markdown":
        self.postMessage({ type: "progress", stage: "parsing", info: "Parsing Markdown" });
        result = parseMarkdown(msg.data);
        break;

      case "json":
        self.postMessage({ type: "progress", stage: "parsing", info: "Parsing JSON" });
        result = parseJson(msg.data);
        break;

      case "yaml":
        self.postMessage({ type: "progress", stage: "parsing", info: "Parsing YAML" });
        result = parseYaml(msg.data);
        break;

      case "xml":
        self.postMessage({ type: "progress", stage: "parsing", info: "Parsing XML" });
        result = parseXml(msg.data);
        break;

      case "xlsx":
        self.postMessage({ type: "progress", stage: "parsing", info: "Parsing XLSX" });
        result = await parseXlsx(msg.arrayBuffer);
        break;

      case "sha256":
        self.postMessage({ type: "progress", stage: "hashing", info: "Calculating SHA256" });
        result = await sha256(msg.data);
        break;

      default:
        throw new Error(`Unsupported type: ${msg.type}`);
    }

    const hash = await sha256(result);
    self.postMessage({ type: "progress", stage: "done", info: "Parsing finished" });
    self.postMessage({ type: "result", result, hash });

  } catch (err: any) {
    self.postMessage({ type: "error", error: err?.message || String(err) });
  }
});
