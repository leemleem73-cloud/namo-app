/* Inventory QR runtime recovery + detail layout cleanup, 2026-08-21. */
(function(){
  'use strict';

  document.getElementById('qmes-inventory-hover-menu')?.remove();
  if(window.__QMES_INV_QR_RUNTIME_FIX_V2__)return;
  window.__QMES_INV_QR_RUNTIME_FIX_V2__=true;

  const QR_PRIMARY='https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.3.3/qrcode.min.js';
  const QR_FALLBACK='https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
  const MODULE_ERROR='QR 생성 모듈을 불러오지 못했습니다.';
  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  const qrReady=()=>Boolean(window.QRCode&&typeof window.QRCode.toDataURL==='function');

  function loadScript(src,key){
    return new Promise((resolve,reject)=>{
      if(qrReady()){resolve(window.QRCode);return;}
      const selector=`script[data-qmes-inventory-qr-source="${key}"]`;
      const existing=document.querySelector(selector);
      if(existing){
        const done=()=>qrReady()?resolve(window.QRCode):reject(new Error(`QR 모듈 로드 실패: ${key}`));
        existing.addEventListener('load',done,{once:true});
        existing.addEventListener('error',()=>reject(new Error(`QR 모듈 요청 실패: ${key}`)),{once:true});
        window.setTimeout(done,1200);
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.crossOrigin='anonymous';
      script.dataset.qmesInventoryQrSource=key;
      script.onload=()=>qrReady()?resolve(window.QRCode):reject(new Error(`QR 모듈 형식 오류: ${key}`));
      script.onerror=()=>reject(new Error(`QR 모듈 요청 실패: ${key}`));
      document.head.appendChild(script);
    });
  }

  async function ensureQrLibrary(){
    if(qrReady())return window.QRCode;
    try{await loadScript(QR_PRIMARY,'cdnjs-1.3.3');}catch(error){console.warn('[QMES QR] 기본 모듈 로드 실패',error.message);}
    if(qrReady())return window.QRCode;
    try{await loadScript(QR_FALLBACK,'jsdelivr-1.5.4');}catch(error){console.warn('[QMES QR] 예비 모듈 로드 실패',error.message);}
    if(qrReady())return window.QRCode;
    throw new Error(MODULE_ERROR);
  }

  let qrPromise=null;
  window.qmesEnsureInventoryQr=()=>{
    if(qrReady())return Promise.resolve(window.QRCode);
    if(!qrPromise){
      qrPromise=ensureQrLibrary().catch(error=>{qrPromise=null;throw error;});
    }
    return qrPromise;
  };

  function findDetailCell(sheet,label){
    return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;
  }

  function cleanDetailLayout(sheet){
    const grid=sheet.querySelector('.inv-tx-detail-grid');
    if(!grid)return;

    Array.from(grid.children).forEach(node=>{
      const label=clean(node.querySelector('dt')?.textContent);
      const value=clean(node.querySelector('dd')?.textContent);
      if(!label&&!value)node.remove();
    });

    const direction=findDetailCell(sheet,'이동 방향');
    if(direction){
      direction.classList.add('wide');
      direction.style.setProperty('grid-column','1 / -1','important');
    }

    const header=sheet.querySelector('.inv-tx-detail-head>div>span');
    if(header&&header.querySelector('img')){
      header.replaceChildren(document.createTextNode('INVENTORY TRANSACTION'));
      header.removeAttribute('style');
    }
  }

  function hasQrModuleError(sheet){
    return Array.from(sheet.querySelectorAll('.inv-tx-barcode code,.inv-tx-barcode div,.inv-tx-barcode span')).some(node=>clean(node.textContent)===MODULE_ERROR);
  }

  function requestQrRetry(sheet){
    if(!qrReady()||!hasQrModuleError(sheet))return;
    sheet.dataset.qmesQrDone='0';
    sheet.dataset.qmesQrBusy='0';
    const marker=document.createElement('i');
    marker.hidden=true;
    marker.dataset.qmesQrRetry='1';
    sheet.appendChild(marker);
    marker.remove();
  }

  function repairOpenDetails(){
    document.querySelectorAll('.inv-tx-detail-sheet').forEach(sheet=>{
      cleanDetailLayout(sheet);
      requestQrRetry(sheet);
    });
  }

  const observer=new MutationObserver(repairOpenDetails);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('qmes:inventory-qr-ready',repairOpenDetails);
  window.addEventListener('load',repairOpenDetails,{once:true});

  window.qmesEnsureInventoryQr()
    .then(()=>{
      document.dispatchEvent(new CustomEvent('qmes:inventory-qr-ready'));
      repairOpenDetails();
    })
    .catch(error=>console.error('[QMES QR]',error.message));

  repairOpenDetails();
})();
