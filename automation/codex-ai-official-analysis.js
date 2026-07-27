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


const updateFile =
path.join(
    root,
    ".runtime",
    "ai-monitor",
    "official-updates.json"
);



const databaseFile =
path.join(
    root,
    "automation",
    "ai-tools-database.json"
);



// ================================
// 输出目录
// ================================


const outputDir =
path.join(
    root,
    "content",
    "AI-Center",
    "Official-Updates"
);



const date =
new Date()
.toISOString()
.slice(0,10);



const outputFile =
path.join(
    outputDir,
    `${date} AI-Official-Update.md`
);



console.log(
    "START: Codex AI official analysis"
);



// ================================
// 读取数据
// ================================


const updates =
fs.readFileSync(
    updateFile,
    "utf8"
);



const tools =
fs.readFileSync(
    databaseFile,
    "utf8"
);



// ================================
// 构建Prompt
// ================================


const prompt = `

你是一名AI行业情报分析专家，
同时负责一家全域电商运营公司的AI战略研究。


请根据以下两个数据源生成中文Markdown日报。


【数据源1：AI官方最新动态】

${updates}



【数据源2：AI工具数据库】

${tools}



生成要求：

1. 必须使用简体中文

2. 输出纯Markdown

3. 不输出解释

4. 不输出代码块

5. 内容适合企业内部AI知识库

6. 必须结合电商运营场景分析



输出格式：


# AI官方动态日报


## 今日重点更新

说明今天最重要的AI变化。


## 工具更新详情

每个工具包含：

### 工具名称

- 公司：
- 工具类别：
- 最新变化：
- 核心能力：
- 适合岗位：


## 电商运营价值

从以下方向分析：

- 商品内容生产
- 客服自动化
- 数据分析
- 运营提效
- 营销素材生产
- AI Agent应用


## 工具价值评分

格式：

|工具|行业价值|电商价值|推荐等级|
|-|-|-|-|


## 是否值得关注

分：

- S级重点关注
- A级建议测试
- B级持续观察


## 行动建议

给出具体可执行建议。



注意：

不要编造不存在的更新。

如果官方没有明确更新，
请说明暂无确认信息。


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
    "codex-prompt.txt"
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
// 保存Markdown
// ================================


if(
!fs.existsSync(outputDir)
){

fs.mkdirSync(
    outputDir,
    {
        recursive:true
    }
);

}



fs.writeFileSync(
    outputFile,
    result,
    {
        encoding:"utf8"
    }
);



console.log(
"Codex analysis completed"
);


console.log(
outputFile
);