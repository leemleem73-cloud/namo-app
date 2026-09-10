'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = String(process.env.HOST || '127.0.0.1');
const UPSTREAM = new URL(process.env.QMES_UPSTREAM || 'https://qmes.namochemical.com');
const ALLOW_LIVE_WRITES = String(process.env.NAMO_TEST_ALLOW_LIVE_WRITES || '') === '1';

const MIME = {
  '.html':'text/html; charset=utf-8', '.htm':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.jsx':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.gif':'image/gif', '.webp':'image/webp', '.ico':'image/x-icon', '.woff':'font/woff',
  '.woff2':'font/woff2', '.ttf':'font/ttf', '.pdf':'application/pdf'
};

function branchName(){
  try{return execFileSync('git',['branch','--show-current'],{cwd:ROOT,encoding:'utf8'}).trim();}
  catch(_){return '';}
}

function noStoreHeaders(extra={}){
  return {'cache-control':'no-store, no-cache, must-revalidate, max-age=0',pragma:'no-cache',expires:'0',...extra};
}

function sendBuffer(req,res,status,type,data,extra={}){
  const body=Buffer.isBuffer(data)?data:Buffer.from(String(data));
  res.writeHead(status,noStoreHeaders({'content-type':type,'content-length':body.length,...extra}));
  if(String(req.method||'GET').toUpperCase()==='HEAD')return res.end();
  res.end(body);
}

function sendText(req,res,status,type,body,extra={}){
  sendBuffer(req,res,status,type,Buffer.from(String(body),'utf8'),extra);
}

function pathnameOf(urlValue){
  try{return decodeURIComponent(new URL(urlValue||'/','http://localhost').pathname);}
  catch(_){return '/';}
}

function namoTalkPath(urlValue){
  const pathname=pathnameOf(urlValue);
  return /(^|\/)(namo-talk(?:[-./]|$))/i.test(pathname)||/\/assets\/namo-emoticons-/i.test(pathname);
}

function isSafeAuthWrite(req){
  return String(req.method||'').toUpperCase()==='POST'&&/^\/api\/auth\/(login|logout)\/?(?:\?|$)/.test(req.url||'');
}

function isBlockedWrite(req){
  const method=String(req.method||'GET').toUpperCase();
  if(ALLOW_LIVE_WRITES)return false;
  if(['GET','HEAD','OPTIONS'].includes(method))return false;
  return !isSafeAuthWrite(req);
}

function rewriteSetCookie(value){
  if(!value)return value;
  const list=Array.isArray(value)?value:[value];
  return list.map(cookie=>String(cookie)
    .replace(/;\s*Domain=[^;]+/ig,'')
    .replace(/;\s*Secure/ig,'')
    .replace(/SameSite=None/ig,'SameSite=Lax'));
}

