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
const COMMON_UI_PATH = '/qmes-test-common-ui.css';

const COMMON_UI_CSS = `
:root{
  --qmes-table-blue-top:#7fb5d8;
  --qmes-table-blue-bottom:#639fc9;
  --qmes-table-border:#d7e3ec;
  --qmes-table-line:#e7eef4;
  --qmes-table-text:#213547;
  --qmes-table-hover:#f4f9fd;
}

/* QMES TEST common list/table standard */
main table,#main table,#content table,.content table,.main-content table,.page-content table,.app-content table,.qmes-content table,table.qmes-table,table.data-table,table.list-table,table.erp-table,table.inventory-table{
  width:100% !important;border-collapse:separate !important;border-spacing:0 !important;background:#fff !important;border:1px solid var(--qmes-table-border) !important;border-radius:10px !important;overflow:hidden !important;box-shadow:0 1px 3px rgba(31,55,76,.05) !important;
}
main table thead tr,#main table thead tr,#content table thead tr,.content table thead tr,.main-content table thead tr,.page-content table thead tr,.app-content table thead tr,.qmes-content table thead tr,table.qmes-table thead tr,table.data-table thead tr,table.list-table thead tr,table.erp-table thead tr,table.inventory-table thead tr{
  background:linear-gradient(180deg,var(--qmes-table-blue-top) 0%,var(--qmes-table-blue-bottom) 100%) !important;
}
main table thead th,#main table thead th,#content table thead th,.content table thead th,.main-content table thead th,.page-content table thead th,.app-content table thead th,.qmes-content table thead th,table.qmes-table thead th,table.data-table thead th,table.list-table thead th,table.erp-table thead th,table.inventory-table thead th{
  background:linear-gradient(180deg,var(--qmes-table-blue-top) 0%,var(--qmes-table-blue-bottom) 100%) !important;color:#fff !important;font-weight:700 !important;font-size:13px !important;line-height:1.25 !important;text-align:center !important;vertical-align:middle !important;height:42px !important;padding:10px 12px !important;border-top:0 !important;border-bottom:0 !important;border-right:1px solid rgba(255,255,255,.36) !important;white-space:nowrap !important;
}
main table tbody td,#main table tbody td,#content table tbody td,.content table tbody td,.main-content table tbody td,.page-content table tbody td,.app-content table tbody td,.qmes-content table tbody td,table.qmes-table tbody td,table.data-table tbody td,table.list-table tbody td,table.erp-table tbody td,table.inventory-table tbody td{
  background:#fff !important;color:var(--qmes-table-text) !important;font-size:13px !important;line-height:1.35 !important;text-align:center !important;vertical-align:middle !important;min-height:44px !important;padding:12px !important;border-top:1px solid var(--qmes-table-line) !important;border-right:1px solid #eef3f7 !important;
}
main table tbody td:last-child,#main table tbody td:last-child,#content table tbody td:last-child,.content table tbody td:last-child,.main-content table tbody td:last-child,.page-content table tbody td:last-child,.app-content table tbody td:last-child,.qmes-content table tbody td:last-child{border-right:0 !important;}
main table tbody tr:hover td,#main table tbody tr:hover td,#content table tbody tr:hover td,.content table tbody tr:hover td,.main-content table tbody tr:hover td,.page-content table tbody tr:hover td,.app-content table tbody tr:hover td,.qmes-content table tbody tr:hover td{background:var(--qmes-table-hover) !important;}
.badge,.status,.status-badge,[class*="status-"]{border-radius:999px;}

/* Main dashboard readability */
.namo-enterprise-dashboard{color:#2f4354 !important;}
.namo-enterprise-dashboard .ned-breadcrumb{font-size:12px !important;color:#607586 !important;}
.namo-enterprise-dashboard .ned-page-head h1{font-size:24px !important;color:#244f70 !important;}
.namo-enterprise-dashboard .ned-head-actions{display:none !important;}
.namo-enterprise-dashboard .ned-head-actions button,.namo-enterprise-dashboard .ned-panel header button{font-size:12px !important;font-weight:850 !important;}
.namo-enterprise-dashboard .ned-kpis article>span{font-size:13px !important;color:#526b7d !important;}
.namo-enterprise-dashboard .ned-kpis strong{font-size:29px !important;color:#22384a !important;}
.namo-enterprise-dashboard .ned-kpis strong small{font-size:12px !important;color:#526b7d !important;}
.namo-enterprise-dashboard .ned-kpis p{font-size:11.5px !important;color:#607586 !important;min-height:18px !important;}
.namo-enterprise-dashboard .ned-kpis article>i{font-size:11px !important;}
.namo-enterprise-dashboard .ned-panel h2{font-size:15px !important;color:#244f70 !important;}
.namo-enterprise-dashboard .ned-panel header p{font-size:11.5px !important;color:#607586 !important;}
.namo-enterprise-dashboard .ned-panel header>span{font-size:11px !important;}
.namo-enterprise-dashboard .ned-flow-dot{font-size:11px !important;}
.namo-enterprise-dashboard .ned-flow-step b{font-size:12px !important;color:#30495e !important;}
.namo-enterprise-dashboard .ned-flow-step small{font-size:10.5px !important;color:#607586 !important;}
.namo-enterprise-dashboard .ned-panel table{font-size:13px !important;}
.namo-enterprise-dashboard .ned-panel td{color:#334b5e !important;}
.namo-enterprise-dashboard .ned-status{font-size:10.5px !important;}
.namo-enterprise-dashboard .ned-task b{font-size:12px !important;color:#30495e !important;}
.namo-enterprise-dashboard .ned-task small{font-size:10.5px !important;color:#607586 !important;line-height:1.5 !important;}
.namo-enterprise-dashboard .ned-task em{font-size:10.5px !important;}
.namo-enterprise-dashboard .ned-task-empty,.namo-enterprise-dashboard .ned-empty{font-size:11.5px !important;color:#607586 !important;}

/* Monthly shipping: 12-month KG bar chart, sensible scale, no hover tooltip */
.namo-enterprise-dashboard .ned-chart{height:225px !important;min-height:225px !important;padding:18px 10px 12px !important;display:flex !important;align-items:flex-end !important;gap:5px !important;overflow:hidden !important;}
.namo-enterprise-dashboard .ned-bar-col{height:188px !important;min-width:0 !important;flex:1 1 0 !important;display:grid !important;grid-template-rows:26px 132px 24px !important;align-items:end !important;justify-items:center !important;gap:3px !important;}
.namo-enterprise-dashboard .ned-bar-col>span{height:24px !important;display:flex !important;align-items:flex-end !important;justify-content:center !important;font-size:11px !important;font-weight:800 !important;color:#52697b !important;white-space:nowrap !important;}
.namo-enterprise-dashboard .ned-bar-col>.ned-bar{width:min(28px,72%) !important;min-width:8px !important;align-self:end !important;border-radius:5px 5px 0 0 !important;background:linear-gradient(180deg,#82b9da 0%,#5e9fc9 100%) !important;box-shadow:none !important;}
.namo-enterprise-dashboard .ned-bar-col>b{height:22px !important;display:flex !important;align-items:center !important;justify-content:center !important;font-size:10.5px !important;font-weight:850 !important;color:#53697a !important;white-space:nowrap !important;}
.namo-enterprise-dashboard .ned-bar-col:hover>span,.namo-enterprise-dashboard .ned-bar-col:hover>b{color:#52697b !important;}
`;

