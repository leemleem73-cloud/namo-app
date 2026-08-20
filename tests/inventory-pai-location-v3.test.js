const assert=require('node:assert/strict');
const map=require('../public/js/inventory-physical-location-map-20260820-v3.js');

assert.equal(map.canonicalRawLocation('PAI'),'A-1-1');
assert.equal(map.canonicalRawLocation('PAI#27-2(2)'),'A-1-1');
assert.deepEqual(map.rawCandidates('PAI'),['A-1-1']);
assert.equal(map.chooseRawReceiptLocation('PAI',[]),'A-1-1');
assert.equal(map.canonicalRawLocation('등록되지 않은 원료'),'UNASSIGNED');

console.log('PASS: PAI physical location A-1-1 (5 checks)');
