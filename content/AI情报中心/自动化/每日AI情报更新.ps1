param()

$ErrorActionPreference = 'Stop'
$knowledgeBase = 'D:\obsidian\仓库\AI工具数据库'
$automationDir = Join-Path $knowledgeBase 'AI情报中心\自动化'
$promptPath = Join-Path $automationDir '每日AI情报更新提示词.md'
$logDir = Join-Path $automationDir '日志'
$codexCommandCandidates = @(
    'C:\Users\SZR641\AppData\Roaming\npm\node_modules\@openai\codex\node_modules\@openai\codex-win32-x64\vendor\x86_64-pc-windows-msvc\bin\codex.exe',
    'C:\Users\SZR641\AppData\Roaming\npm\codex.cmd'
)
$today = Get-Date -Format 'yyyy-MM-dd'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$recordPath = Join-Path $knowledgeBase "AI情报中心\工具更新记录\$today 工具更新记录.md"
$dailyPath = Join-Path $knowledgeBase "AI情报中心\每日AI快报\$today 每日AI快报.md"
$logPath = Join-Path $logDir "$timestamp 每日AI情报更新.log"
$lastMessagePath = Join-Path $logDir "$timestamp 执行报告.txt"
$promptInputPath = Join-Path $logDir "$timestamp Codex输入.txt"
$stdoutPath = Join-Path $logDir "$timestamp Codex标准输出.log"
$stderrPath = Join-Path $logDir "$timestamp Codex错误输出.log"
$mutexName = 'Local\ObsidianDailyAIIntelligenceUpdate'
$maxRuntimeMinutes = 25

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    [System.IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
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
function Read-SharedTextFile {
    param([string]$Path)
    $stream = [System.IO.File]::Open(
        $Path,
        [System.IO.FileMode]::Open,
        [System.IO.FileAccess]::Read,
        [System.IO.FileShare]::ReadWrite
    )
    try {
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8, $true)
        try {
            return $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
        }
    }
    finally {
        $stream.Dispose()
    }
}

function Invoke-CodexProcess {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$Prompt
    )

    [System.IO.File]::WriteAllText($promptInputPath, $Prompt, (New-Object System.Text.UTF8Encoding($false)))
    $argumentLine = ($Arguments | ForEach-Object { ConvertTo-CommandLineArgument $_ }) -join ' '
    $process = Start-Process -FilePath $Command -ArgumentList $argumentLine -WorkingDirectory 'D:\obsidian' `
        -RedirectStandardInput $promptInputPath -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath `
        -NoNewWindow -PassThru
    Write-Log "Codex 子进程已启动，PID：$($process.Id)。"

    if (-not $process.WaitForExit($maxRuntimeMinutes * 60 * 1000)) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
        }
        catch {
            Write-Log "Codex 超时后终止进程失败：$($_.Exception.Message)"
        }
        throw "Codex CLI 运行超过 $maxRuntimeMinutes 分钟，已终止本次任务。"
    }

    $process.WaitForExit()
    $process.Refresh()
    $exitCode = $process.ExitCode
    foreach ($outputPath in @($stdoutPath, $stderrPath)) {
        if (Test-Path -LiteralPath $outputPath) {
            $outputText = Read-SharedTextFile -Path $outputPath
            if ($outputText) {
                [System.IO.File]::AppendAllText($logPath, $outputText, (New-Object System.Text.UTF8Encoding($false)))
            }
        }
    }
    return $exitCode
}

$runMutex = $null
$mutexAcquired = $false
try {
    Write-Log '每日 AI 情报任务开始。'

    $runMutex = New-Object System.Threading.Mutex($false, $mutexName)
    try {
        $mutexAcquired = $runMutex.WaitOne(0)
    }
    catch [System.Threading.AbandonedMutexException] {
        $mutexAcquired = $true
        Write-Log '检测到上次任务异常退出后遗留的互斥量，已安全接管本次运行。'
    }
    if (-not $mutexAcquired) {
        Write-Log '检测到另一项每日 AI 情报任务正在运行，本次跳过以避免并发写入。'
        exit 0
    }

    if ((Test-Path -LiteralPath $recordPath) -and (Test-Path -LiteralPath $dailyPath)) {
        Write-Log '当天工具更新记录和日报均已存在，为避免重复写入，本次跳过。'
        exit 0
    }

    if (-not (Test-Path -LiteralPath $promptPath)) {
        throw "提示词文件不存在：$promptPath"
    }

    $codexCommand = Resolve-CodexCommand
    Write-Log "使用 Codex CLI：$codexCommand"

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
    $exitCode = Invoke-CodexProcess -Command $codexCommand -Arguments $arguments -Prompt $fullPrompt

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
finally {
    if ($runMutex) {
        if ($mutexAcquired) {
            $runMutex.ReleaseMutex()
        }
        $runMutex.Dispose()
    }
}