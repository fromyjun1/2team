@echo off
echo Cloud SQL Auth Proxy 시작 중...
echo DB 연결: project-42919437-c0df-4eec-804:asia-northeast3:club-db
echo 포트: 5432
echo.
echo 이 창을 닫으면 DB 연결이 끊깁니다. 백엔드 실행 중에는 유지하세요.
echo.
cloud-sql-proxy.exe project-42919437-c0df-4eec-804:asia-northeast3:club-db --port=5432
pause
