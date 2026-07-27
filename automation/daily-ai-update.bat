@echo off

cd /d D:\obsidian\仓库\quartz-site

echo ==========================
echo AI Daily Update Start
echo ==========================


echo [1/7] Fetch AI official updates

node automation\fetch-ai-official-updates.js


echo.
echo [2/7] Discover new AI tools

node automation\discover-new-ai-tools.js


echo.
echo [3/7] Generate AI official report

node automation\codex-ai-official-analysis.js


echo.
echo [4/7] Analyze new AI tools

node automation\codex-ai-discovery-analysis.js


echo.
echo [5/7] Build Quartz

call npx quartz build


echo.
echo Quartz finished


echo.
echo [6/7] Git commit

git add .

git commit -m "Daily AI official update"


echo.
echo [7/7] Push GitHub

git push


echo.
echo ==========================
echo AI Daily Update Finished
echo ==========================


pause