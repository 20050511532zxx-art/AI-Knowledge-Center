param(
    [switch]$DryRun,
    [string]$CodexCommand
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$syncStatePath = Join-Path $projectRoot '.runtime\feishu\sync-state.json'
$inboxPath = Join-Path $projectRoot '.runtime\feishu\inbox'
$codexRuntimePath = Join-Path $projectRoot '.runtime\codex'
$processedStatePath = Join-Path $codexRuntimePath 'processed-state.json'
$analysisConfigPath = Join-Path $projectRoot 'config\codex-analysis.json'

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

$analysisConfig = Read-JsonFile -Path $analysisConfigPath
$promptPath = Join-Path $projectRoot $analysisConfig.promptPath
$outputRoot = Join-Path $projectRoot $analysisConfig.outputRoot

if (-not (Test-Path -LiteralPath $promptPath)) {
    throw "Analysis prompt does not exist: $promptPath"
}

if (-not (Test-Path -LiteralPath $inboxPath)) {
    throw 'Feishu inbox does not exist. Run npm run feishu:pull first.'
}

$syncState = Read-JsonFile -Path $syncStatePath
$processedState = Read-JsonFile -Path $processedStatePath -Fallback ([pscustomobject]@{
        schemaVersion = 1
        lastRunAt = $null
        records = [pscustomobject]@{}
    })
$pendingRecords = @()

foreach ($property in $syncState.records.PSObject.Properties) {
    $recordId = $property.Name
    $syncRecord = $property.Value
    $processedRecord = Get-RecordState -Records $processedState.records -RecordId $recordId
    $recordPath = Join-Path $inboxPath $syncRecord.file

    if (-not (Test-Path -LiteralPath $recordPath)) {
        throw "Inbox file referenced by sync state does not exist: $recordPath"
    }

    if (($null -eq $processedRecord) -or ($processedRecord.contentHash -ne $syncRecord.contentHash)) {
        $pendingRecords += [pscustomobject]@{
            recordId = $recordId
            contentHash = $syncRecord.contentHash
            modifiedTime = $syncRecord.modifiedTime
            inputFile = $recordPath
        }
    }
}

Write-Host "Pending records: $($pendingRecords.Count)."

if ($pendingRecords.Count -eq 0) {
    Write-Host 'No new or changed submissions. Codex will not run.'
    exit 0
}

if ($DryRun) {
    $pendingRecords | Select-Object recordId, contentHash, modifiedTime, inputFile | Format-Table -AutoSize
    Write-Host 'Dry-run complete. Codex was not called and no analysis files were written.'
    exit 0
}

$resolvedCodexCommand = Resolve-CodexCommand -RequestedCommand $CodexCommand
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$today = Get-Date -Format 'yyyy-MM-dd'
$month = Get-Date -Format 'yyyy-MM'
$logPath = Join-Path $codexRuntimePath "logs\$timestamp-codex-analysis.log"
$lastMessagePath = Join-Path $codexRuntimePath "reports\$timestamp-last-message.txt"
New-Item -ItemType Directory -Force -Path (Split-Path $logPath), (Split-Path $lastMessagePath), $outputRoot | Out-Null

$recordLines = $pendingRecords | ForEach-Object {
    "- recordId: $($_.recordId)`n  contentHash: $($_.contentHash)`n  modifiedTime: $($_.modifiedTime)`n  inputFile: $($_.inputFile)"
}
$basePrompt = [System.IO.File]::ReadAllText($promptPath)
$runtimePrompt = @"

## Runtime information

- Current date: $today
- Current month: $month
- Project root: $projectRoot
- Analysis output directory: $outputRoot
- Processed state file: $processedStatePath
- Process only these records:

$($recordLines -join [Environment]::NewLine)

Create the files and update the state directly. Do not return only suggestions or examples. Verify that every Markdown contains all eight required sections.
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

Write-Host 'Running Codex submission analysis.'
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

$newProcessedState = Read-JsonFile -Path $processedStatePath
foreach ($pendingRecord in $pendingRecords) {
    $result = Get-RecordState -Records $newProcessedState.records -RecordId $pendingRecord.recordId
    if ($null -eq $result) {
        throw "Codex did not write record state: $($pendingRecord.recordId)"
    }

    if (($result.status -ne 'completed') -or ($result.contentHash -ne $pendingRecord.contentHash)) {
        throw "Codex state is incomplete or content hash does not match: $($pendingRecord.recordId)"
    }

    $outputPath = Join-Path $projectRoot $result.outputFile
    if (-not (Test-Path -LiteralPath $outputPath)) {
        throw "Markdown referenced by Codex state does not exist: $outputPath"
    }

    $markdown = [System.IO.File]::ReadAllText($outputPath).Replace("`r`n", "`n")
    [System.IO.File]::WriteAllText($outputPath, $markdown, (New-Object System.Text.UTF8Encoding($false)))
}

Write-Host "Codex analysis complete: $($pendingRecords.Count) record(s)."
Write-Host "Execution report: $lastMessagePath"
