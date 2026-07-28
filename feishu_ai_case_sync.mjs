import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";


dotenv.config({
    path: ".feishu.env"
});


// =====================
// 飞书配置
// =====================

const APP_ID =
process.env.FEISHU_APP_ID;


const APP_SECRET =
process.env.FEISHU_APP_SECRET;



// 配置文件

const CONFIG_FILE =
"./ai_case_config.json";




// =====================
// 获取案例配置
// =====================

function getConfigs(){

    return JSON.parse(

        fs.readFileSync(

            CONFIG_FILE,

            "utf8"

        )

    );

}



// =====================
// 获取token
// =====================


async function getToken(){


    const res =

    await axios.post(

        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",

        {

            app_id: APP_ID,

            app_secret: APP_SECRET

        }

    );


    return res.data.tenant_access_token;

}




// =====================
// 获取blocks
// =====================


async function getBlocks(

    token,

    documentId

){


    const res =

    await axios.get(


        `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks`,

        {


            headers:{


                Authorization:

                `Bearer ${token}`


            },


            params:{


                page_size:500


            }


        }


    );


    return res.data.data.items;


}







// =====================
// 下载图片
// =====================


async function downloadImage(

    token,

    imageKey,

    imageDir,

    filename

){


    if(
        !fs.existsSync(imageDir)
    ){


        fs.mkdirSync(

            imageDir,

            {

                recursive:true

            }

        );

    }



    const savePath =

    path.join(

        imageDir,

        filename

    );



    const res =

    await axios.get(


        `https://open.feishu.cn/open-apis/drive/v1/medias/${imageKey}/download`,

        {


            headers:{


                Authorization:

                `Bearer ${token}`


            },


            responseType:

            "arraybuffer"


        }


    );



    fs.writeFileSync(

        savePath,

        res.data

    );



    console.log(

        "图片保存:",

        filename

    );


}








// =====================
// 解析blocks
// =====================


async function parseBlocks(

    blocks,

    token,

    config

){


    let markdown = "";


    let imgIndex = 1;



    // 图片保存位置

    const imageDir =


    `./content/assets/AI案例库/${config.department}/${config.name}`;



    async function walk(list){



        for(

            const block of list

        ){



            // 文字


            if(

                block.text

            ){


                const elements =

                block.text.elements || [];



                let text = "";



                for(

                    const el of elements

                ){


                    if(

                        el.text_run

                    ){


                        text +=

                        el.text_run.content;


                    }


                }



                if(

                    text.trim()

                ){


                    markdown +=

                    text + "\n\n";


                }



            }






            // 图片


            if(

                block.image

            ){


                const imageKey =


                block.image.token ||


                block.image.image_key;



                if(

                    imageKey

                ){



                    const filename =

                    `img_${imgIndex}.png`;



                    await downloadImage(


                        token,


                        imageKey,


                        imageDir,


                        filename


                    );



                    markdown +=



                    `![](/assets/AI案例库/${config.department}/${config.name}/${filename})\n\n`;



                    imgIndex++;


                }



            }






            // 子节点


            if(


                block.children


                &&


                block.children.length


            ){



                await walk(

                    block.children

                );


            }



        }



    }





    await walk(blocks);



    return markdown;



}









// =====================
// 保存Markdown
// =====================


function saveMarkdown(

    content,

    config

){



    const mdDir =


    `./content/AI案例库/${config.department}`;




    if(

        !fs.existsSync(mdDir)

    ){


        fs.mkdirSync(

            mdDir,

            {

                recursive:true

            }

        );


    }



    const mdFile =


    `${mdDir}/${config.name}.md`;





    const md =



`---
title: ${config.name}
category: AI案例库
department: ${config.department}
source: 飞书知识库
---


# ${config.name}


${content}

`;





    fs.writeFileSync(

        mdFile,

        md,

        "utf8"

    );



    console.log(

        "Markdown生成:",

        mdFile

    );



}








// =====================
// 主程序
// =====================


async function main(){



    console.log(

        "开始批量同步AI案例..."

    );



    const token =

    await getToken();



    console.log(

        "token成功"

    );



    const configs =

    getConfigs();





    for(

        const config of configs

    ){



        console.log(

            "\n正在同步:",

            config.name

        );




        const blocks =

        await getBlocks(

            token,

            config.document_id

        );



        console.log(

            "blocks:",

            blocks.length

        );





        const markdown =

        await parseBlocks(

            blocks,

            token,

            config

        );





        saveMarkdown(

            markdown,

            config

        );



    }




    console.log(

        "\n全部同步完成"

    );


}



main();