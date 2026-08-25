import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import sharp from "sharp";


// ======================================================
// 基础配置
// ======================================================

const wikiToken =
process.argv[2] || "Mnxjwiw1picy1Uk22QVcQGWAnbf";


const url =
`https://my.feishu.cn/wiki/${wikiToken}?fromScene=spaceOverview`;

let imageDir = process.argv[3] || "customer_cases";
let targetSection = process.argv[4] || null;


console.log(
    "参数检查:",
    process.argv
);

console.log(
    "当前imageDir:",
    imageDir
);

const outputDir =
targetSection
?
`./content/images/feishu/temp_${imageDir}`
:
`./content/images/feishu/${imageDir}`;

const tempDir =
`./content/images/feishu/${imageDir}_temp`;


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

let context;
let page;


if(global.page){

    console.log("复用已有飞书页面");

    page = global.page;


}else{

    console.log("独立启动飞书页面");

    context =
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


    page =
    await context.newPage();

}


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


// 特殊处理：微信聊天记录分析系统标题可能因为文字较长而换行
const isWechatTitle =
clean.startsWith("十二、")
&&
clean.includes("微信聊天记录分析系统");


// "AI项目定级"标题可能在文档最顶部（rect.top 很小），需豁免 top 限制
// 同时豁免"旺店通核心项目总览"这类紧跟定级标题的无编号概述性标题
const isMainTitle =
clean.endsWith("AI项目定级") ||
clean.endsWith("核心项目总览");


