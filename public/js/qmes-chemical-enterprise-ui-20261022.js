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


    /* Final SPC spacing override: keep the overview table visibly separated from filters. */
    #spcTrend .iqc-work-frame .ip-toolbar + .ip-table-wrap{
      margin-top:22px!important;
    }
    #spcTrend .iqc-work-frame .spc-overview-table{
      margin-top:0!important;
    }
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

    /* iqc-visual-parity-20261023: shared IQC typography and table palette. */
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) .qce-page{font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard),html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) :is(button,input,select,textarea),.qce-modal,.qce-modal :is(button,input,select,textarea){font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list){border-collapse:separate!important;border-spacing:0!important;background:#fff!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) thead th{height:34px!important;box-sizing:border-box!important;padding:6px 12px!important;background:#e8f0f8!important;color:#244260!important;font-size:12px!important;font-weight:600!important;line-height:1.4!important;border:0!important;border-right:1px solid #cbd8e5!important;border-bottom:1px solid #cbd8e5!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) tbody td{height:36px!important;box-sizing:border-box!important;padding:4px 12px!important;background:#fff!important;color:#344054!important;font-size:12px!important;font-weight:400!important;line-height:1.4!important;border:0!important;border-right:1px solid #eef1f4!important;border-bottom:1px solid #e8edf2!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) tbody tr:nth-child(even)>td{background:#fcfdff!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) tbody tr:hover>td,html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) tbody tr.spc-row-selected>td{background:#eef6ff!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) :is(.qce-input,.qce-select){font-size:12px!important;font-weight:400!important;color:#243e5d!important;border-color:#c7d6e5!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) .qce-btn{font-size:12px!important;font-weight:600!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) .qce-head h1{font-size:18px!important;font-weight:800!important;color:#173b61!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) .qce-head h1:before{content:'';display:inline-block;width:3px;height:22px;margin-right:10px;vertical-align:middle;background:#166fbb;border-radius:2px}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) .qce-toolbar{background:#f3f7fb!important;border-color:#dae5ef!important}
    html body #standard table.std-document-list[class] tbody td{height:68px!important}
    html body #standard table.std-document-list[class] .std-document-name::after{color:#667085!important;font-family:inherit!important;font-size:12px!important;font-weight:400!important}
    .qce-modal .qce-field label{font-size:12px!important;font-weight:600!important;color:#244260!important;background:#f3f7fb!important}
    .qce-modal .qce-field :is(input,select,textarea){font-size:12px!important;font-weight:400!important;color:#344054!important;border-color:#c7d6e5!important}

    /* iqc-grid-fit-20261023-v2: content-aware columns and a single grid line. */
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list){width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;border-spacing:0!important;border:1px solid #d5dce5!important;box-shadow:none!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) :is(th,td){box-sizing:border-box!important;min-width:0!important;padding-left:8px!important;padding-right:8px!important;box-shadow:none!important;outline:0!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) thead th{white-space:normal!important;overflow-wrap:anywhere!important;border:1px solid #d5dce5!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) table[class]:is(.qce-table,.ip-table,.std-document-list) tbody td{border:1px solid #d5dce5!important;overflow:hidden!important;text-overflow:ellipsis!important}
    html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt,#standard) .iqc-work-frame .ip-table-wrap{border:0!important}
    html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]{border-collapse:separate!important}
    html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class] tr{grid-template-columns:minmax(36px,4fr) minmax(0,32fr) minmax(0,9fr) minmax(0,13fr) minmax(0,12fr) minmax(0,15fr) minmax(0,15fr)!important}
    html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class] :is(th,td){width:auto!important;border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important}
    html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class] tr>:last-child{border-right:0!important}
    html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class] tbody tr:last-child>td{border-bottom:0!important}
    html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class] .std-document-name{white-space:normal!important;overflow-wrap:anywhere!important}
    html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]{min-width:0!important;border:1px solid #d5dce5!important}

/* all-menu-title-frame-20261023: the IQC main heading frame, not table headers. */
html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard) .page-head[class]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;width:100%!important;min-width:0!important;min-height:67px!important;height:auto!important;margin:0!important;padding:14px 22px!important;background:#fff!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:0!important;box-shadow:none!important}
html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard) .page-head[class] h1{display:flex!important;align-items:center!important;gap:10px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:24px!important;letter-spacing:-.4px!important;color:#173b61!important;text-shadow:none!important}
html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard) .page-head[class] h1::before{content:""!important;display:block!important;position:static!important;flex:0 0 3px!important;width:3px!important;height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background:#166fbb!important;transform:none!important}
html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard) .page-head[class] :is(.btn,.ncr-btn,.qce-btn,.qgate-open),html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard) .page-head[class] .eq-parity-buttons button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;font-size:12px!important}
html body #work .nwi-header[class]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;width:100%!important;min-width:0!important;min-height:67px!important;height:auto!important;margin:0!important;padding:14px 22px!important;background:#fff!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:0!important;box-shadow:none!important}
html body #work .nwi-header[class] .nwi-title>strong{display:flex!important;align-items:center!important;gap:10px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:24px!important;letter-spacing:-.4px!important;color:#173b61!important;text-shadow:none!important}
html body #work .nwi-header[class] .nwi-title>strong::before{content:""!important;display:block!important;position:static!important;flex:0 0 3px!important;width:3px!important;height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background:#166fbb!important;transform:none!important}
html body #work .nwi-header[class] :is(.btn,.ncr-btn,.qce-btn,.qgate-open),html body #work .nwi-header[class] .eq-parity-buttons button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;font-size:12px!important}
html body :is(#incoming,#process,#outgoing,#spcTrend) .iqc-work-frame .iqc-register-header[class]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;width:100%!important;min-width:0!important;min-height:67px!important;height:auto!important;margin:0!important;padding:14px 22px!important;background:#fff!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:0!important;box-shadow:none!important}
html body :is(#incoming,#process,#outgoing,#spcTrend) .iqc-work-frame .iqc-register-header[class] >strong{display:flex!important;align-items:center!important;gap:10px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:24px!important;letter-spacing:-.4px!important;color:#173b61!important;text-shadow:none!important}
html body :is(#incoming,#process,#outgoing,#spcTrend) .iqc-work-frame .iqc-register-header[class] >strong::before{content:""!important;display:block!important;position:static!important;flex:0 0 3px!important;width:3px!important;height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background:#166fbb!important;transform:none!important}
html body :is(#incoming,#process,#outgoing,#spcTrend) .iqc-work-frame .iqc-register-header[class] :is(.btn,.ncr-btn,.qce-btn,.qgate-open),html body :is(#incoming,#process,#outgoing,#spcTrend) .iqc-work-frame .iqc-register-header[class] .eq-parity-buttons button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;font-size:12px!important}
html body #equipment .eq-parity-header[class]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;width:100%!important;min-width:0!important;min-height:67px!important;height:auto!important;margin:0!important;padding:14px 22px!important;background:#fff!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:0!important;box-shadow:none!important}
html body #equipment .eq-parity-header[class] h2{display:flex!important;align-items:center!important;gap:10px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:24px!important;letter-spacing:-.4px!important;color:#173b61!important;text-shadow:none!important}
html body #equipment .eq-parity-header[class] h2::before{content:""!important;display:block!important;position:static!important;flex:0 0 3px!important;width:3px!important;height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background:#166fbb!important;transform:none!important}
html body #equipment .eq-parity-header[class] :is(.btn,.ncr-btn,.qce-btn,.qgate-open),html body #equipment .eq-parity-header[class] .eq-parity-buttons button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;font-size:12px!important}
html body #lotTrace .lot-shell>.lot-hero[class]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;width:100%!important;min-width:0!important;min-height:67px!important;height:auto!important;margin:0!important;padding:14px 22px!important;background:#fff!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:0!important;box-shadow:none!important}
html body #lotTrace .lot-shell>.lot-hero[class] .lot-hero-copy h1{display:flex!important;align-items:center!important;gap:10px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:24px!important;letter-spacing:-.4px!important;color:#173b61!important;text-shadow:none!important}
html body #lotTrace .lot-shell>.lot-hero[class] .lot-hero-copy h1::before{content:""!important;display:block!important;position:static!important;flex:0 0 3px!important;width:3px!important;height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background:#166fbb!important;transform:none!important}
html body #lotTrace .lot-shell>.lot-hero[class] :is(.btn,.ncr-btn,.qce-btn,.qgate-open),html body #lotTrace .lot-shell>.lot-hero[class] .eq-parity-buttons button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;font-size:12px!important}
html body #ncr .ncr-equipment-card>.ncr-head[class]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;width:100%!important;min-width:0!important;min-height:67px!important;height:auto!important;margin:0!important;padding:14px 22px!important;background:#fff!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:0!important;box-shadow:none!important}
html body #ncr .ncr-equipment-card>.ncr-head[class] h1{display:flex!important;align-items:center!important;gap:10px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:24px!important;letter-spacing:-.4px!important;color:#173b61!important;text-shadow:none!important}
html body #ncr .ncr-equipment-card>.ncr-head[class] h1::before{content:""!important;display:block!important;position:static!important;flex:0 0 3px!important;width:3px!important;height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background:#166fbb!important;transform:none!important}
html body #ncr .ncr-equipment-card>.ncr-head[class] :is(.btn,.ncr-btn,.qce-btn,.qgate-open),html body #ncr .ncr-equipment-card>.ncr-head[class] .eq-parity-buttons button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;font-size:12px!important}
html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-page>.qce-head[class]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:12px!important;width:100%!important;min-width:0!important;min-height:67px!important;height:auto!important;margin:0!important;padding:14px 22px!important;background:#fff!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:0!important;box-shadow:none!important}
html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-page>.qce-head[class] h1{display:flex!important;align-items:center!important;gap:10px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:24px!important;letter-spacing:-.4px!important;color:#173b61!important;text-shadow:none!important}
html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-page>.qce-head[class] h1::before{content:""!important;display:block!important;position:static!important;flex:0 0 3px!important;width:3px!important;height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:2px!important;background:#166fbb!important;transform:none!important}
html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-page>.qce-head[class] :is(.btn,.ncr-btn,.qce-btn,.qgate-open),html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-page>.qce-head[class] .eq-parity-buttons button{box-sizing:border-box!important;height:38px!important;min-height:38px!important;font-size:12px!important}
html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard)>.page-head[class],html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-page>.qce-head[class]{border:1px solid #d2dfed!important;border-bottom:0!important;border-radius:10px 10px 0 0!important}
html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard)>.page-head+.module-shell,html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-head+.qce-shell{border-top-left-radius:0!important;border-top-right-radius:0!important}
html body :is(#orders,#purchase,#inventory,#quality,#approval,#standard) .page-head p,html body :is(#changeControl,#instrumentMgmt,#calibrationMgmt) .qce-head p{display:none!important}
html body #work .nwi-header .nwi-title::before{content:none!important;display:none!important}
html body #lotTrace .lot-shell>.lot-hero[class]>.lot-hero-top{width:100%!important;min-height:38px!important;margin:0!important}

/* oqc-row-border-parity-20261023: 34px headings, 44px data, single shared edges. */
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table){border-collapse:separate!important;border-spacing:0!important;border:1px solid #d5dce5!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) thead tr,html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) thead th,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>thead>tr,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>thead>tr>th{box-sizing:border-box!important;height:34px!important;min-height:34px!important;max-height:34px!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) thead th,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>thead>tr>th{padding:5px 8px!important;line-height:20px!important;background:#e8f0f8!important;border:0!important;border-right:1px solid #cbd8e5!important;border-bottom:1px solid #cbd8e5!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) tbody tr,html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) tbody td,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>tbody>tr,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>tbody>tr>td{box-sizing:border-box!important;height:44px!important;min-height:44px!important;max-height:44px!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) tbody td,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>tbody>tr>td{padding:8px 12px!important;line-height:18px!important;border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;overflow:hidden!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) tr>:last-child,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>:is(thead,tbody)>tr>:last-child{border-right:0!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) tbody tr:last-child>td,html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>tbody>tr:last-child>td{border-bottom:0!important}
html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]{border:0!important;border-collapse:separate!important;border-spacing:0!important}
html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>tbody>tr>td.std-document-name{padding-top:4px!important;padding-bottom:4px!important;line-height:16px!important}
html body #standard.module-page > .module-shell > .module-body > table.std-document-list[class]>tbody>tr>td.std-document-name::after{margin-top:0!important;line-height:16px!important;font-size:11px!important}

/* quality-complete-single-grid-20261023: each edge is owned exactly once. */
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) tr>:last-child{border-right:1px solid #d5dce5!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table) tbody tr:last-child>td{border-bottom:1px solid #d5dce5!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table){border-collapse:collapse!important;border-spacing:0!important;border:1px solid #d5dce5!important;outline:0!important;box-shadow:none!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) .iqc-work-frame .ip-table-wrap{border:0!important;outline:0!important;box-shadow:none!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table)>:is(thead,tbody),html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table)>:is(thead,tbody)>tr{border:0!important;outline:0!important;box-shadow:none!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table)>:is(thead,tbody)>tr>:is(th,td){border:1px solid #d5dce5!important;outline:0!important;box-shadow:none!important}
html body #standard.module-page>.module-shell>.module-body{border:0!important;outline:0!important;box-shadow:none!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]{border:0!important;border-collapse:separate!important;border-spacing:0!important;outline:0!important;box-shadow:none!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>:is(thead,tbody),html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>:is(thead,tbody)>tr{border:0!important;outline:0!important;box-shadow:none!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>:is(thead,tbody)>tr>:is(th,td){border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;outline:0!important;box-shadow:none!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>thead>tr>th{border-top:1px solid #d5dce5!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>:is(thead,tbody)>tr>:first-child{border-left:1px solid #d5dce5!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>:is(thead,tbody)>tr>:last-child{border-right:1px solid #d5dce5!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>tbody>tr:last-child>td{border-bottom:1px solid #d5dce5!important}

/* standard-empty-frame-20261023: wrapper owns the complete perimeter, including empty lists. */
html body #standard.module-page>.module-shell>.module-body{box-sizing:border-box!important;border:1px solid #d5dce5!important;min-height:132px!important;outline:0!important;box-shadow:none!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>thead>tr>th{border-top:0!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>:is(thead,tbody)>tr>:first-child{border-left:0!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>:is(thead,tbody)>tr>:last-child{border-right:0!important}

/* quality-two-tone-grid-20261023: blue header edges, neutral gray body edges. */
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table)>thead>tr>th{border-color:#cbd8e5!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table)>tbody>tr>td{border-color:#d5dce5!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table)>thead>tr>:last-child{border-right-color:#cbd8e5!important}
html body :is(#spcTrend,#changeControl,#instrumentMgmt,#calibrationMgmt) table[class]:is(.qce-table,.ip-table)>tbody>tr>:last-child{border-right-color:#d5dce5!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>thead>tr>th{border-right-color:#cbd8e5!important;border-bottom-color:#cbd8e5!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>tbody>tr>td{border-right-color:#d5dce5!important;border-bottom-color:#d5dce5!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>thead>tr>:last-child{border-right-color:#cbd8e5!important}
html body #standard.module-page>.module-shell>.module-body>table.std-document-list[class]>tbody>tr>:last-child{border-right-color:#d5dce5!important}

/* spc-thin-perimeter-20261023: cells alone draw the table perimeter. */
html body #spcTrend .iqc-work-frame .ip-table-wrap[class]{border:0!important;outline:0!important;box-shadow:none!important;padding:0!important}
html body #spcTrend .iqc-work-frame table.ip-table[class]{border:0!important;outline:0!important;box-shadow:none!important;border-collapse:collapse!important;border-spacing:0!important}
html body #spcTrend .iqc-work-frame table.ip-table[class]>:is(thead,tbody)>tr>:is(th,td){border-width:1px!important;border-style:solid!important;outline:0!important;box-shadow:none!important}

/* change-instant-thin-grid-20261023 */
html body #changeControl .qce-change-body>div{border:0!important;outline:0!important;box-shadow:none!important}
html body #changeControl .qce-change-body table.qce-table[class]{border:0!important;border-collapse:collapse!important;border-spacing:0!important;outline:0!important;box-shadow:none!important}
html body #changeControl .qce-change-body table.qce-table[class]>:is(thead,tbody)>tr>:is(th,td){border-width:1px!important;border-style:solid!important;outline:0!important;box-shadow:none!important}
html body #changeControl .change-load-status{padding:10px 12px;font-size:12px;color:#64748b}

/* change-one-perimeter-20261023: shell and cells must not both draw the same edge. */
html body #changeControl .qce-page>.qce-shell{border:0!important;outline:0!important;box-shadow:none!important}
html body #changeControl .qce-page>.qce-shell>.qce-toolbar{box-sizing:border-box!important;border:1px solid #d8e2ec!important;border-bottom:0!important}
html body #changeControl .qce-change-body{border:0!important;outline:0!important;box-shadow:none!important;background:#fff!important}
html body #changeControl .qce-change-body>div{border:0!important;outline:0!important;box-shadow:none!important;margin:0!important;padding:0!important}
html body #changeControl .qce-change-body .change-load-status{padding:10px 12px!important}
html body #changeControl .qce-change-body table.qce-table[class]{border:0!important;outline:0!important;box-shadow:none!important;border-collapse:collapse!important}

/* instrument-instant-single-edge-20261023 */
html body #instrumentMgmt .qce-page>.qce-shell{border:0!important;outline:0!important;box-shadow:none!important}
html body #instrumentMgmt .qce-page>.qce-shell>.qce-toolbar{box-sizing:border-box!important;border:1px solid #d8e2ec!important;border-bottom:0!important}
html body #instrumentMgmt .qce-inst-body,html body #instrumentMgmt .qce-inst-body>div{border:0!important;outline:0!important;box-shadow:none!important;margin:0!important;padding:0!important;background:#fff!important}
html body #instrumentMgmt .qce-inst-body table.qce-table[class]{border:0!important;outline:0!important;box-shadow:none!important;border-collapse:collapse!important;border-spacing:0!important}
html body #instrumentMgmt .qce-inst-body table.qce-table[class]>:is(thead,tbody)>tr>:is(th,td){border-width:1px!important;border-style:solid!important;outline:0!important;box-shadow:none!important}
html body #instrumentMgmt .qce-inst-body .instrument-load-status{padding:10px 12px!important;font-size:12px;color:#64748b}

/* calibration-instant-single-edge-20261023 */
html body #calibrationMgmt .qce-page>.qce-shell{border:0!important;outline:0!important;box-shadow:none!important}
html body #calibrationMgmt .qce-page>.qce-shell>.qce-toolbar{box-sizing:border-box!important;border:1px solid #d8e2ec!important;border-bottom:0!important}
html body #calibrationMgmt .qce-cal-body,html body #calibrationMgmt .qce-cal-body>div{border:0!important;outline:0!important;box-shadow:none!important;margin:0!important;padding:0!important;background:#fff!important}
html body #calibrationMgmt .qce-cal-body table.qce-table[class]{border:0!important;outline:0!important;box-shadow:none!important;border-collapse:collapse!important;border-spacing:0!important}
html body #calibrationMgmt .qce-cal-body table.qce-table[class]>:is(thead,tbody)>tr>:is(th,td){border-width:1px!important;border-style:solid!important;outline:0!important;box-shadow:none!important}
html body #calibrationMgmt .qce-cal-body .calibration-load-status{padding:10px 12px!important;font-size:12px;color:#64748b}

/* instrument-department-select-20261023 */
.qce-modal .qce-department-picker{position:relative;min-width:0;margin:5px 7px;font-size:12px}
.qce-modal .qce-department-picker>input[type=hidden]{display:none}
.qce-modal .qce-department-picker details{position:relative}
.qce-modal .qce-department-picker summary{box-sizing:border-box;min-height:30px;border:1px solid #c7d6e5;border-radius:2px;background:#fff;color:#344054;padding:6px 9px;cursor:pointer;overflow-wrap:anywhere}
.qce-modal .qce-department-options{position:absolute;top:100%;left:0;right:0;z-index:10;padding:5px;background:#fff;border:1px solid #c7d6e5;box-shadow:0 4px 12px #0002}
.qce-modal .qce-department-options label{display:flex!important;align-items:center;justify-content:flex-start!important;gap:7px!important;padding:7px!important;border:0!important;background:#fff!important;font-size:12px!important;font-weight:400!important;cursor:pointer}
.qce-modal .qce-department-options input[type=checkbox]{width:13px!important;height:13px!important;min-height:0!important;margin:0!important;padding:0!important}

/* instrument-photo-preview-20261023 */
html body #instrumentMgmt .qce-instrument-photo-link{border:0;background:none;padding:0;color:#0070c0;font:inherit;font-weight:700;text-decoration:underline;cursor:pointer}
.qce-instrument-photo-dialog{box-sizing:border-box;width:min(760px,94vw);max-height:92dvh;padding:0;border:1px solid #cbd8e5;border-radius:8px;background:#fff;color:#173b61;overflow:auto;box-shadow:0 16px 50px #0004}
.qce-instrument-photo-dialog::backdrop{background:rgba(15,23,42,.5)}
.qce-instrument-photo-head{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #dbe5ef;background:#fff;font:14px Pretendard,"Noto Sans KR",Arial,sans-serif}
.qce-instrument-photo-head button{padding:6px 12px;border:1px solid #cbd8e5;border-radius:4px;background:#fff;color:#173b61;cursor:pointer}
.qce-instrument-photo-dialog>img{display:block;width:100%;height:auto;max-height:calc(92dvh - 60px);object-fit:contain}

/* instrument-photo-upload-natural-size-20261023 */
.qce-instrument-photo-dialog{width:fit-content!important;max-width:94vw!important}
.qce-instrument-photo-dialog>img{width:auto!important;height:auto!important;max-width:min(502px,90vw)!important;max-height:calc(86dvh - 60px)!important;object-fit:contain}
.qce-modal .qce-instrument-photo-file{max-width:100%;box-sizing:border-box}
.qce-modal .qce-instrument-photo-file+small{display:block;padding:0 8px 6px;color:#667085;font-size:11px}

/* instrument-form-layout-photo-compact-20261023 */
.qce-modal .qce-instrument-form>.qce-field>label{justify-content:center!important;text-align:center!important}
.qce-instrument-photo-dialog>img{max-width:min(360px,86vw)!important;max-height:calc(80dvh - 60px)!important}
.qce-modal .qce-instrument-form .qce-instrument-photo-file{width:calc(100% - 14px)!important;font-size:11px!important}

/* instrument-photo-row-height-20261023 */
.qce-modal .qce-instrument-form .qce-field:has(>.qce-instrument-photo-file),.qce-modal .qce-instrument-form .qce-field:has(.qce-instrument-photo-file){min-height:42px!important}
.qce-modal .qce-instrument-form .qce-field>.qce-instrument-photo-file,.qce-modal .qce-instrument-form .qce-field>div:has(>.qce-instrument-photo-file){min-width:0;display:flex;align-items:center}
.qce-modal .qce-instrument-form .qce-instrument-photo-file{box-sizing:border-box!important;height:30px!important;min-height:30px!important;max-height:30px!important;margin:5px 7px!important;padding:3px 6px!important}

/* instrument-list-checkboxes-20261023 */
html body #instrumentMgmt .qce-table :is(th,td):first-child:has(>input[type=checkbox]){padding:0!important;text-align:center!important;vertical-align:middle!important}
html body #instrumentMgmt .qce-table input[type=checkbox]{appearance:auto;width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;margin:0!important;padding:0!important;vertical-align:middle;accent-color:#188ad1}
html body #instrumentMgmt .qce-table tbody tr.qce-inst-selected>td{background:#eef6ff!important}

/* instrument-selection-dock-20261023 */
html body #instrumentMgmt .qce-instrument-selection-dock{position:fixed;bottom:16px;z-index:120;min-height:58px;box-sizing:border-box;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--qmes-nav-background,#315d79);color:#fff;border:1px solid #3c6988;border-radius:8px;box-shadow:0 5px 20px rgba(21,39,64,.18);transform:translateY(calc(100% + 30px));opacity:0;visibility:hidden;pointer-events:none;transition:transform .3s ease-out,opacity .3s ease-out,visibility 0s .3s}
html body #instrumentMgmt .qce-instrument-selection-dock.is-visible{transform:translateY(0);opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
html body #instrumentMgmt .qce-instrument-selection-count{font-size:13px;font-weight:700;color:#fff}
html body #instrumentMgmt .qce-instrument-selection-dock>div{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
html body #instrumentMgmt .qce-instrument-selection-dock button{height:30px;padding:0 12px;border:1px solid #b8cde2;border-radius:4px;background:#f5f9ff;color:#244260;font:700 11px Pretendard,"Noto Sans KR",Arial,sans-serif;cursor:pointer}
@media(prefers-reduced-motion:reduce){html body #instrumentMgmt .qce-instrument-selection-dock{transition:none}}

html body #instrumentMgmt .qce-instrument-selection-dock [data-inst-selected-delete]{color:#dc2626!important}
  `;
  style.textContent+="html body #changeControl .qce-instrument-selection-dock{position:fixed;bottom:16px;z-index:120;min-height:58px;box-sizing:border-box;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--qmes-nav-background,#315d79);color:#fff;border:1px solid #3c6988;border-radius:8px;box-shadow:0 5px 20px rgba(21,39,64,.18);transform:translateY(calc(100% + 30px));opacity:0;visibility:hidden;pointer-events:none;transition:transform .3s ease-out,opacity .3s ease-out,visibility 0s .3s}\nhtml body #changeControl .qce-instrument-selection-dock.is-visible{transform:translateY(0);opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}\nhtml body #changeControl .qce-instrument-selection-count{font-size:13px;font-weight:700;color:#fff}\nhtml body #changeControl .qce-instrument-selection-dock>div{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}\nhtml body #changeControl .qce-instrument-selection-dock button{height:30px;padding:0 12px;border:1px solid #b8cde2;border-radius:4px;background:#f5f9ff;color:#244260;font:700 11px Pretendard,\"Noto Sans KR\",Arial,sans-serif;cursor:pointer}\n@media(prefers-reduced-motion:reduce){html body #changeControl .qce-instrument-selection-dock{transition:none}}\n\nhtml body #changeControl .qce-instrument-selection-dock [data-inst-selected-delete]{color:#dc2626!important}\n\nhtml body #changeControl .qce-change-selected>td{background:#eaf4ff!important}\nhtml body #changeControl .qce-table th{text-align:center!important}\nhtml body .qce-modal-bg .qce-change-form .qce-field>label{justify-content:center!important;text-align:center!important;padding-left:8px!important;padding-right:8px!important}\nhtml body .qce-modal-bg .qce-change-form .qce-field :is(input,select,textarea){box-sizing:border-box!important;text-align:left!important;padding-left:10px!important;padding-right:10px!important;font-family:Pretendard,\"Noto Sans KR\",\"Malgun Gothic\",sans-serif!important;font-size:12px!important;letter-spacing:0!important}\n";
  document.head.appendChild(style);

  function head(title,desc){return '<div class="qce-head"><div><h1>'+esc(title)+'</h1><p>'+esc(desc)+'</p></div><div class="date-badge">QMES</div></div>';}
  function modal(title,body,onSave){
    const bg=document.createElement('div');bg.className='qce-modal-bg';
    bg.innerHTML='<div class="qce-modal"><h3>'+esc(title)+'</h3><div>'+body+'</div><div class="qce-modal-foot"><button class="qce-btn" data-close>취소</button><button class="qce-btn primary" data-save>저장</button></div></div>';
    document.body.appendChild(bg);
    bg.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>bg.remove());
    bg.onclick=e=>{if(e.target===bg)bg.remove();};
    bg.querySelector('[data-save]').onclick=async()=>{try{await onSave(bg);bg.remove();}catch(e){toast(e.message);}};
    return bg;
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

  // spc-instant-menu-20261023: paint first and share one background refresh.
  let spcRows=null,spcLoadPromise=null,spcLoadedAt=0,spcLoadError='';
  function refreshSpc(){
    if(spcLoadPromise)return spcLoadPromise;
    spcLoadPromise=syncRows('oqc').then(rows=>{
      spcRows=rows;spcLoadedAt=Date.now();spcLoadError='';
      paintSpc(spcRows);
    }).catch(error=>{
      spcLoadError=error.message||'출하검사 데이터를 불러오지 못했습니다.';
      paintSpc(spcRows||[]);
    }).finally(()=>{spcLoadPromise=null;});
    return spcLoadPromise;
  }
  function renderSpc(){
    paintSpc(spcRows||[]);
    if(spcRows===null||Date.now()-spcLoadedAt>30000)refreshSpc();
  }
  function paintSpc(oqc){
    const root=document.getElementById('spcTrend');if(!root)return;
    try{
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

      const overviewBody=pageRows.length?pageRows.map((r,i)=>'<tr class="'+(trendProduct===r.product?'spc-row-selected':'')+'"><td>'+((page-1)*pageSize+i+1)+'</td><td>'+esc(r.date||'-')+'</td><td>'+esc(r.customer||'-')+'</td><td><button type="button" class="spc-product-link" data-spc-product="'+encodeURIComponent(r.product||'')+'">'+esc(r.product||'-')+'</button></td><td>'+esc(r.lot||'-')+'</td><td>'+fmt(r.value)+'</td><td>'+esc(spcSpecText(selected))+'</td><td><span class="spc-judge '+(r.judge==='합격'?'ok':r.judge==='불합격'?'bad':'wait')+'">'+esc(r.judge)+'</span></td></tr>').join(''):'<tr><td colspan="8" style="height:44px;color:#64748b" role="status">'+esc(spcLoadError||(spcRows===null?'출하검사 데이터를 불러오는 중입니다.':'조건에 해당하는 출하검사 측정 데이터가 없습니다.'))+'</td></tr>';

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
          '<div class="spc-detail-title">날짜별 상세</div><div class="ip-table-wrap spc-detail-wrap"><table class="ip-table"><colgroup><col style="width:5%"><col style="width:15%"><col style="width:24%"><col style="width:10%"><col style="width:14%"><col style="width:20%"><col style="width:12%"></colgroup><thead><tr><th>No.</th><th>검사일자</th><th>완제품 LOT</th><th>측정수</th><th>평균값</th><th>규격</th><th>판정</th></tr></thead><tbody>'+daily.slice().reverse().map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.lot||'-')+'</td><td>'+r.count+'</td><td>'+fmt(r.value)+'</td><td>'+esc(spcSpecText(selected))+'</td><td><span class="spc-judge '+(r.judge==='합격'?'ok':r.judge==='불합격'?'bad':'wait')+'">'+esc(r.judge)+'</span></td></tr>').join('')+'</tbody></table></div></div>'
        :'';

      root.innerHTML='<div class="inspection-premium iqc-work-frame"><div class="ip-panel">'+
        '<div class="iqc-register-header"><strong>SPC / Trend 조회</strong><div class="iqc-header-tools"><button class="btn export-btn spc-export" type="button">엑셀 내보내기</button></div></div>'+
        '<div class="ip-toolbar '+(collapsed?'spc-collapsed':'')+'">'+
          '<div class="spc-filter-area" '+(collapsed?'hidden':'')+'>'+filterHtml+'</div>'+

        '</div>'+

        '<div class="ip-table-wrap"><table class="ip-table spc-overview-table"><colgroup><col style="width:4%"><col style="width:12%"><col style="width:15%"><col style="width:19%"><col style="width:16%"><col style="width:12%"><col style="width:12%"><col style="width:10%"></colgroup><thead><tr><th>No.</th><th>검사일자</th><th>고객사</th><th>제품명</th><th>완제품 LOT</th><th>'+esc(selected)+' 평균</th><th>규격</th><th>판정</th></tr></thead><tbody>'+overviewBody+'</tbody></table></div>'+
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
  const changeQueries=new Map();
  function renderChange(){
    const root=document.getElementById('changeControl');if(!root)return;
    if(root._changeLoad&&root.querySelector('.qce-change-body')){root._changeLoad();return;}
    const selectedIds=new Set();
    const syncSelection=()=>{
      const boxes=Array.from(root.querySelectorAll('.qce-change-row-select')),all=root.querySelector('.qce-change-select-all');
      boxes.forEach(box=>{box.checked=selectedIds.has(box.value);box.closest('tr').classList.toggle('qce-change-selected',box.checked);});
      if(all){all.checked=boxes.length>0&&boxes.every(box=>box.checked);all.indeterminate=boxes.some(box=>box.checked)&&!all.checked;}
      const dock=root.querySelector('.qce-instrument-selection-dock');
      if(dock){
        const count=selectedIds.size;dock.classList.toggle('is-visible',count>0);dock.inert=!count;dock.setAttribute('aria-hidden',count?'false':'true');
        dock.querySelector('.qce-instrument-selection-count').textContent=count+'건 선택됨';
        dock.querySelector('[data-inst-selected-print]').textContent='선택 인쇄 ('+count+')';
        dock.querySelector('[data-inst-selected-delete]').textContent='선택 삭제 ('+count+')';
        const bounds=(root.querySelector('.qce-page')||root).getBoundingClientRect();
        if(bounds.width){dock.style.left=Math.max(12,bounds.left)+'px';dock.style.right=Math.max(12,innerWidth-bounds.right)+'px';}
      }
    };
    root._resetListSelection=()=>{selectedIds.clear();syncSelection();};
    new MutationObserver(()=>{if(!root.classList.contains('active'))root._resetListSelection();}).observe(root,{attributes:true,attributeFilter:['class']});
    root.innerHTML='<div class="qce-page">'+head('변경관리','원료·공급사·Recipe·공정조건·설비·Spec 변경을 승인 이력으로 관리합니다.')+'<div class="qce-shell"><div class="qce-toolbar"><div class="left"><input class="qce-input qce-change-q" placeholder="변경번호 / 제목 / 대상 검색"></div><div class="right"><button class="qce-btn qce-change-search">조회</button><button class="qce-btn primary qce-change-new">+ 변경 등록</button></div></div><div class="qce-change-body"><div class="qce-empty">조회 중...</div></div></div></div>';
    const paint=rows=>{
        root._changeRows=rows;
        const body=root.querySelector('.qce-change-body');
        body.innerHTML='<div style="overflow:auto"><table class="qce-table"><colgroup><col style="width:34px"><col style="width:4%"><col style="width:14%"><col style="width:8%"><col style="width:24%"><col style="width:16%"><col style="width:9%"><col style="width:11%"><col style="width:7%"><col style="width:7%"></colgroup><thead><tr><th><input type="checkbox" class="qce-change-select-all" aria-label="변경관리 전체 선택"></th><th>No.</th><th>변경번호</th><th>구분</th><th>제목</th><th>대상</th><th>담당자</th><th>적용예정일</th><th>상태</th><th>처리</th></tr></thead><tbody>'+(
          rows.length?rows.map((r,i)=>'<tr><td><input type="checkbox" class="qce-change-row-select" value="'+esc(r.id)+'" aria-label="'+esc(r.change_no||r.title)+' 선택"></td><td>'+(i+1)+'</td><td>'+esc(r.change_no||'-')+'</td><td>'+esc(r.change_type)+'</td><td>'+esc(r.title)+'</td><td>'+esc(r.target||'-')+'</td><td>'+esc(r.owner||'-')+'</td><td>'+esc(String(r.planned_on||'').slice(0,10)||'-')+'</td><td><span class="qce-badge '+(r.status==='적용완료'?'ok':r.status==='승인완료'?'ok':r.status==='작성중'?'warn':'')+'">'+esc(r.status)+'</span></td><td>'+(
            r.status==='작성중'?'<button class="qce-btn" data-action="review" data-id="'+r.id+'">검토완료</button>':r.status==='검토완료'?'<button class="qce-btn" data-action="approve" data-id="'+r.id+'">승인완료</button>':r.status==='승인완료'?'<button class="qce-btn" data-action="close" data-id="'+r.id+'">적용완료</button>':'-'
          )+' <button type="button" class="qce-btn" data-change-edit="'+esc(r.id)+'">수정</button></td></tr>').join(''):'<tr><td colspan="10">등록된 변경이 없습니다.</td></tr>'
        )+'</tbody></table></div>';
        body.querySelectorAll('.qce-change-row-select').forEach(box=>box.onchange=()=>{box.checked?selectedIds.add(box.value):selectedIds.delete(box.value);syncSelection();});
        const all=body.querySelector('.qce-change-select-all');if(all)all.onchange=()=>{body.querySelectorAll('.qce-change-row-select').forEach(box=>all.checked?selectedIds.add(box.value):selectedIds.delete(box.value));syncSelection();};
        body.querySelectorAll('[data-change-edit]').forEach(button=>button.onclick=()=>{const record=rows.find(row=>String(row.id)===button.dataset.changeEdit);if(record)openChange(record);});
        syncSelection();
        body.querySelectorAll('[data-action]').forEach(b=>b.onclick=async()=>{try{await api('/api/qmes-change/'+b.dataset.id+'/action',{method:'POST',body:JSON.stringify({action:b.dataset.action})});toast('변경 상태가 처리되었습니다.');changeQueries.clear();load(true);}catch(e){toast(e.message);}});

    };
    const load=async(force=false)=>{
      const q=root.querySelector('.qce-change-q')?.value||'';
      let entry=changeQueries.get(q);
      if(!entry){entry={rows:null,at:0,promise:null};changeQueries.set(q,entry);}
      if(entry.rows!==null)paint(entry.rows);
      else if(!root.querySelector('.qce-change-body table'))paint([]);
      if(force!==true&&entry.rows!==null&&Date.now()-entry.at<30000)return;
      try{
        if(!entry.promise)entry.promise=api('/api/qmes-change?q='+encodeURIComponent(q))
          .then(rows=>{entry.rows=rows;entry.at=Date.now();return rows;})
          .finally(()=>{entry.promise=null;});
        const rows=await entry.promise;
        if((root.querySelector('.qce-change-q')?.value||'')===q)paint(rows);
      }catch(e){
        if((root.querySelector('.qce-change-q')?.value||'')!==q)return;
        const body=root.querySelector('.qce-change-body');
        let status=body.querySelector('.change-load-status');
        if(!status){status=document.createElement('div');status.className='change-load-status';status.setAttribute('role','status');body.appendChild(status);}
        status.textContent=e.message;
      }
    };

    const dock=document.createElement('div');dock.className='qce-instrument-selection-dock';dock.setAttribute('role','toolbar');dock.setAttribute('aria-label','변경관리 선택 항목 작업');dock.setAttribute('aria-hidden','true');dock.inert=true;
    dock.innerHTML='<span class="qce-instrument-selection-count" aria-live="polite">0건 선택됨</span><div><button type="button" data-inst-selected-print>선택 인쇄</button><button type="button" data-inst-selected-delete>선택 삭제</button></div>';root.append(dock);
    dock.querySelector('[data-inst-selected-delete]').onclick=async function(){
      const ids=(root._changeRows||[]).filter(row=>selectedIds.has(String(row.id))).map(row=>row.id);if(!ids.length)return;
      if(!await window.qmesConfirm('선택한 변경건 '+ids.length+'건을 삭제하시겠습니까?',{title:'선택 삭제',acceptText:'삭제'}))return;
      this.disabled=true;
      try{const result=await api('/api/qmes-change/bulk-delete',{method:'POST',body:JSON.stringify({ids})});changeQueries.clear();root._resetListSelection();await load(true);toast('변경건 '+result.deleted_count+'건이 삭제되었습니다.');}catch(e){toast(e.message);}finally{this.disabled=false;}
    };
    dock.querySelector('[data-inst-selected-print]').onclick=async()=>{
      const records=(root._changeRows||[]).filter(row=>selectedIds.has(String(row.id)));if(!records.length)return;
      if(!await window.qmesConfirm('선택한 변경건 '+records.length+'건을 인쇄하시겠습니까?',{title:'선택 인쇄',acceptText:'인쇄'}))return;
      const frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-20000px;top:0;width:1000px;height:700px;border:0';frame.setAttribute('aria-hidden','true');
      frame.onload=async()=>{if(!frame.contentDocument?.querySelector('table'))return;await frame.contentDocument.fonts.ready;frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();};
      frame.srcdoc='<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>변경관리</title><style>@page{size:A4 landscape;margin:12mm}body{font:11px "Malgun Gothic",sans-serif;color:#172b44}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccd8e4;padding:7px;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#e8f1f9;text-align:center}</style></head><body><h1>변경관리</h1><table><thead><tr>'+['No.','변경번호','구분','제목','대상','담당자','적용예정일','상태','현재 기준','변경 후 기준','변경사유','영향평가'].map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+records.map((r,i)=>'<tr>'+[i+1,r.change_no,r.change_type,r.title,r.target,r.owner,String(r.planned_on||'').slice(0,10),r.status,r.current_value,r.proposed_value,r.reason,r.impact].map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';document.body.append(frame);
    };
    window.addEventListener('resize',syncSelection);

    root._changeLoad=load;
    root.querySelector('.qce-change-search').onclick=()=>load(true);
    root.querySelector('.qce-change-q').addEventListener('keydown',e=>{if(e.key==='Enter')load(true);});
    function openChange(record=null){const bg=modal(record?'변경 수정':'변경 등록','<div class="qce-form qce-change-form">'+
      '<div class="qce-field"><label>변경구분</label><select data-k="change_type"><option>원료 변경</option><option>공급사 변경</option><option>Recipe 변경</option><option>공정조건 변경</option><option>설비 변경</option><option>Spec 변경</option></select></div>'+
      '<div class="qce-field"><label>변경제목</label><input data-k="title"></div>'+
      '<div class="qce-field"><label>변경대상</label><input data-k="target"></div><div class="qce-field"><label>담당자</label><input data-k="owner"></div>'+
      '<div class="qce-field"><label>적용예정일</label><input data-k="planned_on" type="date"></div><div class="qce-field"><label>현재 기준</label><input data-k="current_value"></div>'+
      '<div class="qce-field full"><label>변경 후 기준</label><textarea data-k="proposed_value"></textarea></div><div class="qce-field full"><label>변경사유</label><textarea data-k="reason"></textarea></div><div class="qce-field full"><label>영향평가</label><textarea data-k="impact"></textarea></div></div>',
      async bg=>{await api(record?'/api/qmes-change/'+record.id:'/api/qmes-change',{method:record?'PATCH':'POST',body:JSON.stringify({change_type:val(bg,'change_type'),title:val(bg,'title'),target:val(bg,'target'),owner:val(bg,'owner'),planned_on:val(bg,'planned_on'),current_value:val(bg,'current_value'),proposed_value:val(bg,'proposed_value'),reason:val(bg,'reason'),impact:val(bg,'impact')})});toast(record?'변경건이 수정되었습니다.':'변경건이 등록되었습니다.');changeQueries.clear();load(true);}
    );
      if(record)bg.querySelectorAll('[data-k]').forEach(input=>{const key=input.dataset.k,value=key==='planned_on'?String(record[key]||'').slice(0,10):String(record[key]??'');if(input.tagName==='SELECT'&&value&&![...input.options].some(option=>option.value===value))input.add(new Option(value,value));input.value=value;});
    }
    root.querySelector('.qce-change-new').onclick=()=>openChange();
    load();
  }

  const instrumentQueries=new Map();
  function renderInstrument(){
    const root=document.getElementById('instrumentMgmt');if(!root)return;
    if(root._instrumentLoad&&root.querySelector('.qce-inst-body')){root._instrumentLoad();return;}
    const selectedIds=new Set();
    const syncSelection=()=>{
      const boxes=Array.from(root.querySelectorAll('.qce-inst-row-select')),all=root.querySelector('.qce-inst-select-all');
      boxes.forEach(box=>{box.checked=selectedIds.has(box.value);box.closest('tr').classList.toggle('qce-inst-selected',box.checked);});
      if(all){all.checked=boxes.length>0&&boxes.every(box=>box.checked);all.indeterminate=boxes.some(box=>box.checked)&&!all.checked;}
      const dock=root.querySelector('.qce-instrument-selection-dock');
      if(dock){
        const count=selectedIds.size;dock.classList.toggle('is-visible',count>0);dock.inert=!count;dock.setAttribute('aria-hidden',count?'false':'true');
        dock.querySelector('.qce-instrument-selection-count').textContent=count+'건 선택됨';
        dock.querySelector('[data-inst-selected-print]').textContent='선택 인쇄 ('+count+')';
        dock.querySelector('[data-inst-selected-delete]').textContent='선택 삭제 ('+count+')';
        const bounds=(root.querySelector('.qce-page')||root).getBoundingClientRect();
        if(bounds.width){dock.style.left=Math.max(12,bounds.left)+'px';dock.style.right=Math.max(12,innerWidth-bounds.right)+'px';}
      }
    };
    root._resetListSelection=()=>{selectedIds.clear();syncSelection();};
    new MutationObserver(()=>{if(!root.classList.contains('active'))root._resetListSelection();}).observe(root,{attributes:true,attributeFilter:['class']});
    root.innerHTML='<div class="qce-page">'+head('계측기관리','검사계측기와 차기 검교정 일정을 관리합니다.')+'<div class="qce-shell"><div class="qce-toolbar"><div class="left"><input class="qce-input qce-inst-q" placeholder="관리번호 / 계측기명 / 모델 검색"></div><div class="right"><button class="qce-btn qce-inst-search">조회</button><button class="qce-btn primary qce-inst-new">+ 계측기 등록</button></div></div><div class="qce-inst-body"><div class="qce-empty">조회 중...</div></div></div></div>';
    const dock=document.createElement('div');dock.className='qce-instrument-selection-dock';dock.setAttribute('role','toolbar');dock.setAttribute('aria-label','계측기 선택 항목 작업');dock.setAttribute('aria-hidden','true');dock.inert=true;
    dock.innerHTML='<span class="qce-instrument-selection-count" aria-live="polite">0건 선택됨</span><div><button type="button" data-inst-selected-print>선택 인쇄</button><button type="button" data-inst-selected-delete>선택 삭제</button></div>';
    root.appendChild(dock);

    dock.querySelector('[data-inst-selected-delete]').onclick=async function(){
      const ids=(root._instrumentRows||[]).filter(row=>selectedIds.has(String(row.id))).map(row=>row.id);
      if(!ids.length)return;
      const message='선택한 계측기 '+ids.length+'건을 삭제하시겠습니까?';
      const confirmed=typeof window.qmesConfirm==='function'?await window.qmesConfirm(message):window.confirm(message);
      if(!confirmed)return;
      this.disabled=true;
      try{
        const result=await api('/api/qmes-instruments/bulk-delete',{method:'POST',body:JSON.stringify({ids})});
        instrumentQueries.clear();root._resetListSelection();await load(true);
        toast('계측기 '+result.deleted_count+'건이 삭제되었습니다.');
      }catch(error){toast(error.message);}finally{this.disabled=false;}
    };
    dock.querySelector('[data-inst-selected-print]').onclick=async()=>{
      const records=(root._instrumentRows||[]).filter(row=>selectedIds.has(String(row.id)));
      if(!records.length)return;
      if(typeof window.qmesConfirm==='function'&&!await window.qmesConfirm('선택한 계측기 '+records.length+'건을 인쇄하시겠습니까?'))return;
      const frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-20000px;top:0;width:1000px;height:700px;border:0';frame.setAttribute('aria-hidden','true');
      frame.onload=async()=>{if(!frame.contentDocument?.querySelector('table'))return;await frame.contentDocument.fonts.ready;frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.focus();frame.contentWindow.print();};
      document.body.appendChild(frame);
      frame.srcdoc='<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>계측기관리</title><style>@page{size:A4 landscape;margin:12mm}body{font:11px Arial,sans-serif;color:#172b44}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d5dce5;padding:7px;text-align:center}th{background:#e8f0f8}</style></head><body><h1>계측기관리</h1><table><thead><tr><th>관리번호</th><th>계측기명</th><th>사용 범위</th><th>제조사 / 모델</th><th>Serial No.</th><th>사용부서</th><th>최종 검교정일</th><th>차기 검교정일</th><th>상태</th></tr></thead><tbody>'+records.map(row=>'<tr>'+[row.instrument_no,row.instrument_name,row.use_range,[row.maker,row.model].filter(Boolean).join(' / '),row.serial_no,row.department,String(row.last_calibration_on||'').slice(0,10),String(row.next_calibration_on||'').slice(0,10),row.status].map(value=>'<td>'+esc(value||'-')+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';
      setTimeout(()=>frame.remove(),120000);
    };
    new ResizeObserver(syncSelection).observe(root);
    const paint=rows=>{
        root._instrumentRows=rows;
        rows.filter(row=>String(row.id)==='1'||row.photo_updated_at).forEach(row=>prepareInstrumentPhoto(row).catch(()=>{}));
        root.querySelector('.qce-inst-body').innerHTML='<div style="overflow:auto"><table class="qce-table"><colgroup><col style="width:34px"><col style="width:52px"><col><col><col><col><col><col><col><col><col><col></colgroup><thead><tr><th><input type="checkbox" class="qce-inst-select-all" aria-label="계측기 전체 선택"></th><th>No.</th><th>관리번호</th><th>계측기명</th><th>사용 범위</th><th>제조사 / 모델</th><th>Serial No.</th><th>사용부서</th><th>최종 검교정일</th><th>차기 검교정일</th><th>상태</th><th>검교정</th></tr></thead><tbody>'+(
          rows.length?rows.map((r,i)=>'<tr><td><input type="checkbox" class="qce-inst-row-select" value="'+esc(r.id)+'" aria-label="'+esc(r.instrument_no||r.instrument_name)+' 선택"></td><td>'+(i+1)+'</td><td>'+esc(r.instrument_no||'-')+'</td><td>'+((String(r.id)==='1'||r.photo_updated_at)?'<button type="button" class="qce-instrument-photo-link" data-inst-photo="'+r.id+'">'+esc(r.instrument_name)+'</button>':esc(r.instrument_name))+'</td><td>'+esc(r.use_range||'-')+'</td><td>'+esc([r.maker,r.model].filter(Boolean).join(' / ')||'-')+'</td><td>'+esc(r.serial_no||'-')+'</td><td>'+esc(r.department||'-')+'</td><td>'+esc(String(r.last_calibration_on||'').slice(0,10)||'-')+'</td><td>'+esc(String(r.next_calibration_on||'').slice(0,10)||'-')+'</td><td><span class="qce-badge '+(r.status==='사용'?'ok':'bad')+'">'+esc(r.status)+'</span></td><td><button class="qce-btn" data-cal="'+r.id+'">등록</button> <button class="qce-btn" data-inst-edit="'+r.id+'">수정</button></td></tr>').join(''):'<tr><td colspan="12">등록된 계측기가 없습니다.</td></tr>'
        )+'</tbody></table></div>';
        root.querySelector('.qce-inst-select-all').onchange=event=>{
          root.querySelectorAll('.qce-inst-row-select').forEach(box=>{if(event.target.checked)selectedIds.add(box.value);else selectedIds.delete(box.value);});syncSelection();
        };
        root.querySelectorAll('.qce-inst-row-select').forEach(box=>box.onchange=()=>{if(box.checked)selectedIds.add(box.value);else selectedIds.delete(box.value);syncSelection();});
        syncSelection();
        root.querySelectorAll('[data-inst-photo]').forEach(button=>button.onclick=()=>openInstrumentPhoto(rows.find(row=>String(row.id)===button.dataset.instPhoto)));
        root.querySelectorAll('[data-inst-edit]').forEach(button=>button.onclick=()=>root._openInstrument(rows.find(row=>String(row.id)===button.dataset.instEdit)));
        root.querySelectorAll('[data-cal]').forEach(b=>b.onclick=()=>openCalibration(rows.find(x=>String(x.id)===String(b.dataset.cal)),()=>{instrumentQueries.clear();load(true);}));

    };
    const load=async(force=false)=>{
      const q=root.querySelector('.qce-inst-q')?.value||'';
      let entry=instrumentQueries.get(q);
      if(!entry){entry={rows:null,at:0,promise:null};instrumentQueries.set(q,entry);}
      if(entry.rows!==null)paint(entry.rows);
      else if(!root.querySelector('.qce-inst-body table'))paint([]);
      if(force!==true&&entry.rows!==null&&Date.now()-entry.at<30000)return;
      try{
        if(!entry.promise)entry.promise=api('/api/qmes-instruments?q='+encodeURIComponent(q))
          .then(rows=>{entry.rows=rows;entry.at=Date.now();return rows;})
          .finally(()=>{entry.promise=null;});
        const rows=await entry.promise;
        if((root.querySelector('.qce-inst-q')?.value||'')===q)paint(rows);
      }catch(e){
        if((root.querySelector('.qce-inst-q')?.value||'')!==q)return;
        const body=root.querySelector('.qce-inst-body');
        let status=body.querySelector('.instrument-load-status');
        if(!status){status=document.createElement('div');status.className='instrument-load-status';status.setAttribute('role','status');body.appendChild(status);}
        status.textContent=e.message;
      }
    };
    root._instrumentLoad=load;
    root.querySelector('.qce-inst-search').onclick=()=>{root._resetListSelection();load(true);};
    root.querySelector('.qce-inst-q').addEventListener('keydown',e=>{if(e.key==='Enter'){root._resetListSelection();load(true);}});
    const openInstrument=(record=null)=>{
      modal(record?'계측기 수정':'계측기 등록','<div class="qce-form qce-instrument-form">'+
      '<div class="qce-field"><label>계측기명</label><input data-k="instrument_name"></div><div class="qce-field"><label>사용 범위</label><input data-k="use_range" placeholder="예: 0~250 ℃"></div><div class="qce-field"><label>제조사</label><input data-k="maker"></div>'+
      '<div class="qce-field"><label>모델</label><input data-k="model"></div><div class="qce-field"><label>Serial No.</label><input data-k="serial_no"></div>'+
      '<div class="qce-field"><label>사용부서</label><div class="qce-department-picker"><input type="hidden" data-k="department"><details><summary>부서 선택</summary><div class="qce-department-options"><label><input type="checkbox" value="연구소"><span>연구소</span></label><label><input type="checkbox" value="품질부"><span>품질부</span></label><label><input type="checkbox" value="생산부"><span>생산부</span></label></div></details></div></div><div class="qce-field"><label>설치위치</label><input data-k="location"></div>'+
      '<div class="qce-field"><label>검교정주기(개월)</label><input data-k="calibration_cycle_months" type="number" value="12"></div><div class="qce-field"><label>차기 검교정일</label><input data-k="next_calibration_on" type="date"></div>'+
      '<div class="qce-field"><label>최종 검교정일</label><input data-k="last_calibration_on" type="date"></div><div class="qce-field"><label>상태</label><select data-k="status"><option>사용</option><option>사용중지</option></select></div>'+
      '<div class="qce-field"><label>사진 첨부</label><div><input type="file" class="qce-instrument-photo-file" accept="image/png,image/jpeg,image/webp"></div></div><div class="qce-field full"><label>비고</label><textarea data-k="note"></textarea></div></div>',
      async bg=>{const file=bg.querySelector('.qce-instrument-photo-file')?.files[0];if(file&&(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024))throw Error('5MB 이하의 PNG, JPG, WebP 사진을 선택하세요.');const saved=await api(record?'/api/qmes-instruments/'+record.id:'/api/qmes-instruments',{method:record?'PATCH':'POST',body:JSON.stringify({instrument_name:val(bg,'instrument_name'),use_range:val(bg,'use_range'),maker:val(bg,'maker'),model:val(bg,'model'),serial_no:val(bg,'serial_no'),department:val(bg,'department'),location:val(bg,'location'),calibration_cycle_months:val(bg,'calibration_cycle_months'),status:val(bg,'status'),last_calibration_on:val(bg,'last_calibration_on'),next_calibration_on:val(bg,'next_calibration_on'),note:val(bg,'note')})});const editing=!!record;record=saved;
        if(file){const response=await fetch('/api/qmes-instruments/'+saved.id+'/photo',{method:'POST',credentials:'same-origin',headers:{'Content-Type':file.type},body:await file.arrayBuffer()});const result=await response.json();if(!response.ok||result.success===false)throw Error(result.message||'사진 저장 실패');}
        toast(editing?'계측기가 수정되었습니다.':'계측기가 등록되었습니다.');calibrationRows=null;calibrationAt=0;instrumentQueries.clear();load(true);}
    );
      if(record){
        const dialog=document.querySelector('.qce-modal-bg:last-of-type');
        if(dialog)dialog.querySelectorAll('[data-k]').forEach(input=>{
          const value=record[input.dataset.k];
          input.value=value==null?'':input.type==='date'?String(value).slice(0,10):String(value);
        });
      }
      const picker=document.querySelector('.qce-modal-bg:last-of-type .qce-department-picker');
      if(picker){
        const input=picker.querySelector('[data-k="department"]'),options=picker.querySelector('.qce-department-options');
        const saved=String(input.value||'').split(/[,，/·]+/).map(v=>v.trim()).filter(Boolean);
        saved.forEach(name=>{
          if(!Array.from(options.querySelectorAll('input')).some(box=>box.value===name)){
            const label=document.createElement('label'),box=document.createElement('input'),text=document.createElement('span');
            box.type='checkbox';box.value=name;text.textContent=name;label.append(box,text);options.appendChild(label);
          }
        });
        options.querySelectorAll('input').forEach(box=>{box.checked=saved.includes(box.value);});
        const sync=()=>{
          const selected=Array.from(options.querySelectorAll('input:checked')).map(box=>box.value);
          input.value=selected.join(', ');picker.querySelector('summary').textContent=selected.join(', ')||'부서 선택';
        };
        options.addEventListener('change',sync);sync();
      }
    };
    root._openInstrument=openInstrument;
    root.querySelector('.qce-inst-new').onclick=()=>openInstrument();
    load();
  }



  const instrumentPhotoCache=new Map();
  function prepareInstrumentPhoto(record){
    const src=record.photo_updated_at?'/api/qmes-instruments/'+record.id+'/photo?v='+encodeURIComponent(record.photo_updated_at):String(record.id)==='1'?'/assets/instruments/nm-measure-01.svg':'';
    if(!src)return Promise.reject(Error('등록된 사진이 없습니다.'));
    if(!instrumentPhotoCache.has(src)){
      const image=new Image();image.alt=record.instrument_name+' 계측기 사진';image.width=502;image.height=563;
      const ready=new Promise((resolve,reject)=>{image.onload=()=>{(image.decode?image.decode():Promise.resolve()).catch(()=>{}).then(()=>resolve(image));};image.onerror=()=>{instrumentPhotoCache.delete(src);reject(Error('사진을 불러오지 못했습니다.'));};});
      image.src=src;instrumentPhotoCache.set(src,ready);
    }
    return instrumentPhotoCache.get(src);
  }
  let instrumentPhotoOpenToken=0;
  async function openInstrumentPhoto(record){
    if(!record)return;
    const token=++instrumentPhotoOpenToken;
    let image;try{image=await prepareInstrumentPhoto(record);}catch(error){toast(error.message);return;}
    if(token!==instrumentPhotoOpenToken)return;
    document.querySelector('.qce-instrument-photo-dialog')?.close();
    const dialog=document.createElement('dialog');dialog.className='qce-instrument-photo-dialog';
    dialog.innerHTML='<div class="qce-instrument-photo-head"><strong>'+esc(record.instrument_name)+' · '+esc(record.instrument_no||'')+'</strong><button type="button" aria-label="사진 닫기">닫기</button></div>';
    dialog.appendChild(image);document.body.appendChild(dialog);
    dialog.querySelector('button').onclick=()=>dialog.close();
    dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
  }

  function openCalibration(row,reload){
    if(!row)return;
    modal('검교정 등록 · '+row.instrument_name,'<div class="qce-form"><div class="qce-field"><label>검교정일</label><input data-k="calibration_on" type="date"></div><div class="qce-field"><label>차기예정일</label><input data-k="next_due_on" type="date"></div><div class="qce-field"><label>교정기관</label><input data-k="agency"></div><div class="qce-field"><label>성적서번호</label><input data-k="certificate_no"></div><div class="qce-field"><label>결과</label><select data-k="result"><option>적합</option><option>부적합</option></select></div><div class="qce-field full"><label>비고</label><textarea data-k="note"></textarea></div></div>',
      async bg=>{await api('/api/qmes-calibrations',{method:'POST',body:JSON.stringify({instrument_id:row.id,calibration_on:val(bg,'calibration_on'),next_due_on:val(bg,'next_due_on'),agency:val(bg,'agency'),certificate_no:val(bg,'certificate_no'),result:val(bg,'result'),note:val(bg,'note')})});toast('검교정 이력이 등록되었습니다.');calibrationRows=null;calibrationAt=0;document.getElementById('calibrationMgmt')?._calibrationLoad?.(true);reload();}
    );
  }

  let calibrationRows=null,calibrationAt=0,calibrationPromise=null;
  function renderCalibration(){
    const root=document.getElementById('calibrationMgmt');if(!root)return;
    if(root._calibrationLoad&&root.querySelector('.qce-cal-body')){root._calibrationLoad();return;}
    root.innerHTML='<div class="qce-page">'+head('검교정관리','계측기별 검교정 이력과 차기 일정을 확인합니다.')+'<div class="qce-shell"><div class="qce-toolbar"><div class="left"></div><div class="right"><button class="qce-btn qce-cal-refresh">조회</button></div></div><div class="qce-cal-body"><div class="qce-empty">조회 중...</div></div></div></div>';
    const paint=rows=>{root.querySelector('.qce-cal-body').innerHTML='<div style="overflow:auto"><table class="qce-table"><colgroup><col style="width:4%"><col style="width:13%"><col style="width:21%"><col style="width:12%"><col style="width:12%"><col style="width:14%"><col style="width:14%"><col style="width:5%"><col style="width:5%"></colgroup><thead><tr><th>No.</th><th>관리번호</th><th>계측기명</th><th>검교정일</th><th>차기예정일</th><th>교정기관</th><th>성적서번호</th><th>결과</th><th>작성자</th></tr></thead><tbody>'+(rows.length?rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.instrument_no||'-')+'</td><td>'+esc(r.instrument_name)+'</td><td>'+esc(String(r.calibration_on||'').slice(0,10))+'</td><td>'+esc(String(r.next_due_on||'').slice(0,10)||'-')+'</td><td>'+esc(r.agency||'-')+'</td><td>'+esc(r.certificate_no||'-')+'</td><td><span class="qce-badge '+(r.result==='적합'?'ok':'bad')+'">'+esc(r.result)+'</span></td><td>'+esc(r.created_by||'-')+'</td></tr>').join(''):'<tr><td colspan="9">등록된 검교정 이력이 없습니다.</td></tr>')+'</tbody></table></div>';};
    const load=async(force=false)=>{
      paint(calibrationRows||[]);
      if(force!==true&&calibrationRows!==null&&Date.now()-calibrationAt<30000)return;
      try{
        if(!calibrationPromise)calibrationPromise=api('/api/qmes-calibrations')
          .then(rows=>{calibrationRows=rows;calibrationAt=Date.now();return rows;})
          .finally(()=>{calibrationPromise=null;});
        paint(await calibrationPromise);
      }catch(e){
        const body=root.querySelector('.qce-cal-body');
        let status=body.querySelector('.calibration-load-status');
        if(!status){status=document.createElement('div');status.className='calibration-load-status';status.setAttribute('role','status');body.appendChild(status);}
        status.textContent=e.message;
      }
    };
    root._calibrationLoad=load;
    root.querySelector('.qce-cal-refresh').onclick=()=>load(true);load();
  }

  function init(){
    renderSpc();renderChange();renderInstrument();renderCalibration();
    document.querySelectorAll('.menu[data-page="spcTrend"]').forEach(m=>{
      m.addEventListener('click',renderSpc);
      m.addEventListener('pointerenter',()=>{if(spcRows===null||Date.now()-spcLoadedAt>30000)refreshSpc();});
      m.addEventListener('focusin',()=>{if(spcRows===null||Date.now()-spcLoadedAt>30000)refreshSpc();});
    });
    const authUser=document.getElementById('currentUser');
    if(authUser)new MutationObserver(()=>{
      if(authUser.dataset.qauthReady==='1'){refreshSpc();changeQueries.clear();document.getElementById('changeControl')?._changeLoad?.(true);instrumentQueries.clear();document.getElementById('instrumentMgmt')?._instrumentLoad?.(true);calibrationRows=null;calibrationAt=0;document.getElementById('calibrationMgmt')?._calibrationLoad?.(true);}
    }).observe(authUser,{attributes:true,attributeFilter:['data-qauth-ready']});
    document.querySelectorAll('.menu[data-page="changeControl"]').forEach(m=>{
      m.addEventListener('click',renderChange);
      m.addEventListener('pointerenter',()=>document.getElementById('changeControl')?._changeLoad?.());
      m.addEventListener('focusin',()=>document.getElementById('changeControl')?._changeLoad?.());
    });
    document.querySelectorAll('.menu[data-page="instrumentMgmt"]').forEach(m=>{
      m.addEventListener('click',renderInstrument);
      m.addEventListener('pointerenter',()=>document.getElementById('instrumentMgmt')?._instrumentLoad?.());
      m.addEventListener('focusin',()=>document.getElementById('instrumentMgmt')?._instrumentLoad?.());
    });
    document.querySelectorAll('.menu[data-page="calibrationMgmt"]').forEach(m=>{
      m.addEventListener('click',renderCalibration);
      m.addEventListener('pointerenter',()=>document.getElementById('calibrationMgmt')?._calibrationLoad?.());
      m.addEventListener('focusin',()=>document.getElementById('calibrationMgmt')?._calibrationLoad?.());
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();