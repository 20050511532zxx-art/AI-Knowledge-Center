param(
    [switch]$DryRun,
    [string]$CodexCommand
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $projectRoot 'config\knowledge-base.json'
$processedStatePath = Join-Path $projectRoot '.runtime\codex\processed-state.json'
$knowledgeStatePath = Join-Path $projectRoot '.runtime\codex\knowledge-state.json'
$syncStatePath = Join-Path $projectRoot '.runtime\feishu\sync-state.json'
$inboxRoot = Join-Path $projectRoot '.runtime\feishu\inbox'
$codexRuntimeRoot = Join-Path $projectRoot '.runtime\codex'

function Read-JsonFile {
    param(
        [string]$Path,
        $Fallback
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        if ($null -ne $Fallback) {
            return $Fallback
        }

        throw "JSON file does not exist: $Path"
    }

    $content = [System.IO.File]::ReadAllText($Path).TrimStart([char]0xFEFF)
    return $content | ConvertFrom-Json
}

function Get-RecordState {
    param(
        $Records,
        [string]$RecordId
    )

    if ($null -eq $Records) {
        return $null
    }

    $property = $Records.PSObject.Properties[$RecordId]
    if ($null -eq $property) {
        return $null
    }

    return $property.Value
}

function Resolve-CodexCommand {
    param([string]$RequestedCommand)

    if ($RequestedCommand) {
        if (-not (Test-Path -LiteralPath $RequestedCommand)) {
            throw "Specified Codex CLI does not exist: $RequestedCommand"
        }

        return $RequestedCommand
    }

    if ($env:CODEX_COMMAND -and (Test-Path -LiteralPath $env:CODEX_COMMAND)) {
        return $env:CODEX_COMMAND
    }

    foreach ($commandName in @('codex.cmd', 'codex')) {
        $command = Get-Command $commandName -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    $fallback = Join-Path $env:APPDATA 'npm\codex.cmd'
    if (Test-Path -LiteralPath $fallback) {
        return $fallback
    }

    throw 'Codex CLI was not found. Install Codex or use -CodexCommand to specify codex.cmd.'
}

function Test-AllowedOutputPath {
    param(
        [string]$OutputPath,
        [string[]]$AllowedRoots
    )

    $fullOutputPath = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputPath))
    foreach ($allowedRoot in $AllowedRoots) {
        $fullAllowedRoot = [System.IO.Path]::GetFullPath($allowedRoot).TrimEnd('\') + '\'
        if ($fullOutputPath.StartsWith($fullAllowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }

    return $false
}

$config = Read-JsonFile -Path $configPath
$promptPath = Join-Path $projectRoot $config.promptPath
$allowedRoots = @(
    (Join-Path $projectRoot $config.toolLibraryRoot),
    (Join-Path $projectRoot $config.updateLogRoot),
    (Join-Path $projectRoot $config.industryNewsRoot),
    (Join-Path $projectRoot $config.testRecommendationRoot),
    (Join-Path $projectRoot $config.monthlySummaryRoot)
)

if (-not (Test-Path -LiteralPath $promptPath)) {
    throw "Knowledge prompt does not exist: $promptPath"
}

$processedState = Read-JsonFile -Path $processedStatePath
$syncState = Read-JsonFile -Path $syncStatePath
$knowledgeState = Read-JsonFile -Path $knowledgeStatePath -Fallback ([pscustomobject]@{
        schemaVersion = 1
        lastRunAt = $null
        records = [pscustomobject]@{}
    })
$pendingRecords = @()

foreach ($property in $processedState.records.PSObject.Properties) {
    $recordId = $property.Name
    $analysisRecord = $property.Value
    if ($analysisRecord.status -ne 'completed') {
        continue
    }

    $knowledgeRecord = Get-RecordState -Records $knowledgeState.records -RecordId $recordId
    if (($null -ne $knowledgeRecord) -and ($knowledgeRecord.contentHash -eq $analysisRecord.contentHash)) {
        continue
    }

    $syncRecord = Get-RecordState -Records $syncState.records -RecordId $recordId
    if ($null -eq $syncRecord) {
        throw "Feishu sync state is missing record: $recordId"
    }

    $analysisPath = Join-Path $projectRoot $analysisRecord.outputFile
    $submissionPath = Join-Path $inboxRoot $syncRecord.file
    if (-not (Test-Path -LiteralPath $analysisPath)) {
        throw "Analysis Markdown does not exist: $analysisPath"
    }
    if (-not (Test-Path -LiteralPath $submissionPath)) {
        throw "Raw submission does not exist: $submissionPath"
    }

    $pendingRecords += [pscustomobject]@{
        recordId = $recordId
        contentHash = $analysisRecord.contentHash
        analysisFile = $analysisPath
        submissionFile = $submissionPath
    }
}

Write-Host "Pending knowledge records: $($pendingRecords.Count)."

if ($pendingRecords.Count -eq 0) {
    Write-Host 'No analyzed submissions require knowledge-base processing.'
    exit 0
}

if ($DryRun) {
    $pendingRecords | Format-Table recordId, contentHash, analysisFile, submissionFile -AutoSize
    Write-Host 'Allowed output roots:'
    $allowedRoots | ForEach-Object { Write-Host "- $_" }
    Write-Host 'Dry-run complete. Codex was not called and no knowledge files were written.'
    exit 0
}

$resolvedCodexCommand = Resolve-CodexCommand -RequestedCommand $CodexCommand
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$today = Get-Date -Format 'yyyy-MM-dd'
$month = Get-Date -Format 'yyyy-MM'
$logPath = Join-Path $codexRuntimeRoot "logs\$timestamp-knowledge-base.log"
$lastMessagePath = Join-Path $codexRuntimeRoot "reports\$timestamp-knowledge-base-report.txt"
New-Item -ItemType Directory -Force -Path (Split-Path $logPath), (Split-Path $lastMessagePath) | Out-Null

$recordLines = $pendingRecords | ForEach-Object {
    "- recordId: $($_.recordId)`n  contentHash: $($_.contentHash)`n  analysisFile: $($_.analysisFile)`n  submissionFile: $($_.submissionFile)"
}
$basePrompt = [System.IO.File]::ReadAllText($promptPath)
$runtimePrompt = @"

## Runtime information

- Current date: $today
- Current month: $month
- Project root: $projectRoot
- Knowledge state file: $knowledgeStatePath
- Minimum recommended test score: $($config.minimumTestScore)
- Process only these records:

$($recordLines -join [Environment]::NewLine)

Write the knowledge files and state directly. Do not return only examples. Re-read all outputs before finishing and ensure every path is inside the five allowed knowledge directories.
"@
$fullPrompt = $basePrompt + $runtimePrompt
$arguments = @(
    '--ask-for-approval', 'never',
    'exec',
    '--sandbox', 'workspace-write',
    '--ephemeral',
    '--color', 'never',
    '--output-last-message', $lastMessagePath,
    '--cd', $projectRoot,
    '-'
)

Write-Host 'Running Codex knowledge-base processing.'
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $fullPrompt | & $resolvedCodexCommand @arguments 2>&1 | Out-File -FilePath $logPath -Append -Encoding utf8
    $exitCode = $LASTEXITCODE
}
finally {
    $ErrorActionPreference = $previousErrorActionPreference
}

if ($exitCode -ne 0) {
    throw "Codex CLI returned exit code $exitCode. Log: $logPath"
}

$newKnowledgeState = Read-JsonFile -Path $knowledgeStatePath
foreach ($pendingRecord in $pendingRecords) {
    $result = Get-RecordState -Records $newKnowledgeState.records -RecordId $pendingRecord.recordId
    if ($null -eq $result) {
        throw "Codex did not write knowledge state: $($pendingRecord.recordId)"
    }
    if ($result.contentHash -ne $pendingRecord.contentHash) {
        throw "Knowledge state content hash does not match: $($pendingRecord.recordId)"
    }
    if ($result.status -notin @('completed', 'skipped')) {
        throw "Knowledge state has an invalid status: $($pendingRecord.recordId)"
    }

    foreach ($outputFile in @($result.outputs)) {
        if (-not (Test-AllowedOutputPath -OutputPath $outputFile -AllowedRoots $allowedRoots)) {
            throw "Codex wrote an output outside allowed knowledge roots: $outputFile"
        }

        $outputPath = Join-Path $projectRoot $outputFile
        if (-not (Test-Path -LiteralPath $outputPath)) {
            throw "Knowledge output does not exist: $outputPath"
        }

        $markdown = [System.IO.File]::ReadAllText($outputPath).Replace("`r`n", "`n")
        [System.IO.File]::WriteAllText($outputPath, $markdown, (New-Object System.Text.UTF8Encoding($false)))
    }
}

Write-Host "Knowledge-base processing complete: $($pendingRecords.Count) record(s)."
Write-Host "Execution report: $lastMessagePath"
