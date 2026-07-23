import fs from "fs";
import axios from "axios";
import Parser from "rss-parser";


// ===============================
// 读取AI工具数据库
// ===============================

const toolConfig = JSON.parse(
    fs.readFileSync(
        "./ai_tools_config.json",
        "utf8"
    )
);


// RSS解析器

const parser = new Parser();


// 数据源

const sourceFile = "./ai_sources.json";

const sources = JSON.parse(
    fs.readFileSync(
        sourceFile,
        "utf8"
    )
);



// ===============================
// 工具匹配
// ===============================


function getToolInfo(name){

    let tool =
    toolConfig.tools.find(
        item =>
        item.name
        .toLowerCase()
        ===
        name.toLowerCase()
    );


    if(tool){

        return tool;

    }


    return {

        category:[
            "AI工具"
        ],

        business:[
            "效率提升"
        ],

        department:[
            "运营团队"
        ],

        level:3

    };

}



// ===============================
// 主报告
// ===============================


let report = `---
title: AI工具自动分析报告
type: ai-monitor
---

# 🔎 AI工具更新检测

日期：

${new Date()
.toISOString()
.slice(0,10)}

---

`;



// ===============================
// 抓取RSS
// ===============================


for(
    let tool of sources.tools
){


    let info =
    getToolInfo(tool.name);



    report += `

## ${tool.name}


公司：

${tool.company}


`;



    try{


        let feed =
        await parser.parseURL(
            tool.sources[0]
        );



        let items =
        feed.items.slice(0,3);



        if(items.length===0){


            report += `

暂无更新

`;

            continue;

        }



        report += `

最新信息：

`;



        items.forEach(
            item=>{


                report += `

### ${item.title}


发布时间：

${item.pubDate || "未知"}


链接：

${item.link}


摘要：

${item.contentSnippet || item.content || "无"}

`;

            }

        );




        // ==========================
        // 自动分析
        // ==========================


        report += `

---

# 📌 AI运营分析


## 影响领域


${info.category
.map(
x=>"- "+x
)
.join("\n")}



## 企业价值


适用场景：


${info.business
.map(
x=>"- "+x
)
.join("\n")}



该工具更新可能帮助企业优化相关流程，提高运营效率。


## 推荐部门


${info.department
.map(
x=>"- "+x
)
.join("\n")}



## 关注等级


${"⭐".repeat(info.level || 3)}



`;



    }

    catch(error){


        report += `

获取失败：

${error.message}


`;

    }



}




// ===============================
// 保存结果
// ===============================


fs.writeFileSync(

"./content/AI情报中心/工具更新记录/自动检测结果.md",

report,

"utf8"

);



console.log(
"AI工具监测完成"
);