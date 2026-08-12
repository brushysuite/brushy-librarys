/** Prevents dead-code elimination in microbenchmarks by folding a value into a checksum. */
let globalChecksum = 0;

export function consumeChecksum(value: unknown): number {
  let h = 0x811c9dc5;

  if (value === null || value === undefined) {
    globalChecksum ^= h;
    return h;
  }

  if (typeof value === "number") {
    h = Math.imul(h ^ (Math.floor(value * 1e9) | 0), 0x01000193);
    globalChecksum ^= h;
    return h;
  }

  if (typeof value === "boolean") {
    h ^= value ? 1 : 0;
    globalChecksum ^= h;
    return h;
  }

  if (typeof value === "string") {
    for (let i = 0; i < value.length; i++) {
      h = Math.imul(h ^ value.charCodeAt(i), 0x01000193);
    }
    globalChecksum ^= h;
    return h;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("value" in obj && typeof obj.value === "number") {
      h = Math.imul(h ^ (obj.value as number), 0x01000193);
    }
    if ("id" in obj && typeof obj.id === "number") {
      h = Math.imul(h ^ (Math.floor((obj.id as number) * 1e9) | 0), 0x01000193);
    }
    if ("idx" in obj && typeof obj.idx === "number") {
      h = Math.imul(h ^ (obj.idx as number), 0x01000193);
    }
    globalChecksum ^= h;
    return h;
  }

  globalChecksum ^= 1;
  return 1;
}

export function getGlobalChecksum(): number {
  return globalChecksum;
}

export function resetGlobalChecksum(): void {
  globalChecksum = 0;
}
