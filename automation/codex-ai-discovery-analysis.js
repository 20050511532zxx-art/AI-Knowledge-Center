import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const root =
path.resolve(
    __dirname,
    ".."
);


// ================================
// 输入文件
// ================================

const discoveryFile =
path.join(
    root,
    ".runtime",
    "ai-monitor",
    "new-ai-tools.json"
);



const databaseFile =
path.join(
    root,
    "automation",
    "ai-tools-database.json"
);



// ================================
// 输出文件
// ================================

const outputDir =
path.join(
    root,
    "content",
    "AI-Center",
    "New-Tool-Discovery"
);



const date =
new Date()
.toISOString()
.slice(0,10);



const outputFile =
path.join(
    outputDir,
    `${date} New-AI-Tool-Assessment.md`
);



console.log(
    "START: Codex new AI tool assessment"
);



// ================================
// 读取数据
// ================================


const discoveries =
fs.readFileSync(
    discoveryFile,
    "utf8"
);



const database =
fs.readFileSync(
    databaseFile,
    "utf8"
);



// ================================
// 构建分析Prompt
// ================================


const prompt = `

你是一名AI行业研究专家，
同时负责一家全域电商运营公司的AI工具战略。


请分析下面发现的新AI工具。


数据1：
新发现AI工具：

${discoveries}



数据2：
已有AI工具数据库：

${database}



请生成中文Markdown报告。


要求：

1. 简体中文

2. 不输出代码块

3. 不编造不存在的信息

4. 对每个新工具进行判断


输出格式：


# 新AI工具发现评估


## 今日发现工具


### 工具名称


基本信息：
- 公司：
- 来源：
- 类别：


## 电商价值分析


分析：

- 商品内容生产
- 客服自动化
- 数据分析
- 运营效率
- 营销应用


## 综合评分


|工具|成熟度|电商价值|推荐等级|
|-|-|-|-|


## 是否加入AI工具数据库


分为：

- 推荐加入
- 持续观察
- 不建议加入


## 建议行动


给出下一步建议。


`;



// ================================
// 调用Codex
// ================================


console.log(
    "Calling Codex..."
);



const promptFile =
path.join(
    process.env.TEMP,
    "codex-discovery-prompt.txt"
);



fs.writeFileSync(
    promptFile,
    prompt,
    "utf8"
);



const result =
execSync(
`type "${promptFile}" | codex exec --model gpt-5.6`,
{
    encoding:"utf8",
    maxBuffer:1024*1024*30,
    shell:"cmd.exe"
}
);



// ================================
// 保存报告
// ================================


fs.mkdirSync(
    outputDir,
    {
        recursive:true
    }
);



fs.writeFileSync(
    outputFile,
    result,
    {
        encoding:"utf8"
    }
);



console.log(
"Codex new AI tool assessment completed"
);


console.log(
outputFile
);