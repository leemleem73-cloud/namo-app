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
    var totalPlan=0,totalActual=0;
    rows.forEach(function(row){
      totalPlan+=num(row.querySelector('.plan-input'));
      totalActual+=num(row.querySelector('.actual-input'));
    });
    var planned=form.querySelector('.nwm-plan-total');
    var actual=form.querySelector('.nwm-actual-total');
    if(planned&&planned.textContent!==fmt(totalPlan))planned.textContent=fmt(totalPlan);
    if(actual&&actual.textContent!==fmt(totalActual))actual.textContent=fmt(totalActual);
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
      var summary=el('div','nwm-summary');
      var planned=el('span','nwm-summary-item');
      planned.appendChild(el('span','','계획투입 합계'));
      planned.appendChild(el('strong','nwm-plan-total','0.00'));
      planned.appendChild(el('span','nwm-summary-unit','kg'));
      summary.appendChild(planned);
      summary.appendChild(el('span','nwm-summary-divider'));
      var actual=el('span','nwm-summary-item');
      actual.appendChild(el('span','','실투입 합계'));
      actual.appendChild(el('strong','nwm-actual-total','0.00'));
      actual.appendChild(el('span','nwm-summary-unit','kg'));
      summary.appendChild(actual);
      wrap.after(summary);

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