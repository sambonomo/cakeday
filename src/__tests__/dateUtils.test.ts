// src/__tests__/dateUtils.test.ts

import { diffInDays } from "../lib/dateUtils";

describe("diffInDays", () => {
  it("returns 0 for same date", () => {
    const d1 = new Date("2025-01-01");
    const d2 = new Date("2025-01-01");
    expect(diffInDays(d1, d2)).toBe(0);
  });

  it("returns 1 for a difference of 1 day", () => {
    const d1 = new Date("2025-01-01");
    const d2 = new Date("2025-01-02");
    expect(diffInDays(d1, d2)).toBe(1);
  });

  it("returns negative for past dates", () => {
    const d1 = new Date("2025-01-01");
    const d2 = new Date("2024-12-30");
    expect(diffInDays(d1, d2)).toBe(-2);
  });
});
