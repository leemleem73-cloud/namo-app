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
 root.innerHTML='<section class="semi-panel"><header class="semi-head"><h2>반제품 재고관리</h2><div><button type="button" data-semi-refresh '+(loading?'disabled':'')+'>새로고침</button></div></header>'+
 '<div class="semi-filter"><label>반제품명 / 자체 LOT<input type="search" data-semi-query value="'+esc(query)+'" placeholder="전체"></label></div>'+
 '<div class="semi-list-head"><strong>▸ 반제품 현황</strong><div><span>총 '+matches.length+'건</span><button type="button" data-semi-reset>조건 지우기</button><button type="button" data-semi-search>조회</button></div></div>'+
 (model.warnings.length?'<p class="semi-warning" role="alert">'+esc(model.warnings.join(' / '))+'</p>':'')+
 '<div class="semi-table-wrap"><table class="semi-table"><colgroup>'+[4,17,14,11,11,11,17,15].map(width=>'<col style="width:'+width+'%">').join('')+'</colgroup><thead><tr>'+['No.','반제품명','자체 LOT NO','생산량(kg)','사용량(kg)','재고(kg)','확인 상태','내역 / 사용 기록'].map(title=>'<th>'+title+'</th>').join('')+'</tr></thead><tbody>'+
 (matches.slice((page-1)*10,page*10).map((row,i)=>'<tr><td>'+((page-1)*10+i+1)+'</td><td>'+esc(row.product)+'</td><td>'+esc(row.lot)+'</td><td>'+fmt(row.produced)+'</td><td>'+fmt(row.used+row.manualUsed)+'</td><td>'+fmt(row.balance)+'</td><td class="'+(row.issues.length?'semi-warning':'')+'">'+esc([...row.issues,...row.notices].join(' / ')||'확인 완료')+'</td><td><div class="semi-actions"><button type="button" data-semi-detail="'+esc(row.key)+'">내역</button><button type="button" data-semi-use="'+esc(row.key)+'" '+(loading?'disabled':'')+'>사용 기록</button></div></td></tr>').join('')||'<tr><td colspan="8">'+(loading?'반제품 재고 조회 중입니다.':'등록된 용액제조·중간배치 작업지시서가 없습니다.')+'</td></tr>')+
 '</tbody></table></div><nav class="semi-pager" aria-label="반제품 재고 페이지">'+Array.from({length:pages},(_,i)=>'<button type="button" data-semi-page="'+(i+1)+'" '+(page===i+1?'aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+'</nav><p class="semi-policy">생산량은 제조량 우선, 미입력 시 계획수량 기준입니다. 재고는 실투입량과 사용 기록을 차감해 표시합니다.</p>'+
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
root.addEventListener('click',event=>{const node=event.target.closest('button');if(!node)return;if(node.hasAttribute('data-semi-refresh'))load();if(node.hasAttribute('data-semi-search'))search();if(node.hasAttribute('data-semi-reset')){query='';page=1;paint();}if(node.dataset.semiPage){page=Number(node.dataset.semiPage);paint();}if(node.dataset.semiDetail)details(node.dataset.semiDetail);if(node.dataset.semiUse)edit(node.dataset.semiUse);});
window.addEventListener('qmes-stock-tab-changed',event=>{active=event.detail.kind==='semi';root.hidden=!active;if(active&&event.detail.reload!==false)load();});
function clear(){epoch++;orders=[];entries=[];model={rows:[],warnings:[],unallocated:[]};loading=false;page=1;query='';document.querySelectorAll('.semi-dialog').forEach(node=>node.close());paint();}
window.addEventListener('qmes-authenticated',()=>{clear();if(active&&pageRoot.classList.contains('active'))load();});
document.addEventListener('click',event=>{if(event.target.closest?.('#logoutBtn,[data-action="logout"],[data-auth="logout"]'))clear();});
new MutationObserver(()=>{if(active&&pageRoot.classList.contains('active'))load();}).observe(pageRoot,{attributes:true,attributeFilter:['class']});
const style=document.createElement('style');style.id='qmes-semi-namo-layout-20261119';style.textContent=`
#semiStock[hidden]{display:none!important}
html body #materialStock #semiStock{padding:0 16px 16px;background:#fff;color:#244260;font:400 12px Pretendard,"Noto Sans KR",Arial,sans-serif}
#semiStock *,.semi-dialog *{box-sizing:border-box}
#semiStock .semi-panel{border:1px solid #d5dce5;border-radius:8px;overflow:hidden;background:#fff}
#semiStock .semi-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid #d5dce5}
#semiStock .semi-head h2{margin:0;padding-left:12px;border-left:3px solid #2689ef;color:#173e66;font-size:18px;line-height:24px;font-weight:700}
#semiStock .semi-filter{display:flex;align-items:center;gap:20px;padding:12px 16px;background:#f3f7fb;border:0;border-bottom:1px solid #d5dce5}
#semiStock .semi-filter label{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;white-space:nowrap}
#semiStock .semi-filter input{width:230px;height:30px;min-height:30px;padding:0 9px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#244260;font:inherit;font-weight:400}
#semiStock .semi-list-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px}
#semiStock .semi-list-head strong{font-size:13px;font-weight:700}
#semiStock .semi-list-head>div{display:flex;align-items:center;gap:7px}
#semiStock .semi-list-head span{margin-right:8px;color:#64748b;font-size:12px}
#semiStock .semi-policy{margin:0;padding:0 16px 14px;color:#718397;font-size:11px;line-height:1.6}
.semi-note{color:#64748b;font-size:11px;line-height:1.7}
.semi-warning{color:#a56b22!important;line-height:1.5}
#semiStock .semi-table-wrap{margin:0 16px}
html body #materialStock #semiStock .semi-table-wrap,.semi-dialog .semi-table-wrap{overflow:auto;border:1px solid #d5dce5;box-shadow:none;border-radius:0}
html body #materialStock #semiStock table.semi-table,.semi-dialog table.semi-table{width:100%;min-width:850px;margin:0;border:0!important;border-collapse:separate!important;border-spacing:0!important;table-layout:fixed;box-shadow:none!important}
html body #materialStock #semiStock .semi-table :is(th,td),.semi-dialog .semi-table :is(th,td){border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;text-align:center!important;vertical-align:middle!important;font-family:inherit!important;font-size:12px!important;box-shadow:none!important}
html body #materialStock #semiStock .semi-table th,.semi-dialog .semi-table th{height:34px!important;min-height:0!important;padding:0 8px!important;line-height:20px!important;background:#e8f0f8!important;color:#244260!important;font-weight:600!important;white-space:nowrap}
html body #materialStock #semiStock .semi-table td,.semi-dialog .semi-table td{height:44px!important;padding:6px 8px!important;line-height:18px!important;background:#fff;font-weight:400!important;overflow-wrap:anywhere}
html body #materialStock #semiStock .semi-table tr>:last-child,.semi-dialog .semi-table tr>:last-child{border-right:0!important}
html body #materialStock #semiStock .semi-table tbody tr:last-child>td,.semi-dialog .semi-table tbody tr:last-child>td{border-bottom:0!important}
#semiStock .semi-table tbody tr:nth-child(even)>td{background:#fbfcfe}
#semiStock .semi-table tbody tr:hover>td{background:#eef6ff}
.semi-actions{display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap}
#semiStock button,.semi-dialog button{height:30px;min-height:0;padding:4px 10px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#315f94;font:600 12px Pretendard,"Noto Sans KR",Arial,sans-serif;cursor:pointer;box-shadow:none}
#semiStock .semi-table button{height:26px;padding:3px 7px;font-size:11px;white-space:nowrap}
#semiStock button:hover,.semi-dialog button:hover{background:#edf5fd;border-color:#80b6e6}
#semiStock button:focus-visible,.semi-dialog button:focus-visible{outline:2px solid #2689ef;outline-offset:2px}
#semiStock .semi-pager{display:flex;justify-content:center;gap:4px;padding:18px 16px}
#semiStock .semi-pager button{height:25px;min-width:25px;padding:2px 7px}
#semiStock .semi-pager [aria-current="page"]{background:#2f8de4!important;border-color:#2f8de4!important;color:#fff!important}
.semi-dialog{width:min(1000px,calc(100vw - 32px));max-height:90dvh;padding:0;border:1px solid #d5dce5;border-radius:8px;background:#fff;color:#244260;font:400 12px Pretendard,"Noto Sans KR",Arial,sans-serif}
.semi-dialog::backdrop{background:#203a5266}
.semi-dialog>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid #d5dce5}
.semi-dialog>header strong{padding-left:10px;border-left:3px solid #2689ef;font-size:16px;line-height:23px;font-weight:700}
.semi-dialog-body{padding:18px}
.semi-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.semi-form label{display:grid;gap:7px;color:#244260;font-weight:600}
.semi-form :is(input,select,textarea){width:100%;min-width:0;min-height:36px;padding:8px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#244260;font:400 12px Pretendard,"Noto Sans KR",Arial,sans-serif;color-scheme:light}
.semi-form textarea{min-height:70px;resize:vertical}
.semi-full{grid-column:1/-1}
.semi-form footer{display:flex;justify-content:flex-end;margin:4px -18px -18px;padding:12px 18px;border-top:1px solid #d5dce5}
.semi-form button[type="submit"]{background:#2f8de4;border-color:#2f8de4;color:#fff}
@media(max-width:700px){#semiStock .semi-head,#semiStock .semi-list-head{flex-wrap:wrap}#semiStock .semi-filter label{flex-wrap:wrap;white-space:normal}#semiStock .semi-filter input{width:min(230px,100%)}#semiStock .semi-list-head>div{flex-wrap:wrap}.semi-form{grid-template-columns:1fr}}
`;document.head.append(style);
try{active=sessionStorage.getItem('qmes-stock-tab')==='semi';}catch(_){}
if(active)window.qmesSelectStockKind?.('semi',false);root.hidden=!active;paint();if(active&&pageRoot.classList.contains('active'))load();
window.qmesSemiStock={refresh:load};
})();
