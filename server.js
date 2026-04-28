process.env.TZ = 'Asia/Seoul';

const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'qms-namo-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 8 },
}));
app.use(express.static(path.join(__dirname, 'public')));

const ok   = (res, data=null, message='OK') => res.json({ success:true, message, data });
const fail = (res, status, message) => res.status(status).json({ success:false, message, data:null });
const txt  = v => (v ?? '').toString().trim();
const num  = v => { if(v===''||v==null) return null; const n=Number(v); return isFinite(n)?n:null; };
const arr  = v => Array.isArray(v) ? v : [];
const db   = (sql, p=[]) => pool.query(sql, p);

function requireLogin(req, res, next) {
  if (!req.session.user) return fail(res, 401, '로그인이 필요합니다.');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin')
    return fail(res, 403, '관리자 권한이 필요합니다.');
  next();
}
function buildUser(u) {
  return { id:u.id, name:u.name, email:u.email, role:u.role,
           department:u.department, title:u.title||'', status:u.status };
}
function calcJudge(items=[]) {
  const rows=arr(items);
  if(!rows.length) return '합격';
  if(rows.some(x=>txt(x.judge)==='불합격')) return '불합격';
  if(rows.some(x=>txt(x.judge)==='보류'))   return '보류';
  return '합격';
}
function signJ(v){ if(!v)return null; return typeof v==='string'?v:JSON.stringify(v); }

