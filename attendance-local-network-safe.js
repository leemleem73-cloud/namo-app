'use strict';

const dns = require('dns');
const https = require('https');
const express = require('express');

try {
  if (typeof dns.setDefaultResultOrder === 'function') dns.setDefaultResultOrder('ipv4first');
} catch (_error) {}

try {
  https.globalAgent.options.family = 4;
  https.globalAgent.options.keepAlive = false;
} catch (_error) {}

// TEST always mirrors the actually deployed QMES domain.
const deployedQmesOrigin = 'https://qmes.namochemical.com';
process.env.NAMO_TEST_UPSTREAM = deployedQmesOrigin;
const productionOrigin = new URL(deployedQmesOrigin);

const TEST_UI_PATCH = `
<script data-namo-test-qmes-ui-patch="20260910">
(function(){
  'use strict';
  var menu = null;
  var hideTimer = null;
  var currentUser = null;

  function textOf(el){ return String((el && el.textContent) || '').replace(/\\s+/g,' ').trim(); }
  function removeNamoTalk(){
    var nodes = Array.from(document.querySelectorAll('button,a,[role="button"],div,span'));
    nodes.forEach(function(el){
      var t = textOf(el);
      if(!t || !/NAMO\\s*Talk/i.test(t)) return;
      if(el.children && el.children.length > 4) return;
      var target = el.closest('button,a,[role="button"]') || el;
      if(target && target !== document.body && target !== document.documentElement) target.remove();
    });
  }

  function formatUser(u){
    if(!u) return '';
    var name = String(u.name || '').trim();
    var title = String(u.title || u.position || '').trim();
    var dept = String(u.department || u.dept || '').trim();
    var left = [name,title].filter(Boolean).join(' ');
    return dept ? left + '(' + dept + ')' : left;
  }

  function findUserButton(u){
    if(!u || !u.name) return null;
    var name = String(u.name).trim();
    var candidates = Array.from(document.querySelectorAll('button,[role="button"],a'));
    return candidates.find(function(el){
      var t = textOf(el);
      return t && t.indexOf(name) >= 0 && !/로그인|출퇴근|모바일/i.test(t);
    }) || null;
  }

  function closeMenu(){ if(menu) menu.style.display='none'; }
  function openMenu(btn){
    if(!menu || !btn) return;
    var r = btn.getBoundingClientRect();
    menu.style.top = (window.scrollY + r.bottom + 6) + 'px';
    menu.style.left = Math.max(8, window.scrollX + r.right - 190) + 'px';
    menu.style.display = 'block';
  }

  async function logout(){
    try{ await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}); }catch(_error){}
    try{ sessionStorage.removeItem('qmes-current-user-v1'); }catch(_error){}
    location.href='/';
  }

  async function changePassword(){
    closeMenu();
    var current = window.prompt('현재 비밀번호를 입력하세요.');
    if(current === null) return;
    var next = window.prompt('새 비밀번호를 입력하세요. (4자 이상)');
    if(next === null) return;
    if(String(next).length < 4){ alert('새 비밀번호는 4자 이상 입력해 주세요.'); return; }
    var confirmPw = window.prompt('새 비밀번호를 다시 입력하세요.');
    if(confirmPw === null) return;
    if(next !== confirmPw){ alert('새 비밀번호가 일치하지 않습니다.'); return; }
    try{
      var res = await fetch('/api/auth/password',{
        method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({currentPassword:current,newPassword:next})
      });
      var payload = await res.json().catch(function(){return {};});
      if(!res.ok || payload.success === false) throw new Error(payload.message || '비밀번호 변경 실패');
      alert('비밀번호가 변경되었습니다.');
    }catch(error){ alert(error.message || '비밀번호 변경에 실패했습니다.'); }
  }

  function ensureMenu(){
    if(menu) return menu;
    menu = document.createElement('div');
    menu.id='namo-test-user-menu';
    menu.style.cssText='position:absolute;z-index:999999;display:none;width:180px;background:#fff;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 12px 28px rgba(15,23,42,.18);padding:6px;font-family:Pretendard,Noto Sans KR,sans-serif';
    var pw = document.createElement('button');
    pw.type='button'; pw.textContent='비밀번호 변경';
    pw.style.cssText='width:100%;border:0;background:#fff;padding:10px 12px;text-align:left;border-radius:7px;font-weight:700;cursor:pointer';
    pw.onclick=changePassword;
    var out = document.createElement('button');
    out.type='button'; out.textContent='로그아웃';
    out.style.cssText='width:100%;border:0;background:#fff;padding:10px 12px;text-align:left;border-radius:7px;font-weight:700;color:#dc2626;cursor:pointer';
    out.onclick=logout;
    menu.appendChild(pw); menu.appendChild(out);
    menu.addEventListener('mouseenter',function(){clearTimeout(hideTimer);});
    menu.addEventListener('mouseleave',function(){hideTimer=setTimeout(closeMenu,180);});
    document.body.appendChild(menu);
    return menu;
  }

  function applyUser(){
    if(!currentUser) return;
    var btn = findUserButton(currentUser);
    if(!btn) return;
    var label = formatUser(currentUser);
    if(label && textOf(btn) !== label) btn.textContent = label;
    if(btn.dataset.namoTestAccountBound==='1') return;
    btn.dataset.namoTestAccountBound='1';
    btn.addEventListener('mouseenter',function(){clearTimeout(hideTimer);ensureMenu();openMenu(btn);});
    btn.addEventListener('mouseleave',function(){hideTimer=setTimeout(closeMenu,180);});
    btn.addEventListener('click',function(e){e.preventDefault();ensureMenu();openMenu(btn);});
  }

  async function loadUser(){
    try{
      var res = await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
      var payload = await res.json();
      currentUser = payload && payload.data && payload.data.user ? payload.data.user : (payload && payload.data ? payload.data : null);
      applyUser();
    }catch(_error){}
  }

  function apply(){ removeNamoTalk(); applyUser(); }
  new MutationObserver(function(){apply();}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('resize',closeMenu);
  setInterval(apply,1200);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){apply();loadUser();});
  else {apply();loadUser();}
})();
</script>`;

