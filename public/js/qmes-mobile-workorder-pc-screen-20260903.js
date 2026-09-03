/* NAMO QMES mobile/iPad-only visual parity for the current PC work-order screen — 2026-09-03 */
(function installMobileWorkOrderPcScreen(){
  'use strict';
  if(window.__QMES_MOBILE_WORKORDER_PC_SCREEN_20260903__)return;
  window.__QMES_MOBILE_WORKORDER_PC_SCREEN_20260903__=true;
  const params=new URLSearchParams(location.search);
  if(String(params.get('tab')||'')!=='woIssue')return;

  const STYLE_ID='qmes-mobile-workorder-pc-screen-style-20260903';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let applying=false;

  function salesRows(){
    try{
      const rows=JSON.parse(localStorage.getItem('qmes-erp-sales-v1')||'[]');
      const meta=JSON.parse(localStorage.getItem('qmes-sales-order-meta-v1')||'{}');
      const links=JSON.parse(localStorage.getItem('qmes-sales-workorder-link-v1')||'{}');
      if(!Array.isArray(rows))return[];
      return rows.map(row=>{
        const raw=clean(row?.id),key=clean(row?.workOrder)||raw,info=meta[key]||meta[raw]||row?.orderMeta||{};
        const id=clean(info?.salesOrderIdOverride)||raw;
        const linked=Boolean(clean(row?.workOrder)||links[id]||links[raw]);
        const status=clean(row?.status||info?.status);
        return{id,customer:clean(row?.customer||info?.customer),product:clean(row?.product||row?.item||info?.product),qty:row?.qty??info?.qty??'',linked,status};
      }).filter(row=>row.id&&!row.linked&&!/취소|완료|출하완료/.test(row.status));
    }catch(_){return[];}
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      /* Only the native mobile/iPad work-order parity form is affected. */
      .qwp-form{border:1px solid #d5dee8!important;border-radius:5px!important;box-shadow:0 4px 16px rgba(39,65,89,.05)!important;background:#fff!important}
      .qwp-formhead{min-height:45px!important;padding:9px 13px!important;background:#fff!important;border-bottom:1px solid #d8e1e8!important}.qwp-formhead strong{font-size:12px!important;color:#20384f!important}.qwp-formhead small{margin-top:0!important;font-size:7px!important;color:#7a8998!important}.qwp-formhead .qwp-btn{min-height:27px!important;height:27px!important;padding:0 8px!important;border-radius:5px!important;font-size:8px!important}
      .qwp-formbody{padding:13px!important}.qwp-basic{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:7px!important}.qwp-basic>.qwp-field:has(#qwpPlanTotal){display:none!important}.qwp-field label{margin-bottom:4px!important;color:#526b80!important;font-size:7.5px!important}.qwp-field input,.qwp-field select{height:34px!important;min-height:34px!important;padding:0 8px!important;border-radius:4px!important;border-color:#bdcede!important;font-size:10px!important}.qwp-field input[readonly]{background:#f8fafc!important}
      .qwp-sales-link{display:grid;grid-template-columns:auto minmax(150px,170px) minmax(0,1fr);align-items:center;gap:9px;margin-bottom:10px;padding:9px 11px;border:1px solid #57bce9;border-left:3px solid #00a6e9;border-radius:6px;background:#eef9ff}.qwp-sales-link label{color:#1b344a;font-size:8.5px;font-weight:950;white-space:nowrap}.qwp-sales-link select{width:100%;height:31px;padding:0 7px;border:1px solid #172c3e;border-radius:5px;background:#fff;color:#172c3e;font-size:9px;font-weight:850}.qwp-sales-link small{color:#6d7c8c;font-size:7px;font-weight:750}.qwp-sales-link small.ok{color:#28794a;font-weight:850}
      .qwp-section{margin-top:13px!important;border-radius:6px!important;border-color:#c9d8e4!important;background:#f8fafc!important}.qwp-section-title{padding:9px 10px!important;background:#f8fafc!important;border-bottom:0!important;font-size:8px!important;color:#2e465a!important}.qwp-section-title small{font-size:6.8px!important;color:#6f7f8e!important}.qwp-section-title .qwp-btn{min-height:28px!important;height:28px!important;padding:0 9px!important;border-color:#54b9e8!important;background:#eef9ff!important;color:#1483b8!important;border-radius:5px!important;font-size:7.5px!important}
      .qwp-matbox{padding:0 10px 8px!important}.qwp-mattable{min-width:1050px!important}.qwp-mattable th{padding:7px 5px!important;background:#f8fafc!important;color:#5c7183!important;font-size:6.8px!important;border-bottom:1px solid #cddae5!important}.qwp-mattable td{height:55px!important;padding:5px!important;border-bottom:1px solid #cedae4!important;font-size:8px!important}.qwp-mattable input,.qwp-mattable select{height:30px!important;border-radius:4px!important;border-color:#bdcede!important;font-size:8.5px!important}.qwp-mattable .mat-name{min-width:165px!important}.qwp-mattable .mat-lot{min-width:115px!important}.qwp-type{margin-top:3px!important;font-size:6px!important;color:#8b98a5!important}.qwp-mattable .qwp-btn.danger{min-height:28px!important;height:28px!important;padding:0 7px!important;border-radius:4px!important;font-size:6.8px!important}
      .qwp-pc-bottom-add{display:flex;justify-content:flex-end;padding:5px 10px 0}.qwp-pc-bottom-add .qwp-btn{min-height:28px!important;height:28px!important;padding:0 10px!important;border-color:#54b9e8!important;background:#eef9ff!important;color:#1483b8!important;border-radius:5px!important;font-size:7.5px!important}.qwp-pc-footnote{margin-right:auto;color:#7b8a98;font-size:6.9px;font-weight:700;line-height:1.45}.qwp-formfoot{margin-top:8px!important;padding-top:8px!important}.qwp-formfoot .qwp-btn{min-width:76px!important;min-height:35px!important;border-radius:5px!important;font-size:8px!important}.qwp-formfoot .qwp-btn.primary{background:#008fbd!important;border-color:#008fbd!important}.qwp-formfoot .qwp-btn:not(.primary){background:#112c48!important;border-color:#112c48!important;color:#fff!important}
      .qwp-packtable th,.qwp-packtable td{font-size:7px!important}.qwp-packtable input,.qwp-packtable select{height:30px!important;font-size:8px!important}
      @media(max-width:980px){.qwp-basic{grid-template-columns:repeat(2,minmax(0,1fr))!important}.qwp-basic>.qwp-field:has(#qwpPlanTotal){display:none!important}.qwp-sales-link{grid-template-columns:auto minmax(160px,1fr)}.qwp-sales-link small{grid-column:1/-1}.qwp-section-title{align-items:flex-start!important}}
      @media(max-width:520px){.qwp-formbody{padding:9px!important}.qwp-basic{grid-template-columns:1fr!important}.qwp-sales-link{grid-template-columns:1fr!important;gap:5px!important}.qwp-sales-link select{height:36px!important}.qwp-section-title{display:flex!important;flex-direction:column!important;align-items:stretch!important}.qwp-section-title .qwp-btn{align-self:flex-end!important}.qwp-formfoot{flex-wrap:wrap!important}.qwp-pc-footnote{width:100%!important;margin-bottom:4px!important}.qwp-formfoot .qwp-btn{flex:1!important}}
    `;document.head.appendChild(style);
  }

  function ensureSalesLink(form){
    if(form.querySelector('.qwp-sales-link'))return;
    const body=form.querySelector('.qwp-formbody');if(!body)return;
    const rows=salesRows();
    const bar=document.createElement('div');bar.className='qwp-sales-link';
    bar.innerHTML=`<label>연결 수주번호</label><select id="qwpSalesOrder"><option value="">수주 선택</option>${rows.map(row=>`<option value="${esc(row.id)}">${esc(row.id)}${row.customer?' · '+esc(row.customer):''}${row.product?' · '+esc(row.product):''}</option>`).join('')}</select><small class="${rows.length?'ok':''}">${rows.length?`연결 가능한 미발행 수주 ${rows.length}건`:'연결 가능한 미발행 수주 없음'}</small>`;
    body.insertBefore(bar,body.firstChild);
  }

  function renameMaterialButtons(form){
    const top=form.querySelector('#qwpAddMaterial');if(top)top.textContent='+ 원료 추가';
    const matbox=form.querySelector('.qwp-matbox');if(!matbox||form.querySelector('.qwp-pc-bottom-add'))return;
    const bottom=document.createElement('div');bottom.className='qwp-pc-bottom-add';bottom.innerHTML='<button type="button" class="qwp-btn">+ 원료 추가</button>';
    bottom.querySelector('button').addEventListener('click',()=>document.getElementById('qwpAddMaterial')?.click());
    matbox.insertAdjacentElement('afterend',bottom);
  }

  function ensureFooter(form){
    const foot=form.querySelector('.qwp-formfoot');if(!foot||foot.querySelector('.qwp-pc-footnote'))return;
    const note=document.createElement('p');note.className='qwp-pc-footnote';note.textContent='발행 시 실제 양식의 작업지시서가 생성되며, 발행 내역에서 LOT별로 조회하고 인쇄할 수 있습니다.';foot.insertBefore(note,foot.firstChild);
  }

  function alignForm(){
    if(applying)return;const form=document.querySelector('#qwpRoot .qwp-form');if(!form)return;
    applying=true;
    try{
      ensureSalesLink(form);renameMaterialButtons(form);ensureFooter(form);
      const plan=document.getElementById('qwpPlanTotal');if(plan?.closest('.qwp-field'))plan.closest('.qwp-field').setAttribute('data-pc-hidden-plan','1');
      const title=form.querySelector('.qwp-formhead strong');if(title&&!/신규 작업지시 발행|작업지시 수정/.test(title.textContent))title.textContent='신규 작업지시 발행';
    }finally{applying=false;}
  }

  function schedule(){queueMicrotask(alignForm);}
  ensureStyle();
  const root=document.querySelector('.content')||document.documentElement;
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  [80,180,350,700,1200].forEach(delay=>setTimeout(alignForm,delay));
})();
