const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'public/js/inventory-enterprise-auto-mode-20260820-v7.jsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public/css/inventory-movement-table-alignment-20260820-v1.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

const checks = [
  ['v7 화면 파일', ui.includes('auto mode v7')],
  ['입출고 표 전용 클래스', ui.includes('className="inv-movement-table"')],
  ['7열 colgroup', ui.includes('<colgroup><col/><col/><col/><col/><col/><col/><col/></colgroup>')],
  ['비고 헤더', ui.includes('<th>비고</th>')],
  ['기존 작업지시/처리내용 헤더 제거', !ui.includes('<th>작업지시/처리내용</th>')],
  ['작업자 헤더 제거', !ui.includes('<th>작업자</th>')],
  ['작업자 데이터 셀 제거', !ui.includes('{tx.operator_name}')],
  ['비고 전체값 툴팁', ui.includes('title={txDisplayReference(tx)}')],
  ['표 고정 레이아웃', css.includes('table-layout: fixed !important')],
  ['7개 열 너비 정의', (css.match(/col:nth-child\(/g)||[]).length===7],
  ['행 높이 고정', css.includes('height: 42px !important')],
  ['셀 패딩 통일', css.includes('padding: 10px 12px !important')],
  ['행간 통일', css.includes('line-height: 1.35 !important')],
  ['세로 중앙 정렬', css.includes('vertical-align: middle !important')],
  ['수량 우측 정렬', css.includes('td:nth-child(5)')&&css.includes('text-align: right !important')],
  ['비고 말줄임', css.includes('td:nth-child(7)')&&css.includes('text-overflow: ellipsis !important')],
  ['신규 CSS 로드', index.includes('inventory-movement-table-alignment-20260820-v1.css?v=20260820-8')],
  ['v7 화면 로드', index.includes('inventory-enterprise-auto-mode-20260820-v7.jsx?v=20260820-8')],
  ['v6 화면 로더 제거', !index.includes('inventory-enterprise-auto-mode-20260820-v6.jsx?v=20260820-7')]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) {
  console.error(`\n${failed.length} checks failed`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed`);
