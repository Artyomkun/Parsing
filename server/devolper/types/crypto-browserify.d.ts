declare module 'crypto-browserify' {
  import { BinaryLike, BufferEncoding } from 'crypto';
  export function createHash(algorithm: string): Hash;
  interface Hash {
    update(data: BinaryLike, encoding?: string): this;
    digest(encoding: 'hex'): string;
    digest(encoding: 'base64'): string;
    digest(encoding?: BufferEncoding): string;
  }
  export function createHmac(algorithm: string, key: BinaryLike): Hmac;
  interface Hmac {
    update(data: BinaryLike): this;
    digest(encoding: 'hex'): string;
    digest(encoding: 'base64'): string;
    digest(encoding?: BufferEncoding): string;
  }
  export function randomBytes(size: number): Buffer;
  export function createCipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
  export function createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
  export function pbkdf2Sync(
    password: BinaryLike,
    salt: BinaryLike,
    iterations: number,
    keylen: number,
    digest: string
  ): Buffer;
  export * from 'crypto';
}