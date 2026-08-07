(function(){
  "use strict";

  ["qmes-side-toggle","qmes-side-overlay","qmes-side-menu","qmes-context-side-menu","qmes-stable-sidebar","qmes-safe-sidebar"].forEach(id=>document.getElementById(id)?.remove());
  ["qmes-side-menu-v4-style","qmes-side-menu-v5-style","qmes-context-side-menu-style","qmes-native-dropdown-left-style","qmes-stable-sidebar-style","qmes-safe-sidebar-style"].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove("qmes-context-side-enabled","qmes-stable-sidebar-open","qmes-safe-sidebar-open");
  document.querySelectorAll("[data-qmes-native-dropdown-hidden],[data-qmes-native-dropdown-left],[data-qmes-sidebar-source],[data-qmes-safe-native-menu],[data-qmes-legacy-dropdown-hidden],[data-qmes-dropdown-hold-bound]").forEach(node=>{
    ["data-qmes-native-dropdown-hidden","data-qmes-native-dropdown-left","data-qmes-sidebar-source","data-qmes-safe-native-menu","data-qmes-legacy-dropdown-hidden","data-qmes-dropdown-hold-bound"].forEach(name=>node.removeAttribute(name));
    ["display","visibility","opacity","pointer-events","position","left","right","top","bottom","transform","width","height","min-width","min-height","max-height","overflow","overflow-y","margin","padding","border","z-index"].forEach(name=>node.style.removeProperty(name));
  });

  const load=(selector,src,datasetKey)=>{
    if(document.querySelector(selector))return;
    const script=document.createElement("script");
    script.src=src;
    script.async=false;
    script.dataset[datasetKey]="true";
    document.head.appendChild(script);
  };

  load('script[data-qmes-ui-refinement-20260805]',"./js/qmes-ui-refinement-20260805.js?v=20260805-5","qmesUiRefinement20260805");
  load('script[data-qmes-lot-detail-alignment-20260805]',"./js/lot-detail-alignment-20260805.js?v=20260806-31","qmesLotDetailAlignment20260805");
  load('script[data-qmes-iqc-persistence-pagination-fix]',"./js/iqc-persistence-pagination-fix-20260806.js?v=20260806-6","qmesIqcPersistencePaginationFix");
  load('script[data-qmes-left-native-menu]',"./js/qmes-collapsible-side-menu.js?v=20260807-18","qmesLeftNativeMenu");
  load('script[data-qmes-ncr-separate-action-buttons]',"./js/ncr-separate-action-buttons.js?v=20260806-2","qmesNcrSeparateActionButtons");
  load('script[data-qmes-table-equipment-spacing-20260805]',"./js/table-and-equipment-spacing-20260805.js?v=20260805-10","qmesTableEquipmentSpacing20260805");
  load('script[data-qmes-equipment-layout-refinement-20260805]',"./js/equipment-layout-refinement-20260805.js?v=20260805-4","qmesTableEquipmentSpacing20260805");
  load('script[data-qmes-partner-equipment-fix-20260805]',"./js/partner-equipment-fix-20260805.js?v=20260806-5","qmesPartnerEquipmentFix20260805");
  load('script[data-qmes-partner-equipment-action-fix]',"./js/partner-equipment-action-fix-20260806.js?v=20260806-2","qmesPartnerEquipmentActionFix");
})();