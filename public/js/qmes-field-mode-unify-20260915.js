/* NAMO QMES - unify IQC/PQC/OQC field input visual system (2026-09-15) */
(function(){
  'use strict';
  if(window.__QMES_FIELD_MODE_UNIFY_20260915__) return;
  window.__QMES_FIELD_MODE_UNIFY_20260915__=true;

  const STYLE_ID='qmes-field-mode-unify-style-20260915';
  const ROOT_CLASS='qmes-field-mode-unify';
  const BODY_CLASS='qmes-field-mode-unify-active';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  let scheduled=false;

  function getMode(root){
    const buttons=Array.from(root?.querySelectorAll('.qmes-ipad-mode-tabs button')||[]);
    const index=buttons.findIndex(btn=>btn.classList.contains('is-active'));
    return index===0?'IQC':index===1?'PQC':index===2?'OQC':'';
  }
  function isField(root){ return Boolean(getMode(root))&&/현장입력/.test(clean(root?.querySelector('.qmes-ipad-work-head h1')?.textContent)); }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      body.${BODY_CLASS}>#root>div{background:#edf3f7!important;background-image:none!important;}
      .${ROOT_CLASS}{width:min(1240px,calc(100% - 28px))!important;margin:0 auto!important;padding:18px 0 30px!important;color:#263d50!important;font-family:Pretendard,'Noto Sans KR','Malgun Gothic',Arial,sans-serif!important;}
      .${ROOT_CLASS} .qmes-ipad-work-head{display:grid!important;grid-template-columns:180px minmax(0,1fr) 220px!important;align-items:center!important;gap:14px!important;min-height:76px!important;padding:12px 16px!important;border:1px solid #d3dee7!important;border-radius:14px!important;background:#fff!important;box-shadow:0 5px 18px rgba(37,69,92,.08)!important;}
      .${ROOT_CLASS} .qmes-ipad-back{width:140px!important;height:42px!important;min-height:42px!important;padding:0 14px!important;border:1px solid #cbd8e2!important;border-radius:8px!important;background:#fff!important;color:#203b50!important;font-size:12px!important;font-weight:850!important;box-shadow:0 2px 6px rgba(34,68,92,.06)!important;}
      .${ROOT_CLASS} .qmes-ipad-work-head>div:nth-child(2){display:grid!important;grid-template-columns:auto auto!important;justify-content:center!important;align-items:center!important;column-gap:7px!important;row-gap:2px!important;text-align:center!important;}
      .${ROOT_CLASS} .qmes-ipad-work-head>div:nth-child(2)>span{display:inline!important;margin:0!important;color:#1f5578!important;-webkit-text-fill-color:#1f5578!important;font-family:inherit!important;font-size:19px!important;font-weight:900!important;letter-spacing:-.25px!important;line-height:1.1!important;}
      .${ROOT_CLASS} .qmes-ipad-work-head h1{margin:0!important;color:#122c42!important;-webkit-text-fill-color:#122c42!important;font-size:19px!important;font-weight:900!important;line-height:1.1!important;letter-spacing:-.3px!important;}
      .${ROOT_CLASS} .qmes-ipad-work-head>div:nth-child(2)::after{grid-column:1/-1;display:block;margin-top:2px;color:#71879a;font-size:10.5px;font-weight:650;line-height:1.2;}
      .${ROOT_CLASS}[data-qmes-mode='IQC'] .qmes-ipad-work-head>div:nth-child(2)::after{content:'현재 입고 시 현장에서 검사 결과를 입력합니다.';}
      .${ROOT_CLASS}[data-qmes-mode='PQC'] .qmes-ipad-work-head>div:nth-child(2)::after{content:'생산공정 중 품질검사 결과를 입력합니다.';}
      .${ROOT_CLASS}[data-qmes-mode='OQC'] .qmes-ipad-work-head>div:nth-child(2)::after{content:'출하 전 최종 품질검사 결과를 입력합니다.';}
      .${ROOT_CLASS} .qmes-ipad-inspector{justify-self:end!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;width:190px!important;min-height:42px!important;padding:0 12px!important;border:1px solid #d2dde6!important;border-radius:10px!important;background:#fff!important;color:#334e63!important;font-size:0!important;box-shadow:0 3px 10px rgba(38,73,98,.06)!important;}
      .${ROOT_CLASS} .qmes-ipad-inspector::before{content:'검사자 :';color:#203b50;font-size:12px;font-weight:850;}
      .${ROOT_CLASS} .qmes-ipad-inspector strong{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:78px!important;height:30px!important;margin:0!important;padding:0 10px!important;border:1px solid #d7e1e9!important;border-radius:7px!important;background:#f6f9fb!important;color:#304c61!important;font-size:12px!important;font-weight:800!important;}
      .${ROOT_CLASS} .qmes-ipad-mode-tabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;margin:12px 0!important;}
      .${ROOT_CLASS} .qmes-ipad-mode-tabs button{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;height:56px!important;min-height:56px!important;padding:0 14px!important;border:1px solid #d1dce5!important;border-radius:10px!important;background:#f9fbfc!important;color:#4c6577!important;box-shadow:0 3px 10px rgba(37,69,92,.05)!important;}
      .${ROOT_CLASS} .qmes-ipad-mode-tabs button.is-active{border-color:#168dcc!important;background:#dff2fc!important;box-shadow:0 0 0 1px #168dcc,0 4px 12px rgba(22,141,204,.11)!important;}
      .${ROOT_CLASS} .qmes-ipad-mode-tabs button.is-active::before{content:'✓';display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#0e94d2;color:#fff;font-size:12px;font-weight:950;}
      .${ROOT_CLASS} .qmes-ipad-mode-tabs small,.${ROOT_CLASS} .qmes-ipad-mode-tabs button>small{color:#36566d!important;-webkit-text-fill-color:#36566d!important;font-family:inherit!important;font-size:14px!important;font-weight:900!important;letter-spacing:-.1px!important;line-height:1!important;}
      .${ROOT_CLASS} .qmes-ipad-mode-tabs strong{color:#3b5568!important;-webkit-text-fill-color:#3b5568!important;font-size:14px!important;font-weight:850!important;line-height:1!important;}
      .${ROOT_CLASS} .qmes-ipad-mode-tabs button.is-active small,.${ROOT_CLASS} .qmes-ipad-mode-tabs button.is-active strong{color:#0d78b0!important;-webkit-text-fill-color:#0d78b0!important;}
      .${ROOT_CLASS} .qmes-ipad-section{margin-top:12px!important;padding:14px 16px!important;border:1px solid #d6e0e8!important;border-radius:14px!important;background:#fff!important;color:#243d50!important;box-shadow:0 4px 14px rgba(37,69,92,.06)!important;}
      .${ROOT_CLASS} .qmes-ipad-section-title{display:flex!important;align-items:center!important;gap:10px!important;min-height:34px!important;margin-bottom:10px!important;}
      .${ROOT_CLASS} .qmes-ipad-section-title>span,.${ROOT_CLASS} .qmes-ipad-mode-tabs+.qmes-ipad-section .qmes-ipad-section-title>span{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;flex:0 0 34px!important;border-radius:9px!important;background:#103c5e!important;color:#fff!important;font-size:14px!important;font-weight:950!important;box-shadow:0 3px 8px rgba(16,60,94,.16)!important;}
      .${ROOT_CLASS} .qmes-ipad-section-title>div{display:flex!important;align-items:baseline!important;gap:9px!important;}
      .${ROOT_CLASS} .qmes-ipad-section-title h2,.${ROOT_CLASS} .qmes-ipad-mode-tabs+.qmes-ipad-section .qmes-ipad-section-title h2{margin:0!important;color:#173247!important;font-size:17px!important;font-weight:900!important;line-height:1.2!important;}
      .${ROOT_CLASS} .qmes-ipad-section-title p,.${ROOT_CLASS} .qmes-ipad-mode-tabs+.qmes-ipad-section .qmes-ipad-section-title p{display:block!important;margin:0!important;color:#71869a!important;font-size:10.5px!important;font-weight:650!important;line-height:1.2!important;}
      .${ROOT_CLASS} .qmes-ipad-current-judge{margin-left:auto!important;min-width:54px!important;padding:7px 11px!important;border:1px solid #e1e8ee!important;border-radius:9px!important;background:#f7f9fb!important;color:#587083!important;font-size:11px!important;font-weight:850!important;text-align:center!important;}
      .${ROOT_CLASS} .qmes-ipad-form-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px 12px!important;}
      .${ROOT_CLASS} .qmes-ipad-form-grid label{gap:4px!important;min-width:0!important;}
      .${ROOT_CLASS} .qmes-ipad-form-grid label>span{color:#294459!important;-webkit-text-fill-color:#294459!important;font-size:11px!important;font-weight:850!important;line-height:1.25!important;}
      .${ROOT_CLASS} .qmes-ipad-form-grid input,.${ROOT_CLASS} .qmes-ipad-form-grid select,.${ROOT_CLASS} .qmes-ipad-triple input,.${ROOT_CLASS} .qmes-ipad-repeat-choice input{width:100%!important;height:39px!important;min-height:39px!important;padding:0 11px!important;border:1px solid #c7d5df!important;border-radius:8px!important;background:#fff!important;color:#2a4356!important;font-size:12.5px!important;font-weight:600!important;outline:none!important;box-shadow:none!important;}
      .${ROOT_CLASS} .qmes-ipad-form-grid input[readonly]{background:#f4f7fa!important;color:#6a7f90!important;}
      .${ROOT_CLASS} .qmes-ipad-form-grid input.lot,.${ROOT_CLASS} .qmes-ipad-form-grid select.lot{color:#2a526d!important;-webkit-text-fill-color:#2a526d!important;font-family:inherit!important;font-size:12.5px!important;font-weight:700!important;letter-spacing:0!important;}
      .${ROOT_CLASS} .qmes-ipad-gate{margin-top:10px!important;padding:9px 11px!important;border-radius:8px!important;font-size:10.5px!important;font-weight:800!important;}
      .${ROOT_CLASS} .qmes-ipad-progress{height:5px!important;margin:0 0 10px!important;background:#e7eef4!important;}
      .${ROOT_CLASS} .qmes-ipad-item-tabs{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;margin-bottom:10px!important;}
      .${ROOT_CLASS} .qmes-ipad-item-tabs button{position:relative!important;display:grid!important;grid-template-columns:24px 1fr!important;align-items:center!important;gap:6px!important;height:46px!important;min-height:46px!important;padding:7px 30px 7px 9px!important;border:1px solid #d0dce5!important;border-radius:9px!important;background:#fff!important;color:#344e61!important;box-shadow:none!important;}
      .${ROOT_CLASS} .qmes-ipad-item-tabs button>span{display:grid!important;width:22px!important;height:22px!important;grid-row:auto!important;place-items:center!important;border-radius:6px!important;background:#e8eef3!important;color:#365268!important;font-size:10px!important;font-weight:900!important;}
      .${ROOT_CLASS} .qmes-ipad-item-tabs button strong{color:#213e53!important;-webkit-text-fill-color:#213e53!important;font-size:12px!important;font-weight:850!important;text-align:center!important;}
      .${ROOT_CLASS} .qmes-ipad-item-tabs button small{position:absolute!important;top:6px!important;right:7px!important;color:#71879a!important;font-size:9px!important;font-weight:750!important;}
      .${ROOT_CLASS} .qmes-ipad-item-tabs button.is-active{border-color:#32a7dc!important;background:#eef9fe!important;box-shadow:inset 0 0 0 1px rgba(50,167,220,.12)!important;}
      .${ROOT_CLASS} .qmes-ipad-measure-card{padding:12px 14px!important;border:1px solid #d2dde6!important;border-radius:11px!important;background:#fff!important;}
      .${ROOT_CLASS} .qmes-ipad-measure-head{margin-bottom:10px!important;}
      .${ROOT_CLASS} .qmes-ipad-measure-head span{color:#173247!important;font-size:15px!important;font-weight:900!important;}
      .${ROOT_CLASS} .qmes-ipad-measure-head strong{color:#1689c5!important;font-size:10.5px!important;font-weight:800!important;}
      .${ROOT_CLASS} .qmes-ipad-measure-head small{padding:5px 8px!important;border-radius:7px!important;background:#f4f7fa!important;color:#657b8d!important;font-size:9px!important;font-weight:750!important;}
      .${ROOT_CLASS} .qmes-ipad-choice button,.${ROOT_CLASS} .qmes-ipad-repeat-choice button{height:50px!important;min-height:50px!important;border:1px solid #cfdbe4!important;border-radius:9px!important;background:#fff!important;color:#213e53!important;font-size:13px!important;font-weight:850!important;box-shadow:none!important;}
      .${ROOT_CLASS} .qmes-ipad-choice button.is-selected:first-child,.${ROOT_CLASS} .qmes-ipad-repeat-choice button.is-selected:first-child{border-color:#259bd4!important;background:#e9f7fd!important;color:#0d78b0!important;}
      .${ROOT_CLASS} .qmes-ipad-choice button.is-selected:last-child,.${ROOT_CLASS} .qmes-ipad-repeat-choice button.is-selected:last-child{border-color:#dc7c84!important;background:#fff4f5!important;color:#b63843!important;}
      .${ROOT_CLASS} .qmes-ipad-step-actions{display:grid!important;grid-template-columns:150px minmax(240px,1fr)!important;gap:12px!important;margin-top:12px!important;}
      .${ROOT_CLASS} .qmes-ipad-step-actions button{height:46px!important;min-height:46px!important;border:1px solid #cfdbe4!important;border-radius:9px!important;background:#fff!important;color:#4d6678!important;font-size:12px!important;font-weight:850!important;box-shadow:none!important;}
      .${ROOT_CLASS} .qmes-ipad-step-actions button.primary,.${ROOT_CLASS} .qmes-ipad-step-actions button.save{border-color:#158ccc!important;background:#158ccc!important;color:#fff!important;}
      .${ROOT_CLASS} .qmes-ipad-overall{min-height:62px!important;margin-top:12px!important;padding:10px 14px!important;border:1px solid #d7e1e9!important;border-radius:12px!important;background:#fff!important;color:#425d70!important;box-shadow:0 3px 10px rgba(37,69,92,.04)!important;}
      @media(max-width:760px){.${ROOT_CLASS}{width:calc(100% - 16px)!important}.${ROOT_CLASS} .qmes-ipad-work-head{grid-template-columns:1fr!important}.${ROOT_CLASS} .qmes-ipad-form-grid{grid-template-columns:1fr!important}.${ROOT_CLASS} .qmes-ipad-item-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}.${ROOT_CLASS} .qmes-ipad-step-actions{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function apply(){
    scheduled=false;
    ensureStyle();
    const root=document.querySelector('.qmes-ipad-pop');
    const active=isField(root);
    document.body.classList.toggle(BODY_CLASS,active);
    document.querySelectorAll('.qmes-ipad-pop').forEach(node=>{
      const on=node===root&&active;
      node.classList.toggle(ROOT_CLASS,on);
      if(on) node.dataset.qmesMode=getMode(node); else delete node.dataset.qmesMode;
    });
  }
  function schedule(){ if(scheduled) return; scheduled=true; requestAnimationFrame(()=>{apply();setTimeout(apply,40);}); }
  document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('button')) setTimeout(schedule,0);},true);
  window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  const start=()=>{if(!document.body)return;new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
