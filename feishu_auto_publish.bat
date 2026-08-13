@echo off
chcp 65001 >nul
setlocal

cd /d "D:\obsidian\仓库\quartz-site"

echo ==========================================
echo 飞书 AI 案例库自动同步开始
echo 时间：%date% %time%
echo ==========================================

echo.
echo [1/5] 检查飞书案例更新...
node feishu_ai_case_sync.mjs

if errorlevel 1 (
    echo.
    echo [失败] 飞书案例同步发生错误
    goto :error
)

echo.
echo [2/5] 构建 Quartz 网站...
call npx quartz build

if errorlevel 1 (
    echo.
    echo [失败] Quartz 构建发生错误
    goto :error
)

echo.
echo [3/5] 检查是否有文件变化...
git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo.
    echo 没有检测到需要发布的新变化。
    echo 本次不执行 Git commit 和 push。
    goto :success
)

echo.
echo [4/5] 提交最新内容...
git commit -m "自动更新飞书AI案例库"

if errorlevel 1 (
    echo.
    echo [失败] Git commit 发生错误
    goto :error
)

echo.
echo [5/5] 推送到 GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo [失败] Git push 发生错误
    goto :error
)

:success
echo.
echo ==========================================
echo 自动同步完成
echo 时间：%date% %time%
echo ==========================================
exit /b 0

:error
echo.
echo ==========================================
echo 自动同步失败，请检查上方错误信息
echo 时间：%date% %time%
echo ==========================================
exit /b 1