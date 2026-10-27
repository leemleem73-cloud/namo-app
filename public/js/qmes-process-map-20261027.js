/* NAMO QMES process map - 2026-10-27 */
(function(){
  "use strict";
  const root=document.getElementById('processMap');
  if(!root||root.dataset.qpmReady==='1')return;
  root.dataset.qpmReady='1';

  const go=page=>document.querySelector('.menu[data-page="'+page+'"]')?.click();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').trim();
  const judge=row=>{
    const values=[row?.judge,row?.overall,row?.finalJudge,row?.result,row?.status].map(norm).join(' ');
    if(/불합격|부적합|FAIL|NG/i.test(values))return '불합격';
    if(/합격|적합|PASS|OK/i.test(values))return '합격';
    return '대기';
  };
  const read=async url=>{try{const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});const j=await r.json();return r.ok&&j.success!==false?(Array.isArray(j.data)?j.data:Array.isArray(j)?j:[]):[];}catch(_){return []}};
  const syncRows=records=>(records||[]).flatMap(r=>{let p=r?.payload;if(typeof p==='string'){try{p=JSON.parse(p)}catch(_){p={}}}return p&&!p.deleted&&Array.isArray(p.rows)?p.rows:[]});
  const salesRows=()=>{try{const v=JSON.parse(localStorage.getItem('qmes-erp-sales-v1')||'[]');return Array.isArray(v)?v:[]}catch(_){return []}};

  function node(label,page,sub,kind=''){
    return '<button type="button" class="qpm-node '+kind+'" data-page="'+page+'">'+label+'</button>';
  }
  function diamond(label){return '<div class="qpm-diamond" role="img" aria-label="'+esc(label)+'"><span>'+esc(label)+'</span></div>';}
  function group(title,body){return '<section class="qpm-group"><div class="qpm-group-title">'+title+'</div><div class="qpm-body">'+body+'</div></section>';}

  async function render(){
    root.innerHTML='<div class="qpm-shell"><div class="qpm-head"><div><h1>나모케미칼 QMES 프로세스</h1><p>수주 → 구매/입고 → 작업지시 → 생산/검사 → 출하 → LOT 추적 · NCR</p></div><button type="button" class="qpm-refresh">연동상태 새로고침</button></div><div class="qpm-board"><div class="qpm-grid"><div style="grid-column:1/-1;text-align:center;padding:46px;color:#7b8a9b">프로세스 연동 상태를 불러오는 중입니다.</div></div></div></div>';

    const [wo,iqc,pqcSync,oqcSync,ncr,shippingSync]=await Promise.all([
      read('/api/qmes/work-orders'),read('/api/iqc'),read('/api/qmes-sync/pqc'),read('/api/qmes-sync/oqc'),read('/api/nonconform'),read('/api/qmes-sync/inventory')
    ]);
    const pqc=syncRows(pqcSync),oqc=syncRows(oqcSync),sales=salesRows();
    const shipping=syncRows(shippingSync).filter(r=>r?.record_key==='erp:shipping'||r?.kind==='shipping'||r?.module==='erp');
    const counts={
      sales:sales.length,
      purchase:0,
      wo:wo.filter(r=>!r.deleted).length,
      iqc:iqc.length,
      iqcNg:iqc.filter(r=>judge(r)==='불합격').length,
      pqc:pqc.length,
      pqcNg:pqc.filter(r=>judge(r)==='불합격').length,
      oqc:oqc.length,
      oqcNg:oqc.filter(r=>judge(r)==='불합격').length,
      ncr:ncr.length,
      shipping:shipping.length
    };

    const html=[
      group('① 수주 / 납기',
        node('수주등록','orders')+'<div class="qpm-arrow">↓</div>'+
        node('납기확인','orders')+'<div class="qpm-arrow">↓</div>'+
        node('생산계획','orders')
      ),
      group('② 구매 / 입고',
        node('구매발주','purchase')+'<div class="qpm-arrow">↓</div>'+
        node('원재료 입고','incoming')+'<div class="qpm-arrow">↓</div>'+
        node('입고 LOT 등록','incoming')
      ),
      group('③ 수입검사 IQC',
        node('IQC 검사등록','incoming')+'<div class="qpm-arrow">↓</div>'+
        diamond('IQC 합격?')+
        '<div class="qpm-branch-row"><span class="qpm-yes-tag">YES → 원료재고</span><span class="qpm-no-tag">NO ↓</span></div>'+
        node('NCR 자동등록','ncr','','red')
      ),
      group('④ 원료 / 작업지시',
        node('합격 원료 LOT','incoming')+'<div class="qpm-arrow">↓</div>'+
        node('원료재고','inventory')+'<div class="qpm-arrow">↓</div>'+
        node('작업지시 발행','work')
      ),
      group('⑤ 생산',
        node('원료투입','work')+'<div class="qpm-arrow">↓</div>'+
        node('생산진행','work')+'<div class="qpm-arrow">↓</div>'+
        node('생산실적 등록','work')
      ),
      group('⑥ 공정검사 PQC',
        node('PQC 검사등록','process')+'<div class="qpm-arrow">↓</div>'+
        diamond('PQC 합격?')+
        '<div class="qpm-branch-row"><span class="qpm-yes-tag">YES → 생산완료</span><span class="qpm-no-tag">NO ↓</span></div>'+
        node('NCR 자동등록','ncr','','red')
      ),
      group('⑦ 생산완료 / 완제품',
        node('생산완료','work')+'<div class="qpm-arrow">↓</div>'+
        node('완제품 LOT 생성','work')+'<div class="qpm-arrow">↓</div>'+
        node('완제품 재고','inventory')
      ),
      group('⑧ 출하검사 OQC',
        node('OQC 검사등록','outgoing')+'<div class="qpm-arrow">↓</div>'+
        diamond('OQC 합격?')+
        '<div class="qpm-branch-row"><span class="qpm-yes-tag">YES → 출하등록</span><span class="qpm-no-tag">NO ↓</span></div>'+
        node('NCR 자동등록','ncr','','red')
      ),
      group('⑨ 출하 / 납품',
        node('출하등록','orders')+'<div class="qpm-arrow">↓</div>'+
        node('성적서 / COA','outgoing')+'<div class="qpm-arrow">↓</div>'+
        node('고객사 납품완료','orders')
      ),
      group('⑩ LOT / 품질 추적',
        node('LOT 추적','lotTrace')+'<div class="qpm-arrow">↓</div>'+
        node('부적합 NCR','ncr')+'<div class="qpm-arrow">↓</div>'+
        node('전자결재 / 승인','approval')
      )
    ].join('');

    root.querySelector('.qpm-board').innerHTML='<div class="qpm-flow-caption">나모케미칼 QMES 전체 Process MAP · 수주부터 원료 LOT, 생산 LOT, 검사, 출하까지 연동</div><div class="qpm-grid qpm-dense-grid">'+html+'</div>';
    root.insertAdjacentHTML('beforeend','<div class="qpm-foot"><span>● 수주/납기 → 생산계획 → 작업지시 연동</span><span>● 구매발주 → 입고 LOT → IQC → 원료재고 연동</span><span>● 생산 → PQC → 생산완료 → 완제품 LOT 연동</span><span>● OQC 합격 LOT만 출하등록</span><span>● IQC/PQC/OQC 불합격 → NCR 자동등록</span><span>● 원료 LOT → 생산 LOT → 검사 → 출하까지 LOT 추적</span></div>');
    root.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.page)));
    root.querySelector('.qpm-refresh')?.addEventListener('click',render);
  }
  render();
})();
