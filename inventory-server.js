'use strict';

// Namo Chemical Q-MES inventory module.
// Preloaded before server.js. It registers PostgreSQL-backed inventory APIs
// before the SPA catch-all so every PC reads the same data.

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const txt = (v) => (v ?? '').toString().trim();
const qty = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const ok = (res, data = null, message = 'OK') => res.json({ success: true, message, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message, data: null });
const requireLogin = (req, res, next) => req.session?.user ? next() : fail(res, 401, '로그인이 필요합니다.');
const requireAdmin = (req, res, next) => req.session?.user?.role === 'admin' ? next() : fail(res, 403, '관리자 권한이 필요합니다.');

const VALID_CATEGORIES = new Set(['RM', 'PM', 'WIP', 'FG']);
const VALID_STATUS = new Set(['AVAILABLE', 'IQC_PENDING', 'OQC_PENDING', 'HOLD', 'NONCONFORM', 'RESERVED']);
const VALID_TYPES = new Set(['RECEIPT', 'ISSUE', 'MOVE', 'ADJUSTMENT', 'PRODUCTION_ISSUE', 'PRODUCTION_RECEIPT', 'SHIPMENT', 'RETURN', 'HOLD', 'RELEASE']);


const PHOTO_RACK_UNASSIGNED = 'UNASSIGNED';
function normalizeInventoryItem(value) {
  return txt(value).toUpperCase().replace(/[\s_()\-+]/g, '');
}
function physicalRackForItem(itemCode, itemName) {
  const value = normalizeInventoryItem(`${itemCode || ''} ${itemName || ''}`);
  if (value.includes('PAI')) return 'A-1-1';
  if (value.includes('SBS') && value.includes('PVDF')) return 'A-1-1';
  if (value.includes('SBS')) return 'A-1-1';
  if (value.includes('SBR')) return 'A-2-1';
  if (value.includes('BYK180')) return 'A-3-2';
  if (value.includes('PVDF') || value.includes('SOLEF5140')) return 'A-3-1';
  if (value.includes('AOH30') || value.includes('BOEHMITE')) return 'A-4-1';
  if (value.includes('NMP')) return 'A-5-1';
  if (value.includes('KTR201')) return 'A-6-1';
  return PHOTO_RACK_UNASSIGNED;
}

