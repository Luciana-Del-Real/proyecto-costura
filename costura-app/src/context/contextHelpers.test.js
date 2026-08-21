import { describe, expect, it } from 'vitest';
import {
  derivePurchaseState,
  unreadCountOf,
  applyNotificationRead,
  applyNotificationDelete,
} from './contextHelpers';

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

describe('unreadCountOf', () => {
  it('counts only unread notifications', () => {
    const list = [
      { id: 'n1', read: false },
      { id: 'n2', read: true },
      { id: 'n3', read: false },
    ];
    expect(unreadCountOf(list)).toBe(2);
  });

  it('handles empty or missing lists', () => {
    expect(unreadCountOf([])).toBe(0);
    expect(unreadCountOf(undefined)).toBe(0);
  });
});

describe('applyNotificationRead', () => {
  it('marks only the requested notification as read and keeps the rest untouched', () => {
    const list = [
      { id: 'n1', read: false },
      { id: 'n2', read: false },
    ];
    const next = applyNotificationRead(list, 'n2');
    expect(next[1].read).toBe(true);
    expect(next[0]).toBe(list[0]);
  });

  it('returns the same list shape for unknown ids', () => {
    const list = [{ id: 'n1', read: false }];
    expect(applyNotificationRead(list, 'missing')).toEqual(list);
  });
});

describe('applyNotificationDelete', () => {
  it('removes only the requested notification', () => {
    const list = [
      { id: 'n1', read: false },
      { id: 'n2', read: true },
    ];
    expect(applyNotificationDelete(list, 'n1')).toEqual([{ id: 'n2', read: true }]);
  });

  it('returns the list unchanged for unknown ids', () => {
    const list = [{ id: 'n1', read: false }];
    expect(applyNotificationDelete(list, 'missing')).toEqual(list);
  });
});