import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";


dotenv.config({
    path: ".feishu.env"
});


// =====================================
// 飞书应用配置
// =====================================

const APP_ID =
process.env.FEISHU_APP_ID;


const APP_SECRET =
process.env.FEISHU_APP_SECRET;



// =====================================
// 飞书案例链接配置
// =====================================

const CASE_LIST = [

    {
        name:"客服+AI数字化解决案例",
        department:"客服部",
        wiki_token:"Mnxjwiw1picy1Uk22QVcQGWAnbf"
    },


    {
        name:"财务+AI数字化解决案例",
        department:"财务部",
        wiki_token:"Uq78whyMCim8QGkC5ufc9mpKnQc"
    },


    {
        name:"职能+AI数字化解决案例",
        department:"职能部",
        wiki_token:"JNHaw82eZiJWLsk1MM8cqp4PnWd"
    },


    {
        name:"采购+AI数字化解决案例",
        department:"采购部",
        wiki_token:"ADpqw8kiOidhQgkHszEcVjOFnMf"
    },


    {
        name:"国内运营+AI数字化解决案例",
        department:"国内运营",
        wiki_token:"PvdCwMWshix1LikFGAEcg668nrc"
    },


    {
        name:"跨境运营+AI数字化解决案例",
        department:"跨境运营",
        wiki_token:"OpvQw2PGUiBSVmkM3LIcvObsnig"
    },


    {
        name:"仓储+AI数字化解决案例",
        department:"仓储部",
        wiki_token:"CUpHwHLLWilgzJkqA1mcy6lKnOf"
    }

];



// =====================================
// Quartz路径
// =====================================

const CONTENT_DIR =
"./content/AI案例库";


const ASSET_DIR =
"./content/AI案例库";




// =====================================
// 获取tenant_access_token
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
// Wiki Token转换真实docx token
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
        "解析文档:",
        node.title,
        node.obj_type
    );


    return node.obj_token;

}// =====================================
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
// 创建目录
// =====================================

function ensureDir(
    dir
){

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
// 下载飞书图片
// =====================================

async function downloadImage(
    imageToken,
    savePath,
    token
){

    const dir =
    path.dirname(savePath);


    ensureDir(dir);



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
// 处理文本
// =====================================

function getBlockText(
    block
){

    let text = "";


    const keys =
    Object.keys(block);



    for(
        const key of keys
    ){

        if(
            block[key]?.elements
        ){

            for(
                const el of block[key].elements
            ){

                if(
                    el.text_run
                ){

                    text +=
                    el.text_run.content;

                }

            }

        }

    }


    return text;

}// =====================================
// blocks转换Markdown
// =====================================

function blocksToMarkdown(
    blocks,
    imageMap
){

    let md = "";



    for(
        const block of blocks
    ){

        const text =
        getBlockText(block);



        if(text){

            md +=
            text + "\n\n";

        }



        if(
            block.block_type === 27 &&
            block.image
        ){

            const imageToken =
            block.image.token;



            if(
                imageMap[imageToken]
            ){

                md +=
                `![](${imageMap[imageToken]})\n\n`;

            }

        }


    }


    return md;

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


    console.log(
        "docx:",
        documentId
    );



    const blocks =
    await getDocumentBlocks(
        documentId,
        token
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



    let imageMap = {};



    for(
        const block of blocks
    ){

        if(
            block.block_type === 27 &&
            block.image
        ){

            const imageToken =
            block.image.token;



            const imageName =
            imageToken + ".png";



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
    blocksToMarkdown(
        blocks,
        imageMap
    );



    const frontMatter =
`---
title: ${item.name}
category: AI案例库
department: ${item.department}
source: 飞书知识库
---

`;



    fs.writeFileSync(
        path.join(
            saveDir,
            item.name + ".md"
        ),
        frontMatter + markdown,
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

        await syncCase(
            item,
            token
        );

    }



    console.log(
        "\n全部同步完成"
    );

}



main();