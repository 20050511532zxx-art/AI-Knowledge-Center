@echo off
chcp 65001

cd /d D:\obsidian\仓库\quartz-site


echo ==========================
echo 开始同步飞书AI案例
echo ==========================

node feishu_ai_case_sync.mjs


echo ==========================
echo 开始提交Git
echo ==========================


git add .


git commit -m "自动更新AI案例"


echo ==========================
echo 推送GitHub
echo ==========================


git push


echo ==========================
echo AI案例更新完成
echo ==========================