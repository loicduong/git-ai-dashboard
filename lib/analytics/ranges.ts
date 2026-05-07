export type DashboardRange = "7d" | "30d" | "quarter";

export function parseDashboardRange(value: string | string[] | undefined): DashboardRange {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "7d" || candidate === "30d" || candidate === "quarter") {
    return candidate;
  }

  return "30d";
}

export function getRangeStart(range: DashboardRange, now: Date): Date {
  if (range === "7d") {
    return subtractDays(now, 7);
  }

  if (range === "30d") {
    return subtractDays(now, 30);
  }

  return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1));
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}
