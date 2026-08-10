import { chromium } from "playwright";


// =========================
// 飞书链接
// =========================

const url =
"https://my.feishu.cn/wiki/Mnxjwiw1picy1Uk22QVcQGWAnbf?fromScene=spaceOverview";


// =========================
// 浏览器
// =========================

const context =
await chromium.launchPersistentContext(
"./feishu_browser",
{
    headless:false,
    viewport:{
        width:1600,
        height:1200
    }
});


const page =
await context.newPage();



console.log("打开飞书");


await page.goto(
url,
{
    waitUntil:"domcontentloaded",
    timeout:60000
}
);



console.log("等待页面渲染");


await page.waitForTimeout(15000);



// =========================
// 正文滚动容器
// =========================

const containerSelector =
".bear-web-x-container.catalogue-opened.docx-in-wiki";



// =========================
// 标题缓存
// =========================

let allHeadings=[];



// =========================
// 扫描标题函数
// =========================


async function collectHeadings(){


const result =
await page.evaluate(()=>{


const arr=[];


document
.querySelectorAll("*")
.forEach(el=>{


const text =
el.innerText?.trim();


if(!text)
return;



const clean =
text
.replace(/\s/g,"")
.replace(/\u200b/g,"");



const rect =
el.getBoundingClientRect();



// 正文区域

if(
rect.left>600
&&
rect.height<60
&&
rect.height>10
){



if(

clean==="客服AI项目定级"

||

/^[一二三四五六七八九十]+、/.test(clean)

){


arr.push({

text:clean,

top:
Math.round(
rect.top +
document.querySelector(
".bear-web-x-container.catalogue-opened.docx-in-wiki"
).scrollTop
),

left:
Math.round(rect.left),

height:
Math.round(rect.height)

});


}


}



});


return arr;


});



allHeadings.push(...result);



}



// =========================
// 滚动正文并采集
// =========================


console.log(
"开始滚动正文"
);



let lastScroll=-1;



while(true){


const info =
await page.evaluate(
(selector)=>{


const el =
document.querySelector(selector);


if(!el)
return null;



// 扫描前位置

return {

top:el.scrollTop,

height:el.scrollHeight

};


},
containerSelector
);



if(!info){

console.log(
"找不到正文容器"
);

break;

}



console.log(
"当前:",
info
);



// 每个位置采集标题

await collectHeadings();



if(
info.top===lastScroll
){

break;

}


lastScroll=
info.top;



// 向下滚动

const moved =
await page.evaluate(
(selector)=>{


const el =
document.querySelector(selector);


if(!el)
return false;



el.scrollTop += 1200;


return true;


},
containerSelector
);



if(!moved)
break;



await page.waitForTimeout(2000);



}



// 最后一屏再扫描一次

await collectHeadings();




// =========================
// 去重
// =========================


const headings =
allHeadings
.filter(
(item,index,self)=>{


return index===
self.findIndex(
x=>

x.text===item.text
&&
Math.abs(
x.top-item.top
)<100

);


})
.sort(
(a,b)=>a.top-b.top
);





console.log(
"\n==========最终正文标题==========\n"
);



console.log(
headings
);




console.log(
"\n数量:",
headings.length
);




console.log(
"完成，浏览器保持打开"
);



await page.waitForTimeout(
999999
);