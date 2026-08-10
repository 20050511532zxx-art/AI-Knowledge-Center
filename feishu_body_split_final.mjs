import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import sharp from "sharp";


// ======================================================
// 基础配置
// ======================================================

const url =
"https://my.feishu.cn/wiki/Mnxjwiw1picy1Uk22QVcQGWAnbf?fromScene=spaceOverview";


const outputDir =
"./content/images/feishu/customer_cases";


const tempDir =
"./content/images/feishu/customer_cases_temp";


const containerSelector =
".bear-web-x-container.catalogue-opened.docx-in-wiki";


// 正文截图范围
// 你刚才说这个左右范围已经比较合适，所以继续保留
const CAPTURE_X = 630;
const CAPTURE_WIDTH = 900;


// 相邻截图保留一点重叠，避免飞书滚动误差
const OVERLAP = 0;


// ======================================================
// 准备目录
// ======================================================

function resetDir(dir) {

    if (fs.existsSync(dir)) {

        fs.rmSync(
            dir,
            {
                recursive: true,
                force: true
            }
        );

    }

    fs.mkdirSync(
        dir,
        {
            recursive: true
        }
    );

}


resetDir(outputDir);
resetDir(tempDir);


// ======================================================
// 浏览器
// ======================================================

const context =
await chromium.launchPersistentContext(
    "./feishu_browser",
    {
        headless: false,

        viewport: {
            width: 1600,
            height: 1200
        }
    }
);


const page =
await context.newPage();


console.log("打开飞书");


await page.goto(
    url,
    {
        waitUntil: "domcontentloaded",
        timeout: 60000
    }
);


console.log("等待页面渲染");


await page.waitForTimeout(15000);


// ======================================================
// 确认正文容器
// ======================================================

const containerInfo =
await page.evaluate(
    selector => {

        const el =
        document.querySelector(selector);

        if (!el) {
            return null;
        }

        const rect =
        el.getBoundingClientRect();

        return {

            top: rect.top,

            left: rect.left,

            width: rect.width,

            height: rect.height,

            scrollTop: el.scrollTop,

            scrollHeight: el.scrollHeight

        };

    },
    containerSelector
);


if (!containerInfo) {

    throw new Error(
        "没有找到飞书正文滚动容器"
    );

}


console.log(
    "正文容器:",
    containerInfo
);


// ======================================================
// 标题收集
// ======================================================

let allHeadings = [];


async function collectHeadings() {

    const data =
    await page.evaluate(
        selector => {

            const container =
            document.querySelector(selector);

            if (!container) {
                return [];
            }


            const result = [];


            document
            .querySelectorAll("*")
            .forEach(el => {

                const text =
                el.innerText?.trim();


                if (!text) {
                    return;
                }


                const clean =
                text
                .replace(/\u200b/g, "")
                .replace(/\s+/g, "");


                const rect =
                el.getBoundingClientRect();


                // 只取正文区域中的“小标题节点”
        if (
    rect.left > 620
    &&
    rect.top > 200
    &&
    rect.height >= 25
    &&
    rect.height < 50
) {

                    const isMainTitle =
                    clean === "客服AI项目定级";


const isCaseTitle =
/^[一二三四五六七八九十]+、/.test(clean)
||
(
    clean.includes("微信聊天记录分析系统")
    &&
    clean.startsWith("十二、")
);


                    if (
                        isMainTitle
                        ||
                        isCaseTitle
                    ) {

                        result.push({

                            text: clean,

                            // 转成正文容器里的绝对Y坐标
                            top:
                            Math.round(
                                rect.top
                                -
                                container.getBoundingClientRect().top
                                +
                                container.scrollTop
                            ),

                            height:
                            Math.round(rect.height)

                        });

                    }

                }

            });


            return result;

        },
        containerSelector
    );


    allHeadings.push(...data);

}


// ======================================================
// 滚动整个文档，边滚边收集标题
// ======================================================

console.log("开始完整加载正文");


let lastScroll = -1;


while (true) {

    await collectHeadings();


    const info =
    await page.evaluate(
        selector => {

            const el =
            document.querySelector(selector);

            return {

                top: el.scrollTop,

                height: el.scrollHeight,

                clientHeight: el.clientHeight

            };

        },
        containerSelector
    );


    console.log(
        "滚动位置:",
        info.top,
        "/",
        info.height
    );


    if (
        info.top === lastScroll
    ) {
        break;
    }


    lastScroll =
    info.top;


    await page.evaluate(
        selector => {

            const el =
            document.querySelector(selector);

            el.scrollTop += 900;

        },
        containerSelector
    );


    await page.waitForTimeout(1200);

}


