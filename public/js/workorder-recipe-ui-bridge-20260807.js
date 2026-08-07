/* QMES Stage 12 - work-order recipe UI bridge
 * UI helper layer for IssueWoTab.
 * Keeps legacy BOM fallback while preferring active recipe master data.
 */
(function installWorkOrderRecipeUiBridge(global){
  "use strict";
  const text=(v)=>String(v??"").trim();
  const num=(v)=>{const n=Number(String(v??"").replace(/,/g,""));return Number.isFinite(n)?n:0;};

  function getPlan(product,qty){
    if(!global.qmesRecipeMaster || typeof global.qmesRecipeMaster.calculatePlan!=="function"){
      return {ok:false,reason:"레시피 마스터 미로딩",materials:[]};
    }
    return global.qmesRecipeMaster.calculatePlan(product,qty);
  }

  function toPlanItems(product,qty,currentItems){
    const result=getPlan(product,qty);
    if(!result.ok)return result;
    const current=Array.isArray(currentItems)?currentItems:[];
    const items=result.materials.map((m,index)=>{
      const old=current.find((r)=>text(r.code)===text(m.code)||text(r.name)===text(m.name))||{};
      return {
        ...old,
        seq:index+1,
        code:m.code,
        name:m.name,
        materialType:m.type,
        unit:m.unit||old.unit||"kg",
        base:m.std,
        plan:m.std,
        std:m.std,
        actual:old.actual??old.act??"",
        act:old.act??null,
        materialLot:old.materialLot||old.lot||"",
        lot:old.lot||old.materialLot||"",
        containerNo:old.containerNo||"",
        inputStatus:old.inputStatus||"신규",
        availableQty:old.availableQty??"",
        remaining:old.remaining??null,
        note:old.note||"",
        recipeId:result.recipeId,
        recipeVersion:result.recipeVersion,
        recipeSource:"MASTER"
      };
    });
    return {...result,items};
  }

  function listProducts(){
    if(!global.qmesItemMaster || typeof global.qmesItemMaster.list!=="function")return [];
    return global.qmesItemMaster.list({}).filter((r)=>r.active!==false&&(r.type==="제품"||r.type==="중간재"));
  }

  function status(product,qty){
    const result=getPlan(product,qty);
    if(result.ok)return {tone:"ok",label:`레시피 ${result.recipeVersion} 적용 가능`,recipeId:result.recipeId};
    return {tone:"warn",label:result.reason||"등록 레시피 없음",recipeId:""};
  }

  global.qmesWorkOrderRecipeUi={getPlan,toPlanItems,listProducts,status};
  global.dispatchEvent(new CustomEvent("qmes:workorder-recipe-ui-ready"));
})(window);
