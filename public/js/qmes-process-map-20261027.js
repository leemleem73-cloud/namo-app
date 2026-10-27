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
      '<span class="qpm-trace-icon">'+(ICONS[key]||'•')+'</span><span><b>'+title+'</b><small>'+sub+'</small></span></button>';
  }


  function downLink(cls='main',label=''){
    return '<div class="qpm-inline-link qpm-inline-'+cls+'">'+
      (label?'<span>'+label+'</span>':'')+
      '<i></i></div>';
  }
  function stageLink(cls='main',label=''){
    return '<div class="qpm-stage-link qpm-stage-'+cls+'">'+
      (label?'<span>'+label+'</span>':'')+
      '<i></i></div>';
  }

  function render(){
    root.innerHTML=
      '<div class="qpm-shell">'+
        '<div class="qpm-head"><div><h1>나모케미칼 QMES 프로세스</h1>'+
        '<p>수주 → 구매/입고 → 수입검사 → 원료/작업지시 → 생산 → 공정검사 → 생산완료 → 출하검사 → 출하 → LOT 추적 · NCR</p></div>'+
        '<button type="button" class="qpm-refresh">연동상태 새로고침</button></div>'+
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
        downLink()+
        node('due','납기확인','orders')+
        downLink()+
        node('plan','생산계획','orders')+
        stageLink()
      ),
      group('구매 / 입고','▰',
        node('purchase','구매발주','purchase')+
        downLink()+
        node('incoming','원재료 입고','incoming')+
        downLink()+
        node('incomingLot','입고 LOT 등록','incoming')+
        stageLink()
      ),
      group('수입검사 IQC','⌕',
        node('iqc','IQC 검사등록','incoming')+
        downLink()+
        diamond('iqcDecision','IQC 합격?')+
        '<div class="qpm-decision-branches"><div class="qpm-yes-branch">YES</div><div class="qpm-no-branch">NO</div></div>'+
        downLink('no')+
        node('iqcNcr','NCR 자동등록','ncr','red')+
        stageLink('yes','YES')
      ),
      group('원료 / 작업지시','⚙',
        node('rawLot','합격 원료 LOT','incoming')+
        downLink()+
        node('rawStock','원료재고','inventory')+
        downLink()+
        node('workOrder','작업지시 발행','work')+
        stageLink()
      ),
      group('생산','⚙',
        node('input','원료투입','work')+
        downLink()+
        node('production','생산진행','work')+
        downLink()+
        node('result','생산실적 등록','work')+
        stageLink()
      ),
      group('공정검사 PQC','⌕',
        node('pqc','PQC 검사등록','process')+
        downLink()+
        diamond('pqcDecision','PQC 합격?')+
        '<div class="qpm-decision-branches"><div class="qpm-yes-branch">YES</div><div class="qpm-no-branch">NO</div></div>'+
        downLink('no')+
        node('pqcNcr','NCR 자동등록','ncr','red')+
        stageLink('yes','YES')
      ),
      group('생산완료 / 완제품','⬡',
        node('complete','생산완료','work')+
        downLink()+
        node('finishedLot','완제품 LOT 생성','work')+
        downLink()+
        node('finishedStock','완제품 재고','inventory')+
        stageLink()
      ),
      group('출하검사 OQC','⌕',
        node('oqc','OQC 검사등록','outgoing')+
        downLink()+
        diamond('oqcDecision','OQC 합격?')+
        '<div class="qpm-decision-branches"><div class="qpm-yes-branch">YES</div><div class="qpm-no-branch">NO</div></div>'+
        downLink('no')+
        node('oqcNcr','NCR 자동등록','ncr','red')+
        stageLink('yes','YES')
      ),
      group('출하 / 납품','▰',
        node('ship','출하등록','orders')+
        downLink()+
        node('coa','성적서 / COA','outgoing')+
        downLink()+
        node('delivery','고객사 납품완료','orders')+
        stageLink()
      ),
      group('LOT / 품질 추적','▥',
        node('lotTrace','LOT 추적','lotTrace')+
        downLink()+
        node('ncrHub','부적합 NCR','ncr')+
        downLink()+
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
    root.querySelector('.qpm-refresh')?.addEventListener('click',render);

  }

  render();
})();