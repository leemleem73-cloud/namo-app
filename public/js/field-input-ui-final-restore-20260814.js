/* QMES field-input final UI restore — 2026-08-14
 * Keeps the 8/12 field-input layout stable after runtime equipment styling.
 */
(function(){
  'use strict';
  if(window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__) return;
  window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__=true;

  const style=document.createElement('style');
  style.id='qmes-field-input-ui-final-restore-style';
  style.textContent=`
    /* 비고는 검사 기본정보 전체 폭 사용 */
    html body .qmes-ipad-pop .qmes-ipad-form-grid label:has(input[placeholder="특이사항 입력"]){grid-column:1/-1!important;width:100%!important;max-width:none!important;}
    html body .qmes-ipad-pop .qmes-ipad-form-grid label:has(input[placeholder="특이사항 입력"]) input{width:100%!important;max-width:none!important;}

    /* 순회점검 글꼴/크기: 현장입력 전체와 동일 */
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
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h3{font-family:Pretendard,'Pretendard Variable','Noto Sans KR',system-ui,sans-serif!important;letter-spacing:0!important;word-spacing:0!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen{font-size:14px!important;color:#1f2937!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h2,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen h3{font-size:18px!important;font-weight:900!important;line-height:1.3!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen p,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen label,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen span{font-size:14px!important;line-height:1.4!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen input{font-size:16px!important;font-weight:750!important;}

    /* 상단 뒤로가기/잠시 중단/판정 버튼 크기 통일 */
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-head-actions{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-back,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-pause,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-prev,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-next,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-ok,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-bad{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      min-height:42px!important;height:42px!important;padding:0 15px!important;box-sizing:border-box!important;
      border-radius:8px!important;font-size:14px!important;line-height:1!important;font-weight:800!important;
      white-space:nowrap!important;text-decoration:none!important;transform:none!important;animation:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-back,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-prev{
      border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important;-webkit-text-fill-color:#334155!important;box-shadow:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-pause{
      border:1px solid #f59e0b!important;background:#fffbeb!important;color:#b45309!important;-webkit-text-fill-color:#b45309!important;box-shadow:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-next{
      border:1px solid #2563eb!important;background:#2563eb!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-ok{
      border:1px solid #22c55e!important;background:#f0fdf4!important;color:#15803d!important;-webkit-text-fill-color:#15803d!important;box-shadow:none!important;
    }
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-bad{
      border:1px solid #ef4444!important;background:#fef2f2!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;box-shadow:none!important;
    }

    /* 순회점검 판독값/규격 텍스트가 갑자기 작아지지 않도록 고정 */
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-reading{min-height:48px!important;font-size:17px!important;line-height:1!important;font-weight:800!important;text-align:center!important;}
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-reading.is-spec-out,
    html body .qmes-ipad-equipment .qmes-equipment-tour-screen .qmes-equipment-tour-reading[aria-invalid="true"]{border-color:#ef4444!important;background:#fff1f2!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;box-shadow:0 0 0 2px rgba(239,68,68,.12)!important;}
  `;
  document.head.appendChild(style);

  let queued=false;
  function forceButtonState(){
    queued=false;
    const root=document.querySelector('.qmes-ipad-equipment .qmes-equipment-tour-screen');
    if(!root)return;
    const configs=[
      ['.qmes-equipment-tour-back,.qmes-equipment-tour-prev',{border:'1px solid #cbd5e1',background:'#fff',color:'#334155'}],
      ['.qmes-equipment-tour-pause',{border:'1px solid #f59e0b',background:'#fffbeb',color:'#b45309'}],
      ['.qmes-equipment-tour-next',{border:'1px solid #2563eb',background:'#2563eb',color:'#fff'}],
      ['.qmes-equipment-tour-ok',{border:'1px solid #22c55e',background:'#f0fdf4',color:'#15803d'}],
      ['.qmes-equipment-tour-bad',{border:'1px solid #ef4444',background:'#fef2f2',color:'#dc2626'}]
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
      button.style.setProperty('font-size','14px','important');
      button.style.setProperty('font-weight','800','important');
      button.style.setProperty('height','42px','important');
      button.style.setProperty('min-height','42px','important');
    }));
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(forceButtonState);}
  document.addEventListener('pointerover',event=>{if(event.target.closest?.('.qmes-equipment-tour-screen'))schedule();},true);
  document.addEventListener('focusin',event=>{if(event.target.closest?.('.qmes-equipment-tour-screen'))schedule();},true);
  document.addEventListener('click',event=>{if(event.target.closest?.('.qmes-equipment-tour-screen,.qmes-ipad-home-card.is-equipment'))setTimeout(schedule,0);},true);
  window.addEventListener('qmes:auth-ready',()=>setTimeout(schedule,100));
  setTimeout(schedule,300);
})();