async function migrateLegacyRmBalances() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const legacy = await client.query(`
      SELECT b.item_code,b.lot_no,b.location_code AS source_location,
             b.quality_status,b.quantity,
             COALESCE(i.item_name,b.item_code) AS item_name,
             COALESCE(i.unit,'kg') AS unit
      FROM inventory_balances b
      LEFT JOIN inventory_items i ON i.item_code=b.item_code
      WHERE b.location_code IN ('RM','UNASSIGNED') AND b.quantity>0
      FOR UPDATE OF b
    `);
    for (const row of legacy.rows) {
      const targetLocation = physicalRackForItem(row.item_code, row.item_name);
      if (targetLocation === row.source_location) continue;
      const referenceNo = `PHOTO-RACK-MIGRATION-20260820:${row.source_location}:${row.item_code}:${row.lot_no}:${row.quality_status}`;
      await client.query(`
        INSERT INTO inventory_balances
          (item_code,lot_no,location_code,quality_status,quantity,updated_at)
        VALUES ($1,$2,$3,$4,$5,NOW())
        ON CONFLICT (item_code,lot_no,location_code,quality_status)
        DO UPDATE SET
          quantity=inventory_balances.quantity+EXCLUDED.quantity,
          updated_at=NOW()
      `,[row.item_code,row.lot_no,targetLocation,row.quality_status,row.quantity]);
      await client.query(`
        INSERT INTO inventory_transactions
          (transaction_type,item_code,lot_no,quantity,unit,from_location,to_location,
           from_status,to_status,reference_no,reason,remark,operator_id,operator_name)
        VALUES
          ('MOVE',$1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,'SYSTEM','SYSTEM')
      `,[
        row.item_code,row.lot_no,row.quantity,row.unit,row.source_location,targetLocation,
        row.quality_status,referenceNo,'사진 기준 원료 실제 위치 정정',
        targetLocation===PHOTO_RACK_UNASSIGNED
          ? '사진에서 원료 위치가 확인되지 않아 위치확인으로 이전'
          : '창고 사진 표찰과 현황판 기준 실제 랙으로 이전'
      ]);
      await client.query(`
        DELETE FROM inventory_balances
        WHERE item_code=$1 AND lot_no=$2 AND location_code=$3 AND quality_status=$4
      `,[row.item_code,row.lot_no,row.source_location,row.quality_status]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

let schemaPromise = null;
function ensureInventorySchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_code TEXT UNIQUE NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'RM',
      unit TEXT NOT NULL DEFAULT 'kg',
      safety_stock NUMERIC NOT NULL DEFAULT 0,
      expiry_days INTEGER,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      location_code TEXT UNIQUE NOT NULL,
      location_name TEXT NOT NULL,
      location_type TEXT NOT NULL DEFAULT 'STORAGE',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory_lots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_code TEXT NOT NULL,
      lot_no TEXT NOT NULL,
      supplier TEXT DEFAULT '',
      received_at DATE,
      expiry_date DATE,
      reference_no TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (item_code, lot_no)
    );
    CREATE TABLE IF NOT EXISTS inventory_balances (
      item_code TEXT NOT NULL,
      lot_no TEXT NOT NULL,
      location_code TEXT NOT NULL,
      quality_status TEXT NOT NULL,
      quantity NUMERIC NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (item_code, lot_no, location_code, quality_status)
    );
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id BIGSERIAL PRIMARY KEY,
      transaction_type TEXT NOT NULL,
      item_code TEXT NOT NULL,
      lot_no TEXT NOT NULL,
      quantity NUMERIC NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      from_location TEXT DEFAULT '',
      to_location TEXT DEFAULT '',
      from_status TEXT DEFAULT '',
      to_status TEXT DEFAULT '',
      work_order_no TEXT DEFAULT '',
      production_lot TEXT DEFAULT '',
      reference_no TEXT DEFAULT '',
      packaging_type TEXT DEFAULT '',
      packaging_type_other TEXT DEFAULT '',
      package_qty INTEGER,
      unit_weight NUMERIC,
      calculated_weight NUMERIC,
      barcode_qty INTEGER,
      reason TEXT DEFAULT '',
      remark TEXT DEFAULT '',
      operator_id TEXT DEFAULT '',
      operator_name TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory_reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_code TEXT NOT NULL,
      lot_no TEXT DEFAULT '',
      location_code TEXT DEFAULT '',
      work_order_no TEXT NOT NULL,
      quantity NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      reserved_by TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      released_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS inventory_counts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      count_date DATE NOT NULL DEFAULT CURRENT_DATE,
      item_code TEXT NOT NULL,
      lot_no TEXT NOT NULL,
      location_code TEXT NOT NULL,
      quality_status TEXT NOT NULL,
      book_qty NUMERIC NOT NULL DEFAULT 0,
      actual_qty NUMERIC NOT NULL DEFAULT 0,
      difference_qty NUMERIC NOT NULL DEFAULT 0,
      reason TEXT DEFAULT '',
      counted_by TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS inventory_balance_item_idx ON inventory_balances(item_code, lot_no);
    CREATE INDEX IF NOT EXISTS inventory_tx_created_idx ON inventory_transactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS inventory_tx_item_lot_idx ON inventory_transactions(item_code, lot_no, created_at DESC);
    CREATE INDEX IF NOT EXISTS inventory_reservation_active_idx ON inventory_reservations(item_code, status);
    ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS packaging_type TEXT DEFAULT '';
    ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS packaging_type_other TEXT DEFAULT '';
    ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS package_qty INTEGER;
    ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS unit_weight NUMERIC;
    ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS calculated_weight NUMERIC;
    ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS barcode_qty INTEGER;
    INSERT INTO inventory_locations (location_code, location_name, location_type)
    VALUES
      ('IQC', 'IQC 검사대기', 'QUALITY'),
      ('RM-WH', '원료창고', 'STORAGE'),
      ('PROD', '생산현장', 'PRODUCTION'),
      ('WIP', '재공품 보관', 'WIP'),
      ('OQC', 'OQC 검사대기', 'QUALITY'),
      ('FG-WH', '완제품창고', 'STORAGE'),
      ('SHIP', '출하대기', 'SHIPPING'),
      ('HOLD', '보류/격리구역', 'QUARANTINE'),
      ('UNASSIGNED', '위치확인', 'STORAGE'),
      ('A-1-1', 'A구역 1번 랙 1층 · 원재료', 'STORAGE'),
      ('A-1-2', 'A구역 1번 랙 2층 · 원재료', 'STORAGE'),
      ('A-2-1', 'A구역 2번 랙 1층 · 원재료', 'STORAGE'),
      ('A-2-2', 'A구역 2번 랙 2층 · 원재료', 'STORAGE'),
      ('A-3-1', 'A구역 3번 랙 1층 · 원재료', 'STORAGE'),
      ('A-3-2', 'A구역 3번 랙 2층 · 원재료', 'STORAGE'),
      ('A-4-1', 'A구역 4번 랙 1층 · 원재료', 'STORAGE'),
      ('A-4-2', 'A구역 4번 랙 2층 · 원재료', 'STORAGE'),
      ('A-5-1', 'A구역 5번 랙 1층 · 원재료', 'STORAGE'),
      ('A-5-2', 'A구역 5번 랙 2층 · 원재료', 'STORAGE'),
      ('A-6-1', 'A구역 6번 랙 1층 · 원재료', 'STORAGE'),
      ('A-6-2', 'A구역 6번 랙 2층 · 원재료', 'STORAGE'),
      ('B-1-1', 'B구역 1번 랙 1층 · 완제품', 'STORAGE'),
      ('B-1-2', 'B구역 1번 랙 2층 · 완제품', 'STORAGE'),
      ('B-2-1', 'B구역 2번 랙 1층 · 완제품', 'STORAGE'),
      ('B-2-2', 'B구역 2번 랙 2층 · 완제품', 'STORAGE'),
      ('B-3-1', 'B구역 3번 랙 1층 · 완제품', 'STORAGE'),
      ('B-3-2', 'B구역 3번 랙 2층 · 완제품', 'STORAGE')
    ON CONFLICT (location_code) DO NOTHING;
  `).then(()=>migrateLegacyRmBalances()).catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

async function upsertItem(client, body) {
  const itemCode = txt(body.itemCode).toUpperCase();
  const itemName = txt(body.itemName) || itemCode;
  const category = VALID_CATEGORIES.has(txt(body.category).toUpperCase()) ? txt(body.category).toUpperCase() : 'RM';
  const unit = txt(body.unit) || 'kg';
  await client.query(`INSERT INTO inventory_items (item_code,item_name,category,unit) VALUES ($1,$2,$3,$4) ON CONFLICT (item_code) DO UPDATE SET item_name = CASE WHEN inventory_items.item_name = inventory_items.item_code THEN EXCLUDED.item_name ELSE inventory_items.item_name END, category = COALESCE(NULLIF(EXCLUDED.category,''), inventory_items.category), unit = COALESCE(NULLIF(EXCLUDED.unit,''), inventory_items.unit), updated_at = NOW()`,[itemCode,itemName,category,unit]);
  return { itemCode, itemName, category, unit };
}
async function balanceQty(client,itemCode,lotNo,locationCode,status){const r=await client.query(`SELECT quantity FROM inventory_balances WHERE item_code=$1 AND lot_no=$2 AND location_code=$3 AND quality_status=$4 FOR UPDATE`,[itemCode,lotNo,locationCode,status]);return r.rowCount?Number(r.rows[0].quantity):0;}
async function changeBalance(client,itemCode,lotNo,locationCode,status,delta,allowNegative=false){if(!locationCode||!status||!delta)return;const current=await balanceQty(client,itemCode,lotNo,locationCode,status);const next=current+delta;if(!allowNegative&&next<-.000001)throw new Error(`재고가 부족합니다. 현재고 ${current}, 요청 ${Math.abs(delta)}`);await client.query(`INSERT INTO inventory_balances (item_code,lot_no,location_code,quality_status,quantity,updated_at) VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT (item_code,lot_no,location_code,quality_status) DO UPDATE SET quantity=EXCLUDED.quantity,updated_at=NOW()`,[itemCode,lotNo,locationCode,status,next]);}
async function postInventoryTransaction(req,payload,options={}){
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const type=txt(payload.transactionType).toUpperCase();
    if(!VALID_TYPES.has(type))throw new Error('지원하지 않는 재고 처리 유형입니다.');
    const itemCode=txt(payload.itemCode).toUpperCase(),lotNo=txt(payload.lotNo).toUpperCase(),amount=qty(payload.quantity);
    if(!itemCode||!lotNo||amount===null||amount<=0)throw new Error('품목, LOT, 0보다 큰 수량은 필수입니다.');
    const item=await upsertItem(client,payload);
    let fromLocation=txt(payload.fromLocation).toUpperCase(),toLocation=txt(payload.toLocation).toUpperCase();
    const fromStatus=txt(payload.fromStatus).toUpperCase(),toStatus=txt(payload.toStatus).toUpperCase();
    const legacyRack=physicalRackForItem(itemCode,item.item_name);
    if(toLocation==='RM')toLocation=legacyRack;
    if(fromStatus&&!VALID_STATUS.has(fromStatus))throw new Error('출고 품질상태가 올바르지 않습니다.');
    if(toStatus&&!VALID_STATUS.has(toStatus))throw new Error('입고 품질상태가 올바르지 않습니다.');
    if(fromLocation)await changeBalance(client,itemCode,lotNo,fromLocation,fromStatus||'AVAILABLE',-amount,Boolean(options.allowNegative));
    if(toLocation)await changeBalance(client,itemCode,lotNo,toLocation,toStatus||'AVAILABLE',amount,false);
    if(!fromLocation&&!toLocation)throw new Error('출발 또는 도착 위치가 필요합니다.');
    await client.query(`INSERT INTO inventory_lots (item_code,lot_no,supplier,received_at,expiry_date,reference_no,updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT (item_code,lot_no) DO UPDATE SET supplier=COALESCE(NULLIF(EXCLUDED.supplier,''),inventory_lots.supplier),received_at=COALESCE(EXCLUDED.received_at,inventory_lots.received_at),expiry_date=COALESCE(EXCLUDED.expiry_date,inventory_lots.expiry_date),reference_no=COALESCE(NULLIF(EXCLUDED.reference_no,''),inventory_lots.reference_no),updated_at=NOW()`,[itemCode,lotNo,txt(payload.supplier),txt(payload.receivedAt)||null,txt(payload.expiryDate)||null,txt(payload.referenceNo)]);
    const packageQty=Number.isInteger(Number(payload.packageQty))&&Number(payload.packageQty)>0?Number(payload.packageQty):null;
    const unitWeight=qty(payload.unitWeight);
    const calculatedWeight=qty(payload.calculatedWeight)??(packageQty&&unitWeight?packageQty*unitWeight:null);
    const barcodeQty=Number.isInteger(Number(payload.barcodeQty))&&Number(payload.barcodeQty)>0?Number(payload.barcodeQty):packageQty;
    const user=req.session?.user||{};
    const inserted=await client.query(
      `INSERT INTO inventory_transactions
       (transaction_type,item_code,lot_no,quantity,unit,from_location,to_location,from_status,to_status,
        work_order_no,production_lot,reference_no,packaging_type,packaging_type_other,package_qty,unit_weight,
        calculated_weight,barcode_qty,reason,remark,operator_id,operator_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [type,itemCode,lotNo,amount,item.unit,fromLocation,toLocation,fromStatus,toStatus,
       txt(payload.workOrderNo),txt(payload.productionLot),txt(payload.referenceNo),
       txt(payload.packagingType),txt(payload.packagingTypeOther),packageQty,unitWeight,calculatedWeight,barcodeQty,
       txt(payload.reason),txt(payload.remark),txt(user.uid||user.id),txt(user.name)]
    );
    await client.query('COMMIT');
    return inserted.rows[0];
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{
    client.release();
  }
}

function installInventoryRoutes(app){
  if(app.__qmesInventoryInstalled)return;
  app.__qmesInventoryInstalled=true;
  app.get('/api/inventory/health',requireLogin,async(_req,res)=>{try{await ensureInventorySchema();ok(res,{database:'ok',module:'inventory'});}catch(e){fail(res,500,e.message);}});
  app.get('/api/inventory/items',requireLogin,async(_req,res)=>{try{await ensureInventorySchema();const r=await pool.query(`SELECT * FROM inventory_items WHERE active=TRUE ORDER BY category,item_name`);ok(res,r.rows);}catch(e){fail(res,500,e.message);}});
  app.post('/api/inventory/items',requireLogin,async(req,res)=>{try{await ensureInventorySchema();const b=req.body||{},code=txt(b.itemCode).toUpperCase(),name=txt(b.itemName),category=txt(b.category).toUpperCase(),safety=qty(b.safetyStock)??0;if(!code||!name||!VALID_CATEGORIES.has(category))return fail(res,400,'품목코드, 품목명, 재고구분이 필요합니다.');const r=await pool.query(`INSERT INTO inventory_items (item_code,item_name,category,unit,safety_stock,expiry_days) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (item_code) DO UPDATE SET item_name=$2,category=$3,unit=$4,safety_stock=$5,expiry_days=$6,updated_at=NOW() RETURNING *`,[code,name,category,txt(b.unit)||'kg',safety,Number.isInteger(Number(b.expiryDays))?Number(b.expiryDays):null]);ok(res,r.rows[0],'품목이 저장되었습니다.');}catch(e){fail(res,500,e.message);}});
  app.get('/api/inventory/locations',requireLogin,async(_req,res)=>{try{await ensureInventorySchema();const r=await pool.query('SELECT * FROM inventory_locations WHERE active=TRUE ORDER BY location_code');ok(res,r.rows);}catch(e){fail(res,500,e.message);}});
  app.post('/api/inventory/locations',requireAdmin,async(req,res)=>{try{await ensureInventorySchema();const code=txt(req.body?.locationCode).toUpperCase(),name=txt(req.body?.locationName),type=txt(req.body?.locationType)||'STORAGE';if(!code||!name)return fail(res,400,'위치코드와 위치명이 필요합니다.');const r=await pool.query(`INSERT INTO inventory_locations(location_code,location_name,location_type) VALUES($1,$2,$3) ON CONFLICT(location_code) DO UPDATE SET location_name=$2,location_type=$3,active=TRUE RETURNING *`,[code,name,type]);ok(res,r.rows[0],'재고 위치가 저장되었습니다.');}catch(e){fail(res,500,e.message);}});
  app.get('/api/inventory/stock',requireLogin,async(req,res)=>{try{await ensureInventorySchema();await migrateLegacyRmBalances();const q=`%${txt(req.query.q).toLowerCase()}%`,category=txt(req.query.category).toUpperCase(),status=txt(req.query.status).toUpperCase();const r=await pool.query(`SELECT b.item_code,i.item_name,i.category,i.unit,i.safety_stock,b.lot_no,b.location_code,b.quality_status,b.quantity,l.supplier,l.received_at,l.expiry_date,COALESCE((SELECT SUM(r.quantity) FROM inventory_reservations r WHERE r.item_code=b.item_code AND r.status='ACTIVE' AND (r.lot_no='' OR r.lot_no=b.lot_no) AND (r.location_code='' OR r.location_code=b.location_code)),0) AS reserved_qty FROM inventory_balances b LEFT JOIN inventory_items i ON i.item_code=b.item_code LEFT JOIN inventory_lots l ON l.item_code=b.item_code AND l.lot_no=b.lot_no WHERE b.quantity<>0 AND ($1='%%' OR LOWER(b.item_code) LIKE $1 OR LOWER(COALESCE(i.item_name,'')) LIKE $1 OR LOWER(b.lot_no) LIKE $1) AND ($2='' OR i.category=$2) AND ($3='' OR b.quality_status=$3) ORDER BY i.category,b.item_code,l.expiry_date NULLS LAST,b.lot_no,b.location_code`,[q,category,status]);ok(res,r.rows.map(row=>({...row,available_qty:Math.max(0,Number(row.quantity)-Number(row.reserved_qty||0))})));}catch(e){fail(res,500,e.message);}});
  app.get('/api/inventory/summary',requireLogin,async(_req,res)=>{try{await ensureInventorySchema();const totals=await pool.query(`SELECT COALESCE(i.category,'RM') category,SUM(b.quantity) total_qty,SUM(CASE WHEN b.quality_status='AVAILABLE' THEN b.quantity ELSE 0 END) available_qty,SUM(CASE WHEN b.quality_status IN ('IQC_PENDING','OQC_PENDING') THEN b.quantity ELSE 0 END) pending_qty,SUM(CASE WHEN b.quality_status IN ('HOLD','NONCONFORM') THEN b.quantity ELSE 0 END) hold_qty FROM inventory_balances b LEFT JOIN inventory_items i ON i.item_code=b.item_code GROUP BY COALESCE(i.category,'RM') ORDER BY category`);const alerts=await pool.query(`WITH s AS (SELECT i.item_code,i.item_name,i.category,i.unit,i.safety_stock,COALESCE(SUM(CASE WHEN b.quality_status='AVAILABLE' THEN b.quantity ELSE 0 END),0) available_qty FROM inventory_items i LEFT JOIN inventory_balances b ON b.item_code=i.item_code WHERE i.active=TRUE GROUP BY i.item_code,i.item_name,i.category,i.unit,i.safety_stock) SELECT * FROM s WHERE safety_stock>0 AND available_qty<safety_stock ORDER BY (safety_stock-available_qty) DESC LIMIT 20`);const expiry=await pool.query(`SELECT b.item_code,i.item_name,b.lot_no,l.expiry_date,SUM(b.quantity) quantity FROM inventory_balances b JOIN inventory_lots l ON l.item_code=b.item_code AND l.lot_no=b.lot_no LEFT JOIN inventory_items i ON i.item_code=b.item_code WHERE b.quantity>0 AND l.expiry_date IS NOT NULL AND l.expiry_date<=CURRENT_DATE+INTERVAL '30 days' GROUP BY b.item_code,i.item_name,b.lot_no,l.expiry_date ORDER BY l.expiry_date LIMIT 20`);const pending=await pool.query(`SELECT COUNT(DISTINCT item_code||'|'||lot_no) cnt FROM inventory_balances WHERE quantity>0 AND quality_status IN ('IQC_PENDING','OQC_PENDING')`);ok(res,{totals:totals.rows,safetyAlerts:alerts.rows,expiryAlerts:expiry.rows,pendingLots:Number(pending.rows[0]?.cnt||0)});}catch(e){fail(res,500,e.message);}});
  app.get('/api/inventory/transactions',requireLogin,async(req,res)=>{try{await ensureInventorySchema();const limit=Math.min(1000,Math.max(1,Number(req.query.limit)||300)),q=`%${txt(req.query.q).toLowerCase()}%`;const r=await pool.query(`SELECT * FROM inventory_transactions WHERE ($1='%%' OR LOWER(item_code) LIKE $1 OR LOWER(lot_no) LIKE $1 OR LOWER(reference_no) LIKE $1 OR LOWER(work_order_no) LIKE $1 OR LOWER(production_lot) LIKE $1) ORDER BY created_at DESC LIMIT $2`,[q,limit]);ok(res,r.rows);}catch(e){fail(res,500,e.message);}});
  app.post('/api/inventory/transactions',requireLogin,async(req,res)=>{try{await ensureInventorySchema();const row=await postInventoryTransaction(req,req.body||{});ok(res,row,'재고 처리가 완료되었습니다.');}catch(e){fail(res,400,e.message);}});
  app.patch('/api/inventory/transactions/:id/packaging',requireLogin,async(req,res)=>{
    try{
      await ensureInventorySchema();
      const id=Number(req.params.id),body=req.body||{},packagingType=txt(body.packagingType);
      if(!Number.isInteger(id)||id<=0)return fail(res,400,'입출고 거래번호가 올바르지 않습니다.');
      if(!packagingType)return fail(res,400,'포장형태를 선택하세요.');
      const packageQty=Number.isInteger(Number(body.packageQty))&&Number(body.packageQty)>0?Number(body.packageQty):null;
      const unitWeight=qty(body.unitWeight);
      const calculatedWeight=qty(body.calculatedWeight)??(packageQty&&unitWeight?packageQty*unitWeight:null);
      const barcodeQty=Number.isInteger(Number(body.barcodeQty))&&Number(body.barcodeQty)>0?Number(body.barcodeQty):packageQty;
      const result=await pool.query(
        `UPDATE inventory_transactions
         SET packaging_type=$2,
             packaging_type_other=CASE WHEN $2='기타' THEN $3 ELSE '' END,
             package_qty=COALESCE($4,package_qty),
             unit_weight=COALESCE($5,unit_weight),
             calculated_weight=COALESCE($6,calculated_weight),
             barcode_qty=COALESCE($7,barcode_qty)
         WHERE id=$1
         RETURNING *`,
        [id,packagingType,txt(body.packagingTypeOther),packageQty,unitWeight,calculatedWeight,barcodeQty]
      );
      if(!result.rowCount)return fail(res,404,'입출고 거래를 찾을 수 없습니다.');
      ok(res,result.rows[0],'포장·QR 정보가 저장되었습니다.');
    }catch(e){
      fail(res,400,e.message);
    }
  });
  app.get('/api/inventory/reservations',requireLogin,async(_req,res)=>{try{await ensureInventorySchema();const r=await pool.query(`SELECT * FROM inventory_reservations WHERE status='ACTIVE' ORDER BY created_at DESC`);ok(res,r.rows);}catch(e){fail(res,500,e.message);}});
  app.post('/api/inventory/reservations',requireLogin,async(req,res)=>{try{await ensureInventorySchema();const b=req.body||{},amount=qty(b.quantity);if(!txt(b.itemCode)||!txt(b.workOrderNo)||amount===null||amount<=0)return fail(res,400,'품목, 작업지시번호, 예약수량이 필요합니다.');const r=await pool.query(`INSERT INTO inventory_reservations(item_code,lot_no,location_code,work_order_no,quantity,reserved_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[txt(b.itemCode).toUpperCase(),txt(b.lotNo).toUpperCase(),txt(b.locationCode).toUpperCase(),txt(b.workOrderNo),amount,txt(req.session.user?.name)]);ok(res,r.rows[0],'생산 예약재고가 등록되었습니다.');}catch(e){fail(res,500,e.message);}});
  app.delete('/api/inventory/reservations/:id',requireLogin,async(req,res)=>{try{await ensureInventorySchema();const r=await pool.query(`UPDATE inventory_reservations SET status='RELEASED',released_at=NOW() WHERE id=$1 AND status='ACTIVE' RETURNING id`,[req.params.id]);if(!r.rowCount)return fail(res,404,'예약재고를 찾을 수 없습니다.');ok(res,null,'예약이 해제되었습니다.');}catch(e){fail(res,500,e.message);}});
  app.get('/api/inventory/counts',requireLogin,async(_req,res)=>{try{await ensureInventorySchema();const r=await pool.query(`SELECT * FROM inventory_counts ORDER BY created_at DESC LIMIT 300`);ok(res,r.rows);}catch(e){fail(res,500,e.message);}});
  app.post('/api/inventory/counts',requireLogin,async(req,res)=>{const client=await pool.connect();try{await ensureInventorySchema();await client.query('BEGIN');const b=req.body||{},itemCode=txt(b.itemCode).toUpperCase(),lotNo=txt(b.lotNo).toUpperCase(),location=txt(b.locationCode).toUpperCase(),status=txt(b.qualityStatus).toUpperCase()||'AVAILABLE',actual=qty(b.actualQty);if(!itemCode||!lotNo||!location||actual===null||actual<0)throw new Error('품목, LOT, 위치, 실사수량이 필요합니다.');const book=await balanceQty(client,itemCode,lotNo,location,status),diff=actual-book;await client.query(`INSERT INTO inventory_counts(item_code,lot_no,location_code,quality_status,book_qty,actual_qty,difference_qty,reason,counted_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[itemCode,lotNo,location,status,book,actual,diff,txt(b.reason),txt(req.session.user?.name)]);await client.query(`INSERT INTO inventory_balances(item_code,lot_no,location_code,quality_status,quantity,updated_at) VALUES($1,$2,$3,$4,$5,NOW()) ON CONFLICT(item_code,lot_no,location_code,quality_status) DO UPDATE SET quantity=$5,updated_at=NOW()`,[itemCode,lotNo,location,status,actual]);if(Math.abs(diff)>.000001)await client.query(`INSERT INTO inventory_transactions(transaction_type,item_code,lot_no,quantity,unit,from_location,to_location,from_status,to_status,reason,remark,operator_id,operator_name) VALUES('ADJUSTMENT',$1,$2,$3,COALESCE((SELECT unit FROM inventory_items WHERE item_code=$1),'kg'),$4,$4,$5,$5,$6,$7,$8,$9)`,[itemCode,lotNo,Math.abs(diff),location,status,txt(b.reason)||'재고실사 조정',diff>=0?'실사 증액':'실사 감액',txt(req.session.user?.uid||req.session.user?.id),txt(req.session.user?.name)]);await client.query('COMMIT');ok(res,{bookQty:book,actualQty:actual,differenceQty:diff},'재고실사가 반영되었습니다.');}catch(e){await client.query('ROLLBACK');fail(res,400,e.message);}finally{client.release();}});
}

// Register earlier than the SPA catch-all. /api/backup is a guaranteed late API route
// in server.js, so using it as an additional registration trigger avoids HTML fallback.
const originalGet = express.application.get;
express.application.get = function inventoryAwareGet(routePath, ...handlers) {
  if ((routePath === '/api/backup' || routePath === '*') && !this.__qmesInventoryInstalled) {
    installInventoryRoutes(this);
  }
  return originalGet.call(this, routePath, ...handlers);
};

ensureInventorySchema().catch((error)=>console.error('[QMES inventory] schema init failed:',error.message));
module.exports={installInventoryRoutes,ensureInventorySchema};
