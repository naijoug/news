import assert from 'node:assert/strict';
import test from 'node:test';
import { compareEditionsDesc } from './edition-order.mjs';

test('evening sorts ahead of morning on the same date', () => {
  const rows = [
    { date: '2026-10-27', edition: 'morning' },
    { date: '2026-10-28', edition: 'morning' },
    { date: '2026-10-27', edition: 'evening' },
  ];
  rows.sort(compareEditionsDesc);
  assert.deepEqual(
    rows.map((row) => `${row.date}-${row.edition}`),
    ['2026-10-28-morning', '2026-10-27-evening', '2026-10-27-morning'],
  );
});
