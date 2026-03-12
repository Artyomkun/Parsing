/* src/MyApp.tsx */
import React, { useState, useRef } from "react";
import { globalParse, ParserType } from "./globalParse";
import * as XLSX from 'xlsx';
const MyApp: React.FC = () => {
  const [rawData, setRawData] = useState<string>("");
  const [rawArrayBuffer, setRawArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [parsedData, setParsedData] = useState<string>("");
  const [parserType, setParserType] = useState<ParserType>("html");
  const [urlInput, setUrlInput] = useState("");
  const [useCorsProxy, setUseCorsProxy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  // Парсинг текущих данных
  const doParse = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setParsedData("");

    try {
      const result = await globalParse({
        type: parserType,
        data: rawData,
        arrayBuffer: rawArrayBuffer || undefined,
      });

      // Приводим к строке для безопасного отображения
      setParsedData(typeof result === "string" ? result : JSON.stringify(result, null, 2));
    } catch (err: any) {
      setErrorMessage(err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка файла
  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      reader.onload = () => setRawArrayBuffer(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => setRawData(String(reader.result || ""));
      reader.readAsText(file, "utf-8");
    }

    e.currentTarget.value = "";
  };

  // Fetch URL и парсинг HTML
  const fetchUrlAndParse = async (url: string) => {
    if (!url.trim()) return setErrorMessage("Введите URL");

    setIsLoading(true);
    setErrorMessage(null);
    const ac = new AbortController();
    controllerRef.current = ac;

    let fetchUrl = url.trim();
    if (!/^https?:\/\//i.test(fetchUrl)) fetchUrl = "http://" + fetchUrl;
    if (useCorsProxy) fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`;

    try {
      const res = await fetch(fetchUrl, { signal: ac.signal });
      const text = await res.text();
      setRawData(text);
      setParserType("html");
      const parsed = await globalParse({ type: "html", data: text });
      setParsedData(typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2));
    } catch (err: any) {
      setErrorMessage(err.name === "AbortError" ? "Таймаут / CORS" : err.message);
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Parsing App — Global Parser</h1>

      <div className="mb-4 p-3 border rounded bg-gray-50">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Enter URL"
          className="border px-2 py-1 mr-2"
        />
        <button onClick={() => fetchUrlAndParse(urlInput)} disabled={isLoading}>
          Fetch URL
        </button>
        <label className="ml-2">
          <input
            type="checkbox"
            checked={useCorsProxy}
            onChange={(e) => setUseCorsProxy(e.target.checked)}
          />{" "}
          Use CORS Proxy
        </label>
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <select value={parserType} onChange={(e) => setParserType(e.target.value as ParserType)}>
          <option value="html">HTML → Text</option>
          <option value="json">JSON → Pretty</option>
          <option value="xml">XML → Pretty</option>
          <option value="csv">CSV → JSON</option>
          <option value="tsv">TSV → JSON</option>
          <option value="markdown">Markdown → HTML</option>
          <option value="xlsx">Excel (XLSX/XLS)</option>
          <option value="json2yaml">JSON → YAML</option>
        </select>

        <input
          type="file"
          accept=".txt,.csv,.tsv,.json,.xml,.md,.xlsx,.xls,.html"
          onChange={onFileInput}
        />
        <button onClick={doParse} disabled={isLoading}>
          Parse
        </button>
      </div>

      <textarea
        value={rawData}
        onChange={(e) => setRawData(e.target.value)}
        rows={8}
        className="w-full border p-2 mb-4"
      />

      {isLoading && <div>Parsing...</div>}
      {errorMessage && <div className="text-red-600 mb-4">{errorMessage}</div>}

      {parsedData && <pre className="bg-gray-100 p-2 rounded">{parsedData}</pre>}
    </div>
  );
};

export default MyApp;
