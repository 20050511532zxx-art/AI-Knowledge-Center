import dotenv from "dotenv";
import axios from "axios";

dotenv.config({
  path: ".feishu.env"
});


const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;


console.log("开始测试飞书连接");

console.log("APP_ID:", APP_ID);



async function getToken(){

    const response = await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
            app_id: APP_ID,
            app_secret: APP_SECRET
        }
    );


    return response.data.tenant_access_token;

}



async function main(){

    try{

        const token = await getToken();


        console.log("✅ 飞书token获取成功");


        console.log(
            token.substring(0,20)+"******"
        );


    }catch(error){

        console.log("❌ 获取失败");


        console.log(
            error.response?.data || error.message
        );

    }

}



main();