export function searchTraceRows(rows, keyword) {
  const q = String(keyword || '').trim().toLowerCase();
  if (!q) return [];

  return (rows || []).filter((row) => {
    const finishedLot = String(row.finishedLot || row.finishedlot || '').toLowerCase();
    const lotNo = String(row.lotNo || row.lotno || '').toLowerCase();
    return finishedLot.includes(q) || lotNo.includes(q);
  });
}
