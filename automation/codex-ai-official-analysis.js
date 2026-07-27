import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const root = path.resolve(__dirname,"..");


const inputFile =
path.join(
root,
".runtime",
"ai-monitor",
"official-updates.json"
);


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



const data =
fs.readFileSync(
inputFile,
"utf8"
);



const prompt = `

你是一名AI行业情报分析专家。

根据下面数据生成中文Markdown日报。

要求：

1. 必须使用简体中文
2. 输出纯Markdown
3. 不输出解释
4. 不输出代码块
5. 适合电商运营公司AI知识库


格式：

# AI官方动态日报

## 今日重点更新

## 工具更新详情

## 电商运营价值

## 是否值得关注

## 行动建议


数据：

${data}


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
maxBuffer:1024*1024*20,
shell:"cmd.exe"
}
);



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