(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.qmesItemCodes=factory();})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
// Company item codes identify a grade/product, never an individual LOT or work order.
// Unknown grades and concentrations remain unassigned until registered here.
const catalog=Object.freeze([
 {code:'RM-0001',kind:'raw',name:'NMP',aliases:['NMP']},
 {code:'RM-0002',kind:'raw',name:'BYK180',aliases:['BYK180','분산제','BYK180분산제']},
 {code:'RM-0003',kind:'raw',name:'AOH30',aliases:['AOH30','BOEHMITE','AOH30BOEHMITE']},
 {code:'RM-0004',kind:'raw',name:'SBR',aliases:['SBR','ADC30G','ADC30GSBR','SBRADC30G']},
 {code:'RM-0005',kind:'raw',name:'PVdF 원료 5140',aliases:['5140','SOLEF5140','SOLEF5140PVDF','PVDF5140']},
 {code:'RM-0006',kind:'raw',name:'SBS 원료 KTR-201',aliases:['KTR201','SBSKTR201','KTR201SBS']},
 {code:'SF-0001',kind:'semi',name:'PVdF 용액',aliases:['PVDF','PVDF용액','PVDF용액제조']},
 {code:'SF-0002',kind:'semi',name:'SBS 용액',aliases:['SBS','SBS용액','SBS용액제조']}
]);
const key=value=>String(value??'').normalize('NFKC').toUpperCase().replace(/[^A-Z0-9가-힣]/g,'');
function find(value){const wanted=key(value);return catalog.find(item=>item.aliases.includes(wanted))||null;}
function codeFor(row){if(typeof row==='string')return find(row)?.code||'-';const name=String(row?.name??row?.item??row?.product??'').trim();const item=find(name==='중간배치'?row?.batchType:name);if(name==='중간배치'&&item?.kind!=='semi')return '-';return item?.code||'-';}
return {catalog,find,codeFor};
});
