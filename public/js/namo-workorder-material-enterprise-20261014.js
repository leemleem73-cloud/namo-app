/* NAMO QMES material planning UI: layout/summary only.
   Original material input fields, row handlers, LOT checks and saving are preserved. */
(function(){
  'use strict';
  if(window.__NAMO_MATERIAL_ENTERPRISE_20261014__)return;
  window.__NAMO_MATERIAL_ENTERPRISE_20261014__=true;

  function el(tag,className,text){
    var node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  }
  function num(input){
    var value=Number(String(input&&input.value||'').replaceAll(',',''));
    return Number.isFinite(value)&&value>0?value:0;
  }
  function fmt(v){
    return new Intl.NumberFormat('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
  }
  function rowMode(row){
    var select=row.querySelector('.material-name-select');
    var lot=row.querySelector('.material-lot-manual');
    if(!select||!lot)return;
    var isMiddle=select.value==='중간배치';
    row.classList.toggle('nwm-mid-row',isMiddle);

    var lotCell=lot.closest('td');
    if(!lotCell)return;
    var inline=lotCell.querySelector('.nwm-lot-inline');
    if(!inline){
      inline=el('div','nwm-lot-inline');
      lot.parentNode.insertBefore(inline,lot);
      inline.appendChild(lot);
    }

    // Keep the existing intermediate-batch control and its event listeners.
    // Show the kind and LOT side-by-side, without adding extra table columns.
    var kind=row.querySelector('.namo-mid-kind');
    if(kind&&kind.parentElement!==inline){
      inline.insertBefore(kind,lot);
      var placeholder=Array.from(kind.options).find(function(option){return option.value==='';});
      if(placeholder)placeholder.textContent='종류 선택';
    }
    var hint=row.querySelector('.namo-mid-hint');
    if(hint&&hint.parentElement!==lotCell)lotCell.appendChild(hint);
    if(isMiddle)lot.setAttribute('placeholder','중간배치 LOT 입력');
    else lot.setAttribute('placeholder','원료 LOT 입력');
  }
  function updateSummary(form){
    var table=form.querySelector('#workMaterialTable');
    if(!table)return;
    var rows=Array.from(table.querySelectorAll('tbody tr'));
    var toolbar=form.querySelector('.nwm-tools-count .nwm-count');
    if(toolbar){
      var count=String(rows.length);
      if(toolbar.textContent!==count)toolbar.textContent=count;
    }
    var totalPlan=0,totalActual=0,totalRatio=0;
    rows.forEach(function(row){
      totalPlan+=num(row.querySelector('.plan-input'));
      totalActual+=num(row.querySelector('.actual-input'));
      totalRatio+=num(row.querySelector('.ratio-input'));
    });
    var planned=form.querySelector('.nwm-plan-total');
    var actual=form.querySelector('.nwm-actual-total');
    if(planned&&planned.textContent!==fmt(totalPlan))planned.textContent=fmt(totalPlan);
    if(actual&&actual.textContent!==fmt(totalActual))actual.textContent=fmt(totalActual);
    var ratio=form.querySelector('.nwm-ratio-total');
    if(ratio&&ratio.textContent!==fmt(totalRatio))ratio.textContent=fmt(totalRatio);
  }
  function prepareRow(row){
    if(!row.dataset.nwmListeners){
      row.dataset.nwmListeners='1';
      var choice=row.querySelector('.material-name-select');
      if(choice)choice.addEventListener('change',function(){rowMode(row);});
    }
    rowMode(row);
  }
  function install(form){
    var table=form.querySelector('#workMaterialTable');
    var section=table&&table.closest('.work-section');
    if(!section)return;
    if(form.dataset.nwmMaterialInstalled!=='1'){
      section.classList.add('nwm-material');
      form.dataset.nwmMaterialInstalled='1';
      var header=section.querySelector('.work-section-title');
      if(header)header.textContent='원료 투입계획';
      var body=table.parentElement;
      var wrap=el('div','nwm-table-wrap');
      body.insertBefore(wrap,table);
      wrap.appendChild(table);

      var toolbar=section.querySelector('.work-material-tools');
      if(toolbar){
        var copy=el('div','nwm-tools-label');
        var count=el('span','nwm-tools-count','투입 원료 ');
        count.appendChild(el('span','nwm-count','0'));
        copy.appendChild(count);
        copy.appendChild(el('span','nwm-tools-hint','원료 선택 → LOT 입력 → 계획량 입력'));
        toolbar.insertBefore(copy,toolbar.firstChild);
      }
      // Totals are real table footer cells, sharing the header column widths.
      var footer=el('tfoot','nwm-summary');
      var totalRow=el('tr','nwm-summary-row');
      var titleCell=el('td','nwm-summary-caption','합계');
      titleCell.colSpan=3;
      totalRow.appendChild(titleCell);
      function totalCell(field,valueClass,unit){
        var cell=el('td','nwm-summary-item');
        cell.appendChild(el('span','nwm-summary-field-label',field));
        cell.appendChild(el('strong',valueClass,'0.00'));
        cell.appendChild(el('span','nwm-summary-unit',unit));
        return cell;
      }
      totalRow.appendChild(totalCell('계획투입량','nwm-plan-total','kg'));
      totalRow.appendChild(totalCell('실투입량','nwm-actual-total','kg'));
      totalRow.appendChild(totalCell('투입비율','nwm-ratio-total','%'));
      totalRow.appendChild(el('td','nwm-summary-actions'));
      footer.appendChild(totalRow);
      table.appendChild(footer);
      const bottom=el('div','nwm-bottom-actions');
      wrap.after(bottom);
      const add=form.querySelector('#workRowAdd');
      if(add)bottom.append(add);


      // Event delegation survives additions/deletions and does not replace
      // the existing recalculation, validation or server save handlers.
      table.addEventListener('input',function(evt){
        if(evt.target.closest('.plan-input,.actual-input'))updateSummary(form);
      });
      table.addEventListener('change',function(evt){
        if(evt.target.closest('.material-name-select,.namo-mid-kind,.material-lot-manual')){
          var row=evt.target.closest('tbody tr');
          if(row)rowMode(row);
          updateSummary(form);
        }
      });
    }
    Array.from(table.querySelectorAll('tbody tr')).forEach(prepareRow);
    updateSummary(form);
  }
  function boot(){
    var root=document.getElementById('mainWorkspace');
    if(!root)return;
    var queued=false;
    function scan(){
      queued=false;
      Array.from(root.querySelectorAll('.work-form')).forEach(install);
    }
    // Rows are added dynamically, and middle-batch controls are injected
    // asynchronously by the pre-existing LOT module.
    var observer=new MutationObserver(function(){
      if(queued)return;
      queued=true;
      queueMicrotask(scan);
    });
    observer.observe(root,{childList:true,subtree:true});
    scan();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

/* Work-order raw LOT choices from the shared IQC ledger. */
(function(){
  'use strict';
  let serial=0;
  const text=value=>String(value??'').trim();
  function judge(row){
    let items=row.items_json||[];
    try{if(typeof items==='string')items=JSON.parse(items);}catch(_){items=[];}
    const master=Array.isArray(items)?items.find(x=>text(x?.name).includes('판정')):null;
    return text(master?.judge||master?.value||row.judge||'');
  }
  function candidates(rows,name){
    const valid=rows.filter(row=>!row.deleted&&text(row.lot));
    const normalize=value=>text(value).toUpperCase().replace(/[\\s()\\[\\]-]/g,'');
    const wanted=normalize(name);
    const aliases={'분산제':['분산제','BYK'],'세라믹':['세라믹','AOH','BOEHMITE'],'바인더':['바인더','PAI']};
    const matches=row=>(aliases[name]||[wanted]).some(key=>normalize(row.item).includes(normalize(key)));
    if(!wanted||name==='__manual__')return valid;
    return valid.filter(matches).concat(valid.filter(row=>!matches(row)));
  }
  function drawRow(row,state){
    const input=row.querySelector('.material-lot-manual'),name=row.querySelector('.material-name-select');
    if(!input||!name)return;
    let select=row.querySelector('.nwm-iqc-lot-select');
    if(!select){
      select=document.createElement('select');select.className='nwm-iqc-lot-select';
      select.setAttribute('aria-label','LOT 선택');
      select.style.cssText='width:100%;min-width:0;margin-bottom:0;font-size:11px;flex:1 1 100%';
      input.parentNode.insertBefore(select,input);
      select.addEventListener('change',()=>{
        if(select.value==='__manual__'){
          row.dataset.nwmLotManual='1';
          drawRow(row,state);
          input.focus();input.select();
          return;
        }
        delete row.dataset.nwmLotManual;
        input.value=select.value;
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
      });
      const finish=()=>{
        if(row.dataset.nwmLotManual!=='1')return;
        delete row.dataset.nwmLotManual;
        input.dispatchEvent(new Event('change',{bubbles:true}));
        drawRow(row,state);
      };
      input.addEventListener('blur',finish);
      input.addEventListener('keydown',event=>{
        if(row.dataset.nwmLotManual==='1'&&(event.key==='Enter'||event.key==='Escape')){
          event.preventDefault();event.stopPropagation();input.blur();
        }
      });
    }
    const middle=name.value==='중간배치';
    const allowManual=middle||name.value==='SBR';
    if(!allowManual)delete row.dataset.nwmLotManual;
    const manual=allowManual&&row.dataset.nwmLotManual==='1';
    select.hidden=manual;select.style.display=manual?'none':'block';
    input.hidden=!manual;input.style.setProperty('display',manual?'':'none',manual?'':'important');
    if(manual){input.style.width='100%';input.style.flex='1 1 100%';input.placeholder='LOT NO 직접 입력';}
    const middleLots=middle?Array.from(row.querySelectorAll('.namo-mid-list option')).map(o=>({lot:o.value})):[];
    const choices=middle?middleLots:candidates(state.rows,name.value);
    const key=state.version+'|'+name.value+'|'+middleLots.map(o=>o.lot).join(',')+'|'+(manual?'__manual__':input.value);
    if(select.dataset.choiceKey===key)return;
    select.dataset.choiceKey=key;
    select.replaceChildren();
    select.add(new Option('LOT 선택',''));
    const seen=new Set();
    choices.forEach(record=>{
      const lot=text(record.lot);if(seen.has(lot))return;seen.add(lot);
      select.add(new Option(lot,lot));
    });
    if(input.value&&input.value!=='MB'&&!seen.has(input.value))select.add(new Option(input.value,input.value));
    if(allowManual)select.add(new Option('직접 입력','__manual__'));
    select.value=manual?'__manual__':(input.value==='MB'?'':input.value||'');
  }
  function draw(form,state){form.querySelectorAll('#workMaterialTable tbody tr').forEach(row=>drawRow(row,state));}
  async function load(form,state){
    if(state.loading)return;
    state.loading=true;state.error=false;state.version++;draw(form,state);
    try{
      await window.qmesAuthDataReady?.wait();
      const response=await fetch('/api/iqc',{credentials:'same-origin',cache:'no-store'});
      const result=await response.json();
      if(!response.ok||!result.success||!Array.isArray(result.data))throw Error(result.message||'조회 실패');
      state.rows=result.data;
    }catch(error){state.error=true;console.warn('[work IQC LOT]',error);}
    finally{state.loading=false;state.version++;if(form.isConnected)draw(form,state);}
  }
  function install(form){
    if(!form.querySelector('#workMaterialTable'))return;
    let state=form._nwmIqcLot;
    if(!state){
      state=form._nwmIqcLot={rows:[],version:++serial,loading:false,error:false};
      const tools=form.querySelector('.work-material-tools');
      const refresh=document.createElement('button');
      refresh.type='button';refresh.className='btn';refresh.textContent='LOT 새로고침';
      refresh.onclick=()=>load(form,state);tools?.append(refresh);
      form.addEventListener('change',event=>{
        const row=event.target.closest('#workMaterialTable tbody tr');
        if(row)drawRow(row,state);
      });
      form.addEventListener('input',event=>{
        if(event.target.matches('.material-lot-manual'))drawRow(event.target.closest('tr'),state);
      });
      load(form,state);
    }
    draw(form,state);
  }
  function boot(){
    const root=document.getElementById('mainWorkspace');if(!root)return;
    let queued=false;
    const scan=()=>{queued=false;root.querySelectorAll('.work-form').forEach(install);};
    new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(scan);}}).observe(root,{subtree:true,childList:true});
    scan();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* One outer section border; a single table frame and bottom-right row action. */
(function(){
 const style=document.createElement('style');
 style.textContent=`
 #mainWorkspace .work-form .nwm-bottom-actions{display:flex;justify-content:flex-end;padding-top:10px}
 #mainWorkspace .work-form .work-section{overflow:hidden}
 #mainWorkspace .work-form .work-section>.work-section-body{border:0!important;border-radius:0!important;box-shadow:none!important}
 #mainWorkspace .work-form .work-basic-grid{border:0!important;border-radius:0!important;box-shadow:none!important}
 #mainWorkspace .work-form .nwm-material .nwm-table-wrap{border:1px solid #d6e1ed!important;border-radius:3px!important;box-shadow:none!important}
 #mainWorkspace .work-form .nwm-material #workMaterialTable{border:0!important;border-radius:0!important;box-shadow:none!important}
 #mainWorkspace .work-form .nwm-material .work-material-tools{border-radius:3px!important;box-shadow:none!important}
 `;document.head.append(style);
})();
