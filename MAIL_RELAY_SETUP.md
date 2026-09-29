# QMES 회사 PC 메일 릴레이

Render Free 서버에서는 SMTP 25/465/587 발신이 제한되므로, QMES 서버는 메일을 DB 대기열에 저장하고 회사 메인 PC가 이카운트 SMTP로 발송합니다.

## 설치

1. 회사 메인 PC에 이 저장소를 준비합니다.
2. `npm install`을 실행합니다.
3. `mail-relay-agent.env.example`을 복사하여 `.env.mail-relay` 파일을 만듭니다.
4. `.env.mail-relay`에 아래 값을 입력합니다.
   - `QMES_BASE_URL`: QMES 주소
   - `MAIL_RELAY_TOKEN`: Render의 `MAIL_RELAY_TOKEN`과 동일한 값
   - `SMTP_USER`: 실제 이카운트 회사메일 주소
   - `SMTP_PASS`: 해당 이카운트 웹메일 비밀번호
5. `mail-relay-agent-start.cmd`를 실행합니다.

## 동작

- QMES 사용자가 '선택한 직원에게 메일 발송'을 누르면 서버가 메일을 대기열에 저장합니다.
- 회사 PC는 기본 15초마다 새 작업을 확인합니다.
- 회사 PC에서 `wsmtp.ecount.com:587`로 메일을 발송합니다.
- 성공/실패 결과를 QMES DB에 기록합니다.
- 실패 시 1분 후 자동 재시도하며 최대 5회 시도합니다.
- PC가 꺼져 있으면 메일은 대기 상태로 남고, PC가 다시 켜지면 순차 발송됩니다.

## Windows 자동 실행

운영 시에는 Windows 작업 스케줄러에 `mail-relay-agent-start.cmd`를 '로그온할 때' 실행하도록 등록하면 됩니다.
