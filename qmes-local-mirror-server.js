'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const HOST = String(process.env.HOST || '127.0.0.1');
const UPSTREAM = new URL(process.env.QMES_UPSTREAM || 'https://qmes.namochemical.com');
const ALLOW_LIVE_WRITES = String(process.env.NAMO_TEST_ALLOW_LIVE_WRITES || '') === '1';
const ENTERPRISE_DASHBOARD = path.join(ROOT,'public','js','dashboard-namo-enterprise-20260903.jsx');
const ROUTER = path.join(ROOT,'public','js','router.jsx');

function branchName(){try{return execFileSync('git',['branch','--show-current'],{cwd:ROOT,encoding:'utf8'}).trim();}catch(_){return '';}}
function pathnameOf(value){try{return decodeURIComponent(new URL(value||'/','http://localhost').pathname);}catch(_){return '/';}}
function noStore(extra={}){return {'cache-control':'no-store, no-cache, must-revalidate, max-age=0',pragma:'no-cache',expires:'0',...extra};}
function sendText(req,res,status,type,text,extra={}){const body=Buffer.from(String(text),'utf8');res.writeHead(status,noStore({'content-type':type,'content-length':body.length,...extra}));if(req.method==='HEAD')return res.end();res.end(body);}
function rewriteSetCookie(value){if(!value)return value;const list=Array.isArray(value)?value:[value];return list.map(cookie=>String(cookie).replace(/;\s*Domain=[^;]+/ig,'').replace(/;\s*Secure/ig,'').replace(/SameSite=None/ig,'SameSite=Lax'));}
function isSafeAuthWrite(req){return String(req.method||'').toUpperCase()==='POST'&&/^\/api\/auth\/(login|logout)\/?(?:\?|$)/.test(req.url||'');}
function isBlockedWrite(req){const method=String(req.method||'GET').toUpperCase();if(ALLOW_LIVE_WRITES)return false;if(['GET','HEAD','OPTIONS'].includes(method))return false;return !isSafeAuthWrite(req);}
function trackedText(relPath,fallbackPath){
  try{return execFileSync('git',['show','HEAD:'+relPath],{cwd:ROOT,encoding:'utf8'});}catch(_error){return fs.readFileSync(fallbackPath,'utf8');}
}

function patchedDashboard(){
  let source=fs.readFileSync(ENTERPRISE_DASHBOARD,'utf8');

  source=source.replace('ERP → MES 통합 업무 흐름','통합업무 흐름');

  source=source.replace(
    'function monthlyShipping(rows){var now=new Date(),months=[];for(var i=5;i>=0;i-=1){var d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:monthKey(d),label:(d.getMonth()+1)+"월",value:0});}',
    'function monthlyShipping(rows){var now=new Date(),months=[];for(var i=0;i<12;i+=1){var d=new Date(now.getFullYear(),i,1);months.push({key:monthKey(d),label:(i+1)+"월",value:0});}'
  );

  source=source.replace(
    '.ned-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.72fr);gap:14px;align-items:start}',
    '.ned-layout{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(0,1.05fr) minmax(285px,.72fr);gap:14px;align-items:stretch}.ned-left{display:contents}.ned-left>.ned-panel{grid-column:1/-1;min-width:0}.ned-right{display:contents}'
  );
  source=source.replace(
    '.ned-split{display:grid;grid-template-columns:1.08fr .92fr;gap:14px;margin-top:14px}',
    '.ned-split{display:contents}'
  );
  source=source.replace(
    '.ned-task-panel{min-height:100%}',
    '.ned-task-panel{min-height:278px;height:278px;display:flex;flex-direction:column}.ned-tasks{flex:1 1 auto;min-height:0;overflow:auto}'
  );
  source=source.replace(
    '.ned-table-wrap{overflow:auto}',
    '.ned-table-wrap{overflow:auto;flex:1 1 auto;min-height:0}.ned-split>.ned-panel{min-width:0;min-height:278px;height:278px;display:flex;flex-direction:column}.ned-split>.ned-panel>header{flex:0 0 auto}.ned-split>.ned-panel .ned-chart{flex:1 1 auto;height:auto;min-height:210px;padding:14px 12px 18px}'
  );

  source=source.replace(
    '@media(max-width:1200px){.namo-enterprise-dashboard{margin:-20px -16px -30px;padding-left:16px;padding-right:16px}.ned-page-head{margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px}.ned-kpis{grid-template-columns:repeat(3,1fr)}.ned-layout{grid-template-columns:1fr}.ned-split{grid-template-columns:1fr 1fr}}',
    '@media(max-width:1200px){.namo-enterprise-dashboard{margin:-20px -16px -30px;padding-left:16px;padding-right:16px}.ned-page-head{margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px}.ned-kpis{grid-template-columns:repeat(3,1fr)}.ned-layout{grid-template-columns:1fr 1fr}.ned-left,.ned-right,.ned-split{display:contents}.ned-left>.ned-panel{grid-column:1/-1}.ned-task-panel{grid-column:1/-1;height:auto;min-height:220px}.ned-split>.ned-panel{height:auto;min-height:240px}}'
  );

  return source;
}

