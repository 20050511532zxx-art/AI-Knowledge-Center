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



const inputFile =
path.join(
root,
".runtime",
"ai-monitor",
"new-ai-tools.json"
);



const outputDir =
path.join(
root,
"content",
"AI-Center",
"02_AI工具发现",
"新AI工具发现"
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



const data =
fs.readFileSync(
inputFile,
"utf8"
);



const prompt = `

你是一名AI工具评估专家。

请根据下面的新AI工具发现数据，
生成适合全域电商运营公司的中文Markdown分析报告。


要求：

1. 必须使用简体中文
2. 输出纯Markdown
3. 不输出解释
4. 不输出代码块


格式：


# 新AI工具评估报告


## 今日发现的新工具


## 工具能力分析


## 电商业务适用场景


## 是否建议测试


## 推荐等级


## 后续行动建议



数据：

${data}


`;



const promptFile =
path.join(
process.env.TEMP,
"codex-new-tool-prompt.txt"
);



fs.writeFileSync(
promptFile,
prompt,
"utf8"
);



console.log(
"Calling Codex..."
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
"Codex new AI tool assessment completed"
);


console.log(
outputFile
);