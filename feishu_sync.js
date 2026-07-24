import * as lark from "@larksuiteoapi/node-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";


// 加载环境变量

dotenv.config();


// ============================
// 飞书配置
// ============================

const APP_ID = process.env.FEISHU_APP_ID;

const APP_SECRET = process.env.FEISHU_APP_SECRET;

const APP_TOKEN = process.env.FEISHU_APP_TOKEN;

const TABLE_ID = process.env.FEISHU_TABLE_ID;



// 检查配置

if (
  !APP_ID ||
  !APP_SECRET ||
  !APP_TOKEN ||
  !TABLE_ID
) {

  console.error(
    "飞书配置缺失，请检查 .env 文件"
  );

  process.exit(1);

}



// 创建飞书客户端

const client = new lark.Client({

  appId: APP_ID,

  appSecret: APP_SECRET,

});




// ============================
// 输出路径
// ============================


const outputDir =
"./content/AI情报中心/工具更新日志";


const outputFile =
`${outputDir}/飞书提交数据.md`;




// 创建目录

if(!fs.existsSync(outputDir)){

  fs.mkdirSync(
    outputDir,
    {
      recursive:true
    }
  );

}




// ============================
// 获取飞书数据
// ============================


async function getRecords(){


try{


const res =
await client.bitable.appTableRecord.list({

  path:{

    app_token: APP_TOKEN,

    table_id: TABLE_ID

  }

});



console.log(
"飞书读取成功"
);



const records =
res.data.items || [];




// Markdown生成

let markdown = `---
title: 飞书AI工具提交记录
type: ai-record
---


# 飞书AI工具提交记录


更新时间：

${new Date().toLocaleString()}


---


`;




records.forEach(
(item,index)=>{


const fields =
item.fields || {};



markdown += `

## ${index+1}. ${fields["AI工具名称"] || "未命名工具"}


- 情报标题：

${fields["情报标题"] || ""}


- 情报类型：

${fields["情报类型"] || ""}


- 推荐应用部门：

${fields["推荐应用部门"] || ""}


- 提交人：

${fields["提交人"] || ""}


- 更新内容：

${fields["更新内容"] || ""}


- 来源链接：

${fields["来源链接"] || ""}


---

`;



});





fs.writeFileSync(

 outputFile,

 markdown,

 "utf8"

);



console.log(
"Obsidian日报生成成功"
);



}

catch(error){


console.log(
"飞书读取失败"
);


console.log(error);


}


}



getRecords();