function branchName(){try{return execFileSync('git',['branch','--show-current'],{cwd:ROOT,encoding:'utf8'}).trim();}catch(_){return '';}}
function pathnameOf(value){try{return decodeURIComponent(new URL(value||'/','http://localhost').pathname);}catch(_){return '/';}}
function noStore(extra={}){return {'cache-control':'no-store, no-cache, must-revalidate, max-age=0',pragma:'no-cache',expires:'0',...extra};}
function sendText(req,res,status,type,text,extra={}){const body=Buffer.from(String(text),'utf8');res.writeHead(status,noStore({'content-type':type,'content-length':body.length,...extra}));if(req.method==='HEAD')return res.end();res.end(body);}
function rewriteSetCookie(value){if(!value)return value;const list=Array.isArray(value)?value:[value];return list.map(cookie=>String(cookie).replace(/;\s*Domain=[^;]+/ig,'').replace(/;\s*Secure/ig,'').replace(/SameSite=None/ig,'SameSite=Lax'));}
function isSafeAuthWrite(req){return String(req.method||'').toUpperCase()==='POST'&&/^\/api\/auth\/(login|logout)\/?(?:\?|$)/.test(req.url||'');}
function isBlockedWrite(req){const method=String(req.method||'GET').toUpperCase();if(ALLOW_LIVE_WRITES)return false;if(['GET','HEAD','OPTIONS'].includes(method))return false;return !isSafeAuthWrite(req);}
function trackedText(relPath,fallbackPath){try{return execFileSync('git',['show','HEAD:'+relPath],{cwd:ROOT,encoding:'utf8'});}catch(_error){return fs.readFileSync(fallbackPath,'utf8');}}

