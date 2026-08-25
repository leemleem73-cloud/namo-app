/* QMES PQC/OQC standalone edit record matcher fix — 2026-08-26
 * Runs before inspection-edit-screen and supplies exact hidden identifiers
 * so the standalone editor can resolve the clicked inspection group reliably.
 */
(function installInspectionEditMatchFix(global){
  'use strict';
  if(global.__QMES_INSPECTION_EDIT_MATCH_FIX_20260826__) return;
  global.__QMES_INSPECTION_EDIT_MATCH_FIX_20260826__=true;

  const text=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const groupKey=row=>text(row?.groupId)||(text(row?.lot)||text(row?.date||row?.shipDate)?`${text(row?.lot)}|${text(row?.date||row?.shipDate)}`:text(row?.id).replace(/-\d+$/,''));

  function scoreRow(record,rowText){
    let score=0;
    const lot=text(record?.lot), date=text(record?.date).slice(0,10), shipDate=text(record?.shipDate).slice(0,10);
    const inspector=text(record?.inspector||record?.by), id=text(record?.id), group=text(record?.groupId);
    if(lot && rowText.includes(lot)) score+=100;
    if(group && rowText.includes(group)) score+=80;
    if(id && rowText.includes(id)) score+=70;
    if(date && rowText.includes(date)) score+=30;
    if(shipDate && rowText.includes(shipDate)) score+=25;
    if(inspector && rowText.includes(inspector)) score+=15;
    return score;
  }

  function prepare(button){
    const page=button.closest('.qmes-pqc-page,.qmes-oqc-page');
    const tr=button.closest('tr');
    if(!page||!tr) return;
    const mode=page.classList.contains('qmes-oqc-page')?'OQC':'PQC';
    const rows=global.DB?.insp?.[mode];
    if(!Array.isArray(rows)||!rows.length) return;
    const rowText=text(tr.textContent);
    const ranked=rows.map((record,index)=>({record,index,score:scoreRow(record,rowText)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||a.index-b.index);
    let rep=ranked[0]?.record||null;

    // Fallback: match rendered row position to unique inspection groups.
    if(!rep){
      const table=tr.closest('table');
      const renderedRows=table?Array.from(table.querySelectorAll('tbody tr')).filter(r=>r.querySelector('.qmes-iqc-action-edit')):[];
      const clickedIndex=renderedRows.indexOf(tr);
      const groups=[]; const seen=new Set();
      rows.forEach(record=>{const key=groupKey(record);if(!seen.has(key)){seen.add(key);groups.push(record);}});
      if(clickedIndex>=0&&clickedIndex<groups.length) rep=groups[clickedIndex];
    }
    if(!rep) return;

    const exactLot=text(rep.lot); const exactGroup=groupKey(rep); const exactDate=text(rep.date).slice(0,10);
    const exactInspector=text(rep.inspector||rep.by);
    tr.querySelectorAll('td[data-qmes-edit-match-fix]').forEach(td=>td.remove());
    [exactLot,exactGroup,exactDate,exactInspector].filter(Boolean).forEach(value=>{
      const td=document.createElement('td');
      td.dataset.qmesEditMatchFix='true';
      td.textContent=value;
      td.style.display='none';
      tr.appendChild(td);
    });
  }

  document.addEventListener('click',function(event){
    const button=event.target?.closest?.('.qmes-iqc-action-edit');
    if(!button||!button.closest('.qmes-pqc-page,.qmes-oqc-page')) return;
    prepare(button);
  },true);
})(window);
