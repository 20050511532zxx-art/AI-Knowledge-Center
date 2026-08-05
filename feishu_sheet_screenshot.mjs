import { chromium } from "playwright";
import fs from "fs";
import path from "path";


export async function screenshotFeishuSheet(
    url,
    fileName
){

    console.log("开始截图在线表格:", url);


const browser =
await chromium.launchPersistentContext(
    "./feishu_browser",
    {
        headless:false
    }
);



    const pages =
browser.pages();


const page =
pages.length
?
pages[0]
:
await browser.newPage();


await page.setViewportSize({
    width:1600,
    height:1200
});



 await page.goto(
    url.replace("https://feishu.cn","https://www.feishu.cn"),
    {
        waitUntil:"domcontentloaded",
        timeout:60000
    }
);


console.log("等待飞书登录完成...");

await page.waitForTimeout(60000);


console.log("重新进入飞书表格...");

await page.goto(
    url,
    {
        waitUntil:"domcontentloaded",
        timeout:60000
    }
);


await page.waitForTimeout(10000);




    const saveDir =
    "./content/images/feishu";



    if(
        !fs.existsSync(saveDir)
    ){

        fs.mkdirSync(
            saveDir,
            {
                recursive:true
            }
        );

    }



    const safeName =
    fileName
    .replace(/[\\/:*?"<>|]/g,"_");



    const savePath =
    path.join(
        saveDir,
        safeName + ".png"
    );

console.log("当前页面:", page.url());

    await page.screenshot({

        path:savePath,

        fullPage:true

    });



    await browser.close();



    console.log(
        "截图完成:",
        savePath
    );


    return savePath;

}