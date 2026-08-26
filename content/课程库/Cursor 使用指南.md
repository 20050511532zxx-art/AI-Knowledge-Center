---
title: Cursor 使用指南
description: 
source: feishu-wiki-TBjowY6iUi5lIUkAzA6cV9yCnxe
enableToc: true
syncedAt: 2026-08-26T02:53:19.694Z
---


---

## 第一章：Cursor 下载与安装

## 1.1 官网下载地址

Cursor 是一款基于 VS Code 的 AI 驱动代码编辑器，专为现代开发者设计。

官方网站： https://www.cursor.com

下载页面： https://www.cursor.com/download


---

### Windows 安装步骤

1. 下载安装程序
1. 运行安装程序
1. 安装向导
1. 完成安装

---

### macOS 安装步骤

1. 下载安装程序
1. 挂载 DMG 文件

---

### Linux 安装方法

方法一：使用 Snap（推荐）

```text
sudo snap install cursor --classic
```

方法二：使用 AppImage

```text
# 下载并赋予执行权限
chmod +x cursor-x.x.x.AppImage
# 运行应用
./cursor-x.x.x.AppImage
```

方法三：使用包管理器（Debian/Ubuntu）

```text
# 添加官方仓库
curl https://packages.cursor.com/gpg.key | sudo apt-key add -
echo "deb https://packages.cursor.com/apt stable main" | sudo tee /etc/apt/sources.list.d/cursor.list

# 安装
sudo apt update
sudo apt install cursor
```


---

## 1.2 初始配置

### 主题设置

打开设置：Ctrl + ,（Windows/Linux）或 Cmd + ,（macOS）

推荐主题：

| 主题 | 特点 |
| --- | --- |
| Cursor Dark | 推荐，深色主题，护眼 |
| Cursor Light | 浅色主题 |
| One Dark Pro | 流行的深色主题 |
| Dracula | 高对比度主题 |


---

### 字体设置

| 设置项 | 推荐值 | 说明 |
| --- | --- | --- |
| Editor: Font Size | 14-16px | 代码字体大小 |
| Editor: Font Family | Fira Code, Consolas, monospace | 字体 |
| Editor: Font Ligatures | ✓ | 启用字体连字 |


---

### 基础配置推荐

| 设置项 | 推荐值 | 说明 |
| --- | --- | --- |
| Auto Save | afterDelay | 自动保存 |
| Auto Save Delay | 1000ms | 延迟保存 |
| Tab Size | 4 | 缩进宽度 |
| Insert Spaces | ✓ | 使用空格 |
| Minimap | ✓ | 显示缩略图 |


---

## 第二章：Cursor AI 功能详解

## 2.1 @ 符号的用法

Cursor 的 AI 功能通过 @ 符号来引用不同的上下文源。

### @Files - 引用特定文件

用途： 让 AI 查看并理解特定文件的内容

使用方法：

1. 在 AI 输入框中输入 @
1. 选择「Files」选项
1. 从弹出的文件列表中选择需要的文件
1. 可以选择多个文件
示例：

```text
@Files: UserService.java, UserRepository.java
请帮我重构这两个文件，提取公共逻辑到一个新的基类中
```


---

### @Codebase - 引用整个代码库

用途： 让 AI 理解整个项目的结构和上下文

使用方法：

1. 在 AI 输入框中输入 @
1. 选择「Codebase」选项
1. AI 会自动分析项目结构
工作原理：

- Cursor 会扫描项目中的所有文件
- 建立代码库的语义索引
- 根据问题找到最相关的代码片段
- 将这些片段作为上下文提供给 AI

---

### @Docs - 引用文档

用途： 让 AI 参考项目文档或外部文档

支持的文档格式：

- Markdown（.md）
- 文本文件（.txt）
- PDF
- 代码注释
示例：

```text
@Docs: API_DESIGN.md
根据 API 设计文档，帮我实现 UserController 中的 GET /users/{id} 端点
```


---

### @Web - 引用网络资源

用途： 让 AI 查询实时的网络信息

示例：

