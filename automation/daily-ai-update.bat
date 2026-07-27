@echo off
chcp 65001 > nul

cd /d D:\obsidian\仓库\quartz-site


set LOGFILE=automation\logs\AI-update.log


echo ========================== >> %LOGFILE%
echo AI Daily Update Start >> %LOGFILE%
echo Time: %date% %time% >> %LOGFILE%
echo ========================== >> %LOGFILE%


echo [1/5] Fetch AI official updates
echo [1/5] Fetch AI official updates >> %LOGFILE%

node automation\fetch-ai-official-updates.js >> %LOGFILE% 2>&1


echo [2/5] Generate AI report
echo [2/5] Generate AI report >> %LOGFILE%

node automation\codex-ai-official-analysis.js >> %LOGFILE% 2>&1


echo [3/5] Build Quartz
echo [3/5] Build Quartz >> %LOGFILE%

call npx quartz build >> %LOGFILE% 2>&1


echo [4/5] Git commit
echo [4/5] Git commit >> %LOGFILE%

git add .
git commit -m "Daily AI official update" >> %LOGFILE% 2>&1


echo [5/5] Push GitHub
echo [5/5] Push GitHub >> %LOGFILE%

git push >> %LOGFILE% 2>&1


echo ========================== >> %LOGFILE%
echo AI Daily Update Finished >> %LOGFILE%
echo ========================== >> %LOGFILE%


exit