// 最底部额外等待，确保十一、十二真正渲染
await page.evaluate(
    selector => {

        const el =
        document.querySelector(selector);

        el.scrollTop =
        el.scrollHeight;

    },
    containerSelector
);


await page.waitForTimeout(4000);


await collectHeadings();


// ======================================================
// 标题去重
// ======================================================

// 先过滤掉类似“二、AI”这种内部残缺节点
allHeadings =
allHeadings.filter(item => {

    if (
        item.text === "客服AI项目定级"
    ) {
        return true;
    }

    // 标题必须至少6个字符
    return item.text.length >= 6;

});


// 同一个标题可能出现多个DOM节点
// 同名标题只保留最长的那个
const headingMap =
new Map();


for (
    const item
    of allHeadings
) {

    let key;


    if (
        item.text === "客服AI项目定级"
    ) {

        key =
        "客服AI项目定级";

    } else {

const match =
item.text.match(
/^([一二三四五六七八九十]+)、/
)
||
(
item.text.includes("微信聊天记录分析系统")
?
["","十二"]
:
null
);

        if (!match) {
            continue;
        }


        key =
        match[1];

    }


    const old =
    headingMap.get(key);


    if (
        !old
        ||
        item.text.length > old.text.length
    ) {

        headingMap.set(
            key,
            item
        );

    }

}


// ======================================================
// 强制使用正确章节顺序
// ======================================================

const expectedOrder = [

    {
        key: "客服AI项目定级",
        name: "01_客服AI项目定级"
    },

    {
        key: "一",
        name: "02_客服聊天记录质检分析"
    },

    {
        key: "二",
        name: "03_AI外呼系统"
    },

    {
        key: "三",
        name: "04_多平台退款率分析软件"
    },

    {
        key: "四",
        name: "05_E店S店亚马逊三平台马帮建退款单软件"
    },

    {
        key: "五",
        name: "06_探域机器人使用情况"
    },

    {
        key: "六",
        name: "07_跨境进口退款核对工具"
    },

    {
        key: "七",
        name: "08_亚马逊发货物流查询AI"
    },

    {
        key: "八",
        name: "09_大疆激活查询软件"
    },

    {
        key: "九",
        name: "10_长租售后查询关联订单筛选"
    },

    {
        key: "十",
        name: "11_美客多跟单软件"
    },

    {
        key: "十一",
        name: "12_跨境韩国本土店退货跟单软件"
    },


];


const headings = [];


for (
    const config
    of expectedOrder
) {

    const item =
    headingMap.get(config.key);


    if (!item) {

        console.log(
            "❌ 没找到:",
            config.name
        );

        continue;

    }


    headings.push({

        ...item,

        name:
        config.name

    });

}


headings.sort(
    (a, b) =>
    a.top - b.top
);

// ===============================
// 自动寻找十二、微信聊天记录分析系统
// ===============================

const wechatTitle =
allHeadings.find(
item =>
item.text.startsWith("十二、")
&&
item.text.includes("微信聊天记录分析系统")
);


headings.push({

    text:"十二、微信聊天记录分析系统",

    top:22000,

    name:"13_微信聊天记录分析系统"

});

// 重新排序
headings.sort(
(a,b)=>
a.top-b.top
);

console.log(
    "\n========== 最终章节 =========="
);


console.log(headings);

console.log(
  headings.map(x=>({
    name:x.name,
    text:x.text,
    top:x.top
  }))
);

console.log(
    "章节数量:",
    headings.length
);


// ======================================================
// 获取最终正文高度
// ======================================================

const finalScrollHeight =
await page.evaluate(
    selector =>
    document.querySelector(selector)
    .scrollHeight,
    containerSelector
);


console.log(
    "正文总高度:",
    finalScrollHeight
);


// ======================================================
// 分章节截图并拼接
// ======================================================

