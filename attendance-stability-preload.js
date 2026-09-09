'use strict';
const fs=require('fs');
const path=require('path');
try{
  const file=path.resolve(__dirname,'public','attendance.html');
  if(fs.existsSync(file)){
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-mobile-stability-20260908\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-reference-ui-20260908\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-admin-test-fix-20260909\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace(/<script src="\/attendance-dom-compat-20260908\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace(/<script src="\/attendance-reference-ui-20260908\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace(/\sdata-attendance-boot="[^"]*"/g,'');
    html=html.replace(/<html([^>]*data-namo-attendance-full-ui="v4"[^>]*)>/i,'<html$1 data-attendance-boot="pending">');
    html=html.replace('</head>','<link rel="stylesheet" href="/attendance-mobile-stability-20260908.css?v=20260908-stable2"><link rel="stylesheet" href="/attendance-reference-ui-20260908.css?v=20260908-ref2"><link rel="stylesheet" href="/attendance-admin-test-fix-20260909.css?v=20260909-admin-fix1"></head>');
    html=html.replace('<script src="/attendance-v4-live.js', '<script src="/attendance-dom-compat-20260908.js?v=20260908-dom2"></script><script src="/attendance-v4-live.js');
    html=html.replace('</body>','<script src="/attendance-reference-ui-20260908.js?v=20260908-ref2"></script></body>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance stability] attendance-only stability + reference UI + admin boot/branding fix installed');
  }
}catch(e){console.error('[Attendance stability] preload failed',e)}
