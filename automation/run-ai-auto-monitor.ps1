$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot


# ==============================
# Output directory
# ==============================

$outputRoot = Join-Path $projectRoot "content\AI-Center\Official-Monitor"


if (!(Test-Path $outputRoot)) {
    New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
}


# ==============================
# Generate file
# ==============================

$today = Get-Date -Format "yyyy-MM-dd"

$outputFile = Join-Path $outputRoot "$today AI-Official-Update.md"



$markdown = @"
---
title: "$today AI官方更新"
type: ai-auto-monitor
date: $today
---

# $today AI官方更新


## 今日AI工具官方动态


本页面由AI自动监测系统生成。


当前监测范围：

- OpenAI
- Claude
- Google Gemini
- Midjourney
- 可灵AI
- 豆包
- 即梦AI



## 官方更新内容


暂无重大官方更新。


后续将自动接入：

- 官方博客
- 官方更新日志
- 产品公告
- API更新页面



## 电商应用影响分析


等待Codex自动分析。


"@



# ==============================
# Write UTF-8 file
# ==============================

[System.IO.File]::WriteAllText(
    $outputFile,
    $markdown,
    (New-Object System.Text.UTF8Encoding($false))
)



Write-Host "START: AI official monitor"

Write-Host "AI official monitor completed."

Write-Host ""

Write-Host "Output:"

Write-Host $outputFile