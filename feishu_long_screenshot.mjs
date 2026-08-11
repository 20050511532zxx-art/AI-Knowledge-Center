import fs from "fs";


// =====================================
// 飞书正文区域长截图
// =====================================

export async function takeFeishuScreenshot(
page,
savePath,
item
){

console.log(
"当前截图项目:",
item?.name
);


// 等待页面稳定

await page.waitForTimeout(20000);


// 隐藏飞书悬浮按钮

await page.evaluate(()=>{

document.querySelectorAll(
'[class*="float"],[class*="feedback"],[class*="toolbar"]'
)
.forEach(el=>{

    el.style.display="none";

});

});


// 隐藏滚动条

await page.addStyleTag({

content:`

::-webkit-scrollbar{

    display:none !important;

}

`

});


console.log(
"页面加载完成"
);



// =====================================
// 找正文容器
// =====================================

const container =
page.locator(
".bear-web-x-container.docx-in-wiki"
)
.first();


await page.waitForTimeout(5000);


console.log(
"正文容器数量:",
await page.locator(
".bear-web-x-container.docx-in-wiki"
).count()
);


console.log(
"找到正文区域"
);



// =====================================
// 触发飞书加载全部内容
// =====================================

await container.evaluate(
(el)=>{

el.scrollTop =
el.scrollHeight;

}
);


await page.waitForTimeout(5000);


console.log(
"触发底部加载完成"
);



// =====================================
// 获取正文高度
// =====================================

const info =
await container.evaluate(
(el)=>{

return {

scrollHeight:
el.scrollHeight,

clientHeight:
el.clientHeight

};

});


console.log(
"正文高度:",
info
);



// =====================================
// 图片目录
// =====================================

const dir =
"content/images/feishu/customer_cases";


if(!fs.existsSync(dir)){

fs.mkdirSync(
dir,
{
recursive:true
}
);

}



// =====================================
// 清理当前旧分页截图
// =====================================

const oldFiles =
fs.readdirSync(dir)
.filter(
f=>
f.startsWith("customer_")
&&
f.endsWith(".png")
);


for(const f of oldFiles){

fs.unlinkSync(
`${dir}/${f}`
);

}



// =====================================
// 滚动加载
// =====================================

let lastHeight = 0;


for(let i=0;i<20;i++){


await container.evaluate(
(el)=>{

el.scrollTop =
el.scrollHeight;

}
);


await page.waitForTimeout(2000);


const height =
await container.evaluate(
el=>el.scrollHeight
);


console.log(
"当前高度:",
height
);


if(height===lastHeight){

break;

}


lastHeight = height;


}



// =====================================
// 回顶部
// =====================================

await container.evaluate(
(el)=>{

el.scrollTop=0;

}
);


await page.waitForTimeout(3000);



// =====================================
// 开始截图
// =====================================

let index = 1;


const step = 900;



for(
let y=0;
y<info.scrollHeight;
y+=step
){


console.log(
"当前滚动:",
y
);



await container.evaluate(
(el,y)=>{

el.scrollTop=y;

},
y
);



await page.waitForTimeout(1500);



await page.screenshot({

path:
`${dir}/customer_${index}.png`,


clip:{

x:600,

y:64,

width:1250,

height:900

}

});



console.log(
`第${index}张截图完成`
);


index++;


}



// =====================================
// 最后一屏补拍
// =====================================

await container.evaluate(
(el)=>{

el.scrollTop =
el.scrollHeight;

}
);


await page.waitForTimeout(2000);



await page.screenshot({

path:
`${dir}/customer_last.png`,


clip:{

x:600,

y:64,

width:1250,

height:900

}

});



console.log(
"最后补拍完成"
);



console.log(
"分页截图完成"
);



}