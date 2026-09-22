@echo off
setlocal EnableExtensions DisableDelayedExpansion
title ID6 - TikZ to SVG local worker
cd /d "%~dp0"
echo ============================================================
echo       ID6 - QUET VA BIEN DICH SVG BANG MAY LOCAL
echo ============================================================
echo.
set "PYTHON_CMD="
where py >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py -3"
if not defined PYTHON_CMD where python >nul 2>nul
if not defined PYTHON_CMD if not errorlevel 1 set "PYTHON_CMD=python"
if not defined PYTHON_CMD (echo [LOI] Khong tim thay Python 3 trong PATH.&goto failed)
%PYTHON_CMD% --version >nul 2>nul
if errorlevel 1 (echo [LOI] Khong chay duoc Python 3.&goto failed)
if not exist "scripts\tikz_local_worker.py" (echo [LOI] Khong tim thay scripts\tikz_local_worker.py.&goto failed)
if not exist "template\ex_test.sty" (echo [LOI] Thieu template\ex_test.sty.&goto failed)
where pdflatex >nul 2>nul
if errorlevel 1 (echo [LOI] Khong tim thay pdflatex. Hay cai TeX Live va them vao PATH.&goto failed)
where dvisvgm >nul 2>nul
if errorlevel 1 where pdf2svg >nul 2>nul
if errorlevel 1 (echo [LOI] Can dvisvgm hoac pdf2svg trong PATH.&goto failed)
echo [OK] Python, TeX va cong cu SVG da san sang.
if /i "%~1"=="/check" goto check_ok

set "RENDER_URL=%~1"
if not defined RENDER_URL set /p "RENDER_URL=Nhap URL Render, vi du https://quanlythi.onrender.com: "
if not defined RENDER_URL (echo [LOI] Chua nhap URL Render.&goto failed)
if "%RENDER_URL:~-1%"=="/" set "RENDER_URL=%RENDER_URL:~0,-1%"
echo(%RENDER_URL%| findstr /r /i "^https:// ^http://localhost ^http://127\.0\.0\.1" >nul
if errorlevel 1 (echo [LOI] URL phai dung HTTPS. Chi localhost duoc dung HTTP.&goto failed)

:menu
echo.
echo Chon che do:
echo   [1] Cho nut Quet va bien dich tren website - KHUYEN DUNG
echo   [2] Chi quet thu, khong sua database
echo   [3] Bien dich thu toi da 10 cau
echo   [4] Bien dich toan bo ngay
echo   [0] Thoat
set "MODE="
set /p "MODE=Lua chon: "
if "%MODE%"=="1" goto daemon
if "%MODE%"=="2" goto dry_run
if "%MODE%"=="3" goto test_ten
if "%MODE%"=="4" goto apply_all
if "%MODE%"=="0" exit /b 0
echo Lua chon khong hop le.
goto menu

:daemon
echo Dang nhap tai khoan ADMIN khi duoc hoi.
echo Giu cua so nay mo, sau do bam Quet va bien dich tren website.
echo Nhan Ctrl+C de dung worker khi hoan tat.
%PYTHON_CMD% "scripts\tikz_local_worker.py" --url "%RENDER_URL%" --daemon
goto finished

:dry_run
echo Che do kiem ke: database se khong bi thay doi.
%PYTHON_CMD% "scripts\tikz_local_worker.py" --url "%RENDER_URL%"
goto finished

:test_ten
echo Che do nay co the cap nhat toi da 10 cau len database.
choice /c CQ /n /m "Nhan C de chay, Q de quay lai: "
if errorlevel 2 goto menu
%PYTHON_CMD% "scripts\tikz_local_worker.py" --url "%RENDER_URL%" --apply --max-questions 10
goto finished

:apply_all
echo CANH BAO: che do nay cap nhat toan bo hinh tim thay.
choice /c CQ /n /m "Nhan C de xac nhan, Q de quay lai: "
if errorlevel 2 goto menu
%PYTHON_CMD% "scripts\tikz_local_worker.py" --url "%RENDER_URL%" --apply
goto finished

:finished
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" echo [HOAN TAT] Chuong trinh ket thuc binh thuong.
if not "%EXIT_CODE%"=="0" echo [LOI] Worker dung voi ma loi %EXIT_CODE%. Xem output\tikz_worker_errors.json neu co.
pause
exit /b %EXIT_CODE%

:check_ok
echo [OK] File BAT da vuot qua kiem tra moi truong.
exit /b 0

:failed
echo Khong the khoi dong worker. Hay sua loi phia tren roi chay lai.
pause
exit /b 1
