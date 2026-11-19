(function(){'use strict';
const core=window.qmesSemiStockCore,pageRoot=document.getElementById('materialStock'),tabs=pageRoot?.querySelector('.fg-tabs');if(!core||!tabs)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=value=>value===null?'미확인':Number(value).toLocaleString('ko-KR',{maximumFractionDigits:6});
const button=document.createElement('button');button.type='button';button.dataset.stockTab='semi';button.setAttribute('aria-pressed','false');button.textContent='반제품 재고';tabs.querySelector('[data-stock-tab="finished"]').before(button);
const root=document.createElement('div');root.id='semiStock';root.hidden=true;pageRoot.append(root);
let model={rows:[],warnings:[],unallocated:[]},orders=[],entries=[],active=false,loading=false,epoch=0,page=1,query='';
async function request(url,options={}){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),...options});const result=await response.json();if(!response.ok||!result.success)throw Error(result.message||'반제품 재고를 조회하지 못했습니다.');return result.data;}
function paint(){
 const matches=model.rows.filter(row=>(row.product+' '+row.lot+' '+row.sourceIds.join(' ')).toLowerCase().includes(query.toLowerCase())),pages=Math.max(1,Math.ceil(matches.length/10));page=Math.min(page,pages);
 root.innerHTML='<section class="semi-panel"><header class="semi-head"><h2>반제품 재고</h2><div><button type="button" data-semi-refresh '+(loading?'disabled':'')+'>새로고침</button></div></header>'+
 '<div class="semi-filter"><label>반제품명 / 자체 LOT<input type="search" data-semi-query value="'+esc(query)+'" placeholder="전체"></label><button type="button" data-semi-search>조회</button><span>총 '+matches.length+'건</span></div>'+
 '<p class="semi-note">용액제조·중간배치 작업지시서의 제조량을 반영합니다. 제조량 입력이 없으면 계획수량 기준입니다. 사용량은 연결된 작업지시서 실투입량과 사용 기록을 차감합니다.</p>'+
 (model.warnings.length?'<p class="semi-warning" role="alert">'+esc(model.warnings.join(' / '))+'</p>':'')+
 '<div class="semi-table-wrap"><table class="semi-table"><colgroup>'+[5,18,15,12,12,12,16,18].map(width=>'<col style="width:'+width+'%">').join('')+'</colgroup><thead><tr>'+['No.','반제품명','자체 LOT NO','생산량(kg)','사용량(kg)','재고(kg)','확인 상태','내역 / 사용 기록'].map(title=>'<th>'+title+'</th>').join('')+'</tr></thead><tbody>'+
 (matches.slice((page-1)*10,page*10).map((row,i)=>'<tr><td>'+((page-1)*10+i+1)+'</td><td>'+esc(row.product)+'</td><td>'+esc(row.lot)+'</td><td>'+fmt(row.produced)+'</td><td>'+fmt(row.used+row.manualUsed)+'</td><td>'+fmt(row.balance)+'</td><td class="'+(row.issues.length?'semi-warning':'')+'">'+esc([...row.issues,...row.notices].join(' / ')||'확인 완료')+'</td><td><div class="semi-actions"><button type="button" data-semi-detail="'+esc(row.key)+'">내역</button><button type="button" data-semi-use="'+esc(row.key)+'" '+(loading?'disabled':'')+'>사용 기록</button></div></td></tr>').join('')||'<tr><td colspan="8">'+(loading?'반제품 재고 조회 중입니다.':'등록된 용액제조·중간배치 작업지시서가 없습니다.')+'</td></tr>')+
 '</tbody></table></div><nav class="semi-pager" aria-label="반제품 재고 페이지">'+Array.from({length:pages},(_,i)=>'<button type="button" data-semi-page="'+(i+1)+'" '+(page===i+1?'aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+'</nav>'+
 (model.unallocated.length?'<p class="semi-warning">사용 연결 확인 '+model.unallocated.length+'건 · '+esc(model.unallocated.map(row=>(row.lot||'-')+' '+row.reason).join(' / '))+'</p>':'')+'</section>';
 root.querySelector('[data-semi-query]').addEventListener('keydown',event=>{if(event.key==='Enter')search();});
}
function search(){query=root.querySelector('[data-semi-query]').value.trim();page=1;paint();}
async function load(){
 if(loading)return;loading=true;const version=epoch;paint();
 try{
  await window.qmesAuthDataReady?.wait();if(version!==epoch)return;
  const responses=await Promise.all([['/api/qmes/work-orders','작업지시서'],['/api/qmes-sync/inventory','반제품 사용 기록']].map(async([url,label])=>{try{const value=await request(url);if(!Array.isArray(value))throw Error('조회 형식 확인 필요');return {value};}catch(error){return {value:[],error:label+': '+error.message};}}));
  if(version!==epoch)return;orders=responses[0].value;entries=core.readEntries(responses[1].value);model=core.build({orders,entries,sourceErrors:responses.filter(value=>value.error).map(value=>value.error)});
 }catch(error){if(version===epoch)model=core.build({orders,entries,sourceErrors:[error.message||'반제품 재고 조회 실패']});}finally{if(version===epoch){loading=false;paint();}}
}
function dialog(title,body){const node=document.createElement('dialog');node.className='semi-dialog';node.innerHTML='<header><strong>'+esc(title)+'</strong><button type="button" data-semi-close>닫기</button></header><div class="semi-dialog-body">'+body+'</div>';node.querySelector('[data-semi-close]').onclick=()=>node.close();node.addEventListener('close',()=>node.remove(),{once:true});document.body.append(node);node.showModal();return node;}
function details(key){
 const row=model.rows.find(value=>value.key===key);if(!row)return;
 dialog('반제품 생산·사용 내역','<p><b>'+esc(row.product)+'</b> · LOT '+esc(row.lot)+' · 재고 '+fmt(row.balance)+' kg</p><p class="semi-note">'+esc(row.notices.join(' / '))+'</p><div class="semi-table-wrap"><table class="semi-table"><thead><tr>'+['일자','구분','입고 / 증가(kg)','사용 / 차감(kg)','작업지시번호 / 사유'].map(value=>'<th>'+value+'</th>').join('')+'</tr></thead><tbody>'+row.ledger.map(item=>'<tr><td>'+esc(item.date||'-')+'</td><td>'+esc(item.type)+'</td><td>'+(item.direction>0?fmt(item.quantity):'-')+'</td><td>'+(item.direction<0?fmt(item.quantity):'-')+'</td><td>'+esc([item.document,item.note].filter(Boolean).join(' · '))+'</td></tr>').join('')+'</tbody></table></div>');
}
function edit(key){
 const row=model.rows.find(value=>value.key===key);if(!row||loading)return;
 const version=epoch,day=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
 const node=dialog('반제품 사용 기록','<p><b>'+esc(row.product)+'</b> · LOT '+esc(row.lot)+'</p><p class="semi-note">작업지시서에 실투입량을 입력한 사용 건은 자동 반영됩니다. 같은 사용량을 중복 등록하지 마세요. LOT 미부여 반제품은 이 제조 기록에만 반영합니다.</p>'+
 '<form class="semi-form"><label>사용일<input name="date" type="date" required value="'+day+'"></label><label>구분<select name="type">'+Object.entries(core.labels).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label><label>수량(kg)<input name="quantity" type="number" min="0.000001" step="any" required></label><label class="semi-full">사유 / 사용 작업지시번호<textarea name="note" required></textarea></label><p class="semi-warning semi-full" data-semi-error role="alert"></p><footer class="semi-full"><button type="submit">사용 기록 저장</button></footer></form>');
 const form=node.querySelector('form');form.onsubmit=async event=>{
  event.preventDefault();const values=Object.fromEntries(new FormData(form)),entry={id:crypto.randomUUID(),stockKey:row.key,product:row.product,lot:row.lot,type:values.type,date:values.date,quantity:core.number(values.quantity),note:values.note.trim(),status:'confirmed',createdAt:new Date().toISOString()},error=form.querySelector('[data-semi-error]');
  const invalid=core.validate(entry);if(invalid){error.textContent=invalid;return;}const submit=form.querySelector('[type="submit"]');submit.disabled=true;
  try{
   const confirm=window.qmesConfirm||window.confirm;if(!await confirm('이 반제품 사용 기록을 저장하시겠습니까?'))return;
   if(version!==epoch)throw Error('계정이 변경되었습니다. 다시 열어주세요.');
   const result=await request('/api/qmes-sync/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:core.PREFIX+entry.id,payload:{module:'semiStock',schema:1,entry}})});
   if(result?.record_key!==core.PREFIX+entry.id)throw Error('저장 결과를 확인하지 못했습니다. 다시 조회해 주세요.');
   if(version!==epoch)return;node.close();await load();window.toast?.('반제품 사용 기록을 저장했습니다.');
  }catch(failure){error.textContent=failure.message;}finally{submit.disabled=false;}
 };
}
root.addEventListener('click',event=>{const node=event.target.closest('button');if(!node)return;if(node.hasAttribute('data-semi-refresh'))load();if(node.hasAttribute('data-semi-search'))search();if(node.dataset.semiPage){page=Number(node.dataset.semiPage);paint();}if(node.dataset.semiDetail)details(node.dataset.semiDetail);if(node.dataset.semiUse)edit(node.dataset.semiUse);});
window.addEventListener('qmes-stock-tab-changed',event=>{active=event.detail.kind==='semi';root.hidden=!active;if(active&&event.detail.reload!==false)load();});
function clear(){epoch++;orders=[];entries=[];model={rows:[],warnings:[],unallocated:[]};loading=false;page=1;query='';document.querySelectorAll('.semi-dialog').forEach(node=>node.close());paint();}
window.addEventListener('qmes-authenticated',()=>{clear();if(active&&pageRoot.classList.contains('active'))load();});
document.addEventListener('click',event=>{if(event.target.closest?.('#logoutBtn,[data-action="logout"],[data-auth="logout"]'))clear();});
new MutationObserver(()=>{if(active&&pageRoot.classList.contains('active'))load();}).observe(pageRoot,{attributes:true,attributeFilter:['class']});
const style=document.createElement('style');style.textContent=`
#semiStock[hidden]{display:none!important}
#semiStock{padding:16px;background:#fff;color:#244260;font:12px Pretendard,"Noto Sans KR",Arial,sans-serif}
.semi-head{display:flex;justify-content:space-between;align-items:center}.semi-head h2{margin:4px 0 16px;font-size:18px}.semi-filter{display:flex;gap:12px;align-items:center;padding:12px;background:#f4f8fc;border:1px solid #d5dce5}.semi-filter label{display:flex;align-items:center;gap:10px}.semi-filter input{height:30px;border:1px solid #c7d6e5;border-radius:4px;padding:5px 8px}.semi-note{color:#64748b;line-height:1.7}.semi-warning{color:#b45309!important;line-height:1.5}.semi-table-wrap{overflow:auto;border:1px solid #d5dce5}.semi-table{width:100%;min-width:850px;border-collapse:collapse;table-layout:fixed}.semi-table th,.semi-table td{border:0;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;text-align:center;vertical-align:middle;overflow-wrap:anywhere}.semi-table th{height:34px;padding:0 8px;background:#e8f0f8;font-size:12px;font-weight:600}.semi-table td{height:44px;padding:6px 8px;font-size:12px}.semi-table tr>:last-child{border-right:0}.semi-table tbody tr:last-child>td{border-bottom:0}.semi-actions{display:flex;gap:5px;justify-content:center;flex-wrap:wrap}.semi-pager{display:flex;gap:5px;justify-content:center;padding:18px}.semi-pager [aria-current]{background:#2f8de4!important;color:#fff!important}
#semiStock button,.semi-dialog button{height:28px;padding:3px 9px;border:1px solid #c7d6e5;background:#fff;color:#315f94;border-radius:4px;font:600 11px Pretendard,Arial,sans-serif;cursor:pointer}.semi-dialog{width:min(1000px,calc(100vw - 32px));max-height:90dvh;border:1px solid #d5dce5;border-radius:8px;padding:0;color:#244260;font:12px Pretendard,"Noto Sans KR",Arial,sans-serif}.semi-dialog::backdrop{background:#203a5266}.semi-dialog>header{padding:16px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d5dce5}.semi-dialog-body{padding:18px}.semi-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.semi-form label{display:grid;gap:6px}.semi-form :is(input,select,textarea){box-sizing:border-box;width:100%;min-height:34px;border:1px solid #c7d6e5;background:#fff;color:#244260;border-radius:4px;padding:7px;font:inherit}.semi-form textarea{min-height:70px}.semi-full{grid-column:1/-1}.semi-form footer{display:flex;justify-content:flex-end}
@media(max-width:700px){.semi-filter{flex-wrap:wrap}.semi-filter label{flex-wrap:wrap}.semi-form{grid-template-columns:1fr}}
`;document.head.append(style);
try{active=sessionStorage.getItem('qmes-stock-tab')==='semi';}catch(_){}
if(active)window.qmesSelectStockKind?.('semi',false);root.hidden=!active;paint();if(active&&pageRoot.classList.contains('active'))load();
window.qmesSemiStock={refresh:load};
})();
