(function(){'use strict';
function install(){
const root=document.querySelector('#inventory .namo-new-stock');if(!root||root.dataset.resetControl)return;
const head=root.querySelector('header > div:last-child');if(!head)return;
root.dataset.resetControl='1';
const btn=document.createElement('button');btn.type='button';btn.textContent='재고현황 전체 삭제';btn.style.cssText='border:1px solid #d6a4a4;color:#9f3030;background:white';head.append(btn);
btn.onclick=async()=>{
const first=window.confirm('현재 재고현황 목록의 모든 항목을 비웁니다. 전체 장부잔량이 0kg으로 변경되어 목록에서 사라지며, 원본 입출고 이력은 보존됩니다. 계속하시겠습니까?');if(!first)return;
const word=window.prompt('관리자만 실행 가능합니다. 확인을 위해 정확히 입력하세요: 전체재고 0 초기화');if(word!=='전체재고 0 초기화'){window.alert('확인 문구가 일치하지 않아 취소했습니다.');return;}
btn.disabled=true;
try{
const response=await fetch('/api/inventory/admin/reset-balances',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirmation:word})});
const result=await response.json().catch(()=>({}));
if(!response.ok||result.success===false)throw Error(result.message||'초기화 실패');
window.alert('재고현황 전체 비우기 완료. 처리 LOT '+(result.data?.resetLots||0)+'건. 이력은 보존되었습니다.');
root.querySelector('#stockReload')?.click();
}catch(e){window.alert('초기화가 실행되지 않았습니다: '+e.message);}finally{btn.disabled=false;}
};
}
let n=0;const timer=setInterval(()=>{install();if(document.querySelector('#inventory .namo-new-stock')?.dataset.resetControl||++n>70)clearInterval(timer);},300);
})();