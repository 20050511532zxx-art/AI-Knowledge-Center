import fs from "fs";


// =========================
// 飞书正文区域长截图
// =========================

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



// 找正文容器

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



// 获取正文尺寸

const box =
await container.boundingBox();

const clipBox = {

    x:600,

    y:64,

    width:1250,

    height:900

};

const info =
await container.evaluate(
el=>({

    scrollHeight:
    el.scrollHeight,


    clientHeight:
    el.clientHeight

})
);



console.log(
"正文区域:",
box
);


console.log(
"正文高度:",
info
);



// 创建图片目录

const dir =
"content/images/feishu";


if(!fs.existsSync(dir)){

    fs.mkdirSync(
        dir,
        {
            recursive:true
        }
    );

}



// 清理旧截图

const oldFiles =
fs.readdirSync(dir)
.filter(
f=>
f.startsWith("customer_")
&&
f.endsWith(".png")
&&
!f.includes("full")
);


for(const f of oldFiles){

    fs.unlinkSync(
        `${dir}/${f}`
    );

}



// 开始截图

let index=1;


const step=900;



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



    await page.waitForTimeout(
        1500
    );



    await page.screenshot({

        path:
        `${dir}/customer_${index}.png`,


       clip:clipBox

    });



    console.log(
        `第${index}张截图完成`
    );


    index++;


}



console.log(
"分页截图完成"
);



}