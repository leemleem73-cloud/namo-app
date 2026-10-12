/* NAMO QMES top work tabs: additive navigation, existing menu remains authoritative. */
(function(){
'use strict';
if(window.__namoWorkTabs)return;
window.__namoWorkTabs=true;
const MAX=9;
let tabs=[],active='';
const safePage=p=>/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(p||'');
function menuFor(page){return Array.from(document.querySelectorAll('.sidebar .menu[data-page]')).find(el=>el.dataset.page===page);}
function titleFor(el){return (el?.querySelector('.label')?.textContent||el?.textContent||'').trim();}
function init(){
const bar=document.querySelector('.topbar'),actions=bar?.querySelector('.top-actions');
if(!bar||!actions||document.getElementById('namo-work-tabs'))return;
const style=document.createElement('style');
style.textContent=`#namo-work-tabs{display:flex;flex:1 1 auto;min-width:0;align-items:center;margin:0 14px 0 25px;overflow-x:auto;overflow-y:hidden;gap:5px;scrollbar-width:thin;height:49px}#namo-work-tabs .namo-tab{display:inline-flex;align-items:center;gap:8px;flex:0 0 auto;max-width:200px;height:34px;padding:0 9px 0 12px;background:#f8fafc;border:1px solid #dbe3ed;border-radius:5px;color:#64748b;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}#namo-work-tabs .namo-tab.active{border-color:#76b7ff;background:#eaf4ff;color:#0969be}#namo-work-tabs .namo-tab-label{max-width:135px;overflow:hidden;text-overflow:ellipsis}#namo-work-tabs .namo-tab-close{border:0;background:transparent;color:inherit;cursor:pointer;font-size:17px;line-height:1;padding:1px 3px}#namo-work-tabs .namo-tab-close:hover{background:#d7e8f8;border-radius:3px}#namo-work-tabs .namo-tab:focus-visible{outline:2px solid #267bdd;outline-offset:2px}@media(max-width:850px){#namo-work-tabs{margin:0 7px;max-width:48vw}#namo-work-tabs .namo-tab{max-width:130px}}`;
document.head.appendChild(style);
const root=document.createElement('nav');root.id='namo-work-tabs';root.setAttribute('aria-label','열려 있는 QMES 업무 화면');
bar.insertBefore(root,actions);
function render(){
root.replaceChildren();
tabs.forEach(tab=>{
const item=document.createElement('div');item.className='namo-tab'+(tab.page===active?' active':'');item.title=tab.title;
const label=document.createElement('span');label.className='namo-tab-label';label.textContent=tab.title;
item.setAttribute('role','button');item.tabIndex=0;item.setAttribute('aria-label',tab.title+' 화면 열기');
item.addEventListener('click',()=>navigate(tab.page));
item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();navigate(tab.page)}});
const close=document.createElement('button');close.type='button';close.className='namo-tab-close';close.setAttribute('aria-label',tab.title+' 탭 닫기');close.textContent='×';
close.addEventListener('click',e=>{e.stopPropagation();const index=tabs.findIndex(t=>t.page===tab.page);if(index<0)return;const wasActive=active===tab.page;tabs.splice(index,1);if(wasActive){const next=tabs[Math.min(index,tabs.length-1)];if(next)navigate(next.page);else navigate('dashboard');}else render();});
item.append(label,close);root.append(item);
});
root.querySelector('.active')?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function activate(page){
if(!safePage(page))return;
const el=menuFor(page);if(!el)return;
const title=titleFor(el);
if(!title)return;
let tab=tabs.find(t=>t.page===page);
if(!tab){if(tabs.length>=MAX)tabs.shift();tabs.push({page,title});}
active=page;render();
}
function navigate(page){const el=menuFor(page);if(el){el.click();activate(page);}}
document.querySelector('.sidebar')?.addEventListener('click',e=>{
const menu=e.target.closest('.menu[data-page]');
if(!menu||!menuFor(menu.dataset.page))return;
queueMicrotask(()=>activate(menu.dataset.page));
});
document.getElementById('brandHomeBtn')?.addEventListener('click',()=>queueMicrotask(()=>activate('dashboard')));
const selected=document.querySelector('.sidebar .menu.active[data-page]')?.dataset.page||'dashboard';
activate(selected);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();