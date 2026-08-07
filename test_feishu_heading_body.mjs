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



await page.goto(url,{
    waitUntil:"networkidle"
});



await page.waitForTimeout(10000);



console.log("开始寻找正文标题");



const result =
await page.evaluate(()=>{


const keywords=[

"客服AI项目定级",

"一、客服聊天记录质检分析",

"二、AI外呼系统",

"三、多平台退款率分析软件",

"四、E店、S店、亚马逊等三平台马帮建退款单软件",

"五、探域机器人使用情况",

"六、跨境进口退款核对工具",

"七、亚马逊发货物流查询AI",

"八、大疆激活查询软件",

"九、长租售后查询关联订单筛选",

"十、美客多跟单软件",

"十一、跨境韩国本土店退货跟单软件",

"十二、微信聊天记录分析系统"

];



let result=[];



document
.querySelectorAll("*")
.forEach(el=>{


const text =
el.innerText?.trim();



if(!text){
    return;
}



for(const key of keywords){


if(
text.startsWith(key)
){


const rect =
el.getBoundingClientRect();



if(
rect.left > 300
&&
rect.width > 300
){


result.push({

text:key,

left:Math.round(rect.left),

top:Math.round(
rect.top + window.scrollY
),

width:Math.round(rect.width),

height:Math.round(rect.height)

});


}


}



}



});



return result;



});



console.log(
result
);



await context.close();