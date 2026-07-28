import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";


dotenv.config({
    path: ".feishu.env"
});


// 飞书配置
const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;


// Obsidian案例库路径
const OBSIDIAN_PATH =
"D:\\obsidian\\仓库\\AI工具数据库\\AI案例库";


// 配置文件
const CONFIG_FILE =
"./ai_case_config.json";





// =======================
// 获取token
// =======================

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





// =======================
// 获取飞书blocks
// =======================

async function getBlocks(token, document_id){


    const res = await axios.get(

        `https://open.feishu.cn/open-apis/docx/v1/documents/${document_id}/blocks`,

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





// =======================
// blocks 转 markdown
// =======================


function convertBlocks(blocks,title){


    let md = "";



    for(const block of blocks){



        // 普通文本

        if(block.block_type === 2){


            let text = "";



            const elements =
            block.text?.elements || [];



            for(const el of elements){


                if(el.text_run){

                    text += el.text_run.content;

                }


            }



            if(text.trim()){

                md += text + "\n\n";

            }


        }





        // 一级标题

        else if(block.block_type === 3){


            const elements =
            block.heading1?.elements || [];



            let text="";



            for(const el of elements){


                if(el.text_run){

                    text += el.text_run.content;

                }


            }



            if(text){

                md += "\n# " + text + "\n\n";

            }


        }




        // 二级标题

        else if(block.block_type === 4){


            const elements =
            block.heading2?.elements || [];



            let text="";



            for(const el of elements){


                if(el.text_run){

                    text += el.text_run.content;

                }


            }



            if(text){

                md += "\n## " + text + "\n\n";

            }


        }



    }



    return md;

}







// =======================
// 保存Markdown
// =======================


function saveMarkdown(
    name,
    department,
    content
){



    // 部门目录

    const folder =

    path.join(
        OBSIDIAN_PATH,
        department
    );





    // 不存在自动创建

    if(!fs.existsSync(folder)){


        fs.mkdirSync(
            folder,
            {
                recursive:true
            }
        );


    }





    const filePath =

    path.join(
        folder,
        `${name}.md`
    );






    const finalContent =

`# ${name}

${content}
`;





    fs.writeFileSync(

        filePath,

        finalContent,

        "utf8"

    );





    console.log(

        "✅ 已生成:",

        filePath

    );


}









// =======================
// 主程序
// =======================


async function main(){



    console.log(
        "开始批量同步飞书案例"
    );




    const configs =

    JSON.parse(

        fs.readFileSync(

            CONFIG_FILE,

            "utf8"

        )

    );





    const token =

    await getToken();




    console.log(
        "token成功"
    );





    for(const item of configs){



        console.log(

            "\n正在同步:",

            item.name

        );





        const blocks =

        await getBlocks(

            token,

            item.document_id

        );





        console.log(

            "blocks:",

            blocks.length

        );






        const md =

        convertBlocks(

            blocks,

            item.name

        );





        saveMarkdown(

            item.name,

            item.department,

            md

        );



    }





    console.log(

        "\n🎉全部同步完成"

    );



}





main();