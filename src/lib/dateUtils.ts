// src/lib/dateUtils.ts

// Return the next occurrence (this year or next) of a YYYY-MM-DD string
export function nextEventDate(ymd: string, today: Date): Date {
  const [, m, d] = ymd.split("-").map(Number); // Ignore stored year for recurring events
  const thisYear = today.getFullYear();
  const nextEvent = new Date(thisYear, m - 1, d);

  if (
    nextEvent < today &&
    (nextEvent.getMonth() < today.getMonth() ||
      (nextEvent.getMonth() === today.getMonth() && nextEvent.getDate() < today.getDate()))
  ) {
    return new Date(thisYear + 1, m - 1, d);
  }
  return nextEvent;
}

export function diffInDays(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((end.getTime() - start.getTime()) / oneDay);
}
