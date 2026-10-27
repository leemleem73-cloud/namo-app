/* NAMO QMES detailed process map - 2026-10-27 */
(function(){
  "use strict";
  const root=document.getElementById('processMap');
  if(!root||root.dataset.qpmReady==='1')return;
  root.dataset.qpmReady='1';

  const go=page=>document.querySelector('.menu[data-page="'+page+'"]')?.click();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=async url=>{try{const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});const j=await r.json();return r.ok&&j.success!==false?(Array.isArray(j.data)?j.data:Array.isArray(j)?j:[]):[];}catch(_){return []}};

  function node(key,label,page,kind=''){
    return '<button type="button" class="qpm-node '+kind+'" data-key="'+key+'" data-page="'+page+'">'+label+'</button>';
  }
  function diamond(key,label){
    return '<div class="qpm-diamond" data-key="'+key+'" role="img" aria-label="'+esc(label)+'"><span>'+esc(label)+'</span></div>';
  }
  function group(title,body){
    return '<section class="qpm-group"><div class="qpm-group-title">'+title+'</div><div class="qpm-body">'+body+'</div></section>';
  }

  function drawConnections(){
    const grid=root.querySelector('.qpm-grid');
    if(!grid)return;
    grid.querySelector('.qpm-links')?.remove();

    const NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg');
    svg.classList.add('qpm-links');
    svg.setAttribute('width',grid.scrollWidth);
    svg.setAttribute('height',grid.scrollHeight);
    svg.setAttribute('viewBox','0 0 '+grid.scrollWidth+' '+grid.scrollHeight);

    const defs=document.createElementNS(NS,'defs');
    defs.innerHTML='<marker id="qpmArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#8795a5"/></marker><marker id="qpmArrowYes" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#16845b"/></marker><marker id="qpmArrowNo" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z" fill="#cf3f36"/></marker>';
    svg.appendChild(defs);

    const box=grid.getBoundingClientRect();
    const point=(key,side)=>{
      const el=grid.querySelector('[data-key="'+key+'"]'); if(!el)return null;
      const r=el.getBoundingClientRect();
      const cx=r.left-box.left+r.width/2, cy=r.top-box.top+r.height/2;
      if(side==='left')return {x:r.left-box.left,y:cy};
      if(side==='right')return {x:r.right-box.left,y:cy};
      if(side==='top')return {x:cx,y:r.top-box.top};
      return {x:cx,y:r.bottom-box.top};
    };
    const add=(from,to,kind='main',label='')=>{
      const a=point(from,'right'),b=point(to,'left');
      if(!a||!b)return;
      const path=document.createElementNS(NS,'path');
      const mid=Math.round((a.x+b.x)/2);
      path.setAttribute('d','M '+a.x+' '+a.y+' H '+mid+' V '+b.y+' H '+b.x);
      path.setAttribute('class','qpm-link qpm-link-'+kind);
      path.setAttribute('marker-end','url(#'+(kind==='yes'?'qpmArrowYes':kind==='no'?'qpmArrowNo':'qpmArrow')+')');
      svg.appendChild(path);
      if(label){
        const t=document.createElementNS(NS,'text');
        t.setAttribute('x',mid+4); t.setAttribute('y',Math.min(a.y,b.y)+14);
        t.setAttribute('class','qpm-link-label qpm-link-label-'+kind); t.textContent=label; svg.appendChild(t);
      }
    };
    const addDown=(from,to,kind='main',label='')=>{
      const a=point(from,'bottom'),b=point(to,'top');
      if(!a||!b)return;
      const path=document.createElementNS(NS,'path');
      const mid=Math.round((a.y+b.y)/2);
      path.setAttribute('d','M '+a.x+' '+a.y+' V '+mid+' H '+b.x+' V '+b.y);
      path.setAttribute('class','qpm-link qpm-link-'+kind);
      path.setAttribute('marker-end','url(#'+(kind==='yes'?'qpmArrowYes':kind==='no'?'qpmArrowNo':'qpmArrow')+')');
      svg.appendChild(path);
      if(label){
        const t=document.createElementNS(NS,'text');
        t.setAttribute('x',a.x+5); t.setAttribute('y',mid-4);
        t.setAttribute('class','qpm-link-label qpm-link-label-'+kind); t.textContent=label; svg.appendChild(t);
      }
    };

    [
      ['sales','due'],['due','plan'],['plan','purchase'],['purchase','incoming'],['incoming','incomingLot'],['incomingLot','iqc'],
      ['rawLot','rawStock'],['rawStock','workOrder'],['workOrder','input'],['input','production'],['production','result'],
      ['result','pqc'],['complete','finishedLot'],['finishedLot','finishedStock'],['finishedStock','oqc'],
      ['ship','coa'],['coa','delivery'],['lotTrace','ncrHub'],['ncrHub','approval']
    ].forEach(([a,b])=>add(a,b));

    add('iqcDecision','rawLot','yes','YES');
    addDown('iqcDecision','iqcNcr','no','NO');
    add('pqcDecision','complete','yes','YES');
    addDown('pqcDecision','pqcNcr','no','NO');
    add('oqcDecision','ship','yes','YES');
    addDown('oqcDecision','oqcNcr','no','NO');

    add('iqc','iqcDecision');
    add('pqc','pqcDecision');
    add('oqc','oqcDecision');

    add('iqcNcr','ncrHub','trace');
    add('pqcNcr','ncrHub','trace');
    add('oqcNcr','ncrHub','trace');

    add('incomingLot','lotTrace','trace');
    add('workOrder','lotTrace','trace');
    add('result','lotTrace','trace');
    add('finishedLot','lotTrace','trace');
    add('ship','lotTrace','trace');

    grid.prepend(svg);
  }

  async function render(){
    root.innerHTML='<div class="qpm-shell"><div class="qpm-head"><div><h1>나모케미칼 QMES 프로세스</h1><p>수주 · 구매 · 품질 · 생산 · 출하 · LOT 추적을 하나의 흐름으로 연결합니다.</p></div><button type="button" class="qpm-refresh">연동상태 새로고침</button></div><div class="qpm-board"><div class="qpm-flow-caption">나모케미칼 QMES 전체 Process MAP</div><div class="qpm-grid qpm-dense-grid"><div class="qpm-loading">프로세스 연동 상태를 불러오는 중입니다.</div></div></div></div>';

    await Promise.allSettled([
      read('/api/qmes/work-orders'),read('/api/iqc'),read('/api/qmes-sync/pqc'),read('/api/qmes-sync/oqc'),read('/api/nonconform'),read('/api/qmes-sync/inventory')
    ]);

    const html=[
      group('① 수주 / 납기',
        node('sales','수주등록','orders')+
        node('due','납기확인','orders')+
        node('plan','생산계획','orders')
      ),
      group('② 구매 / 입고',
        node('purchase','구매발주','purchase')+
        node('incoming','원재료 입고','incoming')+
        node('incomingLot','입고 LOT 등록','incoming')
      ),
      group('③ 수입검사 IQC',
        node('iqc','IQC 검사등록','incoming')+
        diamond('iqcDecision','IQC 합격?')+
        node('iqcNcr','NCR 자동등록','ncr','red')
      ),
      group('④ 원료 / 작업지시',
        node('rawLot','합격 원료 LOT','incoming')+
        node('rawStock','원료재고','inventory')+
        node('workOrder','작업지시 발행','work')
      ),
      group('⑤ 생산',
        node('input','원료투입','work')+
        node('production','생산진행','work')+
        node('result','생산실적 등록','work')
      ),
      group('⑥ 공정검사 PQC',
        node('pqc','PQC 검사등록','process')+
        diamond('pqcDecision','PQC 합격?')+
        node('pqcNcr','NCR 자동등록','ncr','red')
      ),
      group('⑦ 생산완료 / 완제품',
        node('complete','생산완료','work')+
        node('finishedLot','완제품 LOT 생성','work')+
        node('finishedStock','완제품 재고','inventory')
      ),
      group('⑧ 출하검사 OQC',
        node('oqc','OQC 검사등록','outgoing')+
        diamond('oqcDecision','OQC 합격?')+
        node('oqcNcr','NCR 자동등록','ncr','red')
      ),
      group('⑨ 출하 / 납품',
        node('ship','출하등록','orders')+
        node('coa','성적서 / COA','outgoing')+
        node('delivery','고객사 납품완료','orders')
      ),
      group('⑩ LOT / 품질 추적',
        node('lotTrace','LOT 추적','lotTrace')+
        node('ncrHub','부적합 NCR','ncr')+
        node('approval','전자결재 / 승인','approval')
      )
    ].join('');

    const grid=root.querySelector('.qpm-grid');
    grid.innerHTML=html;
    root.insertAdjacentHTML('beforeend','<div class="qpm-foot"><span>● 실선: 정상 업무 흐름</span><span>● 녹색: 합격 다음 공정</span><span>● 적색: 불합격 NCR 자동등록</span><span>● 점선: LOT/품질 추적 연동</span></div>');
    root.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.page)));
    root.querySelector('.qpm-refresh')?.addEventListener('click',render);

    requestAnimationFrame(()=>requestAnimationFrame(drawConnections));
  }

  window.addEventListener('resize',()=>{clearTimeout(window.__qpmResize);window.__qpmResize=setTimeout(drawConnections,120);});
  render();
})();