function patchedRouter(){
  let source=trackedText('public/js/router.jsx',ROUTER);
  const pattern=/function qmesCanAccessCommercialErp\(user\)\{[\s\S]*?\n\}/;
  const replacement=`function qmesCanAccessCommercialErp(user){
  const name=String(user?.name||"").replace(/\\s+/g,"").trim();
  const role=String(user?.role||"").replace(/\\s+/g,"").trim().toLowerCase();
  const dept=String(user?.department||user?.dept||"").replace(/\\s+/g,"").trim();
  if(role==="admin"||name==="관리자")return true;
  return dept==="영업부"||["김종혁","김세희","정영기"].includes(name);
}`;
  if(!pattern.test(source))throw new Error('commercial ERP access function not found in router.jsx');
  return source.replace(pattern,replacement);
}

function proxy(req,res){
  if(isBlockedWrite(req))return sendText(req,res,409,'application/json; charset=utf-8',JSON.stringify({success:false,code:'QMES_TEST_LIVE_WRITE_BLOCKED',message:'TEST 보호모드입니다. 운영 데이터 변경은 차단되었습니다.'}));
  const headers={...req.headers,host:UPSTREAM.host,origin:UPSTREAM.origin,referer:`${UPSTREAM.origin}${req.url||'/'}`,connection:'close'};
  delete headers['proxy-connection']; delete headers['accept-encoding'];
  const upstreamReq=https.request({protocol:UPSTREAM.protocol,hostname:UPSTREAM.hostname,port:UPSTREAM.port||443,method:req.method,path:req.url,headers,family:4,agent:false},upstreamRes=>{
    const out={...upstreamRes.headers};delete out.connection;delete out['transfer-encoding'];delete out['strict-transport-security'];delete out['content-encoding'];Object.assign(out,noStore({'x-namo-test-source':'production-mirror'}));if(out['set-cookie'])out['set-cookie']=rewriteSetCookie(out['set-cookie']);if(out.location)out.location=String(out.location).replace(UPSTREAM.origin,`http://${HOST}:${PORT}`);res.writeHead(upstreamRes.statusCode||502,out);upstreamRes.pipe(res);
  });
  upstreamReq.setTimeout(20000,()=>upstreamReq.destroy(new Error('QMES upstream timeout')));
  upstreamReq.on('error',error=>{if(!res.headersSent)sendText(req,res,502,'application/json; charset=utf-8',JSON.stringify({success:false,message:error.message}));else res.end();});
  req.pipe(upstreamReq);
}

const server=http.createServer((req,res)=>{
  const pathname=pathnameOf(req.url||'/');
  if((req.method==='GET'||req.method==='HEAD') && pathname==='/js/dashboard.jsx'){
    try{return sendText(req,res,200,'text/javascript; charset=utf-8',patchedDashboard(),{'x-namo-test-source':'patched-enterprise-dashboard-v2'});}catch(error){return sendText(req,res,500,'text/plain; charset=utf-8',error.stack||error.message);}
  }
  if((req.method==='GET'||req.method==='HEAD') && pathname==='/js/router.jsx'){
    try{return sendText(req,res,200,'text/javascript; charset=utf-8',patchedRouter(),{'x-namo-test-source':'patched-router-admin-access-v3'});}catch(error){return sendText(req,res,500,'text/plain; charset=utf-8',error.stack||error.message);}
  }
  if(pathname==='/_qmes_test/status')return sendText(req,res,200,'application/json; charset=utf-8',JSON.stringify({mode:'PRODUCTION MIRROR + APPROVED DASHBOARD LAYOUT + ADMIN ACCESS V3',upstream:UPSTREAM.origin,branch:branchName(),liveWritesAllowed:ALLOW_LIVE_WRITES},null,2));
  return proxy(req,res);
});

server.listen(PORT,HOST,()=>{
  console.log('');
  console.log('============================================================');
  console.log(' NAMO QMES TEST - APPROVED DASHBOARD + ADMIN ACCESS V3');
  console.log(` http://localhost:${PORT}`);
  console.log(` branch: ${branchName()||'(unknown)'}`);
  console.log(' screen/assets: mirrored from production QMES');
  console.log(' dashboard.jsx: approved TEST layout patch');
  console.log(' router.jsx: administrator access check patched from tracked branch source');
  console.log(` live data writes: ${ALLOW_LIVE_WRITES?'ENABLED':'BLOCKED (safe mode)'}`);
  console.log('============================================================');
  console.log('');
});

server.on('error',error=>{if(error&&error.code==='EADDRINUSE'){console.error(`Port ${PORT} is already in use. Stop the old TEST server with Ctrl+C, then retry.`);process.exit(1);}throw error;});
