import { chromium } from "playwright";


const url =
"https://my.feishu.cn/wiki/Mnxjwiw1picy1Uk22QVcQGWAnbf?fromScene=spaceOverview";


const context =
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
await context.newPage();



await page.goto(
url,
{
waitUntil:"domcontentloaded",
timeout:60000
}
);


await page.waitForTimeout(10000);



console.log("寻找滚动容器");



const scrolls =
await page.evaluate(()=>{


const result=[];


document
.querySelectorAll("*")
.forEach(el=>{


const style =
getComputedStyle(el);


if(
el.scrollHeight >
el.clientHeight + 300
){


const rect =
el.getBoundingClientRect();


result.push({

tag:el.tagName,

class:el.className,

height:el.clientHeight,

scrollHeight:el.scrollHeight,

top:rect.top,

left:rect.left

});


}


});


return result;


});



console.log(scrolls);


await page.waitForTimeout(999999);