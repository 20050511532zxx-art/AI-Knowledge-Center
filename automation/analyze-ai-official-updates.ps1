$ErrorActionPreference = "Stop"


$projectRoot = Split-Path -Parent $PSScriptRoot


$inputFile = Join-Path `
    $projectRoot `
    ".runtime\ai-monitor\official-updates.json"


$outputRoot = Join-Path `
    $projectRoot `
    "content\AI-Center\Official-Updates"



if (!(Test-Path $inputFile)) {

    throw "Official updates data not found."

}



if (!(Test-Path $outputRoot)) {

    New-Item `
        -ItemType Directory `
        -Force `
        -Path $outputRoot | Out-Null

}



$data = Get-Content `
    $inputFile `
    -Encoding UTF8 |
    ConvertFrom-Json



$today = Get-Date `
    -Format "yyyy-MM-dd"



$outputFile = Join-Path `
    $outputRoot `
    "$today AI-Official-Update.md"



$content = @"
---
title: "$today AI Official Update"
type: ai-official-update
date: $today
---

# $today AI官方更新


## 今日监测来源

"@



foreach($item in $data){


$content += @"

---

## $($item.name)


### 官方来源

$($item.url)


### 检测时间

$($item.fetchedAt)


### 检测状态

$($item.status)


### 更新摘要

等待 Codex 深度分析。


### 电商应用价值

等待 Codex 分析。


"@


}



[System.IO.File]::WriteAllText(
    $outputFile,
    $content,
    (New-Object System.Text.UTF8Encoding($false))
)



Write-Host "AI official analysis completed."

Write-Host ""

Write-Host "Output:"

Write-Host $outputFile