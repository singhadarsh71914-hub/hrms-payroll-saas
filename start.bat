@echo off
echo Starting HRMS & Payroll System...

:: Tab 1: Backend
start "Backend Server" cmd /k "npx tsx src/index.ts"

:: Tab 2: Frontend
start "Frontend Dev Server" cmd /k "cd client && npm run dev"

:: Tab 3: Antigravity CLI
start "Antigravity CLI" cmd /k "agy"

echo.
echo All processes have been started in separate windows.
pause
