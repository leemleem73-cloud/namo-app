export function buildIqcReportText() {
  return [
    '수입검사 성적서',
    '',
    '1. 외관 : 이물질, 파손 없을 것',
    '2. CoA : 누락 없을 것',
    '3. 최종판정 : 합격 / 불합격'
  ].join('\n');
}

export function buildPqcReportText() {
  return [
    '공정검사 성적서',
    '',
    '1. 외관 : 이상 없을 것',
    '2. 기준 : 첨부파일 기준치와 동일',
    '3. 최종판정 : 합격 / 불합격'
  ].join('\n');
}

export function buildOqcReportText() {
  return [
    '출하검사 성적서',
    '',
    '1. 외관 : 이상 없을 것',
    '2. 포장 상태 : 파손 없을 것',
    '3. 기준 : 첨부파일 기준치와 동일',
    '4. 최종판정 : 합격 / 불합격'
  ].join('\n');
}
