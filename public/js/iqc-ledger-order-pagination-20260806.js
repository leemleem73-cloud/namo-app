(function(){
  "use strict";
  document.querySelectorAll(".qmes-iqc-pager").forEach(node=>node.remove());
  document.querySelectorAll("table tbody tr").forEach(row=>{if(row.style.display==="none") row.style.display="";});
  document.querySelectorAll("table[data-qmes-iqc-order-applied]").forEach(table=>table.removeAttribute("data-qmes-iqc-order-applied"));
})();
