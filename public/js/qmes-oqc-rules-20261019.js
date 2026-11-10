/* OQC rules shared by the browser and server. Units match the displayed OQC specification. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.qmesOqcRules=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const items=Object.freeze(['외관','입도(Dmax)','점도','수분율','고형분','접착력','절연저항','전해액 안정성']);
function canonical(name){const raw=String(name||'').trim(),key=raw.replace(/\s/g,'').toLowerCase();return ({'수분':'수분율','수분율':'수분율','입도':'입도(Dmax)','입도(dmax)':'입도(Dmax)','전해액안정성':'전해액 안정성'})[key]||raw;}
function number(value){
let text=String(value??'').trim();
if(text.includes(',')){if(!/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text))return null;text=text.replace(/,/g,'');}
if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))return null;
const n=Number(text);return Number.isFinite(n)?n:null;
}
function valid(item,value){
const text=String(value??'').trim(),n=number(text);
switch(canonical(item)){
case '외관':return text.replace(/\s/g,'')==='이상없음';
case '입도(Dmax)':return n!==null&&n>=0&&n<10;
case '점도':return n!==null&&n>=1200&&n<=1800;
case '수분율':return n!==null&&n>=0&&n<2000;
case '고형분':return n!==null&&n>=19&&n<=21;
case '접착력':return n!==null&&n>=400;
case '절연저항':return /^overflow$/i.test(text)||(n!==null&&n>=200);
case '전해액 안정성':{const n=Number(text.replace(/%/g,'').trim());return Number.isFinite(n)&&n<150;}
default:return false;
}}
function evaluateItem(item,measurements){
if(!items.includes(canonical(item)))return '대기';
const values=Array.from({length:3},(_,i)=>String(measurements?.[i]??'').trim());
return values.some(v=>v!==''&&!valid(item,v))?'불합격':values.every(v=>v!==''&&valid(item,v))?'합격':'대기';
}
function evaluateMeasurements(measurements){
const results={};for(const item of items)results[item]=evaluateItem(item,measurements?.[item]??(item==='수분율'?measurements?.['수분']:undefined));
const all=Object.values(results);return {items:results,overall:all.includes('불합격')?'불합격':all.every(v=>v==='합격')?'합격':'대기'};
}
function rowValues(row){if(Array.isArray(row?.measurements)&&row.measurements.length)return row.measurements;return String(row?.value??'').split(/\s*\/\s*/);}
function summarizeRows(rows){
const pending=[],failed=[];
for(const item of items){const matches=rows.filter(row=>canonical(row.check)===item);
if(!matches.length){pending.push(item+' 항목 없음');continue;}
for(const row of matches){
 const values=rowValues(row);
 const standardRevision=Number.isFinite(Number(row?.standardRevision))?Number(row.standardRevision):0;
 let judge;
 if(item==='전해액 안정성'&&standardRevision===0){
   const legacy=Array.from({length:3},(_,i)=>String(values?.[i]??'').trim());
   judge=legacy.some(v=>v!==''&&v.replace(/\s/g,'')!=='미탈리')?'불합격':legacy.every(v=>v!==''&&v.replace(/\s/g,'')==='미탈리')?'합격':'대기';
 }else judge=evaluateItem(item,values);
 if(judge==='불합격')failed.push(item);
 else if(judge==='대기'){const missing=[0,1,2].filter(i=>String(values[i]??'').trim()==='').map(i=>(i+1)+'차');pending.push(item+' '+missing.join('·')+' 미입력');}
}
}
if(rows.some(row=>row.inspectionDecision==='불합격'||['불합격','NG','FAIL'].includes(String(row.judge||row.result||'').trim().toUpperCase())))failed.push('저장된 불합격 판정');
return {overall:failed.length?'불합격':pending.length?'대기':'합격',pending:[...new Set(pending)],failed:[...new Set(failed)]};
}
return Object.freeze({items,canonical,parseNumber:number,evaluateItem,evaluateMeasurements,rowValues,summarizeRows});
});
