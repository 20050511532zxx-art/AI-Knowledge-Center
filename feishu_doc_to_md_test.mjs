import "dotenv/config";
import axios from "axios";
import fs from "fs";


const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;


// 当前案例文档ID
const DOCUMENT_ID = "Dl5VdaDrvoKSp1xGD7ocWtbvn5g";

// 获取token
async function getToken(){

    const res = await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
            app_id: APP_ID,
            app_secret: APP_SECRET
        }
    );

    return res.data.tenant_access_token;

}



// 获取blocks
async function getBlocks(token){

    const url =
    `https://open.feishu.cn/open-apis/docx/v1/documents/${DOCUMENT_ID}/blocks`;


    const res = await axios.get(url,{
        headers:{
            Authorization:`Bearer ${token}`
        },
        params:{
            page_size:500
        }
    });


    return res.data.data.items;

}



// 解析文字
function parseBlocks(blocks){

    let md = "";


    for(const block of blocks){


        if(block.block_type === 2 && block.heading1){

            md += `# ${block.heading1.elements[0]?.text_run?.content || ""}\n\n`;

        }


        if(block.text_run){

            md += block.text_run.content + "\n";

        }


        if(block.block_type === 12){

            md += "\n";

        }


    }


    return md;

}




async function main(){


console.log("开始同步飞书");


const token = await getToken();

console.log("✅ token成功");


const blocks = await getBlocks(token);


console.log(
"block数量:",
blocks.length
);


const markdown = parseBlocks(blocks);



console.log("================");
console.log(markdown);
console.log("================");



fs.writeFileSync(
"./content/AI案例测试.md",
`
---
title: AI案例测试
---

${markdown}
`,
"utf8"
);


console.log(
"✅ Markdown生成完成"
);



}



main();