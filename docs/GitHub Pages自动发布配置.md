# GitHub Pages自动发布配置

## 发布流程

本地发布流程：

```text
Quartz本地构建验证
→ Git白名单暂存
→ Git提交
→ 推送origin/main
→ GitHub Actions重新构建Quartz
→ GitHub Pages部署
```

## 本地测试

只构建并显示将要发布的文件，不执行暂存、提交或推送：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\publish-to-github.ps1 -DryRun
```

正式提交并推送：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\publish-to-github.ps1
```

只创建本地提交，不推送：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\publish-to-github.ps1 -SkipPush
```

如果统一每日流水线已经完成 Quartz 构建，可使用：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File automation\publish-to-github.ps1 -SkipBuild
```

## GitHub仓库参数

- 仓库：`20050511532zxx-art/AI-Knowledge-Center`
- 发布分支：`main`
- Pages Source：`GitHub Actions`
- Pages Environment：`github-pages`
- 站点基址：`20050511532zxx-art.github.io/AI-Knowledge-Center`
- 工作流：`.github/workflows/deploy-pages.yml`

当前 Pages 工作流不需要额外 Token Secret，使用 GitHub 自动提供的 `GITHUB_TOKEN`、Pages权限和OIDC身份令牌。

## GitHub人工配置

1. 打开仓库 `Settings`。
2. 进入 `Pages`。
3. 在 `Build and deployment` 中将 Source 设置为 `GitHub Actions`。
4. 进入 `Actions > General`，确认仓库允许 GitHub Actions 运行。
5. 确认默认分支为 `main`。
6. 首次推送后进入 `Actions`，检查 `Deploy Quartz to GitHub Pages` 工作流。
7. 部署成功后访问仓库 Pages 地址。

## 本机Git要求

- 已配置 `origin` 远程仓库。
- 当前分支为 `main`。
- 已配置 Git 用户名和邮箱。
- Windows Credential Manager 或其他凭据方式能够无交互执行 `git push origin main`。
- Git暂存区在发布前必须为空。

发布脚本不会提交 `.env`、`.runtime`、`public`、`feishu_sync.js`、测试脚本或旧的 OpenAI API 实验脚本。
