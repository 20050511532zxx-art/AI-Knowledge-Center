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
// syncCase 第 4 个参数会传"section.title（API 原文）"，
// 用于在算 expectedOrder.name 时和 syncCase 算 imageFile 完全一致
// → 保证截图脚本生成的 finalFile 和 syncCase 写 .md 引用的 imageFile 同名
let apiTitleOverride = process.argv[5] || null;


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


// "AI项目定级"标题可能在文档最顶部（rect.top 很小），
// 需豁免 top 限制，否则"定级标题在最前"的文档（如跨境运营部）会漏识别
const isMainTitle =
clean.endsWith("AI项目定级");


// 只取正文区域中的"小标题节点"
if (
    rect.left > 620
    &&
    rect.top > 200
    &&
    rect.height >= 25
    &&
    (
        rect.height < 50
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
    item.text.endsWith("AI项目定级")
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

    // 优先用 syncCase 传过来的 section.title（API 原文）算文件名，
    // 这样最终生成的 finalFile 跟 syncCase 写的 .md 引用 100% 一致
    // 没有 apiTitleOverride 时回退到 DOM 抓的 item.text
    const titleForName =
    apiTitleOverride ? apiTitleOverride : item.text;

    return {
        key:key,
        name:`${String(index+1).padStart(2,"0")}_${titleForName.replace(/[\/\\:*?"<>|]/g,"")}`
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

// 部门前置内容 是 syncCase 合成出来的虚拟标题，飞书 DOM 里抓不到
// 任何路径都不能把它当孤儿删掉
validImageNames.add("00_部门前置内容.png");

// 清理失效旧图片
// ⚠️ 暂不启用：validImageNames 用 DOM 算的图名，syncCase .md 引用用 API 算的图名
// 两者字符串源不同（DOM vs API），如果按 validImageNames 清孤儿，会误杀
// syncCase 实际引用的图，造成 .md 404
// 如需清理旧图，请手动删除 content/images/feishu/{imageDir}/ 下的文件
/*
if (headings.length > 0) {

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
*/

// =====================================================
// 部门前置内容 特判（同步脚本侧会传 targetSection="部门前置内容"）
// 飞书里没有这个真标题——它对应"文档开头到第一个真标题之间的内容"
// 这里独立截一张图，命名 00_部门前置内容.png，再清掉孤儿
// =====================================================
if (
    targetSection === "部门前置内容"
    && headings.length > 0
) {

    const overviewStart = 0;
    const overviewEnd = headings[0].top;
    const overviewFile = path.join(
        `./content/images/feishu/${imageDir}`,
        "00_部门前置内容.png"
    );

    console.log(
        "\n[部门前置内容]",
        "范围:",
        overviewStart,
        "→",
        overviewEnd
    );

    const overTempDir = path.join(
        "./content/images/feishu",
        `${imageDir}__overview_tmp`
    );

    if (
        fs.existsSync(overTempDir)
    ) {
        fs.rmSync(
            overTempDir,
            { recursive: true, force: true }
        );
    }

    fs.mkdirSync(
        overTempDir,
        { recursive: true }
    );

    let overCur = overviewStart;
    let overPart = 1;
    let overPieces = [];
    let overFinalHeight = 0;

    while (
        overCur < overviewEnd
    ) {

        await page.evaluate(
            ([selector, target]) => {

                document.querySelector(selector).scrollTop = target;

            },
            [
                containerSelector,
                overCur
            ]
        );

        await page.waitForTimeout(700);

        const st = await page.evaluate(
            selector => {

                const el = document.querySelector(selector);
                const r = el.getBoundingClientRect();

                return {
                    actualScroll: el.scrollTop,
                    viewportTop: r.top,
                    viewportHeight: el.clientHeight
                };

            },
            containerSelector
        );

        const off = Math.max(
            0,
            overCur - st.actualScroll
        );

        const avail = st.viewportHeight - off;
        const remain = overviewEnd - overCur;
        const capH = Math.floor(
            Math.min(
                avail,
                remain
            )
        );

        if (capH <= 0) {
            break;
        }

        const tempFile = path.join(
            overTempDir,
            `${String(overPart).padStart(3, "0")}.png`
        );

        await page.screenshot({

            path: tempFile,

            clip: {

                x: CAPTURE_X,
                y: st.viewportTop + off,
                width: CAPTURE_WIDTH,
                height: capH

            }

        });

        overPieces.push({
            file: tempFile,
            height: capH
        });
        overPart++;

        if (
            overCur + capH >= overviewEnd
        ) {
            break;
        }

        overCur += capH - OVERLAP;

    }

    // 拼接
    if (overPieces.length > 0) {

        const composeInputs = [];

        for (let p = 0; p < overPieces.length; p++) {

            const meta = await sharp(
                overPieces[p].file
            ).metadata();
            const metaH = meta.height;

            if (p === 0) {

                composeInputs.push({

                    input: await sharp(overPieces[p].file).png().toBuffer(),
                    top: overFinalHeight,
                    left: 0

                });

                overFinalHeight += metaH;

            } else {

                const cropTop = Math.min(
                    OVERLAP,
                    metaH - 1
                );
                const cropH = metaH - cropTop;

                if (cropH > 0) {

                    composeInputs.push({

                        input: await sharp(overPieces[p].file)
                            .extract({ left: 0, top: cropTop, width: meta.width, height: cropH })
                            .png()
                            .toBuffer(),
                        top: overFinalHeight,
                        left: 0

                    });

                    overFinalHeight += cropH;

                }
            }
        }

        await sharp({

            create: {

                width: CAPTURE_WIDTH,
                height: overFinalHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }

            }

        })
        .composite(composeInputs)
        .png()
        .toFile(overviewFile);

        console.log(
            "✅ 部门前置内容生成:",
            overviewFile
        );

    }

    fs.rmSync(
        overTempDir,
        { recursive: true, force: true }
    );

    // 正常用户场景下，进程结束放在最底部 await context.close() 那里

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
const tgtNorm = targetSection ? targetSection.replace(/\s+/g, "") : "";
const sectionNorm = section.text.replace(/\s+/g, "");
if(targetSection && sectionNorm !== tgtNorm){
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
    const finalFile = path.join(
        `./content/images/feishu/${imageDir}`,
        `${section.name}.png`
    );
    fs.mkdirSync(
        `./content/images/feishu/${imageDir}`,
        {
            recursive: true
        }
    );
    // 先删除旧文件（如果有）
    if (fs.existsSync(finalFile)) {
        fs.unlinkSync(finalFile);
        console.log("🗑 删除旧图片:", finalFile);
    }
    fs.copyFileSync(outputFile, finalFile);
    console.log("✅ 覆盖正式图片:", finalFile);
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


// =====================================================
// .md 图片引用自愈（只修当前 imageDir 的 .md）
// 作用：syncCase 跑完后，磁盘上 png 可能改了名（如 00_部门前置内容.png 新增）
// 这里的脚本扫本部门的 .md，把 image 引用对齐到磁盘上真实存在的 png
// 这样下次 syncCase .md 已经对了，不会再"显示老图"
// =====================================================

(function selfhealMd() {

    const depts = JSON.parse(
        fs.readFileSync(
            "./feishu_departments.json",
            "utf-8"
        )
    );

    const dept =
    depts.find(
        d =>
            d.imageDir === imageDir
    );

    if (!dept) {

        console.log(
            "[自愈] 找不到 imageDir 对应部门，跳过 .md 自愈"
        );

        return;

    }

    const department =
    dept.department;

    const aiDir =
    "./content/AI案例库";


    // 找 .md 目录（1 级或 2 级）
    const possibleDirs = [
        path.join(aiDir, department)
    ];

    const mdFiles = [];

    for (const d of possibleDirs) {

        if (!fs.existsSync(d)) continue;

        const entries = fs.readdirSync(
            d,
            { withFileTypes: true }
        );

        for (const e of entries) {

            if (
                e.isFile()
                &&
                e.name.endsWith(".md")
            ) {

                mdFiles.push(
                    path.join(d, e.name)
                );

            } else if (e.isDirectory()) {

                // 2 级目录（如 专项案例/旺店通API自动化解决案例）
                const sub = path.join(d, e.name);

                for (const f of fs.readdirSync(sub)) {

                    if (f.endsWith(".md")) {

                        mdFiles.push(
                            path.join(sub, f)
                        );

                    }
                }
            }
        }
    }

    const imgDir = path.join(
        "./content/images/feishu",
        imageDir
    );

    if (!fs.existsSync(imgDir)) {

        return;

    }

    const actualNames = new Set(
        fs.readdirSync(imgDir)
            .filter(
                f =>
                    f.toLowerCase()
                    .endsWith(".png")
            )
    );

    let fixed = 0;
    let checked = 0;
    const stripPrefix =
    s =>
        s.replace(
            /^[一二三四五六七八九十]+、/,
            ""
        );


    for (const mdFile of mdFiles) {

        let content;
        try {

            content = fs.readFileSync(
                mdFile,
                "utf-8"
            );

        } catch (e) {

            continue;

        }

        let changed = false;
        const mdBase = path
            .basename(mdFile)
            .replace(/\.md$/, "");

        const re = new RegExp(
            `!\\[\\]\\(/images/feishu/${imageDir}/([^)]+\\.png)\\)`,
            "g"
        );

        content = content.replace(
            re,
            (full, fileName) => {

                checked++;

                if (actualNames.has(fileName)) {

                    return full;

                }

                // 不存在 → 找磁盘上标题最像 mdBase 的
                let best = null;

                for (const actual of actualNames) {

                    const actualTitle =
                    actual
                    .replace(/^\d+_/, "")
                    .replace(/\.png$/, "");

                    if (
                        actualTitle === mdBase
                        || stripPrefix(actualTitle) === stripPrefix(mdBase)
                    ) {

                        best = actual;
                        break;

                    }
                }

                if (
                    best
                    &&
                    best !== fileName
                ) {

                    fixed++;
                    changed = true;

                    return `![](/images/feishu/${imageDir}/${best})`;

                }

                return full;

            }
        );

        if (changed) {

            fs.writeFileSync(
                mdFile,
                content,
                "utf-8"
            );

            console.log(
                "  [自愈]",
                path.basename(mdFile),
                "→",
                "图片引用已对齐"
            );

        }
    }

    console.log(
        `\n[自愈] 检查 ${checked} 个图片引用, 修正 ${fixed} 个 .md`
    );

})();


await context.close();