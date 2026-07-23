import fs from "fs";

const today = new Date().toISOString().slice(0,10);


// 读取监测清单

const monitorFile =
"./content/AI情报中心/监测清单.md";


let tools = fs.readFileSync(
monitorFile,
"utf8"
);


// 提取工具名称

let lines = tools.split("\n");

let toolList=[];

for(let line of lines){

    if(
        line.includes("|") &&
        line.includes("是") &&
        !line.includes("工具名称")
    ){

        let name=line.split("|")[1].trim();

        if(name){
            toolList.push(name);
        }

    }

}

// 生成日报

let report =
`
---
title: ${today} 每日AI快报
type: daily-report
---

# 🚀 每日AI快报

## 📅 日期

${today}


---

# 🔍 今日监测工具


`;



toolList.forEach(
tool=>{
report +=
`
## ${tool}

- 更新情况：
- 新增功能：
- 商业价值：
- 是否影响电商运营：

`;
}
);



let path =
`./content/AI情报中心/每日AI快报/${today} 每日AI快报.md`;


fs.writeFileSync(
path,
report,
"utf8"
);


console.log(
"每日AI快报生成完成:",
today
);