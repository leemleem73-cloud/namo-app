/* NAMO QMES - Sales table font unify V1 - 2026-08-28
 * Visual-only patch. Keeps colors/status styles but unifies typography across every Sales table cell.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FONT_UNIFY_20260828_V1__)return;
  window.__QMES_SALES_FONT_UNIFY_20260828_V1__=true;

  const HOST="qmes-sales-enterprise-module-v2";
  const STYLE_ID="qmes-sales-font-unify-style-20260828-v1";

  function install(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");
    s.id=STYLE_ID;
    s.textContent=`
      #${HOST},
      #${HOST} table,
      #${HOST} thead,
      #${HOST} tbody,
      #${HOST} tr,
      #${HOST} th,
      #${HOST} td,
      #${HOST} th *,
      #${HOST} td *{
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        font-style:normal!important;
        letter-spacing:-.01em!important;
        font-variant-numeric:tabular-nums!important;
      }

      #${HOST} th,
      #${HOST} th *{
        font-size:10.5px!important;
        font-weight:800!important;
        line-height:1.2!important;
      }

      #${HOST} td,
      #${HOST} td *{
        font-size:11.5px!important;
        font-weight:700!important;
        line-height:1.25!important;
      }

      #${HOST} .order{
        font-size:11.5px!important;
        font-weight:700!important;
      }

      #${HOST} .nse-prod-wrap{
        font-size:11.5px!important;
        font-weight:700!important;
      }

      #${HOST} .st{
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        font-size:10.5px!important;
        font-weight:700!important;
        letter-spacing:-.01em!important;
      }

      #${HOST} td:nth-child(6),
      #${HOST} td:nth-child(6) *,
      #${HOST} td:nth-child(7),
      #${HOST} td:nth-child(7) *,
      #${HOST} td:nth-child(8),
      #${HOST} td:nth-child(8) *{
        font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;
        font-weight:700!important;
      }
    `;
    document.head.appendChild(s);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  [100,300,800,1600].forEach(ms=>setTimeout(install,ms));
  window.addEventListener("qmes:enterprise-ui-ready",install);
  window.addEventListener("qmes:erp-data-changed",install);
})();
