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


// 输入：AI官方更新数据

const inputFile =
path.join(
    root,
    ".runtime",
    "ai-monitor",
    "official-updates.json"
);


// AI工具数据库

const databaseFile =
path.join(
    root,
    "automation",
    "ai-tools-database.json"
);


// 输出：新的分类目录

const outputDir =
path.join(
    root,
    "content",
    "AI-Center",
    "01_每日AI动态",
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



// 读取数据

const data =
fs.readFileSync(
    inputFile,
    "utf8"
);


const tools =
fs.readFileSync(
    databaseFile,
    "utf8"
);



// Prompt

const prompt = `

你是一名AI行业情报分析专家。

同时负责一家全域电商运营公司的AI战略研究。


请根据以下两个数据源生成中文Markdown日报。


【AI官方动态数据】

${data}


【AI工具数据库】

${tools}



要求：

1. 必须使用简体中文

2. 输出纯Markdown

3. 不输出解释

4. 不输出代码块

5. 内容适合企业AI知识库


格式：


# AI官方动态日报


## 今日重点更新


## 工具更新详情


每个工具包含：

- 公司
- 工具类别
- 最新变化
- 核心能力
- 适合岗位


## 电商运营价值


分析：

- 客服自动化
- 商品内容生产
- 数据分析
- 运营提效
- 营销素材生产


## 工具价值评分


|工具|行业价值|电商价值|推荐等级|
|-|-|-|-|


## 是否值得关注


## 行动建议


不要编造不存在的信息。

`;



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



// 创建目录

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



// 写入Markdown

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