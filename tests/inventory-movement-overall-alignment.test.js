const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'public/css/inventory-movement-table-alignment-20260820-v2.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

const checks = [
  ['화면 폭 제한', css.includes('max-width: 100% !important')],
  ['가로 넘침 차단', css.includes('overflow-x: hidden !important')],
  ['제목 영역 폭 통일', css.includes('#qmes-inventory-host .inv-title-row')],
  ['패널 영역 폭 통일', css.includes('#qmes-inventory-host .inv-panel')],
  ['버튼 우측 정렬', css.includes('margin-left: auto !important')],
  ['패널 좌우 여백 통일', css.includes('padding: 12px 16px 14px !important')],
  ['표 가로 스크롤 안전장치', css.includes('overflow-x: auto !important')],
  ['표 최소 폭', css.includes('min-width: 1180px !important')],
  ['표 고정 레이아웃', css.includes('table-layout: fixed !important')],
  ['7개 열 너비', (css.match(/col:nth-child\(/g) || []).length === 7],
  ['열 너비 합계 100%', ['15%','7%','10%','15%','10%','20%','23%'].every(v => css.includes('width: '+v+' !important'))],
  ['헤더 높이 통일', css.includes('height: 42px !important')],
  ['본문 높이 통일', css.includes('height: 44px !important')],
  ['셀 좌우 패딩 통일', css.includes('padding: 0 14px !important')],
  ['행간 통일', css.includes('line-height: 1.4 !important')],
  ['세로 중앙 정렬', css.includes('vertical-align: middle !important')],
  ['일시·구분 중앙 정렬', css.includes('td:nth-child(1)') && css.includes('td:nth-child(2)') && css.includes('text-align: center !important')],
  ['수량 우측 정렬', css.includes('td:nth-child(5)') && css.includes('text-align: right !important')],
  ['문자 열 좌측 정렬', css.includes('td:nth-child(7)') && css.includes('text-align: left !important')],
  ['긴 값 말줄임', css.includes('text-overflow: ellipsis !important')],
  ['v2 CSS 로드', index.includes('inventory-movement-table-alignment-20260820-v2.css?v=20260820-9')],
  ['v1 CSS 로더 제거', !index.includes('inventory-movement-table-alignment-20260820-v1.css?v=20260820-8')]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) {
  console.error(`\n${failed.length} checks failed`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed`);
