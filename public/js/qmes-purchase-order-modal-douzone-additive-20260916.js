/* NAMO QMES - Purchase order modal enhancement (additive only)
 * 2026-09-16
 * IMPORTANT: This file is additive. It does not replace/delete existing purchase logic,
 * does not POST/PUT/DELETE data, and only adjusts the visible purchase-order modal UI.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_MODAL_DOUZONE_ADDITIVE_20260916__) return;
  window.__QMES_PURCHASE_MODAL_DOUZONE_ADDITIVE_20260916__ = true;

  const STYLE_ID='qmes-purchase-modal-douzone-additive-style-20260916';
  const HOST_CLASS='qmes-po-dz-enhanced';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
.${HOST_CLASS}{--qpdz-border:#dce6ef;--qpdz-text:#1d3650;--qpdz-sub:#698095;--qpdz-blue:#1685ca;--qpdz-soft:#f6f9fc}
.${HOST_CLASS} .qpdz-item-grid-wrap{margin-top:12px;border:1px solid var(--qpdz-border);border-radius:9px;overflow:hidden;background:#fff}
.${HOST_CLASS} .qpdz-item-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 11px;background:#f8fbfd;border-bottom:1px solid var(--qpdz-border)}
.${HOST_CLASS} .qpdz-item-toolbar strong{font-size:12px;color:var(--qpdz-text)}
.${HOST_CLASS} .qpdz-item-actions{display:flex;gap:6px;flex-wrap:wrap}
.${HOST_CLASS} .qpdz-mini-btn{height:30px;padding:0 10px;border:1px solid #c8d7e4;border-radius:6px;background:#fff;color:#35516c;font-size:11px;font-weight:800;cursor:pointer}
.${HOST_CLASS} .qpdz-mini-btn.primary{background:var(--qpdz-blue);border-color:var(--qpdz-blue);color:#fff}
.${HOST_CLASS} .qpdz-grid-scroll{overflow:auto;max-width:100%}
.${HOST_CLASS} table.qpdz-grid{width:100%;min-width:1050px;border-collapse:collapse;table-layout:fixed}
.${HOST_CLASS} table.qpdz-grid th{height:34px;background:#f4f7fa;border-right:1px solid #e1e9f0;border-bottom:1px solid #dce6ef;padding:0 7px;font-size:10px;font-weight:900;color:#466179;text-align:center;white-space:nowrap}
.${HOST_CLASS} table.qpdz-grid td{height:38px;border-right:1px solid #edf1f5;border-bottom:1px solid #edf1f5;padding:4px 6px;font-size:11px;color:#263f58;vertical-align:middle}
.${HOST_CLASS} table.qpdz-grid input,.${HOST_CLASS} table.qpdz-grid select{width:100%;height:29px;box-sizing:border-box;border:1px solid #d1deea;border-radius:5px;background:#fff;padding:0 6px;font-size:11px;color:#263f58;outline:none}
.${HOST_CLASS} table.qpdz-grid input:focus,.${HOST_CLASS} table.qpdz-grid select:focus{border-color:#4ca5dc;box-shadow:0 0 0 2px rgba(76,165,220,.10)}
.${HOST_CLASS} .qpdz-money{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.${HOST_CLASS} .qpdz-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px 11px;background:#fbfdff;border-top:1px solid var(--qpdz-border)}
.${HOST_CLASS} .qpdz-summary>div{border:1px solid #dbe5ee;border-radius:7px;background:#fff;padding:9px 11px}
.${HOST_CLASS} .qpdz-summary span{display:block;font-size:10px;font-weight:800;color:#6b8195;margin-bottom:3px}
.${HOST_CLASS} .qpdz-summary b{font-size:15px;color:#17324d;font-variant-numeric:tabular-nums}
.${HOST_CLASS} .qpdz-summary .total{background:#1f3e59;border-color:#1f3e59}
.${HOST_CLASS} .qpdz-summary .total span,.${HOST_CLASS} .qpdz-summary .total b{color:#fff}
.${HOST_CLASS} .qpdz-footer-additive{display:flex;justify-content:flex-end;gap:8px;align-items:center;margin-top:10px}
.${HOST_CLASS} .qpdz-footer-additive button{height:36px;padding:0 15px;border-radius:7px;font-size:12px;font-weight:850;cursor:pointer}
.${HOST_CLASS} .qpdz-save-draft{border:1px solid #bfcfdd;background:#fff;color:#34516b}
@media(max-width:1100px){.${HOST_CLASS} .qpdz-summary{grid-template-columns:1fr}.qpdz-grid-scroll{overflow-x:auto}}
`;
    document.head.appendChild(s);
  }

  function findModal(){
    const dialogs=[...document.querySelectorAll('[role="dialog"],.qmes-modal,.modal,.qerp-modal')];
    return dialogs.find(d=>/신규\s*구매\s*발주\s*등록|구매\s*발주\s*등록/.test(clean(d.textContent)))||null;
  }

  function findSection(modal,number){
    const candidates=[...modal.querySelectorAll('section,fieldset,.qerp-card,.qerp-section,div')];
    const re=new RegExp('^'+number+'\\.\\s*');
    return candidates.find(el=>{
      const first=el.querySelector('h1,h2,h3,h4,h5,legend,strong,b');
      return first && re.test(clean(first.textContent));
    })||null;
  }

  function inputByLabel(modal,labelText){
    const labels=[...modal.querySelectorAll('label')];
    const label=labels.find(l=>clean(l.textContent).includes(labelText));
    if(label){
      const direct=label.querySelector('input,select,textarea');
      if(direct) return direct;
      const id=label.getAttribute('for');
      if(id){ const node=document.getElementById(id); if(node) return node; }
      const parent=label.parentElement;
      if(parent){ const node=parent.querySelector('input,select,textarea'); if(node) return node; }
    }
    return null;
  }

  function valueOf(modal,label){
    const node=inputByLabel(modal,label);
    return node ? node.value : '';
  }

  function num(v){
    const n=Number(String(v==null?'':v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }

  function formatWon(v){return Math.round(num(v)).toLocaleString('ko-KR')+'원';}

  function createGrid(modal,section){
    if(section.querySelector('.qpdz-item-grid-wrap')) return;

    const item=valueOf(modal,'품목 *')||valueOf(modal,'품목');
    const code=valueOf(modal,'품목코드');
    const spec=valueOf(modal,'규격');
    const qty=valueOf(modal,'발주수량 *')||valueOf(modal,'발주수량');
    const unit=valueOf(modal,'단위')||'kg';
    const price=valueOf(modal,'단가 (원)')||valueOf(modal,'단가');
    const due=valueOf(modal,'요청납기');
    const supply=num(qty)*num(price);
    const vat=Math.round(supply*.1);
    const total=supply+vat;

    const wrap=document.createElement('div');
    wrap.className='qpdz-item-grid-wrap';
    wrap.innerHTML=`
      <div class="qpdz-item-toolbar">
        <strong>발주 품목 Grid</strong>
        <div class="qpdz-item-actions">
          <button type="button" class="qpdz-mini-btn primary" data-qpdz-add>+ 품목 추가</button>
          <button type="button" class="qpdz-mini-btn" data-qpdz-del>선택행 삭제</button>
        </div>
      </div>
      <div class="qpdz-grid-scroll">
        <table class="qpdz-grid" aria-label="구매 발주 품목 Grid">
          <thead><tr>
            <th style="width:40px">선택</th><th style="width:115px">품목코드</th><th style="width:170px">품목명</th><th style="width:120px">규격</th>
            <th style="width:90px">발주수량</th><th style="width:65px">단위</th><th style="width:95px">단가</th><th style="width:105px">공급가액</th>
            <th style="width:85px">VAT</th><th style="width:110px">합계</th><th style="width:115px">요청납기</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="qpdz-summary">
        <div><span>공급가액</span><b data-qpdz-supply>${formatWon(supply)}</b></div>
        <div><span>부가세 10%</span><b data-qpdz-vat>${formatWon(vat)}</b></div>
        <div class="total"><span>합계금액</span><b data-qpdz-total>${formatWon(total)}</b></div>
      </div>`;

    section.appendChild(wrap);

    const tbody=wrap.querySelector('tbody');
    function addRow(seed={}){
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td style="text-align:center"><input type="checkbox" data-qpdz-check aria-label="행 선택"></td>
        <td><input data-qpdz-code value="${String(seed.code||'').replace(/"/g,'&quot;')}"></td>
        <td><input data-qpdz-item value="${String(seed.item||'').replace(/"/g,'&quot;')}"></td>
        <td><input data-qpdz-spec value="${String(seed.spec||'').replace(/"/g,'&quot;')}"></td>
        <td><input data-qpdz-qty inputmode="decimal" value="${String(seed.qty||'').replace(/"/g,'&quot;')}"></td>
        <td><input data-qpdz-unit value="${String(seed.unit||'kg').replace(/"/g,'&quot;')}"></td>
        <td><input data-qpdz-price inputmode="numeric" value="${String(seed.price||'').replace(/"/g,'&quot;')}"></td>
        <td class="qpdz-money" data-qpdz-row-supply>0원</td>
        <td class="qpdz-money" data-qpdz-row-vat>0원</td>
        <td class="qpdz-money" data-qpdz-row-total>0원</td>
        <td><input data-qpdz-due type="date" value="${String(seed.due||'').replace(/"/g,'&quot;')}"></td>`;
      tbody.appendChild(tr);
      calc();
    }

    function calc(){
      let sum=0,vatSum=0,totalSum=0;
      [...tbody.querySelectorAll('tr')].forEach(tr=>{
        const q=num(tr.querySelector('[data-qpdz-qty]')?.value);
        const p=num(tr.querySelector('[data-qpdz-price]')?.value);
        const s=q*p;
        const v=Math.round(s*.1);
        const t=s+v;
        tr.querySelector('[data-qpdz-row-supply]').textContent=formatWon(s);
        tr.querySelector('[data-qpdz-row-vat]').textContent=formatWon(v);
        tr.querySelector('[data-qpdz-row-total]').textContent=formatWon(t);
        sum+=s;vatSum+=v;totalSum+=t;
      });
      wrap.querySelector('[data-qpdz-supply]').textContent=formatWon(sum);
      wrap.querySelector('[data-qpdz-vat]').textContent=formatWon(vatSum);
      wrap.querySelector('[data-qpdz-total]').textContent=formatWon(totalSum);
    }

    addRow({code,item,spec,qty,unit,price,due});
    wrap.addEventListener('input',e=>{
      if(e.target.matches('[data-qpdz-qty],[data-qpdz-price]')) calc();
    });
    wrap.querySelector('[data-qpdz-add]').addEventListener('click',()=>addRow({unit:'kg',due:valueOf(modal,'요청납기')}));
    wrap.querySelector('[data-qpdz-del]').addEventListener('click',()=>{
      const rows=[...tbody.querySelectorAll('tr')];
      const selected=rows.filter(tr=>tr.querySelector('[data-qpdz-check]')?.checked);
      selected.forEach(tr=>tr.remove());
      if(!tbody.querySelector('tr')) addRow({unit:'kg',due:valueOf(modal,'요청납기')});
      calc();
    });
  }

  function addDraftButton(modal){
    if(modal.querySelector('[data-qpdz-draft]')) return;
    const buttons=[...modal.querySelectorAll('button')];
    const submit=buttons.find(b=>/결재\s*상신.*저장|결재\s*상신|상신/.test(clean(b.textContent)));
    if(!submit || !submit.parentElement) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='qpdz-save-draft';
    btn.dataset.qpdzDraft='1';
    btn.textContent='임시저장';
    btn.title='화면 입력값을 브라우저에 임시 보관합니다. 서버 데이터는 변경하지 않습니다.';
    btn.addEventListener('click',()=>{
      const snapshot={};
      [...modal.querySelectorAll('input,select,textarea')].forEach((el,i)=>{
        const key=el.name||el.id||el.placeholder||('field-'+i);
        snapshot[key]=el.type==='checkbox'?el.checked:el.value;
      });
      try{localStorage.setItem('qmes-purchase-draft-20260916',JSON.stringify({savedAt:new Date().toISOString(),snapshot}));}catch(_){}
      btn.textContent='임시저장 완료';
      setTimeout(()=>btn.textContent='임시저장',1200);
    });
    submit.parentElement.insertBefore(btn,submit);
  }

  function apply(){
    const modal=findModal();
    if(!modal) return;
    modal.classList.add(HOST_CLASS);
    ensureStyle();
    const section2=findSection(modal,2);
    if(section2) createGrid(modal,section2);
    addDraftButton(modal);
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
})();
