/* Restore the last QMES view by replaying navigation only. Never replay a save or deletion. */
(function(){
'use strict';
const KEY='qmes-last-view-v1',pagerSelector='.ip-pagination,.nwi-pagination,.qpu-pager,.qof-pager,.qpo-pagination,.eq-pagination,.ncr-pagination,.quality-approval-pager';
const denied=/삭제|저장|발송|승인|검토 완료|최종 승인|인쇄|출력|로그아웃/;
let saved=null,restoring=false,bootPending=true,trail=[],baseFields=[],basePage=1,timer=null;
try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch(_){}
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const user=()=>String(window.__QMES_CURRENT_USER__?.id||window.__QMES_CURRENT_USER__?.name||'');
const page=()=>document.querySelector('.sidebar .menu.active[data-page]')?.dataset.page||'main';
function visible(node){return !!node&&node.isConnected&&!node.hidden&&getComputedStyle(node).display!=='none'&&node.getClientRects().length>0;}
function viewRoot(){
 const workspace=document.getElementById('mainWorkspace');
 if(workspace?.classList.contains('active'))return workspace;
 const section=document.getElementById(page());if(!section)return null;
 return [...section.querySelectorAll('#namo-work-detail,.qpu-detail,.qpu-detail-panel,#eqDetail.show,.eq-wo-overlay,#namo-purchase-new-enterprise,.ncr-editor-shell,.ncr-form,.ncr-detail,.ncr-detail-panel')].find(visible)||null;
}
function fields(root){
 return [...(root?.querySelectorAll('input,select,textarea')||[])].filter(el=>!['password','file','submit','button'].includes(el.type)&&!el.disabled&&!el.readOnly&&!/password|token|secret/i.test(el.name||el.id||''));
}
function captureFields(root){
 return fields(root).map((el,index)=>({index,id:el.id||'',name:el.name||'',field:el.dataset.standardField||el.dataset.pqcField||'',type:el.type,value:el.value,checked:el.checked}));
}
function restoreFields(root,values){
 const controls=fields(root);
 for(const state of values||[]){
  let el=state.id?controls.find(node=>node.id===state.id):null;
  if(!el&&state.field)el=controls.find(node=>(node.dataset.standardField||node.dataset.pqcField)===state.field);
  if(!el)el=controls[state.index];
  if(!el||el.type!==state.type)continue;
  let changed=false;
  if(el.type==='checkbox'||el.type==='radio'){changed=el.checked!==state.checked;el.checked=state.checked;}
  else{
   if(el.tagName==='SELECT'&&state.value&&![...el.options].some(option=>option.value===state.value))el.add(new Option(state.value,state.value));
   changed=el.value!==state.value;el.value=state.value;
  }
  if(changed){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  if(el.dataset.standardField){const trigger=root.querySelector('[data-standard-choice="'+el.dataset.standardField+'"]');if(trigger?.firstElementChild)trigger.firstElementChild.textContent=el.value;}
 }
}
function pagerNumber(root){
 const active=[...(root?.querySelectorAll(pagerSelector)||[])].flatMap(node=>[...node.querySelectorAll('button.active,button[aria-current="page"]')]).find(button=>/^\d+$/.test(clean(button.textContent)));
 return Number(active?.textContent)||1;
}
function remember(){
 if(restoring||bootPending)return;
 const root=viewRoot(),section=document.getElementById(page());
 const snapshot={version:1,user:user(),page:page(),trail:root?trail:[],baseFields:root?baseFields:[],basePage:root?basePage:pagerNumber(section),fields:root?captureFields(root):[],title:root===document.getElementById('mainWorkspace')?document.getElementById('workspaceTitle')?.textContent:'',sidebarPage:root?pagerNumber(root):1,scroll:window.scrollY,contentScroll:document.querySelector('main.content')?.scrollTop||0,materialRows:root?.querySelectorAll('#workMaterialTable tbody tr').length||0};
 if(root&&!trail.length)return;
 try{sessionStorage.setItem(KEY,JSON.stringify(snapshot));}catch(_){}
}
function schedule(){if(restoring||bootPending)return;clearTimeout(timer);timer=setTimeout(remember,100);}
function identity(row){
 const data={};for(const [key,value]of Object.entries(row.dataset))if(/id$|key$|workSaved|sourceId|sourceKey|iqcId|standardId/i.test(key)&&value)data[key]=value;
 return {data,text:clean(row.textContent)};
}
function action(target){
 const section=document.getElementById(page());
 if(!section&&!viewRoot())return null;
 if(target.closest('input,select,textarea,[role="option"],.std-choice-popup,.nwo-popup,.nwo-calendar'))return null;
 const button=target.closest('button,a'),text=clean(button?.textContent);
 if(button&&denied.test(text))return null;
 const item=target.closest('.am-list-item');if(item)return {kind:'item',record:item.dataset.amRecordId||'',index:item.dataset.amIndex||''};
 const row=target.closest('tr.data-row,tr[data-work-saved],tr[data-source-id],tr[data-standard-id]');
 if(row&&section?.contains(row)){
  if(target.closest('label')||button&&!/상세|수정|성적서/.test(text)&&button.tagName!=='A')return null;
  return {kind:'row',...identity(row),control:button?{tag:button.tagName,text}:null};
 }
 if(button&&section?.contains(button)&&(button.matches('.new-btn,.qpu-new-btn,.eq-new-btn,[data-action="new"],[data-action="edit"]')||/^(수정|상세|성적서|신규등록|신규 등록|새 문서|\+.*등록)$/.test(text)))return {kind:'button',id:button.id||'',text,tag:button.tagName};
 if(button&&viewRoot()?.contains(button)&&button.matches('[data-nwd-tab],[data-am-add]'))return {kind:'inside',attr:button.hasAttribute('data-nwd-tab')?'data-nwd-tab':'data-am-add',value:button.getAttribute(button.hasAttribute('data-nwd-tab')?'data-nwd-tab':'data-am-add'),text};
 return null;
}
document.addEventListener('click',event=>{
 if(restoring||bootPending)return;
 const menu=event.target.closest?.('.sidebar .menu[data-page]');
 if(menu){trail=[];baseFields=[];basePage=1;schedule();return;}
 const step=action(event.target);
 if(step){
  if(!viewRoot()){trail=[step];const section=document.getElementById(page());baseFields=captureFields(section);basePage=pagerNumber(section);}
  else trail=[...trail,step].slice(0,12);
 }
 schedule();
},true);
document.addEventListener('input',schedule,true);document.addEventListener('change',schedule,true);
document.addEventListener('scroll',schedule,true);
window.addEventListener('pagehide',remember);window.addEventListener('beforeunload',remember);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
function findStep(step){
 if(!step||denied.test(step.control?.text||step.text||''))return null;
 const section=document.getElementById(page()),root=viewRoot();
 if(step.kind==='item')return [...(root?.querySelectorAll('.am-list-item')||[])].find(node=>step.record?node.dataset.amRecordId===step.record:node.dataset.amIndex===step.index);
 if(step.kind==='inside')return [...(root?.querySelectorAll('button')||[])].find(node=>node.getAttribute(step.attr)===step.value);
 if(step.kind==='button')return [...(section?.querySelectorAll('button,a')||[])].find(node=>(step.id?node.id===step.id:clean(node.textContent)===step.text)&&!denied.test(clean(node.textContent)));
 if(step.kind==='row'){
  const row=[...(section?.querySelectorAll('tr.data-row,tr[data-work-saved],tr[data-source-id],tr[data-standard-id]')||[])].find(node=>Object.keys(step.data||{}).length?Object.entries(step.data).every(([key,value])=>node.dataset[key]===value):clean(node.textContent)===step.text);
  if(!row)return null;
  return step.control?[...row.querySelectorAll('button,a')].find(node=>node.tagName===step.control.tag&&clean(node.textContent)===step.control.text):row;
 }
 return null;
}
function until(read,timeout=20000){
 return new Promise(resolve=>{
  const now=read();if(now){resolve(now);return;}
  let finished=false;
  const observer=new MutationObserver(()=>{const result=read();if(result)done(result);});
  const timer=setTimeout(()=>done(null),timeout);
  function done(result){if(finished)return;finished=true;clearTimeout(timer);observer.disconnect();resolve(result);}
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 });
}
function choosePage(root,number){
 if(number<2)return true;
 const pagers=[...(root?.querySelectorAll(pagerSelector+',.am-list-pagination')||[])];
 const button=pagers.flatMap(node=>[...node.querySelectorAll('button')]).find(node=>!node.disabled&&clean(node.textContent)===String(number));
 if(!button)return false;
 const pager=button.parentElement;
 if(!button.classList.contains('active')&&button.getAttribute('aria-current')!=='page')button.click();
 return true;
}
async function restore(){
 if(!saved||saved.version!==1||!saved.page){bootPending=false;return;}
 await window.qmesAuthDataReady?.wait();
 if(saved.user&&saved.user!==user()){bootPending=false;try{sessionStorage.removeItem(KEY);}catch(_){}return;}
 restoring=true;
 try{
  const menu=document.querySelector('.sidebar .menu[data-page="'+String(saved.page).replace(/[^a-zA-Z0-9_-]/g,'')+'"]');
  if(!menu)return;
  menu.click();
  const section=document.getElementById(saved.page);
  await until(()=>section?.classList.contains('active'),5000);
  restoreFields(section,saved.baseFields||[]);
  if(saved.basePage>1)await until(()=>choosePage(section,saved.basePage));
  for(const step of saved.trail||[]){
   const target=await until(()=>findStep(step));
   if(!target)throw Error('마지막 문서를 찾을 수 없습니다.');
   target.click();
  }
  trail=saved.trail||[];baseFields=saved.baseFields||[];basePage=saved.basePage||1;
  if(trail.length){
   const root=await until(viewRoot);
   if(!root)throw Error('마지막 화면을 열지 못했습니다.');
   const tbody=root.querySelector('#workMaterialTable tbody'),add=root.querySelector('#workRowAdd');
   if(tbody&&saved.materialRows){
    const wanted=Math.max(1,Math.min(200,Number(saved.materialRows)||1));
    for(let n=0;n<200&&tbody.rows.length<wanted&&add;n++){const before=tbody.rows.length;add.click();if(tbody.rows.length===before)break;}
    for(let n=0;n<200&&tbody.rows.length>wanted;n++){const remove=tbody.lastElementChild.querySelector('.row-del');if(!remove)break;remove.click();}
   }
   restoreFields(root,saved.fields);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   restoreFields(root,saved.fields);
   choosePage(root.querySelector('.am-list-pane')||root,saved.sidebarPage);
  }
  window.scrollTo(0,saved.scroll||0);const content=document.querySelector('main.content');if(content)content.scrollTop=saved.contentScroll||0;
 }catch(error){console.warn('[QMES last view]',error);if(typeof toast==='function')toast('마지막 화면을 복원하지 못했습니다. 목록에서 문서를 다시 선택해 주세요.');}
 finally{restoring=false;bootPending=false;schedule();}
}
window.qmesLastView={remember};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore();
})();
