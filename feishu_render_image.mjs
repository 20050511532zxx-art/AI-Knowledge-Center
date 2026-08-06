import { chromium } from "playwright";
import fs from "fs";


export async function renderFeishuImage(
    html,
    savePath
){

    const browser =
    await chromium.launch({
        headless:true
    });


    const page =
    await browser.newPage({
        viewport:{
            width:1200,
            height:1600
        }
    });


    await page.setContent(html);


    await page.screenshot({

        path:savePath,

        fullPage:true

    });


    await browser.close();


    console.log(
        "图片生成完成:",
        savePath
    );

}