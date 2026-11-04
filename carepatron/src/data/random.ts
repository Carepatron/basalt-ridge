// Seeded randomness, so the demo practice is the same every time.

/** A 53-bit hash of a string (cyrb53). */
export function hash(text: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** An id that depends only on what it names: `stableId('cl', 'ava')` is always the same. */
export function stableId(prefix: string, key: string): string {
  return `${prefix}_${hash(`${prefix}:${key}`).toString(36).padStart(11, '0').slice(-8)}`;
}

export type Random = ReturnType<typeof random>;

/** A random number generator (mulberry32) seeded by a key. */
export function random(key: string) {
  let state = hash(key) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    chance: (probability: number) => next() < probability,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    digits: (count: number) => Array.from({ length: count }, () => int(0, 9)).join(''),
  };
}
