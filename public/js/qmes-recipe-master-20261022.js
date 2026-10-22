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
    #recipeMaster .nrecipe-shell{display:block;background:#fff}
    #recipeMaster .nrecipe-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#f3f7fb;border-bottom:1px solid #dae5ef}
    #recipeMaster .nrecipe-tools input{height:30px;min-width:280px;border:1px solid #c7d6e5;border-radius:4px;padding:0 9px;font-size:12px}
    #recipeMaster .nrecipe-tools button,.nrecipe-modal button,#work .nrecipe-apply{height:30px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#294763;font-weight:700;font-size:11px;padding:0 11px;cursor:pointer}
    #recipeMaster .nrecipe-tools .primary,.nrecipe-modal .primary,#work .nrecipe-apply{background:#2f73d9;color:#fff;border-color:#2f73d9}
    #recipeMaster .nrecipe-table{width:100%;border-collapse:collapse;table-layout:fixed}
    #recipeMaster .nrecipe-table th{height:38px;background:#e8f0f8;color:#244260;font-size:11px;border-bottom:1px solid #cbd8e5}
    #recipeMaster .nrecipe-table td{height:44px;padding:6px 8px;text-align:center;font-size:11px;color:#365574;border-bottom:1px solid #edf2f7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #recipeMaster .nrecipe-link{border:0;background:none;color:#1673c7;text-decoration:underline;font-weight:700;cursor:pointer}
    #recipeMaster .nrecipe-active{display:inline-block;padding:3px 8px;border-radius:12px;background:#e9f7ef;color:#25865e;font-weight:700}
    #recipeMaster .nrecipe-old{display:inline-block;padding:3px 8px;border-radius:12px;background:#f0f3f7;color:#718094;font-weight:700}
    .nrecipe-backdrop{position:fixed;inset:0;z-index:30000;background:rgba(16,33,52,.35);display:flex;align-items:center;justify-content:center;padding:30px}
    .nrecipe-modal{width:min(1080px,96vw);max-height:90vh;overflow:auto;background:#fff;border:1px solid #cbd8e5;box-shadow:0 18px 55px rgba(18,37,58,.25);border-radius:6px}
    .nrecipe-modal-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#e8f0f8;border-bottom:1px solid #cbd8e5;color:#244260}
    .nrecipe-modal-body{padding:14px}
    .nrecipe-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #d8e1eb;border-bottom:0}
    .nrecipe-field{display:grid;grid-template-columns:90px minmax(0,1fr);min-height:40px;border-right:1px solid #d8e1eb;border-bottom:1px solid #d8e1eb}
    .nrecipe-field:nth-child(4n){border-right:0}
    .nrecipe-field label{display:flex;align-items:center;justify-content:flex-end;padding:0 9px;background:#f6f8fa;color:#405267;font-size:10px;font-weight:800;border-right:1px solid #d8e1eb}
    .nrecipe-field input,.nrecipe-field textarea{margin:5px 7px;border:1px solid #cfd7df;border-radius:2px;padding:5px 7px;font-size:11px;min-width:0}
    .nrecipe-materials{width:100%;border-collapse:collapse;margin-top:14px}
    .nrecipe-materials th{background:#e8f0f8;color:#244260;font-size:10px;height:34px;border:1px solid #d3dce6}
    .nrecipe-materials td{border:1px solid #e1e7ed;padding:4px}
    .nrecipe-materials input{width:100%;box-sizing:border-box;height:28px;border:1px solid #cfd7df;padding:0 6px;font-size:11px}
    .nrecipe-actions{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
    .nrecipe-modal-foot{display:flex;justify-content:flex-end;gap:6px;padding:12px 16px;border-top:1px solid #d8e1eb}
    .nrecipe-readonly{background:#f8fafc}
    #work .nrecipe-work-badge{display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-size:10px;font-weight:700;color:#526b84}
    @media(max-width:850px){.nrecipe-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nrecipe-field:nth-child(4n){border-right:1px solid #d8e1eb}.nrecipe-field:nth-child(2n){border-right:0}}
  `;
  document.head.appendChild(css);

  function ensureRecipePage(){
    const section=document.getElementById('recipeMaster');
    if(!section||section.dataset.recipeBuilt==='1') return;
    section.dataset.recipeBuilt='1';
    section.innerHTML=`
      <div class="page-head"><div><h1>배합기준 (Recipe)</h1><p>제품별 표준 배합비, 투입순서, 공정조건 및 Rev. 이력을 관리합니다.</p></div><div class="date-badge">QMES</div></div>
      <div class="module-shell">
        <div class="nrecipe-shell">
          <div class="nrecipe-tools">
            <input type="search" class="nrecipe-search" placeholder="제품명 / 제품코드 / Rev. 검색">
            <div><button type="button" class="nrecipe-refresh">조회</button> <button type="button" class="primary nrecipe-new">+ 배합기준 등록</button></div>
          </div>
          <div style="overflow:auto"><table class="nrecipe-table"><thead><tr><th style="width:52px">No.</th><th>제품코드</th><th>제품명</th><th style="width:90px">Rev.</th><th style="width:110px">기준 생산량</th><th style="width:100px">적용일</th><th style="width:90px">원료수</th><th style="width:90px">상태</th><th style="width:110px">작성자</th></tr></thead><tbody><tr><td colspan="9">배합기준을 불러오는 중입니다.</td></tr></tbody></table></div>
        </div>
      </div>`;
    section.querySelector('.nrecipe-refresh').onclick=loadRecipes;
    section.querySelector('.nrecipe-search').addEventListener('keydown',e=>{if(e.key==='Enter')loadRecipes();});
    section.querySelector('.nrecipe-new').onclick=()=>openEditor();
    loadRecipes();
  }

  async function loadRecipes(){
    const section=document.getElementById('standard'), body=section?.querySelector('.nrecipe-table tbody');
    if(!body)return;
    body.innerHTML='<tr><td colspan="9">조회 중...</td></tr>';
    try{
      const q=section.querySelector('.nrecipe-search')?.value.trim()||'';
      const rows=await req('/api/qmes-recipes?q='+encodeURIComponent(q));
      if(!rows.length){body.innerHTML='<tr><td colspan="9">등록된 배합기준이 없습니다.</td></tr>';return;}
      body.innerHTML=rows.map((r,i)=>`<tr>
        <td>${i+1}</td><td>${esc(r.product_code||'-')}</td>
        <td><button type="button" class="nrecipe-link" data-id="${r.id}">${esc(r.product_name)}</button></td>
        <td>${esc(r.revision)}</td><td>${fmt(r.basis_qty)} ${esc(r.unit||'kg')}</td>
        <td>${esc(String(r.effective_on||'').slice(0,10)||'-')}</td><td>${r.material_count||0}</td>
        <td><span class="${r.status==='ACTIVE'?'nrecipe-active':'nrecipe-old'}">${r.status==='ACTIVE'?'사용중':'과거 Rev.'}</span></td>
        <td>${esc(r.created_by||'-')}</td></tr>`).join('');
      body.querySelectorAll('.nrecipe-link').forEach(b=>b.onclick=()=>openDetail(b.dataset.id));
    }catch(e){body.innerHTML='<tr><td colspan="9">'+esc(e.message)+'</td></tr>';}
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
          <div class="nrecipe-field"><label>제품코드</label><input data-head="product_code" value="${esc(copy?.product_code||'')}"></div>
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
          product_code:head('product_code'),product_name:head('product_name'),revision:head('revision'),
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

  async function openDetail(id){
    try{
      const r=await req('/api/qmes-recipes/'+encodeURIComponent(id));
      const layer=document.createElement('div');layer.className='nrecipe-backdrop';
      layer.innerHTML=`<div class="nrecipe-modal"><div class="nrecipe-modal-head"><strong>${esc(r.product_name)} · ${esc(r.revision)}</strong><button data-close>닫기</button></div>
      <div class="nrecipe-modal-body">
        <div class="nrecipe-grid nrecipe-readonly">
          <div class="nrecipe-field"><label>제품코드</label><input readonly value="${esc(r.product_code||'-')}"></div>
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

  const observer=new MutationObserver(()=>{
    ensureRecipePage();
    ensureWorkRecipe();
  });
  function start(){ensureRecipePage();ensureWorkRecipe();observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();