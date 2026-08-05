import { chromium } from "playwright";


// 启动浏览器
const browser = await chromium.launchPersistentContext(
    "./feishu_browser",
    {
        headless:false
    }
);


const pages = browser.pages();

const page = pages.length
    ? pages[0]
    : await browser.newPage();


// 设置窗口大小
await page.setViewportSize({
    width:1600,
    height:1200
});


// 飞书文档地址
const url =
"https://my.feishu.cn/wiki/Mnxjwiw1picy1Uk22QVcQGWAnbf";


// 打开文档
await page.goto(
    url,
    {
        waitUntil:"load",
        timeout:120000
    }
);


console.log("页面加载完成");


// 等飞书渲染
await page.waitForTimeout(20000);


// 回到顶部
await page.evaluate(()=>{
    window.scrollTo(0,0);
});


console.log("等待正文加载");


// 隐藏飞书多余按钮
await page.evaluate(()=>{

    document.querySelectorAll(
        '[class*="float"],[class*="feedback"]'
    ).forEach(el=>{
        el.style.display="none";
    });


});

console.log("隐藏悬浮按钮");



// 找正文区域
const content =
    await page.locator(".garr-container-docx").first();



console.log("找到正文区域");


// 截正文
const box = await content.boundingBox();

await page.screenshot({

    path:"content/images/feishu/debug_customer.png",

    clip:{
        x: box.x + 300,
        y: box.y,
        width: box.width - 400,
        height: box.height
    }

});


console.log("正文截图完成");


// 不关闭浏览器
// await browser.close();