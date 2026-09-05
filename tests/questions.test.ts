import { describe, it, expect } from "vitest";
import { DEFAULT_QUESTIONS } from "../src/lib/questions";

describe("DEFAULT_QUESTIONS", () => {
  it("has exactly 35 well-formed questions", () => {
    expect(DEFAULT_QUESTIONS).toHaveLength(35);
    for (const q of DEFAULT_QUESTIONS) {
      expect(q.trim()).toBe(q);
      expect(q.endsWith("?")).toBe(true);
      expect(q[0]).toBe(q[0].toUpperCase());
    }
    expect(new Set(DEFAULT_QUESTIONS).size).toBe(35);
  });
});
