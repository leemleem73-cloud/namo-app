'use strict';
const express=require('express');

if(!express.response.__NAMO_CORPORATE_ATTENDANCE_SEND_HOOK_20260917__){
  express.response.__NAMO_CORPORATE_ATTENDANCE_SEND_HOOK_20260917__=true;
  const originalSend=express.response.send;

  express.response.send=function namoCorporateAttendanceSend(body){
    try{
      const req=this.req||{};
      const pathname=String(req.path||req.url||'').split('?')[0].toLowerCase();
      if(pathname==='/attendance.html'&&(typeof body==='string'||Buffer.isBuffer(body))){
        let html=Buffer.isBuffer(body)?body.toString('utf8'):String(body||'');
        if(/<\/body>/i.test(html)){
          if(!html.includes('namo-corporate-first-paint-20260917')){
            const style='<style id="namo-corporate-first-paint-20260917">html[data-namo-attendance-full-ui="v4"]:not([data-namo-corp-ready="1"]) .app-shell{visibility:hidden!important;opacity:0!important}html[data-namo-attendance-full-ui="v4"]:not([data-namo-corp-ready="1"]) body{background:#edf3f8!important}html[data-namo-attendance-full-ui="v4"]:not([data-namo-corp-ready="1"]) body:after{content:"";position:fixed;inset:0;z-index:2147483646;background:#edf3f8}</style>';
            html=html.replace(/<\/head>/i,style+'\n</head>');
          }
          if(!html.includes('/attendance-corporate-home-20260917.js')){
            html=html.replace(/<\/body>/i,'<script src="/attendance-corporate-home-20260917.js?v=20260917-corp4"></script>\n</body>');
          }
          this.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
          this.setHeader('Pragma','no-cache');
          this.setHeader('Expires','0');
          body=Buffer.isBuffer(body)?Buffer.from(html,'utf8'):html;
        }
      }
    }catch(error){
      console.error('[Attendance corporate] response hook failed',error);
    }
    return originalSend.call(this,body);
  };
  console.log('[Attendance corporate] direct response hook enabled');
}
