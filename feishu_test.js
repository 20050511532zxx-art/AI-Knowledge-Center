require("dotenv").config();

const lark = require("@larksuiteoapi/node-sdk");


const client = new lark.Client({

    appId: process.env.FEISHU_APP_ID,

    appSecret: process.env.FEISHU_APP_SECRET,

});


async function main(){

    try {


        const res = await client.bitable.v1.appTableRecord.list({

            path: {

                app_token: process.env.FEISHU_APP_TOKEN,

                table_id: process.env.FEISHU_TABLE_ID,

            },

        });


        console.log("====== 飞书读取成功 ======");


        console.log(

            JSON.stringify(

                res.data.items,

                null,

                2

            )

        );


    } catch(error){


        console.log("====== 飞书读取失败 ======");


        console.log(error);


    }

}


main();