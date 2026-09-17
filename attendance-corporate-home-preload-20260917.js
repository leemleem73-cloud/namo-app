'use strict';
const fs=require('fs');
const path=require('path');

if(!fs.__NAMO_CORPORATE_ATTENDANCE_PRELOAD_20260917__){
  fs.__NAMO_CORPORATE_ATTENDANCE_PRELOAD_20260917__=true;
  const originalReadFile=fs.readFile.bind(fs);
  fs.readFile=function namoCorporateAttendanceReadFile(file,...args){
    const callback=typeof args[args.length-1]==='function'?args[args.length-1]:null;
    const normalized=String(file||'').replace(/\\/g,'/').toLowerCase();
    if(!callback||!normalized.endsWith('/public/attendance.html'))return originalReadFile(file,...args);
    const wrapped=function(error,data){
      if(error)return callback(error,data);
      let html=Buffer.isBuffer(data)?data.toString('utf8'):String(data||'');
      if(!html.includes('namo-corporate-first-paint-20260917')){
        const style='<style id="namo-corporate-first-paint-20260917">html[data-namo-attendance-full-ui="v4"]:not([data-namo-corp-ready="1"]) .app-shell{visibility:hidden!important;opacity:0!important}html[data-namo-attendance-full-ui="v4"]:not([data-namo-corp-ready="1"]) body{background:#edf3f8!important}html[data-namo-attendance-full-ui="v4"]:not([data-namo-corp-ready="1"]) body:after{content:"";position:fixed;inset:0;z-index:2147483646;background:#edf3f8}</style>';
        html=html.replace('</head>',style+'\n</head>');
      }
      if(!html.includes('attendance-corporate-home-20260917.js')){
        html=html.replace('</body>','<script src="/attendance-corporate-home-20260917.js?v=20260917-corp3"></script>\n</body>');
      }
      const encoding=args.find(v=>typeof v==='string')||null;
      callback(null,encoding?html:Buffer.from(html,'utf8'));
    };
    const nextArgs=args.slice();nextArgs[nextArgs.length-1]=wrapped;
    return originalReadFile(file,...nextArgs);
  };
  console.log('[Attendance corporate] additive response patch enabled');
}
