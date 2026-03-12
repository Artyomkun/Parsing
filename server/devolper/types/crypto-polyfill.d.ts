if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (!globalThis.crypto.createHash) {
  globalThis.crypto.createHash = (algorithm) => {
    const hash = {
      data: '',
      update(data) {
        this.data += data;
        return this;
      },
      digest() {
        return createHash(algorithm).update(this.data).digest('hex');
      }
    };
    return hash;
  };
}

if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (buffer) => {
    const randomBytes = createHash('sha256').update(Math.random().toString()).digest();
    buffer.set(randomBytes);
    return buffer;
  };
}

if (!globalThis.crypto.randomBytes) {
  globalThis.crypto.randomBytes = (size) => {
    const buffer = new Uint8Array(size);
    window.crypto.getRandomValues(buffer); // Use the native API when available
    return buffer;
  };
}