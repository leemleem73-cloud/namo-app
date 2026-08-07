/* QMES Stage 10 - work order / recipe bridge
 * Connects the Stage 9 item/recipe master to existing work orders.
 * Existing work-order records are only updated when an active recipe exists.
 */
(function installWorkOrderRecipeBridge(global){
  "use strict";

  const text=(v)=>String(v??"").trim();
  const upper=(v)=>text(v).toUpperCase();
  const num=(v)=>{const n=Number(String(v??"").replace(/,/g,""));return Number.isFinite(n)?n:0;};

  function ready(){
    return global.qmesRecipeMaster && global.qmesItemMaster && global.DB;
  }

  function sameMaterial(input,plan){
    const inputCode=upper(input?.code);
    const planCode=upper(plan?.code);
    if(inputCode && planCode && inputCode===planCode) return true;
    return upper(input?.name)===upper(plan?.name);
  }

  function prepareDraft(draft){
    if(!ready()) return {ok:false,reason:"품목/레시피 마스터 미로딩",draft};
    const product=text(draft?.item||draft?.productName||draft?.productCode);
    const planQty=num(draft?.plan||draft?.planQty||draft?.qty);
    const calc=global.qmesRecipeMaster.calculatePlan(product,planQty);
    if(!calc?.ok) return {ok:false,reason:calc?.reason||"활성 레시피 없음",draft};
    const inputs=calc.materials.map((m)=>({
      code:m.code,
      name:m.name,
      materialType:m.type,
      unit:m.unit||"kg",
      std:m.std,
      act:null,
      lot:"",
      materialLot:"",
      recipeVersion:calc.recipeVersion,
      recipeSource:"MASTER"
    }));
    return {ok:true,recipe:calc,draft:{...draft,inputs,recipeId:calc.recipeId,recipeVersion:calc.recipeVersion,recipeAppliedAt:new Date().toISOString()}};
  }

  function applyToWorkOrder(workOrderNo,options){
    if(!ready()) return {ok:false,reason:"품목/레시피 마스터 미로딩"};
    const wo=global.DB.woDocs?.[workOrderNo];
    if(!wo) return {ok:false,reason:"작업지시 없음"};
    const calc=global.qmesRecipeMaster.calculatePlan(wo.item||wo.itemCode,num(wo.plan));
    if(!calc?.ok) return {ok:false,reason:calc?.reason||"활성 레시피 없음",workOrderNo};
    const overwrite=options?.overwrite===true;
    const currentInputs=Array.isArray(wo.inputs)?wo.inputs:[];
    const nextInputs=calc.materials.map((m)=>{
      const current=currentInputs.find((r)=>sameMaterial(r,m));
      if(current && !overwrite && num(current.std)>0){
        return {...current,recipeVersion:calc.recipeVersion,recipeId:calc.recipeId};
      }
      return {
        ...(current||{}),
        code:m.code,
        name:m.name,
        materialType:m.type,
        unit:m.unit||current?.unit||"kg",
        std:m.std,
        act:current?.act??null,
        lot:current?.lot||"",
        materialLot:current?.materialLot||current?.lot||"",
        recipeVersion:calc.recipeVersion,
        recipeId:calc.recipeId,
        recipeSource:"MASTER"
      };
    });
    global.DB.woDocs[workOrderNo]={
      ...wo,
      inputs:nextInputs,
      recipeId:calc.recipeId,
      recipeVersion:calc.recipeVersion,
      recipeAppliedAt:new Date().toISOString()
    };
    if(typeof global.dbSave==="function") global.dbSave();
    global.dispatchEvent(new CustomEvent("qmes:workorder-recipe-applied",{detail:{workOrderNo,recipeId:calc.recipeId,recipeVersion:calc.recipeVersion}}));
    return {ok:true,workOrderNo,recipeId:calc.recipeId,recipeVersion:calc.recipeVersion,inputs:nextInputs};
  }

  function bootstrapRecipesFromExisting(){
    if(!ready()) return {created:0,skipped:0,errors:[]};
    const entries=Object.entries(global.DB.woDocs||{});
    const byProduct=new Map();
    entries.forEach(([woNo,wo])=>{
      const product=upper(wo?.item||wo?.itemCode);
      if(!product)return;
      const hasStd=(Array.isArray(wo?.inputs)?wo.inputs:[]).some((r)=>num(r.std)>0);
      if(!hasStd)return;
      const current=byProduct.get(product);
      if(!current || text(wo?.date)>text(current.wo?.date)) byProduct.set(product,{woNo,wo});
    });
    let created=0,skipped=0;
    const errors=[];
    byProduct.forEach(({woNo,wo})=>{
      try{
        if(global.qmesRecipeMaster.getActive(wo.item||wo.itemCode)){skipped+=1;return;}
        global.qmesRecipeMaster.deriveFromWorkOrder(woNo,"1.0");
        created+=1;
      }catch(error){errors.push({woNo,message:error.message});}
    });
    if(created && typeof global.dbSave==="function") global.dbSave();
    return {created,skipped,errors};
  }

  function applyAvailableRecipes(){
    if(!ready()) return {applied:0,skipped:0};
    let applied=0,skipped=0;
    Object.keys(global.DB.woDocs||{}).forEach((woNo)=>{
      const wo=global.DB.woDocs[woNo];
      if(wo?.recipeId){skipped+=1;return;}
      const result=applyToWorkOrder(woNo,{overwrite:false});
      if(result.ok) applied+=1; else skipped+=1;
    });
    return {applied,skipped};
  }

  function runBootstrap(){
    if(!ready()) return;
    const recipes=bootstrapRecipesFromExisting();
    const workOrders=applyAvailableRecipes();
    global.qmesWorkOrderRecipeBootstrap={recipes,workOrders,at:new Date().toISOString()};
    global.dispatchEvent(new CustomEvent("qmes:workorder-recipe-bridge-ready",{detail:global.qmesWorkOrderRecipeBootstrap}));
  }

  global.qmesPrepareWorkOrderFromRecipe=prepareDraft;
  global.qmesApplyRecipeToWorkOrder=applyToWorkOrder;
  global.qmesBootstrapRecipesFromWorkOrders=bootstrapRecipesFromExisting;

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(runBootstrap,0),{once:true});
  else setTimeout(runBootstrap,0);

  ["qmes:data-updated","qmes:workorder-synced"].forEach((eventName)=>global.addEventListener(eventName,()=>setTimeout(applyAvailableRecipes,0)));
})(window);
