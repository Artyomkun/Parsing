import { randomFillSync, randomBytes } from "crypto";

// Объявление глобальных интерфейсов с readonly subtle
declare global {
  interface Crypto {
    readonly subtle: SubtleCrypto; // Добавлен readonly модификатор
  }

  interface SubtleCrypto {
    digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;
    // Добавьте другие методы по мере необходимости
  }
}

/*
  Minimal, non-invasive Web Crypto polyfill for Node/Electron/ts-node.
  - Does NOT redeclare global types (avoids TS duplicate/declaration conflicts).
  - Ensures runtime has getRandomValues and randomUUID.
  - Exports safe wrappers: getRandomValues, randomUUID, subtle (may be undefined).
*/

// RFC4122 v4 UUID fallback using randomBytes
function uuidV4(): string {
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// fallback getRandomValues using crypto.randomFillSync
function fallbackGetRandomValues<T extends ArrayBufferView>(array: T): T {
  randomFillSync(array as any);
  return array;
}

// Try to obtain Node's webcrypto (works in Node 16+, or bundlers exposing webcrypto)
let nodeWebCrypto: any | undefined = undefined;
try {
  // prefer globalThis.crypto if present and has subtle
  if ((globalThis as any).crypto && (globalThis as any).crypto.subtle) {
    nodeWebCrypto = (globalThis as any).crypto;
  } else {
    // CommonJS/ts-node: require('crypto').webcrypto
    // use try/catch because require may not be available in ESM contexts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const req = typeof require !== "undefined" ? require : undefined;
    if (req) {
      const c = req("crypto");
      nodeWebCrypto = c?.webcrypto ?? undefined;
    }
  }
} catch {
  nodeWebCrypto = undefined;
}

// Build runtime object (do not overwrite existing global methods)
const runtimeCrypto: any = (globalThis as any).crypto ?? {};

// Ensure getRandomValues exists
if (typeof runtimeCrypto.getRandomValues !== "function") {
  runtimeCrypto.getRandomValues = fallbackGetRandomValues;
}

// Ensure randomUUID exists (prefer webcrypto, else fallback uuidV4)
if (typeof runtimeCrypto.randomUUID !== "function") {
  if (nodeWebCrypto && typeof nodeWebCrypto.randomUUID === "function") {
    runtimeCrypto.randomUUID = () => nodeWebCrypto.randomUUID();
  } else if (typeof (globalThis as any).crypto?.randomUUID === "function") {
    runtimeCrypto.randomUUID = () => (globalThis as any).crypto.randomUUID();
  } else {
    runtimeCrypto.randomUUID = uuidV4;
  }
}

// Ensure subtle if nodeWebCrypto provides it
if (!runtimeCrypto.subtle && nodeWebCrypto && nodeWebCrypto.subtle) {
  Object.defineProperty(runtimeCrypto, "subtle", {
    get: () => nodeWebCrypto.subtle,
    configurable: true,
    enumerable: true,
  });
}

// Apply back to globalThis.crypto (without replacing existing object)
if (typeof (globalThis as any).crypto === "undefined") {
  (globalThis as any).crypto = runtimeCrypto;
} else {
  const g = (globalThis as any).crypto;
  if (!g.getRandomValues) g.getRandomValues = runtimeCrypto.getRandomValues;
  if (!g.randomUUID) g.randomUUID = runtimeCrypto.randomUUID;
  if (!g.subtle && runtimeCrypto.subtle) {
    Object.defineProperty(g, "subtle", {
      get: () => runtimeCrypto.subtle,
      configurable: true,
      enumerable: true,
    });
  }
}

// Exports: small safe wrappers (no type-declaration conflicts)
export function getRandomValues<T extends ArrayBufferView>(array: T): T {
  return (globalThis as any).crypto.getRandomValues(array);
}

export function randomUUID(): string {
  return (globalThis as any).crypto.randomUUID();
}

// subtle may be undefined on older Node versions — typed as SubtleCrypto | undefined
export const subtle: SubtleCrypto | undefined = (globalThis as any).crypto?.subtle;

// Small debug (won't throw)
console.debug("crypto-polyfill loaded:", {
  hasSubtle: !!subtle,
  hasRandomUUID: typeof (globalThis as any).crypto?.randomUUID === "function",
  hasGetRandomValues: typeof (globalThis as any).crypto?.getRandomValues === "function",
});