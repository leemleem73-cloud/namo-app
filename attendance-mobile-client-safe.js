'use strict';
const fs=require('fs');
const path=require('path');

function installMobileAttendanceClient(){
  try{
    const file=path.resolve(__dirname,'public','attendance.html');
    if(!fs.existsSync(file))return;
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<script src="\/attendance-mobile-daily-admin\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace('</body>','<script src="/attendance-mobile-daily-admin.js?v=20260907-mobile-daily2"></script></body>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Mobile attendance] daily admin client installed');
  }catch(e){
    console.error('[Mobile attendance] client install failed',e);
  }
}

installMobileAttendanceClient();
module.exports={installMobileAttendanceClient};
