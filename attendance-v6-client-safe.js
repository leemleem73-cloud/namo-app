'use strict';
const fs=require('fs');
const path=require('path');
function installClient(){
  try{
    const file=path.resolve(__dirname,'public','attendance.html');
    if(!fs.existsSync(file))return;
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<link rel="stylesheet" href="\/attendance-v6\.css\?v=[^"]+"\s*\/?>/g,'');
    html=html.replace(/<script src="\/attendance-v6-review\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace('</head>','<link rel="stylesheet" href="/attendance-v6.css?v=20260908-integrated1"></head>');
    html=html.replace('</body>','<script src="/attendance-v6-review.js?v=20260908-integrated1"></script></body>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance v6] integrated mobile UI client installed');
  }catch(e){console.error('[Attendance v6] client install failed',e)}
}
installClient();
module.exports={installAttendanceV6Client:installClient};
