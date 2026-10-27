/* NAMO QMES final process map - 2026-10-27 */
(function(){
  "use strict";
  const root=document.getElementById('processMap');
  if(!root||root.dataset.qpmReady==='1')return;
  root.dataset.qpmReady='1';

  const go=page=>document.querySelector('.menu[data-page="'+page+'"]')?.click();

  const ICONS={
    sales:'▤', due:'▦', plan:'▥', purchase:'▰', incoming:'▣', incomingLot:'⬡',
    iqc:'▤', rawLot:'◉', rawStock:'⌂', workOrder:'▤', input:'⬡', production:'⚙',
    result:'▤', pqc:'▤', complete:'✓', finishedLot:'⬡', finishedStock:'⌂',
    oqc:'▤', ship:'▰', coa:'▤', delivery:'✓', lotTrace:'⌕', ncrHub:'⚠',
    approval:'▤', iqcNcr:'⚠', pqcNcr:'⚠', oqcNcr:'⚠',
    traceIncoming:'◉', traceWork:'▤', traceProd:'⚙', traceFinished:'⬡', traceShip:'▰', traceNcr:'⚠'
  };

  function node(key,label,page,kind=''){
    return '<button type="button" class="qpm-node '+kind+'" data-key="'+key+'" data-page="'+page+'">'+
      '<span class="qpm-node-icon">'+(ICONS[key]||'•')+'</span><span>'+label+'</span></button>';
  }
  function diamond(key,label){
    return '<div class="qpm-diamond" data-key="'+key+'"><span>'+label+'</span></div>';
  }
  function group(title,icon,body){
    return '<section class="qpm-group"><div class="qpm-group-title"><span class="qpm-group-icon">'+icon+'</span><span>'+title+'</span></div><div class="qpm-body">'+body+'</div></section>';
  }
  function traceNode(key,title,sub,page){
    return '<button type="button" class="qpm-trace-node" data-key="'+key+'" data-page="'+page+'">'+
      '<span class="qpm-trace-icon">'+(ICONS[key]||'•')+'</span><span><b>'+title+'</b></span></button>';
  }

  function drawLinks(){
    const canvas=root.querySelector('.qpm-canvas');
    if(!canvas)return;
    canvas.querySelector('.qpm-link-layer')?.remove();

    const NS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(NS,'svg');
    svg.classList.add('qpm-link-layer');
    svg.setAttribute('width',canvas.scrollWidth);
    svg.setAttribute('height',canvas.scrollHeight);
    svg.setAttribute('viewBox','0 0 '+canvas.scrollWidth+' '+canvas.scrollHeight);

    const bounds=canvas.getBoundingClientRect();
    const pos=(key,side)=>{
      const el=canvas.querySelector('[data-key="'+key+'"]');
      if(!el)return null;
      const r=el.getBoundingClientRect();
      const x=r.left-bounds.left, y=r.top-bounds.top, w=r.width, h=r.height;
      if(side==='left')return {x,y:y+h/2};
      if(side==='right')return {x:x+w,y:y+h/2};
      if(side==='top')return {x:x+w/2,y};
      return {x:x+w/2,y:y+h};
    };
    const path=(d,cls)=>{
      const p=document.createElementNS(NS,'path');
      p.setAttribute('d',d); p.setAttribute('class','qpm-link '+cls); svg.appendChild(p);
    };
    const arrow=(p,dir,cls)=>{
      const e=document.createElementNS(NS,'path'),s=4.5;
      let d='';
      if(dir==='right') d='M '+(p.x-s)+' '+(p.y-s)+' L '+p.x+' '+p.y+' L '+(p.x-s)+' '+(p.y+s);
      if(dir==='left') d='M '+(p.x+s)+' '+(p.y-s)+' L '+p.x+' '+p.y+' L '+(p.x+s)+' '+(p.y+s);
      if(dir==='down') d='M '+(p.x-s)+' '+(p.y-s)+' L '+p.x+' '+p.y+' L '+(p.x+s)+' '+(p.y-s);
      if(dir==='up') d='M '+(p.x-s)+' '+(p.y+s)+' L '+p.x+' '+p.y+' L '+(p.x+s)+' '+(p.y+s);
      e.setAttribute('d',d); e.setAttribute('class','qpm-arrowhead '+cls); svg.appendChild(e);
    };
    const text=(x,y,val,cls)=>{
      const t=document.createElementNS(NS,'text');
      t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('class','qpm-link-label '+cls);t.textContent=val;svg.appendChild(t);
    };
    const h=(aKey,bKey,cls='main',label='')=>{
      const a=pos(aKey,'right'),b=pos(bKey,'left'); if(!a||!b)return;
      const mid=(a.x+b.x)/2;
      path('M '+a.x+' '+a.y+' H '+mid+' V '+b.y+' H '+b.x,'qpm-'+cls);
      arrow(b,'right','qpm-'+cls);
      if(label)text(mid+4,Math.min(a.y,b.y)-6,label,'qpm-'+cls);
    };
    const v=(aKey,bKey,cls='main',label='')=>{
      const a=pos(aKey,'bottom'),b=pos(bKey,'top'); if(!a||!b)return;
      const mid=(a.y+b.y)/2;
      path('M '+a.x+' '+a.y+' V '+mid+' H '+b.x+' V '+b.y,'qpm-'+cls);
      arrow(b,'down','qpm-'+cls);
      if(label)text(a.x+7,mid-5,label,'qpm-'+cls);
    };
    const trace=(aKey,bKey)=>{
      const a=pos(aKey,'bottom'),b=pos(bKey,'top'); if(!a||!b)return;
      const mid=a.y+Math.max(16,(b.y-a.y)/2);
      path('M '+a.x+' '+a.y+' V '+mid+' H '+b.x+' V '+b.y,'qpm-trace');
      arrow(b,'down','qpm-trace');
    };

    // Vertical flow inside each lane
    [['sales','due'],['due','plan'],['purchase','incoming'],['incoming','incomingLot'],
     ['iqc','iqcDecision'],['rawLot','rawStock'],['rawStock','workOrder'],
     ['input','production'],['production','result'],['pqc','pqcDecision'],
     ['complete','finishedLot'],['finishedLot','finishedStock'],['oqc','oqcDecision'],
     ['ship','coa'],['coa','delivery'],['lotTrace','ncrHub'],['ncrHub','approval']]
      .forEach(x=>v(x[0],x[1]));

    // Main left-to-right flow
    [['plan','purchase'],['incomingLot','iqc'],['rawStock','input'],['workOrder','input'],
     ['result','pqc'],['finishedStock','oqc'],['delivery','lotTrace']]
      .forEach(x=>h(x[0],x[1]));

    // Decision branches
    h('iqcDecision','rawLot','yes','YES');
    v('iqcDecision','iqcNcr','no','NO');

    h('pqcDecision','complete','yes','YES');
    v('pqcDecision','pqcNcr','no','NO');

    h('oqcDecision','ship','yes','YES');
    v('oqcDecision','oqcNcr','no','NO');

    // Bottom traceability row
    [['traceIncoming','traceWork'],['traceWork','traceProd'],['traceProd','traceFinished'],
     ['traceFinished','traceShip'],['traceShip','traceNcr']]
      .forEach(x=>h(x[0],x[1],'trace'));

    trace('incomingLot','traceIncoming');
    trace('workOrder','traceWork');
    trace('result','traceProd');
    trace('finishedLot','traceFinished');
    trace('delivery','traceShip');
    trace('ncrHub','traceNcr');

    trace('iqcNcr','traceNcr');
    trace('pqcNcr','traceNcr');
    trace('oqcNcr','traceNcr');

    canvas.prepend(svg);
  }

  function render(){
    root.innerHTML=
      '<div class="qpm-shell">'+
        '<div class="qpm-head"><div><h1>나모케미칼 QMES 프로세스</h1></div></div>'+
        '<div class="qpm-board">'+
          '<div class="qpm-flow-caption">나모케미칼 QMES 전체 Process MAP</div>'+
          '<div class="qpm-canvas">'+
            '<div class="qpm-grid qpm-dense-grid"></div>'+
            '<section class="qpm-trace-panel">'+
              '<div class="qpm-trace-title"><span>⬡</span> LOT / 품질 추적 데이터 연계 흐름</div>'+
              '<div class="qpm-trace-row"></div>'+
            '</section>'+
          '</div>'+
        '</div>'+
      '</div>';

    const html=[
      group('수주 / 납기','▰',
        node('sales','수주등록','orders')+
        node('due','납기확인','orders')+
        node('plan','생산계획','orders')
      ),
      group('구매 / 입고','▰',
        node('purchase','구매발주','purchase')+
        node('incoming','원재료 입고','incoming')+
        node('incomingLot','입고 LOT 등록','incoming')
      ),
      group('수입검사 IQC','⌕',
        node('iqc','IQC 검사등록','incoming')+
        diamond('iqcDecision','IQC 합격?')+
        node('iqcNcr','NCR 자동등록','ncr','red')
      ),
      group('원료 / 작업지시','⚙',
        node('rawLot','합격 원료 LOT','incoming')+
        node('rawStock','원료재고','inventory')+
        node('workOrder','작업지시 발행','work')
      ),
      group('생산','⚙',
        node('input','원료투입','work')+
        node('production','생산진행','work')+
        node('result','생산실적 등록','work')
      ),
      group('공정검사 PQC','⌕',
        node('pqc','PQC 검사등록','process')+
        diamond('pqcDecision','PQC 합격?')+
        node('pqcNcr','NCR 자동등록','ncr','red')
      ),
      group('생산완료 / 완제품','⬡',
        node('complete','생산완료','work')+
        node('finishedLot','완제품 LOT 생성','work')+
        node('finishedStock','완제품 재고','inventory')
      ),
      group('출하검사 OQC','⌕',
        node('oqc','OQC 검사등록','outgoing')+
        diamond('oqcDecision','OQC 합격?')+
        node('oqcNcr','NCR 자동등록','ncr','red')
      ),
      group('출하 / 납품','▰',
        node('ship','출하등록','orders')+
        node('coa','성적서 / COA','outgoing')+
        node('delivery','고객사 납품완료','orders')
      ),
      group('LOT / 품질 추적','▥',
        node('lotTrace','LOT 추적','lotTrace')+
        node('ncrHub','부적합 NCR','ncr')+
        node('approval','전자결재 / 승인','approval')
      )
    ].join('');

    root.querySelector('.qpm-grid').innerHTML=html;
    root.querySelector('.qpm-trace-row').innerHTML=
      traceNode('traceIncoming','입고 LOT','(원재료 LOT)','incoming')+
      traceNode('traceWork','작업지시','(생산지시 LOT)','work')+
      traceNode('traceProd','생산실적','(생산 LOT)','work')+
      traceNode('traceFinished','완제품 LOT','(완제품 LOT)','inventory')+
      traceNode('traceShip','출하 정보','(출하 LOT)','orders')+
      traceNode('traceNcr','NCR 이력','(품질 이슈)','ncr');

    root.insertAdjacentHTML('beforeend',
      '<div class="qpm-foot">'+
      '<span class="legend main">→ 주요 프로세스 흐름</span>'+
      '<span class="legend trace">⇢ LOT / 품질 데이터 연계</span>'+
      '<span class="legend yes">→ YES (다음 공정 진행)</span>'+
      '<span class="legend no">→ NO (NCR 자동등록)</span>'+
      '</div>');

    root.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.page)));
    requestAnimationFrame(()=>requestAnimationFrame(drawLinks));
  }

  window.addEventListener('resize',()=>{
    clearTimeout(window.__qpmResize);
    window.__qpmResize=setTimeout(drawLinks,120);
  });
  render();
})();