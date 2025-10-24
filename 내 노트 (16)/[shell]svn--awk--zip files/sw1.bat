echo off

cd E:\workspace\upay_work\lgu_upay_servicegw\trunk
e:
if /i "%1" == "-h" goto HELP
if /i "%1" == "" goto HELP

svn diff -r %1:HEAD --summarize
rem > ./lgu_upay_servicegw_modify_%date%_%1%.info.txt
rem type zip -r -i@lgu_upay_servicegw_modify_%date%_%1%.info.txt lgu_upay_servicegw_modify_%1.zip 
rem E:\workspace\upay_work\lgu_upay_servicegw\trunk\lgu_upay_servicegw_modify_%date%_%time%_%1%.zip
goto QUIT

:HELP
echo - 사용법 -------------------------------------------
echo swcp.bat 리비젼
echo ----------------------------------------------------
goto QUIT

:QUIT