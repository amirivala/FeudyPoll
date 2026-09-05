import { randomBytes, randomInt } from "crypto";

// No I or O to avoid confusion with 1 and 0 when read aloud or written down.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateCode(length = 4): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}
