# Namo Chemical QMES

나모케미칼 품질·생산관리 시스템입니다.

## Structure

- `public/index.html`: 현재 실행 페이지
- `public/index-original-backup.html`: 분리 전 원본 백업
- `public/css/`: 화면 및 인쇄 스타일
- `public/js/`: 기능별 React/JSX 모듈
- `public/components/`: 공용 컴포넌트 확장 위치
- `public/assets/`: 이미지·정적 자산
- `server.js`: Express 서버
- `.env.example`: 환경변수 이름 예시

## Run

1. `npm install`
2. `.env.example`을 참고해 로컬 `.env` 작성
3. `npm start`

## Refactor safety

분리된 CSS·JS 파일은 작업 브랜치에서 준비하며, 로그인·라우팅·화면 검증이 끝난 뒤 `public/index.html`에 연결합니다. 기존 `main` 실행 파일은 통합 검증 전까지 유지합니다.
