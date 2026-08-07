/* QMES Stage 9 - item / recipe master service
 * Minimal master-data layer for Namochemical MES.
 * - Reuses current DB data when possible
 * - Keeps existing production / IQC records untouched
 * - Provides APIs for product/material masters and recipe-based plan quantities
 */
(function installItemRecipeMaster(global){
  "use strict";

  const text=(v)=>String(v??"").trim();
  const upper=(v)=>text(v).toUpperCase();
  const num=(v)=>{const n=Number(String(v??"").replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const now=()=>new Date().toISOString();

  function ensureDb(){
    global.DB=global.DB||{};
    if(!global.DB.itemMaster||typeof global.DB.itemMaster!=="object") global.DB.itemMaster={};
    if(!global.DB.recipeMaster||typeof global.DB.recipeMaster!=="object") global.DB.recipeMaster={};
  }

  function normalizeCode(code,name,type){
    const raw=upper(code).replace(/[^A-Z0-9_-]/g,"");
    if(raw)return raw;
    const prefix=type==="제품"?"FG":type==="중간재"?"WIP":"RM";
    const slug=upper(name).replace(/[^A-Z0-9가-힣]/g,"").slice(0,24)||"ITEM";
    return `${prefix}-${slug}`;
  }

  function upsertItem(input){
    ensureDb();
    const name=text(input?.name);
    if(!name) throw new Error("품목명은 필수입니다.");
    const type=text(input?.type)||"원재료";
    const code=normalizeCode(input?.code,name,type);
    const prev=global.DB.itemMaster[code]||{};
    const row={
      ...prev,
      code,
      name,
      type,
      unit:text(input?.unit||prev.unit||"kg")||"kg",
      active:input?.active!==false,
      spec:text(input?.spec??prev.spec),
      storage:text(input?.storage??prev.storage),
      supplier:text(input?.supplier??prev.supplier),
      updatedAt:now()
    };
    global.DB.itemMaster[code]=row;
    return row;
  }

  function seedFromExistingData(){
    ensureDb();
    const before=Object.keys(global.DB.itemMaster).length;

    (Array.isArray(global.DB.iqc)?global.DB.iqc:[]).forEach((r)=>{
      const name=text(r?.name||r?.material||r?.item);
      if(!name)return;
      upsertItem({code:r?.code,name,type:"원재료",unit:r?.unit||"kg",supplier:r?.supplier});
    });

    (Array.isArray(global.DB.batches)?global.DB.batches:[]).forEach((r)=>{
      const name=text(r?.item);
      if(!name)return;
      const type=/중간재|바인더/i.test(text(r?.workType)||name)?"중간재":"제품";
      upsertItem({code:r?.itemCode,name,type,unit:r?.unit||"kg"});
    });

    Object.values(global.DB.woDocs||{}).forEach((wo)=>{
      const product=text(wo?.item);
      if(product){
        const type=/중간재|바인더/i.test(text(wo?.workType)||product)?"중간재":"제품";
        upsertItem({code:wo?.itemCode,name:product,type,unit:wo?.unit||"kg"});
      }
      (Array.isArray(wo?.inputs)?wo.inputs:[]).forEach((r)=>{
        const name=text(r?.name);
        if(!name)return;
        const type=/중간재/i.test(text(r?.materialType))?"중간재":"원재료";
        upsertItem({code:r?.code,name,type,unit:r?.unit||"kg"});
      });
    });

    return {before,after:Object.keys(global.DB.itemMaster).length,added:Object.keys(global.DB.itemMaster).length-before};
  }

  function listItems(filter){
    ensureDb();
    const rows=Object.values(global.DB.itemMaster);
    const type=text(filter?.type);
    const q=upper(filter?.q);
    return rows.filter((r)=>!type||r.type===type).filter((r)=>!q||upper(`${r.code} ${r.name}`).includes(q)).sort((a,b)=>a.code.localeCompare(b.code));
  }

  function getItem(codeOrName){
    ensureDb();
    const key=upper(codeOrName);
    return Object.values(global.DB.itemMaster).find((r)=>upper(r.code)===key||upper(r.name)===key)||null;
  }

  function saveRecipe(input){
    ensureDb();
    const product=getItem(input?.productCode||input?.productName);
    if(!product) throw new Error("레시피 제품이 품목 마스터에 없습니다.");
    const version=text(input?.version||"1.0")||"1.0";
    const materials=(Array.isArray(input?.materials)?input.materials:[]).map((m,index)=>{
      const item=getItem(m?.code||m?.name);
      if(!item) throw new Error(`레시피 ${index+1}번째 원료가 품목 마스터에 없습니다.`);
      const ratio=num(m?.ratio);
      const qtyPerBatch=num(m?.qtyPerBatch);
      if(!(ratio>0)||!(qtyPerBatch>=0)) throw new Error(`${item.name}: 배합비는 0보다 커야 합니다.`);
      return {code:item.code,name:item.name,type:item.type,unit:text(m?.unit||item.unit||"kg"),ratio:Number(ratio.toFixed(6)),qtyPerBatch:Number(qtyPerBatch.toFixed(6))};
    });
    if(!materials.length) throw new Error("레시피 원료가 없습니다.");
    const totalRatio=materials.reduce((s,m)=>s+m.ratio,0);
    const recipe={
      id:`${product.code}@${version}`,
      productCode:product.code,
      productName:product.name,
      version,
      active:input?.active!==false,
      basisQty:num(input?.basisQty)||100,
      basisUnit:text(input?.basisUnit||product.unit||"kg")||"kg",
      materials,
      totalRatio:Number(totalRatio.toFixed(6)),
      note:text(input?.note),
      updatedAt:now()
    };
    global.DB.recipeMaster[recipe.id]=recipe;
    return recipe;
  }

  function getActiveRecipe(productCodeOrName){
    ensureDb();
    const product=getItem(productCodeOrName);
    if(!product)return null;
    return Object.values(global.DB.recipeMaster)
      .filter((r)=>r.productCode===product.code&&r.active!==false)
      .sort((a,b)=>String(b.version).localeCompare(String(a.version),undefined,{numeric:true})) [0]||null;
  }

  function calculatePlan(productCodeOrName,planQty){
    const recipe=getActiveRecipe(productCodeOrName);
    if(!recipe) return {ok:false,reason:"활성 레시피 없음",materials:[]};
    const qty=num(planQty);
    if(!(qty>0)) return {ok:false,reason:"생산계획량 오류",materials:[]};
    const total=recipe.totalRatio||recipe.materials.reduce((s,m)=>s+m.ratio,0);
    const materials=recipe.materials.map((m)=>({
      ...m,
      std:Number((qty*(m.ratio/total)).toFixed(3)),
      planQty:qty,
      recipeVersion:recipe.version
    }));
    return {ok:true,recipeId:recipe.id,recipeVersion:recipe.version,productCode:recipe.productCode,productName:recipe.productName,planQty:qty,unit:recipe.basisUnit,materials};
  }

  function deriveRecipeFromWorkOrder(workOrderNo,version){
    ensureDb();
    const wo=global.DB.woDocs?.[workOrderNo];
    if(!wo) throw new Error("작업지시를 찾을 수 없습니다.");
    const product=upsertItem({code:wo.itemCode,name:wo.item,type:/중간재|바인더/i.test(text(wo.workType)||text(wo.item))?"중간재":"제품",unit:wo.unit||"kg"});
    const inputs=(Array.isArray(wo.inputs)?wo.inputs:[]).filter((r)=>num(r.std)>0);
    const sum=inputs.reduce((s,r)=>s+num(r.std),0);
    if(!(sum>0)) throw new Error("작업지시에 원료 기준량이 없습니다.");
    inputs.forEach((r)=>upsertItem({code:r.code,name:r.name,type:text(r.materialType)||"원재료",unit:r.unit||"kg"}));
    return saveRecipe({
      productCode:product.code,
      version:version||`WO-${workOrderNo}`,
      basisQty:num(wo.plan)||sum,
      basisUnit:wo.unit||"kg",
      materials:inputs.map((r)=>({code:getItem(r.code||r.name)?.code,ratio:num(r.std),qtyPerBatch:num(r.std),unit:r.unit||"kg"})),
      note:`작업지시 ${workOrderNo}에서 생성`
    });
  }

  ensureDb();
  const seedResult=seedFromExistingData();
  global.qmesItemMaster={upsert:upsertItem,list:listItems,get:getItem,seed:seedFromExistingData};
  global.qmesRecipeMaster={save:saveRecipe,getActive:getActiveRecipe,calculatePlan,deriveFromWorkOrder:deriveRecipeFromWorkOrder};
  global.dispatchEvent(new CustomEvent("qmes:item-recipe-master-ready",{detail:{items:Object.keys(global.DB.itemMaster).length,recipes:Object.keys(global.DB.recipeMaster).length,seedResult}}));
})(window);
