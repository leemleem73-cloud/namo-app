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
      CREATE TABLE IF NOT EXISTS qmes_change_requests (
        id BIGSERIAL PRIMARY KEY,
        change_no TEXT UNIQUE,
        change_type TEXT NOT NULL,
        title TEXT NOT NULL,
        target TEXT NOT NULL DEFAULT '',
        current_value TEXT NOT NULL DEFAULT '',
        proposed_value TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT '',
        impact TEXT NOT NULL DEFAULT '',
        owner TEXT NOT NULL DEFAULT '',
        planned_on DATE,
        status TEXT NOT NULL DEFAULT '작성중',
        created_by_id TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL DEFAULT '',
        reviewed_by TEXT NOT NULL DEFAULT '',
        reviewed_at TIMESTAMPTZ,
        approved_by TEXT NOT NULL DEFAULT '',
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS qmes_change_status_idx ON qmes_change_requests(status, created_at DESC);

      CREATE TABLE IF NOT EXISTS qmes_instruments (
        id BIGSERIAL PRIMARY KEY,
        instrument_no TEXT UNIQUE,
        instrument_name TEXT NOT NULL,
        maker TEXT NOT NULL DEFAULT '',
        model TEXT NOT NULL DEFAULT '',
        serial_no TEXT NOT NULL DEFAULT '',
        department TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        calibration_cycle_months INTEGER NOT NULL DEFAULT 12 CHECK (calibration_cycle_months > 0),
        last_calibration_on DATE,
        next_calibration_on DATE,
        status TEXT NOT NULL DEFAULT '사용',
        note TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE qmes_instruments ADD COLUMN IF NOT EXISTS use_range TEXT NOT NULL DEFAULT '';
      CREATE INDEX IF NOT EXISTS qmes_instrument_due_idx ON qmes_instruments(next_calibration_on, status);

      CREATE TABLE IF NOT EXISTS qmes_calibrations (
        id BIGSERIAL PRIMARY KEY,
        instrument_id BIGINT NOT NULL REFERENCES qmes_instruments(id) ON DELETE RESTRICT,
        calibration_on DATE NOT NULL,
        next_due_on DATE,
        agency TEXT NOT NULL DEFAULT '',
        certificate_no TEXT NOT NULL DEFAULT '',
        result TEXT NOT NULL DEFAULT '적합',
        note TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS qmes_calibration_instrument_idx ON qmes_calibrations(instrument_id, calibration_on DESC);
      CREATE TABLE IF NOT EXISTS qmes_instrument_photos(
        instrument_id BIGINT PRIMARY KEY REFERENCES qmes_instruments(id) ON DELETE CASCADE,
        content_type TEXT NOT NULL, image_data BYTEA NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      UPDATE qmes_instruments
      SET instrument_no='NM측정-' || LPAD(id::text,GREATEST(2,LENGTH(id::text)),'0')
      WHERE instrument_no ~ '^MI-[0-9]+$';

    `).catch(error => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

const str = (value, max = 1000) => String(value == null ? '' : value).trim().slice(0, max);
const fail = (res, status, message) => res.status(status).json({ success: false, message, data: null });
const auth = (req, res, next) => req.session?.user ? next() : fail(res, 401, '로그인이 필요합니다.');
const validDate = value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
const actorName = req => str(req.session?.user?.name || req.session?.user?.email || '작성자', 120);

function install(app) {
  if (app.__qmesChemicalEnterprise20261022) return;
  app.__qmesChemicalEnterprise20261022 = true;

  app.get('/api/qmes-change', auth, async (req, res) => {
    try {
      await ensureSchema();
      const q = str(req.query.q, 120);
      const rows = await pool.query(`
        SELECT * FROM qmes_change_requests
        WHERE ($1='' OR change_no ILIKE '%'||$1||'%' OR change_type ILIKE '%'||$1||'%' OR title ILIKE '%'||$1||'%' OR target ILIKE '%'||$1||'%')
        ORDER BY id DESC LIMIT 500
      `, [q]);
      res.json({ success: true, data: rows.rows });
    } catch (error) {
      console.error('[QMES change list]', error);
      fail(res, 500, '변경관리 조회 실패');
    }
  });

  app.post('/api/qmes-change', auth, async (req, res) => {
    const b = req.body || {};
    const changeType = str(b.change_type, 80), title = str(b.title, 240);
    if (!changeType || !title) return fail(res, 400, '변경구분과 변경제목은 필수입니다.');
    const plannedOn = str(b.planned_on, 10);
    if (!validDate(plannedOn)) return fail(res, 400, '적용예정일을 확인하세요.');
    const client = await pool.connect();
    try {
      await ensureSchema();
      await client.query('BEGIN');
      const created = await client.query(`
        INSERT INTO qmes_change_requests
          (change_type,title,target,current_value,proposed_value,reason,impact,owner,planned_on,status,created_by_id,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'작성중',$10,$11)
        RETURNING *
      `, [
        changeType, title, str(b.target, 240), str(b.current_value, 2000), str(b.proposed_value, 2000),
        str(b.reason, 2000), str(b.impact, 3000), str(b.owner, 120), plannedOn || null,
        str(req.session?.user?.id, 100), actorName(req)
      ]);
      const row = created.rows[0];
      const no = 'CHG-' + new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(/-/g,'') + '-' + String(row.id).padStart(3,'0');
      const updated = await client.query('UPDATE qmes_change_requests SET change_no=$1 WHERE id=$2 RETURNING *', [no, row.id]);
      await client.query('COMMIT');
      res.status(201).json({ success: true, data: updated.rows[0] });
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('[QMES change create]', error);
      fail(res, 500, '변경관리 저장 실패');
    } finally {
      client.release();
    }
  });

  app.post('/api/qmes-change/:id/action', auth, async (req, res) => {
    const id = Number(req.params.id), action = str(req.body?.action, 30);
    if (!Number.isSafeInteger(id) || id < 1 || !['review','approve','close'].includes(action)) return fail(res, 400, '처리 요청을 확인하세요.');
    try {
      await ensureSchema();
      let sql='', params=[];
      if (action === 'review') {
        sql = "UPDATE qmes_change_requests SET status='검토완료',reviewed_by=$1,reviewed_at=NOW(),updated_at=NOW() WHERE id=$2 AND status='작성중' RETURNING *";
        params = [actorName(req), id];
      } else if (action === 'approve') {
        sql = "UPDATE qmes_change_requests SET status='승인완료',approved_by=$1,approved_at=NOW(),updated_at=NOW() WHERE id=$2 AND status='검토완료' RETURNING *";
        params = [actorName(req), id];
      } else {
        sql = "UPDATE qmes_change_requests SET status='적용완료',updated_at=NOW() WHERE id=$1 AND status='승인완료' RETURNING *";
        params = [id];
      }
      const result = await pool.query(sql, params);
      if (!result.rowCount) return fail(res, 409, '현재 상태에서는 처리할 수 없습니다.');
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('[QMES change action]', error);
      fail(res, 500, '변경관리 상태 처리 실패');
    }
  });

  app.get('/api/qmes-instruments', auth, async (req, res) => {
    try {
      await ensureSchema();
      const q = str(req.query.q, 120);
      const rows = await pool.query(`
        SELECT i.*,
          (SELECT updated_at FROM qmes_instrument_photos p WHERE p.instrument_id=i.id) AS photo_updated_at,
          (SELECT COUNT(*)::int FROM qmes_calibrations c WHERE c.instrument_id=i.id) AS calibration_count
        FROM qmes_instruments i
        WHERE ($1='' OR instrument_no ILIKE '%'||$1||'%' OR instrument_name ILIKE '%'||$1||'%' OR model ILIKE '%'||$1||'%' OR serial_no ILIKE '%'||$1||'%')
        ORDER BY id DESC LIMIT 500
      `, [q]);
      res.json({ success: true, data: rows.rows });
    } catch (error) {
      console.error('[QMES instrument list]', error);
      fail(res, 500, '계측기 조회 실패');
    }
  });

  app.post('/api/qmes-instruments', auth, async (req, res) => {
    const b=req.body||{};
    const name=str(b.instrument_name,160);
    if(!name) return fail(res,400,'계측기명은 필수입니다.');
    const cycle=Math.max(1,Math.min(120,Number(b.calibration_cycle_months)||12));
    const last=str(b.last_calibration_on,10), next=str(b.next_calibration_on,10);
    if(!validDate(last)||!validDate(next)) return fail(res,400,'검교정 일자를 확인하세요.');
    const client=await pool.connect();
    try{
      await ensureSchema();
      await client.query('BEGIN');
      const inserted=await client.query(`
        INSERT INTO qmes_instruments
          (instrument_name,maker,model,serial_no,department,location,calibration_cycle_months,last_calibration_on,next_calibration_on,status,note,created_by,use_range)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
      `,[
        name,str(b.maker,120),str(b.model,120),str(b.serial_no,120),str(b.department,120),str(b.location,160),
        cycle,last||null,next||null,str(b.status||'사용',40),str(b.note,1000),actorName(req),str(b.use_range,240)
      ]);
      const row=inserted.rows[0];
      const no='NM측정-'+String(row.id).padStart(2,'0');
      const updated=await client.query('UPDATE qmes_instruments SET instrument_no=$1 WHERE id=$2 RETURNING *',[no,row.id]);
      await client.query('COMMIT');
      res.status(201).json({success:true,data:updated.rows[0]});
    }catch(error){
      try{await client.query('ROLLBACK');}catch(_){}
      console.error('[QMES instrument create]',error);fail(res,500,'계측기 저장 실패');
    }finally{client.release();}
  });


  app.patch('/api/qmes-instruments/:id', auth, async(req,res)=>{
    const id=Number(req.params.id),b=req.body||{};
    if(!Number.isSafeInteger(id)||id<1)return fail(res,400,'계측기 번호를 확인하세요.');
    const name=str(b.instrument_name,160),cycle=Number(b.calibration_cycle_months);
    const last=str(b.last_calibration_on,10),next=str(b.next_calibration_on,10),status=str(b.status,40);
    if(!name)return fail(res,400,'계측기명은 필수입니다.');
    if(!Number.isInteger(cycle)||cycle<1||cycle>120)return fail(res,400,'검교정주기는 1~120개월로 입력하세요.');
    if(!validDate(last)||!validDate(next))return fail(res,400,'검교정 일자를 확인하세요.');
    if(!['사용','사용중지'].includes(status))return fail(res,400,'사용 상태를 확인하세요.');
    try{
      await ensureSchema();
      const result=await pool.query(`
        UPDATE qmes_instruments SET instrument_name=$1,maker=$2,model=$3,serial_no=$4,
          department=$5,location=$6,calibration_cycle_months=$7,last_calibration_on=$8,
          next_calibration_on=$9,status=$10,note=$11,use_range=$13,updated_at=NOW()
        WHERE id=$12 RETURNING *
      `,[name,str(b.maker,120),str(b.model,120),str(b.serial_no,120),str(b.department,120),
        str(b.location,160),cycle,last||null,next||null,status,str(b.note,1000),id,str(b.use_range,240)]);
      if(!result.rowCount)return fail(res,404,'계측기를 찾을 수 없습니다.');
      res.json({success:true,data:result.rows[0]});
    }catch(error){console.error('[QMES instrument update]',error);fail(res,500,'계측기 수정 실패');}
  });


  app.get('/api/qmes-instruments/:id/photo',auth,async(req,res)=>{
    const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return fail(res,400,'계측기 번호를 확인하세요.');
    try{await ensureSchema();const result=await pool.query('SELECT content_type,image_data FROM qmes_instrument_photos WHERE instrument_id=$1',[id]);
      if(!result.rowCount)return fail(res,404,'등록된 사진이 없습니다.');
      res.set('Content-Type',result.rows[0].content_type);res.set('Cache-Control','private, max-age=86400');res.set('X-Content-Type-Options','nosniff');res.send(result.rows[0].image_data);
    }catch(error){console.error('[QMES instrument photo]',error);fail(res,500,'사진 조회 실패');}
  });
  app.post('/api/qmes-instruments/:id/photo',auth,express.raw({type:['image/png','image/jpeg','image/webp'],limit:'5mb'}),async(req,res)=>{
    const id=Number(req.params.id),data=req.body,type=req.get('Content-Type')?.split(';')[0];
    if(!Number.isSafeInteger(id)||id<1)return fail(res,400,'계측기 번호를 확인하세요.');
    const valid=Buffer.isBuffer(data)&&data.length>12&&data.length<=5*1024*1024&&(
      (type==='image/png'&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||
      (type==='image/jpeg'&&data[0]===255&&data[1]===216&&data[2]===255)||
      (type==='image/webp'&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP'));
    if(!valid)return fail(res,400,'5MB 이하의 PNG, JPG, WebP 사진을 선택하세요.');
    try{await ensureSchema();const exists=await pool.query('SELECT id FROM qmes_instruments WHERE id=$1',[id]);if(!exists.rowCount)return fail(res,404,'계측기를 찾을 수 없습니다.');
      const result=await pool.query('INSERT INTO qmes_instrument_photos(instrument_id,content_type,image_data) VALUES($1,$2,$3) ON CONFLICT(instrument_id) DO UPDATE SET content_type=EXCLUDED.content_type,image_data=EXCLUDED.image_data,updated_at=NOW() RETURNING updated_at',[id,type,data]);
      res.json({success:true,data:{updated_at:result.rows[0].updated_at}});
    }catch(error){console.error('[QMES instrument photo save]',error);fail(res,500,'사진 저장 실패');}
  });

  app.get('/api/qmes-calibrations', auth, async (req,res)=>{
    try{
      await ensureSchema();
      const instrumentId=Number(req.query.instrument_id);
      const params=[];let where='';
      if(Number.isSafeInteger(instrumentId)&&instrumentId>0){params.push(instrumentId);where='WHERE c.instrument_id=$1';}
      const rows=await pool.query(`
        SELECT c.*,i.instrument_no,i.instrument_name
        FROM qmes_calibrations c JOIN qmes_instruments i ON i.id=c.instrument_id
        ${where}
        ORDER BY c.calibration_on DESC,c.id DESC LIMIT 1000
      `,params);
      res.json({success:true,data:rows.rows});
    }catch(error){console.error('[QMES calibration list]',error);fail(res,500,'검교정 이력 조회 실패');}
  });

  app.post('/api/qmes-calibrations', auth, async (req,res)=>{
    const b=req.body||{},instrumentId=Number(b.instrument_id),on=str(b.calibration_on,10),next=str(b.next_due_on,10);
    if(!Number.isSafeInteger(instrumentId)||instrumentId<1||!/^\d{4}-\d{2}-\d{2}$/.test(on)||!validDate(next))return fail(res,400,'계측기와 검교정 일자를 확인하세요.');
    const client=await pool.connect();
    try{
      await ensureSchema();await client.query('BEGIN');
      const exists=await client.query('SELECT id FROM qmes_instruments WHERE id=$1 FOR UPDATE',[instrumentId]);
      if(!exists.rowCount){await client.query('ROLLBACK');return fail(res,404,'계측기를 찾을 수 없습니다.');}
      const inserted=await client.query(`
        INSERT INTO qmes_calibrations(instrument_id,calibration_on,next_due_on,agency,certificate_no,result,note,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
      `,[instrumentId,on,next||null,str(b.agency,160),str(b.certificate_no,160),str(b.result||'적합',40),str(b.note,1000),actorName(req)]);
      await client.query('UPDATE qmes_instruments SET last_calibration_on=$1,next_calibration_on=$2,status=$3,updated_at=NOW() WHERE id=$4',[on,next||null,str(b.result||'적합',40)==='적합'?'사용':'사용중지',instrumentId]);
      await client.query('COMMIT');res.status(201).json({success:true,data:inserted.rows[0]});
    }catch(error){try{await client.query('ROLLBACK');}catch(_){}console.error('[QMES calibration create]',error);fail(res,500,'검교정 이력 저장 실패');}
    finally{client.release();}
  });
}

const originalUse=express.application.use;
express.application.use=function qmesChemicalEnterpriseUse(...args){
  const out=originalUse.apply(this,args);
  if(!this.__qmesChemicalEnterprise20261022){
    const fns=args.flat().filter(x=>typeof x==='function');
    if(fns.some(fn=>fn.name==='session'||/session/i.test(fn.name||'')))install(this);
  }
  return out;
};

module.exports={install};
