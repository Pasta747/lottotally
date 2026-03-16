export type MonitorInterval = "ONE_MINUTE" | "FIVE_MINUTES" | "FIFTEEN_MINUTES";
export type MonitorStatus = "UP" | "DEGRADED" | "DOWN";

export function intervalToMs(interval: MonitorInterval): number {
  if (interval === "ONE_MINUTE") return 60_000;
  if (interval === "FIVE_MINUTES") return 300_000;
  return 900_000;
}

export function shouldRunMonitor(interval: MonitorInterval, lastCheckedAt?: Date | null, now = Date.now()): boolean {
  if (!lastCheckedAt) return true;
  const diff = now - new Date(lastCheckedAt).getTime();
  return diff >= intervalToMs(interval);
}

export function statusFromConsecutiveFails(consecutiveFails: number): MonitorStatus {
  if (consecutiveFails <= 0) return "UP";
  if (consecutiveFails === 1) return "DEGRADED";
  return "DOWN";
}
