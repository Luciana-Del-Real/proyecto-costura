import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  getCoursePrice,
  getCurrencyCode,
  sumByCurrency,
} from './currency';

describe('getCoursePrice', () => {
  it('returns 0 when there is no course', () => {
    expect(getCoursePrice(null, { country: 'ARS' })).toBe(0);
    expect(getCoursePrice(undefined, undefined)).toBe(0);
  });

  it('defaults to ARS price for ARS users and visitors', () => {
    const course = { priceARS: 100, priceAUD: 200 };
    expect(getCoursePrice(course, { country: 'ARS' })).toBe(100);
    expect(getCoursePrice(course, null)).toBe(100);
  });

  it('returns the AUD price for AUD users', () => {
    const course = { priceARS: 100, priceAUD: 200 };
    expect(getCoursePrice(course, { country: 'AUD' })).toBe(200);
  });
});

describe('getCurrencyCode', () => {
  it('returns AUD only for AUD users, ARS otherwise', () => {
    expect(getCurrencyCode({ country: 'AUD' })).toBe('AUD');
    expect(getCurrencyCode({ country: 'ARS' })).toBe('ARS');
    expect(getCurrencyCode(null)).toBe('ARS');
  });
});

describe('sumByCurrency', () => {
  it('returns zero totals for an empty list', () => {
    expect(sumByCurrency([])).toEqual({ ARS: 0, AUD: 0 });
    expect(sumByCurrency(undefined)).toEqual({ ARS: 0, AUD: 0 });
  });

  it('sums purchases by user currency', () => {
    const purchases = [
      { total: 100, user: { country: 'ARS' } },
      { total: 50, user: { country: 'AUD' } },
      { total: 25, user: { country: 'ARS' } },
    ];
    expect(sumByCurrency(purchases)).toEqual({ ARS: 125, AUD: 50 });
  });
});

describe('formatMoney', () => {
  it('prefixes the amount with $ and appends the currency code', () => {
    expect(formatMoney(14000, 'ARS')).toMatch(/^\$[\d.,\s]+ ARS$/);
    expect(formatMoney(200, 'AUD')).toMatch(/^\$[\d.,\s]+ AUD$/);
  });

  it('defaults to ARS and tolerates missing amounts', () => {
    expect(formatMoney(undefined)).toBe('$0 ARS');
  });
});
