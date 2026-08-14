/* QMES field-input final UI restore — 2026-08-14 */
(function(){
  'use strict';
  if(window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__) return;
  window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__=true;

  const style=document.createElement('style');
  style.id='qmes-field-input-ui-final-restore-style';
  style.textContent=`
    html body .qmes-ipad-pop .qmes-ipad-form-grid label:has(input[placeholder="특이사항 입력"]){grid-column:1/-1!important;width:100%!important;max-width:none!important;}
    html body .qmes-ipad-pop .qmes-ipad-form-grid label:has(input[placeholder="특이사항 입력"]) input{width:100%!important;max-width:none!important;}

    /* 순회점검: NMP 표시와 같은 단정한 Pretendard 계열 */
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen button,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen input,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen select,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen textarea,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen span,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen strong,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen p,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h1,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h2,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h3{
      font-family:Pretendard,'Pretendard Variable','Noto Sans KR',system-ui,sans-serif!important;
      letter-spacing:0!important;word-spacing:0!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen{font-size:13px!important;color:#1f2937!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h2,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h3{font-size:17px!important;font-weight:850!important;line-height:1.3!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen p,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen label,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen span{font-size:13px!important;line-height:1.35!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen input{font-size:15px!important;font-weight:750!important;}

    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-head-actions{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:nowrap!important;}

    /* 뒤로가기 / 잠시 중단: 예전처럼 작고 완전히 동일한 크기 */
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-back,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-pause{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      width:88px!important;min-width:88px!important;max-width:88px!important;
      height:34px!important;min-height:34px!important;max-height:34px!important;
      padding:0 8px!important;box-sizing:border-box!important;border-radius:7px!important;
      font-size:12px!important;line-height:1!important;font-weight:800!important;white-space:nowrap!important;
      text-decoration:none!important;transform:none!important;animation:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-back{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important;-webkit-text-fill-color:#334155!important;box-shadow:none!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-pause{border:1px solid #f59e0b!important;background:#fffbeb!important;color:#b45309!important;-webkit-text-fill-color:#b45309!important;box-shadow:none!important;}

    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-prev,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-next,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-ok,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-bad{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      min-height:38px!important;height:38px!important;padding:0 12px!important;box-sizing:border-box!important;
      border-radius:7px!important;font-size:13px!important;line-height:1!important;font-weight:800!important;
      white-space:nowrap!important;text-decoration:none!important;transform:none!important;animation:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-prev{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important;-webkit-text-fill-color:#334155!important;box-shadow:none!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-next{border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:none!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-ok{border:1px solid #22c55e!important;background:#f0fdf4!important;color:#15803d!important;-webkit-text-fill-color:#15803d!important;box-shadow:none!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-bad{border:1px solid #ef4444!important;background:#fef2f2!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;box-shadow:none!important;}

    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-reading{min-height:46px!important;font-size:16px!important;line-height:1!important;font-weight:800!important;text-align:center!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-reading.is-spec-out,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-reading[aria-invalid="true"]{border-color:#ef4444!important;background:#fff1f2!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;box-shadow:0 0 0 2px rgba(239,68,68,.12)!important;}

    /* 대기 상태 글자가 배지 밖으로 밀리지 않도록 */
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-tour-waiting-badge{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      width:66px!important;min-width:66px!important;max-width:66px!important;
      height:30px!important;min-height:30px!important;max-height:30px!important;
      padding:0 6px!important;box-sizing:border-box!important;overflow:hidden!important;
      border-radius:7px!important;white-space:nowrap!important;text-align:center!important;
      font-family:Pretendard,'Pretendard Variable','Noto Sans KR',system-ui,sans-serif!important;
      font-size:12px!important;line-height:1!important;font-weight:800!important;
    }
  `;
  document.head.appendChild(style);

  let queued=false;
  function forceState(){
    queued=false;
    const root=document.querySelector('.qmes-ipad-equipment .qmes-equipment-tour-screen');
    if(!root)return;

    root.querySelectorAll('*').forEach(node=>{
      if(node.children.length===0 && String(node.textContent||'').trim()==='대기') node.classList.add('qmes-tour-waiting-badge');
    });

    const configs=[
      ['.qmes-equipment-tour-back',{border:'1px solid #cbd5e1',background:'#fff',color:'#334155',w:'88px',h:'34px',fs:'12px'}],
      ['.qmes-equipment-tour-pause',{border:'1px solid #f59e0b',background:'#fffbeb',color:'#b45309',w:'88px',h:'34px',fs:'12px'}],
      ['.qmes-equipment-tour-prev',{border:'1px solid #cbd5e1',background:'#fff',color:'#334155',h:'38px',fs:'13px'}],
      ['.qmes-equipment-tour-next',{border:'1px solid #2563eb',background:'#2563eb',color:'#fff',h:'38px',fs:'13px'}],
      ['.qmes-equipment-tour-ok',{border:'1px solid #22c55e',background:'#f0fdf4',color:'#15803d',h:'38px',fs:'13px'}],
      ['.qmes-equipment-tour-bad',{border:'1px solid #ef4444',background:'#fef2f2',color:'#dc2626',h:'38px',fs:'13px'}]
    ];
    configs.forEach(([selector,cfg])=>root.querySelectorAll(selector).forEach(button=>{
      button.style.setProperty('border',cfg.border,'important');
      button.style.setProperty('background',cfg.background,'important');
      button.style.setProperty('background-color',cfg.background,'important');
      button.style.setProperty('color',cfg.color,'important');
      button.style.setProperty('-webkit-text-fill-color',cfg.color,'important');
      button.style.setProperty('box-shadow','none','important');
      button.style.setProperty('transform','none','important');
      button.style.setProperty('font-family',"Pretendard,'Pretendard Variable','Noto Sans KR',system-ui,sans-serif",'important');
      button.style.setProperty('font-size',cfg.fs,'important');
      button.style.setProperty('font-weight','800','important');
      button.style.setProperty('height',cfg.h,'important');
      button.style.setProperty('min-height',cfg.h,'important');
      button.style.setProperty('max-height',cfg.h,'important');
      if(cfg.w){button.style.setProperty('width',cfg.w,'important');button.style.setProperty('min-width',cfg.w,'important');button.style.setProperty('max-width',cfg.w,'important');}
    }));
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(forceState);}
  document.addEventListener('pointerover',event=>{if(event.target.closest?.('.qmes-equipment-tour-screen'))schedule();},true);
  document.addEventListener('focusin',event=>{if(event.target.closest?.('.qmes-equipment-tour-screen'))schedule();},true);
  document.addEventListener('click',event=>{if(event.target.closest?.('.qmes-equipment-tour-screen,.qmes-ipad-home-card.is-equipment'))setTimeout(schedule,0);},true);
  window.addEventListener('qmes:auth-ready',()=>setTimeout(schedule,100));
  setTimeout(schedule,300);
})();