```text
@Web: Spring Boot 3.0 documentation
我想使用 Spring Boot 3.0 的新特性，请告诉我如何配置虚拟线程
```

适用场景：

- 查询最新的框架文档
- 搜索解决方案或最佳实践
- 获取实时的技术信息
- 查找 API 参考

---

## 2.2 AI 输入框使用方法

### 打开 AI 输入框

| 方法 | 快捷键 |
| --- | --- |
| Windows/Linux | Ctrl + K |
| macOS | Cmd + K |

### 输入框快捷键

| 快捷键 | 功能 |
| --- | --- |
| Ctrl + Enter | 发送提示 |
| Shift + Enter | 换行 |
| ↑ / ↓ | 浏览历史提示 |
| Escape | 关闭输入框 |

### 输入框高级功能

1. 上传文件或图片 — 点击输入框下方的「+」按钮
1. 引用当前文件 — 输入 # 自动引用
1. 引用选中代码 — 选中代码后打开 AI 输入框
1. 使用模板 — 点击输入框下方的「Templates」

---

## 2.3 如何让 AI 理解项目上下文

### 建立项目索引

1. 在 Cursor 中打开 Java 项目
1. 等待索引完成（大型项目需要 5-10 分钟）
1. 验证：输入 @Codebase 查看项目结构
### 创建 .cursorignore 文件

```text
# 构建输出
target/
build/
dist/
out/

# 依赖
node_modules/
.gradle/
.m2/

# IDE 文件
.idea/
.vscode/
*.swp
*.swo

# 日志
*.log
tmp/
temp/
```


---

## 2.4 常用 Prompt 技巧

### 明确的问题描述

好的例子：

```text
我需要创建一个 UserService 类，包含以下方法：
1. getUserById(Long id) - 根据 ID 获取用户
2. createUser(UserDTO dto) - 创建新用户
3. updateUser(Long id, UserDTO dto) - 更新用户
4. deleteUser(Long id) - 删除用户

请使用 Spring 框架，并遵循项目的编码规范。
```

### 指定输出格式

```text
请生成一个 UserController 类，包含以下端点：
- GET /api/users - 获取所有用户
- POST /api/users - 创建用户

输出格式：
1. 完整的 Java 代码
2. 必要的注解说明
3. 错误处理建议
```

### 逐步分解复杂任务

第一步： 理解需求

```text
@Codebase
我们的项目中有哪些现有的认证机制？
```

第二步： 获取建议

```text
@Files: SecurityConfig.java, AuthController.java
基于现有的认证机制，我想添加 OAuth2 支持。请给出实现步骤。
```


---

## 第三章：修改 AI 配置

## 3.1 打开 Cursor Settings

Cursor Settings 是 Cursor 特有的设置面板，用于配置 AI 相关选项，与普通的 VS Code Settings 不同。

| 方法 | 操作 |
| --- | --- |
| 快捷键 | Ctrl + Shift + J（Windows/Linux）或 Cmd + Shift + J（macOS） |
| 菜单 | 点击左下角齿轮图标 → Cursor Settings |
| 命令面板 | Ctrl + Shift + P → 输入 Cursor: Open Cursor Settings |
| 快捷入口 | 在 AI 聊天框中点击设置图标 ⚙️ |


---

### 进入 Models 配置页面

1. 打开 Cursor Settings（Ctrl + Shift + J）
1. 点击左侧菜单的 Models 选项
1. 在此页面可以：

---

## 3.2 System Prompt 自定义

### 什么是 System Prompt

System Prompt 是发送给 AI 模型的系统级指令，用于定义 AI 的行为、风格和能力。通过自定义 System Prompt，你可以让 AI 更好地适应你的开发风格和项目需求。

### 访问 System Prompt 设置

1. 打开 Cursor Settings（Ctrl + Shift + J）
1. 点击左侧菜单的 General → Rules for AI
1. 在此可以编写项目级别的 AI 行为规范

---

### System Prompt 示例

#### 示例 1：Java 开发专家

