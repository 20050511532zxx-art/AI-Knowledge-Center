import dotenv from "dotenv";
import axios from "axios";

dotenv.config({
    path: ".feishu.env"
});


async function getToken(){

    const res = await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
            app_id:process.env.FEISHU_APP_ID,
            app_secret:process.env.FEISHU_APP_SECRET
        }
    );

    return res.data.tenant_access_token;
}



async function main(){

    const token = await getToken();

    console.log("✅ token成功");


    const nodeToken =
    "HMDUwJ1KpighaGkvj6qcoOQenEf";


    const res = await axios.get(
        "https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node",
        {
            headers:{
                Authorization:
                `Bearer ${token}`
            },
            params:{
                token:nodeToken
            }
        }
    );


    const node =
    res.data.data.node;


    console.log("节点信息:");

    console.log(
        JSON.stringify(
            node,
            null,
            2
        )
    );


    console.log("\n真正space_id:");

    console.log(
        node.space_id
    );


}



main()
.catch(err=>{

console.log(
    err.response?.data ||
    err.message
);

});