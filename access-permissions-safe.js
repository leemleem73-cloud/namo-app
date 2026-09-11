'use strict';
const express=require('express');
const fs=require('fs');
const path=require('path');
const{Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
const requireAdmin=(req,res,next)=>String(req.session?.user?.role||'').toLowerCase()==='admin'?next():fail(res,403,'시스템 관리자 전용 기능입니다.');

const ALL_MENU_KEYS=[
  'dashboard','spcDashboard',
  'erpSales','erpPlan','erpPurchase','inventoryOverview','inventoryMovement','inventoryLot','inventoryProduction','inventoryCount','partners',
  'production','workorder','prodProcess','iqc','pqc','oqc','spc','qualityLock','coa','trace','erpShipping','ncr','complaints','change4m','fieldInput','equipment'
];
const DEPARTMENT_DEFAULTS={
  '품질부':['dashboard','spcDashboard','iqc','pqc','oqc','spc','qualityLock','coa','trace','ncr','complaints','change4m'],
  '생산부':['dashboard','production','workorder','prodProcess','inventoryOverview','inventoryMovement','inventoryLot','inventoryProduction','inventoryCount'],
  '영업부':['dashboard','erpSales','erpShipping','partners'],
  '연구소':['dashboard','iqc','pqc','oqc','spc','trace'],
  '관리부':['dashboard'],
  '경영지원부':['dashboard'],
  '대표':['dashboard']
};
const allowedSet=new Set(ALL_MENU_KEYS);
let tableReady=null;
function ensureTable(){
  if(!tableReady){
    tableReady=pool.query(`CREATE TABLE IF NOT EXISTS qmes_menu_permissions(
      user_id TEXT PRIMARY KEY,
      department_default BOOLEAN NOT NULL DEFAULT TRUE,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch(error=>{tableReady=null;throw error;});
  }
  return tableReady;
}
const sanitizePermissions=value=>[...new Set((Array.isArray(value)?value:[]).map(v=>String(v||'').trim()).filter(v=>allowedSet.has(v)))];
const baseForDepartment=department=>DEPARTMENT_DEFAULTS[String(department||'').trim()]||['dashboard'];
const effectiveFor=(user,row)=>{
  if(String(user?.role||'').toLowerCase()==='admin')return ['*'];
  const extras=sanitizePermissions(row?.permissions);
  const base=row?.department_default===false?[]:baseForDepartment(user?.department);
  return [...new Set([...base,...extras,'dashboard'])];
};
async function readPermissionForUser(user){
  await ensureTable();
  const result=await pool.query('SELECT department_default,permissions,updated_at FROM qmes_menu_permissions WHERE user_id=$1',[String(user.id)]);
  const row=result.rows[0]||{department_default:true,permissions:[]};
  return{
    user:{id:user.id,name:user.name||'',department:user.department||'',title:user.title||'',role:user.role||'user'},
    systemAdmin:String(user.role||'').toLowerCase()==='admin',
    departmentDefault:row.department_default!==false,
    departmentDefaults:baseForDepartment(user.department),
    permissions:sanitizePermissions(row.permissions),
    effective:effectiveFor(user,row),
    updatedAt:row.updated_at||null
  };
}

function installClient(){
  try{
    const indexFile=path.resolve(__dirname,'public','index.html');
    if(!fs.existsSync(indexFile))return;
    let html=fs.readFileSync(indexFile,'utf8');
    html=html.replace(/\n?\s*<script src="\.\/js\/qmes-access-me-request-guard-20260911\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace(/\n?\s*<script src="\.\/js\/qmes-access-permissions-20260910\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace('</body>','  <script src="./js/qmes-access-me-request-guard-20260911.js?v=20260911-guard1"></script>\n  <script src="./js/qmes-access-permissions-20260910.js?v=20260910-access-v1"></script>\n</body>');
    fs.writeFileSync(indexFile,html,'utf8');
    console.log('[QMES access] request guard + permission client installed');
  }catch(error){console.error('[QMES access] client install failed',error);}
}
installClient();

function install(app){
  if(app.__namoAccessPermissionsInstalled)return;
  app.__namoAccessPermissionsInstalled=true;

  app.get('/api/access/me',requireLogin,async(req,res)=>{
    try{return ok(res,await readPermissionForUser(req.session.user));}
    catch(error){console.error('[QMES access] me',error);return fail(res,500,'접근권한을 불러오지 못했습니다.');}
  });

  app.get('/api/access/users/by-name',requireLogin,requireAdmin,async(req,res)=>{
    try{
      const name=String(req.query.name||'').trim();
      if(!name)return fail(res,400,'직원 이름이 필요합니다.');
      const result=await pool.query(`SELECT id,name,email,department,title,role,status FROM users WHERE name=$1 ORDER BY created_at DESC LIMIT 1`,[name]);
      if(!result.rowCount)return fail(res,404,'회원을 찾을 수 없습니다.');
      return ok(res,await readPermissionForUser(result.rows[0]));
    }catch(error){console.error('[QMES access] user read',error);return fail(res,500,'직원 접근권한을 불러오지 못했습니다.');}
  });

  app.put('/api/access/users/by-name',requireLogin,requireAdmin,async(req,res)=>{
    try{
      const name=String(req.query.name||'').trim();
      if(!name)return fail(res,400,'직원 이름이 필요합니다.');
      const result=await pool.query(`SELECT id,name,email,department,title,role,status FROM users WHERE name=$1 ORDER BY created_at DESC LIMIT 1`,[name]);
      if(!result.rowCount)return fail(res,404,'회원을 찾을 수 없습니다.');
      const user=result.rows[0];
      if(String(user.role||'').toLowerCase()==='admin')return fail(res,400,'시스템 관리자는 모든 메뉴가 자동 허용됩니다.');
      const departmentDefault=req.body?.departmentDefault!==false;
      const permissions=sanitizePermissions(req.body?.permissions);
      await ensureTable();
      await pool.query(`INSERT INTO qmes_menu_permissions(user_id,department_default,permissions,updated_at)
        VALUES($1,$2,$3::jsonb,NOW())
        ON CONFLICT(user_id) DO UPDATE SET department_default=EXCLUDED.department_default,permissions=EXCLUDED.permissions,updated_at=NOW()`,
        [String(user.id),departmentDefault,JSON.stringify(permissions)]);
      return ok(res,await readPermissionForUser(user),'접근권한이 저장되었습니다.');
    }catch(error){console.error('[QMES access] user save',error);return fail(res,500,'접근권한 저장에 실패했습니다.');}
  });

  app.use('/api/admin/users/:id',async(req,res,next)=>{
    if(req.method!=='PUT'||!req.session?.user||String(req.session.user.role||'').toLowerCase()!=='admin')return next();
    try{
      const current=await pool.query('SELECT role FROM users WHERE id=$1',[req.params.id]);
      if(current.rowCount&&req.body)req.body.role=current.rows[0].role||'user';
    }catch(error){console.warn('[QMES access] role preservation skipped',error.message);}
    next();
  });
}

const originalUse=express.application.use;
express.application.use=function qmesAccessPermissionsUse(...args){
  const result=originalUse.apply(this,args);
  if(!this.__namoAccessPermissionsInstalled){
    const fns=args.flat().filter(v=>typeof v==='function');
    if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){
      install(this);
      console.log('[QMES access] routes installed');
    }
  }
  return result;
};
module.exports={installAccessPermissions:install};
