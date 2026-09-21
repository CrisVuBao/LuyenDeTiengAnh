@echo off
title Dong Goi VBace English Cho Somee & Azure
echo =======================================================
echo   DONG GOI VBACE ENGLISH (FRONTEND + BACKEND)
echo =======================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-pack.ps1"
echo.
pause
