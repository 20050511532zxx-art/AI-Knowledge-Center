@echo off
chcp 65001 > nul

cd /d D:\obsidian\仓库\quartz-site

echo =====================
echo 开始同步飞书AI案例库
echo =====================

node feishu_ai_case_sync.mjs


echo =====================
echo 提交Git
echo =====================

git add .

git commit -m "更新AI案例库内容"


echo =====================
echo 推送GitHub
echo =====================

git push


echo =====================
echo 发布完成
echo =====================

pause