echo off

cd E:\workspace\upay_work\lgu_upay_servicegw\trunk
e:
if /i "%1" == "-h" goto HELP
if /i "%1" == "" goto HELP

zip -@ lgu_upay_servicegw_modify.zip 

rem E:\workspace\upay_work\lgu_upay_servicegw\trunk\lgu_upay_servicegw_modify_%date%_%time%_%1%.zip
zip -@ lgu_upay_servicegw_modify_%1.zip

:HELP
echo - 사용법 -------------------------------------------
echo swcp.bat 리비젼
echo ----------------------------------------------------
goto QUIT

:QUIT