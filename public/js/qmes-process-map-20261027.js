/* NAMO QMES detailed linked process map - 2026-10-27 */
(function(){
  "use strict";
  const root=document.getElementById('processMap');
  if(!root||root.dataset.qpmReady==='1')return;
  root.dataset.qpmReady='1';

  const go=page=>document.querySelector('.menu[data-page="'+page+'"]')?.click();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function node(key,label,page,kind=''){
    return '<button type="button" class="qpm-node '+kind+'" data-key="'+key+'" data-page="'+page+'">'+label+'</button>';
  }
  function diamond(key,label){
    return '<div class="qpm-diamond" data-key="'+key+'" role="img" aria-label="'+esc(label)+'"><span>'+esc(label)+'</span></div>';
  }
  function group(title,body){
    return '<section class="qpm-group"><div class="qpm-group-title">'+title+'</div><div class="qpm-body">'+body+'</div></section>';
  }

  function drawLinks(){
    const grid=root.querySelector('.qpm-grid');
    if(!grid)return;
    grid.querySelector('.qpm-link-layer')?.remove();

    const NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg');
    svg.classList.add('qpm-link-layer');
    svg.setAttribute('width',grid.scrollWidth);
    svg.setAttribute('height',grid.scrollHeight);
    svg.setAttribute('viewBox','0 0 '+grid.scrollWidth+' '+grid.scrollHeight);

    const bounds=grid.getBoundingClientRect();
    const pos=(key,side)=>{
      const el=grid.querySelector('[data-key="'+key+'"]');
      if(!el)return null;
      const r=el.getBoundingClientRect();
      const x=r.left-bounds.left, y=r.top-bounds.top, w=r.width, h=r.height;
      if(side==='left')return {x:x,y:y+h/2};
      if(side==='right')return {x:x+w,y:y+h/2};
      if(side==='top')return {x:x+w/2,y:y};
      return {x:x+w/2,y:y+h};
    };
    const arrow=(x,y,dir,cls)=>{
      const p=document.createElementNS(NS,'path');
      const s=5;
      let d='';
      if(dir==='right') d='M '+(x-s)+' '+(y-s)+' L '+x+' '+y+' L '+(x-s)+' '+(y+s);
      else if(dir==='left') d='M '+(x+s)+' '+(y-s)+' L '+x+' '+y+' L '+(x+s)+' '+(y+s);
      else if(dir==='down') d='M '+(x-s)+' '+(y-s)+' L '+x+' '+y+' L '+(x+s)+' '+(y-s);
      else d='M '+(x-s)+' '+(y+s)+' L '+x+' '+y+' L '+(x+s)+' '+(y+s);
      p.setAttribute('d',d); p.setAttribute('class','qpm-arrowhead '+cls); svg.appendChild(p);
    };
    const path=(d,cls)=>{
      const p=document.createElementNS(NS,'path');
      p.setAttribute('d',d); p.setAttribute('class','qpm-link '+cls); svg.appendChild(p);
    };
    const label=(x,y,text,cls)=>{
      const t=document.createElementNS(NS,'text');
      t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('class','qpm-link-label '+cls);t.textContent=text;svg.appendChild(t);
    };
    const connect=(aKey,bKey,cls='main',txt='')=>{
      const a=pos(aKey,'right'),b=pos(bKey,'left');
      if(!a||!b)return;
      const mid=a.x+(b.x-a.x)/2;
      path('M '+a.x+' '+a.y+' H '+mid+' V '+b.y+' H '+b.x,'qpm-'+cls);
      arrow(b.x,b.y,'right','qpm-'+cls);
      if(txt)label(mid+4,Math.min(a.y,b.y)-5,txt,'qpm-'+cls);
    };
    const down=(aKey,bKey,cls='main',txt='')=>{
      const a=pos(aKey,'bottom'),b=pos(bKey,'top');
      if(!a||!b)return;
      const mid=a.y+(b.y-a.y)/2;
      path('M '+a.x+' '+a.y+' V '+mid+' H '+b.x+' V '+b.y,'qpm-'+cls);
      arrow(b.x,b.y,'down','qpm-'+cls);
      if(txt)label(a.x+6,mid-4,txt,'qpm-'+cls);
    };

    [
      ['sales','due'],['due','plan'],['plan','purchase'],['purchase','incoming'],['incoming','incomingLot'],
      ['incomingLot','iqc'],['rawLot','rawStock'],['rawStock','workOrder'],['workOrder','input'],['input','production'],
      ['production','result'],['result','pqc'],['complete','finishedLot'],['finishedLot','finishedStock'],['finishedStock','oqc'],
      ['ship','coa'],['coa','delivery'],['lotTrace','ncrHub'],['ncrHub','approval']
    ].forEach(x=>connect(x[0],x[1]));

    connect('iqc','iqcDecision');
    connect('iqcDecision','rawLot','yes','YES');
    down('iqcDecision','iqcNcr','no','NO');

    connect('pqc','pqcDecision');
    connect('pqcDecision','complete','yes','YES');
    down('pqcDecision','pqcNcr','no','NO');

    connect('oqc','oqcDecision');
    connect('oqcDecision','ship','yes','YES');
    down('oqcDecision','oqcNcr','no','NO');

    [['incomingLot','lotTrace'],['workOrder','lotTrace'],['result','lotTrace'],['finishedLot','lotTrace'],['ship','lotTrace'],
     ['iqcNcr','ncrHub'],['pqcNcr','ncrHub'],['oqcNcr','ncrHub']].forEach(x=>connect(x[0],x[1],'trace'));

    grid.prepend(svg);
  }

  function render(){
    root.innerHTML='<div class="qpm-shell"><div class="qpm-head"><div><h1>나모케미칼 QMES 프로세스</h1><p>수주 · 구매 · 품질 · 생산 · 출하 · LOT 추적을 하나의 흐름으로 연결합니다.</p></div><button type="button" class="qpm-refresh">연동상태 새로고침</button></div><div class="qpm-board"><div class="qpm-flow-caption">나모케미칼 QMES 전체 Process MAP</div><div class="qpm-grid qpm-dense-grid"></div></div></div>';

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
    root.querySelector('.qpm-refresh')?.addEventListener('click',()=>{render();});
    requestAnimationFrame(()=>requestAnimationFrame(drawLinks));
  }

  window.addEventListener('resize',()=>{clearTimeout(window.__qpmResize);window.__qpmResize=setTimeout(drawLinks,120);});
  render();
})();