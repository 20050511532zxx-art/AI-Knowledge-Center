import axios from "axios";
import dotenv from "dotenv";

dotenv.config({
    path: ".feishu.env"
});


const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;


// AI案例库根节点
const NODE_TOKEN =
"HMDUwJ1KpighaGkvj6qcoOQenEf";



// 获取token

async function getToken(){

    const res = await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
            app_id:APP_ID,
            app_secret:APP_SECRET
        }
    );

    return res.data.tenant_access_token;

}




// 获取节点信息

async function getNode(token,nodeToken){


    const res =
    await axios.get(
        "https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node",
        {
            headers:{
                Authorization:`Bearer ${token}`
            },
            params:{
                token:nodeToken
            }
        }
    );


    return res.data;

}




async function main(){


    console.log("开始读取Wiki节点");


    const token =
    await getToken();


    console.log("✅ token成功");



    const result =
    await getNode(
        token,
        NODE_TOKEN
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