export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
export function generateUniqueId(existingIds: Set<string>): string {
  let id;
  do {
    id = generateId();
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefix(prefix: string): string {
  return `${prefix}-${generateId()}`;
}
export function generateUniqueIdWithPrefix(prefix: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefix(prefix);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithSuffix(suffix: string): string {
  return `${generateId()}-${suffix}`;
}
export function generateUniqueIdWithSuffix(suffix: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithSuffix(suffix);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithTimestamp(): string {
  return `${generateId()}-${Date.now()}`;
}
export function generateUniqueIdWithTimestamp(existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithTimestamp();
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithRandomSuffix(suffixLength: number): string {
  const suffix = Math.random().toString(36).substring(2, 2 + suffixLength);
  return `${generateId()}-${suffix}`;
}
export function generateUniqueIdWithRandomSuffix(suffixLength: number, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithRandomSuffix(suffixLength);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithCustomFormat(format: string): string {
  const randomPart = generateId();
  return format.replace('{id}', randomPart);
}
export function generateUniqueIdWithCustomFormat(format: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithCustomFormat(format);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixAndTimestamp(prefix: string): string {
  return `${prefix}-${generateId()}-${Date.now()}`;
}
export function generateUniqueIdWithPrefixAndTimestamp(prefix: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixAndTimestamp(prefix);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixAndRandomSuffix(prefix: string, suffixLength: number): string {
  const suffix = Math.random().toString(36).substring(2, 2 + suffixLength);
  return `${prefix}-${generateId()}-${suffix}`;
}
export function generateUniqueIdWithPrefixAndRandomSuffix(prefix: string, suffixLength: number, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixAndRandomSuffix(prefix, suffixLength);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixAndCustomFormat(prefix: string, format: string): string {
  const randomPart = generateId();
  return `${prefix}-${format.replace('{id}', randomPart)}`;
}
export function generateUniqueIdWithPrefixAndCustomFormat(prefix: string, format: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixAndCustomFormat(prefix, format);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithSuffixAndTimestamp(suffix: string): string {
  return `${generateId()}-${suffix}-${Date.now()}`;
}
export function generateUniqueIdWithSuffixAndTimestamp(suffix: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithSuffixAndTimestamp(suffix);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithSuffixAndRandomSuffix(suffix: string, randomSuffixLength: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 2 + randomSuffixLength);
  return `${generateId()}-${suffix}-${randomSuffix}`;
}
export function generateUniqueIdWithSuffixAndRandomSuffix(suffix: string, randomSuffixLength: number, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithSuffixAndRandomSuffix(suffix, randomSuffixLength);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithSuffixAndCustomFormat(suffix: string, format: string): string {
  const randomPart = generateId();
  return `${generateId()}-${suffix}-${format.replace('{id}', randomPart)}`;
}
export function generateUniqueIdWithSuffixAndCustomFormat(suffix: string, format: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithSuffixAndCustomFormat(suffix, format);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixSuffixAndTimestamp(prefix: string, suffix: string): string {
  return `${prefix}-${generateId()}-${suffix}-${Date.now()}`;
}
export function generateUniqueIdWithPrefixSuffixAndTimestamp(prefix: string, suffix: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixSuffixAndTimestamp(prefix, suffix);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixSuffixAndRandomSuffix(prefix: string, suffix: string, randomSuffixLength: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 2 + randomSuffixLength);
  return `${prefix}-${generateId()}-${suffix}-${randomSuffix}`;
}
export function generateUniqueIdWithPrefixSuffixAndRandomSuffix(prefix: string, suffix: string, randomSuffixLength: number, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixSuffixAndRandomSuffix(prefix, suffix, randomSuffixLength);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixSuffixAndCustomFormat(prefix: string, suffix: string, format: string): string {
  const randomPart = generateId();
  return `${prefix}-${generateId()}-${suffix}-${format.replace('{id}', randomPart)}`;
}
export function generateUniqueIdWithPrefixSuffixAndCustomFormat(prefix: string, suffix: string, format: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixSuffixAndCustomFormat(prefix, suffix, format);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixSuffixAndTimestampAndRandomSuffix(prefix: string, suffix: string, randomSuffixLength: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 2 + randomSuffixLength);
  return `${prefix}-${generateId()}-${suffix}-${Date.now()}-${randomSuffix}`;
}
export function generateUniqueIdWithPrefixSuffixAndTimestampAndRandomSuffix(prefix: string, suffix: string, randomSuffixLength: number, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixSuffixAndTimestampAndRandomSuffix(prefix, suffix, randomSuffixLength);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixSuffixAndCustomFormatAndTimestamp(prefix: string, suffix: string, format: string): string {
  const randomPart = generateId();
  return `${prefix}-${generateId()}-${suffix}-${format.replace('{id}', randomPart)}-${Date.now()}`;
}
export function generateUniqueIdWithPrefixSuffixAndCustomFormatAndTimestamp(prefix: string, suffix: string, format: string, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixSuffixAndCustomFormatAndTimestamp(prefix, suffix, format);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
export function generateIdWithPrefixSuffixAndCustomFormatAndRandomSuffix(prefix: string, suffix: string, format: string, randomSuffixLength: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 2 + randomSuffixLength);
  return `${prefix}-${generateId()}-${suffix}-${format.replace('{id}', randomSuffix)}`;
}
export function generateUniqueIdWithPrefixSuffixAndCustomFormatAndRandomSuffix(prefix: string, suffix: string, format: string, randomSuffixLength: number, existingIds: Set<string>): string {
  let id;
  do {
    id = generateIdWithPrefixSuffixAndCustomFormatAndRandomSuffix(prefix, suffix, format, randomSuffixLength);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}
