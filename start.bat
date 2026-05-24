@echo off
echo Starting HRMS & Payroll System...

:: Tab 1: Backend
start "Backend Server" cmd /k "npx tsx src/index.ts"

:: Tab 2: Frontend
start "Frontend Dev Server" cmd /k "cd client && npm run dev"

:: Tab 3: Gemini CLI
start "Gemini CLI" cmd /k "gemini"

echo.
echo All processes have been started in separate windows.
pause
