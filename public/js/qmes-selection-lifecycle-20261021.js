/* Row selection belongs only to the current menu; never touch business-option checkboxes. */
(function(){
'use strict';
if(window.qmesSelectionLifecycle)return;
const selectionBoxes='.iqc-select-row,.iqc-select-all,.wo-bulk-check,.wo-bulk-all,.ncr-row-select,#ncr-select-all,.qpf-check,.qpf-check-all,.eq-wo-select,#eqWoAll';
function clearBox(box){if(box){box.checked=false;box.indeterminate=false;}}
function clearInactive(activePage){
 document.querySelectorAll('.module-page').forEach(section=>{
  if(section.id===activePage)return;
  const reset=section._resetListSelection||section._resetIncomingSelection;
  if(typeof reset==='function')reset.call(section);
  section._iqcSelectedIds?.clear?.();
  // Inspection pagination detaches off-page rows; clear those original nodes too.
  (section._inspectionAllRows||[]).forEach(row=>clearBox(row.querySelector('.iqc-select-row')));
  section.querySelectorAll(selectionBoxes).forEach(clearBox);
  section.querySelectorAll('.iqc-bulk-delete,.qmes-bulk-print,.iqc-bulk-mail').forEach(button=>{
   button.hidden=true;button.disabled=true;
   button.style.setProperty('display','none','important');
  });
  section.querySelectorAll('.wo-bulk-controls,.eq-wo-actions,#ncr-bulk').forEach(bar=>{bar.hidden=true;});
  const dock=section.querySelector('.iqc-selection-dock');
  if(dock){
   dock.classList.remove('is-visible');dock.setAttribute('aria-hidden','true');dock.inert=true;
   const count=dock.querySelector('.iqc-dock-count');if(count)count.textContent='0';
  }
  section._workDockCount=0;
 });
}
window.qmesSelectionLifecycle={clearInactive};
})();
