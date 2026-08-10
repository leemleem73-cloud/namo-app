(function(){
  function evaluateInput(input){
    if(!input || !input.closest('.qmes-ipad-pop')) return;
    const wrap=input.closest('.qmes-ipad-triple,.qmes-ipad-repeat-choice');
    if(!wrap) return;
    const card=input.closest('.qmes-ipad-measure-card');
    const key=card&&card.querySelector('.qmes-ipad-measure-head span')?.textContent?.trim();
    const value=String(input.value||'').trim();
    input.classList.remove('is-spec-ng');
    if(!key||!value||value.toLowerCase()==='overflow'||typeof window.autoJudge!=='function') return;
    try{
      if(window.autoJudge(key,value)==='불합격') input.classList.add('is-spec-ng');
    }catch(error){}
  }
  function refresh(root){
    (root||document).querySelectorAll('.qmes-ipad-triple input,.qmes-ipad-repeat-choice input').forEach(evaluateInput);
  }
  document.addEventListener('input',function(event){evaluateInput(event.target);},true);
  document.addEventListener('change',function(event){evaluateInput(event.target);},true);
  const observer=new MutationObserver(function(){refresh(document);});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){refresh(document);});
  else refresh(document);
})();
