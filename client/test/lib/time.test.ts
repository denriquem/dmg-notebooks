import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { relTime } from "../../src/lib/time";

const NOW = new Date("2026-06-15T12:00:00.000Z");
const agoBy = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["0 seconds", 0, "JUST NOW"],
    ["44 seconds — the last second before minutes kick in", 44 * SECOND, "JUST NOW"],
    ["45 seconds", 45 * SECOND, "0 MINUTES AGO"],
    ["1 minute, singular", 1 * MINUTE, "1 MINUTE AGO"],
    ["2 minutes, plural", 2 * MINUTE, "2 MINUTES AGO"],
    ["59 minutes", 59 * MINUTE, "59 MINUTES AGO"],
    ["1 hour, singular", 1 * HOUR, "1 HOUR AGO"],
    ["23 hours", 23 * HOUR, "23 HOURS AGO"],
    ["1 day", 1 * DAY, "YESTERDAY"],
    ["2 days", 2 * DAY, "2 DAYS AGO"],
    ["6 days — the last relative day", 6 * DAY, "6 DAYS AGO"],
  ])("renders %s as %s", (_label, offset, expected) => {
    expect(relTime(agoBy(offset))).toBe(expected);
  });

  it("switches to an absolute date at 7 days", () => {
    expect(relTime(agoBy(7 * DAY))).toBe("JUN 8");
  });

  it("uppercases the absolute date", () => {
    const result = relTime(agoBy(60 * DAY));
    expect(result).toBe(result.toUpperCase());
  });

  it("returns a placeholder for an unparseable timestamp", () => {
    expect(relTime("not-a-date")).toBe("—");
    expect(relTime("")).toBe("—");
  });

  it("does not report future timestamps as minutes in the future", () => {
    // A slightly-ahead server clock is common; it should read as 'just now'.
    expect(relTime(new Date(NOW.getTime() + 5 * SECOND).toISOString())).toBe("JUST NOW");
  });
});