```text
{
  "cursor.systemPrompt": "你是一个资深的 Java 开发专家，拥有 15 年的企业级应用开发经验。\n\n你的职责是：\n1. 提供高质量的 Java 代码，遵循 Google Java 风格指南\n2. 优先使用 Spring Framework 和 Spring Boot\n3. 强调代码的可维护性、可扩展性和性能\n4. 提供详细的代码注释和文档\n5. 考虑安全性、并发性和错误处理"
}
```

#### 示例 2：快速编码助手

```text
{
  "cursor.systemPrompt": "你是一个快速高效的编码助手。\n\n你的目标是：\n1. 快速理解需求\n2. 提供简洁、可运行的代码\n3. 避免过度设计\n4. 优先考虑实用性\n\n在回答时：\n- 直接提供代码，最少化解释\n- 使用代码注释而不是长篇幅说明"
}
```

#### 示例 3：学习导师

```text
{
  "cursor.systemPrompt": "你是一个耐心的 Java 学习导师。\n\n你的目标是帮助开发者学习和成长。\n\n在回答时：\n1. 首先确保用户理解基本概念\n2. 提供循序渐进的解释\n3. 使用类比和现实世界的例子\n4. 鼓励用户思考和实验"
}
```


---

## 3.3 Temperature 和 Max Tokens 设置

### Temperature（温度参数）

用途： 控制 AI 输出的随机性和创造性

设置方法：

1. 打开 Cursor Settings（Ctrl + Shift + J）
1. 点击左侧菜单的 Models
1. 找到「Temperature」选项
1. 调整数值（0.0 - 2.0）
推荐值：

| 值范围 | 效果 | 适用场景 |
| --- | --- | --- |
| 0.0 - 0.3 | 确定性强，一致性高 | 代码补全、语法修正 |
| 0.4 - 0.7 | 平衡模式（推荐） | 常规编码、问题解答 |
| 0.8 - 1.2 | 创造性强 | 头脑风暴、设计探索 |

> 💡 提示： 对于 Java 代码编写，建议将 Temperature 设置在 0.3-0.5 之间，以获得更稳定、可预测的输出。


---

### Max Tokens（最大令牌数）

用途： 限制单次响应的最大长度

推荐值：

| 场景 | Max Tokens | 说明 |
| --- | --- | --- |
| 简单代码补全 | 500-1000 | 单个方法或函数 |
| 常规编码任务 | 2000-4000 | 完整类或模块 |
| 复杂重构任务 | 4000-8000 | 多个类或复杂逻辑 |
| 项目分析 | 8000-16000 | 大范围代码分析 |


---

## 3.4 自定义规则（Rules for AI）

### 什么是 Rules for AI

Rules for AI 是 Cursor 提供的一种项目级别的 AI 行为规范，可以为特定项目或文件类型设置专门的规则。

### 创建 .cursorrules 文件

在项目根目录创建 .cursorrules 文件：

```text
# .cursorrules 文件示例

## 语言
- 使用简体中文编写所有代码注释

## Java 编码规范
- 类名使用 PascalCase（如 UserService）
- 方法名和变量名使用 camelCase（如 getUserById）
- 常量使用 UPPER_SNAKE_CASE（如 MAX_RETRY_COUNT）

## Spring Boot 规范
- 控制器返回 Result<T> 统一格式
- 使用 @Valid 进行参数校验
- 使用 @Transactional 管理事务

## 代码风格
- 使用 4 个空格缩进
- 每行不超过 120 个字符
```


---

## 3.5 本地模型配置（Ollama）

### 为什么使用本地模型

- 隐私保护：代码不会上传到第三方服务器
- 离线可用：无需网络连接
- 成本为零：无需支付 API 调用费用
### Ollama 安装与配置

Windows 安装：

1. 访问 https://ollama.com/download
1. 下载 Windows 版本安装包
1. 运行安装程序
验证安装：

```text
ollama --version
```


---

### 下载模型

```text
# 下载 Code Llama（适合代码任务）
ollama pull codellama

# 下载 Llama 2（通用任务）
ollama pull llama2

# 下载 Mistral（平衡性能）
ollama pull mistral

# 查看已下载的模型
ollama list
```


---

### 在 Cursor 中配置 Ollama