function rewriteSetCookie(value) {
  if (!value) return value;
  const items = Array.isArray(value) ? value : [value];
  return items.map((cookie) => String(cookie)
    .replace(/;\s*Domain=[^;]+/ig, '')
    .replace(/;\s*Secure/ig, '')
    .replace(/SameSite=None/ig, 'SameSite=Lax'));
}

function proxyQmesAuth(req, res) {
  const headers = { ...req.headers };
  headers.host = productionOrigin.host;
  headers.origin = productionOrigin.origin;
  headers.referer = `${productionOrigin.origin}/`;
  headers.connection = 'close';
  delete headers['proxy-connection'];
  delete headers['accept-encoding'];
  delete headers['transfer-encoding'];
  delete headers['content-length'];

  const method = String(req.method || 'GET').toUpperCase();
  let body = null;
  if (!['GET', 'HEAD'].includes(method) && req.body !== undefined) {
    body = Buffer.from(JSON.stringify(req.body || {}), 'utf8');
    headers['content-type'] = 'application/json; charset=utf-8';
    headers['content-length'] = String(body.length);
  }

  const upstreamReq = https.request({
    protocol: productionOrigin.protocol,
    hostname: productionOrigin.hostname,
    port: productionOrigin.port || 443,
    family: 4,
    agent: false,
    method,
    path: req.originalUrl || req.url,
    headers,
  }, (upstreamRes) => {
    const outHeaders = { ...upstreamRes.headers };
    delete outHeaders.connection;
    delete outHeaders['transfer-encoding'];
    delete outHeaders['strict-transport-security'];
    delete outHeaders['access-control-allow-origin'];
    if (outHeaders['set-cookie']) outHeaders['set-cookie'] = rewriteSetCookie(outHeaders['set-cookie']);
    if (outHeaders.location) outHeaders.location = String(outHeaders.location).replace(productionOrigin.origin, 'http://localhost:3000');
    res.writeHead(upstreamRes.statusCode || 502, outHeaders);
    upstreamRes.pipe(res);
  });

  upstreamReq.setTimeout(15000, () => upstreamReq.destroy(new Error('QMES auth timeout')));
  upstreamReq.on('error', (error) => {
    console.error('[NAMO TEST auth proxy]', error.message);
    if (!res.headersSent) res.status(502).json({ success: false, message: '현재 QMES 서버에 연결할 수 없습니다.' });
    else res.end();
  });
  if (body) upstreamReq.end(body); else upstreamReq.end();
}

