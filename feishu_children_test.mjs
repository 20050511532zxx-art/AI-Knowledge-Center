import dotenv from "dotenv";
import axios from "axios";

dotenv.config({
    path: ".feishu.env"
});


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



async function main(){

    const token = await getToken();

    console.log("✅ token成功");


    const spaceId =
    "766747738388188138";


    const parentNodeToken = "";


    const url =
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/${spaceId}/nodes`;


    const res = await axios.get(
        url,
        {
            headers:{
                Authorization:
                `Bearer ${token}`
            },

            params:{
                parent_node_token: parentNodeToken,
                page_size:50
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


}


main()
.catch(err=>{

    console.log("❌失败");

    console.log(
        err.response?.data ||
        err.message
    );

});