// 只取正文区域中的"小标题节点"
if (
    rect.left > 620
    &&
    (rect.top > 200 || isMainTitle)
    &&
    rect.height >= 25
    &&
    (
        !isMainTitle && rect.height < 50
        ||
        (
            isWechatTitle
            &&
            rect.height < 120
        )
    )
) {

const isCaseTitle =
/^[一二三四五六七八九十]+、/.test(clean)
||
isWechatTitle;


                    if (
                        isMainTitle
                        ||
                        isCaseTitle
                    ) {

console.log("发现标题:", clean);

                        result.push({

                            // 保留原始文字（含空格），使生成的文件名与 .md 引用一致
                            text: text,

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
    item.text.endsWith("AI项目定级")
    || item.text.endsWith("核心项目总览")
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
    item.text.endsWith("AI项目定级")
){
    key = item.text;
}

 else {

const match =
item.text.match(
/^([一二三四五六七八九十]+)、/
)
;

// 排除正文中误识别的小标题
if (
    item.text.includes("微信聊天记录分析系统")
    &&
    !item.text.startsWith("十二、")
){
    continue;
}

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

const expectedOrder = Array.from(headingMap.entries()).map(([key,item],index)=>{

    return {
        key:key,
        name:`${String(index+1).padStart(2,"0")}_${item.text.replace(/[\/\\:*?"<>|]/g,"").replace(/[\u200b\u200c\u200d]/g,"")}`
    };

});


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


// 特殊处理：部门前置内容（飞书文档最开头到第一个标题之间的内容）
// syncCase 那边会传 targetSection="部门前置内容"，但这不是飞书里的真标题
// 这里在 headings 数组头部插入一个 top=0 的虚拟标题，让现有截图流程能正常处理
if (
    targetSection === "部门前置内容"
    && headings.length > 0
) {

    headings.unshift({
        text: "部门前置内容",
        top: 0,
        height: 0,
        name: "00_部门前置内容"
    });

    console.log(
        "[特殊处理] 部门前置内容：在 headings 头部插入虚拟标题，top=0 →",
        headings[1].top
    );

}


// ===============================
// 自动寻找十二、微信聊天记录分析系统
// 使用飞书页面真实位置，不再写死 top
// ===============================

const wechatTitle =
allHeadings.find(
    item =>
        item.text.startsWith("十二、")
        &&
        item.text.includes("微信聊天记录分析系统")
);


if(
    imageDir === "customer_cases"
    &&
    wechatTitle
){

    // 先确认 headings 里是否已经存在，防止重复
    const alreadyExists =
    headings.some(
        item =>
            item.text.includes("微信聊天记录分析系统")
    );

    if(!alreadyExists){

        headings.push({

            ...wechatTitle,

            text:
            "十二、微信聊天记录分析系统",

            name:
            "13_微信聊天记录分析系统"

        });

    }

}

// 重新排序
headings.sort(
(a,b)=>
a.top-b.top
);

// 删除飞书误识别的小标题
const removeTitles = [];

if(imageDir === "finance_cases"){
    removeTitles.push(
        "微信聊天记录分析系统"
    );
}


for(
    const title of removeTitles
){
    const index = headings.findIndex(
        item => item.text.includes(title)
    );

    if(index !== -1){

        console.log(
            "删除误识别章节:",
            headings[index].text
        );

        headings.splice(index,1);

    }
}

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

// =====================================================
// AI项目定级之前的内容，自动作为部门前置内容
// 不限制具体标题，所有部门通用
// =====================================================

const mainTitleIndex =
headings.findIndex(
    item =>
        item.text &&
        item.text.endsWith("AI项目定级")
);

if(mainTitleIndex !== -1){

    const mainTitle =
    headings[mainTitleIndex];

    // 正常情况下 AI项目定级 很靠近页面顶部。
    // 如果它已经明显下移，说明它前面新增了正文内容。
    if(mainTitle.top > 300){

        const overviewSection = {
            text: "部门前置内容",
            name: "00_部门前置内容",
            top: 0,
            height: 0,
            isOverview: true
        };

        headings.unshift(
            overviewSection
        );

        console.log(
            "✅ 检测到AI项目定级前存在内容，增加部门前置章节"
        );

    }

}

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

// =====================================================
// 自动清理已经失效的旧截图
// 项目改名、删除、编号变化后，删除旧 PNG
// =====================================================

const finalImageDir = path.join(
    "./content/images/feishu",
    imageDir
);

fs.mkdirSync(
    finalImageDir,
    { recursive: true }
);

// 当前飞书页面实际应该存在的全部截图文件名
const validImageNames = new Set(
    headings.map(
        item => `${item.name}.png`
    )
);

// 只有整部门同步时才清理旧图
// 单项目更新 targetSection 时绝对不做全目录清理
if (!targetSection) {

    for (const file of fs.readdirSync(finalImageDir)) {

        if (!file.toLowerCase().endsWith(".png")) {
            continue;
        }

        if (!validImageNames.has(file)) {

            const oldFile = path.join(
                finalImageDir,
                file
            );

            fs.unlinkSync(oldFile);

            console.log(
                "🗑 删除失效旧图片:",
                file
            );
        }
    }
}

for (
    let i = 0;
    i < headings.length;
    i++
) {

if(
    targetSection &&
    !headings[i].text.includes(targetSection)
){
    console.log(
        "跳过章节:",
        headings[i].text
    );

    continue;
}

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


// 如果后面没有下一章节，才截到正文最底部
// 如果已经识别到“十二、微信聊天记录分析系统”，
// 就使用十二的真实 top 作为十一的结束位置
if(
    section.name.includes("跨境韩国本土店退货跟单软件")
    &&
    !next
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

// 对比前统一规范化：去空格 + NFC，消除隐藏字符/编码差异
const norm = s => s.replace(/\s+/g, "").normalize("NFC");
// 用正则前缀匹配，只要 section.text 以 targetSection 的规范化结果开头即可匹配
// 这样 "七、Shopify 主题..." 和 "七、Shopify主题..."（含空格差异）都能对上
const tgtNorm = targetSection ? norm(targetSection) : "";
const sectionNorm = norm(section.text);
const isMatch = targetSection && sectionNorm.startsWith(tgtNorm);
if(!isMatch){
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

// 单项目更新时，覆盖正式图片

if(targetSection){

const finalFile =
path.join(
    `./content/images/feishu/${imageDir}`,
    `${section.name}.png`
);

fs.mkdirSync(
    `./content/images/feishu/${imageDir}`,
    {
        recursive: true
    }
);

    fs.copyFileSync(
        outputFile,
        finalFile
    );


    console.log(
        "✅ 覆盖正式图片:",
        finalFile
    );

}

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


await context.close();