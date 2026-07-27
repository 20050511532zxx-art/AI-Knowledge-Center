$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot


# 输出目录
$outputRoot = Join-Path $projectRoot "content\AI-Center\Official-Updates"


if (!(Test-Path $outputRoot)) {
    New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
}


# 模板文件
$templatePath = Join-Path $PSScriptRoot "ai-official-template.md"


if (!(Test-Path $templatePath)) {
    throw "Template file not found: $templatePath"
}


# 日期
$today = Get-Date -Format "yyyy-MM-dd"


# 输出文件
$outputFile = Join-Path $outputRoot "$today AI-Official-Update.md"


# 读取UTF-8模板
$template = [System.IO.File]::ReadAllText(
    $templatePath,
    (New-Object System.Text.UTF8Encoding($false))
)


# 替换日期
$content = $template.Replace("{{date}}", $today)



# 写入UTF-8 Markdown
[System.IO.File]::WriteAllText(
    $outputFile,
    $content,
    (New-Object System.Text.UTF8Encoding($false))
)


Write-Host "START: AI official monitor"

Write-Host "AI official monitor completed."

Write-Host ""

Write-Host "Output:"

Write-Host $outputFile