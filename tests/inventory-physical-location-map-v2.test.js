const assert=require('node:assert/strict');
const map=require('../public/js/inventory-physical-location-map-20260820-v2.js');

assert.equal(map.all.length,18,'실제 랙 위치는 18개여야 한다');
assert.equal(new Set(map.all).size,18,'랙 위치코드는 중복되면 안 된다');
assert.deepEqual(map.rawCandidates('SBS'),['A-1-1','A-1-2']);
assert.equal(map.canonicalRawLocation('SBS'),'A-1-1');
assert.equal(map.canonicalRawLocation('BOEHMITE'),'A-4-1');
assert.equal(map.canonicalRawLocation('BYK-180'),'A-3-2');
assert.equal(map.canonicalRawLocation('PVdF'),'A-3-1');
assert.equal(map.canonicalRawLocation('NMP'),'A-5-1');
assert.equal(map.canonicalRawLocation('등록되지 않은 원료'),'UNASSIGNED');
assert.equal(map.chooseRawReceiptLocation('PAI',[]),'UNASSIGNED');
assert.equal(map.locationLabel('UNASSIGNED'),'위치확인');
assert.equal(map.chooseRawIssueLocation('SBR','LOT-1',10,[{item_name:'SBR',lot_no:'LOT-1',location_code:'A-2-2',quality_status:'AVAILABLE',available_qty:30}]),'A-2-2');
assert.equal(map.chooseRawIssueLocation('SBR','LOT-1',40,[{item_name:'SBR',lot_no:'LOT-1',location_code:'A-2-2',quality_status:'AVAILABLE',available_qty:30}]),'');
assert.equal(map.chooseRawIssueLocation('SBR','LOT-1',10,[{item_name:'SBR',lot_no:'LOT-1',location_code:'RM',quality_status:'AVAILABLE',available_qty:30}]),'');
assert.equal(map.chooseFinishedLocation('NBA20-HM05',[{item_name:'NBA20-HM05',location_code:'B-3-1',quantity:20}]),'B-3-1');
assert.equal(map.chooseFinishedLocation('NBA20-HM05',[]),'B-1-1');

console.log('PASS: inventory physical location map v2 (16 checks)');
