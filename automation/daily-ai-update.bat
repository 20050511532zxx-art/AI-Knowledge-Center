@echo off

cd /d D:\obsidian\仓库\quartz-site

echo ==========================
echo AI Daily Update Start
echo ==========================


echo [1/5] Fetch AI official updates

node automation\fetch-ai-official-updates.js



echo [2/5] Generate AI report

node automation\codex-ai-official-analysis.js



echo [3/5] Build Quartz

npx quartz build



echo [4/5] Git commit

git add .

git commit -m "Daily AI official update"



echo [5/5] Push GitHub

git push



echo ==========================
echo AI Daily Update Finished
echo ==========================

exit