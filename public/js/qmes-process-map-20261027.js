/* NAMO QMES stable connected process map - 2026-10-27 */
(function(){
  "use strict";
  const root=document.getElementById('processMap');
  if(!root||root.dataset.qpmReady==='1')return;
  root.dataset.qpmReady='1';

  const go=page=>document.querySelector('.menu[data-page="'+page+'"]')?.click();
  const ICONS={
    sales:'▤',due:'▦',plan:'▥',purchase:'▰',incoming:'▣',incomingLot:'⬡',
    iqc:'▤',rawLot:'◉',rawStock:'⌂',workOrder:'▤',input:'⬡',production:'⚙',result:'▤',
    pqc:'▤',complete:'✓',finishedLot:'⬡',finishedStock:'⌂',oqc:'▤',
    ship:'▰',coa:'▤',delivery:'✓',lotTrace:'⌕',ncrHub:'⚠',approval:'▤',
    iqcNcr:'⚠',pqcNcr:'⚠',oqcNcr:'⚠',
    traceIncoming:'◉',traceWork:'▤',traceProd:'⚙',traceFinished:'⬡',traceShip:'▰',traceNcr:'⚠'
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
      '<span class="qpm-trace-icon">'+(ICONS[key]||'•')+'</span><span><b>'+title+'</b><small>'+sub+'</small></span></button>';
  }

  function drawWires(){
    const canvas=root.querySelector('.qpm-canvas');
    if(!canvas)return;
    canvas.querySelector('.qpm-wire-layer')?.remove();

    const layer=document.createElement('div');
    layer.className='qpm-wire-layer';

    const bounds=canvas.getBoundingClientRect();
    const pos=(key,side)=>{
      const el=canvas.querySelector('[data-key="'+key+'"]');
      if(!el)return null;
      const r=el.getBoundingClientRect();
      const x=r.left-bounds.left, y=r.top-bounds.top;
      if(side==='left') return {x:x,y:y+r.height/2};
      if(side==='right') return {x:x+r.width,y:y+r.height/2};
      if(side==='top') return {x:x+r.width/2,y:y};
      return {x:x+r.width/2,y:y+r.height};
    };

    const seg=(x,y,w,h,cls)=>{
      const d=document.createElement('div');
      d.className='qpm-wire '+cls;
      d.style.left=x+'px'; d.style.top=y+'px';
      d.style.width=Math.max(1,w)+'px'; d.style.height=Math.max(1,h)+'px';
      layer.appendChild(d);
    };
    const arrow=(x,y,dir,cls)=>{
      const a=document.createElement('div');
      a.className='qpm-wire-arrow '+cls+' '+dir;
      a.style.left=x+'px'; a.style.top=y+'px';
      layer.appendChild(a);
    };
    const label=(x,y,t,cls)=>{
      const s=document.createElement('span');
      s.className='qpm-wire-label '+cls;
      s.textContent=t; s.style.left=x+'px'; s.style.top=y+'px';
      layer.appendChild(s);
    };

    const vertical=(aKey,bKey,cls='main')=>{
      const a=pos(aKey,'bottom'), b=pos(bKey,'top');
      if(!a||!b)return;
      const y1=Math.min(a.y,b.y), y2=Math.max(a.y,b.y);
      seg(a.x-0.75,y1,1.5,y2-y1,'v '+cls);
      arrow(b.x,b.y-2,'down',cls);
    };
    const horizontal=(aKey,bKey,cls='main',txt='')=>{
      const a=pos(aKey,'right'), b=pos(bKey,'left');
      if(!a||!b)return;
      const gapMid=(a.x+b.x)/2;
      const x1=Math.min(a.x,gapMid), x2=Math.max(a.x,gapMid);
      seg(x1,a.y-0.75,x2-x1,1.5,'h '+cls);
      const vy1=Math.min(a.y,b.y), vy2=Math.max(a.y,b.y);
      if(Math.abs(b.y-a.y)>2) seg(gapMid-0.75,vy1,1.5,vy2-vy1,'v '+cls);
      const x3=Math.min(gapMid,b.x), x4=Math.max(gapMid,b.x);
      seg(x3,b.y-0.75,x4-x3,1.5,'h '+cls);
      arrow(b.x-2,b.y,'right',cls);
      if(txt) label(gapMid+3,Math.min(a.y,b.y)-15,txt,cls);
    };
    const toTrace=(aKey,bKey,cls='trace')=>{
      const a=pos(aKey,'bottom'), b=pos(bKey,'top');
      if(!a||!b)return;
      const yMid=a.y+Math.max(18,(b.y-a.y)*0.45);
      seg(a.x-0.75,a.y,1.5,yMid-a.y,'v '+cls);
      const x1=Math.min(a.x,b.x), x2=Math.max(a.x,b.x);
      seg(x1,yMid-0.75,x2-x1,1.5,'h '+cls);
      seg(b.x-0.75,yMid,1.5,b.y-yMid,'v '+cls);
      arrow(b.x,b.y-2,'down',cls);
    };

    // Inside each lane
    [['sales','due'],['due','plan'],['purchase','incoming'],['incoming','incomingLot'],
     ['iqc','iqcDecision'],['rawLot','rawStock'],['rawStock','workOrder'],
     ['input','production'],['production','result'],['pqc','pqcDecision'],
     ['complete','finishedLot'],['finishedLot','finishedStock'],['oqc','oqcDecision'],
     ['ship','coa'],['coa','delivery'],['lotTrace','ncrHub'],['ncrHub','approval']]
      .forEach(x=>vertical(x[0],x[1]));

    // Main process across lanes
    horizontal('plan','purchase');
    horizontal('incomingLot','iqc');
    horizontal('iqcDecision','rawLot','yes','YES');
    horizontal('workOrder','input');
    horizontal('result','pqc');
    horizontal('pqcDecision','complete','yes','YES');
    horizontal('finishedStock','oqc');
    horizontal('oqcDecision','ship','yes','YES');
    horizontal('delivery','lotTrace');

    // NO branches
    vertical('iqcDecision','iqcNcr','no'); label(pos('iqcDecision','bottom').x+8,pos('iqcDecision','bottom').y+8,'NO','no');
    vertical('pqcDecision','pqcNcr','no'); label(pos('pqcDecision','bottom').x+8,pos('pqcDecision','bottom').y+8,'NO','no');
    vertical('oqcDecision','oqcNcr','no'); label(pos('oqcDecision','bottom').x+8,pos('oqcDecision','bottom').y+8,'NO','no');

    // Bottom traceability
    [['traceIncoming','traceWork'],['traceWork','traceProd'],['traceProd','traceFinished'],
     ['traceFinished','traceShip'],['traceShip','traceNcr']]
      .forEach(x=>horizontal(x[0],x[1],'trace'));

    toTrace('incomingLot','traceIncoming');
    toTrace('workOrder','traceWork');
    toTrace('result','traceProd');
    toTrace('finishedLot','traceFinished');
    toTrace('delivery','traceShip');
    toTrace('ncrHub','traceNcr');
    toTrace('iqcNcr','traceNcr');
    toTrace('pqcNcr','traceNcr');
    toTrace('oqcNcr','traceNcr');

    canvas.prepend(layer);
  }

  function render(){
    root.innerHTML=
      '<div class="qpm-shell">'+
        '<div class="qpm-head"><div><h1>나모케미칼 QMES 프로세스</h1>'+
        '<p>수주 → 구매/입고 → 수입검사 → 원료/작업지시 → 생산 → 공정검사 → 생산완료 → 출하검사 → 출하 → LOT 추적 · NCR</p></div>'+
        '<button type="button" class="qpm-refresh">연동상태 새로고침</button></div>'+
        '<div class="qpm-board"><div class="qpm-flow-caption">나모케미칼 QMES 전체 Process MAP</div>'+
        '<div class="qpm-canvas"><div class="qpm-grid qpm-dense-grid"></div>'+
        '<section class="qpm-trace-panel"><div class="qpm-trace-title"><span>⬡</span> LOT / 품질 추적 데이터 연계 흐름</div>'+
        '<div class="qpm-trace-row"></div></section></div></div></div>';

    const html=[
      group('수주 / 납기','▰',node('sales','수주등록','orders')+node('due','납기확인','orders')+node('plan','생산계획','orders')),
      group('구매 / 입고','▰',node('purchase','구매발주','purchase')+node('incoming','원재료 입고','incoming')+node('incomingLot','입고 LOT 등록','incoming')),
      group('수입검사 IQC','⌕',node('iqc','IQC 검사등록','incoming')+diamond('iqcDecision','IQC 합격?')+node('iqcNcr','NCR 자동등록','ncr','red')),
      group('원료 / 작업지시','⚙',node('rawLot','합격 원료 LOT','incoming')+node('rawStock','원료재고','inventory')+node('workOrder','작업지시 발행','work')),
      group('생산','⚙',node('input','원료투입','work')+node('production','생산진행','work')+node('result','생산실적 등록','work')),
      group('공정검사 PQC','⌕',node('pqc','PQC 검사등록','process')+diamond('pqcDecision','PQC 합격?')+node('pqcNcr','NCR 자동등록','ncr','red')),
      group('생산완료 / 완제품','⬡',node('complete','생산완료','work')+node('finishedLot','완제품 LOT 생성','work')+node('finishedStock','완제품 재고','inventory')),
      group('출하검사 OQC','⌕',node('oqc','OQC 검사등록','outgoing')+diamond('oqcDecision','OQC 합격?')+node('oqcNcr','NCR 자동등록','ncr','red')),
      group('출하 / 납품','▰',node('ship','출하등록','orders')+node('coa','성적서 / COA','outgoing')+node('delivery','고객사 납품완료','orders')),
      group('LOT / 품질 추적','▥',node('lotTrace','LOT 추적','lotTrace')+node('ncrHub','부적합 NCR','ncr')+node('approval','전자결재 / 승인','approval'))
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
      '<div class="qpm-foot"><span class="legend main">→ 주요 프로세스 흐름</span>'+
      '<span class="legend trace">⇢ LOT / 품질 데이터 연계</span>'+
      '<span class="legend yes">→ YES (다음 공정 진행)</span>'+
      '<span class="legend no">→ NO (NCR 자동등록)</span></div>');

    root.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.page)));
    root.querySelector('.qpm-refresh')?.addEventListener('click',render);
    requestAnimationFrame(()=>requestAnimationFrame(drawWires));
  }

  window.addEventListener('resize',()=>{
    clearTimeout(window.__qpmResize);
    window.__qpmResize=setTimeout(drawWires,120);
  });
  render();
})();