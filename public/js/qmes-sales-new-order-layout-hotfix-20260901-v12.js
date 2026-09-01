/* NAMO QMES - Integrated new-order layout hotfix V12 - 2026-09-01
 * common.css hides every semantic <aside>; restore the wizard rail and force the
 * form workspace into the full second grid column.
 */
(function(){
  'use strict';
  if(window.__QMES_INTEGRATED_NEW_ORDER_LAYOUT_V12__)return;
  window.__QMES_INTEGRATED_NEW_ORDER_LAYOUT_V12__=true;
  const id='qmes-sales-new-order-layout-hotfix-20260901-v12-style';
  if(document.getElementById(id))return;
  const style=document.createElement('style');
  style.id=id;
  style.textContent=`
    #qmes-sales-new-order-integrated-v11 .iw-main{
      grid-template-columns:190px minmax(0,1fr)!important;
      width:100%!important;
    }
    #qmes-sales-new-order-integrated-v11 .iw-steps{
      display:block!important;
      grid-column:1!important;
      min-width:190px!important;
    }
    #qmes-sales-new-order-integrated-v11 .iw-work{
      grid-column:2!important;
      width:100%!important;
      min-width:0!important;
    }
    #qmes-sales-new-order-integrated-v11 .iw-pages,
    #qmes-sales-new-order-integrated-v11 .iw-page,
    #qmes-sales-new-order-integrated-v11 .iw-grid{
      width:100%!important;
      min-width:0!important;
    }
    @media(max-width:900px){
      #qmes-sales-new-order-integrated-v11 .iw-main{grid-template-columns:1fr!important}
      #qmes-sales-new-order-integrated-v11 .iw-steps{
        display:grid!important;
        grid-column:1!important;
        min-width:0!important;
      }
      #qmes-sales-new-order-integrated-v11 .iw-work{grid-column:1!important}
    }
  `;
  document.head.appendChild(style);
})();
