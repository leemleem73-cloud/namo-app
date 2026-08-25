(function(){
  if(window.__QMES_BOM_CURRENT_EFFECTIVE_LABEL__) return;
  window.__QMES_BOM_CURRENT_EFFECTIVE_LABEL__=true;
  function apply(){
    const host=document.getElementById('qmes-chemical-bom-v5-host');
    if(!host) return;
    const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      if(!n.nodeValue) return;
      n.nodeValue=n.nodeValue
        .replace(/사용중 확정/g,'현재 적용 확정')
        .replace(/사용중/g,'현재 적용')
        .replace(/Master BOM으로 현재 적용 확정했습니다/g,'Master BOM으로 현재 적용 확정했습니다');
    });
    host.querySelectorAll('select[data-f="status"] option').forEach(o=>{
      if(o.value==='사용중' || o.textContent.trim()==='사용중') o.textContent='현재 적용';
    });
    const hint=host.querySelector('#qbm-state');
    if(hint && hint.textContent.includes('사용중')) hint.innerHTML=hint.innerHTML.replace(/사용중/g,'현재 적용');
  }
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('click',()=>setTimeout(apply,30),true);
  setInterval(apply,800);
  setTimeout(apply,100);
})();