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
      const date=String(row.date||row.inspectionDate||'').slice(0,10);
      const lot=String(row.lot||row.finishedLot||row.productionLot||'');
      const product=String(row.product||row.productName||row.detailFields?.['제품명']||'');
      const m=row.measurements||{};
      for(const [item,values] of Object.entries(m)){
        if(!Array.isArray(values))continue;
        values.forEach((v,idx)=>{
          const n=Number(v);
          if(Number.isFinite(n))out.push({source,date,lot,product,item,value:n,seq:idx+1});
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
  function trendSvg(values,item){
    const data=values.slice(-60);if(!data.length)return '<div class="qce-empty">측정 데이터가 없습니다.</div>';
    const w=1000,h=230,p=38,nums=data.map(x=>x.value),spec=specFor(item);
    let min=Math.min(...nums),max=Math.max(...nums);
    if(spec.lsl!=null)min=Math.min(min,spec.lsl);if(spec.usl!=null)max=Math.max(max,spec.usl);
    if(max===min){max+=1;min-=1;}
    const x=i=>p+(i*(w-p*2)/Math.max(1,data.length-1));
    const y=v=>h-p-((v-min)/(max-min))*(h-p*2);
    const pts=data.map((d,i)=>x(i)+','+y(d.value)).join(' ');
    const lines=[];
    if(spec.usl!=null)lines.push('<line x1="'+p+'" y1="'+y(spec.usl)+'" x2="'+(w-p)+'" y2="'+y(spec.usl)+'" stroke="currentColor" stroke-dasharray="6 5" opacity=".45"/><text x="'+(w-p-55)+'" y="'+(y(spec.usl)-5)+'">USL '+spec.usl+'</text>');
    if(spec.lsl!=null)lines.push('<line x1="'+p+'" y1="'+y(spec.lsl)+'" x2="'+(w-p)+'" y2="'+y(spec.lsl)+'" stroke="currentColor" stroke-dasharray="6 5" opacity=".45"/><text x="'+(w-p-55)+'" y="'+(y(spec.lsl)-5)+'">LSL '+spec.lsl+'</text>');
    const dots=data.map((d,i)=>'<circle cx="'+x(i)+'" cy="'+y(d.value)+'" r="3"><title>'+esc((d.date||'')+' '+(d.lot||'')+' '+d.value)+'</title></circle>').join('');
    return '<svg class="qce-svg" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><line x1="'+p+'" y1="'+p+'" x2="'+p+'" y2="'+(h-p)+'" stroke="#cfd8e3"/><line x1="'+p+'" y1="'+(h-p)+'" x2="'+(w-p)+'" y2="'+(h-p)+'" stroke="#cfd8e3"/>'+lines.join('')+'<polyline points="'+pts+'" fill="none" stroke="currentColor" stroke-width="2"/>'+dots+'</svg>';
  }

  async function renderSpc(){
    const root=document.getElementById('spcTrend');if(!root)return;
    root.innerHTML='<div class="qce-page">'+head('SPC / Trend','PQC·OQC 측정값을 기반으로 공정 추세와 공정능력을 확인합니다.')+'<div class="qce-shell"><div class="qce-empty">데이터를 불러오는 중입니다.</div></div></div>';
    try{
      const [pqc,oqc]=await Promise.all([syncRows('pqc'),syncRows('oqc')]);
      const all=[...flattenMeasurements(pqc,'PQC'),...flattenMeasurements(oqc,'OQC')];
      const items=[...new Set(all.map(x=>x.item))].filter(x=>['입도(Dmax)','입도','점도','고형분','수분율','수분','접착력'].includes(x));
      const selected=items.includes(root.dataset.spcItem)?root.dataset.spcItem:(items.includes('점도')?'점도':items[0]||'점도');
      root.dataset.spcItem=selected;
      const filtered=all.filter(x=>x.item===selected).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
      const st=stats(filtered,selected);
      root.innerHTML='<div class="qce-page">'+head('SPC / Trend','PQC·OQC 측정값을 자동 집계합니다. MSA 기능은 포함하지 않습니다.')+
        '<div class="qce-shell"><div class="qce-toolbar"><div class="left"><select class="qce-select qce-spc-item">'+(items.length?items:[selected]).map(x=>'<option '+(x===selected?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div><div class="right"><button class="qce-btn qce-spc-refresh">조회</button></div></div>'+
        '<div class="qce-kpis"><div class="qce-kpi"><b>측정수</b><strong>'+st.n+'</strong></div><div class="qce-kpi"><b>평균</b><strong>'+fmt(st.avg)+'</strong></div><div class="qce-kpi"><b>최소 / 최대</b><strong>'+fmt(st.min)+' / '+fmt(st.max)+'</strong></div><div class="qce-kpi"><b>Cp / Cpk</b><strong>'+(st.cp==null?'-':st.cp.toFixed(2))+' / '+(st.cpk==null?'-':st.cpk.toFixed(2))+'</strong></div></div>'+
        '<div class="qce-chart"><h3>'+esc(selected)+' Trend</h3><div class="qce-chart-wrap">'+trendSvg(filtered,selected)+'</div></div>'+
        '<div style="overflow:auto"><table class="qce-table"><thead><tr><th>No.</th><th>구분</th><th>검사일</th><th>제품명</th><th>LOT</th><th>측정값</th></tr></thead><tbody>'+filtered.slice().reverse().slice(0,100).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.source)+'</td><td>'+esc(r.date||'-')+'</td><td>'+esc(r.product||'-')+'</td><td>'+esc(r.lot||'-')+'</td><td>'+fmt(r.value)+'</td></tr>').join('')+'</tbody></table></div></div></div>';
      root.querySelector('.qce-spc-item')?.addEventListener('change',e=>{root.dataset.spcItem=e.target.value;renderSpc();});
      root.querySelector('.qce-spc-refresh')?.addEventListener('click',renderSpc);
    }catch(e){root.querySelector('.qce-shell').innerHTML='<div class="qce-empty">'+esc(e.message)+'</div>';}
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