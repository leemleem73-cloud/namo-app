(function(){
  'use strict';
  if(window.__QMES_PRODUCTION_ADJUST_20260910__)return;
  window.__QMES_PRODUCTION_ADJUST_20260910__=true;
  const sessionKey='qmes-current-user-v1';
  const loggedIn=()=>{try{return Boolean(window.__QMES_CURRENT_USER__||JSON.parse(sessionStorage.getItem(sessionKey)||'null'));}catch(_){return Boolean(window.__QMES_CURRENT_USER__);}};

  const WORKORDER_STYLE_ID='qmes-workorder-polish-20260915-v3';
  function ensureWorkOrderPolishStyle(){
    if(document.getElementById(WORKORDER_STYLE_ID))return;
    const style=document.createElement('style');
    style.id=WORKORDER_STYLE_ID;
    style.textContent=`
      html body #root main:has(.qmes-wo-issue-shell){padding-left:16px!important;padding-right:16px!important;}
      html body #root main:has(.qmes-wo-issue-shell) > .flex.flex-col.gap-4{width:100%!important;max-width:none!important;margin:0!important;align-items:stretch!important;}
      html body #root main:has(.qmes-wo-issue-shell) > .flex.flex-col.gap-4 > .flex.items-center h2{color:#24364a!important;font-size:16px!important;line-height:1.25!important;font-weight:800!important;letter-spacing:-.2px!important;}
      html body #root .qmes-wo-issue-shell{--wo-text:#3f5367;--wo-muted:#6f8194;box-sizing:border-box!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;padding:0!important;align-self:stretch!important;color:var(--wo-text)!important;font-size:11px!important;}
      html body #root .qmes-wo-issue-shell > *{width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-form-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px 10px!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;align-items:end!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-form-field{min-width:0!important;margin:0!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-form-field > span{display:block!important;margin:0 0 4px!important;color:var(--wo-text)!important;font-size:10px!important;line-height:1.2!important;font-weight:700!important;letter-spacing:-.1px!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-form-field :is(input,select){box-sizing:border-box!important;width:100%!important;height:31px!important;min-height:31px!important;padding:0 8px!important;border:1px solid #c5d1dc!important;border-radius:5px!important;background:#fff!important;color:var(--wo-text)!important;font-size:11px!important;line-height:1!important;font-weight:500!important;box-shadow:none!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-form-field :is(input,select):focus{border-color:#5e9fcc!important;outline:2px solid rgba(94,159,204,.12)!important;outline-offset:0!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-form-field input::placeholder,html body #root .qmes-wo-issue-shell .qmes-material-table input::placeholder{color:#91a0af!important;opacity:1!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-plan-card,html body #root .qmes-wo-issue-shell div.mt-4.bg-slate-800\/50:has(.qmes-material-table){margin-top:12px!important;padding:12px!important;border:1px solid #dce5ed!important;border-radius:8px!important;background:#fff!important;box-shadow:0 1px 2px rgba(15,23,42,.025)!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-plan-title,html body #root .qmes-wo-issue-shell div.mt-4.bg-slate-800\/50:has(.qmes-material-table) > div:first-child{margin:0 0 8px!important;color:var(--wo-text)!important;font-size:11px!important;line-height:1.35!important;font-weight:800!important;letter-spacing:-.1px!important;}
      html body #root .qmes-wo-issue-shell div.mt-4.bg-slate-800\/50:has(.qmes-material-table) > div:first-child span{color:var(--wo-text)!important;font-size:9.5px!important;font-weight:500!important;}

      html body #root .qmes-wo-issue-shell .qmes-material-table{width:100%!important;min-width:1180px!important;table-layout:fixed!important;border-collapse:collapse!important;color:var(--wo-text)!important;font-size:10px!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(1){width:4%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(2){width:17%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(3){width:12%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(4){width:8%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(5){width:9%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(6){width:9%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(7){width:9%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(8){width:7%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(9){width:7%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table col:nth-child(10){width:18%!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table thead tr,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr{border-color:#e4eaf0!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table th{box-sizing:border-box!important;height:30px!important;padding:4px 6px!important;background:#f6f9fb!important;color:var(--wo-text)!important;border-bottom:1px solid #dfe7ee!important;font-size:9.5px!important;line-height:1.15!important;font-weight:800!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table td{box-sizing:border-box!important;height:42px!important;padding:5px 6px!important;background:#fff!important;color:var(--wo-text)!important;border-bottom:1px solid #e6ecf1!important;font-size:10px!important;line-height:1.2!important;font-weight:500!important;vertical-align:middle!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:nth-child(even) td{background:#fbfcfd!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table :is(input,select){box-sizing:border-box!important;display:block!important;width:100%!important;max-width:100%!important;height:30px!important;min-height:30px!important;margin:0!important;padding:0 7px!important;border:1px solid #c8d4df!important;border-radius:4px!important;background:#fff!important;color:var(--wo-text)!important;font-size:10px!important;line-height:1!important;font-weight:500!important;box-shadow:none!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(2),html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(3),html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(4),html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(5),html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(6),html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(10){vertical-align:middle!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(2) > select,html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(3) > input{height:30px!important;min-height:30px!important;margin:0!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table .qmes-qty-wrap{display:flex!important;align-items:center!important;gap:5px!important;height:30px!important;min-height:30px!important;margin:0!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table .qmes-qty-wrap .qmes-qty-input{height:30px!important;min-height:30px!important;margin:0!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table .qmes-qty-unit,html body #root .qmes-wo-issue-shell .qmes-material-table .text-slate-400,html body #root .qmes-wo-issue-shell .qmes-material-table .text-slate-500,html body #root .qmes-wo-issue-shell .qmes-material-table .text-slate-300,html body #root .qmes-wo-issue-shell .qmes-material-table .text-slate-200,html body #root .qmes-wo-issue-shell .qmes-material-table .text-slate-100,html body #root .qmes-wo-issue-shell .qmes-material-table .text-sky-300,html body #root .qmes-wo-issue-shell .qmes-material-table .text-emerald-300,html body #root .qmes-wo-issue-shell .qmes-material-table .text-amber-300{color:var(--wo-text)!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table .qmes-qty-unit,html body #root .qmes-wo-issue-shell .qmes-material-table .text-slate-400,html body #root .qmes-wo-issue-shell .qmes-material-table .text-slate-500{font-size:9.5px!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table span[class*="border-emerald"]{color:#16834f!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table span[class*="border-amber"]{color:#b66a12!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table span[class*="border-red"]{color:#c53a43!important;}

      /* Keep remainder / error / ratio values centered directly under their headers. */
      html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(7),html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(8),html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(9){text-align:center!important;vertical-align:middle!important;padding-left:6px!important;padding-right:6px!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(7) > span,html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(8) > span,html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(9) > span{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:auto!important;margin-right:auto!important;text-align:center!important;}

      /* Total row is a summary row: larger, stronger and centered. */
      html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td{height:46px!important;vertical-align:middle!important;background:#f7fafc!important;border-top:1px solid #cfdae4!important;border-bottom:1px solid #cfdae4!important;color:#33485c!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(2){font-size:13px!important;font-weight:850!important;color:#33485c!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(5),html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(6),html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(7),html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(8),html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(9){font-size:13px!important;line-height:1.2!important;font-weight:850!important;color:#33485c!important;text-align:center!important;white-space:nowrap!important;}
      html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(5) > *,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(6) > *,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(7) > *,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(8) > *,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:nth-child(9) > *{font-size:13px!important;line-height:1.2!important;font-weight:850!important;color:#33485c!important;text-align:center!important;}

      html body #root .qmes-wo-issue-shell .qmes-material-table td:nth-child(10) > .flex{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:6px!important;width:100%!important;height:30px!important;margin:0!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-delete-plain,html body #root .qmes-wo-issue-shell .qmes-material-table button.text-red-300{width:auto!important;height:28px!important;min-height:28px!important;padding:0 4px!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#d43b3b!important;-webkit-text-fill-color:#d43b3b!important;font-size:12px!important;line-height:1!important;font-weight:800!important;box-shadow:none!important;white-space:nowrap!important;opacity:1!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-delete-plain:hover,html body #root .qmes-wo-issue-shell .qmes-material-table button.text-red-300:hover{color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;background:transparent!important;text-decoration:underline!important;}

      html body #root .qmes-wo-issue-shell .qmes-wo-material-add,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:last-child button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;min-width:96px!important;height:31px!important;min-height:31px!important;padding:0 12px!important;border:1px solid #579ac8!important;border-radius:5px!important;background:#dfeff9!important;color:#155b8a!important;-webkit-text-fill-color:#155b8a!important;font-size:11px!important;line-height:1!important;font-weight:850!important;box-shadow:none!important;white-space:nowrap!important;opacity:1!important;visibility:visible!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-material-add svg,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:last-child button svg{color:#155b8a!important;stroke:#155b8a!important;opacity:1!important;}
      html body #root .qmes-wo-issue-shell .qmes-wo-material-add:hover,html body #root .qmes-wo-issue-shell .qmes-material-table tbody tr:last-child td:last-child button:hover{background:#d1e9f7!important;border-color:#3f88b8!important;color:#104b71!important;-webkit-text-fill-color:#104b71!important;}

      html body #root .qmes-wo-issue-shell .qmes-wo-form-grid + div{clear:both!important;}
      @media(max-width:1280px){html body #root .qmes-wo-issue-shell .qmes-wo-form-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;}}
      @media(max-width:900px){html body #root .qmes-wo-issue-shell .qmes-wo-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}
    `;
    document.head.appendChild(style);
  }

  function polishWorkOrderForm(){
    ensureWorkOrderPolishStyle();
    const shell=document.querySelector('.qmes-wo-issue-shell');
    if(!shell)return;

    const materialTable=shell.querySelector('.qmes-material-table');
    if(materialTable){
      const card=materialTable.closest('.mt-4');
      card?.classList.add('qmes-material-plan-card');
      if(card?.firstElementChild)card.firstElementChild.classList.add('qmes-material-plan-title');

      materialTable.querySelectorAll('span').forEach(span=>{
        const text=String(span.textContent||'').trim();
        if(text==='일반원료'||text==='중간재')span.remove();
      });

      materialTable.querySelectorAll('button').forEach(button=>{
        const text=String(button.textContent||'').replace(/\s+/g,' ').trim();
        if(text==='삭제'){
          button.classList.add('qmes-wo-delete-plain');
          button.style.setProperty('font-size','12px','important');
          button.style.setProperty('color','#d43b3b','important');
          button.style.setProperty('-webkit-text-fill-color','#d43b3b','important');
          button.style.setProperty('border','0','important');
          button.style.setProperty('background','transparent','important');
        }
        if(text==='행 추가'||text==='원료 추가'){
          button.classList.add('qmes-wo-material-add');
          Array.from(button.childNodes).forEach(node=>{
            if(node.nodeType===Node.TEXT_NODE&&String(node.textContent||'').includes('행 추가'))node.textContent=String(node.textContent||'').replace('행 추가','원료 추가');
          });
          button.style.setProperty('color','#155b8a','important');
          button.style.setProperty('-webkit-text-fill-color','#155b8a','important');
          button.style.setProperty('background','#dfeff9','important');
          button.style.setProperty('border','1px solid #579ac8','important');
          button.style.setProperty('font-size','11px','important');
          button.style.setProperty('font-weight','850','important');
          button.querySelectorAll('svg').forEach(svg=>{svg.style.setProperty('color','#155b8a','important');svg.style.setProperty('stroke','#155b8a','important');});
        }
      });
    }
  }

  const sync=()=>{
    const visible=loggedIn();
    const header=document.getElementById('qmes-erp-header');
    const side=document.getElementById('qmes-erp-sidebar');
    if(header)header.style.setProperty('display',visible?'flex':'none','important');
    if(side)side.style.setProperty('display',visible?'block':'none','important');
    const note=document.querySelector('#qmes-test-password-modal .qmes-test-password-note');
    if(note)note.textContent='현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.';
    polishWorkOrderForm();
  };

  const PASSWORD_MODAL_ID='qmes-password-modal-fix-20260910';

  function closePasswordMenus(){
    document.getElementById('qmes-test-password-modal')?.remove();
    document.getElementById('qmes-user-dropdown')?.classList.remove('is-open');
    const wrap=document.querySelector('#qmes-erp-header .qmes-erp-account-wrap');
    const account=wrap?.querySelector('.qmes-erp-header-account');
    const menu=wrap?.querySelector('.qmes-erp-account-menu');
    wrap?.classList.remove('is-open');
    account?.setAttribute('aria-expanded','false');
    menu?.style.setProperty('display','none','important');
  }

  function closePasswordModal(){document.getElementById(PASSWORD_MODAL_ID)?.remove();}

  function openPasswordModalImmediate(){
    closePasswordMenus();
    closePasswordModal();

    const overlay=document.createElement('div');
    overlay.id=PASSWORD_MODAL_ID;
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','비밀번호 변경 창');
    overlay.innerHTML='<div class="qmes-pw-card"><div class="qmes-pw-head"><b>비밀번호 변경</b><button type="button" class="qmes-pw-close" aria-label="닫기">×</button></div><form><label>현재 비밀번호<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>새 비밀번호<input name="newPassword" type="password" autocomplete="new-password" minlength="4" required></label><label>새 비밀번호 확인<input name="confirmPassword" type="password" autocomplete="new-password" minlength="4" required></label><div class="qmes-pw-error" aria-live="polite"></div><div class="qmes-pw-actions"><button type="button" class="qmes-pw-cancel">취소</button><button type="submit" class="qmes-pw-save">변경 저장</button></div></form></div>';
    document.body.appendChild(overlay);

    const form=overlay.querySelector('form');
    const errorBox=overlay.querySelector('.qmes-pw-error');
    const close=()=>closePasswordModal();
    overlay.querySelector('.qmes-pw-close')?.addEventListener('click',close);
    overlay.querySelector('.qmes-pw-cancel')?.addEventListener('click',close);
    overlay.addEventListener('mousedown',event=>{if(event.target===overlay)close();});

    form?.addEventListener('submit',async event=>{
      event.preventDefault();
      errorBox.textContent='';
      const currentPassword=String(form.elements.currentPassword?.value||'');
      const newPassword=String(form.elements.newPassword?.value||'');
      const confirmPassword=String(form.elements.confirmPassword?.value||'');
      if(newPassword.length<4){errorBox.textContent='새 비밀번호는 4자 이상 입력하세요.';return;}
      if(newPassword!==confirmPassword){errorBox.textContent='새 비밀번호 확인이 일치하지 않습니다.';return;}
      const submit=form.querySelector('.qmes-pw-save');
      submit.disabled=true;
      submit.textContent='변경 중...';
      try{
        const response=await fetch('/api/auth/password',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});
        const payload=await response.json().catch(()=>({}));
        if(!response.ok||!payload.success){errorBox.textContent=payload.message||'비밀번호 변경에 실패했습니다.';return;}
        close();
        alert('비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
      }catch(error){
        console.error('[QMES] password change failed',error);
        errorBox.textContent='비밀번호 변경 요청 중 오류가 발생했습니다.';
      }finally{
        if(submit&&submit.isConnected){submit.disabled=false;submit.textContent='변경 저장';}
      }
    });

    requestAnimationFrame(()=>form?.elements.currentPassword?.focus());
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const passwordButton=target.closest('#qmes-erp-header [data-qmes-account-action="password"],#qmes-user-dropdown .qmes-dropdown-password');
    if(!passwordButton)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openPasswordModalImmediate();
  },true);

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);
  window.addEventListener('storage',sync);
  setInterval(sync,500);
})();