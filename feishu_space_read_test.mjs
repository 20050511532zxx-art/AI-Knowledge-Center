import dotenv from "dotenv";

dotenv.config({
    path: ".feishu.env"
});

import axios from "axios";


// 获取token
async function getToken(){

    const res = await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
            app_id: process.env.FEISHU_APP_ID,
            app_secret: process.env.FEISHU_APP_SECRET
        }
    );

    return res.data.tenant_access_token;
}



//读取知识库子节点
async function readSpace(){

    const token = await getToken();


    console.log("✅ token成功");


    const spaceId = "767674773838818138";


    const url =
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/${spaceId}/nodes`;


    const res = await axios.get(
        url,
        {
            headers:{
                Authorization:`Bearer ${token}`
            }
        }
    );


    console.log(
        JSON.stringify(res.data,null,2)
    );


}



readSpace()
.catch(err=>{

    console.log("❌错误");

    console.log(
        err.response?.data || err.message
    );

});