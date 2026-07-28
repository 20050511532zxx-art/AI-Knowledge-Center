import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config({
    path: ".feishu.env"
});


const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;


// Obsidian路径
const OBSIDIAN_PATH =
"D:\\obsidian\\仓库\\AI工具数据库\\AI案例库";


// 飞书文档token
const DOCUMENT_ID =
"Mnxjwiw1picy1Uk22QVcQGWAnbf";


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

    const res = await axios.get(
        `https://open.feishu.cn/open-apis/docx/v1/documents/${DOCUMENT_ID}/blocks`,
        {
            headers:{
                Authorization:`Bearer ${token}`
            },
            params:{
                page_size:500
            }
        }
    );

    return res.data.data.items;
}


// 转markdown
function blocksToMarkdown(blocks){

    let md="";

    for(const block of blocks){

        if(
            block.block_type===2 &&
            block.text?.elements
        ){

            let text="";

            for(const e of block.text.elements){

                if(e.text_run){
                    text+=e.text_run.content;
                }

            }

            md+=text+"\n\n";
        }

    }

    return md;
}


// 保存
async function saveMarkdown(content){

    if(!fs.existsSync(OBSIDIAN_PATH)){
        fs.mkdirSync(
            OBSIDIAN_PATH,
            {
                recursive:true
            }
        );
    }


    const file=
    path.join(
        OBSIDIAN_PATH,
        "客服+AI数字化解决案例.md"
    );


    fs.writeFileSync(
        file,
        `# 客服+AI数字化解决案例\n\n${content}`,
        "utf8"
    );


    console.log(
        "✅ 已同步:",
        file
    );

}



async function main(){

    console.log("开始同步飞书");


    const token =
    await getToken();


    console.log("token成功");


    const blocks =
    await getBlocks(token);


    console.log(
        "读取blocks:",
        blocks.length
    );


    const md =
    blocksToMarkdown(blocks);


    await saveMarkdown(md);


}


main();