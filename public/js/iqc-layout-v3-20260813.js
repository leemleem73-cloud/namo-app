/* IQC layout v3 - presentation only, no DB writes */
(function(){
  'use strict';
  if (window.__QMES_IQC_LAYOUT_V3__) return;
  window.__QMES_IQC_LAYOUT_V3__ = true;

  const STYLE_ID = 'qmes-iqc-layout-v3-style';
  const text = (el) => String(el && el.textContent || '').replace(/\s+/g,' ').trim();
  const rows = () => (window.DB && Array.isArray(DB.iqc) ? DB.iqc : []);

  function ensureStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #root .qmes-iqc-v3{width:100%!important;max-width:none!important;margin:0!important;gap:12px!important}
      #root .qmes-iqc-v3 .qmes-iqc-v3-kpis{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:10px!important;width:100%!important}
      #root .qmes-iqc-v3 .qmes-iqc-v3-kpis>*{position:relative!important;min-width:0!important;min-height:88px!important;border:1px solid #284761!important;border-radius:9px!important;background:#0d2237!important;overflow:hidden!important}
      #root .qmes-iqc-v3 .qmes-iqc-v3-kpis>*:nth-child(3){padding-right:90px!important}
      #root .qmes-iqc-v3-donut{position:absolute;right:17px;top:50%;transform:translateY(-50%);width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#1ed39a var(--rate),#294158 0);z-index:3}
      #root .qmes-iqc-v3-donut:after{content:"";position:absolute;width:43px;height:43px;border-radius:50%;background:#0d2237}
      #root .qmes-iqc-v3-donut b{position:relative;z-index:2;color:#7cf0c8;font-size:9px;font-weight:900}
      #root .qmes-iqc-v3 .qmes-iqc-quickbar{padding:11px 14px!important;border-radius:9px!important;min-height:58px!important}
      #root .qmes-iqc-v3 .qmes-iqc-ledger-panel{border-radius:9px!important}
      #root .qmes-iqc-v3 .qmes-iqc-record-filter{display:grid!important;grid-template-columns:minmax(320px,1fr) 120px 120px 120px 100px!important;gap:7px!important;align-items:end!important;width:100%!important;padding:9px!important;margin-bottom:8px!important;border:1px solid #1f3c55!important;border-radius:7px!important;background:#091a2b!important}
      #root .qmes-iqc-v3 .qmes-iqc-record-filter>.w-72{width:auto!important;min-width:0!important}
      #root .qmes-iqc-v3 .qmes-iqc-v3-judge{display:flex;flex-direction:column;gap:4px}
      #root .qmes-iqc-v3 .qmes-iqc-v3-judge span{font-size:10px;color:#64748b}
      #root .qmes-iqc-v3 .qmes-iqc-v3-judge select{height:36px;border:1px solid #334b65;border-radius:6px;background:#12263c;color:#e2e8f0;padding:0 9px;font-size:12px}
      #root .qmes-iqc-v3 .qmes-iqc-ledger-container{overflow-x:auto!important}
      #root .qmes-iqc-v3 .qmes-iqc-ledger-table{min-width:1280px!important;table-layout:fixed!important}
      #root .qmes-iqc-v3 .qmes-iqc-ledger-table th{background:#142b42!important;color:#9bb4c8!important;padding:10px 8px!important;font-size:10px!important;white-space:nowrap!important}
      #root .qmes-iqc-v3 .qmes-iqc-ledger-table td{padding:11px 8px!important;border-bottom:1px solid #173149!important;font-size:11px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #root .qmes-iqc-v3 .qmes-iqc-ledger-table tbody tr:hover td{background:#10263c!important}
      #root .qmes-iqc-v3 .qmes-iqc-v3-inno{width:150px!important}
      #root .qmes-iqc-v3 .qmes-iqc-v3-qty{width:95px!important;text-align:right!important}
      #root .qmes-iqc-v3 .qmes-iqc-manage-inline{justify-content:flex-end!important;gap:4px!important}
      #root .qmes-iqc-v3 .qmes-iqc-chart-only{display:grid!important;grid-template-columns:minmax(0,1.55fr) minmax(315px,.65fr)!important;gap:12px!important;align-items:stretch!important}
      #root .qmes-iqc-v3 .qmes-iqc-rank-panel{min-width:0!important}
      #root .qmes-iqc-v3 .qmes-iqc-donut-list{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important}
      #root .qmes-iqc-v3 .qmes-iqc-donut-card{min-height:135px!important;padding:10px 7px!important}
      #root .qmes-iqc-v3 .qmes-iqc-donut-ring{width:66px!important;height:66px!important}
      #root .qmes-iqc-v3 .qmes-iqc-donut-center{width:49px!important;height:49px!important}
      #root .qmes-iqc-v3-trend{margin-top:13px;padding-top:12px;border-top:1px solid #1d3850}
      #root .qmes-iqc-v3-trend-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
      #root .qmes-iqc-v3-trend-head strong{font-size:12px;color:#e2e8f0}.qmes-iqc-v3-trend-head span{font-size:9px;color:#7290a8}
      #root .qmes-iqc-v3-trend-chart{height:105px;display:flex;align-items:flex-end;gap:16px;padding:7px 12px 0;border-left:1px solid #29445b;border-bottom:1px solid #29445b}
      #root .qmes-iqc-v3-trend-item{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}.qmes-iqc-v3-trend-item b{font-size:9px;color:#69e6bd}.qmes-iqc-v3-trend-item span{font-size:9px;color:#7896ae;margin-bottom:4px}.qmes-iqc-v3-trend-bar{width:min(28px,60%);min-height:4px;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#25bce8,#0d82ab)}
      #root .qmes-iqc-v3-action{border:1px solid #203d58;border-radius:9px;background:#0c2034;padding:14px 15px;min-width:0}.qmes-iqc-v3-action h3{margin:0 0 8px;font-size:13px;color:#f1f5f9}.qmes-iqc-v3-action-row{display:flex;justify-content:space-between;align-items:center;min-height:42px;border-bottom:1px solid #173149;font-size:11px;color:#a0b5c7}.qmes-iqc-v3-action-row strong{font-size:13px;color:#f8fafc}.qmes-iqc-v3-action-row.bad strong{color:#fda4af}.qmes-iqc-v3-action-row.good strong{color:#6ee7b7}.qmes-iqc-v3-action-note{margin-top:10px;color:#718fa7;font-size:9px;line-height:1.6}
      @media(max-width:1180px){#root .qmes-iqc-v3 .qmes-iqc-record-filter{grid-template-columns:minmax(260px,1fr) 110px 110px!important}#root .qmes-iqc-v3 .qmes-iqc-chart-only{grid-template-columns:1fr!important}#root .qmes-iqc-v3 .qmes-iqc-donut-list{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
      @media(max-width:800px){#root .qmes-iqc-v3 .qmes-iqc-v3-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}#root .qmes-iqc-v3 .qmes-iqc-record-filter{grid-template-columns:1fr 1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function findRoot(){
    const kicker = Array.from(document.querySelectorAll('.qmes-iqc-quickbar-kicker')).find(el => text(el) === 'INCOMING QUALITY CONTROL');
    if (!kicker) return null;
    return kicker.closest('.flex.flex-col.gap-4');
  }

  function monthKey(date){return String(date || '').slice(0,7)}
  function currentMonth(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}

  function enhanceKpis(root){
    const summary = root && root.firstElementChild;
    if (!summary || summary === root.querySelector('.qmes-iqc-quickbar')) return;
    summary.classList.add('qmes-iqc-v3-kpis');
    const cards = Array.from(summary.children || []);
    if (cards.length < 5) return;
    const monthly = rows().filter(r => monthKey(r.recv) === currentMonth() && r.judge !== '검사중');
    const rate = monthly.length ? monthly.filter(r => r.judge === '합격').length / monthly.length * 100 : 0;
    let donut = cards[2].querySelector('.qmes-iqc-v3-donut');
    if (!donut){donut=document.createElement('div');donut.className='qmes-iqc-v3-donut';donut.innerHTML='<b></b>';cards[2].appendChild(donut)}
    donut.style.setProperty('--rate',Math.max(0,Math.min(100,rate))+'%');
    donut.querySelector('b').textContent = monthly.length ? rate.toFixed(1)+'%' : '—';
  }

  function enhanceFilter(root){
    const filter = root && root.querySelector('.qmes-iqc-record-filter');
    if (!filter) return;
    const label = filter.querySelector('.w-72 > span');
    if (label) label.textContent = '입고번호 / LOT / 원재료명 / 업체명 / 검사자 검색';
    if (filter.querySelector('.qmes-iqc-v3-judge')) return;
    const reset = Array.from(filter.querySelectorAll('button')).find(b => text(b).includes('초기화'));
    if (!reset) return;
    const wrap = document.createElement('label');
    wrap.className = 'qmes-iqc-v3-judge';
    wrap.innerHTML = '<span>판정</span><select><option value="전체">전체 판정</option><option value="합격">합격</option><option value="불합격">불합격</option></select>';
    filter.insertBefore(wrap, reset);
    wrap.querySelector('select').addEventListener('change', function(){
      const value=this.value;
      const table=root.querySelector('.qmes-iqc-ledger-table');
      if (!table || !table.tBodies[0]) return;
      Array.from(table.tBodies[0].rows).forEach(tr => {
        if (tr.querySelector('.qmes-iqc-empty-row')) return;
        const judge=Array.from(tr.cells).map(text).find(v=>v==='합격'||v==='불합격')||'';
        tr.style.display = value==='전체'||judge===value ? '' : 'none';
      });
    });
  }

  function matchRecord(originalCells){
    const recv = text(originalCells[0]);
    const name = text(originalCells[1]);
    const supplier = text(originalCells[2]);
    const lot = text(originalCells[3]);
    return rows().find(r => String(r.recv||'').slice(0,10)===recv && String(r.name||'')===name && String(r.supplier||'')===supplier && String(r.lot||'')===lot)
      || rows().find(r => String(r.recv||'').slice(0,10)===recv && String(r.lot||'')===lot)
      || null;
  }

  function enhanceTable(root){
    const table = root && root.querySelector('.qmes-iqc-ledger-table');
    if (!table || !table.tHead || !table.tBodies[0]) return;
    const head = table.tHead.rows[0];
    if (Array.from(head.cells).some(th => text(th)==='입고번호')) return;
    const originalHeaders = Array.from(head.cells);
    const hIn=document.createElement('th');hIn.textContent='입고번호';hIn.className='qmes-iqc-v3-inno';head.insertBefore(hIn,originalHeaders[1]);
    const hQty=document.createElement('th');hQty.textContent='입고수량';hQty.className='qmes-iqc-v3-qty';head.insertBefore(hQty,head.cells[5]);
    const hInspect=document.createElement('th');hInspect.textContent='검사수량';hInspect.className='qmes-iqc-v3-qty';head.insertBefore(hInspect,head.cells[6]);
    Array.from(table.tBodies[0].rows).forEach(tr => {
      if (tr.querySelector('.qmes-iqc-empty-row')){tr.cells[0].colSpan=10;return}
      if (tr.dataset.iqcV3==='1') return;
      const originals = Array.from(tr.cells);
      const rec = matchRecord(originals);
      const cIn=document.createElement('td');cIn.className='qmes-iqc-v3-inno';cIn.textContent=rec&&rec.inNo||'-';tr.insertBefore(cIn,tr.cells[1]);
      const cQty=document.createElement('td');cQty.className='qmes-iqc-v3-qty';cQty.textContent=rec&&rec.qty||'-';tr.insertBefore(cQty,tr.cells[5]);
      const cInspect=document.createElement('td');cInspect.className='qmes-iqc-v3-qty';cInspect.textContent=rec&&rec.inspectQty||'-';tr.insertBefore(cInspect,tr.cells[6]);
      tr.dataset.iqcV3='1';
    });
  }

  function monthStats(){
    const map={};
    rows().forEach(r=>{const k=monthKey(r.recv);if(!/^\d{4}-\d{2}$/.test(k))return;if(!map[k])map[k]={total:0,pass:0};if(r.judge!=='검사중'){map[k].total++;if(r.judge==='합격')map[k].pass++}});
    return Object.keys(map).sort().slice(-6).map(k=>({label:Number(k.slice(5))+'월',rate:map[k].total?map[k].pass/map[k].total*100:0}));
  }

  function enhanceBottom(root){
    const chart=root&&root.querySelector('.qmes-iqc-chart-only');
    if(!chart) return;
    const rank=chart.querySelector('.qmes-iqc-rank-panel');
    if(rank&&!rank.querySelector('.qmes-iqc-v3-trend')){
      const stats=monthStats();
      const trend=document.createElement('div');trend.className='qmes-iqc-v3-trend';
      trend.innerHTML='<div class="qmes-iqc-v3-trend-head"><strong>월별 IQC 합격률 추이</strong><span>최근 6개월</span></div><div class="qmes-iqc-v3-trend-chart">'+(stats.length?stats.map(x=>'<div class="qmes-iqc-v3-trend-item"><b>'+x.rate.toFixed(1)+'%</b><div class="qmes-iqc-v3-trend-bar" style="height:'+Math.max(4,x.rate)+'%"></div><span>'+x.label+'</span></div>').join(''):'<div style="align-self:center;width:100%;text-align:center;color:#7896ae;font-size:10px">추이 데이터가 없습니다.</div>')+'</div>';
      rank.appendChild(trend);
    }
    if(!chart.querySelector('.qmes-iqc-v3-action')){
      const monthly=rows().filter(r=>monthKey(r.recv)===currentMonth());
      const done=monthly.filter(r=>r.judge!=='검사중').length;
      const fail=monthly.filter(r=>r.judge==='불합격').length;
      const pass=monthly.filter(r=>r.judge==='합격').length;
      const panel=document.createElement('div');panel.className='qmes-iqc-v3-action';
      panel.innerHTML='<h3>IQC 조치 현황</h3><div class="qmes-iqc-v3-action-row"><span>검사 대기</span><strong>'+Math.max(0,monthly.length-done)+'건</strong></div><div class="qmes-iqc-v3-action-row bad"><span>부적합 / 격리</span><strong>'+fail+'건</strong></div><div class="qmes-iqc-v3-action-row"><span>NCR 처리중</span><strong>'+fail+'건</strong></div><div class="qmes-iqc-v3-action-row"><span>업체 회신 대기</span><strong>0건</strong></div><div class="qmes-iqc-v3-action-row"><span>금월 검사 완료</span><strong>'+done+'건</strong></div><div class="qmes-iqc-v3-action-row good"><span>금월 합격</span><strong>'+pass+'건</strong></div><div class="qmes-iqc-v3-action-note">표시 전용 요약입니다. 검사 원본 데이터는 수정하지 않습니다.</div>';
      chart.appendChild(panel);
    }
  }

  function apply(){
    ensureStyle();
    const root=findRoot();
    if(!root)return;
    root.classList.add('qmes-iqc-v3');
    enhanceKpis(root);
    enhanceFilter(root);
    enhanceTable(root);
    enhanceBottom(root);
  }
  let pending=false;
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('qmes:data-updated',schedule);
  window.addEventListener('qmes:data-changed',schedule);
})();
