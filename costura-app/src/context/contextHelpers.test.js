import { describe, expect, it } from 'vitest';
import { derivePurchaseState } from './contextHelpers';

describe('derivePurchaseState', () => {
  it('derives approved and pending course ids from raw records', () => {
    const records = [
      { id: 'p1', status: 'APPROVED', course: { id: 'c1' } },
      { id: 'p2', status: 'PENDING', course: { id: 'c2' } },
      { id: 'p3', status: 'REJECTED', course: { id: 'c3' } },
    ];
    expect(derivePurchaseState(records)).toEqual({ approved: ['c1'], pending: ['c2'] });
  });

  it('returns empty lists for missing or empty data', () => {
    expect(derivePurchaseState([])).toEqual({ approved: [], pending: [] });
    expect(derivePurchaseState(undefined)).toEqual({ approved: [], pending: [] });
    expect(derivePurchaseState(null)).toEqual({ approved: [], pending: [] });
  });

  it('skips records without a course', () => {
    const records = [{ id: 'p1', status: 'APPROVED' }];
    expect(derivePurchaseState(records)).toEqual({ approved: [], pending: [] });
  });
});