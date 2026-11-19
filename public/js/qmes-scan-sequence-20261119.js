(function(root,f){if(typeof module==='object'&&module.exports)module.exports=f();else root.qmesScanSequence=f();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';const norm=v=>String(v??'').trim().normalize('NFKC').toUpperCase().replace(/[^A-Z0-9가-힣]/g,'');
const material=v=>{const s=norm(v);if(/BYK180/.test(s)||s==='분산제')return 'BYK180';if(/AOH30|BOEHMITE/.test(s))return 'AOH30';if(/PVDF/.test(s))return 'PVDF';return s;};
const lot=v=>String(v??'').trim().toUpperCase().replace(/\s/g,'');
function compare(rows,done,scan){const index=rows.findIndex((_,i)=>!done.includes(i));if(index<0)return {ok:false,title:'확인 완료',message:'모든 원료를 확인했습니다.'};
const expected=rows[index],same=(a,b)=>material(a.name)===material(b.name)&&lot(a.lot)===lot(b.lot);
if(!scan?.name||!scan?.lot||scan.lot==='-')return {ok:false,title:'원료 확인 필요',message:'원료명과 LOT를 확인할 수 없습니다. LOT가 부여된 원료 라벨을 사용하세요.'};
if(done.some(i=>same(rows[i],scan)))return {ok:false,title:'중복 스캔',message:'이미 확인한 원료입니다. 현재 순서: '+expected.name};
if(!same(expected,scan)){const later=rows.findIndex((row,i)=>i>index&&same(row,scan));
 if(later>=0)return {ok:false,title:'투입 순서 오류',message:'현재 '+(index+1)+'번 '+expected.name+'을 먼저 스캔하세요. 스캔 원료: '+scan.name};
 if(material(expected.name)!==material(scan.name))return {ok:false,title:'원료 불일치',message:'예정 원료: '+expected.name+' / 스캔 원료: '+scan.name};
 return {ok:false,title:'LOT 불일치',message:'예정 LOT: '+expected.lot+' / 스캔 LOT: '+scan.lot};}
if(scan.kind!=='ok')return {ok:false,title:'투입 확인 차단',message:scan.reason||'검사·재고 상태가 투입 가능으로 확인되지 않았습니다.'};
return {ok:true,index,title:'원료·LOT 일치',message:expected.name+' / '+expected.lot+' — 투입 확인 가능합니다.'};}
return {compare,material,lot};});