function injectTestScripts(html){
  let out=String(html||'');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*qmes-enterprise-header-polish-20260910\.js[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*qmes-test-ui-recovery-20260910\.js[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  out=out.replace(/\s*<script\b[^>]*src=["'][^"']*qmes-test-scroll-admin-fix-20260910\.js[^"']*["'][^>]*><\/script>\s*/ig,'\n');
  const scripts=[
    '  <script src="./js/qmes-enterprise-header-polish-20260910.js?v=20260910-test-local2"></script>',
    '  <script src="./js/qmes-test-ui-recovery-20260910.js?v=20260910-test-local2"></script>',
    '  <script src="./js/qmes-test-scroll-admin-fix-20260910.js?v=20260910-test-local2"></script>'
  ].join('\n');
  return out.replace(/<\/body>/i,`${scripts}\n</body>`);
}

function safeLocalFile(pathname){
  let relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const full=path.resolve(PUBLIC,relative);
  if(full!==PUBLIC&&!full.startsWith(PUBLIC+path.sep))return null;
  try{
    const stat=fs.statSync(full);
    if(stat.isDirectory()){
      const indexFile=path.join(full,'index.html');
      if(fs.statSync(indexFile).isFile())return indexFile;
      return null;
    }
    return stat.isFile()?full:null;
  }catch(_){return null;}
}

function serveLocal(req,res,file){
  try{
    const ext=path.extname(file).toLowerCase();
    if(ext==='.html'){
      const html=injectTestScripts(fs.readFileSync(file,'utf8'));
      return sendText(req,res,200,MIME['.html'],html,{'x-namo-test-source':'local-test-frontend'});
    }
    const stat=fs.statSync(file);
    const type=MIME[ext]||'application/octet-stream';
    res.writeHead(200,noStoreHeaders({'content-type':type,'content-length':stat.size,'x-namo-test-source':'local-test-static'}));
    if(String(req.method||'GET').toUpperCase()==='HEAD')return res.end();
    fs.createReadStream(file).pipe(res);
  }catch(error){
    sendText(req,res,500,'application/json; charset=utf-8',JSON.stringify({success:false,message:error.message}));
  }
}

function proxy(req,res){
  if(isBlockedWrite(req)){
    return sendText(req,res,409,'application/json; charset=utf-8',JSON.stringify({
      success:false,
      code:'QMES_TEST_LIVE_WRITE_BLOCKED',
      message:'TEST 보호모드입니다. 운영 QMES 데이터 변경 요청은 차단되었습니다.'
    }));
  }

  const headers={...req.headers};
  headers.host=UPSTREAM.host;
  headers.origin=UPSTREAM.origin;
  headers.referer=`${UPSTREAM.origin}${req.url||'/'}`;
  headers.connection='close';
  delete headers['proxy-connection'];
  delete headers['accept-encoding'];

  const upstreamReq=https.request({
    protocol:UPSTREAM.protocol,
    hostname:UPSTREAM.hostname,
    port:UPSTREAM.port||443,
    method:req.method,
    path:req.url,
    headers,
    family:4,
    agent:false
  },upstreamRes=>{
    const outHeaders={...upstreamRes.headers};
    delete outHeaders.connection;
    delete outHeaders['transfer-encoding'];
    delete outHeaders['strict-transport-security'];
    delete outHeaders['content-encoding'];
    Object.assign(outHeaders,noStoreHeaders({'x-namo-test-source':'production-api-proxy'}));
    if(outHeaders['set-cookie'])outHeaders['set-cookie']=rewriteSetCookie(outHeaders['set-cookie']);
    if(outHeaders.location)outHeaders.location=String(outHeaders.location).replace(UPSTREAM.origin,`http://${HOST}:${PORT}`);
    res.writeHead(upstreamRes.statusCode||502,outHeaders);
    upstreamRes.pipe(res);
  });

  upstreamReq.setTimeout(20000,()=>upstreamReq.destroy(new Error('QMES upstream timeout')));
  upstreamReq.on('error',error=>{
    if(!res.headersSent)sendText(req,res,502,'application/json; charset=utf-8',JSON.stringify({success:false,message:`QMES 연결 실패: ${error.message}`}));
    else res.end();
  });
  req.pipe(upstreamReq);
}

function readLocal(relative){
  try{return fs.readFileSync(path.join(PUBLIC,relative),'utf8');}
  catch(_){return '';}
}

function localCheck(){
  const router=readLocal('js/router.jsx');
  const shell=readLocal('js/qmes-collapsible-side-menu.js');
  const polish=readLocal('js/qmes-enterprise-header-polish-20260910.js');
  const recovery=readLocal('js/qmes-test-ui-recovery-20260910.js');
  const scrollAdmin=readLocal('js/qmes-test-scroll-admin-fix-20260910.js');
  const members=readLocal('js/admin/members.jsx');
  return {
    localFrontend:fs.existsSync(path.join(PUBLIC,'index.html')),
    routerNamoTalkFound:/NamoTalk|NAMO\s*Talk|namo-talk|qmes_namo_talk/i.test(router),
    shellNamoTalkFound:/NamoTalk|NAMO\s*Talk|qmes-erp-header-talk|namo-talk/i.test(shell),
    generalAlertFound:/알림/.test(router)&&/알림/.test(shell),
    accountMenuFound:/비밀번호 변경/.test(shell)&&/로그아웃/.test(shell),
    headerPolishLoaded:/모바일 전용/.test(polish)&&/qmes-erp-account-menu/.test(polish),
    navigationRecoveryLoaded:/routeMap/.test(recovery),
    directPasswordUiLoaded:/qmes-test-password-modal/.test(recovery)&&/logoutNow/.test(recovery),
    wheelScrollFixLoaded:/(?:window|document)\.addEventListener\(['"]wheel['"]/.test(scrollAdmin)&&/overflow-y:auto/.test(scrollAdmin),
    adminEmployeeMenuFixLoaded:/회원등록 현황/.test(scrollAdmin)&&/data-qmes-test-admin-members/.test(scrollAdmin),
    perUserPermissionUiLoaded:/접근권한 설정/.test(members)&&/qmes-user-menu-permissions-v1/.test(members)
  };
}

const server=http.createServer((req,res)=>{
  const requestUrl=req.url||'/';
  const pathname=pathnameOf(requestUrl);
  const method=String(req.method||'GET').toUpperCase();

  if(requestUrl.startsWith('/_qmes_test/status')){
    return sendText(req,res,200,'application/json; charset=utf-8',JSON.stringify({
      mode:'LOCAL TEST frontend + production API read proxy',
      upstream:UPSTREAM.origin,
      branch:branchName(),
      liveWritesAllowed:ALLOW_LIVE_WRITES,
      checks:localCheck()
    },null,2));
  }

  if(namoTalkPath(requestUrl)){
    return sendText(req,res,410,'application/json; charset=utf-8',JSON.stringify({success:false,code:'NAMO_TALK_REMOVED',message:'NAMO Talk은 TEST QMES에서 제거되었습니다.'}));
  }

  if(pathname.startsWith('/api/'))return proxy(req,res);

  if(['GET','HEAD'].includes(method)){
    const local=safeLocalFile(pathname);
    if(local)return serveLocal(req,res,local);

    if(!path.extname(pathname)){
      const indexFile=path.join(PUBLIC,'index.html');
      if(fs.existsSync(indexFile))return serveLocal(req,res,indexFile);
    }
  }

  return proxy(req,res);
});

server.listen(PORT,HOST,()=>{
  const check=localCheck();
  console.log('');
  console.log('============================================================');
  console.log(' NAMO QMES TEST');
  console.log(` http://localhost:${PORT}`);
  console.log(` branch: ${branchName()||'(unknown)'}`);
  console.log(' frontend: LOCAL TEST branch static files');
  console.log(` production API reads: proxied to ${UPSTREAM.origin}`);
  console.log(` live data writes: ${ALLOW_LIVE_WRITES?'ENABLED':'BLOCKED (safe mode)'}`);
  console.log(` local frontend: ${check.localFrontend?'OK':'CHECK REQUIRED'}`);
  console.log(` NAMO Talk in router: ${check.routerNamoTalkFound?'FOUND - CHECK REQUIRED':'REMOVED'}`);
  console.log(` NAMO Talk in enterprise shell: ${check.shellNamoTalkFound?'FOUND - CHECK REQUIRED':'REMOVED'}`);
  console.log(` general alert: ${check.generalAlertFound?'OK':'CHECK REQUIRED'}`);
  console.log(` account menu: ${check.accountMenuFound?'OK':'CHECK REQUIRED'}`);
  console.log(` header polish: ${check.headerPolishLoaded?'OK':'CHECK REQUIRED'}`);
  console.log(` navigation recovery: ${check.navigationRecoveryLoaded?'OK':'CHECK REQUIRED'}`);
  console.log(` password/logout recovery: ${check.directPasswordUiLoaded?'OK':'CHECK REQUIRED'}`);
  console.log(` wheel scroll fix: ${check.wheelScrollFixLoaded?'OK':'CHECK REQUIRED'}`);
  console.log(` admin employee menu fix: ${check.adminEmployeeMenuFixLoaded?'OK':'CHECK REQUIRED'}`);
  console.log(` per-user permission UI: ${check.perUserPermissionUiLoaded?'OK':'CHECK REQUIRED'}`);
  console.log(` Status: http://localhost:${PORT}/_qmes_test/status`);
  console.log('============================================================');
  console.log('');
});

server.on('error',error=>{
  if(error&&error.code==='EADDRINUSE'){
    console.error(`Port ${PORT} is already in use. Stop the old TEST server first (keyboard Ctrl+C), then retry.`);
    process.exit(1);
  }
  throw error;
});
