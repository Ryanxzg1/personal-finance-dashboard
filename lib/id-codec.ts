// Simple ID Obfuscation (Hash-like)
// Using a basic reversible algorithm to avoid exposing sequential database IDs in URLs.

const SALT = "finance-mapping-secret-2026";
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function encodeId(id: number): string {
  // Simple encoding logic:
  // 1. Add a large constant
  // 2. Convert to Base62
  let num = id + 100000;
  let res = "";
  while (num > 0) {
    res = ALPHABET[num % 62] + res;
    num = Math.floor(num / 62);
  }
  return res;
}

export function decodeId(code: string): number | null {
  let num = 0;
  for (let i = 0; i < code.length; i++) {
    const charIndex = ALPHABET.indexOf(code[i]);
    if (charIndex === -1) return null;
    num = num * 62 + charIndex;
  }
  const id = num - 100000;
  return id > 0 ? id : null;
}
