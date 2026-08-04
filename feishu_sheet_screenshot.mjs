import { chromium } from "playwright";
import fs from "fs";
import path from "path";


export async function screenshotFeishuSheet(
    url,
    fileName
){

    console.log("开始截图在线表格:", url);


    const browser =
    await chromium.launch({
        headless:true
    });



    const page =
    await browser.newPage({

        viewport:{
            width:1600,
            height:1200
        }

    });



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