declare module 'crypto-browserify' {
  import { createHash, randomBytes } from 'crypto';
  export { createHash, randomBytes };
  export function createCipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
  export function createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
}