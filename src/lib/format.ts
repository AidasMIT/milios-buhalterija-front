const currency = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' });
const longDate = new Intl.DateTimeFormat('lt-LT', { year: 'numeric', month: 'long', day: 'numeric' });

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

/** API dates are calendar dates ("2026-03-15"); parse them as local dates so no time zone can shift the day. */
export function parseDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value: string): string {
  return longDate.format(parseDate(value));
}

/** yyyy-MM-dd as shown on invoices. */
export function formatDateShort(value: string): string {
  return value.slice(0, 10);
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Same rounding as the server (half away from zero, to cents), so the form preview matches the saved total. */
export function roundMoney(amount: number): number {
  return Math.sign(amount) * Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
}
