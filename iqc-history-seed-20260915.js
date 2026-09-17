'use strict';

// Idempotent migration of the 2026 incoming-inspection ledger into the shared
// QMES IQC store. Existing inspection results are preserved. For historical
// imported rows only, a missing purchase-order link may be backfilled.
try { require('dotenv').config(); } catch (_error) {}

const { Pool } = require('pg');

const connectionString = String(process.env.DATABASE_URL || '').trim();
if (!connectionString) {
  console.warn('[QMES IQC] Historical import skipped: DATABASE_URL is missing.');
} else {
  const sourceRows = [
    { inNo:'IQC-260112-9001', recv:'2026-01-12', name:'바인더 (PAI)', supplier:'코오롱', qty:124, lot:'PAI#27-2(2)', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'' },
    { inNo:'IQC-260113-9001', recv:'2026-01-13', name:'NMP', supplier:'푸양광명화학', qty:3000, lot:'20251031063', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-01-13-1' },
    { inNo:'IQC-260123-9001', recv:'2026-01-23', name:'NMP', supplier:'모리로쿠케미칼즈', qty:2000, lot:'2026011101', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-01-23-1' },
    { inNo:'IQC-260202-9001', recv:'2026-02-02', name:'Boehmite (AOH30)', supplier:'강신산업', qty:300, lot:'006-8-25', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-01-26-1' },
    { inNo:'IQC-260330-9001', recv:'2026-03-30', name:'SBR (ADC30-G)', supplier:'LG화학', qty:300, lot:'C3026A29A(1)', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-03-30-1' },
    { inNo:'IQC-260413-9001', recv:'2026-04-13', name:'PVdF (Solef5130)', supplier:'SOLVAY', qty:40, lot:'CSE23129DA', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'제품상이', purchaseOrderNo:'2026-04-14-1' },
    { inNo:'IQC-260514-9001', recv:'2026-05-14', name:'PVdF (Solef5140)', supplier:'SOLVAY', qty:20, lot:'CSE23202TA', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-05-15-1' },
    { inNo:'IQC-260608-9001', recv:'2026-06-08', name:'SBR (ADC30-G)', supplier:'LG화학', qty:300, lot:'C3026B26A(1)', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-06-08-2' },
    { inNo:'IQC-260609-9001', recv:'2026-06-09', name:'PVdF (Solef5140)', supplier:'SOLVAY', qty:20, lot:'CSE23202TA', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-06-08-1' },
    { inNo:'IQC-260627-9001', recv:'2026-06-27', name:'SBS (KTR201)', supplier:'금호석유화학', qty:50, lot:'W251016', packaging:'이상없음', appearance:'이상없음', legacyJudge:'OK', remarks:'', purchaseOrderNo:'2026-06-25-1' }
  ];

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized:false },
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });

  const normalize = (value) => String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
  const fingerprint = (row) => [
    normalize(row.recv || row.date),
    normalize(row.lot),
    normalize(row.supplier),
    normalize(row.name || row.item)
  ].join('|').toLowerCase();

  const makeRow = (source) => ({
    inNo: source.inNo,
    purchaseOrderNo: source.purchaseOrderNo || '',
    purchaseOrder: source.purchaseOrderNo || '',
    purchaseLinkStatus: source.purchaseOrderNo ? '구매발주연계' : '과거자료이관',
    recv: source.recv,
    inspectedAt: source.recv,
    lot: source.lot,
    code: '-',
    name: source.name,
    supplier: source.supplier,
    qty: `${source.qty} kg`,
    inspectQty: '',
    defectQty: '0 EA',
    packagingType: '',
    packagingTypeOther: '',
    packageQty: '',
    unitWeight: '',
    calculatedWeight: '',
    barcodeQty: '',
    visual: '합격',
    label: '합격',
    weight: '합격',
    coa: '합격',
    remarks: source.remarks || '',
    judge: '합격',
    note: source.purchaseOrderNo ? `구매발주 ${source.purchaseOrderNo} 연계` : '',
    inspector: '박현아',
    by: '박현아',
    source: '수입검사 관리대장_26.06.27(완료)(2).xlsx / 26년',
    legacyPackagingCondition: source.packaging,
    legacyAppearance: source.appearance,
    legacyJudge: source.legacyJudge,
    historicalImport: true,
  });

  (async () => {
    let client;
    try {
      client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS qmes_sync_records (
          record_type TEXT NOT NULL,
          record_key TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_by TEXT DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (record_type, record_key)
        )
      `);

      const existingResult = await client.query(
        `SELECT record_key, payload FROM qmes_sync_records WHERE record_type = 'iqc'`
      );
      const existingByFingerprint = new Map();
      for (const record of existingResult.rows || []) {
        const payload = record && record.payload && typeof record.payload === 'object' ? record.payload : {};
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        rows.forEach((row, index) => {
          existingByFingerprint.set(fingerprint(row), { recordKey:record.record_key, payload, rows, row, index });
        });
      }

      let inserted = 0;
      let skipped = 0;
      let linked = 0;
      let linkConflicts = 0;

      for (const source of sourceRows) {
        const row = makeRow(source);
        const fp = fingerprint(row);
        const existing = existingByFingerprint.get(fp);

        if (existing) {
          const wanted = normalize(source.purchaseOrderNo);
          const current = normalize(existing.row.purchaseOrderNo || existing.row.purchaseNo || existing.row.purchaseOrder);
          const mayBackfill = Boolean(wanted) && (!current || current === wanted) && existing.row.historicalImport === true;

          if (mayBackfill) {
            const updatedRow = {
              ...existing.row,
              purchaseOrderNo: wanted,
              purchaseOrder: wanted,
              purchaseLinkStatus: '구매발주연계',
              note: normalize(existing.row.note) || `구매발주 ${wanted} 연계`,
            };
            const updatedRows = existing.rows.slice();
            updatedRows[existing.index] = updatedRow;
            const updatedPayload = {
              ...existing.payload,
              rows: updatedRows,
              purchaseHistoryLinkedAt: new Date().toISOString(),
            };
            await client.query(
              `UPDATE qmes_sync_records
                  SET payload = $1::jsonb, updated_by = 'SYSTEM-IQC-LINK', updated_at = NOW()
                WHERE record_type = 'iqc' AND record_key = $2`,
              [JSON.stringify(updatedPayload), existing.recordKey]
            );
            linked += 1;
          } else if (wanted && current && current !== wanted) {
            linkConflicts += 1;
          }
          skipped += 1;
          continue;
        }

        const payload = {
          mode: 'IQC',
          lotNo: row.lot,
          rows: [row],
          lotRecord: null,
          holds: [],
          savedAt: new Date().toISOString(),
          savedBy: '박현아',
          migrationSource: row.source,
        };

        const result = await client.query(
          `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
           VALUES ('iqc', $1, $2::jsonb, $3, NOW())
           ON CONFLICT (record_type, record_key) DO NOTHING`,
          [row.inNo, JSON.stringify(payload), '박현아']
        );
        if (result.rowCount > 0) {
          inserted += 1;
          if (source.purchaseOrderNo) linked += 1;
          existingByFingerprint.set(fp, { recordKey:row.inNo, payload, rows:[row], row, index:0 });
        } else {
          skipped += 1;
        }
      }

      console.log(`[QMES IQC] 2026 historical import/link complete: inserted=${inserted}, skipped=${skipped}, linked=${linked}, conflicts=${linkConflicts}, inspector=박현아`);
    } catch (error) {
      console.error('[QMES IQC] 2026 historical import failed:', error && error.message ? error.message : error);
    } finally {
      if (client) client.release();
      await pool.end().catch(() => {});
    }
  })();
}

// Run the purchase-history migration from the same startup preload that server.js already loads.
// The purchase migration is idempotent and only updates SYSTEM-created legacy rows.
require('./purchase-history-repair-20260915.js');
