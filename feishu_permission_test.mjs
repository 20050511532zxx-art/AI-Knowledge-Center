import "dotenv/config";
import axios from "axios";

const tokenRes = await axios.post(
"https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
{
    app_id: process.env.FEISHU_APP_ID,
    app_secret: process.env.FEISHU_APP_SECRET
});


const token = tokenRes.data.tenant_access_token;


console.log("新的token:");
console.log(token);


const res = await axios.get(
"https://open.feishu.cn/open-apis/auth/v1/tenant/permission/list",
{
    headers:{
        Authorization:`Bearer ${token}`
    }
});


console.log(JSON.stringify(res.data,null,2));