const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/js/inventory-physical-location-map-20260820.js'),'utf8'),context);
const map=context.globalThis.qmesInventoryPhysicalLocations;

assert.equal(map.all.length,18,'실제 랙 위치는 18개여야 한다');
assert.equal(new Set(map.all).size,18,'랙 위치코드는 중복되면 안 된다');
assert.deepEqual(Array.from(map.rawCandidates('NMP')),['A-5-1','A-5-2','A-6-2']);
assert.equal(map.chooseRawReceiptLocation('NMP',[]),'A-5-1');
assert.equal(map.chooseRawReceiptLocation('NMP',[{item_name:'NMP',location_code:'A-5-2',quantity:20}]),'A-5-2');
assert.equal(map.chooseRawReceiptLocation('NMP',[{item_name:'SBR',location_code:'A-5-1',quantity:20}]),'A-5-2');
assert.equal(map.chooseRawIssueLocation('SBR','LOT-1',10,[{item_name:'SBR',lot_no:'LOT-1',location_code:'A-2-2',quality_status:'AVAILABLE',available_qty:30}]),'A-2-2');
assert.equal(map.chooseRawIssueLocation('SBR','LOT-1',40,[{item_name:'SBR',lot_no:'LOT-1',location_code:'A-2-2',quality_status:'AVAILABLE',available_qty:30}]),'');
assert.equal(map.chooseRawIssueLocation('SBR','LOT-1',10,[{item_name:'SBR',lot_no:'LOT-1',location_code:'A-2-2',quality_status:'IQC_PENDING',available_qty:30}]),'');
assert.equal(map.chooseFinishedLocation('NBA20-HM05',[{item_name:'NBA20-HM05',location_code:'B-3-1',quantity:20}]),'B-3-1');
assert.equal(map.chooseFinishedLocation('NBA20-HM05',[]),'B-1-1');
assert.equal(map.chooseRawReceiptLocation('등록되지 않은 원료',[]),'');

console.log('PASS: inventory physical location map (12 checks)');
