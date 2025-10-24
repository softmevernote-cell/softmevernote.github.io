rem @echo off
del "C:\WEB_APP_ADT\Work_ADT\mpgas_chg\release\*.apk"
c:
cd C:\WEB_APP_ADT\Work_ADT\mpgas_chg\release
call "apkrename.bat"

del "C:\WEB_APP_ADT\Work_ADT\mpgas_chk\release\*.apk"
c:
cd C:\WEB_APP_ADT\Work_ADT\mpgas_chk\release
call "apkrename.bat"

ftp -v -i -s:D:\Work_entropy\ftp_batch\script.txt

d: