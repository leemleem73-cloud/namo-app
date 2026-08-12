/* IQC commercial dashboard enhancement — 2026-08-13
 * Presentation-only augmentation. Existing IQC CRUD/sync logic is untouched.
 */
(function(){
  'use strict';
  if(window.__QMES_IQC_COMMERCIAL_LAYOUT_20260813__) return;
  window.__QMES_IQC_COMMERCIAL_LAYOUT_20260813__=true;

  function text(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function parseDate(v){var m=String(v||'').match(/^(20\d{2})-(\d{2})-(\d{2})/);return m?m[1]+'-'+m[2]:'';}
  function records(){return window.DB&&Array.isArray(DB.iqc)?DB.iqc:[];}

  function findIqcRoot(){
    var kicker=Array.from(document.querySelectorAll('.qmes-iqc-quickbar-kicker')).find(function(el){return text(el)==='INCOMING QUALITY CONTROL';});
    if(!kicker) return null;
    var root=kicker.closest('.flex.flex-col.gap-4');
    return root||kicker.parentElement&&kicker.parentElement.parentElement;
  }

  function enhanceKpi(root){
    if(!root) return;
    var summary=root.firstElementChild;
    if(!summary||summary.classList.contains('qmes-iqc-quickbar')) return;
    summary.classList.add('qmes-iqc-kpi-current');
    var cards=Array.from(summary.children||[]);
    if(cards.length<5) return;
    var rate=0;
    var now=new Date();
    var month=String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0');
    var done=records().filter(function(r){return parseDate(r.recv)===month&&r.judge!=='검사중';});
    if(done.length) rate=done.filter(function(r){return r.judge==='합격';}).length/done.length*100;
    var card=cards[2];
    if(!card.querySelector('.qmes-iqc-mini-donut')){
      var donut=document.createElement('div');
      donut.className='qmes-iqc-mini-donut';
      donut.innerHTML='<strong></strong>';
      card.appendChild(donut);
    }
    var donut=card.querySelector('.qmes-iqc-mini-donut');
    donut.style.setProperty('--iqc-rate',Math.max(0,Math.min(100,rate))+'%');
    donut.querySelector('strong').textContent=done.length?rate.toFixed(1)+'%':'—';
  }

  function enhanceFilter(root){
    var filter=root&&root.querySelector('.qmes-iqc-record-filter');
    if(!filter||filter.querySelector('.qmes-iqc-filter-judge')) return;
    var reset=Array.from(filter.querySelectorAll('button')).find(function(b){return text(b).indexOf('초기화')>=0;});
    if(!reset) return;
    var wrap=document.createElement('label');
    wrap.className='qmes-iqc-filter-judge';
    wrap.innerHTML='<span>판정</span><select><option value="전체">전체 판정</option><option value="합격">합격</option><option value="불합격">불합격</option></select>';
    filter.insertBefore(wrap,reset);
    wrap.querySelector('select').addEventListener('change',function(){
      var value=this.value;
      var table=root.querySelector('.qmes-iqc-ledger-table');
      if(!table) return;
      Array.from(table.tBodies[0]&&table.tBodies[0].rows||[]).forEach(function(row){
        if(row.querySelector('.qmes-iqc-empty-row')) return;
        var judge=Array.from(row.cells||[]).some(function(cell){return text(cell)==='합격'||text(cell)==='불합격';})?Array.from(row.cells).map(text).find(function(v){return v==='합격'||v==='불합격';}):'';
        row.style.display=value==='전체'||judge===value?'':'none';
      });
    });
  }

  function enhanceTable(root){
    var table=root&&root.querySelector('.qmes-iqc-ledger-table');
    if(!table||table.dataset.qmesCommercial==='1') return;
    var head=table.tHead&&table.tHead.rows[0];
    var body=table.tBodies&&table.tBodies[0];
    if(!head||!body) return;
    var headers=Array.from(head.cells).map(text);
    if(headers.indexOf('입고번호')>=0){table.dataset.qmesCommercial='1';return;}
    var h1=document.createElement('th');h1.textContent='입고번호';h1.className='qmes-iqc-extra-inno';head.insertBefore(h1,head.cells[1]);
    var h2=document.createElement('th');h2.textContent='입고수량';h2.className='qmes-iqc-extra-qty';head.insertBefore(h2,head.cells[5]);
    var h3=document.createElement('th');h3.textContent='검사수량';h3.className='qmes-iqc-extra-inspectqty';head.insertBefore(h3,head.cells[6]);
    Array.from(body.rows).forEach(function(row){
      if(row.querySelector('.qmes-iqc-empty-row')){row.cells[0].colSpan=10;return;}
      var recv=text(row.cells[0]);
      var lot=text(row.cells[4]);
      var name=text(row.cells[2]);
      var supplier=text(row.cells[3]);
      var match=records().find(function(r){return String(r.recv||'').slice(0,10)===recv&&String(r.lot||'')===lot&&String(r.name||'')===name&&String(r.supplier||'')===supplier;})||records().find(function(r){return String(r.recv||'').slice(0,10)===recv&&String(r.lot||'')===lot;});
      var c1=document.createElement('td');c1.className='qmes-iqc-extra-inno';c1.textContent=match&&match.inNo||'-';row.insertBefore(c1,row.cells[1]);
      var c2=document.createElement('td');c2.className='qmes-iqc-extra-qty';c2.textContent=match&&match.qty||'-';row.insertBefore(c2,row.cells[5]);
      var c3=document.createElement('td');c3.className='qmes-iqc-extra-inspectqty';c3.textContent=match&&match.inspectQty||'-';row.insertBefore(c3,row.cells[6]);
    });
    table.dataset.qmesCommercial='1';
  }

  function monthStats(){
    var map={};
    records().forEach(function(r){
      var key=parseDate(r.recv);if(!key)return;
      if(!map[key])map[key]={total:0,pass:0};
      if(r.judge!=='검사중'){map[key].total++;if(r.judge==='합격')map[key].pass++;}
    });
    return Object.keys(map).sort().slice(-6).map(function(key){var x=map[key];return {key:key,label:Number(key.slice(5))+'월',rate:x.total?x.pass/x.total*100:0};});
  }

  function enhanceBottom(root){
    var chart=root&&root.querySelector('.qmes-iqc-chart-only');
    if(!chart) return;
    var rank=chart.querySelector('.qmes-iqc-rank-panel');
    if(rank&&!rank.querySelector('.qmes-iqc-trend-block')){
      var trend=document.createElement('div');trend.className='qmes-iqc-trend-block';
      var stats=monthStats();
      trend.innerHTML='<div class="qmes-iqc-trend-head"><strong>월별 IQC 합격률 추이</strong><span>최근 6개월</span></div><div class="qmes-iqc-trend-bars">'+(stats.length?stats.map(function(x){return '<div class="qmes-iqc-trend-item"><b>'+x.rate.toFixed(1)+'%</b><div class="qmes-iqc-trend-bar" style="height:'+Math.max(4,x.rate)+'%"></div><span>'+x.label+'</span></div>';}).join(''):'<div style="grid-column:1/-1;color:#7896ae;font-size:11px;align-self:center;text-align:center">추이 데이터가 없습니다.</div>')+'</div>';
      rank.appendChild(trend);
    }
    if(!chart.querySelector('.qmes-iqc-action-panel')){
      var rows=records();
      var now=new Date();var current=String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0');
      var monthly=rows.filter(function(r){return parseDate(r.recv)===current;});
      var fail=monthly.filter(function(r){return r.judge==='불합격';}).length;
      var done=monthly.filter(function(r){return r.judge!=='검사중';}).length;
      var pass=monthly.filter(function(r){return r.judge==='합격';}).length;
      var panel=document.createElement('div');panel.className='qmes-iqc-action-panel';
      panel.innerHTML='<h3>IQC 조치 현황</h3><div class="qmes-iqc-action-row"><span>검사 대기</span><strong>'+Math.max(0,monthly.length-done)+'건</strong></div><div class="qmes-iqc-action-row is-danger"><span>부적합 / 격리</span><strong>'+fail+'건</strong></div><div class="qmes-iqc-action-row"><span>NCR 검토 대상</span><strong>'+fail+'건</strong></div><div class="qmes-iqc-action-row"><span>금월 검사 완료</span><strong>'+done+'건</strong></div><div class="qmes-iqc-action-row is-good"><span>금월 합격</span><strong>'+pass+'건</strong></div><div class="qmes-iqc-action-note">부적합 발생 시 격리 → NCR 검토 → 업체 통보 → 반품/특채 흐름을 확인하는 요약 영역입니다.</div>';
      chart.appendChild(panel);
    }
  }

  function apply(){
    var root=findIqcRoot();if(!root)return;
    root.classList.add('qmes-iqc-page-commercial');
    enhanceKpi(root);enhanceFilter(root);enhanceTable(root);enhanceBottom(root);
  }
  var queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('qmes:data-updated',schedule);
  window.addEventListener('qmes:data-changed',schedule);
})();
