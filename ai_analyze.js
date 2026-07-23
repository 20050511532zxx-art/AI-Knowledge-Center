import fs from "fs";


// 输入文件

const input =
"./content/AI情报中心/工具更新记录/自动检测结果.md";


// 输出文件

const output =
"./content/AI情报中心/工具更新记录/AI分析日报.md";



// 读取检测结果

let content =
fs.readFileSync(
input,
"utf8"
);



// 关键词判断

const keywords = [

"update",
"release",
"launch",
"model",
"API",
"feature",
"agent",
"AI",
"upgrade"

];



let score = 0;


keywords.forEach(
word=>{

if(
content.toLowerCase()
.includes(
word.toLowerCase()
)

){

score++;

}

}

);




// 生成报告


let report = `---
title: AI工具分析日报
type: ai-analysis
---

# 🧠 AI工具分析日报


日期：

${new Date()
.toISOString()
.slice(0,10)}


---

# 原始更新


${content}



---

# AI运营判断



## 更新价值评分


${score}/10



## 是否值得关注


${
score>=3
?
"⭐⭐⭐⭐ 高关注"
:
"⭐⭐ 一般关注"
}



## 适用场景


- 客服自动化

- 内容生产

- 数据分析

- 运营提效

- 企业AI应用



## 推荐动作


- 查看官方更新

- 测试新功能

- 判断内部应用价值



`;



fs.writeFileSync(
output,
report,
"utf8"
);



console.log(
"AI分析日报生成完成"
);