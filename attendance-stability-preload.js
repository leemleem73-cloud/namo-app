'use strict';
const fs=require('fs');
const path=require('path');
try{
  const file=path.resolve(__dirname,'public','attendance.html');
  if(fs.existsSync(file)){
    let html=fs.readFileSync(file,'utf8');

    const cssFiles=[
      'attendance-mobile-stability-20260908.css',
      'attendance-reference-ui-20260908.css',
      'attendance-admin-test-fix-20260909.css',
      'attendance-test-ui-20260909-v1.css',
      'attendance-layout-fix-20260909.css',
      'attendance-enterprise-home-20260909.css'
    ];
    const jsFiles=[
      'attendance-dom-compat-20260908.js',
      'attendance-test-fixes-20260909.js',
      'attendance-admin-benchmark-20260909.js',
      'attendance-reference-ui-20260908.js',
      'attendance-enterprise-home-20260909.js',
      'attendance-approved-detail-20260909.js',
      'attendance-direct-mail-20260909.js'
    ];

    for(const name of cssFiles){
      const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      html=html.replace(new RegExp(`<link rel="stylesheet" href="\\/${escaped}\\?v=[^"]+"\\s*\\/?>`,'g'),'');
    }
    for(const name of jsFiles){
      const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      html=html.replace(new RegExp(`<script src="\\/${escaped}\\?v=[^"]+"><\\/script>`,'g'),'');
    }

    html=html.replace(/<script src="\/attendance-final-polish-20260917\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace(/<style id="namo-attendance-hard-reload-hide-20260917">[\s\S]*?<\/style>/g,'');

    html=html.replace(/<script>window\.__NAMO_ATT_BOOT_FAILSAFE__=[\s\S]*?<\/script>/g,'');
    html=html.replace(/\sdata-attendance-boot="[^"]*"/g,'');
    html=html.replace(/<html([^>]*data-namo-attendance-full-ui="v4"[^>]*)>/i,'<html$1 data-attendance-boot="pending">');
    html=html.replace(/<script src="\/attendance-admin-mode-v4\.js\?v=[^"]+"><\/script>/g,'<script src="/attendance-admin-mode-v4.js?v=20260909-production2"></script>');

    const hardReloadHide='<style id="namo-attendance-hard-reload-hide-20260917">'+
      'html[data-namo-attendance-full-ui="v4"][data-namo-final-ready="0"] body>*,'+
      'html[data-namo-reloading="1"] body>*{display:none!important;visibility:hidden!important;opacity:0!important}'+
      'html[data-namo-attendance-full-ui="v4"][data-namo-final-ready="0"] body,'+
      'html[data-namo-reloading="1"] body{margin:0!important;min-height:100vh!important;background:#eef2f6!important;overflow:hidden!important}'+
      'html[data-namo-attendance-full-ui="v4"][data-namo-final-ready="1"] body>*{visibility:visible}'+
      'html[data-namo-attendance-full-ui="v4"] .page[data-page="home"] .clock-btn,'+
      'html[data-namo-attendance-full-ui="v4"] .page[data-page="home"] .clock-btn[disabled]{opacity:1!important;filter:none!important;transition:none!important;animation:none!important}'+
      'html[data-namo-attendance-full-ui="v4"] .page[data-page="home"] .namo-clock-photo{opacity:1!important;filter:none!important;transition:none!important;animation:none!important}'+
      'html[data-namo-attendance-full-ui="v4"] .page[data-page="home"] .clock-btn:before,'+
      'html[data-namo-attendance-full-ui="v4"] .page[data-page="home"] .clock-btn:after{display:none!important;content:none!important;background:none!important;background-image:none!important;filter:none!important;transform:none!important}'+
      '</style>';

    const styles=[
      '<link rel="stylesheet" href="/attendance-mobile-stability-20260908.css?v=20260908-stable2">',
      '<link rel="stylesheet" href="/attendance-reference-ui-20260908.css?v=20260908-ref2">',
      '<link rel="stylesheet" href="/attendance-admin-test-fix-20260909.css?v=20260909-production2">',
      '<link rel="stylesheet" href="/attendance-test-ui-20260909-v1.css?v=20260909-production2">',
      '<link rel="stylesheet" href="/attendance-layout-fix-20260909.css?v=20260909-production2">',
      '<link rel="stylesheet" href="/attendance-enterprise-home-20260909.css?v=20260909-production2">',
      hardReloadHide
    ].join('');
    html=html.replace('</head>',styles+'</head>');

    html=html.replace(
      '<script src="/attendance-v4-live.js',
      '<script src="/attendance-dom-compat-20260908.js?v=20260908-dom2"></script><script src="/attendance-test-fixes-20260909.js?v=20260909-production2"></script><script src="/attendance-v4-live.js'
    );

    const tail=[
      '<script src="/attendance-admin-benchmark-20260909.js?v=20260909-production2"></script>',
      '<script src="/attendance-reference-ui-20260908.js?v=20260908-ref2"></script>',
      '<script src="/attendance-enterprise-home-20260909.js?v=20260909-production2"></script>',
      '<script src="/attendance-approved-detail-20260909.js?v=20260909-production2"></script>',
      '<script src="/attendance-direct-mail-20260909.js?v=20260909-production2"></script>',
      '<script src="/attendance-final-polish-20260917.js?v=20260917-final-last8"></script>'
    ].join('');
    html=html.replace('</body>',tail+'</body>');

    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance stability] final UI locked; refresh flash hidden; clock artwork opacity fixed');
  }
}catch(e){console.error('[Attendance stability] preload failed',e)}
