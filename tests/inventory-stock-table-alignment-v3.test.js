const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const ui=fs.readFileSync(path.join(__dirname,'../public/js/inventory-enterprise-auto-mode-20260820-v3.jsx'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/css/inventory-stock-table-alignment-20260820-v3.css'),'utf8');

assert.match(ui,/table className="inv-stock-table"/);
assert.equal((ui.match(/<col\/>/g)||[]).length,9);
assert.match(css,/table\.inv-stock-table/);
for(let column=1;column<=9;column+=1) assert.match(css,new RegExp(`col:nth-child\\(${column}\\)`));
assert.match(css,/th:nth-child\(6\)[\s\S]*text-align:right!important/);
assert.match(css,/th:nth-child\(5\)[\s\S]*text-align:center!important/);

console.log('PASS: inventory stock table alignment v3 (14 checks)');
