'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const UPSTREAM = new URL(process.env.QMES_UPSTREAM || 'https://qmes.namochemical.com');
const ALLOW_LIVE_WRITES = String(process.env.NAMO_TEST_ALLOW_LIVE_WRITES || '') === '1';
const TEST_OVERRIDES = new Map([
  ['/js/router.jsx', path.join(PUBLIC, 'js', 'router.jsx')],
  ['/js/qmes-collapsible-side-menu.js', path.join(PUBLIC, 'js', 'qmes-collapsible-side-menu.js')],
  ['/js/qmes-enterprise-header-polish-20260910.js', path.join(PUBLIC, 'js', 'qmes-enterprise-header-polish-20260910.js')],
  ['/js/qmes-test-ui-recovery-20260910.js', path.join(PUBLIC, 'js', 'qmes-test-ui-recovery-20260910.js')]
]);

function branchName(){try{return execFileSync('git',['branch','--show-current'],{cwd:ROOT,encoding:'utf8'}).trim();}catch(_){return '';}}
function noStoreHeaders(extra={}){return {'cache-control':'no-store, no-cache, must-revalidate, max-age=0',pragma:'no-cache',expires:'0',...extra};}
function sendText(res,status,type,body,extra={}){const data=Buffer.from(String(body));res.writeHead(status,noStoreHeaders({'content-type':type,'content-length':data.length,...extra}));res.end(data);}
function pathnameOf(urlValue){try{return decodeURIComponent(new URL(urlValue||'/','http://localhost').pathname);}catch(_){return '/';}}
function namoTalkPath(urlValue){const pathname=pathnameOf(urlValue);return /(^|\/)(namo-talk(?:[-./]|$))/i.test(pathname)||/\/assets\/namo-emoticons-/i.test(pathname);}
function isSafeAuthWrite(req){return String(req.method||'').toUpperCase()==='POST'&&/^\/api\/auth\/(login|logout)\/?(?:\?|$)/.test(req.url||'');}
function isBlockedWrite(req){const method=String(req.method||'GET').toUpperCase();if(ALLOW_LIVE_WRITES)return false;if(['GET','HEAD','OPTIONS'].includes(method))return false;return !isSafeAuthWrite(req);}
function rewriteSetCookie(value){if(!value)return value;const list=Array.isArray(value)?value:[value];return list.map(cookie=>String(cookie).replace(/;\s*Domain=[^;]+/ig,'').replace(/;\s*Secure/ig,'').replace(/SameSite=None/ig,'SameSite=Lax'));}

