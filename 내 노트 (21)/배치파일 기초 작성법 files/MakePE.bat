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
echo         BOOT.WIM�� ����Ʈ �մϴ�.
echo        BOOT.WIM ������ ��ġ������
echo       �����ϴ� ��ο� �������ּ���.
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
echo          BOOT.WIM�� MOUNT ������
echo           ����Ʈ �ϰ� �ֽ��ϴ�.
echo           ��ø� ��ٷ� �ּ���.
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
echo          BOOT.WIM�� MOUNT ������
echo            ����Ʈ �Ǿ����ϴ�.
echo    �۾��� ������ �ƹ� Ű�� �����ּ���.
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
echo           MOUNT ������ ����Ʈ��
echo            ���� �ϰ� �ֽ��ϴ�.
echo           ��ø� ��ٷ� �ּ���.
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
echo         WIM ������ �����߽��ϴ�.
echo          �ϼ��� PE.WIM ������
echo           USB�� �������ּ���.
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
echo          ������ ������ �ƴմϴ�.
echo     ��ġ������ ���콺 ��Ŭ�� �Ͻ� ��,
echo       ������ �������� �������ּ���.
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
echo     BOOT.WIM ������ ã�� �� �����ϴ�.
echo        BOOT.WIM ������ ��ġ������
echo       �����ϴ� ��ο� �������ּ���.
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