for (
    let i = 0;
    i < headings.length;
    i++
) {

    const section =
    headings[i];


    const next =
    headings[i + 1];


    const sectionStart =
    section.top;


let sectionEnd =
next
?
next.top
:
finalScrollHeight;


// ===============================
// 修正十一、十二章节边界
// ===============================

if(
section.name === "12_跨境韩国本土店退货跟单软件"
){
    sectionEnd = 21800;
}


// ==========================
// 修复十一、十二章节边界
// ==========================

if(
    section.name.includes("美客多跟单软件")
){
    sectionEnd =
    sectionEnd - 30;
}


// 十二单独到底
if(
    section.name.includes("跨境韩国本土店退货跟单软件")
){
    sectionEnd =
    finalScrollHeight;
}



const sectionHeight =
sectionEnd
-
sectionStart;


if(
    sectionHeight <= 20 &&
    section.name !== "13_微信聊天记录分析系统"
){
    console.log(
        "跳过异常章节:",
        section.name
    );
    continue;
}


    console.log(
        "\n开始截图:",
        section.name
    );


    console.log(
        "范围:",
        sectionStart,
        "→",
        sectionEnd,
        "高度:",
        sectionHeight
    );


    const pieces = [];


    let currentY =
    sectionStart;


    let partIndex = 1;


    while (
        currentY
        <
        sectionEnd
    ) {

        // 把章节当前部分滚到正文容器顶部
        await page.evaluate(
            ([selector, target]) => {

                const el =
                document.querySelector(selector);

                el.scrollTop =
                target;

            },
            [
                containerSelector,
                currentY
            ]
        );


        await page.waitForTimeout(700);


        const state =
        await page.evaluate(
            selector => {

                const el =
                document.querySelector(selector);

                const rect =
                el.getBoundingClientRect();

                return {

                    actualScroll:
                    el.scrollTop,

                    viewportTop:
                    rect.top,

                    viewportHeight:
                    el.clientHeight,

                    scrollHeight:
                    el.scrollHeight

                };

            },
            containerSelector
        );


        // currentY可能比浏览器允许的最大scrollTop更大
        const actualStart =
        state.actualScroll;


        const offsetInsideViewport =
        Math.max(
            0,
            currentY
            -
            actualStart
        );


        const availableHeight =
        state.viewportHeight
        -
        offsetInsideViewport;


        const remaining =
        sectionEnd
        -
        currentY;


        const captureHeight =
        Math.floor(
            Math.min(
                availableHeight,
                remaining
            )
        );


        if (
            captureHeight <= 0
        ) {

            console.log(
                "当前区域无法截图，停止:",
                section.name
            );

            break;

        }


        const tempFile =
        path.join(
            tempDir,
            `${String(i + 1).padStart(2, "0")}_${String(partIndex).padStart(3, "0")}.png`
        );


        await page.screenshot({

            path:
            tempFile,

            clip: {

                x:
                CAPTURE_X,

                y:
                state.viewportTop
                +
                offsetInsideViewport,

                width:
                CAPTURE_WIDTH,

                height:
                captureHeight

            }

        });


        pieces.push({

            file:
            tempFile,

            height:
            captureHeight

        });


        console.log(
            "  分片:",
            partIndex,
            "Y:",
            currentY,
            "高度:",
            captureHeight
        );


        // 下一次往下移动
// 如果已经接近章节末尾，直接结束
if(
    currentY + captureHeight >= sectionEnd
){
    break;
}


// 正常向下移动
currentY +=
captureHeight - OVERLAP;

        partIndex++;

    }


    // ==================================================
    // 拼接章节分片
    // ==================================================

    if (
        pieces.length === 0
    ) {

        console.log(
            "❌ 没有生成分片:",
            section.name
        );

        continue;

    }


    const buffers = [];


    let finalHeight = 0;


    for (
        let p = 0;
        p < pieces.length;
        p++
    ) {

        let img =
        sharp(
            pieces[p].file
        );


        let meta =
        await img.metadata();


        // 第一张完整保留
        if (
            p === 0
        ) {

            const buffer =
            await img
            .png()
            .toBuffer();


            buffers.push({

                input:
                buffer,

                top:
                finalHeight,

                left:
                0

            });


            finalHeight +=
            meta.height;

        }

        else {

            // 后续图片裁掉顶部重叠
            const cropTop =
            Math.min(
                OVERLAP,
                meta.height - 1
            );


            const cropHeight =
            meta.height
            -
            cropTop;


            if (
                cropHeight <= 0
            ) {
                continue;
            }


            const buffer =
            await img
            .extract({

                left:
                0,

                top:
                cropTop,

                width:
                meta.width,

                height:
                cropHeight

            })
            .png()
            .toBuffer();


            buffers.push({

                input:
                buffer,

                top:
                finalHeight,

                left:
                0

            });


            finalHeight +=
            cropHeight;

        }

    }


    const outputFile =
    path.join(
        outputDir,
        `${section.name}.png`
    );


    await sharp({

        create: {

            width:
            CAPTURE_WIDTH,

            height:
            finalHeight,

            channels:
            4,

            background: {
                r: 255,
                g: 255,
                b: 255,
                alpha: 1
            }

        }

    })
    .composite(
        buffers
    )
    .png()
    .toFile(
        outputFile
    );


    console.log(
        "✅ 生成:",
        outputFile
    );

}


// ======================================================
// 删除临时分片
// ======================================================

fs.rmSync(
    tempDir,
    {
        recursive: true,
        force: true
    }
);


console.log(
    "\n=============================="
);


console.log(
    "全部章节截图完成"
);


console.log(
    "输出目录:",
    outputDir
);


console.log(
    "=============================="
);


// 浏览器保持打开，方便查看
await page.waitForTimeout(
    999999
);