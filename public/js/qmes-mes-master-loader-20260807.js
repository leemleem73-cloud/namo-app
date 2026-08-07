/* QMES Stage 11 operational loader
 * Loads item/recipe master first, then work-order recipe bridge.
 */
(function(){
  const files=[
    "./js/item-recipe-master-20260807.js?v=20260807-1",
    "./js/workorder-recipe-bridge-20260807.js?v=20260807-1"
  ];
  function exists(src){
    const base=src.split("?")[0];
    return Array.from(document.scripts).some((s)=>(s.getAttribute("src")||"").split("?")[0]===base);
  }
  function load(i){
    if(i>=files.length){
      window.dispatchEvent(new CustomEvent("qmes:mes-master-ready"));
      return;
    }
    const src=files[i];
    if(exists(src)){load(i+1);return;}
    const script=document.createElement("script");
    script.src=src;
    script.async=false;
    script.onload=()=>load(i+1);
    script.onerror=()=>console.error("[QMES] MES 마스터 모듈 로드 실패",src);
    document.head.appendChild(script);
  }
  const start=()=>load(0);
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
