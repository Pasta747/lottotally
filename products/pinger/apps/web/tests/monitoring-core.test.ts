import { describe, expect, it } from "vitest";
import { shouldRunMonitor, statusFromConsecutiveFails } from "../lib/monitoring";

describe("monitoring core helpers", () => {
  it("decides monitor status from consecutive failures", () => {
    expect(statusFromConsecutiveFails(0)).toBe("UP");
    expect(statusFromConsecutiveFails(1)).toBe("DEGRADED");
    expect(statusFromConsecutiveFails(2)).toBe("DOWN");
    expect(statusFromConsecutiveFails(5)).toBe("DOWN");
  });

  it("runs checks based on interval and last check time", () => {
    const now = new Date("2026-03-11T08:00:00.000Z").getTime();

    expect(shouldRunMonitor("ONE_MINUTE", null, now)).toBe(true);
    expect(shouldRunMonitor("ONE_MINUTE", new Date(now - 30_000), now)).toBe(false);
    expect(shouldRunMonitor("ONE_MINUTE", new Date(now - 60_000), now)).toBe(true);

    expect(shouldRunMonitor("FIVE_MINUTES", new Date(now - 120_000), now)).toBe(false);
    expect(shouldRunMonitor("FIVE_MINUTES", new Date(now - 300_000), now)).toBe(true);

    expect(shouldRunMonitor("FIFTEEN_MINUTES", new Date(now - 600_000), now)).toBe(false);
    expect(shouldRunMonitor("FIFTEEN_MINUTES", new Date(now - 900_000), now)).toBe(true);
  });
});
