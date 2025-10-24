rem @echo off
pushd %~DP0
d:
cd D:\Work\editplus_workspace
svn cleanup
svn commit --message editplus
popd
