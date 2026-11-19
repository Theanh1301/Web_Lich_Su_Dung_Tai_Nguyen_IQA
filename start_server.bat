@echo off
chcp 65001 > nul
title May Chu Quan Ly Tai Nguyen (WebLich) - Vien Quan Ly Chat Luong va Khao Thi
cd /d "%~dp0"

echo ======================================================================
echo   HE THONG DAT LICH TAI NGUYEN (WEBLICH)
echo   Vien Quan Ly Chat Luong va Khao Thi
echo ======================================================================
echo.
echo   [+] Dang kiem tra va khoi dong may chu noi bo...
echo   [+] Che do: Tu dong ghi tuc thi vao file sheet_data.js khi co thay doi
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [!] May chu da dung lai hoac gap su co.
    pause
)
