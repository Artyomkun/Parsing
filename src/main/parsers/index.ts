import { ParseConfig } from "papaparse";
import { parseDynamicContent } from "./apiParser.js";
import { handleParse } from "./dataParser.js";
import { parseHTMLContent } from "./dynamicParser.js";

export {
  parseDynamicContent,
  parseHTMLContent,
  handleParse
};

export type { ParseConfig };