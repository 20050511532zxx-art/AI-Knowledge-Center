$source = "D:\obsidian\仓库\AI工具数据库"

$target = "D:\obsidian\仓库\quartz-site\content"

Write-Host "Syncing Obsidian..."

robocopy $source $target /E /XO

Write-Host "Sync finished."

pause
