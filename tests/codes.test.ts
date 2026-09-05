import { describe, it, expect } from "vitest";
import { generateCode, generateToken } from "../src/lib/codes";

describe("generateCode", () => {
  it("returns 4 uppercase letters without ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateCode();
      expect(c).toMatch(/^[A-Z]{4}$/);
      expect(c).not.toMatch(/[IO]/);
    }
  });
});

describe("generateToken", () => {
  it("returns a long url-safe string that differs each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    expect(a).not.toBe(b);
  });
});
