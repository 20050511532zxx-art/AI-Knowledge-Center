param()

$ErrorActionPreference = 'Stop'
$knowledgeBase = 'D:\obsidian\仓库\AI工具数据库'
$automationDir = Join-Path $knowledgeBase 'AI情报中心\自动化'
$logDir = Join-Path $automationDir '日志'
$mainTaskName = 'Obsidian-AI工具数据库-每日AI情报'
$codexCommandCandidates = @(
    'C:\Users\SZR641\AppData\Roaming\npm\node_modules\@openai\codex\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe',
    'C:\Users\SZR641\AppData\Roaming\npm\codex.cmd'
)
$today = Get-Date -Format 'yyyy-MM-dd'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$recordPath = Join-Path $knowledgeBase "AI情报中心\工具更新记录\$today 工具更新记录.md"
$dailyPath = Join-Path $knowledgeBase "AI情报中心\每日AI快报\$today 每日AI快报.md"
$logPath = Join-Path $logDir "$timestamp 每日AI情报自检修复.log"
$lastMessagePath = Join-Path $logDir "$timestamp 自检修复报告.txt"
$promptInputPath = Join-Path $logDir "$timestamp 自检Codex输入.txt"
$stdoutPath = Join-Path $logDir "$timestamp 自检Codex标准输出.log"
$stderrPath = Join-Path $logDir "$timestamp 自检Codex错误输出.log"
$lockPath = Join-Path $automationDir '每日AI情报运行.lock'
$maxRuntimeMinutes = 25

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    [System.IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
}

function Test-Outputs {
    return (Test-Path -LiteralPath $recordPath) -and (Test-Path -LiteralPath $dailyPath)
}

function Resolve-CodexCommand {
    foreach ($candidate in $codexCommandCandidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    $command = Get-Command 'codex.exe', 'codex.cmd', 'codex' -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($command) {
        return $command.Source
    }

    throw '未找到 Codex CLI。请检查安装路径或 PATH。'
}

function ConvertTo-CommandLineArgument {
    param([string]$Value)
    if ($Value -notmatch '[\s"]') {
        return $Value
    }
    return '"' + $Value + '"'
}

function Invoke-CodexProcess {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$Prompt,
        [string]$AttemptName
    )

    [System.IO.File]::WriteAllText($promptInputPath, $Prompt, (New-Object System.Text.UTF8Encoding($false)))
    $argumentLine = ($Arguments | ForEach-Object { ConvertTo-CommandLineArgument $_ }) -join ' '
    $process = Start-Process -FilePath $Command -ArgumentList $argumentLine -WorkingDirectory 'D:\obsidian' `
        -RedirectStandardInput $promptInputPath -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath `
        -NoNewWindow -PassThru

    if (-not $process.WaitForExit($maxRuntimeMinutes * 60 * 1000)) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
        }
        catch {
            Write-Log "$AttemptName 超时后终止进程失败：$($_.Exception.Message)"
        }
        throw "$AttemptName 运行超过 $maxRuntimeMinutes 分钟，已终止。"
    }

    $process.WaitForExit()
    foreach ($outputPath in @($stdoutPath, $stderrPath)) {
        if (Test-Path -LiteralPath $outputPath) {
            $outputText = [System.IO.File]::ReadAllText($outputPath)
            if ($outputText) {
                [System.IO.File]::AppendAllText($logPath, $outputText, (New-Object System.Text.UTF8Encoding($false)))
            }
        }
    }
    return $process.ExitCode
}

$runLock = $null

try {

    Write-Log '每日 AI 情报自检开始。'

    if (Test-Outputs) {
        Write-Log '当天工具更新记录和日报均已存在，无需修复。'
        exit 0
    }

    try {
        $runLock = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
    }
    catch [System.IO.IOException] {
        Write-Log '检测到主任务或另一项自检正在运行，本次不启动并行任务。'
        exit 0
    }

    $codexCommand = Resolve-CodexCommand
    Write-Log "使用 Codex CLI：$codexCommand"

    $recentLogs = Get-ChildItem -LiteralPath $logDir -File -Filter '*每日AI情报更新.log' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 3
    $diagnosticText = if ($recentLogs) {
        ($recentLogs | ForEach-Object {
            "### $($_.FullName)`n" + ((Get-Content -LiteralPath $_.FullName -Encoding UTF8 -Tail 80) -join "`n")
        }) -join "`n`n"
    }
    else {
        '没有找到主任务日志。'
    }

    $repairPrompt = @"
你是“每日 AI 情报自动化自检修复员”。当前北京时间日期是 $today。

工作目录：D:\obsidian
知识库：$knowledgeBase

必须先读取：

1. D:\obsidian\AGENTS.md
2. $automationDir\每日AI情报更新.ps1
3. $automationDir\每日AI情报更新提示词.md
4. 下方提供的最近运行日志

你的任务：

1. 判断今天的工具更新记录和每日 AI 快报为什么没有生成。
2. 如果属于参数、脚本、路径、编码或工具调用问题，在 `AI情报中心/自动化` 内进行最小修正。
3. 不降低 sandbox、安全限制、官方来源要求或历史保护规则。
4. 修正后立即完成今天的完整 AI 情报更新，确保生成：
   - $recordPath
   - $dailyPath
5. 只使用官方 Blog、Release Notes、Developer、Help Center、状态页和正式公告。
6. 不删除文件、不修改 Excel、不覆盖历史、不编造信息、不操作 D:\obsidian 之外的文件。
7. 把诊断、修正和执行结果写入最终报告。

最近运行日志：

$diagnosticText
"@

    $commonExec = @(
        '--sandbox', 'workspace-write',
        '--skip-git-repo-check',
        '--ephemeral',
        '--color', 'never',
        '--output-last-message', $lastMessagePath,
        '--cd', 'D:\obsidian',
        '-'
    )
    $attempts = @(
        [pscustomobject]@{
            Name = '标准联网方式'
            Arguments = @('--search', '--ask-for-approval', 'never', 'exec') + $commonExec
        },
        [pscustomobject]@{
            Name = '兼容联网方式'
            Arguments = @('--search', 'exec') + $commonExec
        },
        [pscustomobject]@{
            Name = '本地修复方式'
            Arguments = @('exec') + $commonExec
        }
    )

    $completed = $false
    foreach ($attempt in $attempts) {
        Write-Log "开始尝试：$($attempt.Name)。"
        $arguments = $attempt.Arguments
        $exitCode = Invoke-CodexProcess -Command $codexCommand -Arguments $arguments -Prompt $repairPrompt -AttemptName $attempt.Name
        Write-Log "$($attempt.Name)返回代码：$exitCode。"

        if (($exitCode -eq 0) -and (Test-Outputs)) {
            $completed = $true
            Write-Log "$($attempt.Name)已完成修复并生成当天文件。"
            break
        }

        if ($exitCode -eq 0) {
            Write-Log "$($attempt.Name)正常退出，但当天文件仍不完整，继续下一种安全方式。"
        }
    }

    if (-not $completed) {
        throw '所有安全修复方式均未生成完整的当天工具更新记录和日报。'
    }

    Write-Log '每日 AI 情报自检修复完成。'
    exit 0
}
catch {
    Write-Log "自检修复失败：$($_.Exception.Message)"
    exit 1
}
finally {
    if ($runLock) {
        $runLock.Dispose()
    }
}