function cleanProductionHtml(html){
  let out=String(html||'');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*namo-emoticons-[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*namo-talk[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*qmes-user-dropdown-restore-20260812\.js[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  out=out.replace(/(src=["'][^"']*\/js\/router\.jsx)(?:\?[^"']*)?(["'])/ig,'$1?v=20260910-enterprise-clean6$2');
  out=out.replace(/(src=["'][^"']*\/js\/qmes-collapsible-side-menu\.js)(?:\?[^"']*)?(["'])/ig,'$1?v=20260910-enterprise-clean6$2');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*qmes-enterprise-header-polish-20260910\.js[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*qmes-test-ui-recovery-20260910\.js[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  out=out.replace(/<\/body>/i,'  <script src="./js/qmes-enterprise-header-polish-20260910.js?v=20260910-polish2"></script>\n  <script src="./js/qmes-test-ui-recovery-20260910.js?v=20260910-recovery1"></script>\n</body>');
  return out;
}

function serveOverride(req,res,file){
  try{
    const stat=fs.statSync(file);
    if(!stat.isFile())throw new Error('TEST override is not a file');
    res.writeHead(200,noStoreHeaders({'content-type':'text/javascript; charset=utf-8','content-length':stat.size,'x-namo-test-source':'local-test-override'}));
    if(String(req.method).toUpperCase()==='HEAD')return res.end();
    fs.createReadStream(file).pipe(res);
  }catch(error){sendText(res,500,'application/json; charset=utf-8',JSON.stringify({success:false,message:error.message}));}
}

function proxy(req,res){
  if(isBlockedWrite(req))return sendText(res,409,'application/json; charset=utf-8',JSON.stringify({success:false,code:'QMES_TEST_LIVE_WRITE_BLOCKED',message:'TEST 보호모드입니다. 운영 QMES 데이터 변경 요청은 차단되었습니다.'}));
  const headers={...req.headers};headers.host=UPSTREAM.host;headers.origin=UPSTREAM.origin;headers.referer=`${UPSTREAM.origin}${req.url||'/'}`;headers.connection='close';delete headers['proxy-connection'];delete headers['accept-encoding'];
  const upstreamReq=https.request({protocol:UPSTREAM.protocol,hostname:UPSTREAM.hostname,port:UPSTREAM.port||443,method:req.method,path:req.url,headers,family:4,agent:false},upstreamRes=>{
    const contentType=String(upstreamRes.headers['content-type']||'');
    const isHtml=/text\/html/i.test(contentType);
    if(!isHtml){
      const outHeaders={...upstreamRes.headers};delete outHeaders.connection;delete outHeaders['transfer-encoding'];delete outHeaders['strict-transport-security'];delete outHeaders['content-encoding'];Object.assign(outHeaders,noStoreHeaders());if(outHeaders['set-cookie'])outHeaders['set-cookie']=rewriteSetCookie(outHeaders['set-cookie']);if(outHeaders.location)outHeaders.location=String(outHeaders.location).replace(UPSTREAM.origin,`http://localhost:${PORT}`);res.writeHead(upstreamRes.statusCode||502,outHeaders);upstreamRes.pipe(res);return;
    }
    const chunks=[];upstreamRes.on('data',chunk=>chunks.push(chunk));upstreamRes.on('end',()=>{const cleaned=cleanProductionHtml(Buffer.concat(chunks).toString('utf8'));const body=Buffer.from(cleaned,'utf8');const outHeaders={...upstreamRes.headers};delete outHeaders.connection;delete outHeaders['transfer-encoding'];delete outHeaders['strict-transport-security'];delete outHeaders['content-encoding'];outHeaders['content-length']=body.length;Object.assign(outHeaders,noStoreHeaders({'x-namo-test-source':'production-runtime-cleaned'}));if(outHeaders['set-cookie'])outHeaders['set-cookie']=rewriteSetCookie(outHeaders['set-cookie']);if(outHeaders.location)outHeaders.location=String(outHeaders.location).replace(UPSTREAM.origin,`http://localhost:${PORT}`);res.writeHead(upstreamRes.statusCode||502,outHeaders);res.end(body);});
  });
  upstreamReq.setTimeout(20000,()=>upstreamReq.destroy(new Error('QMES upstream timeout')));
  upstreamReq.on('error',error=>{if(!res.headersSent)sendText(res,502,'application/json; charset=utf-8',JSON.stringify({success:false,message:`QMES 연결 실패: ${error.message}`}));else res.end();});
  req.pipe(upstreamReq);
}

function localCheck(){
  let router='';let shell='';let polish='';let recovery='';
  try{router=fs.readFileSync(TEST_OVERRIDES.get('/js/router.jsx'),'utf8');}catch(_){}
  try{shell=fs.readFileSync(TEST_OVERRIDES.get('/js/qmes-collapsible-side-menu.js'),'utf8');}catch(_){}
  try{polish=fs.readFileSync(TEST_OVERRIDES.get('/js/qmes-enterprise-header-polish-20260910.js'),'utf8');}catch(_){}
  try{recovery=fs.readFileSync(TEST_OVERRIDES.get('/js/qmes-test-ui-recovery-20260910.js'),'utf8');}catch(_){}
  return {
    routerNamoTalkFound:/NamoTalk|NAMO\s*Talk|namo-talk|qmes_namo_talk/i.test(router),
    shellNamoTalkFound:/NamoTalk|NAMO\s*Talk|qmes-erp-header-talk|namo-talk/i.test(shell),
    generalAlertFound:/aria-label=["']알림["']/.test(router)&&/aria-label=\\?"알림\\?"/.test(shell),
    accountMenuFound:/비밀번호 변경/.test(shell)&&/로그아웃/.test(shell),
    qualityUserLabelFound:/임흥배/.test(router)&&/품질부/.test(router)&&/임흥배/.test(shell)&&/품질부/.test(shell),
    headerPolishLoaded:/모바일 전용/.test(polish)&&/qmes-erp-account-menu/.test(polish),
    navigationRecoveryLoaded:/qmes-test-ui-recovery/.test(recovery)&&/routeMap/.test(recovery),
    directPasswordUiLoaded:/qmes-test-password-modal/.test(recovery)&&/logoutNow/.test(recovery)
  };
}

const server=http.createServer((req,res)=>{
  const requestUrl=req.url||'/';
  const pathname=pathnameOf(requestUrl);
  if(requestUrl.startsWith('/_qmes_test/status'))return sendText(res,200,'application/json; charset=utf-8',JSON.stringify({mode:'PRODUCTION runtime mirror + TEST UI recovery',upstream:UPSTREAM.origin,branch:branchName(),liveWritesAllowed:ALLOW_LIVE_WRITES,checks:localCheck()},null,2));
  if(namoTalkPath(requestUrl))return sendText(res,410,'application/json; charset=utf-8',JSON.stringify({success:false,code:'NAMO_TALK_REMOVED',message:'NAMO Talk은 TEST QMES에서 제거되었습니다.'}));
  if(['GET','HEAD'].includes(String(req.method||'').toUpperCase())&&TEST_OVERRIDES.has(pathname))return serveOverride(req,res,TEST_OVERRIDES.get(pathname));
  proxy(req,res);
});

server.listen(PORT,'127.0.0.1',()=>{
  const check=localCheck();
  console.log('');console.log('============================================================');console.log(' NAMO QMES TEST');console.log(` http://localhost:${PORT}`);console.log(` branch: ${branchName()||'(unknown)'}`);console.log(' frontend: PRODUCTION RUNTIME mirror');console.log(' TEST overrides: router + enterprise shell + header polish + navigation/account recovery');console.log(` production API reads: proxied to ${UPSTREAM.origin}`);console.log(` live data writes: ${ALLOW_LIVE_WRITES?'ENABLED':'BLOCKED (safe mode)'}`);console.log(` NAMO Talk in router: ${check.routerNamoTalkFound?'FOUND - CHECK REQUIRED':'REMOVED'}`);console.log(` NAMO Talk in enterprise shell: ${check.shellNamoTalkFound?'FOUND - CHECK REQUIRED':'REMOVED'}`);console.log(` general alert: ${check.generalAlertFound?'OK':'CHECK REQUIRED'}`);console.log(` account menu: ${check.accountMenuFound?'OK':'CHECK REQUIRED'}`);console.log(` user label: ${check.qualityUserLabelFound?'OK':'CHECK REQUIRED'}`);console.log(` header polish: ${check.headerPolishLoaded?'OK':'CHECK REQUIRED'}`);console.log(` navigation recovery: ${check.navigationRecoveryLoaded?'OK':'CHECK REQUIRED'}`);console.log(` password/logout recovery: ${check.directPasswordUiLoaded?'OK':'CHECK REQUIRED'}`);console.log(` Status: http://localhost:${PORT}/_qmes_test/status`);console.log('============================================================');console.log('');
});
server.on('error',error=>{if(error&&error.code==='EADDRINUSE'){console.error(`Port ${PORT} is already in use. Stop the old TEST server first (keyboard Ctrl+C), then retry.`);process.exit(1);}throw error;});
