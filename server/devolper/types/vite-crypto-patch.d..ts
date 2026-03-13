globalThis.crypto = {
  hash: (algorithm, data) => {
    return createHash(algorithm).update(data).digest('hex');
  }
};

globalThis.crypto = {
  getRandomValues: (buffer) => {
    const randomBytes = createHash('sha256')
      .update(Math.random().toString())
      .digest();
    buffer.set(randomBytes);
    return buffer;
  }
};

// Проверяем, нужно ли патчить crypto
if (!globalThis.crypto) {
  globalThis.crypto = {};
}

// Патчим только отсутствующие методы
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (buffer) => {
    const bytes = randomBytes(buffer.length);
    buffer.set(bytes);
    return buffer;
  };
}

// Добавляем поддержку Node.js-style хеширования
if (!globalThis.crypto.createHash) {
  globalThis.crypto.createHash = createHash;
}

// Добавляем только отсутствующие методы
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = (buffer) => {
    const bytes = randomBytes(buffer.length);
    buffer.set(bytes);
    return buffer;
  };
}

if (!globalThis.crypto.createHash) {
  globalThis.crypto.createHash = createHash;
}

if (!globalThis.crypto.randomBytes) {
  globalThis.crypto.randomBytes = randomBytes;
}