function installHtmlPatch(app){
  originalUse.call(app, function(req,res,next){
    const originalWriteHead = res.writeHead.bind(res);
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    let html = false;
    let chunks = [];

    res.writeHead = function(statusCode, reasonPhrase, headers){
      let hdrs = headers;
      if (typeof reasonPhrase === 'object' && !headers) hdrs = reasonPhrase;
      const type = String((hdrs && (hdrs['content-type'] || hdrs['Content-Type'])) || res.getHeader('content-type') || '');
      html = /text\/html/i.test(type) && req.path !== '/attendance.html' && req.path !== '/attendance';
      if(html && hdrs){
        hdrs = { ...hdrs };
        delete hdrs['content-length']; delete hdrs['Content-Length'];
        if(typeof reasonPhrase === 'object' && !headers) return originalWriteHead(statusCode, hdrs);
        return originalWriteHead(statusCode, reasonPhrase, hdrs);
      }
      return originalWriteHead.apply(res, arguments);
    };

    res.write = function(chunk, encoding, cb){
      if(html){ if(chunk) chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,encoding)); if(typeof cb==='function') cb(); return true; }
      return originalWrite(chunk,encoding,cb);
    };

    res.end = function(chunk, encoding, cb){
      if(!html) return originalEnd(chunk,encoding,cb);
      if(chunk) chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,encoding));
      let body = Buffer.concat(chunks).toString('utf8');
      if(!body.includes('data-namo-test-qmes-ui-patch="20260910"')){
        body = body.includes('</body>') ? body.replace('</body>', TEST_UI_PATCH + '</body>') : body + TEST_UI_PATCH;
      }
      return originalEnd(body,'utf8',cb);
    };
    next();
  });
}

function installQmesMirror(app) {
  if (app.__namoQmesMirrorInstalled) return;
  app.__namoQmesMirrorInstalled = true;
  originalUse.call(app, '/api/auth', proxyQmesAuth);
  installHtmlPatch(app);
  console.log('[NAMO TEST] QMES base UI/assets: deployed QMES mirror mode.');
  console.log('[NAMO TEST] QMES upstream: https://qmes.namochemical.com');
  console.log('[NAMO TEST] QMES header TEST patch: user title/dept menu + NAMO Talk removal.');
  console.log('[NAMO TEST] attendance UI/assets: local TEST override mode.');
}

const originalGet = express.application.get;
express.application.get = function patchedGet(routePath, ...handlers) {
  if (routePath === '/' && handlers.some((fn) => {
    const src = String(fn || '');
    return src.includes("redirect(302, '/attendance.html')") || src.includes('redirect(302, "/attendance.html")');
  })) {
    console.log('[NAMO TEST] forced attendance root redirect disabled.');
    return this;
  }
  return originalGet.call(this, routePath, ...handlers);
};

const originalUse = express.application.use;
express.application.use = function patchedUse(...args) {
  const result = originalUse.apply(this, args);
  if (!this.__namoQmesMirrorInstalled) installQmesMirror(this);
  return result;
};

console.log('[NAMO TEST network] deployed QMES mirror bootstrap loaded.');
