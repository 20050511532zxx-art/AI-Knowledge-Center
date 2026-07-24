param(
    [switch]$DryRun,
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [string]$CommitMessage
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$analysisConfigPath = Join-Path $projectRoot 'config\codex-analysis.json'
$knowledgeConfigPath = Join-Path $projectRoot 'config\knowledge-base.json'
$publicIndexPath = Join-Path $projectRoot 'public\index.html'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-JsonFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "JSON file does not exist: $Path"
    }

    $content = [System.IO.File]::ReadAllText($Path).TrimStart([char]0xFEFF)
    return $content | ConvertFrom-Json
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

function Invoke-ExternalCommand {
    param(
        [string]$Name,
        [string]$Command,
        [string[]]$Arguments
    )

    Write-Host "START: $Name"
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command @Arguments
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0) {
        throw "$Name failed with exit code $exitCode"
    }

    Write-Host "COMPLETE: $Name"
}

Set-Location $projectRoot
$gitCommand = Resolve-ExternalCommand -CommandName 'git.exe' -FallbackPath 'C:\Program Files\Git\cmd\git.exe'
$nodeCommand = Resolve-ExternalCommand -CommandName 'node.exe' -FallbackPath 'C:\Program Files\nodejs\node.exe'
$analysisConfig = Read-JsonFile -Path $analysisConfigPath
$knowledgeConfig = Read-JsonFile -Path $knowledgeConfigPath
$branch = (& $gitCommand branch --show-current).Trim()
$remoteUrl = (& $gitCommand remote get-url origin).Trim()

if ($branch -ne 'main') {
    throw "Publishing is only allowed from main. Current branch: $branch"
}
if (-not $remoteUrl) {
    throw 'Git remote origin is not configured.'
}

$existingStaged = @(& $gitCommand diff --cached --name-only)
if (($existingStaged.Count -gt 0) -and (-not $DryRun)) {
    throw 'The Git staging area is not empty. Commit or unstage existing files before publishing.'
}

if (-not $SkipBuild) {
    $previousNodeOptions = $env:NODE_OPTIONS
    $env:NODE_OPTIONS = '--max-old-space-size=8192'
    try {
        Invoke-ExternalCommand -Name 'Quartz local build' -Command $nodeCommand -Arguments @(
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
}

if (-not (Test-Path -LiteralPath $publicIndexPath)) {
    throw "Quartz output is missing: $publicIndexPath"
}

$publishPaths = @(
    '.github/workflows/deploy-pages.yml',
    '.gitignore',
    '.env.example',
    'automation',
    'config',
    'docs',
    'scripts/feishu',
    'package.json',
    'package-lock.json',
    'quartz.config.ts',
    $analysisConfig.promptPath,
    $analysisConfig.outputRoot,
    $knowledgeConfig.promptPath,
    $knowledgeConfig.toolLibraryRoot,
    $knowledgeConfig.updateLogRoot,
    $knowledgeConfig.industryNewsRoot,
    $knowledgeConfig.testRecommendationRoot,
    $knowledgeConfig.monthlySummaryRoot
)

Write-Host "Branch: $branch"
Write-Host "Remote: $remoteUrl"
Write-Host 'Publish candidate files:'
& $gitCommand status --short -- @publishPaths

if ($DryRun) {
    Write-Host 'Dry-run complete. No files were staged, committed, or pushed.'
    exit 0
}

Invoke-ExternalCommand -Name 'Stage publish files' -Command $gitCommand -Arguments (@('add', '--') + $publishPaths)
$stagedFiles = @(& $gitCommand diff --cached --name-only)
if ($stagedFiles.Count -eq 0) {
    Write-Host 'No publishable changes were found.'
    exit 0
}

$forbiddenExact = @(
    '.env',
    '.env.txt',
    'feishu_sync.js',
    'feishu_test.js',
    'test_openai.js',
    'test_https.js',
    'ai_analyze.js'
)
$forbiddenStaged = $stagedFiles | Where-Object {
    ($_ -in $forbiddenExact) -or $_.StartsWith('.runtime/') -or $_.StartsWith('public/')
}
if ($forbiddenStaged) {
    throw "Forbidden files were staged: $($forbiddenStaged -join ', ')"
}

Write-Host 'Staged files:'
$stagedFiles | ForEach-Object { Write-Host "- $_" }

if (-not $CommitMessage) {
    $CommitMessage = "chore(publish): update AI intelligence $(Get-Date -Format 'yyyy-MM-dd')"
}

Invoke-ExternalCommand -Name 'Create Git commit' -Command $gitCommand -Arguments @('commit', '-m', $CommitMessage)

if ($SkipPush) {
    Write-Host 'Git push skipped by -SkipPush.'
    exit 0
}

Invoke-ExternalCommand -Name 'Push to GitHub' -Command $gitCommand -Arguments @('push', 'origin', 'main')
Write-Host 'GitHub publish push completed.'
