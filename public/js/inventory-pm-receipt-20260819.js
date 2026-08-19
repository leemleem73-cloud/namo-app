/* QMES inventory: direct packaging-material receipt action */
(function(){
  'use strict';
  if(window.__QMES_PM_RECEIPT_20260819__) return;
  window.__QMES_PM_RECEIPT_20260819__=true;

  const api=async(path,options={})=>{
    const response=await fetch('/api/inventory'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const text=await response.text();
    let payload=null;
    try{payload=JSON.parse(text);}catch(e){throw new Error('재고 서버 응답이 JSON 형식이 아닙니다. 배포 서버 재시작을 확인해 주세요.');}
    if(!response.ok||!payload?.success) throw new Error(payload?.message||'재고 서버 요청에 실패했습니다.');
    return payload.data;
  };

  function style(){
    if(document.getElementById('qmes-pm-receipt-style')) return;
    const s=document.createElement('style');s.id='qmes-pm-receipt-style';s.textContent=`
      .qmes-pm-receipt-btn{background:#047857!important;border-color:#047857!important;color:#fff!important}
      .qmes-pm-receipt-btn:hover{background:#065f46!important}
      #qmes-pm-receipt-modal{position:fixed;inset:0;z-index:14000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:20px}
      #qmes-pm-receipt-modal form{width:min(760px,96vw);max-height:90vh;overflow:auto;background:#fff;border:1px solid #bcc8d4;border-radius:12px;padding:20px;box-shadow:0 24px 70px rgba(15,23,42,.25);color:#1f2937}
      #qmes-pm-receipt-modal .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
      #qmes-pm-receipt-modal .head h3{margin:0;font-size:18px}
      #qmes-pm-receipt-modal .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      #qmes-pm-receipt-modal label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:800;color:#475569}
      #qmes-pm-receipt-modal input,#qmes-pm-receipt-modal select{background:#fff;border:1px solid #b8c5d1;color:#1f2937;border-radius:8px;padding:10px}
      #qmes-pm-receipt-modal .wide{grid-column:1/-1}
      #qmes-pm-receipt-modal .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
      #qmes-pm-receipt-modal button{border:1px solid #b8c5d1;background:#fff;color:#1f2937;border-radius:8px;padding:9px 14px;font-weight:800;cursor:pointer}
      #qmes-pm-receipt-modal button.primary{background:#047857;border-color:#047857;color:#fff}
      #qmes-pm-receipt-modal .error{margin:0 0 12px;padding:10px 12px;background:#fff1f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;font-size:12px;font-weight:700}
      @media(max-width:650px){#qmes-pm-receipt-modal .grid{grid-template-columns:1fr}#qmes-pm-receipt-modal .wide{grid-column:auto}}
    `;document.head.appendChild(s);
  }

  async function openModal(){
    style();
    let locations=[];try{locations=await api('/locations');}catch(e){alert(e.message);return;}
    document.getElementById('qmes-pm-receipt-modal')?.remove();
    const modal=document.createElement('div');modal.id='qmes-pm-receipt-modal';
    modal.innerHTML=`<form>
      <div class="head"><h3>부자재 입고</h3><button type="button" data-close>×</button></div>
      <div class="error" data-error hidden></div>
      <div class="grid">
        <label>품목코드<input name="itemCode" required placeholder="예: PM-001"></label>
        <label>품목명<input name="itemName" required placeholder="예: 드럼 / 포장용기"></label>
        <label>LOT<input name="lotNo" required placeholder="공급사 LOT 또는 사내 LOT"></label>
        <label>수량<input name="quantity" type="number" min="0.001" step="0.001" required></label>
        <label>단위<select name="unit"><option>EA</option><option>kg</option><option>ROLL</option><option>BOX</option><option>SET</option></select></label>
        <label>입고 위치<select name="toLocation">${locations.map(l=>`<option value="${String(l.location_code).replace(/"/g,'&quot;')}">${l.location_code} · ${l.location_name}</option>`).join('')}</select></label>
        <label>품질상태<select name="toStatus"><option value="IQC_PENDING">IQC 대기</option><option value="AVAILABLE">사용가능</option><option value="HOLD">HOLD</option></select></label>
        <label>공급사<input name="supplier"></label>
        <label>입고일<input name="receivedAt" type="date"></label>
        <label>유효기간<input name="expiryDate" type="date"></label>
        <label class="wide">참조번호/비고<input name="referenceNo" placeholder="거래명세서, 발주번호 등"></label>
      </div>
      <div class="actions"><button type="button" data-close>취소</button><button class="primary" type="submit">부자재 입고 저장</button></div>
    </form>`;
    document.body.appendChild(modal);
    const form=modal.querySelector('form'),err=modal.querySelector('[data-error]');
    modal.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>modal.remove()));
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
    form.addEventListener('submit',async e=>{
      e.preventDefault();err.hidden=true;const data=Object.fromEntries(new FormData(form).entries());
      try{
        await api('/transactions',{method:'POST',body:JSON.stringify({transactionType:'RECEIPT',category:'PM',fromLocation:'',fromStatus:'',...data})});
        modal.remove();
        if(typeof window.qmesOpenInventorySection==='function')window.qmesOpenInventorySection('movement');
        setTimeout(()=>document.querySelector('#qmes-inventory-host .inv-actions button')?.click(),120);
      }catch(ex){err.textContent=ex.message;err.hidden=false;}
    });
  }

  function installButton(){
    const host=document.getElementById('qmes-inventory-host');if(!host)return;
    const title=(host.querySelector('.inv-title-row h2')?.textContent||'');
    if(!title.includes('입출고 관리'))return;
    const actions=host.querySelector('.inv-actions');if(!actions||actions.querySelector('.qmes-pm-receipt-btn'))return;
    const b=document.createElement('button');b.type='button';b.className='qmes-pm-receipt-btn';b.textContent='부자재 입고';b.addEventListener('click',openModal);actions.prepend(b);
  }
  const observer=new MutationObserver(installButton);observer.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(installButton,500);
})();
