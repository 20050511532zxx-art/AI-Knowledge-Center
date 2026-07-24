import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import { ProxyAgent, setGlobalDispatcher } from "undici";


dotenv.config();


// 设置 Clash代理

const proxyAgent = new ProxyAgent(
    "http://127.0.0.1:7897"
);


setGlobalDispatcher(proxyAgent);



// OpenAI客户端

const client = new OpenAI({

    apiKey: process.env.OPENAI_API_KEY,

    timeout:120000

});




// 输入

const input =
"./content/AI情报中心/工具更新记录/自动检测结果.md";



// 输出

const output =
"./content/AI情报中心/工具更新记录/AI分析日报.md";




//读取内容

let content = fs.readFileSync(
    input,
    "utf8"
);


// 测试限制长度

content = content.slice(0,1500);





async function analyze(){


try{


console.log(
"正在请求GPT分析..."
);



const completion =
await client.chat.completions.create({


model:"gpt-4o-mini",


messages:[


{
role:"system",

content:
`
你是一名跨境电商企业AI应用负责人。

分析以下AI工具更新信息。

输出：

# AI工具名称

# 更新内容总结

# 更新价值评分（1-10）

# 对跨境电商影响

# 推荐应用部门

# 可落地业务场景

# 建议动作


要求：
结合跨境电商实际业务。
`
},


{
role:"user",

content:content

}


]


});



const result =
completion.choices[0].message.content;



const report =
`
---
title: AI工具分析日报
type: ai-analysis
date:${new Date().toISOString().slice(0,10)}
---


# 🧠 AI工具分析日报


${result}


---

# 原始更新记录


${content}

`;



fs.writeFileSync(

output,

report,

"utf8"

);



console.log(
"AI分析日报生成完成"
);



}

catch(error){


console.log(
"AI分析失败"
);


console.log(error);


}


}



analyze();