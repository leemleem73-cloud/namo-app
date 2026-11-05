(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.qmesOqcShipQty=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){'use strict';
function normalize(value){const input=String(value??'').trim();if(!input)return '';let s=input;if(s.includes(',')){if(!/^\d{1,3}(,\d{3})+(\.\d{0,6})?$/.test(s))throw Error('출하수량을 kg 단위 숫자로 입력해 주세요.');s=s.replace(/,/g,'');}if(!/^(?:\d+(?:\.\d{0,6})?|\.\d{1,6})$/.test(s))throw Error('출하수량은 0 이상의 숫자, 소수점 6자리까지 입력할 수 있습니다.');const n=Number(s);if(!Number.isFinite(n)||n>Number.MAX_SAFE_INTEGER/1e6)throw Error('출하수량을 확인해 주세요.');return String(n);}
function validateCompletion(qty,before=[]){if(qty!==''&&Number(qty)>0)return;if(qty===''&&before.length&&before.every(row=>row.shippingStatus==='출하완료'&&String(row.shipQty??'').trim()===''))return;throw Error('출하완료로 저장하려면 실제 출하수량(kg)을 입력해 주세요.');}
function capture(before,after,qty,now,id){
 const existing=before.map(row=>row.stockShipment).filter(m=>m&&m.id),ids=[...new Set(existing.map(m=>m.id))];if(ids.length>1)throw Error('서로 다른 출하 기록이 연결되어 있습니다. 출하수량을 개별 확인해 주세요.');
 const past=existing[0],wasShipped=before.some(row=>row.shippingStatus==='출하완료'),isShipped=after.some(row=>row.shippingStatus==='출하완료');
 if(!past&&!wasShipped&&!isShipped)return after;
 const amount=qty===''?past?.quantity:Number(qty);if(amount!=null&&!(amount>0))throw Error('이미 출하된 수량은 실제 출하수량으로 입력해 주세요.');
 const source=wasShipped?before[0]:after[0],meta=past&&(past.quantity??null)===(amount??null)?past:{...(past||{}),id:past?.id||id,quantity:amount??null,completed:true,lot:past?.lot||source.lot,product:past?.product||source.product,inspectionDate:past?.inspectionDate||source.date||'',shipDate:past?.shipDate||source.shipDate||'',recordedAt:past?.recordedAt||now,updatedAt:now};
 return after.map(row=>({...row,shipQty:amount==null?'':String(amount),stockShipment:meta}));
}
return {normalize,validateCompletion,capture};
});