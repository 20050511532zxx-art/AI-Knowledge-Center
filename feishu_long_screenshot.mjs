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

const scrollInfo = await page.evaluate(() => {

    let result = [];

    document.querySelectorAll("*").forEach(el => {

        if(el.scrollHeight > el.clientHeight + 500){

            result.push({

                class: el.className,

                scrollHeight: el.scrollHeight,

                clientHeight: el.clientHeight

            });

        }

    });

    return result.slice(0,20);

});


console.log(scrollInfo);

// 获取正文区域
const box = await content.boundingBox();

const totalHeight = await page.evaluate(() => {

    let maxHeight = 0;

    document.querySelectorAll("*").forEach(el => {

        if(el.scrollHeight > maxHeight){

            maxHeight = el.scrollHeight;

        }

    });

    return maxHeight;

});

console.log("真实页面高度:", totalHeight);

console.log("正文总高度:", totalHeight);


// 每张截图高度
const pageHeight = 1000;


// 开始分页截图
let index = 1;


const overlap = 40;

const step = 900;

for(
 let y = 0;
 y < totalHeight - 200;
 y += pageHeight
){


await page.evaluate((y)=>{

    const el = document.querySelector(
        ".bear-web-x-container.catalogue-opened.docx-in-wiki"
    );

    el.scrollTop = y;

}, y);



    await page.waitForTimeout(2000);



    await page.screenshot({

        path:`content/images/feishu/customer_${index}.png`,

        clip:{
            x: box.x + 300,
            y: box.y,
            width: box.width - 400,
            height: Math.min(
    pageHeight,
    totalHeight - y
)
        }

    });



    console.log(`第${index}张截图完成`);


    index++;

}

console.log("正文截图完成");


// 不关闭浏览器
// await browser.close();