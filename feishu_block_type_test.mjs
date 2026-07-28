import axios from "axios";
import dotenv from "dotenv";

dotenv.config({
    path: ".feishu.env"
});


const tokenUrl =
"https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";


const DOCUMENT_ID =
"Mnxjwiw1picy1Uk22QVcQGWAnbf";


async function main(){


const tokenRes =
await axios.post(
tokenUrl,
{
app_id:process.env.FEISHU_APP_ID,
app_secret:process.env.FEISHU_APP_SECRET
}
);


const token =
tokenRes.data.tenant_access_token;



const res =
await axios.get(
`https://open.feishu.cn/open-apis/docx/v1/documents/${DOCUMENT_ID}/blocks`,
{
headers:{
Authorization:`Bearer ${token}`
},
params:{
page_size:20
}
}
);



for(const b of res.data.data.items){

console.log(
"类型:",
b.block_type,
"字段:",
Object.keys(b)
);

}


}


main();