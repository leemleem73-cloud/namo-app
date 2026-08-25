/* PQC action button spacing only. */
(function(){
  const style=document.createElement('style');
  style.id='qmes-pqc-action-gap-style';
  style.textContent=`
    .qmes-pqc-page .qmes-iqc-action-btn + .qmes-iqc-action-btn{
      margin-left:6px!important;
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);
})();