1. 打开 Cursor Settings（Ctrl + Shift + J）
1. 点击左侧菜单的 Models
1. 点击「Add Model」或展开「OpenAI API Key」部分
1. 填写配置信息：
| 配置项 | 值 |
| --- | --- |
| Model Provider | Ollama |
| Model Name | codellama 或 llama2 |
| Base URL | http://localhost:11434 |


---

### Ollama 命令行常用操作

```text
# 启动 Ollama 服务
ollama serve

# 运行模型（交互模式）
ollama run codellama

# 创建自定义模型
ollama create my-java-model -f Modelfile

# 删除模型
ollama rm llama2
```


---

## 第四章：四大核心模式详解

## 4.1 四大核心模式概述

| 模式 | 触发方式 | 核心用途 | 适用场景 |
| --- | --- | --- | --- |
| Agent 模式 | Ctrl+K | 自主代码生成和修改 | 快速原型、代码生成 |
| Plan 模式 | Ctrl+Shift+K | 制定执行计划 | 复杂重构、大规模修改 |
| Debug 模式 | Ctrl+Shift+D | 问题诊断和修复 | Bug 修复、性能优化 |
| Ask 模式 | Ctrl+L | 提问和讨论 | 学习、讨论、代码审查 |


---

## 4.2 Agent 模式详解

### 触发方式

| 方法 | 快捷键 |
| --- | --- |
| Windows/Linux | Ctrl+K |
| macOS | Cmd+K |

### 核心用途

- 生成新代码：根据描述生成完整的代码块
- 修改现有代码：对选中的代码进行修改、优化或重构
- 跨文件操作：在多个文件之间进行协调修改
- 自动补全：基于上下文进行智能补全
### 使用示例

```text
创建一个 UserController，包含以下端点：
- GET /users - 获取所有用户
- GET /users/{id} - 获取指定用户
- POST /users - 创建新用户
- PUT /users/{id} - 更新用户
- DELETE /users/{id} - 删除用户

使用 Spring Boot 最佳实践，包含异常处理和日志记录。
```


---

## 4.3 Plan 模式详解

### 触发方式

| 方法 | 快捷键 |
| --- | --- |
| Windows/Linux | Ctrl+Shift+K |
| macOS | Cmd+Shift+K |

### 适用场景

- 大规模代码重构
- 系统架构调整
- 技术栈迁移（如从 JPA 迁移到 MyBatis）
- 新增功能模块
### 工作原理

```text
用户输入复杂需求
    ↓
Cursor 分析项目结构和代码
    ↓
AI 生成详细的执行计划（分步骤）
    ↓
显示计划预览供用户审核
    ↓
用户确认或修改计划
    ↓
按计划逐步执行修改
```


---

## 4.4 Debug 模式详解

### 触发方式

| 方法 | 快捷键 |
| --- | --- |
| Windows/Linux | Ctrl+Shift+D |
| macOS | Cmd+Shift+D |

### 适用场景

- 编译错误
- 运行时异常（NullPointerException 等）
- 逻辑错误
- 性能问题
### 使用示例

修复编译错误：

```text
问题分析：findById() 返回 Optional<User>，需要处理空值情况。

建议的修复方案：
public User getUserById(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException("用户不存在，ID: " + id));
}
```


---

## 4.5 Ask 模式详解

### 触发方式

| 方法 | 快捷键 |
| --- | --- |
| Windows/Linux | Ctrl+L |
| macOS | Cmd+L |

### 适用场景

- 学习新知识
- 代码讨论
- 技术选型
- 代码审查
### 使用示例

```text
问：Java 17 有哪些重要的新特性？请举例说明如何在项目中使用。

答：Java 17 引入了以下重要特性：

1. sealed Classes（密封类）
2. Pattern Matching for switch
3. Records
4. Text Blocks
```


---

## 4.6 四种模式对比与选用

### 核心区别对比表

