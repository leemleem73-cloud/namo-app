'use strict';
const fs=require('fs');
const path=require('path');
try{
  const file=path.resolve(__dirname,'public','attendance.html');
  if(fs.existsSync(file)){
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-mobile-stability-20260908\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace('</head>','<link rel="stylesheet" href="/attendance-mobile-stability-20260908.css?v=20260908-stable1"></head>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance stability] attendance-only anti-flicker CSS installed');
  }
}catch(e){console.error('[Attendance stability] preload failed',e)}
