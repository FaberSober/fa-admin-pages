import { expect, it } from 'vitest';
import dayjs from 'dayjs';
import { historyFilters } from './flowHistoryFilters';
it('retains historical trigger zero and formats inclusive local time boundaries', () => {
  expect(historyFilters({ logId: 25, status: 9, triggerSource: 0, range: [dayjs('2026-11-01T00:00:00'), dayjs('2026-11-09T23:59:59')] })).toEqual({ logId: 25, status: 9, triggerSource: 0, beginTimeFrom: '2026-11-01 00:00:00', beginTimeTo: '2026-11-09 23:59:59' });
});
it('clears date and ID constraints when reset', () => {
  expect(historyFilters({ logId: null, range: null })).toEqual({ logId: undefined, status: undefined, triggerSource: undefined, beginTimeFrom: undefined, beginTimeTo: undefined });
});
