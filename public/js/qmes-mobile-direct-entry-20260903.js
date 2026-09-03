/* NAMO QMES mobile-only direct-entry helper — 2026-09-03 */
(function installQmesMobileDirectEntry(){
  'use strict';
  if(window.__QMES_MOBILE_DIRECT_ENTRY_20260903__)return;
  window.__QMES_MOBILE_DIRECT_ENTRY_20260903__=true;
  if(!location.pathname.toLowerCase().endsWith('/mobile-work.html'))return;

  const params=new URLSearchParams(location.search);
  const tab=String(params.get('tab')||'').toLowerCase();

  // Mobile SPC is a dedicated Cpk/SPC dashboard. Never render the generic
  // PQC/OQC record-list view for tab=spc.
  if(tab==='spc'){
    location.replace('/mobile-spc.html?v=20260904-spc1');
    return;
  }

  if(params.get('new')!=='1')return;
  const docType=String(params.get('doctype')||'').trim();
  const requestedTitle=String(params.get('title')||'').trim();
  let finished=false;

  function visible(el){return !!(el&&el.isConnected&&getComputedStyle(el).display!=='none');}
  function click(el){if(!el||finished)return false;finished=true;el.click();return true;}
  function setDocs(){
    const newButton=document.getElementById('qmdNew');
    if(!newButton)return false;
    newButton.click();
    setTimeout(()=>{
      const type=document.getElementById('qmdDocType');
      if(type&&docType){type.value=docType;type.dispatchEvent(new Event('change',{bubbles:true}));}
      if(requestedTitle){setTimeout(()=>{const form=document.getElementById('qmdForm');if(form?.title)form.title.value=requestedTitle;},120);}
    },80);
    finished=true;
    return true;
  }
  function tryOpen(){
    if(finished)return;
    if(tab==='docs'&&setDocs())return;
    if(tab==='iqc'&&click(document.getElementById('qmiNew')))return;
    if((tab==='pqc'||tab==='oqc')&&click(document.getElementById('createBtn')))return;
    if(tab==='inv'&&click(document.getElementById('qmitInvReceipt')))return;
    const generic=document.getElementById('createBtn');
    if(visible(generic))click(generic);
  }
  const observer=new MutationObserver(tryOpen);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  let tries=0;
  const timer=setInterval(()=>{tryOpen();tries+=1;if(finished||tries>50){clearInterval(timer);observer.disconnect();}},100);
  setTimeout(tryOpen,50);
})();
