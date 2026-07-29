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


// AI案例库首页文档ID
const DOCUMENT_ID =
"OYYmdk5EWodZN9xWAYacDMU2nHh";

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
// 获取文档blocks
// =====================

async function getBlocks(token){


    const res =
    await axios.get(

        `https://open.feishu.cn/open-apis/docx/v1/documents/${DOCUMENT_ID}/blocks`,

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
// 提取链接
// =====================

function scanBlocks(blocks){


    let result=[];


    for(const block of blocks){


        if(block.text){


            const elements =
            block.text.elements || [];


            for(const el of elements){


                if(el.text_run){


                    const text =
                    el.text_run.content;


                    const link =
                    el.text_run.text_element_style
                    ?.link
                    ?.url;



                    if(link){


                        result.push({

                            title:text,

                            url:link

                        });


                    }


                }


            }


        }


    }


    return result;

}




// =====================
// 主程序
// =====================

async function main(){


    console.log(
        "开始扫描AI案例库"
    );


    const token =
    await getToken();


    console.log(
        "token成功"
    );


    const blocks =
    await getBlocks(token);



    console.log(
        "blocks:",
        blocks.length
    );



    const result =
    scanBlocks(blocks);



    console.log(
        "发现案例:"
    );


    console.log(

        JSON.stringify(

            result,

            null,

            2

        )

    );


}



main();