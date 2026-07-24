# Windows每日AI情报计划任务配置

## 用途

每天自动执行以下流程：

1. 读取飞书多维表数据。
2. 使用 Codex 分析新增或变化的投稿。
3. 使用 Codex 整理正式知识库。
4. 校验 Obsidian Markdown 内容。
5. 构建 Quartz 静态网站到 `public/`。

Quartz 构建由统一脚本直接调用仓库内 CLI 入口，使用单并发执行，并为 Node 配置 8GB 最大堆。该方式不依赖 `npx` 用户缓存，适合计划任务和受限运行环境。

系统计划任务尚未自动创建，需要完成脚本测试后手动配置。

## 手动测试

在 PowerShell 中进入项目目录：

```powershell
cd "D:\obsidian\仓库\quartz-site"
```

只检查流程，不调用 Codex 写文件，也不构建 Quartz：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\run-daily-pipeline.ps1 -DryRun
```

执行完整流程：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\run-daily-pipeline.ps1
```

完成GitHub Pages配置后，执行完整流程并自动提交、推送和触发Pages部署：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\run-daily-pipeline.ps1 -Publish
```

执行完整数据处理，但暂时跳过 Quartz 构建：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\run-daily-pipeline.ps1 -SkipQuartzBuild
```

日志保存在：

```text
.runtime/pipeline/logs/
```

## 计划任务建议

- 任务名称：`Obsidian-AI情报中心-每日流水线`
- 建议时间：每天 `09:00`
- 程序：`powershell.exe`
- 起始目录：`D:\obsidian\仓库\quartz-site`
- 使用已登录 Codex CLI 且能够访问飞书凭据的 Windows 用户运行。

启用GitHub Pages自动发布后的参数：

```text
-NoProfile -ExecutionPolicy Bypass -File "D:\obsidian\仓库\quartz-site\automation\run-daily-pipeline.ps1" -Publish
```

## 任务计划程序设置

在 Windows“任务计划程序”中选择“创建任务”，建议设置：

1. “常规”中选择当前安装并登录 Codex CLI 的用户。
2. “触发器”设置为每天 09:00。
3. “操作”中的程序填写 `powershell.exe`，参数使用上面的完整参数。
4. “条件”中按实际需要取消“只有在计算机使用交流电源时才启动”。
5. “设置”中启用“错过计划后尽快运行”。
6. 任务失败时每隔 15 分钟重新启动，最多 3 次。
7. 如果任务已在运行，选择“不启动新实例”。脚本本身也包含运行锁。
8. 建议将最长运行时间设置为 2 小时。

## 配置前检查

手动配置计划任务前，确认：

- `npm run feishu:pull` 能成功读取飞书。
- `automation/run-codex-analysis.ps1` 能调用 Codex。
- `automation/run-codex-knowledge-base.ps1` 能完成知识库整理。
- `npx quartz build` 能生成 `public/index.html`。
- `.env` 中的飞书凭据仅保存在本机且未提交 Git。
