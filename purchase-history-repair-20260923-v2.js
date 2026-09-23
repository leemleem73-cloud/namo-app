'use strict';

const { Pool } = require('pg');
require('dotenv').config();

/*
 * NAMO QMES - legacy purchase history -> new purchase order repair V2 (2026-09-23)
 * Ensures all 18 rows from the old 구매조회 screen exist in purchase_orders.
 * The 2026 rows below are aligned to the latest 구매현황 report supplied by the user.
 * Safe to run on every server start:
 * - creates missing rows
 * - updates only SYSTEM-created legacy import rows
 * - never overwrites a user-created purchase order with the same purchase_no
 */

const PURCHASE_HISTORY_REPAIR = [
  ['2026-06-25-1','2026-06-25','금호석유화학(주)','SBS(KTR-201) [KG]',50,30700,1535000,'내부창고(충주)','2026/06/25 -1'],
  ['2026-06-08-2','2026-06-08','LG화학','ADC30G(SBR) [KG]',300,11237,3371100,'내부창고(충주)','2026/06/08 -2'],
  ['2026-06-08-1','2026-06-08','한국 사이언스코(주)','Solef5140 [KG]',20,36649,732980,'내부창고(충주)','2026/06/08 -1'],
  ['2026-05-15-1','2026-05-15','한국 사이언스코(주)','Solef5140 [KG]',20,36649,732980,'내부창고(충주)','2026/05/15 -1'],
  ['2026-04-28-1','2026-04-28','금호석유화학(주)','SBS(KTR-201) [KG]',50,29522,1476100,'내부창고(충주)','2026/04/28 -1'],
  ['2026-04-14-1','2026-04-14','한국 사이언스코(주)','Solef5130(PVdF)',40,36448,1457920,'내부창고(충주)','2026/04/14 -1'],
  ['2026-03-30-1','2026-03-30','LG Chemical','ADC30G(SBR) [KG]',300,11237,3371100,'내부창고(충주)','2026/03/30 -1'],
  ['2026-01-26-1','2026-01-26','강신산업(주)','AOH30(Boehmite) [KG]',300,9700,2910000,'내부창고(충주)','2026/01/26 -1'],
  ['2026-01-23-1','2026-01-23','모리토루 케미칼즈 한국 주식회사','NMP(SNET) [KG]',2000,0,6350561,'내부창고(충주)','2026/01/23 -1'],
  ['2026-01-13-1','2026-01-13','(주)케미웍스','NMP(PUYANG GUANGMING CHEMICAL) [KG]',3000,2950,8850000,'내부창고(충주)','2026/01/13 -1'],
  ['2025-12-03-1','2025-12-03','삼화페인트(주)','스피롤터(a부, b부) [KG]',100,5600,560000,'외부창고(충주)','2025/12/03 -1'],
  ['2025-11-11-1','2025-11-11','강신산업(주)','AOH30(Boehmite) [kg]',100,9700,970000,'외부창고(충주)','2025/11/11 -1'],
  ['2025-11-10-1','2025-11-10','모리토루 케미칼즈 한국 주식회사','NMP(SNET) [kg]',1000,3307,3306737,'외부창고(충주)','2025/11/10 -1'],
  ['2025-10-01-2','2025-10-01','한국 사이언스코(주)','Solef5130(PVdF) [KG]',36,0,0,'내부창고(충주)','2025/10/01 -2'],
  ['2025-10-01-1','2025-10-01','코오롱인더스트리','PAI [KG]',160,0,0,'내부창고(충주)','2025/10/01 -1'],
  ['2025-09-30-1','2025-09-30','모리토루 케미칼즈 한국 주식회사','NMP(SNET) [kg]',1000,2903,2902525,'외부창고(충주)','2025/09/30 -1'],
  ['2025-09-16-2','2025-09-16','LG Chemical','ADC30G(sbr) [kg]',400,12507,5002800,'외부창고(충주)','2025/09/16 -2'],
  ['2025-09-12-1','2025-09-12','유니소재(주)','BYK180(Dispersant) [KG]',25,36520,913000,'외부창고(충주)','2025/09/12 -1'],
];

let scheduled = false;
let completed = false;

async function tableExists(pool) {
  const result = await pool.query("SELECT to_regclass('public.purchase_orders') AS table_name");
  return Boolean(result.rows?.[0]?.table_name);
}

