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



//读取知识库节点
async function readNode(){

    const token = await getToken();

    console.log("✅ token获取成功");


    // 你的客服+AI数字化解决案例 node_token
    const nodeToken =
"Mnxjwiw1picy1Uk22QVcQGWAnbf";


    console.log("读取节点:", nodeToken);


    const url =
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${nodeToken}`;



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



readNode()
.catch(err=>{

    console.log("❌失败");

    console.log(
        err.response?.data || err.message
    );

});