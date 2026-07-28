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


    const documentId = "Dl5VdaDrvoKSp1xGD7ocWtbvn5g";


    const url =
    `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks`;


    const res = await axios.get(
        url,
        {
            headers:{
                Authorization:
                `Bearer ${token}`
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