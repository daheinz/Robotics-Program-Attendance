@echo off
REM Robotics Program Attendance - Start/Stop Script
REM Usage: run with argument "start" or "stop"

set FRONTEND_DIR=frontend
set BACKEND_DIR=backend
set FRONTEND_CMD=npm run dev
set BACKEND_CMD=npm start
set FRONTEND_PORT=5173
set BACKEND_PORT=3000

REM Check if npm is available
where npm >nul 2>nul
if errorlevel 1 (
    echo npm is not found in your PATH. Please install Node.js and npm, and ensure they are in your PATH.
    pause
    exit /b
)

REM Main logic
if "%1"=="start" (
    echo Starting backend first...
    call :start_backend
    echo Waiting 3 seconds before starting frontend...
    timeout /t 3 >nul
    call :start_frontend
    echo Both backend and frontend started.
    goto :eof
) else if "%1"=="stop" (
    call :stop_backend
    call :stop_frontend
    echo Both backend and frontend stopped.
    goto :eof
) else (
    echo Usage: %0 [start|stop]
    goto :eof
)

REM Function to start frontend
:start_frontend
    echo Starting frontend...
    start "" cmd /k "cd /d %~dp0%FRONTEND_DIR% && echo Frontend window started && %FRONTEND_CMD% & pause"
    goto :eof

REM Function to start backend
:start_backend
    echo Starting backend...
    start "" cmd /k "cd /d %~dp0%BACKEND_DIR% && echo Backend window started && %BACKEND_CMD% & pause"
    goto :eof

REM Function to stop frontend
:stop_frontend
    echo Stopping frontend...
    for /f "tokens=2 delims==; " %%i in ('tasklist /FI "WINDOWTITLE eq Frontend" /FO LIST ^| find "PID="') do taskkill /PID %%i /F
    goto :eof

REM Function to stop backend
:stop_backend
    echo Stopping backend...
    for /f "tokens=2 delims==; " %%i in ('tasklist /FI "WINDOWTITLE eq Backend" /FO LIST ^| find "PID="') do taskkill /PID %%i /F
    goto :eof