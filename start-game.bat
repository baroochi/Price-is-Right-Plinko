@echo off
title Kinematics and Probability Simulation - Local Server
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
    start http://localhost:8080/
    node server.js
    goto :end
)

set "NODE_EXE=C:\Program Files\Common Files\Adobe\Creative Cloud Libraries\libs\node.exe"
if exist "%NODE_EXE%" (
    start http://localhost:8080/
    "%NODE_EXE%" server.js
    goto :end
)

echo Node.js not found in PATH or Adobe directory!
pause
:end
pause
