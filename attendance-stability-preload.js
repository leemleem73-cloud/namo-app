'use strict';
const fs=require('fs');
const path=require('path');
try{
  const file=path.resolve(__dirname,'public','attendance.html');
  if(fs.existsSync(file)){
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-mobile-stability-20260908\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-reference-ui-20260908\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace(/<script src="\/attendance-reference-ui-20260908\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace('</head>','<link rel="stylesheet" href="/attendance-mobile-stability-20260908.css?v=20260908-stable1"><link rel="stylesheet" href="/attendance-reference-ui-20260908.css?v=20260908-ref1"></head>');
    html=html.replace('</body>','<script src="/attendance-reference-ui-20260908.js?v=20260908-ref1"></script></body>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance stability] attendance-only anti-flicker + reference UI installed');
  }
}catch(e){console.error('[Attendance stability] preload failed',e)}
