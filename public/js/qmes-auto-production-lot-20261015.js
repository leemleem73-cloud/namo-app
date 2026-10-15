(function(){
'use strict';
if(window.__qmesAutoLot20261015)return;window.__qmesAutoLot20261015=true;
let lastForm=null;
const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function field(form,label){const items=[...form.querySelectorAll('.work-basic-grid .form-item')];return items.find(x=>x.querySelector('label')?.textContent.trim()===label)?.querySelector('input,select')}
function setup(){
 const form=document.querySelector('#mainWorkspace .work-form');if(!form||form===lastForm)return;
 const date=field(form,'작업일자'),lot=field(form,'생산 LOT NO'),type=field(form,'생산구분'),id=field(form,'작업지시번호');
 if(!date||!lot||!type||!id)return;
 lastForm=form;
 const isNew=id.value.trim()==='자동생성';
 if(!isNew)return;
 const container=lot.closest('.form-item');lot.readOnly=true;lot.placeholder='작업일자 선택 시 자동 생성';
 const help=document.createElement('small');help.className='qmes-auto-lot-note';help.textContent='규칙: 생산사이트 + 연도 + 월 + 일 + 당일 생산순번 (01~99)';
 container.append(help);
 const site=document.createElement('select');site.className='qmes-auto-lot-site';site.setAttribute('aria-label','생산사이트');
 [['D','D 양산'],['C','C Pilot'],['B','B Lab'],['A','A 외부사이트(OEM)']].forEach(([value,text])=>site.add(new Option(text,value)));
 const title=document.createElement('small');title.textContent='생산사이트';title.className='qmes-auto-lot-site-label';
 container.append(title,site);
 function applyType(){if(type.value==='양산')site.value='D';else if(type.value==='파일럿 생산')site.value='C';else if(type.value==='시험생산'||type.value==='샘플생산')site.value='B'}
 function generate(){
  const d=date.value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){lot.value='';return}
  const year=Number(d.slice(0,4)),month=Number(d.slice(5,7)),day=Number(d.slice(8,10));
  if(year<2025||year>2050||month<1||month>12||day<1||day>31){lot.value='';return}
  const prefix=site.value+alpha[year-2025]+alpha[month-1]+String(day).padStart(2,'0');
  const docs=typeof window.qmesGetWorkOrders==='function'?window.qmesGetWorkOrders():[];
  const used=new Set(docs.map(x=>String(x?.fields?.['생산 LOT NO']||'').trim().toUpperCase()));
  let seq=1;while(seq<=99&&used.has(prefix+String(seq).padStart(2,'0')))seq++;
  if(seq>99){lot.value='';help.textContent='당일 생산순번 99건 초과: 관리자를 확인해 주세요.';return}
  lot.value=prefix+String(seq).padStart(2,'0');
  lot.dispatchEvent(new Event('input',{bubbles:true}));
 }
 date.addEventListener('change',generate);site.addEventListener('change',generate);
 type.addEventListener('change',()=>{applyType();generate()});
 applyType();generate();
}
const style=document.createElement('style');style.textContent='.qmes-auto-lot-note{display:block;font-size:11px;color:#63758a;margin-top:5px}.qmes-auto-lot-site-label{display:block;color:#63758a;font-size:11px;margin-top:6px}.work-basic-grid .qmes-auto-lot-site{width:100%;max-width:240px;height:30px;font-size:12px;margin-top:3px}';document.head.append(style);
new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});setup();
})();