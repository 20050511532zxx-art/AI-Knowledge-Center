param()

$ErrorActionPreference = 'Stop'
$knowledgeBase = 'D:\obsidian\仓库\AI工具数据库'
$automationDir = Join-Path $knowledgeBase 'AI情报中心\自动化'
$promptPath = Join-Path $automationDir '每日AI情报更新提示词.md'
$logDir = Join-Path $automationDir '日志'
$codexCommand = 'C:\Users\SZR641\AppData\Roaming\npm\codex.cmd'
$today = Get-Date -Format 'yyyy-MM-dd'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$recordPath = Join-Path $knowledgeBase "AI情报中心\工具更新记录\$today 工具更新记录.md"
$dailyPath = Join-Path $knowledgeBase "AI情报中心\每日AI快报\$today 每日AI快报.md"
$logPath = Join-Path $logDir "$timestamp 每日AI情报更新.log"
$lastMessagePath = Join-Path $logDir "$timestamp 执行报告.txt"

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    [System.IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
}

try {
    Write-Log '每日 AI 情报任务开始。'

    if ((Test-Path -LiteralPath $recordPath) -and (Test-Path -LiteralPath $dailyPath)) {
        Write-Log '当天工具更新记录和日报均已存在，为避免重复写入，本次跳过。'
        exit 0
    }

    if (-not (Test-Path -LiteralPath $promptPath)) {
        throw "提示词文件不存在：$promptPath"
    }

    if (-not (Test-Path -LiteralPath $codexCommand)) {
        throw "Codex CLI 不存在：$codexCommand"
    }

    $basePrompt = [System.IO.File]::ReadAllText($promptPath)
    $runtimePrompt = @"

## 本次运行信息

- 北京时间日期：$today
- 知识库根目录：D:\obsidian
- AI 工具数据库：$knowledgeBase
- 本次是无人值守任务，不得请求用户确认；在规则允许范围内直接完成全部步骤。
"@
    $fullPrompt = $basePrompt + $runtimePrompt
    $arguments = @(
        '--search',
        '--ask-for-approval', 'never',
        'exec',
        '--sandbox', 'workspace-write',
        '--skip-git-repo-check',
        '--ephemeral',
        '--color', 'never',
        '--output-last-message', $lastMessagePath,
        '--cd', 'D:\obsidian',
        '-'
    )

    Write-Log '正在调用 Codex CLI 执行情报采集、审核、知识库维护和日报生成。'
    $fullPrompt | & $codexCommand @arguments *>> $logPath
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        throw "Codex CLI 返回错误代码：$exitCode"
    }

    if (-not (Test-Path -LiteralPath $recordPath)) {
        throw "任务结束后未发现工具更新记录：$recordPath"
    }

    if (-not (Test-Path -LiteralPath $dailyPath)) {
        throw "任务结束后未发现每日 AI 快报：$dailyPath"
    }

    Write-Log '每日 AI 情报任务完成，工具更新记录和日报均已生成。'
    exit 0
}
catch {
    Write-Log "任务失败：$($_.Exception.Message)"
    exit 1
}