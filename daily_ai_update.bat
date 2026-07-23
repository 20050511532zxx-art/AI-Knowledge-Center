@echo off

chcp 65001


cd /d "%~dp0"


echo ===== AI工具监测开始 =====


node ai_monitor.js


echo ===== AI分析开始 =====


node ai_analyze.js


echo ===== Quartz更新开始 =====


npx quartz build


echo ===== 全部完成 =====


pause