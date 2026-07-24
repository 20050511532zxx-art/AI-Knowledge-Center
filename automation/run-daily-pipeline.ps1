param(
    [switch]$DryRun,
    [switch]$SkipQuartzBuild,
    [switch]$Publish,
    [string]$CodexCommand
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $projectRoot '.runtime\pipeline'
$logRoot = Join-Path $runtimeRoot 'logs'
$lockPath = Join-Path $runtimeRoot 'daily-pipeline.lock'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logRoot "$timestamp-daily-pipeline.log"
$analysisScript = Join-Path $projectRoot 'automation\run-codex-analysis.ps1'
$knowledgeScript = Join-Path $projectRoot 'automation\run-codex-knowledge-base.ps1'
$publishScript = Join-Path $projectRoot 'automation\publish-to-github.ps1'
$analysisConfigPath = Join-Path $projectRoot 'config\codex-analysis.json'
$knowledgeConfigPath = Join-Path $projectRoot 'config\knowledge-base.json'
$contentRoot = Join-Path $projectRoot 'content'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$lockStream = $null
$pipelineExitCode = 0

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

function Write-Log {
    param([string]$Message)

    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    [System.IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine, $utf8NoBom)
    Write-Host $line
}

function Resolve-ExternalCommand {
    param(
        [string]$CommandName,
        [string]$FallbackPath
    )

    $command = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    if ($FallbackPath -and (Test-Path -LiteralPath $FallbackPath)) {
        return $FallbackPath
    }

    throw "Required command was not found: $CommandName"
}

function Read-JsonFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "JSON file does not exist: $Path"
    }

    $content = [System.IO.File]::ReadAllText($Path).TrimStart([char]0xFEFF)
    return $content | ConvertFrom-Json
}

function Invoke-PipelineStep {
    param(
        [string]$Name,
        [string]$Command,
        [string[]]$Arguments
    )

    Write-Log "STEP START: $Name"
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $Command @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    foreach ($outputLine in @($output)) {
        Write-Log "[$Name] $($outputLine.ToString())"
    }

    if ($exitCode -ne 0) {
        throw "$Name failed with exit code $exitCode"
    }

    Write-Log "STEP COMPLETE: $Name"
}

function Test-ObsidianContent {
    $analysisConfig = Read-JsonFile -Path $analysisConfigPath
    $knowledgeConfig = Read-JsonFile -Path $knowledgeConfigPath
    $requiredDirectories = @(
        (Join-Path $projectRoot $analysisConfig.outputRoot),
        (Join-Path $projectRoot $knowledgeConfig.toolLibraryRoot),
        (Join-Path $projectRoot $knowledgeConfig.updateLogRoot),
        (Join-Path $projectRoot $knowledgeConfig.testRecommendationRoot),
        (Join-Path $projectRoot $knowledgeConfig.monthlySummaryRoot)
    )

    foreach ($directory in $requiredDirectories) {
        if (-not (Test-Path -LiteralPath $directory)) {
            throw "Required Obsidian directory does not exist: $directory"
        }
    }

    $markdownCount = (Get-ChildItem -LiteralPath $contentRoot -Recurse -File -Filter '*.md').Count
    if ($markdownCount -eq 0) {
        throw 'No Obsidian Markdown files were found.'
    }

    Write-Log "Obsidian content validation complete: $markdownCount Markdown file(s)."
}

try {
    try {
        $lockStream = [System.IO.File]::Open(
            $lockPath,
            [System.IO.FileMode]::OpenOrCreate,
            [System.IO.FileAccess]::ReadWrite,
            [System.IO.FileShare]::None
        )
        $lockContent = $utf8NoBom.GetBytes("PID=$PID`nStarted=$(Get-Date -Format 'o')`n")
        $lockStream.SetLength(0)
        $lockStream.Write($lockContent, 0, $lockContent.Length)
        $lockStream.Flush()
    }
    catch {
        throw "Another daily pipeline instance is already running. Lock: $lockPath"
    }

    if ($Publish -and $SkipQuartzBuild -and (-not $DryRun)) {
        throw 'Publishing requires a successful Quartz build. Remove -SkipQuartzBuild.'
    }

    Write-Log "Daily AI intelligence pipeline started. DryRun=$DryRun SkipQuartzBuild=$SkipQuartzBuild Publish=$Publish"
    $npmCommand = Resolve-ExternalCommand -CommandName 'npm.cmd' -FallbackPath 'C:\Program Files\nodejs\npm.cmd'
    $nodeCommand = Resolve-ExternalCommand -CommandName 'node.exe' -FallbackPath 'C:\Program Files\nodejs\node.exe'
    $powershellCommand = Resolve-ExternalCommand -CommandName 'powershell.exe' -FallbackPath 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'

    $feishuArguments = @('run', 'feishu:pull')
    if ($DryRun) {
        $feishuArguments += @('--', '--dry-run')
    }
    Invoke-PipelineStep -Name 'Feishu data pull' -Command $npmCommand -Arguments $feishuArguments

    $analysisArguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $analysisScript)
    if ($DryRun) {
        $analysisArguments += '-DryRun'
    }
    if ($CodexCommand) {
        $analysisArguments += @('-CodexCommand', $CodexCommand)
    }
    Invoke-PipelineStep -Name 'Codex business analysis' -Command $powershellCommand -Arguments $analysisArguments

    $knowledgeArguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $knowledgeScript)
    if ($DryRun) {
        $knowledgeArguments += '-DryRun'
    }
    if ($CodexCommand) {
        $knowledgeArguments += @('-CodexCommand', $CodexCommand)
    }
    Invoke-PipelineStep -Name 'Codex knowledge organization' -Command $powershellCommand -Arguments $knowledgeArguments

    Write-Log 'STEP START: Obsidian content validation'
    Test-ObsidianContent
    Write-Log 'STEP COMPLETE: Obsidian content validation'

    if ($DryRun) {
        Write-Log 'Quartz build skipped because this is a dry-run.'
    }
    elseif ($SkipQuartzBuild) {
        Write-Log 'Quartz build skipped by -SkipQuartzBuild.'
    }
    else {
        $previousNodeOptions = $env:NODE_OPTIONS
        $env:NODE_OPTIONS = '--max-old-space-size=8192'
        try {
            Invoke-PipelineStep -Name 'Quartz build sync' -Command $nodeCommand -Arguments @(
                (Join-Path $projectRoot 'quartz\bootstrap-cli.mjs'),
                'build',
                '--concurrency=1'
            )
        }
        finally {
            if ($null -eq $previousNodeOptions) {
                Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
            }
            else {
                $env:NODE_OPTIONS = $previousNodeOptions
            }
        }
        $indexPath = Join-Path $projectRoot 'public\index.html'
        if (-not (Test-Path -LiteralPath $indexPath)) {
            throw "Quartz build completed without public index: $indexPath"
        }
        Write-Log "Quartz output verified: $indexPath"
    }

    if ($Publish) {
        $publishArguments = @(
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-File',
            $publishScript,
            '-SkipBuild'
        )
        if ($DryRun) {
            $publishArguments += '-DryRun'
        }
        Invoke-PipelineStep -Name 'GitHub publish' -Command $powershellCommand -Arguments $publishArguments
    }

    Write-Log 'Daily AI intelligence pipeline completed successfully.'
}
catch {
    $pipelineExitCode = 1
    Write-Log "PIPELINE FAILED: $($_.Exception.Message)"
}
finally {
    if ($lockStream) {
        $lockStream.Dispose()
    }
    if (Test-Path -LiteralPath $lockPath) {
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
}

exit $pipelineExitCode
