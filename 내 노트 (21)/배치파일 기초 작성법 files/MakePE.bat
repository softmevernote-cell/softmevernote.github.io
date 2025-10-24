@echo off
pushd %~DP0
title MakePE
mode con cols=40 lines=16
color F0
echo.
echo.
echo.
echo.
echo.
echo.
echo               MakePE v1.0
echo             Made by Crux153
echo       http://diginuri.tistory.com/
echo.
echo.
echo.
echo.
echo.
echo.
ping 127.0.0.1 -n 2 > nul
bcdedit > nul
if %errorlevel% EQU 1 goto :_notadmin
type tools\beep.bin
cls
echo.
echo.
echo.
echo.
echo.
echo.
echo         BOOT.WIM을 마운트 합니다.
echo        BOOT.WIM 파일을 배치파일이
echo       존재하는 경로에 복사해주세요.
echo.
echo.
echo.
echo.
echo.
echo.
pause > nul
cls
if not exist BOOT.WIM goto _error 
if exist BOOT.WIM goto _mount
exit

:_mount
cls
color F0
echo.
echo.
echo.
echo.
echo.
echo.
echo          BOOT.WIM를 MOUNT 폴더에
echo           마운트 하고 있습니다.
echo           잠시만 기다려 주세요.
echo.
echo.
echo.
echo.
echo.
echo.
if exist Mount rmdir Mount /s /q
md Mount
Tools\imagex.exe /mountrw boot.wim 2 Mount > nul
type tools\beep.bin
cls
color 1F
echo.
echo.
echo.
echo.
echo.
echo.
echo          BOOT.WIM이 MOUNT 폴더에
echo            마운트 되었습니다.
echo    작업이 끝나면 아무 키나 눌러주세요.
echo.
echo.
echo.
echo.
echo.
echo.
pause > nul
goto _unmount
exit

:_unmount
cls
color F0
echo.
echo.
echo.
echo.
echo.
echo.
echo           MOUNT 폴더의 마운트를
echo            해제 하고 있습니다.
echo           잠시만 기다려 주세요.
echo.
echo.
echo.
echo.
echo.
echo.
Tools\imagex /unmount Mount /commit > nul
Tools\imagex /export boot.wim * PE.wim > nul
rmdir Mount
del boot.wim
cls
color F0
type tools\beep.bin
echo.
echo.
echo.
echo.
echo.
echo.
echo         WIM 파일을 수정했습니다.
echo          완성된 PE.WIM 파일을
echo           USB로 복사해주세요.
echo.
echo.
echo.
echo.
echo.
echo.
pause > nul
exit

:_notadmin
color 4F
type tools\beep.bin
cls
echo.
echo.
echo.
echo.
echo.
echo.
echo          관리자 권한이 아닙니다.
echo     배치파일을 마우스 우클릭 하신 뒤,
echo       관리자 권한으로 실행해주세요.
echo.
echo.
echo.
echo.
echo.
echo.
pause > nul
exit

:_error
color 4F
type tools\beep.bin
cls
echo.
echo.
echo.
echo.
echo.
echo.
echo     BOOT.WIM 파일을 찾을 수 없습니다.
echo        BOOT.WIM 파일을 배치파일이
echo       존재하는 경로에 복사해주세요.
echo.
echo.
echo.
echo.
echo.
echo.
pause > nul
cls
if exist BOOT.WIM goto _mount
if not exist BOOT.WIM goto _error
exit