const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const bridge=fs.readFileSync(path.join(__dirname,'../public/js/inventory-menu-bridge-20260820-v2.js'),'utf8');
const top=fs.readFileSync(path.join(__dirname,'../public/js/qmes-top-submenu-restore-20260820-v2.js'),'utf8');
const master=fs.readFileSync(path.join(__dirname,'../public/js/qmes-mes-master-loader-20260820-v2.js'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');

assert.match(bridge,/\['count','재고실사'\]/);
assert.doesNotMatch(bridge,/\['history','재고이력'\]/);
assert.match(top,/\{label:'재고실사',inventorySection:'count'\}/);
assert.doesNotMatch(top,/\{label:'재고이력',inventorySection:'history'\}/);
assert.match(master,/qmes-top-submenu-restore-20260820-v2\.js\?v=20260820-5/);
assert.match(master,/inventory-menu-bridge-20260820-v2\.js\?v=20260820-5/);
assert.doesNotMatch(master,/qmes-top-submenu-restore\.js\?v=/);
assert.doesNotMatch(master,/inventory-menu-bridge\.js\?v=/);
assert.match(index,/qmes-mes-master-loader-20260820-v2\.js\?v=20260820-5/);
assert.match(index,/inventory-menu-bridge-20260820-v2\.js\?v=20260820-5/);
assert.doesNotMatch(index,/qmes-mes-master-loader-20260807\.js\?v=/);
assert.doesNotMatch(index,/inventory-menu-bridge\.js\?v=/);

console.log('PASS: inventory history removed from top dropdown and left sidebar (12 checks)');
