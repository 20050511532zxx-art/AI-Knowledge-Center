import { chromium } from "playwright";


// =========================
// 飞书分页截图函数
// =========================

export async function takeFeishuScreenshot(
    page,
    savePath,
    section
){


console.log(
    "当前截图项目:",
    section.title
);



// 等待飞书渲染完成

await page.waitForTimeout(20000);



console.log(
    "页面加载完成"
);



// 隐藏飞书悬浮按钮

await page.evaluate(()=>{


document.querySelectorAll(
    '[class*="float"],[class*="feedback"]'
)
.forEach(el=>{

    el.style.display="none";

});


});


console.log(
    "隐藏悬浮按钮完成"
);



// 找正文滚动区域

const selector =
".bear-web-x-container.catalogue-opened.docx-in-wiki";



const container =
page.locator(selector).first();



await container.waitFor({
    timeout:30000
});



const info =
await container.evaluate(el=>({

    scrollHeight:el.scrollHeight,

    clientHeight:el.clientHeight

}));


console.log(
    "正文高度:",
    info
);



// 清理旧截图

// 防止之前图片影响merge

import("fs").then(fs=>{

    const files =
    fs.readdirSync(
        "content/images/feishu"
    );


    files
    .filter(
        f =>
        f.startsWith("customer_")
        &&
        f.endsWith(".png")
    )
    .forEach(
        f=>
        fs.unlinkSync(
            "content/images/feishu/"+f
        )
    );


});



await page.waitForTimeout(1000);



// 开始分页截图


let index = 1;


const step = 900;



for(
let y = 0;
y < info.scrollHeight;
y += step
){



  await container.evaluate(
    (el,y)=>{

        el.scrollTop = y;

    },
    y
);



    await page.waitForTimeout(1500);



    const box =
    await container.boundingBox();



    console.log(
        "当前滚动:",
        y,
        "截图区域:",
        box
    );



 await page.screenshot({

    path:
    `content/images/feishu/customer_${index}.png`,

    clip:{

        x:box.x + 300,

        y:box.y,

        width:box.width - 400,

        height:900

    }

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