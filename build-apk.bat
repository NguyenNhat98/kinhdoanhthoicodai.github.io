@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Dong goi game thanh APK - Dynasty Tycoon
:menu
cls
echo ==============================================
echo     DONG GOI GAME THANH FILE APK  (Dynasty Tycoon)
echo ==============================================
echo.
echo   [1] Build APK debug          (cai thu nhanh)
echo   [2] Build APK debug + CAI VAO DIEN THOAI (cam USB)
echo   [3] Build APK release da ky  (phat hanh)
echo   [4] Build APK release + CAI VAO DIEN THOAI
echo   [5] Mo thu muc chua file APK
echo   [6] Don dep thu muc build (lam lai tu dau)
echo   [7] Build AAB release (dua len Google Play)
  [0] Thoat
echo.
set /p c=Chon so roi Enter: 
if "%c%"=="1" set "ARGS=" & goto run
if "%c%"=="2" set "ARGS=-Install" & goto run
if "%c%"=="3" set "ARGS=-Release" & goto run
if "%c%"=="4" set "ARGS=-Release -Install" & goto run
if "%c%"=="5" goto open
if "%c%"=="6" goto clean
if "%c%"=="7" set "ARGS=-Aab" & goto run
if "%c%"=="0" goto end
goto menu

:run
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-apk.ps1" %ARGS%
echo.
if errorlevel 1 (echo *** BUILD LOI - xem thong bao do o tren ***) else (echo *** XONG ***)
pause
goto menu

:open
if not exist "%~dp0apk\out" mkdir "%~dp0apk\out"
start "" explorer "%~dp0apk\out"
goto menu

:clean
echo Dang xoa C:\ChoCoApkBuild ...
rmdir /s /q "C:\ChoCoApkBuild" 2>nul
echo Da don dep.
pause
goto menu

:end
endlocal
