const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'public/js/inventory-enterprise-auto-mode-20260820-v8.jsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public/css/inventory-movement-table-alignment-20260820-v3.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

const checks = [
  ['v8 화면 파일', ui.includes('auto mode v8')],
  ['LOT 표 패널 틀 적용', ui.includes('inv-panel inv-stock-panel inv-movement-panel')],
  ['LOT 표 클래스 적용', ui.includes('className="inv-stock-table inv-movement-table"')],
  ['원료명 헤더', ui.includes('<th>원료명</th>')],
  ['품목 헤더 제거', !ui.includes('<th>품목</th><th>LOT</th><th>수량</th><th>이동 방향</th><th>비고</th>')],
  ['원료명 우선 표시 함수', ui.includes("String(tx?.item_name||'').trim()")],
  ['코드 대체 표시', ui.includes("String(tx?.item_code||'').trim()||'-'")],
  ['원료명 셀 표시', ui.includes('title={txMaterialName(tx)}>{txMaterialName(tx)}')],
  ['7열 구조 유지', ui.includes('<colgroup><col/><col/><col/><col/><col/><col/><col/></colgroup>')],
  ['작업자 열 없음', !ui.includes('<th>작업자</th>') && !ui.includes('{tx.operator_name}')],
  ['LOT 표와 동일 패널 폭', css.includes('.inv-movement-panel') && css.includes('width: 100%')],
  ['LOT 표와 동일 스크롤 틀', css.includes('overflow-x: auto')],
  ['LOT 표와 동일 최소 폭', css.includes('min-width: 980px')],
  ['LOT 표 클래스 결합', css.includes('table.inv-stock-table.inv-movement-table')],
  ['고정 표 레이아웃', css.includes('table-layout: fixed !important')],
  ['7개 열 너비', css.split('col:nth-child(').length - 1 === 7],
  ['열 너비 합계 100%', ['15%','7%','12%','18%','11%','18%','19%'].every(v => css.includes('width: '+v))],
  ['기본 행 높이 사용', !css.includes('height: 42px') && !css.includes('height: 44px')],
  ['원료명 좌측 정렬', css.includes('td:nth-child(3)') && css.includes('text-align: left !important')],
  ['수량 우측 정렬', css.includes('td:nth-child(5)') && css.includes('text-align: right !important')],
  ['긴 값 말줄임', css.includes('text-overflow: ellipsis')],
  ['v3 CSS 로드', index.includes('inventory-movement-table-alignment-20260820-v3.css?v=20260820-10')],
  ['v8 화면 로드', index.includes('inventory-enterprise-auto-mode-20260820-v8.jsx?v=20260820-9')],
  ['이전 CSS 로더 제거', !index.includes('inventory-movement-table-alignment-20260820-v2.css?v=20260820-9')],
  ['이전 화면 로더 제거', !index.includes('inventory-enterprise-auto-mode-20260820-v7.jsx?v=20260820-8')]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) {
  console.error(`\n${failed.length} checks failed`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed`);
