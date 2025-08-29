@echo off
echo 🔍 Checking what's using port 8000...
netstat -ano | findstr :8000

echo.
echo 🛑 Killing process using port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)

echo.
echo ✅ Port 8000 should now be free!
pause