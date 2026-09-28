'use strict';

const { Pool } = require('pg');
require('dotenv').config();

/*
 * NAMO QMES - Purchase order date alignment V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Rule: for purchase_no in YYYY-MM-DD-N form, order_date must equal YYYY-MM-DD.
 */

let scheduled = false;
let completed = false;

function validPurchaseNoDate(purchaseNo) {
  const m = String(purchaseNo || '').trim().match(/^(20\d{2}-\d{2}-\d{2})-\d+$/);
  return m ? m[1] : '';
}

async function tablesReady(pool) {
  const r = await pool.query("SELECT to_regclass('public.purchase_orders') AS purchase_orders, to_regclass('public.qmes_sync_records') AS qmes_sync_records");
  return Boolean(r.rows?.[0]?.purchase_orders && r.rows?.[0]?.qmes_sync_records);
}

function mapRow(row) {
  const date = value => {
    if (!value) return '';
    const s = String(value);
    return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
  };
  return {
    id: row.purchase_no,
    uuid: row.id,
    purchaseNo: row.purchase_no,
    no: row.purchase_no,
    purchaseType: row.purchase_type,
    productionType: row.production_type,
    supplier: row.supplier,
    supplierGrade: row.supplier_grade,
    grade: row.supplier_grade,
    item: row.item,
    material: row.item,
    itemCode: row.item_code,
    spec: row.spec || row.item_code || '',
    qty: Number(row.qty || 0),
    unit: row.unit || 'kg',
    unitPrice: Number(row.unit_price || 0),
    price: Number(row.unit_price || 0),
    amount: Number(row.amount || 0),
    orderDate: date(row.order_date),
    requestedDueDate: date(row.requested_due_date),
    due: date(row.requested_due_date),
    confirmedDueDate: date(row.confirmed_due_date),
    expected: date(row.confirmed_due_date),
    priority: row.priority,
    mrpNo: row.mrp_no,
    mrp: row.mrp_no,
    workOrderNo: row.work_order_no,
    purpose: row.purpose,
    warehouse: row.warehouse,
    deliveryAddress: row.delivery_address,
    paymentTerms: row.payment_terms,
    terms: row.payment_terms,
    approvalStatus: row.approval_status,
    approval: row.approval_status,
    receiptStatus: row.receipt_status,
    receiving: row.receipt_status,
    receivedQty: Number(row.received_qty || 0),
    received: Number(row.received_qty || 0),
    receiptDate: date(row.receipt_date),
    materialLot: row.material_lot,
    lot: row.material_lot,
    iqcRequired: Boolean(row.iqc_required),
    iqcStatus: row.iqc_status,
    iqc: row.iqc_status,
    coaRequired: Boolean(row.coa_required),
    msdsRequired: Boolean(row.msds_required),
    lotRequired: Boolean(row.lot_required),
    status: row.status,
    requester: row.requester,
    owner: row.requester,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function alignPurchaseOrderDates(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const current = await client.query(
      "SELECT id, purchase_no, order_date FROM purchase_orders WHERE purchase_no ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]+$'"
    );

    let affected = 0;
    for (const row of current.rows) {
      const expected = validPurchaseNoDate(row.purchase_no);
      const actual = row.order_date ? String(row.order_date).slice(0, 10) : '';
      if (!expected || actual === expected) continue;
      const result = await client.query(
        'UPDATE purchase_orders SET order_date = $1::date, updated_at = NOW() WHERE id = $2',
        [expected, row.id]
      );
      affected += result.rowCount || 0;
    }

    const all = await client.query('SELECT * FROM purchase_orders ORDER BY order_date DESC, created_at DESC');
    const rows = all.rows.map(mapRow);

    await client.query(
      "INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at) VALUES ('inventory', 'erp:purchase', $1::jsonb, 'SYSTEM', NOW()) ON CONFLICT (record_type, record_key) DO UPDATE SET payload = EXCLUDED.payload, updated_by = 'SYSTEM', updated_at = NOW()",
      [JSON.stringify({
        module: 'erp',
        kind: 'purchase',
        schema: 3,
        rows,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM'
      })]
    );

    await client.query('COMMIT');
    console.log('[purchase-order-date-align-v1] aligned order_date with purchase_no:', affected);
    return affected;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function schedulePurchaseOrderDateAlign(pool) {
  if (scheduled || completed || !pool || typeof pool.query !== 'function') return;
  scheduled = true;
  let attempts = 0;

  const run = async () => {
    attempts += 1;
    try {
      if (!(await tablesReady(pool))) {
        if (attempts < 30) return setTimeout(run, 2000);
        scheduled = false;
        return;
      }
      await alignPurchaseOrderDates(pool);
      completed = true;
      scheduled = false;
    } catch (error) {
      const msg = String(error?.message || '');
      const code = String(error?.code || '');
      const retryable = /does not exist|relation|deadlock|serialize|ECONNREFUSED/i.test(msg)
        || code === '40P01'
        || code === '40001';
      if (attempts < 30 && retryable) {
        return setTimeout(run, Math.min(10000, 1500 + attempts * 750));
      }
      scheduled = false;
      console.error('[purchase-order-date-align-v1] failed', error);
    }
  };

  setTimeout(run, 1500);
}

if (process.env.DATABASE_URL) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2
  });
  schedulePurchaseOrderDateAlign(pool);
}

module.exports = { alignPurchaseOrderDates, schedulePurchaseOrderDateAlign };