async function repairPurchaseHistory(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let affected = 0;

    for (const [purchaseNo, orderDate, supplier, item, qty, unitPrice, amount, warehouse, originalNo] of PURCHASE_HISTORY_REPAIR) {
      const note = `기존 ERP 거래내역 · 신규 구매 발주 이관 v5 · 원본번호 ${originalNo}${amount > 0 ? '' : ' · 금액 미입력'}`;
      const result = await client.query(
        `INSERT INTO purchase_orders (
           purchase_no, purchase_type, production_type, supplier, item, qty, unit, unit_price, amount,
           order_date, requested_due_date, warehouse, delivery_address, payment_terms,
           approval_status, receipt_status, received_qty, iqc_required, iqc_status,
           coa_required, msds_required, lot_required, status, notes, created_by, updated_by
         )
         VALUES ($1, 'ERP 이관', 'D-양산', $2, $3, $4, 'kg', $5, $6,
                 $7, NULL, $8, '', '부가세율 적용',
                 '승인완료', '입고완료', $4, FALSE, '기존 ERP 반영',
                 FALSE, FALSE, FALSE, '입고완료', $9, 'SYSTEM', 'SYSTEM')
         ON CONFLICT (purchase_no)
         DO UPDATE SET
           supplier = EXCLUDED.supplier,
           item = EXCLUDED.item,
           qty = EXCLUDED.qty,
           unit = EXCLUDED.unit,
           unit_price = EXCLUDED.unit_price,
           amount = EXCLUDED.amount,
           order_date = EXCLUDED.order_date,
           warehouse = EXCLUDED.warehouse,
           payment_terms = EXCLUDED.payment_terms,
           approval_status = EXCLUDED.approval_status,
           receipt_status = EXCLUDED.receipt_status,
           received_qty = EXCLUDED.received_qty,
           iqc_required = EXCLUDED.iqc_required,
           iqc_status = EXCLUDED.iqc_status,
           coa_required = EXCLUDED.coa_required,
           msds_required = EXCLUDED.msds_required,
           lot_required = EXCLUDED.lot_required,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           updated_by = 'SYSTEM',
           updated_at = NOW()
         WHERE purchase_orders.created_by = 'SYSTEM'
           AND (purchase_orders.notes LIKE '기존 ERP 거래내역%' OR purchase_orders.notes LIKE '%신규 구매 발주 이관%')
         RETURNING purchase_no`,
        [purchaseNo, supplier, item, qty, unitPrice, amount, orderDate, warehouse, note]
      );
      affected += result.rowCount || 0;
    }

    const all = await client.query('SELECT * FROM purchase_orders ORDER BY order_date DESC, created_at DESC');
    const rows = all.rows.map(row => ({
      id: row.purchase_no,
      purchaseNo: row.purchase_no,
      no: row.purchase_no,
      purchaseType: row.purchase_type,
      productionType: row.production_type,
      supplier: row.supplier,
      vendor: row.supplier,
      item: row.item,
      material: row.item,
      qty: Number(row.qty || 0),
      quantity: Number(row.qty || 0),
      unit: row.unit || 'kg',
      unitPrice: Number(row.unit_price || 0),
      amount: Number(row.amount || 0),
      orderDate: row.order_date,
      date: row.order_date,
      requestedDueDate: row.requested_due_date,
      due: row.requested_due_date,
      expected: row.confirmed_due_date,
      warehouse: row.warehouse,
      deliveryAddress: row.delivery_address,
      paymentTerms: row.payment_terms,
      approvalStatus: row.approval_status,
      receiptStatus: row.receipt_status,
      receivedQty: Number(row.received_qty || 0),
      received: Number(row.received_qty || 0),
      receiptDate: row.receipt_date,
      materialLot: row.material_lot,
      iqcRequired: Boolean(row.iqc_required),
      iqcStatus: row.iqc_status,
      coaRequired: Boolean(row.coa_required),
      msdsRequired: Boolean(row.msds_required),
      lotRequired: Boolean(row.lot_required),
      status: row.status,
      requester: row.requester,
      notes: row.notes,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    await client.query(
      `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
       VALUES ('inventory', 'erp:purchase', $1::jsonb, 'SYSTEM', NOW())
       ON CONFLICT (record_type, record_key)
       DO UPDATE SET payload = EXCLUDED.payload, updated_by = 'SYSTEM', updated_at = NOW()`,
      [JSON.stringify({ module:'erp', kind:'purchase', schema:3, rows, updatedAt:new Date().toISOString(), updatedBy:'SYSTEM' })]
    );

    await client.query(
      `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
       VALUES ('purchase', 'repair:purchase-history-v5', $1::jsonb, 'SYSTEM', NOW())
       ON CONFLICT (record_type, record_key)
       DO UPDATE SET payload = EXCLUDED.payload, updated_by = 'SYSTEM', updated_at = NOW()`,
      [JSON.stringify({version:5,count:PURCHASE_HISTORY_REPAIR.length,affected})]
    );

    await client.query('COMMIT');
    console.log(`[purchase-history-repair-v2] ensured ${PURCHASE_HISTORY_REPAIR.length} historical purchase orders (${affected} inserted/updated)`);
    return { count: PURCHASE_HISTORY_REPAIR.length, affected };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function schedulePurchaseHistoryRepair(pool) {
  if (scheduled || completed || !pool || typeof pool.query !== 'function') return;
  scheduled = true;
  let attempts = 0;

  const run = async () => {
    attempts += 1;
    try {
      if (!(await tableExists(pool))) {
        if (attempts < 30) return setTimeout(run, 2000);
        console.warn('[purchase-history-repair-v2] purchase_orders table was not ready; repair skipped');
        scheduled = false;
        return;
      }
      await repairPurchaseHistory(pool);
      completed = true;
      scheduled = false;
    } catch (error) {
      const message = String(error?.message || '');
      const code = String(error?.code || '');
      const retryable = /does not exist|relation|qmes_sync_records|deadlock detected|could not serialize access/i.test(message)
        || code === '40P01'
        || code === '40001';
      if (attempts < 30 && retryable) {
        const delay = Math.min(10000, 1500 + attempts * 750);
        console.warn('[purchase-history-repair-v2] retry', attempts, 'in', delay, 'ms:', message || code);
        return setTimeout(run, delay);
      }
      scheduled = false;
      console.error('[purchase-history-repair-v2] failed', error);
    }
  };

  setTimeout(run, 1200);
}

/* This module is preloaded by server.js and retries transient DB lock conflicts after startup. */
if (process.env.DATABASE_URL) {
  const startupPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
  });
  schedulePurchaseHistoryRepair(startupPool);
}

module.exports = { schedulePurchaseHistoryRepair, repairPurchaseHistory, PURCHASE_HISTORY_REPAIR };
