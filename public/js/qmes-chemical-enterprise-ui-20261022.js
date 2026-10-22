/* NAMO QMES chemical enterprise UI - 2026-10-22
 * SPC/Trend, change control, instruments and calibration.
 * MSA intentionally excluded.
 */
(function(){
  'use strict';
  if(window.__NAMO_CHEM_ENTERPRISE_UI_20261022__) return;
  window.__NAMO_CHEM_ENTERPRISE_UI_20261022__=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:3}):'-';};
  const api=async(url,opt={})=>{
    const r=await fetch(url,{credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...(opt.headers||{})},...opt});
    const p=await r.json().catch(()=>({success:false,message:'서버 응답 오류'}));
    if(!r.ok||p.success===false) throw new Error(p.message||'요청 실패');
    return p.data;
  };
  const toast=msg=>typeof window.toast==='function'?window.toast(msg):alert(msg);

  const style=document.createElement('style');
  style.id='qmes-chemical-enterprise-ui-20261022';
  style.textContent=`
    .qce-page{font-family:Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif;color:#29445f}
    .qce-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px}
    .qce-head h1{margin:0 0 4px;font-size:22px;color:#203b57}.qce-head p{margin:0;color:#718297;font-size:12px}
    .qce-shell{background:#fff;border:1px solid #d8e2ec}
    .qce-toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 13px;background:#f3f7fb;border-bottom:1px solid #d8e2ec}
    .qce-toolbar .left,.qce-toolbar .right{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
    .qce-input,.qce-select{height:30px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;padding:0 9px;font-size:11px;color:#29445f}
    .qce-btn{height:30px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#294763;font-size:11px;font-weight:750;padding:0 11px;cursor:pointer}
    .qce-btn.primary{background:#2f73d9;color:#fff;border-color:#2f73d9}
    .qce-table{width:100%;border-collapse:collapse;table-layout:fixed}.qce-table th{height:38px;background:#e8f0f8;color:#244260;font-size:10.5px;border-bottom:1px solid #cbd8e5}
    .qce-table td{height:43px;padding:6px 8px;text-align:center;font-size:11px;color:#365574;border-bottom:1px solid #edf2f7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .qce-link{border:0;background:none;color:#1673c7;text-decoration:underline;font-weight:700;cursor:pointer}
    .qce-badge{display:inline-block;padding:3px 8px;border-radius:12px;background:#eef3f7;color:#61748a;font-weight:700}.qce-badge.ok{background:#e9f7ef;color:#268158}.qce-badge.warn{background:#fff4df;color:#9b6a12}.qce-badge.bad{background:#fdecec;color:#b42318}
    .qce-kpis{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px;padding:13px}
    .qce-kpi{border:1px solid #dbe4ed;background:#fff;padding:13px}.qce-kpi b{display:block;font-size:11px;color:#728398;margin-bottom:7px}.qce-kpi strong{font-size:22px;color:#244260}
    .qce-chart{padding:13px;border-top:1px solid #e2e8ef}.qce-chart h3{font-size:13px;margin:0 0 10px}.qce-chart-wrap{height:260px;border:1px solid #e1e7ee;background:#fbfdff;padding:12px;overflow:hidden}
    .qce-svg{width:100%;height:100%}.qce-svg text{font-size:9px;fill:#6b7e92}
    #spcTrend .iqc-work-frame{padding:0!important}
    #spcTrend .iqc-work-frame .ip-panel{border:1px solid #d2dfed!important;border-radius:10px!important;box-shadow:0 8px 24px rgba(24,51,83,.075)!important;overflow:hidden!important;background:#fff!important}
    #spcTrend .iqc-register-header{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;min-height:64px!important;padding:14px 22px!important;border-bottom:1px solid #dbe5ef!important;background:#fff!important}
    #spcTrend .iqc-register-header strong{display:flex!important;align-items:center!important;gap:10px!important;color:#173b61!important;font-size:18px!important;font-weight:800!important;letter-spacing:-.4px!important}
    #spcTrend .iqc-register-header strong:before{content:'';width:3px;height:24px;background:#166fbb;border-radius:2px}
    #spcTrend .iqc-header-tools{display:flex!important;gap:6px!important;margin-left:auto!important}
    #spcTrend .iqc-register-header .btn,#spcTrend .iqc-work-frame .iqc-query-actions .ip-actions .btn{height:38px!important;padding:8px 15px!important;border-radius:7px!important;font-size:12.5px!important;font-weight:700!important;line-height:20px!important}
    #spcTrend .iqc-work-frame .primary{background:#166fbb!important;color:#fff!important;border-color:#166fbb!important;box-shadow:0 2px 7px rgba(22,111,187,.16)!important}
    #spcTrend .iqc-work-frame .ip-toolbar{display:block!important;padding:20px 22px 18px!important;background:#f3f7fb!important;border-bottom:1px solid #dae5ef!important}
    #spcTrend .iqc-work-frame .ip-filter-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:15px 20px!important;width:100%!important}
    #spcTrend .iqc-work-frame .ip-filter{display:flex!important;flex-direction:row!important;align-items:center!important;gap:8px!important;min-width:0!important}
    #spcTrend .iqc-work-frame .ip-filter>span{flex:0 0 78px!important;min-width:78px!important;text-align:right!important;color:#334e6b!important;font-size:12.5px!important;font-weight:700!important;white-space:nowrap!important}
    #spcTrend .iqc-work-frame .ip-filter .input{height:38px!important;min-width:0!important;width:100%!important;padding:0 11px!important;font-size:13px!important;color:#243e5d!important;border:1px solid #c7d6e5!important;border-radius:7px!important;background:#fff!important;font-weight:400!important;box-sizing:border-box!important}
    #spcTrend .iqc-date-range{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important;flex:1!important;height:38px!important;border:1px solid #c7d6e5!important;border-radius:7px!important;background:#fff!important}
    #spcTrend .iqc-work-frame .iqc-date-range .input{flex:1!important;border:0!important;height:36px!important;background:transparent!important;padding:0 6px!important;min-width:0!important}
    #spcTrend .iqc-query-actions{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-top:14px!important;width:100%!important}
    #spcTrend .iqc-query-count{color:#526a83!important;font-size:12.5px!important;font-weight:700!important}
    #spcTrend .iqc-work-frame .ip-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex-wrap:wrap!important;margin-left:auto!important}
    #spcTrend .iqc-list-head{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:17px 22px 14px!important;color:#1e3f64!important;font-size:13.5px!important;font-weight:800!important}
    #spcTrend .iqc-work-frame .ip-table-wrap{margin:20px 16px 16px!important;border:1px solid #d5dce5!important;overflow:auto!important}
    #spcTrend .iqc-work-frame .ip-table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important}
    #spcTrend .iqc-work-frame .ip-table th{height:38px!important;background:#e8f0f8!important;color:#244260!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;font-size:10.5px!important;text-align:center!important}
    #spcTrend .iqc-work-frame .ip-table td{height:36px!important;padding:6px 8px!important;line-height:1.2!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;text-align:center!important;font-size:11px!important}
    #spcTrend .iqc-work-frame .ip-footnote{display:flex!important;align-items:center!important;justify-content:center!important;padding:10px 16px 20px!important;background:#fff!important;border:0!important;position:relative!important}
    #spcTrend .iqc-work-frame .ip-count{position:absolute!important;right:16px!important;color:#8090a1!important;font-size:10px!important}

    /* 2026-10-22: SPC visual alignment with PQC inquiry screen. */
    #spcTrend .iqc-register-header{min-height:58px!important;padding:11px 18px!important}
    #spcTrend .iqc-register-header strong{font-size:17px!important}
    #spcTrend .iqc-register-header .btn{height:36px!important;padding:7px 14px!important;font-size:12px!important}
    #spcTrend .iqc-work-frame .ip-toolbar{padding:14px 18px!important;background:#f3f7fb!important}
    #spcTrend .iqc-work-frame .ip-filter-row{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px 18px!important}
    #spcTrend .iqc-work-frame .ip-filter{gap:7px!important}
    #spcTrend .iqc-work-frame .ip-filter>span{flex:0 0 62px!important;min-width:62px!important;font-size:12px!important}
    #spcTrend .iqc-work-frame .ip-filter .input{height:34px!important;border-radius:6px!important;font-size:12.5px!important;padding:0 10px!important}
    #spcTrend .iqc-work-frame>.ip-panel>.ip-table-wrap{margin:14px 12px 10px!important;border:1px solid #d5dce5!important}
    #spcTrend .spc-overview-table th{height:36px!important;background:#e8f0f8!important;font-size:10.5px!important;font-weight:800!important}
    #spcTrend .spc-overview-table td{height:38px!important;padding:5px 7px!important;font-size:10.8px!important}
    #spcTrend .iqc-work-frame .ip-footnote{padding:8px 12px 14px!important}
    #spcTrend .spc-page-btn{min-width:29px!important;height:29px!important;border-radius:5px!important}
    #spcTrend .spc-toolbar{display:block;padding:15px 16px}
    #spcTrend .spc-iqc-filter-row{grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:center!important}
    #spcTrend .spc-iqc-period{min-width:0!important}
    #spcTrend .spc-iqc-period .iqc-date-range{width:100%}
    #spcTrend .spc-iqc-period .iqc-date-range .input{min-width:0}
    #spcTrend .iqc-register-header{min-height:64px}
    #spcTrend .ip-toolbar{padding-top:14px}
    #spcTrend .ip-table-wrap{margin-bottom:0}
    #spcTrend .spc-pagination{display:flex;align-items:center;justify-content:center;gap:5px;flex:1}
    #spcTrend .spc-page-btn{min-width:30px;height:30px;border:1px solid #d5e0ea;border-radius:6px;background:#fff;color:#536a81;font-size:11px;font-weight:800;cursor:pointer}
    #spcTrend .spc-page-btn.active{background:#2f73d9;border-color:#2f73d9;color:#fff}
    #spcTrend .spc-page-btn:disabled{opacity:.4;cursor:default}
    #spcTrend .spc-query-toggle{min-width:36px;padding:0;font-size:14px}
    #spcTrend .spc-collapsed{padding-bottom:10px}
    #spcTrend .spc-detail-wrap{margin:0 15px 15px}
    @media(max-width:1100px){#spcTrend .spc-iqc-filter-row{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    @media(max-width:720px){#spcTrend .spc-iqc-filter-row{grid-template-columns:1fr!important}#spcTrend .spc-iqc-period{min-width:0}}
    #spcTrend .spc-filter-grid{display:grid;grid-template-columns:1.55fr 1fr 1fr 1fr;gap:12px;align-items:end}
    #spcTrend .spc-filter-grid label{display:flex;align-items:center;gap:7px;min-width:0;font-size:11px;font-weight:800;color:#415b75}
    #spcTrend .spc-filter-grid label>span{white-space:nowrap}
    #spcTrend .spc-filter-grid .qce-input,#spcTrend .spc-filter-grid .qce-select{height:36px;min-width:0;width:100%;font-size:12px;border-radius:6px}
    #spcTrend .spc-date-range{display:grid;grid-template-columns:1fr auto 1fr;gap:5px;align-items:center;flex:1}
    #spcTrend .spc-date-range b{font-weight:600;color:#8796a8}
    #spcTrend .spc-toolbar-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:12px}
    #spcTrend .spc-toolbar-actions .qce-btn{height:34px;border-radius:6px}
    #spcTrend .spc-section-head{display:flex;align-items:center;justify-content:space-between;padding:15px 17px 11px;border-top:1px solid #e1e8ef;color:#738398;font-size:11px}
    #spcTrend .spc-premium-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:900;color:#244260}
    #spcTrend .spc-premium-title:before{content:'';width:4px;height:18px;border-radius:3px;background:#2878bd}
    #spcTrend .spc-overview-table th{height:40px}
    #spcTrend .spc-overview-table td{height:46px}
    #spcTrend .spc-product-link{border:0;background:transparent;color:#126fc0;text-decoration:underline;text-underline-offset:2px;font:inherit;font-weight:850;cursor:pointer;padding:0}
    #spcTrend .spc-product-link:hover{color:#0b5594}
    #spcTrend .spc-row-selected td{background:#eef6ff!important}
    #spcTrend .spc-judge{display:inline-flex;align-items:center;justify-content:center;min-width:66px;height:27px;padding:0 11px;border-radius:999px;font-size:10.5px;font-weight:900;border:1px solid transparent}
    #spcTrend .spc-judge.ok{background:#e9f7ef;color:#1f8157;border-color:#c3e7d2}
    #spcTrend .spc-judge.bad{background:#fff0ee;color:#bd3e34;border-color:#f0c8c3}
    #spcTrend .spc-judge.wait{background:#f2f5f8;color:#718094;border-color:#dbe3ea}
    #spcTrend .spc-trend-card{margin:15px;border:1px solid #d9e4ee;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 8px 22px rgba(33,62,91,.05)}
    #spcTrend .spc-premium-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 17px 12px;border-bottom:1px solid #e6edf3}
    #spcTrend .spc-subline{margin-top:5px;font-size:10.5px;color:#7d8ea1}
    #spcTrend .spc-latest{display:flex;align-items:center;gap:9px;font-size:10.5px;color:#708296;font-weight:800}
    #spcTrend .spc-kpis{grid-template-columns:repeat(4,minmax(150px,1fr));padding:14px 16px}
    #spcTrend .spc-kpi small,#spcTrend .qce-kpi small{display:block;margin-top:5px;color:#8a98a8;font-size:9.5px;font-weight:600}
    #spcTrend .spc-chart-legend{display:flex;justify-content:flex-end;gap:13px;margin-bottom:8px;color:#75869a;font-size:9.5px}
    #spcTrend .spc-chart-legend span{display:inline-flex;align-items:center;gap:5px}
    #spcTrend .spc-chart-legend i{width:8px;height:8px;border-radius:50%;display:inline-block}
    #spcTrend .spc-chart-legend i.ok{background:#2a9b69}#spcTrend .spc-chart-legend i.bad{background:#d84c43}
    #spcTrend .spc-detail-title{padding:13px 16px 9px;border-top:1px solid #e6edf3;font-size:11px;font-weight:900;color:#405b77}
    #spcTrend .spc-trend-placeholder{margin:15px;padding:54px 20px;border:1px dashed #cbd9e6;border-radius:8px;background:#fbfdff;text-align:center;color:#7b8da1}
    #spcTrend .spc-placeholder-icon{font-size:28px;color:#3d80bd;margin-bottom:8px}#spcTrend .spc-trend-placeholder b{display:block;color:#365675;font-size:13px;margin-bottom:6px}#spcTrend .spc-trend-placeholder span{font-size:11px}
    @media(max-width:1180px){#spcTrend .spc-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:720px){#spcTrend .spc-filter-grid{grid-template-columns:1fr}#spcTrend .spc-premium-head{align-items:flex-start;flex-direction:column}}
    .qce-empty{padding:55px 20px;text-align:center;color:#8a98a8;font-size:12px}
    .qce-modal-bg{position:fixed;inset:0;z-index:32000;background:rgba(17,34,52,.35);display:flex;align-items:center;justify-content:center;padding:28px}
    .qce-modal{width:min(900px,96vw);max-height:90vh;overflow:auto;background:#fff;border:1px solid #cbd8e5;border-radius:6px;box-shadow:0 18px 55px rgba(15,31,48,.24)}
    .qce-modal h3{margin:0;padding:13px 15px;background:#e8f0f8;border-bottom:1px solid #cbd8e5;font-size:14px}
    .qce-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:12px}.qce-field{display:grid;grid-template-columns:110px minmax(0,1fr);min-height:42px;border:1px solid #e0e6ec;margin:-1px 0 0 -1px}
    .qce-field.full{grid-column:1/-1}.qce-field label{display:flex;align-items:center;justify-content:flex-end;padding:0 9px;background:#f6f8fa;border-right:1px solid #e0e6ec;font-size:10px;font-weight:800;color:#526579}
    .qce-field input,.qce-field select,.qce-field textarea{margin:5px 7px;border:1px solid #cfd7df;border-radius:2px;padding:5px 7px;font-size:11px;min-width:0}.qce-field textarea{min-height:70px}
    .qce-modal-foot{display:flex;justify-content:flex-end;gap:6px;padding:11px 14px;border-top:1px solid #dde5ec}
    @media(max-width:900px){.qce-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.qce-form{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function head(title,desc){return '<div class="qce-head"><div><h1>'+esc(title)+'</h1><p>'+esc(desc)+'</p></div><div class="date-badge">QMES</div></div>';}
  function modal(title,body,onSave){
    const bg=document.createElement('div');bg.className='qce-modal-bg';
    bg.innerHTML='<div class="qce-modal"><h3>'+esc(title)+'</h3><div>'+body+'</div><div class="qce-modal-foot"><button class="qce-btn" data-close>취소</button><button class="qce-btn primary" data-save>저장</button></div></div>';
    document.body.appendChild(bg);
    bg.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>bg.remove());
    bg.onclick=e=>{if(e.target===bg)bg.remove();};
    bg.querySelector('[data-save]').onclick=async()=>{try{await onSave(bg);bg.remove();}catch(e){toast(e.message);}};
  }
  const val=(root,key)=>root.querySelector('[data-k="'+key+'"]')?.value.trim()||'';

  async function syncRows(kind){
    const data=await api('/api/qmes-sync/'+kind+'?_qmesFresh='+Date.now());
    const out=[];
    (Array.isArray(data)?data:[]).forEach(record=>{
      let payload=record.payload||{};
      if(typeof payload==='string'){try{payload=JSON.parse(payload);}catch(_){payload={};}}
      if(payload.deleted)return;
      (Array.isArray(payload.rows)?payload.rows:[]).forEach(row=>out.push(row));
    });
    return out;
  }

  function flattenMeasurements(rows,source){
    const out=[];
    for(const row of rows){
      const date=String(row.date||row.inspectionDate||row.detailFields?.['검사일자']||'').slice(0,10);
      const lot=String(row.lot||row.finishedLot||row.productionLot||row.detailFields?.['완제품 LOT']||'');
      const product=String(row.product||row.productName||row.detailFields?.['제품명']||'');
      const customer=String(row.customer||row.customerName||row.detailFields?.['고객사']||'');
      const raw=row.measurements;
      let entries=[];
      if(Array.isArray(raw)){
        const item=String(row.check||row.item||row.inspectionItem||'').trim();
        if(item)entries=[[item,raw]];
      }else if(raw&&typeof raw==='object'){
        entries=Object.entries(raw);
      }else if(row.check&&row.value!=null){
        entries=[[String(row.check),String(row.value).split(/\s*\/\s*/)]];
      }
      for(const [item,values] of entries){
        if(!Array.isArray(values))continue;
        values.forEach((v,idx)=>{
          const n=Number(v);
          if(Number.isFinite(n))out.push({source,date,lot,product,customer,item,value:n,seq:idx+1});
        });
      }
    }
    return out;
  }

  function specFor(item){
    if(item==='입도(Dmax)'||item==='입도')return {lsl:null,usl:10};
    if(item==='점도')return {lsl:1200,usl:1800};
    if(item==='고형분')return {lsl:19,usl:21};
    if(item==='수분율'||item==='수분')return {lsl:null,usl:2000};
    if(item==='접착력')return {lsl:400,usl:null};
    return {lsl:null,usl:null};
  }
  function stats(values,item){
    const nums=values.map(x=>x.value).filter(Number.isFinite);
    if(!nums.length)return {n:0,avg:null,min:null,max:null,cp:null,cpk:null};
    const avg=nums.reduce((a,b)=>a+b,0)/nums.length;
    const variance=nums.length>1?nums.reduce((s,n)=>s+Math.pow(n-avg,2),0)/(nums.length-1):0;
    const sd=Math.sqrt(variance);const {lsl,usl}=specFor(item);
    let cp=null,cpk=null;
    if(sd>0&&lsl!=null&&usl!=null){cp=(usl-lsl)/(6*sd);cpk=Math.min((usl-avg)/(3*sd),(avg-lsl)/(3*sd));}
    return {n:nums.length,avg,min:Math.min(...nums),max:Math.max(...nums),cp,cpk};
  }
  function spcValueJudge(value,item){
    const n=Number(value);
    if(!Number.isFinite(n))return '대기';
    if(item==='입도(Dmax)'||item==='입도')return n<10?'합격':'불합격';
    if(item==='점도')return n>=1200&&n<=1800?'합격':'불합격';
    if(item==='고형분')return n>=19&&n<=21?'합격':'불합격';
    if(item==='수분율'||item==='수분')return n<2000?'합격':'불합격';
    if(item==='접착력')return n>=400?'합격':'불합격';
    return '대기';
  }
  function spcSpecText(item){
    if(item==='입도(Dmax)'||item==='입도')return '< 10 μm';
    if(item==='점도')return '1,200 ~ 1,800 cP';
    if(item==='고형분')return '19.0 ~ 21.0 wt%';
    if(item==='수분율'||item==='수분')return '< 2,000 ppm';
    if(item==='접착력')return '≥ 400 gf/12.7mm';
    return '-';
  }
  function spcOverviewRows(values,item){
    const map=new Map();
    for(const row of values){
      const key=[row.date||'',row.customer||'',row.product||''].join('|');
      if(!map.has(key))map.set(key,{date:row.date||'',customer:row.customer||'',product:row.product||'',lots:new Set(),values:[]});
      const g=map.get(key);
      if(row.lot)g.lots.add(row.lot);
      if(Number.isFinite(Number(row.value)))g.values.push(Number(row.value));
    }
    return [...map.values()].map(g=>{
      const avg=g.values.length?g.values.reduce((a,b)=>a+b,0)/g.values.length:null;
      const judges=g.values.map(v=>spcValueJudge(v,item));
      const judge=judges.includes('불합격')?'불합격':judges.length&&judges.every(v=>v==='합격')?'합격':'대기';
      return {...g,lot:[...g.lots].join(', '),value:avg,count:g.values.length,judge};
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.product).localeCompare(String(b.product)));
  }
  function spcDailyTrend(values,item){
    const map=new Map();
    for(const row of values){
      const key=String(row.date||'');
      if(!key)continue;
      if(!map.has(key))map.set(key,{date:key,lots:new Set(),values:[]});
      const g=map.get(key);
      if(row.lot)g.lots.add(row.lot);
      if(Number.isFinite(Number(row.value)))g.values.push(Number(row.value));
    }
    return [...map.values()].map(g=>{
      const avg=g.values.length?g.values.reduce((a,b)=>a+b,0)/g.values.length:null;
      const judges=g.values.map(v=>spcValueJudge(v,item));
      const judge=judges.includes('불합격')?'불합격':judges.length&&judges.every(v=>v==='합격')?'합격':'대기';
      return {date:g.date,lot:[...g.lots].join(', '),value:avg,count:g.values.length,judge};
    }).filter(x=>Number.isFinite(x.value)).sort((a,b)=>a.date.localeCompare(b.date));
  }
  function trendSvg(values,item){
    const data=values.slice(-60);if(!data.length)return '<div class="qce-empty">제품명을 클릭하면 날짜별 Trend가 표시됩니다.</div>';
    const w=1000,h=250,p=46,nums=data.map(x=>x.value),spec=specFor(item);
    let min=Math.min(...nums),max=Math.max(...nums);
    if(spec.lsl!=null)min=Math.min(min,spec.lsl);if(spec.usl!=null)max=Math.max(max,spec.usl);
    const span=Math.max(1,max-min);min-=span*.08;max+=span*.08;
    const x=i=>p+(i*(w-p*2)/Math.max(1,data.length-1));
    const y=v=>h-p-((v-min)/(max-min))*(h-p*2);
    const pts=data.map((d,i)=>x(i)+','+y(d.value)).join(' ');
    const lines=[];
    if(spec.usl!=null)lines.push('<line x1="'+p+'" y1="'+y(spec.usl)+'" x2="'+(w-p)+'" y2="'+y(spec.usl)+'" stroke="#d6655a" stroke-dasharray="7 5" opacity=".82"/><text x="'+(w-p-70)+'" y="'+(y(spec.usl)-7)+'">USL '+spec.usl+'</text>');
    if(spec.lsl!=null)lines.push('<line x1="'+p+'" y1="'+y(spec.lsl)+'" x2="'+(w-p)+'" y2="'+y(spec.lsl)+'" stroke="#d6655a" stroke-dasharray="7 5" opacity=".82"/><text x="'+(w-p-70)+'" y="'+(y(spec.lsl)-7)+'">LSL '+spec.lsl+'</text>');
    const dots=data.map((d,i)=>'<circle cx="'+x(i)+'" cy="'+y(d.value)+'" r="5" fill="'+(d.judge==='불합격'?'#d84c43':'#2a9b69')+'" stroke="#fff" stroke-width="2"><title>'+esc((d.date||'')+' · '+fmt(d.value)+' · '+d.judge)+'</title></circle>').join('');
    const every=Math.max(1,Math.ceil(data.length/8));
    const labels=data.map((d,i)=>i%every===0||i===data.length-1?'<text x="'+x(i)+'" y="'+(h-12)+'" text-anchor="middle">'+esc(String(d.date||'').slice(5))+'</text>':'').join('');
    return '<svg class="qce-svg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><line x1="'+p+'" y1="'+p+'" x2="'+p+'" y2="'+(h-p)+'" stroke="#cfd8e3"/><line x1="'+p+'" y1="'+(h-p)+'" x2="'+(w-p)+'" y2="'+(h-p)+'" stroke="#cfd8e3"/>'+lines.join('')+'<polyline points="'+pts+'" fill="none" stroke="#377cb9" stroke-width="2.4"/>'+dots+labels+'</svg>';
  }

  async function renderSpc(){
    const root=document.getElementById('spcTrend');if(!root)return;
    root.innerHTML='<div class="inspection-premium iqc-work-frame"><div class="ip-panel"><div class="qce-empty">출하검사 데이터를 불러오는 중입니다.</div></div></div>';
    try{
      const oqc=await syncRows('oqc');
      const all=flattenMeasurements(oqc,'OQC');
      const allowed=['입도(Dmax)','입도','점도','고형분','수분율','수분','접착력'];
      const items=[...new Set(all.map(x=>x.item))].filter(x=>allowed.includes(x));
      const selected=items.includes(root.dataset.spcItem)?root.dataset.spcItem:(items.includes('수분')?'수분':items.includes('점도')?'점도':items[0]||'점도');
      root.dataset.spcItem=selected;

      const startDate=root.dataset.spcStart||'';
      const endDate=root.dataset.spcEnd||'';
      const customerFilter=root.dataset.spcCustomer||'';
      const productFilter=root.dataset.spcFilterProduct||'';
      const collapsed=root.dataset.spcCollapsed==='1';
      const base=all.filter(x=>x.item===selected)
        .filter(x=>!customerFilter||String(x.customer||'').toLowerCase().includes(customerFilter.toLowerCase()))
        .filter(x=>!productFilter||String(x.product||'').toLowerCase().includes(productFilter.toLowerCase()));

      const overview=spcOverviewRows(base,selected);
      const customers=[...new Set(all.map(x=>x.customer).filter(Boolean))].sort();
      const pageSize=10;
      const totalPages=Math.max(1,Math.ceil(overview.length/pageSize));
      let page=Math.max(1,Math.min(totalPages,Number(root.dataset.spcPage)||1));
      root.dataset.spcPage=String(page);
      const pageRows=overview.slice((page-1)*pageSize,page*pageSize);

      const trendProduct=root.dataset.spcTrendProduct||'';
      const trendRaw=trendProduct?base.filter(x=>x.product===trendProduct):[];
      const daily=trendProduct?spcDailyTrend(trendRaw,selected):[];
      const st=stats(trendRaw,selected);
      const latest=daily.length?daily[daily.length-1]:null;
      const latestJudge=latest?.judge||'대기';
      const badgeClass=latestJudge==='합격'?'ok':latestJudge==='불합격'?'bad':'wait';

      const filterHtml='<div class="ip-filter-row spc-iqc-filter-row">'+

        '<label class="ip-filter"><span>고객사</span><select class="input spc-customer"><option value="">전체</option>'+customers.map(x=>'<option value="'+esc(x)+'" '+(x===customerFilter?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'+
        '<label class="ip-filter"><span>제품명</span><input class="input spc-product-filter" value="'+esc(productFilter)+'" placeholder="전체"></label>'+
        '<label class="ip-filter"><span>검사항목</span><select class="input qce-spc-item">'+(items.length?items:[selected]).map(x=>'<option value="'+esc(x)+'" '+(x===selected?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label>'+
        '</div>';

      const overviewBody=pageRows.length?pageRows.map((r,i)=>'<tr class="'+(trendProduct===r.product?'spc-row-selected':'')+'"><td>'+((page-1)*pageSize+i+1)+'</td><td>'+esc(r.date||'-')+'</td><td>'+esc(r.customer||'-')+'</td><td><button type="button" class="spc-product-link" data-spc-product="'+encodeURIComponent(r.product||'')+'">'+esc(r.product||'-')+'</button></td><td>'+esc(r.lot||'-')+'</td><td>'+fmt(r.value)+'</td><td>'+esc(spcSpecText(selected))+'</td><td><span class="spc-judge '+(r.judge==='합격'?'ok':r.judge==='불합격'?'bad':'wait')+'">'+esc(r.judge)+'</span></td></tr>').join(''):'<tr><td colspan="8" style="height:72px;color:#94a3b8">조건에 해당하는 출하검사 측정 데이터가 없습니다.</td></tr>';

      let pager='';
      if(totalPages>1){
        pager+='<button type="button" class="spc-page-btn" data-spc-page="'+Math.max(1,page-1)+'" '+(page===1?'disabled':'')+'>‹</button>';
        for(let p=1;p<=totalPages;p++)pager+='<button type="button" class="spc-page-btn '+(p===page?'active':'')+'" data-spc-page="'+p+'">'+p+'</button>';
        pager+='<button type="button" class="spc-page-btn" data-spc-page="'+Math.min(totalPages,page+1)+'" '+(page===totalPages?'disabled':'')+'>›</button>';
      }else pager='<button type="button" class="spc-page-btn active" data-spc-page="1">1</button>';

      const trendPanel=trendProduct
        ?'<div class="spc-trend-card"><div class="spc-premium-head"><div><div class="spc-premium-title">'+esc(trendProduct)+' · '+esc(selected)+' Trend</div><div class="spc-subline">출하검사일 기준 · 규격 '+esc(spcSpecText(selected))+'</div></div><div class="spc-latest"><span>최근 판정</span><strong class="spc-judge '+badgeClass+'">'+esc(latestJudge)+'</strong></div></div>'+
          '<div class="qce-kpis spc-kpis"><div class="qce-kpi"><b>검사일수</b><strong>'+daily.length+'</strong></div><div class="qce-kpi"><b>측정수</b><strong>'+st.n+'</strong></div><div class="qce-kpi"><b>평균</b><strong>'+fmt(st.avg)+'</strong><small>최소 '+fmt(st.min)+' / 최대 '+fmt(st.max)+'</small></div><div class="qce-kpi"><b>Cp / Cpk</b><strong>'+(st.cp==null?'-':st.cp.toFixed(2))+' / '+(st.cpk==null?'-':st.cpk.toFixed(2))+'</strong></div></div>'+
          '<div class="qce-chart"><div class="spc-chart-legend"><span><i class="ok"></i>합격</span><span><i class="bad"></i>불합격</span><span>점선: 규격한계</span></div><div class="qce-chart-wrap">'+trendSvg(daily,selected)+'</div></div>'+
          '<div class="spc-detail-title">날짜별 상세</div><div class="ip-table-wrap spc-detail-wrap"><table class="ip-table"><thead><tr><th>No.</th><th>검사일자</th><th>완제품 LOT</th><th>측정수</th><th>평균값</th><th>규격</th><th>판정</th></tr></thead><tbody>'+daily.slice().reverse().map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.lot||'-')+'</td><td>'+r.count+'</td><td>'+fmt(r.value)+'</td><td>'+esc(spcSpecText(selected))+'</td><td><span class="spc-judge '+(r.judge==='합격'?'ok':r.judge==='불합격'?'bad':'wait')+'">'+esc(r.judge)+'</span></td></tr>').join('')+'</tbody></table></div></div>'
        :'';

      root.innerHTML='<div class="inspection-premium iqc-work-frame"><div class="ip-panel">'+
        '<div class="iqc-register-header"><strong>SPC / Trend 조회</strong><div class="iqc-header-tools"><button class="btn export-btn spc-export" type="button">엑셀 내보내기</button></div></div>'+
        '<div class="ip-toolbar '+(collapsed?'spc-collapsed':'')+'">'+
          '<div class="spc-filter-area" '+(collapsed?'hidden':'')+'>'+filterHtml+'</div>'+

        '</div>'+

        '<div class="ip-table-wrap"><table class="ip-table spc-overview-table"><thead><tr><th>No.</th><th>검사일자</th><th>고객사</th><th>제품명</th><th>완제품 LOT</th><th>'+esc(selected)+' 평균</th><th>규격</th><th>판정</th></tr></thead><tbody>'+overviewBody+'</tbody></table></div>'+
        '<div class="ip-footnote"><div class="ip-pagination spc-pagination" aria-label="SPC 페이지">'+pager+'</div></div>'+
        trendPanel+
      '</div></div>';

      const applyFilters=()=>{
        root.dataset.spcCustomer=root.querySelector('.spc-customer')?.value||'';
        root.dataset.spcFilterProduct=root.querySelector('.spc-product-filter')?.value.trim()||'';
        root.dataset.spcItem=root.querySelector('.qce-spc-item')?.value||selected;
        root.dataset.spcPage='1';
        if(root.dataset.spcTrendProduct && !overview.some(x=>x.product===root.dataset.spcTrendProduct))delete root.dataset.spcTrendProduct;
        renderSpc();
      };
      root.querySelector('.qce-spc-item')?.addEventListener('change',()=>{delete root.dataset.spcTrendProduct;applyFilters();});
      root.querySelector('.spc-customer')?.addEventListener('change',applyFilters);
      root.querySelector('.spc-product-filter')?.addEventListener('keydown',e=>{if(e.key==='Enter')applyFilters();});
      root.querySelectorAll('.spc-page-btn').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;root.dataset.spcPage=b.dataset.spcPage||'1';renderSpc();}));
      root.querySelectorAll('.spc-product-link').forEach(b=>b.addEventListener('click',()=>{root.dataset.spcTrendProduct=decodeURIComponent(b.dataset.spcProduct||'');renderSpc();requestAnimationFrame(()=>root.querySelector('.spc-trend-card')?.scrollIntoView({block:'nearest'}));}));
      root.querySelector('.spc-export')?.addEventListener('click',()=>{
        const rows=[['No.','검사일자','고객사','제품명','완제품 LOT',selected+' 평균','규격','판정']];
        overview.forEach((r,i)=>rows.push([i+1,r.date||'',r.customer||'',r.product||'',r.lot||'',fmt(r.value),spcSpecText(selected),r.judge]));
        const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
        const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download='SPC_Trend_'+selected+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
        toast('엑셀용 CSV 파일을 생성했습니다.');
      });
    }catch(e){
      root.innerHTML='<div class="inspection-premium iqc-work-frame"><div class="ip-panel"><div class="qce-empty">'+esc(e.message)+'</div></div></div>';
    }
  }
  async function renderChange(){
    const root=document.getElementById('changeControl');if(!root)return;
    root.innerHTML='<div class="qce-page">'+head('변경관리','원료·공급사·Recipe·공정조건·설비·Spec 변경을 승인 이력으로 관리합니다.')+'<div class="qce-shell"><div class="qce-toolbar"><div class="left"><input class="qce-input qce-change-q" placeholder="변경번호 / 제목 / 대상 검색"></div><div class="right"><button class="qce-btn qce-change-search">조회</button><button class="qce-btn primary qce-change-new">+ 변경 등록</button></div></div><div class="qce-change-body"><div class="qce-empty">조회 중...</div></div></div></div>';
    const load=async()=>{
      try{
        const q=root.querySelector('.qce-change-q')?.value||'';const rows=await api('/api/qmes-change?q='+encodeURIComponent(q));
        const body=root.querySelector('.qce-change-body');
        body.innerHTML='<div style="overflow:auto"><table class="qce-table"><thead><tr><th>No.</th><th>변경번호</th><th>구분</th><th>제목</th><th>대상</th><th>담당자</th><th>적용예정일</th><th>상태</th><th>처리</th></tr></thead><tbody>'+(
          rows.length?rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.change_no||'-')+'</td><td>'+esc(r.change_type)+'</td><td>'+esc(r.title)+'</td><td>'+esc(r.target||'-')+'</td><td>'+esc(r.owner||'-')+'</td><td>'+esc(String(r.planned_on||'').slice(0,10)||'-')+'</td><td><span class="qce-badge '+(r.status==='적용완료'?'ok':r.status==='승인완료'?'ok':r.status==='작성중'?'warn':'')+'">'+esc(r.status)+'</span></td><td>'+(
            r.status==='작성중'?'<button class="qce-btn" data-action="review" data-id="'+r.id+'">검토완료</button>':r.status==='검토완료'?'<button class="qce-btn" data-action="approve" data-id="'+r.id+'">승인완료</button>':r.status==='승인완료'?'<button class="qce-btn" data-action="close" data-id="'+r.id+'">적용완료</button>':'-'
          )+'</td></tr>').join(''):'<tr><td colspan="9">등록된 변경이 없습니다.</td></tr>'
        )+'</tbody></table></div>';
        body.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{try{await api('/api/qmes-change/'+b.dataset.id+'/action',{method:'POST',body:JSON.stringify({action:b.dataset.action})});toast('변경 상태가 처리되었습니다.');load();}catch(e){toast(e.message);}});
      }catch(e){root.querySelector('.qce-change-body').innerHTML='<div class="qce-empty">'+esc(e.message)+'</div>';}
    };
    root.querySelector('.qce-change-search').onclick=load;
    root.querySelector('.qce-change-q').addEventListener('keydown',e=>{if(e.key==='Enter')load();});
    root.querySelector('.qce-change-new').onclick=()=>modal('변경 등록','<div class="qce-form">'+
      '<div class="qce-field"><label>변경구분</label><select data-k="change_type"><option>원료 변경</option><option>공급사 변경</option><option>Recipe 변경</option><option>공정조건 변경</option><option>설비 변경</option><option>Spec 변경</option></select></div>'+
      '<div class="qce-field"><label>변경제목</label><input data-k="title"></div>'+
      '<div class="qce-field"><label>변경대상</label><input data-k="target"></div><div class="qce-field"><label>담당자</label><input data-k="owner"></div>'+
      '<div class="qce-field"><label>적용예정일</label><input data-k="planned_on" type="date"></div><div class="qce-field"><label>현재 기준</label><input data-k="current_value"></div>'+
      '<div class="qce-field full"><label>변경 후 기준</label><textarea data-k="proposed_value"></textarea></div><div class="qce-field full"><label>변경사유</label><textarea data-k="reason"></textarea></div><div class="qce-field full"><label>영향평가</label><textarea data-k="impact"></textarea></div></div>',
      async bg=>{await api('/api/qmes-change',{method:'POST',body:JSON.stringify({change_type:val(bg,'change_type'),title:val(bg,'title'),target:val(bg,'target'),owner:val(bg,'owner'),planned_on:val(bg,'planned_on'),current_value:val(bg,'current_value'),proposed_value:val(bg,'proposed_value'),reason:val(bg,'reason'),impact:val(bg,'impact')})});toast('변경건이 등록되었습니다.');load();}
    );
    load();
  }

  async function renderInstrument(){
    const root=document.getElementById('instrumentMgmt');if(!root)return;
    root.innerHTML='<div class="qce-page">'+head('계측기관리','검사계측기와 차기 검교정 일정을 관리합니다.')+'<div class="qce-shell"><div class="qce-toolbar"><div class="left"><input class="qce-input qce-inst-q" placeholder="관리번호 / 계측기명 / 모델 검색"></div><div class="right"><button class="qce-btn qce-inst-search">조회</button><button class="qce-btn primary qce-inst-new">+ 계측기 등록</button></div></div><div class="qce-inst-body"><div class="qce-empty">조회 중...</div></div></div></div>';
    const load=async()=>{
      try{
        const rows=await api('/api/qmes-instruments?q='+encodeURIComponent(root.querySelector('.qce-inst-q')?.value||''));
        root._instrumentRows=rows;
        root.querySelector('.qce-inst-body').innerHTML='<div style="overflow:auto"><table class="qce-table"><thead><tr><th>No.</th><th>관리번호</th><th>계측기명</th><th>제조사 / 모델</th><th>Serial No.</th><th>사용부서</th><th>최종 검교정일</th><th>차기 검교정일</th><th>상태</th><th>검교정</th></tr></thead><tbody>'+(
          rows.length?rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.instrument_no||'-')+'</td><td>'+esc(r.instrument_name)+'</td><td>'+esc([r.maker,r.model].filter(Boolean).join(' / ')||'-')+'</td><td>'+esc(r.serial_no||'-')+'</td><td>'+esc(r.department||'-')+'</td><td>'+esc(String(r.last_calibration_on||'').slice(0,10)||'-')+'</td><td>'+esc(String(r.next_calibration_on||'').slice(0,10)||'-')+'</td><td><span class="qce-badge '+(r.status==='사용'?'ok':'bad')+'">'+esc(r.status)+'</span></td><td><button class="qce-btn" data-cal="'+r.id+'">등록</button></td></tr>').join(''):'<tr><td colspan="10">등록된 계측기가 없습니다.</td></tr>'
        )+'</tbody></table></div>';
        root.querySelectorAll('[data-cal]').forEach(b=>b.onclick=()=>openCalibration(rows.find(x=>String(x.id)===String(b.dataset.cal)),load));
      }catch(e){root.querySelector('.qce-inst-body').innerHTML='<div class="qce-empty">'+esc(e.message)+'</div>';}
    };
    root.querySelector('.qce-inst-search').onclick=load;
    root.querySelector('.qce-inst-q').addEventListener('keydown',e=>{if(e.key==='Enter')load();});
    root.querySelector('.qce-inst-new').onclick=()=>modal('계측기 등록','<div class="qce-form">'+
      '<div class="qce-field"><label>계측기명</label><input data-k="instrument_name"></div><div class="qce-field"><label>제조사</label><input data-k="maker"></div>'+
      '<div class="qce-field"><label>모델</label><input data-k="model"></div><div class="qce-field"><label>Serial No.</label><input data-k="serial_no"></div>'+
      '<div class="qce-field"><label>사용부서</label><input data-k="department"></div><div class="qce-field"><label>설치위치</label><input data-k="location"></div>'+
      '<div class="qce-field"><label>검교정주기(개월)</label><input data-k="calibration_cycle_months" type="number" value="12"></div><div class="qce-field"><label>상태</label><select data-k="status"><option>사용</option><option>사용중지</option></select></div>'+
      '<div class="qce-field"><label>최종 검교정일</label><input data-k="last_calibration_on" type="date"></div><div class="qce-field"><label>차기 검교정일</label><input data-k="next_calibration_on" type="date"></div>'+
      '<div class="qce-field full"><label>비고</label><textarea data-k="note"></textarea></div></div>',
      async bg=>{await api('/api/qmes-instruments',{method:'POST',body:JSON.stringify({instrument_name:val(bg,'instrument_name'),maker:val(bg,'maker'),model:val(bg,'model'),serial_no:val(bg,'serial_no'),department:val(bg,'department'),location:val(bg,'location'),calibration_cycle_months:val(bg,'calibration_cycle_months'),status:val(bg,'status'),last_calibration_on:val(bg,'last_calibration_on'),next_calibration_on:val(bg,'next_calibration_on'),note:val(bg,'note')})});toast('계측기가 등록되었습니다.');load();}
    );
    load();
  }

  function openCalibration(row,reload){
    if(!row)return;
    modal('검교정 등록 · '+row.instrument_name,'<div class="qce-form"><div class="qce-field"><label>검교정일</label><input data-k="calibration_on" type="date"></div><div class="qce-field"><label>차기예정일</label><input data-k="next_due_on" type="date"></div><div class="qce-field"><label>교정기관</label><input data-k="agency"></div><div class="qce-field"><label>성적서번호</label><input data-k="certificate_no"></div><div class="qce-field"><label>결과</label><select data-k="result"><option>적합</option><option>부적합</option></select></div><div class="qce-field full"><label>비고</label><textarea data-k="note"></textarea></div></div>',
      async bg=>{await api('/api/qmes-calibrations',{method:'POST',body:JSON.stringify({instrument_id:row.id,calibration_on:val(bg,'calibration_on'),next_due_on:val(bg,'next_due_on'),agency:val(bg,'agency'),certificate_no:val(bg,'certificate_no'),result:val(bg,'result'),note:val(bg,'note')})});toast('검교정 이력이 등록되었습니다.');reload();}
    );
  }

  async function renderCalibration(){
    const root=document.getElementById('calibrationMgmt');if(!root)return;
    root.innerHTML='<div class="qce-page">'+head('검교정관리','계측기별 검교정 이력과 차기 일정을 확인합니다.')+'<div class="qce-shell"><div class="qce-toolbar"><div class="left"></div><div class="right"><button class="qce-btn qce-cal-refresh">조회</button></div></div><div class="qce-cal-body"><div class="qce-empty">조회 중...</div></div></div></div>';
    const load=async()=>{try{const rows=await api('/api/qmes-calibrations');root.querySelector('.qce-cal-body').innerHTML='<div style="overflow:auto"><table class="qce-table"><thead><tr><th>No.</th><th>관리번호</th><th>계측기명</th><th>검교정일</th><th>차기예정일</th><th>교정기관</th><th>성적서번호</th><th>결과</th><th>작성자</th></tr></thead><tbody>'+(rows.length?rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.instrument_no||'-')+'</td><td>'+esc(r.instrument_name)+'</td><td>'+esc(String(r.calibration_on||'').slice(0,10))+'</td><td>'+esc(String(r.next_due_on||'').slice(0,10)||'-')+'</td><td>'+esc(r.agency||'-')+'</td><td>'+esc(r.certificate_no||'-')+'</td><td><span class="qce-badge '+(r.result==='적합'?'ok':'bad')+'">'+esc(r.result)+'</span></td><td>'+esc(r.created_by||'-')+'</td></tr>').join(''):'<tr><td colspan="9">등록된 검교정 이력이 없습니다.</td></tr>')+'</tbody></table></div>';}catch(e){root.querySelector('.qce-cal-body').innerHTML='<div class="qce-empty">'+esc(e.message)+'</div>';}};
    root.querySelector('.qce-cal-refresh').onclick=load;load();
  }

  function init(){
    renderSpc();renderChange();renderInstrument();renderCalibration();
    document.querySelectorAll('.menu[data-page="spcTrend"]').forEach(m=>m.addEventListener('click',()=>setTimeout(renderSpc,0)));
    document.querySelectorAll('.menu[data-page="changeControl"]').forEach(m=>m.addEventListener('click',()=>setTimeout(renderChange,0)));
    document.querySelectorAll('.menu[data-page="instrumentMgmt"]').forEach(m=>m.addEventListener('click',()=>setTimeout(renderInstrument,0)));
    document.querySelectorAll('.menu[data-page="calibrationMgmt"]').forEach(m=>m.addEventListener('click',()=>setTimeout(renderCalibration,0)));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();