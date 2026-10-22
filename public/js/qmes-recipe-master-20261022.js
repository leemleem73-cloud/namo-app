/* NAMO QMES Recipe master UI - 2026-10-22
 * Adds a chemical-manufacturing recipe revision screen under Standards.
 * Does not overwrite prior revisions. Work-order application only fills plan values.
 */
(function(){
  'use strict';
  if(window.__NAMO_RECIPE_UI_20261022__) return;
  window.__NAMO_RECIPE_UI_20261022__=true;

  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:3}):'-';};
  const req=async(url,opt={})=>{
    const r=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(opt.headers||{})},...opt});
    const p=await r.json().catch(()=>({success:false,message:'서버 응답 오류'}));
    if(!r.ok||!p.success) throw new Error(p.message||'요청 실패');
    return p.data;
  };
  const toast=msg=>typeof window.toast==='function'?window.toast(msg):alert(msg);

  const css=document.createElement('style');
  css.id='namo-recipe-ui-20261022';
  css.textContent=`
    #recipeMaster .page-head{display:none!important}
    #recipeMaster .module-shell{background:#fff;border:1px solid #d2dfed;border-radius:10px;box-shadow:0 8px 24px rgba(24,51,83,.075);overflow:hidden}
    #recipeMaster .nrecipe-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;width:100%;min-height:64px;padding:14px 22px;background:#fff;border-bottom:1px solid #dbe5ef;box-sizing:border-box}
    #recipeMaster .nrecipe-title{display:flex;align-items:center;gap:10px;color:#173b61;font-size:18px;font-weight:800;letter-spacing:-.4px}
    #recipeMaster .nrecipe-title:before{content:'';width:4px;height:24px;border-radius:3px;background:#1974bd}
    #recipeMaster .nrecipe-head-actions{display:flex;gap:6px}
    #recipeMaster .nrecipe-query{padding:20px 22px 18px;background:#f3f7fb;border-bottom:1px solid #dae5ef}
    #recipeMaster .nrecipe-grid-filter{display:grid;grid-template-columns:1.15fr 1.15fr .85fr 1fr 1.35fr;gap:12px;align-items:center}
    #recipeMaster .nrecipe-filter{display:flex;align-items:center;gap:7px;min-width:0;color:#334e6b;font-size:12px;font-weight:700}
    #recipeMaster .nrecipe-filter span{flex:0 0 auto;text-align:left;white-space:nowrap}
    #recipeMaster .nrecipe-filter input,#recipeMaster .nrecipe-filter select{height:38px;width:100%;min-width:0;padding:0 11px;border:1px solid #c7d6e5;border-radius:7px;background:#fff;color:#243e5d;font-size:13px}
    #recipeMaster .nrecipe-date-range{display:grid;grid-template-columns:1fr auto 1fr;gap:5px;align-items:center}
    #recipeMaster .nrecipe-query-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
    #recipeMaster .nrecipe-btn,.nrecipe-modal button{height:38px;border:1px solid #c7d6e5;border-radius:7px;background:#fff;color:#294763;font-weight:700;font-size:12.5px;padding:8px 15px;cursor:pointer}
    #recipeMaster .nrecipe-btn.primary,.nrecipe-modal .primary{background:#166fbb;color:#fff;border-color:#166fbb;box-shadow:0 2px 7px rgba(22,111,187,.16)}
    #recipeMaster .nrecipe-list-head{display:flex;align-items:center;justify-content:space-between;margin:0 16px;padding:17px 12px 14px;color:#1e3f64;font-size:13.5px;font-weight:800}
    #recipeMaster .nrecipe-count{font-size:12px;color:#607790;font-weight:700}
    #recipeMaster .nrecipe-bulk{display:none;align-items:center;gap:7px;padding:0 22px 12px}
    #recipeMaster .nrecipe-bulk.visible{display:flex}
    #recipeMaster .nrecipe-bulk .nrecipe-btn{height:32px;padding:0 11px;font-size:11.5px}
    #recipeMaster .nrecipe-table-wrap{margin:0 16px 16px;border:1px solid #d5dce5;overflow-x:auto;box-sizing:border-box;max-width:calc(100% - 32px)}
    #recipeMaster .nrecipe-table{width:100%;min-width:1250px;border-collapse:separate;border-spacing:0;table-layout:fixed;background:#fff}
    #recipeMaster .nrecipe-table th{height:34px;padding:6px 10px;background:#e8f0f8;color:#244260;font-size:12px;font-weight:600;text-align:center;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;white-space:nowrap}
    #recipeMaster .nrecipe-table td{height:46px;padding:8px 10px;background:#fff;color:#344054;font-size:12px;text-align:center;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #recipeMaster .nrecipe-table th:last-child,#recipeMaster .nrecipe-table td:last-child{border-right:0}
    #recipeMaster .nrecipe-table tbody tr:last-child td{border-bottom:0}
    #recipeMaster .nrecipe-table tbody tr:nth-child(even) td{background:#fcfdff}
    #recipeMaster .nrecipe-table tbody tr:hover td{background:#eef6ff}
    #recipeMaster .nrecipe-table tbody tr.selected td{background:#dcefff}
    #recipeMaster .nrecipe-check{width:16px;height:16px}
    #recipeMaster .nrecipe-link{border:0;background:none;color:#1689ed;text-decoration:underline;text-decoration-color:#1689ed;font-weight:700;cursor:pointer}
    #recipeMaster .nrecipe-active{display:inline-block;padding:3px 8px;border-radius:12px;background:#e9f7ef;color:#25865e;font-weight:700}
    #recipeMaster .nrecipe-old{display:inline-block;padding:3px 8px;border-radius:12px;background:#f0f3f7;color:#718094;font-weight:700}
    #recipeMaster .nrecipe-row-actions{display:inline-flex;gap:6px}
    #recipeMaster .nrecipe-row-actions button{height:28px;padding:0 9px;border:1px solid #cbd8e7;border-radius:5px;background:#f7faff;color:#315f94;font-size:11px;font-weight:700;cursor:pointer}
    #recipeMaster .nrecipe-row-actions button[data-row-delete]{color:#b42318;background:#fff7f6;border-color:#f1c6c2}
    #recipeMaster .nrecipe-pager{display:flex;justify-content:center;gap:4px;padding:2px 0 16px}
    #recipeMaster .nrecipe-page{min-width:30px;height:30px;border:1px solid #cbd8e7;border-radius:5px;background:#fff;color:#415a73;font-size:11px;cursor:pointer}
    #recipeMaster .nrecipe-page.active{background:#166fbb;color:#fff;border-color:#166fbb}
    .nrecipe-backdrop{position:fixed;inset:0;z-index:30000;background:rgba(16,33,52,.35);display:flex;align-items:center;justify-content:center;padding:30px}
    .nrecipe-modal{width:min(1080px,96vw);max-height:90vh;overflow:auto;background:#fff;border:1px solid #cbd8e5;box-shadow:0 18px 55px rgba(18,37,58,.25);border-radius:8px}
    .nrecipe-modal-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#e8f0f8;border-bottom:1px solid #cbd8e5;color:#244260}
    .nrecipe-modal-body{padding:14px}
    .nrecipe-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #d8e1eb;border-bottom:0}
    .nrecipe-field{display:grid;grid-template-columns:90px minmax(0,1fr);min-height:40px;border-right:1px solid #d8e1eb;border-bottom:1px solid #d8e1eb}
    .nrecipe-field:nth-child(4n){border-right:0}
    .nrecipe-field label{display:flex;align-items:center;justify-content:flex-end;padding:0 9px;background:#f6f8fa;color:#405267;font-size:10px;font-weight:800;border-right:1px solid #d8e1eb}
    .nrecipe-field input,.nrecipe-field textarea{margin:5px 7px;border:1px solid #cfd7df;border-radius:5px;padding:5px 7px;font-size:11px;min-width:0}
    .nrecipe-materials{width:100%;border-collapse:collapse;margin-top:14px}
    .nrecipe-materials th{background:#e8f0f8;color:#244260;font-size:10px;height:34px;border:1px solid #d3dce6}
    .nrecipe-materials td{border:1px solid #e1e7ed;padding:4px}
    .nrecipe-materials input{width:100%;box-sizing:border-box;height:28px;border:1px solid #cfd7df;padding:0 6px;font-size:11px}
    .nrecipe-actions{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
    .nrecipe-modal-foot{display:flex;justify-content:flex-end;gap:6px;padding:12px 16px;border-top:1px solid #d8e1eb}
    .nrecipe-readonly{background:#f8fafc}
    #work .nrecipe-work-badge{display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-size:10px;font-weight:700;color:#526b84}
    #work .nrecipe-apply{height:36px;border:1px solid #c7d6e5;border-radius:7px;background:#fff;color:#294763;font-weight:700;font-size:12px;padding:0 12px;cursor:pointer}
    @media(max-width:1250px){#recipeMaster .nrecipe-grid-filter{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:700px){#recipeMaster .nrecipe-grid-filter{grid-template-columns:1fr}.nrecipe-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(css);

  function ensureRecipePage(force=false){
    const section=document.getElementById('recipeMaster');
    if(!section) return;
    if(section.dataset.recipeBuilt==='1'&&!force) return;
    section.dataset.recipeBuilt='1';
    section.innerHTML=`
      <div class="module-shell">
        <div class="nrecipe-header">
          <div class="nrecipe-title">배합기준 등록 및 조회</div>
          <div class="nrecipe-head-actions">
            <button type="button" class="nrecipe-btn nrecipe-export">엑셀 내보내기</button>
            <button type="button" class="nrecipe-btn primary nrecipe-new">+ 신규 배합기준 등록</button>
          </div>
        </div>
        <div class="nrecipe-query">
          <div class="nrecipe-grid-filter">
            <label class="nrecipe-filter"><span>고객사명</span><input data-filter="customer" placeholder="전체"></label>
            <label class="nrecipe-filter"><span>제품명</span><input data-filter="product" placeholder="전체"></label>
            <label class="nrecipe-filter"><span>Rev.</span><input data-filter="revision" placeholder="전체"></label>
            <label class="nrecipe-filter"><span>상태</span><select data-filter="status"><option value="">전체</option><option value="ACTIVE">사용중</option><option value="OBSOLETE">과거 Rev.</option></select></label>
            <label class="nrecipe-filter"><span>적용기간</span><div class="nrecipe-date-range"><input data-filter="start" type="date"><span>~</span><input data-filter="end" type="date"></div></label>
          </div>
          <div class="nrecipe-query-actions">
            <button type="button" class="nrecipe-btn nrecipe-clear">조건 지우기</button>
            <button type="button" class="nrecipe-btn nrecipe-refresh">조회</button>
          </div>
        </div>
        <div class="nrecipe-list-head"><span>▸ 배합기준 현황</span><span class="nrecipe-count">총 0건</span></div>
        <div class="nrecipe-bulk">
          <button type="button" class="nrecipe-btn" data-bulk-print>선택 인쇄</button>
          <button type="button" class="nrecipe-btn" data-bulk-mail>선택 메일</button>
          <button type="button" class="nrecipe-btn" data-bulk-delete>선택 삭제</button>
        </div>
        <div class="nrecipe-table-wrap">
          <table class="nrecipe-table">
            <thead><tr>
              <th style="width:42px"><input type="checkbox" class="nrecipe-check nrecipe-check-all" aria-label="현재 페이지 전체 선택"></th>
              <th style="width:48px">No.</th>
              <th style="width:170px">고객사명</th>
              <th style="width:210px">제품명</th>
              <th style="width:80px">Rev.</th>
              <th style="width:120px">기준 생산량(kg)</th>
              <th style="width:105px">적용일</th>
              <th style="width:70px">원료수</th>
              <th style="width:85px">상태</th>
              <th style="width:200px">비고</th>
            </tr></thead>
            <tbody><tr><td colspan="10">배합기준을 불러오는 중입니다.</td></tr></tbody>
          </table>
        </div>
        <div class="nrecipe-pager"></div>
      </div>`;
    section.querySelector('.nrecipe-refresh').onclick=()=>loadRecipes(1);
    section.querySelector('.nrecipe-clear').onclick=()=>{section.querySelectorAll('[data-filter]').forEach(x=>x.value='');loadRecipes(1);};
    section.querySelector('.nrecipe-new').onclick=()=>openEditor();
    section.querySelector('.nrecipe-export').onclick=exportRecipeCsv;
    section.querySelectorAll('[data-filter]').forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter')loadRecipes(1);}));
    section.querySelector('.nrecipe-check-all').onchange=e=>{
      section.querySelectorAll('.nrecipe-row-check').forEach(x=>x.checked=e.target.checked);
      updateSelection(section);
    };
    section.querySelector('[data-bulk-print]').onclick=()=>bulkAction('print');
    section.querySelector('[data-bulk-mail]').onclick=()=>bulkAction('mail');
    section.querySelector('[data-bulk-delete]').onclick=()=>bulkAction('delete');
    loadRecipes(1);
  }

  function selectedIds(section=document.getElementById('recipeMaster')){
    return [...(section?.querySelectorAll('.nrecipe-row-check:checked')||[])].map(x=>x.dataset.id);
  }
  function updateSelection(section=document.getElementById('recipeMaster')){
    const ids=selectedIds(section);
    section?.querySelector('.nrecipe-bulk')?.classList.toggle('visible',ids.length>0);
    section?.querySelectorAll('tbody tr[data-id]').forEach(tr=>tr.classList.toggle('selected',tr.querySelector('.nrecipe-row-check')?.checked));
  }
  async function bulkAction(type){
    const section=document.getElementById('recipeMaster');const ids=selectedIds(section);
    if(!ids.length)return;
    if(type==='mail'){toast('선택한 배합기준 '+ids.length+'건 메일 발송 대상으로 선택했습니다.');return;}
    if(type==='print'){ids.forEach(id=>openDetail(id,true));return;}
    if(type==='delete'){
      if(!confirm('선택한 배합기준 '+ids.length+'건을 삭제하시겠습니까?'))return;
      for(const id of ids)await req('/api/qmes-recipes/'+encodeURIComponent(id),{method:'DELETE'});
      toast('선택한 배합기준을 삭제했습니다.');loadRecipes(1);
    }
  }

  function exportRecipeCsv(){
    const section=document.getElementById('recipeMaster');
    const rows=Array.isArray(section?._recipeRows)?section._recipeRows:[];
    if(!rows.length){toast('내보낼 배합기준이 없습니다.');return;}
    const csv=[['No.','고객사명','제품명','Rev.','기준 생산량(kg)','적용일','원료수','상태']];
    rows.forEach((r,i)=>csv.push([i+1,r.customer_name||'',r.product_name||'',r.revision||'',r.basis_qty||'',String(r.effective_on||'').slice(0,10),r.material_count||0,r.status==='ACTIVE'?'사용중':'과거 Rev.']));
    const text=csv.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob=new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='배합기준.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  async function loadRecipes(page=1){
    const section=document.getElementById('recipeMaster'), body=section?.querySelector('.nrecipe-table tbody');
    if(!body)return;
    body.innerHTML='<tr><td colspan="10">조회 중...</td></tr>';
    try{
      const params=new URLSearchParams();
      ['customer','product','revision','status','start','end'].forEach(k=>{const v=section.querySelector('[data-filter="'+k+'"]')?.value.trim();if(v)params.set(k,v);});
      const rows=await req('/api/qmes-recipes?'+params.toString());
      section._recipeRows=rows;
      const size=10,totalPages=Math.max(1,Math.ceil(rows.length/size));page=Math.min(Math.max(1,page),totalPages);
      section._recipePage=page;
      const list=rows.slice((page-1)*size,page*size);
      section.querySelector('.nrecipe-count').textContent='총 '+rows.length+'건';
      if(!list.length){body.innerHTML='<tr><td colspan="10">등록된 배합기준이 없습니다.</td></tr>';}
      else body.innerHTML=list.map((r,i)=>`<tr data-id="${r.id}">
        <td><input type="checkbox" class="nrecipe-check nrecipe-row-check" data-id="${r.id}"></td>
        <td>${(page-1)*size+i+1}</td>
        <td>${esc(r.customer_name||'-')}</td>
        <td><button type="button" class="nrecipe-link" data-id="${r.id}">${esc(r.product_name)}</button></td>
        <td>${esc(r.revision)}</td>
        <td>${fmt(r.basis_qty)}</td>
        <td>${esc(String(r.effective_on||'').slice(0,10)||'-')}</td>
        <td>${r.material_count||0}</td>
        <td><span class="${r.status==='ACTIVE'?'nrecipe-active':'nrecipe-old'}">${r.status==='ACTIVE'?'사용중':'과거 Rev.'}</span></td>
        <td><div class="nrecipe-row-actions"><button data-row-print="${r.id}">인쇄</button><button data-row-edit="${r.id}">수정</button><button data-row-delete="${r.id}">삭제</button></div></td>
      </tr>`).join('');
      body.querySelectorAll('.nrecipe-link').forEach(b=>b.onclick=()=>openDetail(b.dataset.id));
      body.querySelectorAll('.nrecipe-row-check').forEach(x=>x.onchange=()=>updateSelection(section));
      body.querySelectorAll('[data-row-print]').forEach(b=>b.onclick=()=>openDetail(b.dataset.rowPrint,true));
      body.querySelectorAll('[data-row-edit]').forEach(b=>b.onclick=async()=>{const r=await req('/api/qmes-recipes/'+b.dataset.rowEdit);openEditor(r);});
      body.querySelectorAll('[data-row-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('이 배합기준을 삭제하시겠습니까?'))return;await req('/api/qmes-recipes/'+b.dataset.rowDelete,{method:'DELETE'});toast('삭제했습니다.');loadRecipes(page);});
      const pager=section.querySelector('.nrecipe-pager');pager.innerHTML='';
      for(let p=1;p<=totalPages;p++){const b=document.createElement('button');b.className='nrecipe-page'+(p===page?' active':'');b.textContent=p;b.onclick=()=>loadRecipes(p);pager.appendChild(b);}
      section.querySelector('.nrecipe-check-all').checked=false;updateSelection(section);
    }catch(e){body.innerHTML='<tr><td colspan="10">'+esc(e.message)+'</td></tr>';}
  }

  const materialRow=(m={})=>`<tr>
    <td class="seq"></td>
    <td><input data-k="material_code" value="${esc(m.material_code||'')}" placeholder="선택"></td>
    <td><input data-k="material_name" value="${esc(m.material_name||'')}" placeholder="원료명"></td>
    <td><input data-k="standard_qty" type="number" min="0" step="0.001" value="${esc(m.standard_qty||'')}" placeholder="0"></td>
    <td><input data-k="mix_time_min" type="number" min="0" step="0.1" value="${esc(m.mix_time_min||'')}" placeholder="분"></td>
    <td><input data-k="rpm" type="number" min="0" step="1" value="${esc(m.rpm||'')}" placeholder="RPM"></td>
    <td><input data-k="temperature_c" type="number" step="0.1" value="${esc(m.temperature_c||'')}" placeholder="°C"></td>
    <td><input data-k="note" value="${esc(m.note||'')}" placeholder="비고"></td>
    <td><button type="button" class="nrecipe-row-del">삭제</button></td></tr>`;

  function renumber(modal){modal.querySelectorAll('.nrecipe-materials tbody tr').forEach((r,i)=>r.querySelector('.seq').textContent=i+1);}

  function openEditor(copy=null){
    const layer=document.createElement('div');layer.className='nrecipe-backdrop';
    const rev=copy?nextRevision(copy.revision):'Rev.01';
    layer.innerHTML=`<div class="nrecipe-modal" role="dialog" aria-modal="true">
      <div class="nrecipe-modal-head"><strong>배합기준(Recipe) 신규 Rev. 등록</strong><button type="button" data-close>닫기</button></div>
      <div class="nrecipe-modal-body">
        <div class="nrecipe-grid">
          <div class="nrecipe-field"><label>고객사명</label><input data-head="customer_name" value="${esc(copy?.customer_name||'')}"></div>
          <div class="nrecipe-field"><label>제품명</label><input data-head="product_name" value="${esc(copy?.product_name||'')}"></div>
          <div class="nrecipe-field"><label>Rev.</label><input data-head="revision" value="${esc(rev)}"></div>
          <div class="nrecipe-field"><label>적용일</label><input data-head="effective_on" type="date" value="${new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})}"></div>
          <div class="nrecipe-field"><label>기준 생산량</label><input data-head="basis_qty" type="number" min="0" step="0.001" value="${esc(copy?.basis_qty||'')}"></div>
          <div class="nrecipe-field"><label>단위</label><input data-head="unit" value="${esc(copy?.unit||'kg')}"></div>
          <div class="nrecipe-field" style="grid-column:span 2"><label>변경사유</label><input data-head="note" value="" placeholder="새 Rev. 등록 사유"></div>
        </div>
        <table class="nrecipe-materials"><thead><tr><th style="width:42px">순서</th><th>원료코드</th><th>원료명</th><th style="width:110px">기준투입량(kg)</th><th style="width:90px">교반시간(분)</th><th style="width:85px">RPM</th><th style="width:85px">온도(℃)</th><th>비고</th><th style="width:62px">관리</th></tr></thead><tbody></tbody></table>
        <div class="nrecipe-actions"><button type="button" data-add>+ 원료 추가</button><small>기존 Rev.는 덮어쓰지 않고 이력으로 보존됩니다.</small></div>
      </div>
      <div class="nrecipe-modal-foot"><button type="button" data-close>취소</button><button type="button" class="primary" data-save>새 Rev. 저장</button></div>
    </div>`;
    document.body.appendChild(layer);
    const tbody=layer.querySelector('tbody');
    const items=copy?.materials?.length?copy.materials:[{},{},{},{},{}];
    items.forEach(m=>tbody.insertAdjacentHTML('beforeend',materialRow(m)));
    renumber(layer);
    const wire=()=>{
      layer.querySelectorAll('.nrecipe-row-del').forEach(b=>{if(b.dataset.wired)return;b.dataset.wired='1';b.onclick=()=>{b.closest('tr').remove();renumber(layer);};});
    }; wire();
    layer.querySelector('[data-add]').onclick=()=>{tbody.insertAdjacentHTML('beforeend',materialRow());renumber(layer);wire();};
    layer.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>layer.remove());
    layer.addEventListener('click',e=>{if(e.target===layer)layer.remove();});
    layer.querySelector('[data-save]').onclick=async()=>{
      const head=k=>layer.querySelector('[data-head="'+k+'"]')?.value.trim()||'';
      const materials=[...tbody.rows].map(row=>{
        const o={};row.querySelectorAll('[data-k]').forEach(i=>o[i.dataset.k]=i.value.trim());return o;
      }).filter(x=>x.material_name||x.standard_qty);
      try{
        await req('/api/qmes-recipes',{method:'POST',body:JSON.stringify({
          customer_name:head('customer_name'),product_name:head('product_name'),revision:head('revision'),
          effective_on:head('effective_on'),basis_qty:head('basis_qty'),unit:head('unit'),note:head('note'),materials
        })});
        layer.remove();toast('배합기준 새 Rev.가 저장되었습니다.');loadRecipes();
      }catch(e){toast(e.message);}
    };
  }

  function nextRevision(value){
    const s=String(value||'');const m=s.match(/^(.*?)(\d+)$/);
    if(!m)return s?s+'-1':'Rev.01';
    return m[1]+String(Number(m[2])+1).padStart(m[2].length,'0');
  }

  async function openDetail(id,printOnly=false){
    try{
      const r=await req('/api/qmes-recipes/'+encodeURIComponent(id));
      const layer=document.createElement('div');layer.className='nrecipe-backdrop';
      layer.innerHTML=`<div class="nrecipe-modal"><div class="nrecipe-modal-head"><strong>${esc(r.product_name)} · ${esc(r.revision)}</strong><button data-close>닫기</button></div>
      <div class="nrecipe-modal-body">
        <div class="nrecipe-grid nrecipe-readonly">
          <div class="nrecipe-field"><label>고객사명</label><input readonly value="${esc(r.customer_name||'-')}"></div>
          <div class="nrecipe-field"><label>제품명</label><input readonly value="${esc(r.product_name)}"></div>
          <div class="nrecipe-field"><label>Rev.</label><input readonly value="${esc(r.revision)}"></div>
          <div class="nrecipe-field"><label>상태</label><input readonly value="${r.status==='ACTIVE'?'사용중':'과거 Rev.'}"></div>
          <div class="nrecipe-field"><label>기준량</label><input readonly value="${fmt(r.basis_qty)} ${esc(r.unit||'kg')}"></div>
          <div class="nrecipe-field"><label>적용일</label><input readonly value="${esc(String(r.effective_on||'').slice(0,10)||'-')}"></div>
          <div class="nrecipe-field" style="grid-column:span 2"><label>변경사유</label><input readonly value="${esc(r.note||'-')}"></div>
        </div>
        <table class="nrecipe-materials"><thead><tr><th>순서</th><th>원료코드</th><th>원료명</th><th>기준투입량</th><th>교반시간</th><th>RPM</th><th>온도</th><th>비고</th></tr></thead>
        <tbody>${(r.materials||[]).map(m=>`<tr><td>${m.seq}</td><td>${esc(m.material_code||'-')}</td><td>${esc(m.material_name)}</td><td>${fmt(m.standard_qty)} ${esc(m.unit||'kg')}</td><td>${m.mix_time_min==null?'-':fmt(m.mix_time_min)}</td><td>${m.rpm==null?'-':fmt(m.rpm)}</td><td>${m.temperature_c==null?'-':fmt(m.temperature_c)}</td><td>${esc(m.note||'-')}</td></tr>`).join('')}</tbody></table>
      </div><div class="nrecipe-modal-foot">${r.status==='ACTIVE'?'':'<button type="button" data-activate>이 Rev. 사용</button>'}<button type="button" data-copy>새 Rev. 만들기</button><button type="button" data-close>닫기</button></div></div>`;
      document.body.appendChild(layer);
      if(printOnly){setTimeout(()=>window.print(),50);}
      layer.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>layer.remove());
      layer.querySelector('[data-copy]').onclick=()=>{layer.remove();openEditor(r);};
      const act=layer.querySelector('[data-activate]');if(act)act.onclick=async()=>{try{await req('/api/qmes-recipes/'+r.id+'/activate',{method:'POST',body:'{}'});layer.remove();loadRecipes();toast('선택한 Rev.를 사용 기준으로 변경했습니다.');}catch(e){toast(e.message);}};
    }catch(e){toast(e.message);}
  }

  function workBasicValue(form,label){
    return [...form.querySelectorAll('.work-basic-grid .form-item')].find(x=>x.querySelector('label')?.textContent.trim()===label)?.querySelector('input,select')?.value.trim()||'';
  }
  function ensureWorkRecipe(){
    const form=document.querySelector('.work-form');
    if(!form||form.dataset.recipeUi==='1')return;
    const tools=form.querySelector('.work-material-tools');
    if(!tools)return;
    form.dataset.recipeUi='1';
    const b=document.createElement('button');b.type='button';b.className='nrecipe-apply';b.textContent='배합기준 불러오기';
    const badge=document.createElement('span');badge.className='nrecipe-work-badge';badge.textContent='Recipe 미적용';
    tools.append(b,badge);
    b.onclick=async()=>{
      const product=workBasicValue(form,'제품명'),qty=workBasicValue(form,'계획수량');
      if(!product||!(Number(qty)>0)){toast('제품명과 계획수량을 먼저 입력해 주세요.');return;}
      try{
        const plan=await req('/api/qmes-recipes/plan?product='+encodeURIComponent(product)+'&qty='+encodeURIComponent(qty));
        const tbody=form.querySelector('#workMaterialTable tbody'); if(!tbody)return;
        tbody.innerHTML='';
        const add=form.querySelector('#workRowAdd');
        for(const m of plan.materials){
          add.click();
          const row=tbody.lastElementChild,sel=row.querySelector('.material-name-select');
          const exists=[...sel.options].some(o=>o.value===m.material_name);
          sel.value=exists?m.material_name:'__manual__';sel.dispatchEvent(new Event('change',{bubbles:true}));
          if(!exists)row.querySelector('.material-name-manual').value=m.material_name;
          row.querySelector('.plan-input').value=m.plan_qty;
          row.querySelector('.plan-input').dispatchEvent(new Event('input',{bubbles:true}));
        }
        form.dataset.recipeId=String(plan.id);
        form.dataset.recipeRevision=plan.revision||'';
        form.dataset.recipeProduct=plan.product_name||product;
        badge.textContent='Recipe '+plan.revision+' 적용 · 기준 '+fmt(plan.basis_qty)+' '+(plan.unit||'kg');
        toast('배합기준 '+plan.revision+' 계획량을 적용했습니다.');
      }catch(e){toast(e.message);}
    };
    const current=form.dataset.recipeRevision;
    if(current)badge.textContent='Recipe '+current+' 적용';
  }

  function forceRecipeOnly(){
    const section=document.getElementById('recipeMaster');
    const standard=document.getElementById('standard');
    if(standard) standard.classList.remove('active');
    ensureRecipePage(true);
    if(section) section.classList.add('active');
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('.menu[data-page="recipeMaster"]')){
      requestAnimationFrame(forceRecipeOnly);
    }
  },true);

  const observer=new MutationObserver(()=>{
    ensureRecipePage();
    ensureWorkRecipe();
    const section=document.getElementById('recipeMaster');
    if(section?.classList.contains('active')){
      const bad=section.querySelector('.module-toolbar,.module-body') || /문서관리|문서 기준서/.test(section.querySelector('.page-head h1')?.textContent||'');
      if(bad) ensureRecipePage(true);
    }
  });
  function start(){ensureRecipePage(true);ensureWorkRecipe();observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();