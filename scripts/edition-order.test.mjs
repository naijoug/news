import assert from 'node:assert/strict';
import test from 'node:test';
import { compareDaysDesc } from './edition-order.mjs';

test('newer dates sort first', () => {
  const rows = [{ date: '2026-10-26' }, { date: '2026-10-28' }, { date: '2026-10-27' }];
  rows.sort(compareDaysDesc);
  assert.deepEqual(
    rows.map((row) => row.date),
    ['2026-10-28', '2026-10-27', '2026-10-26'],
  );
});
