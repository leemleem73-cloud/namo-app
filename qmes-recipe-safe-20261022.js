'use strict';

const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 3,
  connectionTimeoutMillis: 10000
});

let schemaPromise = null;
function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS qmes_recipe_versions (
        id BIGSERIAL PRIMARY KEY,
        product_code TEXT NOT NULL DEFAULT '',
        product_name TEXT NOT NULL,
        revision TEXT NOT NULL,
        basis_qty NUMERIC(18,6) NOT NULL CHECK (basis_qty > 0),
        unit TEXT NOT NULL DEFAULT 'kg',
        effective_on DATE,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        note TEXT NOT NULL DEFAULT '',
        created_by_id TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(product_name, revision),
        CHECK (status IN ('ACTIVE','OBSOLETE'))
      );
      CREATE INDEX IF NOT EXISTS qmes_recipe_product_idx
        ON qmes_recipe_versions(product_name, status, id DESC);

      CREATE TABLE IF NOT EXISTS qmes_recipe_materials (
        id BIGSERIAL PRIMARY KEY,
        recipe_id BIGINT NOT NULL REFERENCES qmes_recipe_versions(id) ON DELETE RESTRICT,
        seq INTEGER NOT NULL CHECK (seq > 0),
        material_code TEXT NOT NULL DEFAULT '',
        material_name TEXT NOT NULL,
        standard_qty NUMERIC(18,6) NOT NULL CHECK (standard_qty > 0),
        unit TEXT NOT NULL DEFAULT 'kg',
        mix_time_min NUMERIC(12,3),
        rpm NUMERIC(12,3),
        temperature_c NUMERIC(12,3),
        note TEXT NOT NULL DEFAULT '',
        UNIQUE(recipe_id, seq)
      );
      CREATE INDEX IF NOT EXISTS qmes_recipe_material_recipe_idx
        ON qmes_recipe_materials(recipe_id, seq);
    `).catch(error => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

const str = (value, max = 500) => String(value == null ? '' : value).trim().slice(0, max);
const num = value => {
  const n = Number(String(value == null ? '' : value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
const fail = (res, status, message) => res.status(status).json({ success: false, message, data: null });
const auth = (req, res, next) => req.session?.user ? next() : fail(res, 401, '로그인이 필요합니다.');

function cleanMaterials(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 30) throw new Error('원료는 1~30개까지 등록할 수 있습니다.');
  return raw.map((row, index) => {
    const materialName = str(row?.material_name || row?.name, 160);
    const standardQty = num(row?.standard_qty ?? row?.qty);
    if (!materialName || !(standardQty > 0)) throw new Error((index + 1) + '번째 원료명과 기준 투입량을 확인하세요.');
    const nullable = value => {
      const n = num(value);
      return n === null || n < 0 ? null : n;
    };
    return {
      seq: index + 1,
      material_code: str(row?.material_code || row?.code, 80),
      material_name: materialName,
      standard_qty: standardQty,
      unit: str(row?.unit || 'kg', 20) || 'kg',
      mix_time_min: nullable(row?.mix_time_min),
      rpm: nullable(row?.rpm),
      temperature_c: nullable(row?.temperature_c),
      note: str(row?.note, 500)
    };
  });
}


async function syncRecipesFromWorkOrders(actor = {}) {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(20261022, 102)');
    const refs = await client.query(
      "SELECT to_regclass('public.qmes_work_order_documents') AS docs, to_regclass('public.qmes_work_order_deletions') AS deletions"
    );
    if (!refs.rows[0]?.docs) {
      await client.query('COMMIT');
      return { created: 0, skipped: 0 };
    }
    const hasDeletions = Boolean(refs.rows[0]?.deletions);
    const rows = await client.query(`
      SELECT d.id, d.document, d.created_at, d.updated_at
      FROM qmes_work_order_documents d
      ${hasDeletions ? "WHERE NOT EXISTS (SELECT 1 FROM qmes_work_order_deletions x WHERE x.id=d.id)" : ""}
      ORDER BY COALESCE(d.updated_at,d.created_at) DESC, d.created_at DESC
    `);

    const latestByProduct = new Map();
    for (const row of rows.rows) {
      const doc = row.document && typeof row.document === 'object' ? row.document : {};
      const fields = doc.fields && typeof doc.fields === 'object' ? doc.fields : {};
      const productName = str(fields['제품명'] || doc.productName || doc.item, 160);
      if (!productName || latestByProduct.has(productName)) continue;

      const rawMaterials = Array.isArray(doc.materials) ? doc.materials : (Array.isArray(doc.inputs) ? doc.inputs : []);
      const materials = rawMaterials.map((m, index) => {
        const name = str(m?.name || m?.material_name || m?.material, 160);
        const qty = num(m?.plan ?? m?.standard_qty ?? m?.std ?? m?.qty);
        return {
          seq: index + 1,
          material_code: str(m?.code || m?.material_code, 80),
          material_name: name,
          standard_qty: qty,
          unit: str(m?.unit || 'kg', 20) || 'kg'
        };
      }).filter(m => m.material_name && m.standard_qty > 0);

      if (!materials.length) continue;
      const materialTotal = materials.reduce((sum, m) => sum + Number(m.standard_qty || 0), 0);
      const planQty = num(fields['계획수량'] ?? fields['계획수량(kg)'] ?? doc.planQty ?? doc.plan);
      const basisQty = planQty > 0 ? planQty : materialTotal;
      if (!(basisQty > 0)) continue;

      const workDate = str(doc.workDate || fields['작업일자'] || fields['작업 시작일'], 10);
      const workOrderNo = str(fields['작업지시번호'] || doc.id || row.id, 100);
      latestByProduct.set(productName, {
        productName,
        productCode: str(doc.productCode || fields['제품코드'], 80),
        basisQty,
        unit: 'kg',
        effectiveOn: /^\d{4}-\d{2}-\d{2}$/.test(workDate) ? workDate : null,
        workOrderNo,
        materials
      });
    }

    const existing = await client.query('SELECT DISTINCT product_name FROM qmes_recipe_versions');
    const existingProducts = new Set(existing.rows.map(r => str(r.product_name, 160)));
    let created = 0, skipped = 0;

    for (const recipe of latestByProduct.values()) {
      if (existingProducts.has(recipe.productName)) {
        skipped += 1;
        continue;
      }
      const inserted = await client.query(`
        INSERT INTO qmes_recipe_versions
          (product_code, product_name, revision, basis_qty, unit, effective_on, status, note, created_by_id, created_by)
        VALUES ($1,$2,'Rev.01',$3,$4,$5,'ACTIVE',$6,$7,$8)
        ON CONFLICT (product_name, revision) DO NOTHING
        RETURNING id
      `, [
        recipe.productCode, recipe.productName, recipe.basisQty, recipe.unit, recipe.effectiveOn,
        '작업지시 ' + (recipe.workOrderNo || '-') + ' 기준 자동연동',
        str(actor?.id, 100), '작업지시 자동연동'
      ]);
      if (!inserted.rowCount) {
        skipped += 1;
        existingProducts.add(recipe.productName);
        continue;
      }
      const recipeId = inserted.rows[0].id;
      for (const material of recipe.materials) {
        await client.query(`
          INSERT INTO qmes_recipe_materials
            (recipe_id,seq,material_code,material_name,standard_qty,unit,mix_time_min,rpm,temperature_c,note)
          VALUES ($1,$2,$3,$4,$5,$6,NULL,NULL,NULL,'작업지시 계획투입량 자동연동')
        `, [
          recipeId, material.seq, material.material_code, material.material_name,
          material.standard_qty, material.unit
        ]);
      }
      created += 1;
      existingProducts.add(recipe.productName);
    }

    await client.query('COMMIT');
    return { created, skipped };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

function install(app) {
  if (app.__qmesRecipeSafe20261022) return;
  app.__qmesRecipeSafe20261022 = true;

  app.get('/api/qmes-recipes', auth, async (req, res) => {
    try {
      await ensureSchema();
      await syncRecipesFromWorkOrders(req.session?.user || {});
      const q = str(req.query.q, 120);
      const result = await pool.query(`
        SELECT r.*,
          (SELECT COUNT(*)::int FROM qmes_recipe_materials m WHERE m.recipe_id=r.id) AS material_count
        FROM qmes_recipe_versions r
        WHERE ($1='' OR r.product_name ILIKE '%'||$1||'%' OR r.product_code ILIKE '%'||$1||'%' OR r.revision ILIKE '%'||$1||'%')
        ORDER BY r.product_name, r.id DESC
        LIMIT 500
      `, [q]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('[QMES recipe list]', error);
      fail(res, 500, '배합기준 목록 조회 실패');
    }
  });

  app.get('/api/qmes-recipes/plan', auth, async (req, res) => {
    const product = str(req.query.product, 160);
    const planQty = num(req.query.qty);
    if (!product || !(planQty > 0)) return fail(res, 400, '제품명과 계획수량을 확인하세요.');
    try {
      await ensureSchema();
      const head = await pool.query(`
        SELECT * FROM qmes_recipe_versions
        WHERE status='ACTIVE' AND (product_name=$1 OR NULLIF(product_code,'')=$1)
        ORDER BY id DESC LIMIT 1
      `, [product]);
      if (!head.rowCount) return fail(res, 404, '해당 제품의 활성 배합기준이 없습니다.');
      const recipe = head.rows[0];
      const materials = await pool.query('SELECT * FROM qmes_recipe_materials WHERE recipe_id=$1 ORDER BY seq', [recipe.id]);
      const scale = planQty / Number(recipe.basis_qty);
      res.json({
        success: true,
        data: {
          id: recipe.id,
          product_code: recipe.product_code,
          product_name: recipe.product_name,
          revision: recipe.revision,
          basis_qty: Number(recipe.basis_qty),
          unit: recipe.unit,
          effective_on: recipe.effective_on,
          plan_qty: planQty,
          materials: materials.rows.map(row => ({
            ...row,
            standard_qty: Number(row.standard_qty),
            plan_qty: Number((Number(row.standard_qty) * scale).toFixed(3))
          }))
        }
      });
    } catch (error) {
      console.error('[QMES recipe plan]', error);
      fail(res, 500, '배합기준 계획량 계산 실패');
    }
  });

  app.get('/api/qmes-recipes/:id', auth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return fail(res, 400, '배합기준 번호를 확인하세요.');
    try {
      await ensureSchema();
      const head = await pool.query('SELECT * FROM qmes_recipe_versions WHERE id=$1', [id]);
      if (!head.rowCount) return fail(res, 404, '배합기준을 찾을 수 없습니다.');
      const materials = await pool.query('SELECT * FROM qmes_recipe_materials WHERE recipe_id=$1 ORDER BY seq', [id]);
      res.json({ success: true, data: { ...head.rows[0], materials: materials.rows } });
    } catch (error) {
      console.error('[QMES recipe detail]', error);
      fail(res, 500, '배합기준 상세 조회 실패');
    }
  });

  app.post('/api/qmes-recipes', auth, async (req, res) => {
    const body = req.body || {};
    const productName = str(body.product_name, 160);
    const productCode = str(body.product_code, 80);
    const revision = str(body.revision, 40);
    const basisQty = num(body.basis_qty);
    const unit = str(body.unit || 'kg', 20) || 'kg';
    const effectiveOn = str(body.effective_on, 10);
    const note = str(body.note, 1000);
    if (!productName || !revision || !(basisQty > 0)) return fail(res, 400, '제품명, Rev., 기준 생산량은 필수입니다.');
    if (effectiveOn && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveOn)) return fail(res, 400, '적용일자를 확인하세요.');
    let materials;
    try { materials = cleanMaterials(body.materials); }
    catch (error) { return fail(res, 400, error.message); }

    const client = await pool.connect();
    try {
      await ensureSchema();
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(20261022, 101)');
      const duplicate = await client.query('SELECT id FROM qmes_recipe_versions WHERE product_name=$1 AND revision=$2', [productName, revision]);
      if (duplicate.rowCount) {
        await client.query('ROLLBACK');
        return fail(res, 409, '동일 제품의 동일 Rev.는 덮어쓸 수 없습니다. 새 Rev.로 등록하세요.');
      }
      await client.query("UPDATE qmes_recipe_versions SET status='OBSOLETE' WHERE product_name=$1 AND status='ACTIVE'", [productName]);
      const user = req.session.user || {};
      const inserted = await client.query(`
        INSERT INTO qmes_recipe_versions
          (product_code, product_name, revision, basis_qty, unit, effective_on, status, note, created_by_id, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$9)
        RETURNING *
      `, [
        productCode, productName, revision, basisQty, unit, effectiveOn || null, note,
        str(user.id, 100), str(user.name || user.email || '작성자', 120)
      ]);
      const recipe = inserted.rows[0];
      for (const row of materials) {
        await client.query(`
          INSERT INTO qmes_recipe_materials
            (recipe_id,seq,material_code,material_name,standard_qty,unit,mix_time_min,rpm,temperature_c,note)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `, [
          recipe.id, row.seq, row.material_code, row.material_name, row.standard_qty, row.unit,
          row.mix_time_min, row.rpm, row.temperature_c, row.note
        ]);
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, data: recipe, message: '새 배합기준 Rev.가 등록되었습니다.' });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('[QMES recipe create]', error);
      fail(res, 500, '배합기준 저장 실패');
    } finally {
      client.release();
    }
  });

  app.post('/api/qmes-recipes/:id/activate', auth, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return fail(res, 400, '배합기준 번호를 확인하세요.');
    const client = await pool.connect();
    try {
      await ensureSchema();
      await client.query('BEGIN');
      const found = await client.query('SELECT * FROM qmes_recipe_versions WHERE id=$1 FOR UPDATE', [id]);
      if (!found.rowCount) {
        await client.query('ROLLBACK');
        return fail(res, 404, '배합기준을 찾을 수 없습니다.');
      }
      const row = found.rows[0];
      await client.query("UPDATE qmes_recipe_versions SET status='OBSOLETE' WHERE product_name=$1 AND id<>$2 AND status='ACTIVE'", [row.product_name, id]);
      const updated = await client.query("UPDATE qmes_recipe_versions SET status='ACTIVE' WHERE id=$1 RETURNING *", [id]);
      await client.query('COMMIT');
      res.json({ success: true, data: updated.rows[0] });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('[QMES recipe activate]', error);
      fail(res, 500, '배합기준 활성화 실패');
    } finally {
      client.release();
    }
  });
}

const originalUse = express.application.use;
express.application.use = function qmesRecipeUse(...args) {
  const out = originalUse.apply(this, args);
  if (!this.__qmesRecipeSafe20261022) {
    const fns = args.flat().filter(x => typeof x === 'function');
    if (fns.some(fn => fn.name === 'session' || /session/i.test(fn.name || ''))) install(this);
  }
  return out;
};

module.exports = { install };
