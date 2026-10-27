/** Newest date first. On the same date, evening (晚报) before morning (早报). */
export function compareEditionsDesc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.edition !== b.edition) return a.edition === 'evening' ? -1 : 1;
  return 0;
}