/* ─── SCHEMA ─── */
async function ensureSchema() {
  await db(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      department TEXT DEFAULT '', title TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user', status TEXT NOT NULL DEFAULT 'APPROVED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS iqc (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL, lot TEXT NOT NULL, supplier TEXT NOT NULL,
      item TEXT NOT NULL, inspector TEXT NOT NULL DEFAULT '',
      incoming_qty NUMERIC, qty NUMERIC, fail NUMERIC DEFAULT 0,
      items_json JSONB NOT NULL DEFAULT '[]',
      sign_writer JSONB, sign_reviewer JSONB, sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pqc (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL, product TEXT NOT NULL, lot TEXT NOT NULL,
      visual TEXT DEFAULT '', solid TEXT DEFAULT '', particle TEXT DEFAULT '',
      judge TEXT DEFAULT '', qty NUMERIC, fail NUMERIC DEFAULT 0,
      items_json JSONB NOT NULL DEFAULT '[]',
      sign_writer JSONB, sign_reviewer JSONB, sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS oqc (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL, customer TEXT NOT NULL, product TEXT NOT NULL,
      lot TEXT NOT NULL, visual TEXT DEFAULT '', package TEXT DEFAULT '',
      qty TEXT DEFAULT '', fail NUMERIC DEFAULT 0, judge TEXT DEFAULT '',
      items_json JSONB NOT NULL DEFAULT '[]',
      sign_writer JSONB, sign_reviewer JSONB, sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL, manager TEXT DEFAULT '',
      phone TEXT DEFAULT '', category TEXT DEFAULT '', status TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS nonconform (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nc_date DATE NOT NULL, nc_no TEXT DEFAULT '', nc_type TEXT DEFAULT '',
      dept TEXT DEFAULT '', lot TEXT DEFAULT '', item TEXT DEFAULT '',
      qty NUMERIC DEFAULT 0, issue TEXT DEFAULT '', cause TEXT DEFAULT '',
      action TEXT DEFAULT '', action_date DATE, verify TEXT DEFAULT '',
      verify_date DATE, owner TEXT DEFAULT '', status TEXT DEFAULT '미결',
      sign_writer JSONB, sign_reviewer JSONB, sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS worklog (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      work_date DATE NOT NULL, finished_lot TEXT NOT NULL, worker TEXT NOT NULL,
      plan_qty TEXT DEFAULT '', prod_qty TEXT DEFAULT '', fail_qty TEXT DEFAULT '',
      remark TEXT DEFAULT '', flow_set TEXT DEFAULT '', flow_actual TEXT DEFAULT '',
      temp_set TEXT DEFAULT '', temp_actual TEXT DEFAULT '',
      press_set TEXT DEFAULT '', press_actual TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS worklog_materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      worklog_id UUID NOT NULL REFERENCES worklog(id) ON DELETE CASCADE,
      seq INTEGER NOT NULL, material TEXT DEFAULT '', sup_name TEXT DEFAULT '',
      lot_no TEXT DEFAULT '', input_qty TEXT DEFAULT '', input_time TEXT DEFAULT ''
    );
  `);
  const alters = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_writer JSONB`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_approver JSONB`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_writer JSONB`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_approver JSONB`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_writer JSONB`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_approver JSONB`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS package TEXT DEFAULT ''`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'`,
  ];
  for(const s of alters) await db(s).catch(()=>{});
}

/* ─── AUTH ─── */
app.get('/api/test-db', async(_,res)=>{
  try{ const r=await db(`SELECT NOW() AT TIME ZONE 'Asia/Seoul' t`); ok(res,r.rows[0]); }
  catch(e){ fail(res,500,e.message); }
});

app.post('/api/auth/signup', async(req,res)=>{
  try{
    const name=txt(req.body.name), email=txt(req.body.email).toLowerCase();
    const password=txt(req.body.password), department=txt(req.body.department), title=txt(req.body.title);
    if(!name||!email||!password) return fail(res,400,'성명, 이메일, 비밀번호는 필수입니다.');
    if((await db('SELECT id FROM users WHERE email=$1',[email])).rowCount)
      return fail(res,409,'이미 사용 중인 이메일입니다.');
    const hash=await bcrypt.hash(password,10);
    await db(`INSERT INTO users(name,email,password_hash,department,title,role,status)VALUES($1,$2,$3,$4,$5,'user','APPROVED')`,
      [name,email,hash,department,title]);
    ok(res,null,'회원가입이 완료되었습니다.');
  }catch(e){ fail(res,500,e.message); }
});

app.post('/api/auth/login', async(req,res)=>{
  try{
    const email=txt(req.body.email).toLowerCase();
    const r=await db('SELECT * FROM users WHERE email=$1',[email]);
    if(!r.rowCount) return fail(res,401,'이메일 또는 비밀번호가 올바르지 않습니다.');
    const u=r.rows[0];
    if(!(await bcrypt.compare(txt(req.body.password),u.password_hash)))
      return fail(res,401,'이메일 또는 비밀번호가 올바르지 않습니다.');
    if(u.status!=='APPROVED') return fail(res,403,'승인된 계정만 로그인할 수 있습니다.');
    req.session.user=buildUser(u);
    ok(res,{user:req.session.user},'로그인 성공');
  }catch(e){ fail(res,500,e.message); }
});

app.post('/api/auth/logout',(req,res)=>req.session.destroy(()=>ok(res,null,'로그아웃 완료')));

app.get('/api/auth/me',(req,res)=>{
  if(!req.session.user) return fail(res,401,'로그인이 필요합니다.');
  ok(res,req.session.user);
});

app.post('/api/auth/change-password', requireLogin, async(req,res)=>{
  try{
    const cp=txt(req.body.currentPassword), np=txt(req.body.newPassword);
    if(!cp||!np) return fail(res,400,'현재/새 비밀번호를 입력하세요.');
    const r=await db('SELECT * FROM users WHERE id=$1',[req.session.user.id]);
    if(!r.rowCount) return fail(res,404,'사용자를 찾을 수 없습니다.');
    if(!(await bcrypt.compare(cp,r.rows[0].password_hash)))
      return fail(res,400,'현재 비밀번호가 올바르지 않습니다.');
    await db('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(np,10),r.rows[0].id]);
    ok(res,null,'비밀번호가 변경되었습니다.');
  }catch(e){ fail(res,500,e.message); }
});

/* ─── ★ 서명용 사용자 목록 (로그인만 필요) ─── */
app.get('/api/users/signable', requireLogin, async(_,res)=>{
  try{
    const r=await db(`SELECT id,name,department,title,role FROM users WHERE status='APPROVED' ORDER BY name ASC`);
    ok(res,r.rows);
  }catch(e){ fail(res,500,e.message); }
});

/* ─── CRUD helper ─── */
function bindCrud(table, mapper) {
  app.get(`/api/${table}`, requireLogin, async(_,res)=>{
    try{ const r=await db(`SELECT * FROM ${table} ORDER BY created_at DESC`); ok(res,r.rows); }
    catch(e){ fail(res,500,e.message); }
  });
  app.post(`/api/${table}`, requireLogin, async(req,res)=>{
    try{
      const body=mapper(req.body); const keys=Object.keys(body), vals=Object.values(body);
      const r=await db(`INSERT INTO ${table}(${keys.join(',')})VALUES(${keys.map((_,i)=>`$${i+1}`).join(',')})RETURNING *`,vals);
      ok(res,r.rows[0],'저장되었습니다.');
    }catch(e){ fail(res,500,e.message); }
  });
  app.put(`/api/${table}/:id`, requireLogin, async(req,res)=>{
    try{
      const body=mapper(req.body); const keys=Object.keys(body), vals=Object.values(body);
      const r=await db(`UPDATE ${table} SET ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id=$${keys.length+1} RETURNING *`,[...vals,req.params.id]);
      if(!r.rowCount) return fail(res,404,'데이터를 찾을 수 없습니다.');
      ok(res,r.rows[0],'수정되었습니다.');
    }catch(e){ fail(res,500,e.message); }
  });
  app.delete(`/api/${table}/:id`, requireLogin, async(req,res)=>{
    try{
      const r=await db(`DELETE FROM ${table} WHERE id=$1 RETURNING id`,[req.params.id]);
      if(!r.rowCount) return fail(res,404,'데이터를 찾을 수 없습니다.');
      ok(res,null,'삭제되었습니다.');
    }catch(e){ fail(res,500,e.message); }
  });
}

bindCrud('iqc', b=>({
  date:txt(b.date), lot:txt(b.lot), supplier:txt(b.supplier),
  item:txt(b.item), inspector:txt(b.inspector||(b.signWriter?.name)||''),
  incoming_qty:num(b.incomingQty), qty:num(b.checkQty??b.qty),
  fail:num(b.failQty)??0,
  items_json:JSON.stringify(arr(b.items)),
  sign_writer:signJ(b.signWriter), sign_reviewer:signJ(b.signReviewer), sign_approver:signJ(b.signApprover),
}));

bindCrud('pqc', b=>{
  const items=arr(b.items);
  return {
    date:txt(b.date), product:txt(b.product), lot:txt(b.lot),
    visual:txt(b.visual), solid:txt(b.solid||(b.signWriter?.name)||''),
    particle:txt(b.particle), judge:txt(b.judge)||calcJudge(items),
    qty:num(b.qty), fail:num(b.failQty)??0,
    items_json:JSON.stringify(items),
    sign_writer:signJ(b.signWriter), sign_reviewer:signJ(b.signReviewer), sign_approver:signJ(b.signApprover),
  };
});

bindCrud('oqc', b=>{
  const items=arr(b.items);
  return {
    date:txt(b.date), customer:txt(b.customer), product:txt(b.product),
    lot:txt(b.lot), visual:txt(b.visual||(b.signWriter?.name)||''),
    package:txt(b.package), qty:txt(b.qty??''), fail:num(b.failQty)??0,
    judge:txt(b.judge)||calcJudge(items),
    items_json:JSON.stringify(items),
    sign_writer:signJ(b.signWriter), sign_reviewer:signJ(b.signReviewer), sign_approver:signJ(b.signApprover),
  };
});

bindCrud('suppliers', b=>({
  name:txt(b.name), manager:txt(b.manager),
  phone:txt(b.phone), category:txt(b.category), status:txt(b.status),
}));

bindCrud('nonconform', b=>({
  nc_date:txt(b.ncDate)||null, nc_no:txt(b.ncNo), nc_type:txt(b.ncType),
  dept:txt(b.dept), lot:txt(b.lot), item:txt(b.item), qty:num(b.qty)??0,
  issue:txt(b.issue), cause:txt(b.cause), action:txt(b.action),
  action_date:txt(b.actionDate)||null, verify:txt(b.verify),
  verify_date:txt(b.verifyDate)||null, owner:txt(b.owner), status:txt(b.status)||'미결',
  sign_writer:signJ(b.signWriter), sign_reviewer:signJ(b.signReviewer), sign_approver:signJ(b.signApprover),
}));

/* ─── WORKLOG ─── */
app.get('/api/worklog', requireLogin, async(_,res)=>{
  try{
    const r=await db('SELECT * FROM worklog ORDER BY created_at DESC');
    const ids=r.rows.map(x=>x.id);
    let mats=[];
    if(ids.length){
      mats=(await db('SELECT * FROM worklog_materials WHERE worklog_id=ANY($1::uuid[]) ORDER BY seq',[ids])).rows;
    }
    ok(res, r.rows.map(row=>({
      id:row.id, workDate:row.work_date, finishedLot:row.finished_lot,
      worker:row.worker, planQty:row.plan_qty, prodQty:row.prod_qty,
      failQty:row.fail_qty, remark:row.remark,
      flowSet:row.flow_set, flowActual:row.flow_actual,
      tempSet:row.temp_set, tempActual:row.temp_actual,
      pressSet:row.press_set, pressActual:row.press_actual,
      materials:mats.filter(m=>m.worklog_id===row.id).map(m=>({
        seq:m.seq, material:m.material, supName:m.sup_name,
        lotNo:m.lot_no, inputQty:m.input_qty, inputTime:m.input_time,
      })),
    })));
  }catch(e){ fail(res,500,e.message); }
});

async function saveWorklogMats(client, wid, materials) {
  for(let i=0;i<arr(materials).length;i++){
    const m=materials[i];
    await client.query(
      `INSERT INTO worklog_materials(worklog_id,seq,material,sup_name,lot_no,input_qty,input_time)VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [wid,i+1,txt(m.material),txt(m.supName),txt(m.lotNo),txt(m.inputQty),txt(m.inputTime)]
    );
  }
}

app.post('/api/worklog', requireLogin, async(req,res)=>{
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const b=req.body||{};
    const ins=await client.query(
      `INSERT INTO worklog(work_date,finished_lot,worker,plan_qty,prod_qty,fail_qty,remark,flow_set,flow_actual,temp_set,temp_actual,press_set,press_actual)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)RETURNING id`,
      [txt(b.workDate),txt(b.finishedLot),txt(b.worker),txt(b.planQty),txt(b.prodQty),txt(b.failQty),txt(b.remark),txt(b.flowSet),txt(b.flowActual),txt(b.tempSet),txt(b.tempActual),txt(b.pressSet),txt(b.pressActual)]
    );
    await saveWorklogMats(client, ins.rows[0].id, b.materials);
    await client.query('COMMIT');
    ok(res,{id:ins.rows[0].id},'저장되었습니다.');
  }catch(e){ await client.query('ROLLBACK'); fail(res,500,e.message); }
  finally{ client.release(); }
});

app.put('/api/worklog/:id', requireLogin, async(req,res)=>{
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const b=req.body||{};
    const upd=await client.query(
      `UPDATE worklog SET work_date=$1,finished_lot=$2,worker=$3,plan_qty=$4,prod_qty=$5,fail_qty=$6,remark=$7,flow_set=$8,flow_actual=$9,temp_set=$10,temp_actual=$11,press_set=$12,press_actual=$13 WHERE id=$14 RETURNING id`,
      [txt(b.workDate),txt(b.finishedLot),txt(b.worker),txt(b.planQty),txt(b.prodQty),txt(b.failQty),txt(b.remark),txt(b.flowSet),txt(b.flowActual),txt(b.tempSet),txt(b.tempActual),txt(b.pressSet),txt(b.pressActual),req.params.id]
    );
    if(!upd.rowCount){ await client.query('ROLLBACK'); return fail(res,404,'작업일지를 찾을 수 없습니다.'); }
    await client.query('DELETE FROM worklog_materials WHERE worklog_id=$1',[req.params.id]);
    await saveWorklogMats(client, req.params.id, b.materials);
    await client.query('COMMIT');
    ok(res,null,'수정되었습니다.');
  }catch(e){ await client.query('ROLLBACK'); fail(res,500,e.message); }
  finally{ client.release(); }
});

app.delete('/api/worklog/:id', requireLogin, async(req,res)=>{
  try{
    const r=await db('DELETE FROM worklog WHERE id=$1 RETURNING id',[req.params.id]);
    if(!r.rowCount) return fail(res,404,'작업일지를 찾을 수 없습니다.');
    ok(res,null,'삭제되었습니다.');
  }catch(e){ fail(res,500,e.message); }
});

/* ─── TRACE ─── */
app.get('/api/trace', requireLogin, async(req,res)=>{
  try{
    const kw=`%${txt(req.query.keyword).toLowerCase()}%`;
    const r=await db(
      `SELECT w.work_date,w.finished_lot,w.worker,m.seq,m.material,m.sup_name,m.lot_no,m.input_qty,m.input_time
       FROM worklog w LEFT JOIN worklog_materials m ON w.id=m.worklog_id
       WHERE LOWER(w.finished_lot) LIKE $1 OR LOWER(m.lot_no) LIKE $1 OR LOWER(m.material) LIKE $1
       ORDER BY w.work_date DESC,m.seq`,[kw]);
    ok(res,r.rows.map(x=>({workDate:x.work_date,finishedLot:x.finished_lot,worker:x.worker,seq:x.seq,material:x.material,supName:x.sup_name,lotNo:x.lot_no,inputQty:x.input_qty,inputTime:x.input_time})));
  }catch(e){ fail(res,500,e.message); }
});

/* ─── ADMIN USERS ─── */
app.get('/api/admin/users', requireAdmin, async(_,res)=>{
  try{
    const r=await db(`SELECT id,name,email,department,title,role,status,created_at FROM users ORDER BY created_at DESC`);
    ok(res,r.rows);
  }catch(e){ fail(res,500,e.message); }
});
app.post('/api/admin/users', requireAdmin, async(req,res)=>{
  try{
    const name=txt(req.body.name), email=txt(req.body.email).toLowerCase();
    const department=txt(req.body.department), title=txt(req.body.title);
    const role=txt(req.body.role)||'user', status=txt(req.body.status)||'APPROVED';
    if(!name||!email) return fail(res,400,'성명과 이메일은 필수입니다.');
    if((await db('SELECT id FROM users WHERE email=$1',[email])).rowCount)
      return fail(res,409,'이미 사용 중인 이메일입니다.');
    const hash=await bcrypt.hash(txt(req.body.password)||'1234',10);
    const r=await db(`INSERT INTO users(name,email,password_hash,department,title,role,status)VALUES($1,$2,$3,$4,$5,$6,$7)RETURNING id,name,email,department,title,role,status,created_at`,
      [name,email,hash,department,title,role,status]);
    ok(res,r.rows[0],'회원이 추가되었습니다.');
  }catch(e){ fail(res,500,e.message); }
});
app.put('/api/admin/users/:id', requireAdmin, async(req,res)=>{
  try{
    const name=txt(req.body.name), email=txt(req.body.email).toLowerCase();
    const department=txt(req.body.department), title=txt(req.body.title);
    const role=txt(req.body.role)||'user', status=txt(req.body.status)||'APPROVED';
    if(!name||!email) return fail(res,400,'성명과 이메일은 필수입니다.');
    if((await db('SELECT id FROM users WHERE email=$1 AND id<>$2',[email,req.params.id])).rowCount)
      return fail(res,409,'이미 사용 중인 이메일입니다.');
    const r=await db(`UPDATE users SET name=$1,email=$2,department=$3,title=$4,role=$5,status=$6 WHERE id=$7 RETURNING id,name,email,department,title,role,status,created_at`,
      [name,email,department,title,role,status,req.params.id]);
    if(!r.rowCount) return fail(res,404,'회원을 찾을 수 없습니다.');
    if(req.session.user?.id===req.params.id)
      req.session.user={...req.session.user,name,email,department,title,role,status};
    ok(res,r.rows[0],'수정되었습니다.');
  }catch(e){ fail(res,500,e.message); }
});
app.delete('/api/admin/users/:id', requireAdmin, async(req,res)=>{
  try{ await db('DELETE FROM users WHERE id=$1',[req.params.id]); ok(res,null,'삭제되었습니다.'); }
  catch(e){ fail(res,500,e.message); }
});

/* ─── SPA ─── */
app.get('*',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

/* ─── START ─── */
ensureSchema().then(async()=>{
  const adminEmail=(process.env.ADMIN_EMAIL||'admin@namochemical.com').toLowerCase();
  const adminPwd=process.env.ADMIN_PASSWORD||'admin1234!';
  const hash=await bcrypt.hash(adminPwd,10);
  const ex=await db('SELECT id FROM users WHERE email=$1',[adminEmail]);
  if(!ex.rowCount){
    await db(`INSERT INTO users(name,email,password_hash,department,title,role,status)VALUES($1,$2,$3,$4,$5,'admin','APPROVED')`,
      ['관리자',adminEmail,hash,'관리부','관리자']);
  } else {
    await db(`UPDATE users SET password_hash=$1,name='관리자',department='관리부',title='관리자',role='admin',status='APPROVED' WHERE email=$2`,
      [hash,adminEmail]);
  }
  app.listen(port,()=>console.log(`QMS :${port}`));
}).catch(e=>{ console.error(e); process.exit(1); });
