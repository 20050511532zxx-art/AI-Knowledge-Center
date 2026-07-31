import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

import {
    renderFeishuBlocks
} from "./feishu_renderer.js";


dotenv.config({
    path: ".feishu.env"
});



// =====================================
// 飞书配置
// =====================================

const APP_ID =
process.env.FEISHU_APP_ID;


const APP_SECRET =
process.env.FEISHU_APP_SECRET;



// =====================================
// 同步配置
// =====================================

const CONTENT_DIR =
"./content/AI案例库";


const ASSET_DIR =
"./content/AI案例库";



// =====================================
// 案例列表
// =====================================

const CASE_LIST = [

    {
        name:"客服+AI数字化解决案例",
        department:"客服部",
        wiki_token:"Mnxjwiw1picy1Uk22QVcQGWAnbf"
    },

];




// =====================================
// 工具函数
// =====================================


function ensureDir(dir){

    if(
        !fs.existsSync(dir)
    ){

        fs.mkdirSync(
            dir,
            {
                recursive:true
            }
        );

    }

}





// =====================================
// 获取飞书token
// =====================================


async function getTenantToken(){

    const res =
    await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
            app_id:APP_ID,
            app_secret:APP_SECRET
        }
    );


    return res.data.tenant_access_token;

}





// =====================================
// Wiki转换Docx
// =====================================


async function getRealDocumentId(
    wikiToken,
    token
){

    const url =
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${wikiToken}`;


    const res =
    await axios.get(
        url,
        {
            headers:{
                Authorization:
                `Bearer ${token}`
            }
        }
    );


    const node =
    res.data.data.node;


    console.log(
        "解析:",
        node.title
    );


    return node.obj_token;

}





// =====================================
// 获取文档blocks
// =====================================

async function getDocumentBlocks(
    documentId,
    token
){

    let blocks = [];

    let pageToken = "";



    while(true){

        let url =
        `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500`;



        if(pageToken){

            url +=
            `&page_token=${pageToken}`;

        }



        const res =
        await axios.get(
            url,
            {
                headers:{
                    Authorization:
                    `Bearer ${token}`
                }
            }
        );



        const data =
        res.data.data;



        blocks.push(
            ...(data.items || [])
        );



        if(
            !data.has_more
        ){

            break;

        }



        pageToken =
        data.page_token;


    }


    return blocks;

}





// =====================================
// 下载图片
// =====================================

async function downloadImage(
    imageToken,
    savePath,
    token
){

    ensureDir(
        path.dirname(savePath)
    );


    const url =
    `https://open.feishu.cn/open-apis/drive/v1/medias/${imageToken}/download`;



    const res =
    await axios.get(
        url,
        {
            headers:{
                Authorization:
                `Bearer ${token}`
            },
            responseType:"arraybuffer"
        }
    );


    fs.writeFileSync(
        savePath,
        res.data
    );

}

// =====================================
// 获取block文字
// =====================================

function getBlockText(
    block
){

    let text = "";


    for(
        const key of Object.keys(block)
    ){

        const item =
        block[key];


        if(
            item &&
            item.elements
        ){

            for(
                const element of item.elements
            ){

                if(
                    element.text_run
                ){

                    text +=
                    element.text_run.content;

                }

            }

        }

    }


    return text.trim();

}





// =====================================
// 标题等级
// =====================================

function getHeadingLevel(
    block
){

    const type =
    block.block_type;


    if(type === 3){

        return 1;

    }


    if(type === 4){

        return 2;

    }


    if(type === 5){

        return 3;

    }


    return 0;

}





// =====================================
// Block类型判断
// =====================================


function isImageBlock(block){

    return (
        block.block_type === 27 &&
        block.image
    );

}



function isTableBlock(block){

    return (
        block.block_type === 31
    );

}



function isColumnBlock(block){

    return (
        block.block_type === 24
    );

}





// =====================================
// 普通文字格式化
// =====================================

function formatText(text){

    if(!text){

        return "";

    }


    return text
    .replace(/\n+/g,"\n")
    .trim();

}





// =====================================
// 获取子block内容
// =====================================


function getChildrenText(
    parentId,
    blocks
){

    return blocks
    .filter(
        b =>
        b.parent_id === parentId
    )
    .map(
        b =>
        formatText(
            getBlockText(b)
        )
    )
    .filter(Boolean);

}


// =====================================
// 生成页面头信息
// =====================================

function createFrontMatter(
    item
){

    return `
---
title: ${item.name}
category: AI案例库
department: ${item.department}
source: 飞书知识库
---

`;

}





// =====================================
// 同步单个案例
// =====================================

async function syncCase(
    item,
    token
){

    console.log(
        "\n正在同步:",
        item.name
    );



    const documentId =
    await getRealDocumentId(
        item.wiki_token,
        token
    );



    const blocks =
    await getDocumentBlocks(
        documentId,
        token
    );

fs.writeFileSync(
    "blocks.json",
    JSON.stringify(
        blocks,
        null,
        2
    ),
    "utf8"
);

    console.log(
        "blocks:",
        blocks.length
    );



    const saveDir =
    path.join(
        CONTENT_DIR,
        item.department
    );



    const assetDir =
    path.join(
        ASSET_DIR,
        item.department,
        item.name
    );



    ensureDir(saveDir);

    ensureDir(assetDir);




    const imageMap = {};




    // =========================
    // 下载图片
    // =========================


    for(
        const block of blocks
    ){


        if(
            isImageBlock(block)
        ){


            const imageToken =
            block.image.token;



            const imageName =
            `${imageToken}.png`;



            const savePath =
            path.join(
                assetDir,
                imageName
            );



            try{


                await downloadImage(
                    imageToken,
                    savePath,
                    token
                );



                imageMap[imageToken] =
                `/AI案例库/${item.department}/${item.name}/${imageName}`;



            }
            catch(e){


                console.log(
                    "图片下载失败:",
                    imageToken
                );


            }


        }


    }





    const markdown =
createFrontMatter(item)
+
renderFeishuBlocks(
    blocks,
    imageMap
);




    fs.writeFileSync(
        path.join(
            saveDir,
            `${item.name}.md`
        ),
        markdown,
        "utf8"
    );



    console.log(
        "完成:",
        item.name
    );

}





// =====================================
// 主程序
// =====================================


async function main(){


    console.log(
        "开始同步AI案例库..."
    );



    const token =
    await getTenantToken();



    console.log(
        "token成功"
    );




    for(
        const item of CASE_LIST
    ){

        try{


            await syncCase(
                item,
                token
            );


        }
        catch(error){


            console.log(
                "同步失败:",
                item.name
            );


            console.log(
                error.message
            );


        }


    }



    console.log(
        "\n全部同步完成"
    );


}



main();