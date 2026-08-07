import { chromium } from "playwright";


const url="https://my.feishu.cn/wiki/Mnxjwiw1picy1Uk22QVcQGWAnbf?fromScene=spaceOverview";


const browser =
await chromium.launchPersistentContext(
    "./feishu_browser",
    {
        headless:false,
        viewport:{
            width:1600,
            height:1200
        }
    }
);


const page =
await browser.newPage();


await page.goto(url,{
    waitUntil:"networkidle"
});


console.log("页面打开");


await page.waitForTimeout(10000);


// 获取页面文字

const texts =
await page.locator("body").innerText();


console.log(
texts.slice(0,3000)
);


console.log("完成");