'use strict';

/* NAMO QMES - Guest demo isolation (add-only, 2026-09-18) */
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

if (!express.__NAMO_GUEST_DEMO_SAFE_20260918__) {
  express.__NAMO_GUEST_DEMO_SAFE_20260918__ = true;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  });

  const ALL_MENU_KEYS = [
    'dashboard','spcDashboard',
    'erpSales','erpPlan','erpPurchase','inventoryOverview','inventoryMovement','inventoryLot','inventoryProduction','inventoryCount','partners',
    'production','workorder','prodProcess','iqc','pqc','oqc','spc','qualityLock','coa','trace','erpShipping','ncr','complaints','change4m','fieldInput','equipment'
  ];

  const clean = value => String(value == null ? '' : value).trim();
  const lower = value => clean(value).toLowerCase();
  const isGuest = user => Boolean(user) && (
    lower(user.role) === 'guest' ||
    lower(user.uid) === 'guest' ||
    lower(user.name) === 'guest' ||
    lower(user.email) === 'guest@namochemical.local'
  );
  const ok = (res, data = null, message = 'OK') => res.json({ success:true, message, data });

  function guestRead(req, res) {
    const p = String(req.path || req.originalUrl || '').split('?')[0];

    if (p === '/api/access/me') {
      return ok(res, {
        user:{ id:req.session.user.id, name:'guest', department:'GUEST', title:'DEMO', role:'guest' },
        systemAdmin:false,
        departmentDefault:false,
        departmentDefaults:[],
        permissions:ALL_MENU_KEYS,
        effective:ALL_MENU_KEYS,
        updatedAt:null,
        guestDemo:true
      });
    }

    if (p === '/api/dashboard/kpi') {
      return ok(res, {
        iqcCount:0,pqcCount:0,oqcCount:0,
        iqcFailQty:0,pqcFailQty:0,oqcFailQty:0,
        ncrOpen:0,supplierCount:0,instrumentDue:0,trainingCount:0
      });
    }

    if (p === '/api/inventory/summary') {
      return ok(res, { totals:[], safetyAlerts:[], expiryAlerts:[], pendingLots:0 });
    }

    if (p === '/api/inventory/health') {
      return ok(res, { database:'isolated', module:'inventory', guestDemo:true });
    }

    if (p === '/api/attendance/me') {
      const u=req.session.user;
      return ok(res,{
        user:{id:u.id,uid:'guest',name:'guest',email:u.email||'',department:'GUEST',title:'DEMO',role:'guest',status:'APPROVED',hireDate:'',mustChangePassword:false},
        balance:{granted:0,used:0,remaining:0},
        passkeyCount:0,
        profile:{annualLeaveDays:0,mobileEnabled:false,approver1:null,approver2:null}
      });
    }

    if (p === '/api/attendance/today') return ok(res,null);
    if (/^\/api\/shipping-details\//.test(p)) {
      return ok(res,{shipment:{},quality:{},documents:{},progress:[],timeline:[]});
    }
    if (/^\/api\/certificate\//.test(p)) {
      return res.status(404).json({success:false,message:'Guest 데모에는 등록된 성적서가 없습니다.',data:null});
    }

    return ok(res,[]);
  }

  function guestIsolation(req,res,next){
    if(!isGuest(req.session && req.session.user)) return next();
    const p=String(req.path || req.originalUrl || '').split('?')[0];
    if(p === '/api/auth/me' || p === '/api/auth/logout') return next();
    if(!p.startsWith('/api/')) return next();

    if(req.method === 'GET' || req.method === 'HEAD') return guestRead(req,res);

    return ok(res,null,'Guest 데모 모드: 운영 데이터에는 저장되지 않았습니다.');
  }

  let installed=false;
  const baseUse=express.application.use;
  express.application.use=function qmesGuestDemoUse(...args){
    const result=baseUse.apply(this,args);
    if(!installed){
      const fns=args.flat().filter(v=>typeof v==='function');
      if(fns.some(fn=>/session/i.test(String(fn.name||'')))){
        installed=true;
        baseUse.call(this,guestIsolation);
        console.log('[QMES guest] isolated API mode installed');
      }
    }
    return result;
  };

  async function ensureGuest(){
    const hash='$2b$10$UPpNvIYAxbpvotQHnu615.tYASnA.rQv6RrTE3MdQcNQB7WSRfDQS';
    const found=await pool.query(
      `SELECT id FROM users
        WHERE LOWER(COALESCE(uid,''))='guest'
           OR LOWER(COALESCE(name,''))='guest'
           OR LOWER(COALESCE(email,''))='guest@namochemical.local'
        ORDER BY created_at ASC LIMIT 1`
    );

    if(found.rowCount){
      await pool.query(
        `UPDATE users SET
           uid='guest',name='guest',email='guest@namochemical.local',
           password_hash=$1,department='GUEST',title='DEMO',
           role='guest',status='APPROVED',must_change_password=FALSE
         WHERE id=$2`,
        [hash,found.rows[0].id]
      );
    }else{
      await pool.query(
        `INSERT INTO users
         (uid,name,email,password_hash,department,title,role,status,must_change_password)
         VALUES('guest','guest','guest@namochemical.local',$1,'GUEST','DEMO','guest','APPROVED',FALSE)`,
        [hash]
      );
    }
    console.log('[QMES guest] demo account ensured');
  }

  const baseListen=express.application.listen;
  express.application.listen=function qmesGuestListen(...args){
    const app=this;
    ensureGuest()
      .then(()=>baseListen.apply(app,args))
      .catch(error=>{console.error('[QMES guest] setup failed:',error.message);process.exit(1);});
    return app;
  };
}

module.exports={};