function patchedDashboard(){
  let source=fs.readFileSync(ENTERPRISE_DASHBOARD,'utf8');

  source=source.replace('ERP → MES 통합 업무 흐름','통합업무 흐름');
  source=source.replace(
    'function monthlyShipping(rows){var now=new Date(),months=[];for(var i=5;i>=0;i-=1){var d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:monthKey(d),label:(d.getMonth()+1)+"월",value:0});}',
    'function monthlyShipping(rows){var now=new Date(),months=[];for(var i=0;i<12;i+=1){var d=new Date(now.getFullYear(),i,1);months.push({key:monthKey(d),label:(i+1)+"월",value:0});}'
  );

  const newBars=`bars=(function(){var peak=Math.max(0,Math.max.apply(null,data.months.map(function(item){return Math.max(0,item.value||0);}))),step=peak<=500?100:peak<=1000?250:peak<=5000?500:1000,scaleMax=Math.max(step,Math.ceil(peak/step)*step);return data.months.map(function(item){var value=Math.max(0,item.value||0),height=value<=0?3:Math.max(8,Math.round(value/scaleMax*118)),label=value>0?fmt(value,value<10?1:0):"";return '<div class="ned-bar-col"><span>'+esc(label)+'</span><div class="ned-bar" style="height:'+height+'px" aria-label="'+esc(item.label+' '+fmt(value,1)+' kg')+'"></div><b>'+esc(item.label)+'</b></div>';}).join("");})()`;
  const barsPattern=/bars=data\.months\.map\(function\(item\)\{[\s\S]*?\}\)\.join\(""\),notices=/;
  if(!barsPattern.test(source))throw new Error('monthly shipping bar chart pattern not found');
  source=source.replace(barsPattern,newBars+',notices=');
  source=source.replace('실출하 수량 · 단위 ton','실출하 수량 · 단위 kg');

  source=source.replace(
    '.ned-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.72fr);gap:14px;align-items:start}',
    '.ned-layout{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(0,1.05fr) minmax(285px,.72fr);gap:14px;align-items:stretch}.ned-left{display:contents}.ned-left>.ned-panel{grid-column:1/-1;min-width:0}.ned-right{display:contents}'
  );
  source=source.replace('.ned-split{display:grid;grid-template-columns:1.08fr .92fr;gap:14px;margin-top:14px}','.ned-split{display:contents}');
  source=source.replace('.ned-task-panel{min-height:100%}','.ned-task-panel{min-height:278px;height:278px;display:flex;flex-direction:column}.ned-tasks{flex:1 1 auto;min-height:0;overflow:auto}');
  source=source.replace('.ned-table-wrap{overflow:auto}','.ned-table-wrap{overflow:auto;flex:1 1 auto;min-height:0}.ned-split>.ned-panel{min-width:0;min-height:278px;height:278px;display:flex;flex-direction:column}.ned-split>.ned-panel>header{flex:0 0 auto}.ned-split>.ned-panel .ned-chart{flex:1 1 auto;height:auto;min-height:210px}');
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

function injectCommonUi(html){
  const tag=`<link rel="stylesheet" href="${COMMON_UI_PATH}?v=20260911-8">`;
  if(String(html).includes(COMMON_UI_PATH))return html;
  if(/<\/head>/i.test(html))return String(html).replace(/<\/head>/i,tag+'\n</head>');
  return tag+'\n'+String(html);
}

function proxy(req,res){
  if(isBlockedWrite(req))return sendText(req,res,409,'application/json; charset=utf-8',JSON.stringify({success:false,code:'QMES_TEST_LIVE_WRITE_BLOCKED',message:'TEST 보호모드입니다. 운영 데이터 변경은 차단되었습니다.'}));
  const headers={...req.headers,host:UPSTREAM.host,origin:UPSTREAM.origin,referer:`${UPSTREAM.origin}${req.url||'/'}`,connection:'close'};
  delete headers['proxy-connection'];delete headers['accept-encoding'];
  const upstreamReq=https.request({protocol:UPSTREAM.protocol,hostname:UPSTREAM.hostname,port:UPSTREAM.port||443,method:req.method,path:req.url,headers,family:4,agent:false},upstreamRes=>{
    const out={...upstreamRes.headers};
    delete out.connection;delete out['transfer-encoding'];delete out['strict-transport-security'];delete out['content-encoding'];
    Object.assign(out,noStore({'x-namo-test-source':'production-mirror'}));
    if(out['set-cookie'])out['set-cookie']=rewriteSetCookie(out['set-cookie']);
    if(out.location)out.location=String(out.location).replace(UPSTREAM.origin,`http://${HOST}:${PORT}`);
    const contentType=String(upstreamRes.headers['content-type']||'').toLowerCase();
    if(contentType.includes('text/html')){
      const chunks=[];
      upstreamRes.on('data',chunk=>chunks.push(chunk));
      upstreamRes.on('end',()=>{
        const body=Buffer.from(injectCommonUi(Buffer.concat(chunks).toString('utf8')),'utf8');
        out['content-length']=body.length;
        res.writeHead(upstreamRes.statusCode||200,out);
        if(req.method==='HEAD')return res.end();
        res.end(body);
      });
      return;
    }
    res.writeHead(upstreamRes.statusCode||502,out);
    upstreamRes.pipe(res);
  });
  upstreamReq.setTimeout(20000,()=>upstreamReq.destroy(new Error('QMES upstream timeout')));
  upstreamReq.on('error',error=>{if(!res.headersSent)sendText(req,res,502,'application/json; charset=utf-8',JSON.stringify({success:false,message:error.message}));else res.end();});
  req.pipe(upstreamReq);
}

const server=http.createServer((req,res)=>{
  const pathname=pathnameOf(req.url||'/');
  if((req.method==='GET'||req.method==='HEAD')&&pathname===COMMON_UI_PATH){
    return sendText(req,res,200,'text/css; charset=utf-8',COMMON_UI_CSS,{'x-namo-test-source':'common-ui-20260911-v8'});
  }
  if((req.method==='GET'||req.method==='HEAD')&&pathname==='/js/dashboard.jsx'){
    try{return sendText(req,res,200,'text/javascript; charset=utf-8',patchedDashboard(),{'x-namo-test-source':'patched-enterprise-dashboard-v8-kg-bars'});}catch(error){return sendText(req,res,500,'text/plain; charset=utf-8',error.stack||error.message);}
  }
  if((req.method==='GET'||req.method==='HEAD')&&pathname==='/js/router.jsx'){
    try{return sendText(req,res,200,'text/javascript; charset=utf-8',patchedRouter(),{'x-namo-test-source':'patched-router-admin-access-v4'});}catch(error){return sendText(req,res,500,'text/plain; charset=utf-8',error.stack||error.message);}
  }
  if(pathname==='/_qmes_test/status')return sendText(req,res,200,'application/json; charset=utf-8',JSON.stringify({mode:'PRODUCTION MIRROR + 12 MONTH KG BAR CHART + ADMIN ACCESS + COMMON TABLE UI + RESIZABLE SIDEBAR',upstream:UPSTREAM.origin,branch:branchName(),liveWritesAllowed:ALLOW_LIVE_WRITES,commonUi:COMMON_UI_PATH},null,2));
  return proxy(req,res);
});

server.listen(PORT,HOST,()=>{
  console.log('');
  console.log('============================================================');
  console.log(' NAMO QMES TEST - 12 MONTH KG BAR CHART V8');
  console.log(` http://localhost:${PORT}`);
  console.log(` branch: ${branchName()||'(unknown)'}`);
  console.log(' dashboard: 1-12 month KG bars; 230kg is shown as 230, not 0.23');
  console.log(' chart: sensible rounded scale; no hover tooltip');
  console.log(' router: admin commercial ERP access bypass retained');
  console.log(' sidebar: draggable width patch retained from tracked router');
  console.log(' home header: refresh/new purchase actions hidden');
  console.log(` live data writes: ${ALLOW_LIVE_WRITES?'ENABLED':'BLOCKED (safe mode)'}`);
  console.log('============================================================');
  console.log('');
});

server.on('error',error=>{if(error&&error.code==='EADDRINUSE'){console.error(`Port ${PORT} is already in use. Stop the old TEST server with Ctrl+C, then retry.`);process.exit(1);}throw error;});