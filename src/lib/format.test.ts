import { describe, expect, it } from 'vitest';
import { addDaysIso, formatDateShort, parseDate, roundMoney, toIsoDate } from './format';

describe('roundMoney', () => {
  it('rounds half away from zero like the API', () => {
    expect(roundMoney(49.995)).toBe(50);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 * 3)).toBe(0.3);
  });
});

describe('calendar dates', () => {
  it('parses yyyy-MM-dd as a local date without shifting the day', () => {
    const date = parseDate('2026-03-01');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 1]);
  });

  it('adds days across month ends', () => {
    expect(addDaysIso('2026-01-25', 14)).toBe('2026-02-08');
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
    expect(formatDateShort('2026-04-02T00:00:00')).toBe('2026-04-02');
  });
});
