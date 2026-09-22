@echo off
chcp 65001 > nul
title VBaceEnglish - Đóng Gói Deploy Web API
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-pack.ps1"
pause
