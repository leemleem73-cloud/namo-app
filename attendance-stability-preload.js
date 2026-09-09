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

    html=html.replace(/<script>window\.__NAMO_ATT_BOOT_FAILSAFE__=[\s\S]*?<\/script>/g,'');
    html=html.replace(/\sdata-attendance-boot="[^"]*"/g,'');
    html=html.replace(/<html([^>]*data-namo-attendance-full-ui="v4"[^>]*)>/i,'<html$1 data-attendance-boot="pending">');
    html=html.replace(/<script src="\/attendance-admin-mode-v4\.js\?v=[^"]+"><\/script>/g,'<script src="/attendance-admin-mode-v4.js?v=20260909-production2"></script>');

    const styles=[
      '<link rel="stylesheet" href="/attendance-mobile-stability-20260908.css?v=20260908-stable2">',
      '<link rel="stylesheet" href="/attendance-reference-ui-20260908.css?v=20260908-ref2">',
      '<link rel="stylesheet" href="/attendance-admin-test-fix-20260909.css?v=20260909-production2">',
      '<link rel="stylesheet" href="/attendance-test-ui-20260909-v1.css?v=20260909-production2">',
      '<link rel="stylesheet" href="/attendance-layout-fix-20260909.css?v=20260909-production2">',
      '<link rel="stylesheet" href="/attendance-enterprise-home-20260909.css?v=20260909-production2">'
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
      '<script src="/attendance-direct-mail-20260909.js?v=20260909-production2"></script>'
    ].join('');
    html=html.replace('</body>',tail+'</body>');

    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance stability] production attendance UI + approved detail + direct mail installed');
  }
}catch(e){console.error('[Attendance stability] preload failed',e)}
