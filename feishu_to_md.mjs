import "dotenv/config";
import axios from "axios";
import fs from "fs";

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;


// 获取token
async function getToken(){

    const res = await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        {
            app_id: APP_ID,
            app_secret: APP_SECRET
        }
    );

    return res.data.tenant_access_token;
}


//读取文档内容
async function getDocContent(token, docId){

    const res = await axios.get(
        `https://open.feishu.cn/open-apis/docx/v1/documents/${docId}/blocks`,
        {
            headers:{
                Authorization:`Bearer ${token}`
            }
        }
    );

    return res.data.data.items;
}


//提取文字
function extractText(blocks){

    let md="";

    for(const block of blocks){

        if(block.text_run){

            md += block.text_run.content + "\n\n";

        }

        if(block.heading1){

            md += "# "+block.heading1.elements[0].text_run.content+"\n\n";

        }

        if(block.heading2){

            md += "## "+block.heading2.elements[0].text_run.content+"\n\n";

        }

    }

    return md;

}



async function main(){

    const token = await getToken();

    console.log("token成功");


    //这里填你的文档ID
    const docId="Dl5VdaDrvoKSp1xGD7ocWtbvn5g";


    const blocks = await getDocContent(
        token,
        docId
    );


    const markdown = extractText(blocks);


    fs.writeFileSync(
        "./content/客服+AI数字化解决案例.md",
        markdown,
        "utf8"
    );


    console.log("✅ Markdown生成成功");

}


main();