(function(){
'use strict';
/* Pilot only: 2026-10-21 WO-20261021-001. Does not write to QMES records. */
const TARGET='WO-20261021-001';
const MAP={
'0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn',
'4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw',
'8':'wnnwnnwnn','9':'nnwwnnwnn','A':'wnnnnwnnw','B':'nnwnnwnnw',
'C':'wnwnnwnnn','D':'nnnnwwnnw','E':'wnnnwwnnn','F':'nnwnwwnnn',
'G':'nnnnnwwnw','H':'wnnnnwwnn','I':'nnwnnwwnn','J':'nnnnwwwnn',
'K':'wnnnnnnww','L':'nnwnnnnww','M':'wnwnnnnwn','N':'nnnnwnnww',
'O':'wnnnwnnwn','P':'nnwnwnnwn','Q':'nnnnnnwww','R':'wnnnnnwwn',
'S':'nnwnnnwwn','T':'nnnnwnwwn','U':'wwnnnnnnw','V':'nwwnnnnnw',
'W':'wwwnnnnnn','X':'nwnnwnnnw','Y':'wwnnwnnnn','Z':'nwwnwnnnn',
'-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','$':'nwnwnwnnn',
'/':'nwnwnnnwn','+':'nwnnnwnwn','%':'nnnwnwnwn','*':'nwnnwnwnn'
};
function encode(text){
 if(!text||!Array.from(text).every(c=>MAP[c]&&c!=='*'))return null;
 const code='*'+text+'*';let x=12,svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 106" role="img" aria-label="원료 LOT 바코드">';
 const widths=[];
 for(const c of code){const p=MAP[c];for(let i=0;i<9;i++)widths.push([i%2===0,p[i]==='w'?5:2]);widths.push([false,2]);}
 const total=widths.reduce((s,a)=>s+a[1],0),scale=Math.min(2.8,690/total);
 for(const [bar,w] of widths){if(bar)svg+='<rect x="'+x.toFixed(1)+'" y="8" width="'+(w*scale).toFixed(1)+'" height="74" fill="#111"/>';x+=w*scale;}
 return svg+'</svg>';
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function targetForm(){
 const f=document.querySelector('.work-form');
 if(!f)return null;
 const id=f.querySelector('[name="correctedWorkNumber"]');
 return id&&id.value.trim()===TARGET?f:null;
}
function material(row){
 const n=row.querySelector('.material-name-select');
 return n?.value==='__manual__'?row.querySelector('.material-name-manual')?.value.trim():n?.value?.trim();
}
function show(row){
 const name=material(row),lot=row.querySelector('.material-lot-manual')?.value.trim();
 if(!name||!lot){alert('원료명과 실제 원료 LOT를 먼저 확인해 주세요.');return;}
 const value=name.toUpperCase()+'/'+lot.toUpperCase();
 const svg=encode(value);
 if(!svg){alert('현재 시범 바코드는 영문 대문자, 숫자, - . / 기호 등 Code39 지원 문자만 사용할 수 있습니다.');return;}
 const shell=document.createElement('div');shell.className='namo-material-barcode-pilot';
 shell.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#0008;display:grid;place-items:center';
 const panel=document.createElement('div');
 panel.style.cssText='width:min(650px,94vw);background:white;color:#172b41;border-radius:12px;padding:24px;box-shadow:0 20px 60px #0004;font:14px sans-serif';
 panel.innerHTML='<h2 style="margin:0 0 10px">원료 LOT 바코드 · 시범</h2><p>작업지시: '+TARGET+'</p><p><b>원료:</b> '+esc(name)+' &nbsp; <b>LOT:</b> '+esc(lot)+'</p>'+svg+'<p style="text-align:center;font:12px monospace">'+esc(value)+'</p><p style="color:#9a5410;font-size:12px">원료 LOT 식별용 시범 바코드입니다. 용기 고유 ID·IQC 합격 여부의 자동 검증은 아직 연결되지 않았습니다.</p><div style="text-align:right"><button type="button" data-print>라벨 인쇄</button> <button type="button" data-close>닫기</button></div>';
 shell.append(panel);document.body.append(shell);
 panel.querySelector('[data-close]').onclick=()=>shell.remove();
 shell.onclick=e=>{if(e.target===shell)shell.remove();};
 panel.querySelector('[data-print]').onclick=()=>{
 const w=window.open('','_blank','width=780,height=520');
 if(!w){alert('인쇄 팝업이 차단되었습니다.');return;}
 w.document.write('<!doctype html><html lang="ko"><meta charset="utf-8"><title>원료 LOT 바코드</title><body style="font-family:sans-serif;padding:22px"><h2>나모케미칼 원료 LOT 라벨 (시범)</h2><p>'+esc(name)+' / '+esc(lot)+'</p>'+svg+'<p>'+esc(value)+'</p><script>window.onload=function(){window.print()}<\\/script></body></html>');
 w.document.close();
 w.onload=()=>w.print();
 };
}
function install(){
 const form=targetForm();if(!form)return;
 const table=form.querySelector('#workMaterialTable');if(!table)return;
 const head=table.querySelector('thead tr');
 if(head&&!head.querySelector('[data-pilot-head]')){
   const th=document.createElement('th');th.textContent='원료 바코드';th.dataset.pilotHead='1';
   head.insertBefore(th,head.children[3]||null);
 }
 table.querySelectorAll('tbody tr').forEach(row=>{
   if(row.querySelector('[data-pilot-barcode]'))return;
   const cell=row.insertCell(3);const b=document.createElement('button');
   b.type='button';b.textContent='바코드';b.className='btn';b.dataset.pilotBarcode='1';
   b.style.cssText='padding:5px 8px;white-space:nowrap;font-size:12px';
   b.onclick=()=>show(row);cell.append(b);
 });
}
let busy=false;
const observer=new MutationObserver(()=>{if(busy)return;busy=true;try{install();}finally{busy=false;}});
function init(){observer.observe(document.body,{childList:true,subtree:true});install();document.addEventListener('click',()=>queueMicrotask(install),true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();