'use strict';
const express=require('express');
if(!express.response.__NAMO_QMES_GAP_COMPACT_20260917__){
  express.response.__NAMO_QMES_GAP_COMPACT_20260917__=true;
  const originalSend=express.response.send;
  express.response.send=function namoQmesGapCompactSend(body){
    try{
      const req=this.req||{};
      const pathname=String(req.path||req.url||'').split('?')[0].toLowerCase();
      if(pathname==='/attendance.html'&&(typeof body==='string'||Buffer.isBuffer(body))){
        let html=Buffer.isBuffer(body)?body.toString('utf8'):String(body||'');
        if(/<\/head>/i.test(html)&&!html.includes('namo-qmes-gap-compact-20260917')){
          const style='<style id="namo-qmes-gap-compact-20260917">html[data-namo-corporate-home="1"] .app-shell{min-height:0!important;height:auto!important}html[data-namo-corporate-home="1"] main{min-height:0!important;height:auto!important;padding-bottom:0!important}html[data-namo-corporate-home="1"] .page[data-page="home"]{min-height:0!important;height:auto!important;padding-bottom:0!important}html[data-namo-corporate-home="1"] #namoCorporateHome{min-height:0!important;height:auto!important;margin-bottom:0!important;padding-bottom:0!important}html[data-namo-corporate-home="1"] #namoCorporateBottomNav{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;width:100%!important;margin:0!important}html[data-namo-corporate-home="1"] #namoCorporateHome .namo-corp-week{margin-bottom:0!important}</style>';
          html=html.replace(/<\/head>/i,style+'\n</head>');
          this.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
          this.setHeader('Pragma','no-cache');
          this.setHeader('Expires','0');
          body=Buffer.isBuffer(body)?Buffer.from(html,'utf8'):html;
        }
      }
    }catch(error){console.error('[Attendance gap compact] failed',error)}
    return originalSend.call(this,body);
  };
  console.log('[Attendance gap compact] response hook enabled');
}
