import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { chromium } from "playwright";

dotenv.config({
    path: ".feishu.env"
});

import {
    renderFeishuBlocks
} from "./feishu_renderer.js";

import {
    takeFeishuScreenshot
} from "./feishu_long_screenshot.mjs";

// =====================================
// 飞书配置
// =====================================

const APP_ID =
process.env.FEISHU_APP_ID;


const APP_SECRET =
process.env.FEISHU_APP_SECRET;

console.log(
    "APP_ID:",
    APP_ID
);

console.log(
    "APP_SECRET长度:",
    APP_SECRET?.length
);



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
            app_id: APP_ID,
            app_secret: APP_SECRET
        }
    );


    const token =
    res.data.tenant_access_token;
console.log(
    "飞书返回:",
    JSON.stringify(res.data)
);

    console.log(
        "tenant_access_token获取成功"
    );


    return token;

}





// =====================================
// Wiki转换Docx
// =====================================


async function getRealDocumentId(
    wikiToken,
    token
){

    const url =
    `https://open.feishu.cn/open-apis/wiki/v2/nodes/${wikiToken}`;


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


    console.log(
        JSON.stringify(
            res.data,
            null,
            2
        )
    );


    return res.data.data.node.obj_token;

}





// =====================================
// 获取文档blocks
// =====================================

