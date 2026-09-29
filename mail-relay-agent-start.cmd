@echo off
chcp 65001 > nul
cd /d %~dp0
title QMES 메일 릴레이
echo.
echo ==========================================
echo   QMES 회사 PC 메일 릴레이
echo ==========================================
echo.
if not exist ".env.mail-relay" (
  echo [.env.mail-relay] 파일이 없습니다.
  echo mail-relay-agent.env.example 파일을 복사하여
  echo .env.mail-relay 이름으로 만든 뒤 회사메일 정보를 입력하세요.
  pause
  exit /b 1
)
node mail-relay-agent.js
echo.
echo 메일 릴레이가 종료되었습니다.
pause
