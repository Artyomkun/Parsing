/// <reference lib="webworker" />
/**
 * xlsx.worker.ts
 * WebWorker для парсинга XLSX/XLS (SheetJS)
 *
 * Получает ArrayBuffer в сообщении: { type: 'parse-xlsx', arrayBuffer: ArrayBuffer }
 * Возвращает сообщения:
 *  - { type: 'progress', stage: 'start'|'read'|'parse'|'done', info?: string }
 *  - { type: 'result', result: string }  // JSON строка с результатом
 *  - { type: 'error', error: string }
 */

import * as XLSX from "xlsx";

// eslint-disable-next-line no-restricted-globals
self.addEventListener("message", async (evt: MessageEvent) => {
  const msg = evt.data;
  try {
    if (!msg || msg.type !== "parse-xlsx") return;

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: "progress", stage: "start", info: "Worker started" });

    const arrayBuffer: ArrayBuffer = msg.arrayBuffer;
    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw new Error("Invalid ArrayBuffer provided to worker");
    }

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: "progress", stage: "read", info: "Reading workbook (SheetJS)" });

    // читаем книгу
    const wb = XLSX.read(arrayBuffer, { type: "array" });

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: "progress", stage: "parse", info: `Parsing ${wb.SheetNames.length} sheets` });

    const out: Record<string, unknown> = {};
    for (const name of wb.SheetNames) {
      try {
        const ws = wb.Sheets[name];
        const json = XLSX.utils.sheet_to_json(ws, { defval: null });
        out[name] = json;
      } catch (inner) {
        // не ломаем весь парсинг, но отметим ошибку для листа
        out[name] = { error: (inner instanceof Error) ? inner.message : String(inner) };
      }
      // опционально: сообщаем прогресс по листам
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({ type: "progress", stage: "parse", info: `Parsed sheet: ${name}` });
    }

    const resultStr = JSON.stringify(out, null, 2);
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: "progress", stage: "done", info: "Parsing finished" });
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: "result", result: resultStr });
  } catch (error: any) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ type: "error", error: error?.message || String(error) });
  }
});
