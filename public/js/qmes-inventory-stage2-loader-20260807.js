/* Stage 2 inventory loader: raw-material live stock + finished-goods stock. */
(function(){
  const scripts=[
    "./js/inventory-live-20260807.js?v=20260807-1",
    "./js/finished-goods-inventory-20260807.js?v=20260807-1"
  ];
  function loadAt(index){
    if(index>=scripts.length){
      window.dispatchEvent(new CustomEvent("qmes:inventory-stage2-ready"));
      return;
    }
    const src=scripts[index];
    if(document.querySelector(`script[src=\"${src}\"]`)){ loadAt(index+1); return; }
    const script=document.createElement("script");
    script.src=src;
    script.async=false;
    script.onload=()=>loadAt(index+1);
    script.onerror=()=>console.error("[QMES] 재고 2단계 모듈 로드 실패",src);
    document.head.appendChild(script);
  }
  function start(){ loadAt(0); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
