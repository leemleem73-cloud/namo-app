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
 // Existing orders show their number in the ordinary work order field.
 const id=f.querySelector('#workOrderNo')?.value?.trim()||'';
 const corrected=f.querySelector('[name="correctedWorkNumber"]')?.value?.trim()||'';
 return (id===TARGET||corrected===TARGET)?f:null;
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
 w.document.write('<!doctype html><html lang="ko"><meta charset="utf-8"><title>원료 LOT 바코드</title><body style="font-family:sans-serif;padding:22px"><h2>나모케미칼 원료 LOT 라벨 (시범)</h2><p>'+esc(name)+' / '+esc(lot)+'</p>'+svg+'<p>'+esc(value)+'</p></body></html>');
 w.document.close();
 w.onload=()=>w.print();
 };
}
function lotValue(row){
 const control=row.querySelector('.material-lot-manual');
 if(control?.value?.trim())return control.value.trim();
 // Some versions replace the LOT input with an IQC-linked select.
 const td=row.querySelector('td:nth-child(3)');
 const alternate=td?.querySelector('select,input');
 return alternate?.value?.trim()||'';
}
function refreshBarcode(row){
 const preview=row.querySelector('[data-pilot-inline]');
 if(!preview)return;
 const name=material(row),lot=lotValue(row);
 const key=String(name||'')+'|'+String(lot||'');
 if(preview.dataset.key===key)return;
 preview.dataset.key=key;
 preview.replaceChildren();
 if(!name||!lot){preview.hidden=true;return;}
 // A scan resolves the raw material LOT; the visible caption identifies the material.
 const encoded=lot.toUpperCase();
 const svg=encode(encoded);
 if(!svg){preview.hidden=true;preview.title='해당 LOT에는 Code39로 표현할 수 없는 문자가 있습니다.';return;}
 preview.hidden=false;preview.title=name+' / '+lot;
 const holder=document.createElement('div');
 holder.innerHTML=svg;const picture=holder.firstElementChild;
 picture.setAttribute('viewBox','0 0 720 90');
 picture.style.cssText='display:block;width:100%;height:48px;max-width:240px;background:#fff';
 preview.append(picture);
 const label=document.createElement('div');label.textContent=name+' / '+lot;
 label.style.cssText='font-size:10px;color:#334155;font-weight:600;text-align:center;white-space:normal;overflow-wrap:anywhere';
 preview.append(label);
}
function install(){
 const form=targetForm();if(!form)return;
 const table=form.querySelector('#workMaterialTable');if(!table)return;
 table.querySelectorAll('tbody tr').forEach(row=>{
   const cell=row.querySelector('.material-lot-manual')?.closest('td')||row.querySelector('td:nth-child(3)');
   if(!cell)return;
   if(!row.querySelector('[data-pilot-inline]')){
     const block=document.createElement('div');
     block.dataset.pilotInline='1';
     block.style.cssText='width:100%;max-width:245px;margin:5px auto 0;padding:3px 5px;background:#fff;border:1px solid #d7e2ef;border-radius:4px';
     cell.append(block);
     row.addEventListener('input',()=>refreshBarcode(row));
     row.addEventListener('change',()=>refreshBarcode(row));
   }
   refreshBarcode(row);
 });
}
let busy=false;
const observer=new MutationObserver(()=>{if(busy)return;busy=true;try{install();}finally{busy=false;}});
function init(){observer.observe(document.body,{childList:true,subtree:true});install();document.addEventListener('click',()=>queueMicrotask(install),true);setInterval(install,1500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();