| 维度 | Agent 模式 | Plan 模式 | Debug 模式 | Ask 模式 |
| --- | --- | --- | --- | --- |
| 交互方式 | 直接执行 | 先计划后执行 | 诊断+修复 | 仅讨论 |
| 代码修改 | 自动修改 | 分步确认修改 | 修复错误 | 不修改 |
| 用户控制 | 低 | 高 | 中 | 无 |
| 执行速度 | 快 | 中 | 快 | 即时 |

### 使用场景决策树

```text
开始
  ↓
是否需要修改代码？
  ├─ 否 → 使用 Ask 模式
  └─ 是 → 是否有 Bug 或错误？
           ├─ 是 → 使用 Debug 模式
           └─ 否 → 任务复杂度如何？
                    ├─ 简单/单文件 → 使用 Agent 模式
                    └─ 复杂/多文件 → 使用 Plan 模式
```


---

## 第五章：Cursor Settings 全面介绍


---

## 5.1General（通用）

| 项 | 说明 |
| --- | --- |
| Account | 登录、订阅；用量见 [dashboard/usage](https://cursor.com/dashboard/usage) |
| Privacy Mode | 开启后与提供商约定 ZDR；团队可由管理员强制。BYOK 不适用 Cursor 的 ZDR，遵循云厂商政策 |
| Import from VS Code | 迁移快捷键与用户设置（若向导可用） |
| Telemetry | 是否发送使用与诊断数据（以界面为准） |

## 5.2Agents（代理）

#### Overview（概览）

Agent 可独立完成复杂编码任务：搜索仓库、多文件编辑、运行终端、网页检索等。侧栏 Ctrl+I / Cmd+I。组成：指令（系统提示 + Rules） · Tools · Model。

#### Modes（模式）

| 模式 | 适用 | 改文件 |
| --- | --- | --- |
| Agent | 功能开发、重构、修 bug | 是 |
| Ask | 理解代码、架构 | 否 |
| Plan | 先审方案再动手 | 批准后 |
| Debug | 需运行时证据的问题 | 是 |

Shift+Tab 循环切换模式；切换可能开启新上下文。

#### Session Features（会话能力）

| 能力 | 说明 |
| --- | --- |
| Checkpoints | 大改前快照，时间线内 预览 / 恢复（本地，非 Git） |
| Queued messages | 忙碌时排队；Cmd/Ctrl+Enter 可插队 |
| Subagents | 并行探索仓库 / Shell / 浏览器，见 [Subagents](https://cursor.com/docs/subagents) |

#### Security & Auto-run（安全与自动运行）

默认：终端与 MCP 多需确认；改工作区文件通常直接落盘，配置文件可能仍要确认。勿用 Run Everything。详见 [Agent Security](https://cursor.com/docs/agent/security)。

| 维度 | 要点 |
| --- | --- |
| 默认行为 | 读 / 搜多免批；写文件多直接写入；终端与 MCP 默认确认 |
| Auto-run 梯度 | Ask every time → Sandbox auto-run（允许名单内）→ Run everything（不推荐） |
| permissions.json | ~/.cursor/permissions.json 中 mcpAllowlist / terminalAllowlist 可覆盖应用内；优先级：团队 Dashboard > 文件 > 应用内，见 [permissions](https://cursor.com/docs/reference/permissions) |

#### Chat & Composer related（对话与 Composer）

| 选项 | 说明 |
| --- | --- |
| Agent Stickiness | 新会话是否记住 普通 / Agent 模式 |
| Auto-Scroll to Bottom | 新消息是否滚到底 |
| Auto-Apply Outside Context | Composer 是否可改 上下文外 文件 |
| Pills / UI density | 输入区展示密度 |
| Iterate on Lints | 见下文 Beta 小节 |

#### Editor & Terminal related（编辑器与终端）

- Editor：Chat/Edit 提示、链接解析、Ctrl/Cmd+K、Inline Edit、Themed diffs
- Terminal：悬停提示、预览框；Agent 使用 Terminal: Select Default Profile
#### Cloud & Account — Dashboard（控制台摘要）

除 Cloud Agents 外，[Dashboard](https://cursor.com/dashboard) 含用量、团队规则、Privacy 策略、Spend alerts 等，见 [Account and billing](https://cursor.com/help)。

## 5.3Tab（行内补全）

| 小节 | 内容 |
| --- | --- |
| Behavior | 灰色幽灵文本 · Tab 采纳 · Esc 拒绝 · Ctrl/Cmd+→ 按词接受 |
| Advanced | 多行 / import / 跨文件 · Jump-in-file · 底部 portal |
| Settings | 侧栏 Tab 或 Features → Cursor Tab；状态栏 Snooze / 按扩展名关闭 |
| Scope | Rules 不作用于 Tab；Tab 用 内置补全模型（BYOK 不改变 Tab） |

## 5.4Models（模型）

#### Usage Pools（用量池）

| 池 | 说明 |
| --- | --- |
| Auto + Composer | Auto / Composer 等从该池扣减，适合日常 Agent |
| API | 显式选模型或 Premium routing，按 token 与 API 价扣减 |

#### Model Selection（模型选择）

- Auto · Composer 2 · Premium routing · Max Mode（消耗更高；个人套餐或有 API 加价）
- BYOK：Models 页填 Key → Verify → Save；Tab 仍用内置模型
## 5.5Cloud Agents（云端代理）

| 小节 | 要点 |
| --- | --- |
| 定位 | 云端基础设施上运行 · [cursor.com/agents](https://cursor.com/agents) · PR / CI 联动 |
| Dashboard | 默认模型 / 仓库 / 分支 · 网络策略 Allow all / Default+allowlist / Allowlist only · 安全与 Team follow-ups，见 [Settings](https://cursor.com/docs/cloud-agent/settings) |
| Capabilities | Computer use · Artifacts · MCP（云端推荐 HTTP） · CI autofix（@cursor autofix off/on），见 [Capabilities](https://cursor.com/docs/cloud-agent/capabilities) |
| Limitations | 无法访问企业内网防火墙后资源；内网用 本机 Agent |
| Plugins | CLI 无插件；云端 仅插件内 MCP |


---

## 5.6Plugins（插件）

> 说明
插件 = Rules · Skills · Agents · Commands · MCP · Hooks 的可分发包；IDE 可用，CLI 暂不支持。

| 主题 | 内容 |
| --- | --- |
| Manifest | .cursor-plugin/plugin.json（至少 name），[template](https://github.com/cursor/plugin-template) |
| 安装范围 | 用户级 / 项目级 |
| 本地调试 | ~/.cursor/plugins/local/<name> · Reload Window |
| Team Marketplaces | Dashboard → Plugins · Required / Optional · SCIM |

## 5.7Rules, Skills & Custom Instructions（规则、技能与自定义说明）

| 类型 | 说明 |
| --- | --- |
| User Rules | 全局；适用于 Agent / Chat；不适用于 Tab / Inline Edit |
| Project Rules | .cursor/rules/ · 优先级 Team > Project > User |
| 其他文件 | AGENTS.md · CLAUDE.md · 旧 .cursorrules（建议迁移） |
| Skills | .cursor/skills/ 等 · Agent Decides · /skill-name |

## 5.8Tools & MCP（工具与 MCP）

#### Built-in Agent Tools（内置工具）

| Tool | 说明 |
| --- | --- |
| Semantic search · Search files · Web · Fetch rules | 检索与规则 |
| Read / Edit files · Shell · Browser · Image · Ask | 读写、终端、浏览器、图片、澄清 |
| MCP Tools | 与上并列；默认多需确认，配合上文 Agents 中 auto-run / allowlist |

#### MCP 配置要点

- 文件：~/.cursor/mcp.json · 项目 .cursor/mcp.json
- 侧栏 Tools & MCP 内 逐服务器开关
- 调试：输出 → MCP Logs · OAuth 重定向：cursor://anysphere.cursor-mcp/oauth/callback
## 5.9Hooks（钩子）

| 项 | 说明 |
| --- | --- |
| 用途 | hooks.json 在 Agent / Tab 生命周期插入脚本（格式化、审计、拦截等） |
| 路径 | ~/.cursor/hooks.json · .cursor/hooks.json |
| 事件示例 | Agent：preToolUse · beforeShellExecution · afterFileEdit … · Tab：beforeTabFileRead … |
| 文档 | [Hooks](https://cursor.com/docs/hooks) |


---

## 5.10Indexing & Knowledge（索引与知识）

| 维度 | 说明 |
| --- | --- |
| 目的 | 分块与向量嵌入 · 语义搜索 · 约 每 5 分钟 同步 |
| 状态 | 状态栏进度；约 80% 后语义能力更稳（以版本为准） |
| 配置 | 默认索引新文件 · Ignore · Git graph · 与 Knowledge / 文档源 相关项 |
| 排除 | .gitignore · .cursorignore |
| 重索引 | 命令面板 Reindex 或本页 |
| 隐私 | 见 [Indexing 文档](https://cursor.com/docs/context/codebase-indexing) |

## 5.11Network（网络）

| 主题 | 要点 |
| --- | --- |
| 代理 / HTTP2 | 部分企业代理不支持双向流 → 自动 HTTP/1.1 SSE 回退 |
| SSL 检查 | 中间人解密易导致卡顿 → 对 Cursor 域名例外或满足流式透传 |
| 域名放行 | *.cursor.sh · *.cursor-cdn.com · *.cursorapi.com |
| Cloud vs 内网 | Cloud Agents 不可访问内网；内网用 本机 Agent |
| 详述 | [Network Configuration](https://cursor.com/docs/enterprise/network-configuration) |

## 5.12Beta（Beta 与实验功能）

- Iterate on Lints · 隐藏模型 · Instant Grep 等（见 Changelog）
- Beta 可能变更；大版本后在 Cursor Settings 复查开关

---

## 5.13Marketplace（应用市场）

| 项 | 说明 |
| --- | --- |
| 官方 | [cursor.com/marketplace](https://cursor.com/marketplace) · Git 分发 · 审核 · 开源 |
| 社区 | [cursor.directory](https://cursor.directory) |
| 安全 | [Marketplace security](https://cursor.com/help/security-and-privacy/marketplace-security) |
| 发布 / Deeplink | [publish](https://cursor.com/marketplace/publish) · [MCP install links](https://cursor.com/docs/mcp/install-links) |

## 5.14Docs（文档）

- Docs 页：管理 文档源，供 Chat / Agent 引用
- 项目内：AGENTS.md · CLAUDE.md · .cursor/rules/
- 帮助：[Customization / Context](https://cursor.com/help/customization/context)

---

## 第六章：主流大模型对比

## 6.1 模型对比总表

| 模型 | 开发者 | 上下文窗口 | 代码能力 | 生成速度 | Java 支持 |
| --- | --- | --- | --- | --- | --- |
| Claude 3.5 Sonnet | Anthropic | 200K | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Claude 3.7 Sonnet | Anthropic | 200K | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| GPT-4o | OpenAI | 128K | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| GPT-4o-mini | OpenAI | 128K | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Gemini 1.5 Pro | Google | 2M | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| DeepSeek V3 | 深度求索 | 128K | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |


---

## 6.2 各模型详细介绍

### Claude 3.5 / 3.7 Sonnet

开发者： Anthropic

核心优势：

- 代码质量最高
- 分析能力强
- 200K 上下文窗口
- Java/Spring Boot 优化
适用场景：

- 复杂的企业级 Java 项目
- 大规模代码重构
- Spring Boot 应用开发

---

### GPT-4o / GPT-4o-mini

开发者： OpenAI

核心优势：

- 多模态能力
- 响应速度快
- 生态完善
- API 稳定
适用场景：

- 快速代码补全
- 简单脚本生成
- 原型开发

---

## 第七章：Cursor 高级使用技巧

## 7.1 项目索引优化

1. 打开项目后等待索引进度完成
1. 对于大型项目（>10000 个文件），可能需要几分钟
1. 验证索引：输入 @Codebase 查看项目结构

---

## 7.2 .cursorignore 配置示例

```text
# 构建输出
target/
build/
dist/
out/

# 依赖目录
node_modules/
.gradle/
.m2/

# IDE 文件
.idea/
.vscode/

# 日志和临时文件
*.log
tmp/
temp/
```


---

## 7.3 项目指南编写（CURSOR_GUIDE.md）

```text
# 项目指南

## 项目概述
这是一个电商平台的后端服务，使用 Spring Boot 3.0 和 MySQL。

## 项目结构
- `src/main/java/com/example/ecommerce/` - 主要代码
  - `controller/` - REST 控制器
  - `service/` - 业务逻辑
  - `repository/` - 数据访问层
  - `entity/` - 数据模型

## 关键技术栈
- Spring Boot 3.0
- Spring Data JPA
- MySQL 8.0
- Lombok

## 编码规范
- 使用 4 个空格缩进
- 类名使用 PascalCase
- 方法名使用 camelCase
```


---

## 第八章：插件生态介绍

## 8.1 Java 相关插件

| 插件名称 | 功能 | 推荐指数 |
| --- | --- | --- |
| Extension Pack for Java | Java 语言支持 | ⭐⭐⭐⭐⭐ |
| Maven for Java | Maven 支持 | ⭐⭐⭐⭐⭐ |
| Spring Boot Extension Pack | Spring Boot 支持 | ⭐⭐⭐⭐⭐ |
| Lombok Annotations Support | Lombok 注解支持 | ⭐⭐⭐⭐ |
| Test Runner for Java | 测试运行器 | ⭐⭐⭐⭐ |

## 8.2 效率提升插件

| 插件名称 | 功能 | 推荐指数 |
| --- | --- | --- |
| GitLens | Git 增强 | ⭐⭐⭐⭐⭐ |
| Error Lens | 错误提示增强 | ⭐⭐⭐⭐ |
| Auto Rename Tag | 自动重命名标签 | ⭐⭐⭐⭐ |
| Prettier | 代码格式化 | ⭐⭐⭐⭐ |


---

## 第九章：快捷键大全

## 9.1 Cursor 专属快捷键

| 功能 | Windows/Linux | macOS |
| --- | --- | --- |
| 打开 AI 助手 / Agent 模式 | Ctrl + K | Cmd + K |
| Ask 模式（侧边栏） | Ctrl + L | Cmd + L |
| Plan 模式 | Ctrl + Shift + K | Cmd + Shift + K |
| Debug 模式 | Ctrl + Shift + D | Cmd + Shift + D |
| 接受 AI 建议 | Tab | Tab |
| 拒绝 AI 建议 | Escape | Escape |

## 9.2 @ 符号引用

| 功能 | 用法 |
| --- | --- |
| 引用特定文件 | @Files |
| 引用整个代码库 | @Codebase |
| 引用文档 | @Docs |
| 引用网络资源 | @Web |

## 9.3 通用快捷键

| 功能 | Windows/Linux | macOS |
| --- | --- | --- |
| 命令面板 | Ctrl + Shift + P | Cmd + Shift + P |
| 打开设置 | Ctrl + , | Cmd + , |
| 打开终端 | Ctrl + ~ | Ctrl + ~ |
| 保存文件 | Ctrl + S | Cmd + S |
| 查找文件 | Ctrl + P | Cmd + P |
| 全局搜索 | Ctrl + Shift + F | Cmd + Shift + F |


---

## 常见问题解答

Q1: Cursor 和 VS Code 有什么区别？

A：Cursor 基于 VS Code，但增加了强大的 AI 功能，如 @ 符号引用、Agent 模式、Plan 模式等。


---

Q2: Cursor AI 是否免费？

A：Cursor 提供免费版（每月有限次数 AI 请求）和付费版（Pro $20/月，无限 AI 请求）。


---

Q3: 如何切换 AI 模型？

A：Settings → Models → 选择默认模型。推荐 Java 开发使用 Claude 3.5 Sonnet。


---

Q4: @Codebase 消耗 token 吗？

A：是的，但 Cursor 会尽量复用上下文。可以通过 .cursorignore 排除无关文件来减少消耗。


---

Q5: Cursor 支持哪些编程语言？

A：Cursor 支持所有主流编程语言，包括 Java、Python、JavaScript、TypeScript、C++ 等。


---

> 祝你开发愉快！ 🚀
