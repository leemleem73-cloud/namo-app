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
    return '<button type="button" class="qpm-node '+kind+'" data-page="'+page+'">'+label+(sub?'<small>'+esc(sub)+'</small>':'')+'</button>';
  }
  function diamond(label){return '<div class="qpm-diamond"><span>'+label+'</span></div>';}
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
      group('수주 / 계획관리',
        node('수주등록','orders',counts.sales+'건')+'<div class="qpm-arrow">↓</div>'+
        node('생산계획','orders','수주납기 기준')+'<div class="qpm-arrow">↓</div>'+
        node('작업지시 발행','work',counts.wo+'건')
      ),
      group('구매 / 입고관리',
        node('구매발주','purchase','구매발주 관리')+'<div class="qpm-arrow">↓</div>'+
        node('원재료 입고','incoming',counts.iqc+'건')+'<div class="qpm-arrow">↓</div>'+
        diamond('IQC 합격?')+
        node('NCR 자동등록','ncr','IQC 불합격 '+counts.iqcNg+'건','red')
      ),
      group('생산관리',
        node('합격 원료 LOT','incoming','작업지시 원료 연동')+'<div class="qpm-arrow">↓</div>'+
        node('원료투입 / 생산','work','작업지시 기준')+'<div class="qpm-arrow">↓</div>'+
        node('생산완료','work','실적 / LOT 생성')
      ),
      group('공정 품질관리',
        node('공정검사 PQC','process',counts.pqc+'건')+'<div class="qpm-arrow">↓</div>'+
        diamond('PQC 합격?')+
        node('NCR 자동등록','ncr','PQC 불합격 '+counts.pqcNg+'건','red')
      ),
      group('출하 품질관리',
        node('출하검사 OQC','outgoing',counts.oqc+'건')+'<div class="qpm-arrow">↓</div>'+
        diamond('OQC 합격?')+
        node('NCR 자동등록','ncr','OQC 불합격 '+counts.oqcNg+'건','red')
      ),
      group('출하 / 납품',
        node('출하등록 / 납품','orders',counts.shipping+'건')+'<div class="qpm-arrow">↓</div>'+
        node('고객사 납품완료','orders','수주번호 연동')+'<div class="qpm-arrow">↓</div>'+
        node('성적서 / COA','outgoing','출하검사 연동')
      ),
      group('추적 / 품질관리',
        node('LOT 추적','lotTrace','원료 → 생산 → 검사 → 출하')+'<div class="qpm-arrow">↓</div>'+
        node('부적합 NCR','ncr',counts.ncr+'건')+'<div class="qpm-arrow">↓</div>'+
        node('전자결재 / 승인','approval','검토 · 승인')
      )
    ].join('');

    root.querySelector('.qpm-board').innerHTML='<div class="qpm-grid">'+html+'</div>';
    root.insertAdjacentHTML('beforeend','<div class="qpm-foot"><span>● IQC/PQC/OQC 불합격 → NCR 자동등록</span><span>● IQC 합격 LOT → 작업지시 원료 선택</span><span>● 작업지시/검사/출하 → LOT 추적 연결</span><span>● 각 박스를 클릭하면 실제 QMES 메뉴로 이동</span></div>');
    root.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.page)));
    root.querySelector('.qpm-refresh')?.addEventListener('click',render);
  }
  render();
})();