async function getDocumentBlocks(
    documentId,
    token
){

console.log(
    "getDocumentBlocks收到token:",
    token?.slice(0,20),
    "长度:",
    token?.length
);
    let blocks = [];

    let pageToken = "";



    while(true){

       let url =
`https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500&document_revision_id=-1`;



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


// =========================
// 获取block文字
// =========================

function getText(
    block
){

    if(!block){
        return "";
    }


    let elements=[];


    if(block.heading1?.elements){

        elements =
        block.heading1.elements;

    }
    else if(block.heading2?.elements){

        elements =
        block.heading2.elements;

    }
    else if(block.heading3?.elements){

        elements =
        block.heading3.elements;

    }
    else if(block.text?.elements){

        elements =
        block.text.elements;

    }


    let text="";


    elements.forEach(
        item=>{

            if(item.text_run){

                text +=
                item.text_run.content || "";

            }

        }
    );


    return text.trim();

}



// =========================
// 标题拆分函数
// =========================

function splitByHeading(
    blocks
){

    const sections = [];

    let current = null;


    blocks.forEach(block=>{


        const text =
        getText(block);



        // 只识别项目标题
const isProjectTitle =
(
    text.includes("客服AI项目定级")
)
||
(
    /^0\d[、.\-]/.test(text)
)
||
(
    /^1\d[、.\-]/.test(text)
)
||
(
    /^[一二三四五六七八九十]+、/.test(text)
);

        if(isProjectTitle){


            current = {

                title:text,

                blocks:[block]

            };


            sections.push(current);


        }
        else if(current){


            current.blocks.push(block);


        }


    });


    return sections;

}

// =====================================
// 同步单个案例
// =====================================

async function syncCase(
    item,
    token,
    page
){

    console.log(
        "\n正在同步:",
        item.name
    );



   const documentId =
item.wiki_token;




    const blocks =
await getDocumentBlocks(
    documentId,
    token
);

const sections =
splitByHeading(
    blocks
);

console.log(
    "所有block类型:",
    [...new Set(
        blocks.map(
            b=>b.block_type
        )
    )]
);


console.log(
    "表格相关:",
    JSON.stringify(
        blocks.filter(
            b =>
            b.table ||
            b.sheet
        ),
        null,
        2
    )
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

console.log(
    "表格数量:",
    blocks.filter(
        b =>
        b.block_type === 31
    ).length
);

console.log(
    "所有block类型:",
    [...new Set(
        blocks.map(
            b=>b.block_type
        )
    )]
);

console.log(
"31类型:",
JSON.stringify(
blocks.filter(
b=>b.block_type===31
),
null,
2
)
);


console.log(
"32类型:",
JSON.stringify(
blocks.filter(
b=>b.block_type===32
),
null,
2
)
);


console.log(
    "24类型数量:",
    blocks.filter(
        b=>b.block_type===24
    ).length
);


console.log(
    "25类型数量:",
    blocks.filter(
        b=>b.block_type===25
    ).length
);

console.log(
"22类型:",
JSON.stringify(
blocks.filter(
b=>b.block_type===22
),
null,
2
)
);


console.log(
"13类型:",
JSON.stringify(
blocks.filter(
b=>b.block_type===13
),
null,
2
)
);


console.log(
"30类型:",
JSON.stringify(
blocks.filter(
b=>b.block_type===30
),
null,
2
)
);

console.log(
"25完整结构:",
JSON.stringify(
    blocks.find(
        b=>b.block_type===25
    ),
    null,
    2
)
);

console.log(
"25子节点完整:",
JSON.stringify(
    blocks.filter(
        b =>
        b.parent_id === "D0PMdH5Pfop6PNxqGN3cdLiwnGg"
    ),
    null,
    2
)
);

console.log(
    "24示例:",
    JSON.stringify(
        blocks.find(
            b=>b.block_type===24
        ),
        null,
        2
    )
);


console.log(
    "25示例:",
    JSON.stringify(
        blocks.find(
            b=>b.block_type===25
        ),
        null,
        2
    )
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
    let imageMarkdown = "";




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

imageMarkdown += 
`![](/AI案例库/${item.department}/${item.name}/${imageName})

`;

            }
            catch(e){


                console.log(
                    "图片下载失败:",
                    imageToken
                );


            }


        }


    }




for(
    const section of sections
){

console.log(
    "项目:",
    section.title,
    "block数量:",
    section.blocks.length
);

const screenshotPath =
path.join(
    ASSET_DIR,
    item.department,
    section.title + ".png"
);


console.log(
    "当前截图项目:",
    section.title,
    item
);

    const markdown =
    `
---
title: ${section.title}
department: ${item.department}
source: 飞书知识库
---

# ${section.title}

`

    fs.writeFileSync(
        path.join(
            saveDir,
            `${section.title}.md`
        ),
        markdown,
        "utf8"
    );
}




    console.log(
        "完成:",
        item.name
    );

}





// =====================================
// 主程序
// =====================================

async function main(){

    try{

const browser = await chromium.launch({
            headless:false
        });


        const page = await browser.newPage();


        await page.setViewportSize({
            width:1600,
            height:1200
        });



    console.log("页面加载完成");



    // 等待飞书渲染
    await page.waitForTimeout(20000);

// 隐藏飞书多余按钮
await page.evaluate(()=>{

    document.querySelectorAll(
        '[class*="float"],[class*="feedback"]'
    ).forEach(el=>{
        el.style.display="none";
    });


});

console.log("隐藏悬浮按钮");



// 找正文区域
const content =
    await page.locator(
        ".bear-web-x-container.catalogue-opened.docx-in-wiki"
    ).first();



console.log("找到正文区域");

const scrollInfo = await page.evaluate(() => {

    let result = [];

    document.querySelectorAll("*").forEach(el => {

        if(el.scrollHeight > el.clientHeight + 500){

            result.push({

                class: el.className,

                scrollHeight: el.scrollHeight,

                clientHeight: el.clientHeight

            });

        }

    });

    return result.slice(0,20);

});


console.log(scrollInfo);


        console.log(
            "开始同步AI案例库..."
        );


        const token =
        await getTenantToken();


        console.log(
            "token长度:",
            token.length
        );


        for(
            const item of CASE_LIST
        ){

await syncCase(
    item,
    token,
    page
);

        }


        console.log(
            "全部同步完成"
        );


    }
    catch(e){

        console.log(
            "同步出现错误:"
        );


        console.log(
            e.response?.data || e.message
        );


        console.log(
            e
        );

    }

}


main();