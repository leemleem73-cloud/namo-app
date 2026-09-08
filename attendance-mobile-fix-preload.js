'use strict';
const fs=require('fs');
const path=require('path');
function install(){
  try{
    const file=path.resolve(__dirname,'public','attendance.html');
    if(!fs.existsSync(file))return;
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-mobile-fix-20260908\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace(/<script src="\/attendance-mobile-fix-20260908\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace('</head>','<link rel="stylesheet" href="/attendance-mobile-fix-20260908.css?v=20260908-fix2"></head>');
    html=html.replace('</body>','<script src="/attendance-mobile-fix-20260908.js?v=20260908-fix2"></script></body>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance mobile fix] clock/schedule/records/leave polish installed');
  }catch(e){console.error('[Attendance mobile fix] preload failed',e)}
}
install();
module.exports={installAttendanceMobileFix:install};
