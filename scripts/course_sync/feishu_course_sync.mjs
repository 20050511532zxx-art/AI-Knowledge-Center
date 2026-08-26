// feishu_course_sync.mjs
// 课程类飞书文档同步脚本（独立流程，不影响 AI 案例库截图系统）
// 用法：node scripts/course_sync/feishu_course_sync.mjs
// 流程：读配置 → 飞书 API 拉 blocks → 转 md → 写文件 → 缓存

import fs from "fs";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";
import {
    blocksToMarkdown,
    buildBlockMap,
    getTopLevelBlocks
} from "./blocks_to_markdown.mjs";

dotenv.config({ path: "./.feishu.env" });

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;

const CONFIG_PATH = "./configs/course_config.json";
const CACHE_PATH = "./caches/course_cache.json";

if (!APP_ID || !APP_SECRET) {
    console.error("❌ 缺少飞书凭据，请检查 .feishu.env");
    process.exit(1);
}

// 取 tenant_access_token
async function getTenantToken() {
    const res = await axios.post(
        "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        { app_id: APP_ID, app_secret: APP_SECRET }
    );
    if (res.data.code !== 0) {
        throw new Error("飞书认证失败: " + res.data.msg);
    }
    return res.data.tenant_access_token;
}

// 飞书 docx API 实际上接受 wiki_token 作为 documentId
// （syncCase 那边也直接用 wiki_token 当 documentId）
// 之前的 /wiki/v2/nodes/{token} endpoint 在新版本已经 404，所以这里直接用 wiki_token
async function getRealDocId(wikiToken) {
    return wikiToken;
}

// 拉全部 blocks（分页）
async function getDocumentBlocks(documentId, token) {
    const blocks = [];
    let pageToken = "";
    while (true) {
        let url = `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks?page_size=500&document_revision_id=-1`;
        if (pageToken) url += `&page_token=${pageToken}`;
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.code !== 0) {
            throw new Error("blocks 拉取失败: " + res.data.msg);
        }
        const data = res.data.data;
        blocks.push(...(data.items || []));
        if (!data.has_more) break;
        pageToken = data.page_token;
    }
    return blocks;
}

// 算内容 hash（用稳定字段：文本、链接、图片 token）
function hashBlocks(blocks) {
    const stable = blocks.map(b => {
        const t = b.block_type;
        const c = b.comment_ids || [];
        // 提取所有 text/elements 的 content + link
        function walk(obj) {
            if (!obj || typeof obj !== "object") return "";
            if (Array.isArray(obj)) return obj.map(walk).join("|");
            if (obj.content) return obj.content;
            if (obj.url) return obj.url;
            let s = "";
            for (const k of Object.keys(obj)) {
                if (k === "block_id" || k === "parent_id" || k === "children") continue;
                s += walk(obj[k]);
            }
            return s;
        }
        return `${t}:${walk(b)}`;
    }).join("\n");
    return crypto.createHash("md5").update(stable).digest("hex");
}

// 同步单个课程
async function syncCourse(course, token) {
    const { name, wiki_token, outputDir, outputFileName, title, description } = course;

    console.log(`\n========== 同步: ${name} ==========`);
    console.log(`wiki_token: ${wiki_token}`);

    // 1. wiki_token 直接作为 docx id
    const docId = await getRealDocId(wiki_token);
    console.log(`docx_id: ${docId}`);

    // 2. 拉 blocks
    const allBlocks = await getDocumentBlocks(docId, token);
    console.log(`blocks 总数: ${allBlocks.length}`);

    // 3. hash 比对缓存
    const cache = loadCache();
    const newHash = hashBlocks(allBlocks);
    const oldHash = cache[wiki_token] ? cache[wiki_token].hash : null;

    if (oldHash === newHash) {
        console.log(`⏭️  无变化，跳过: ${name}`);
        return { name, skipped: true };
    }

    // 4. 转 md
    const blockMap = buildBlockMap(allBlocks);
    // 找 page block（block_type === 1）
    const pageBlock = allBlocks.find(b => b.block_type === 1);
    const pageId = pageBlock ? pageBlock.block_id : null;
    const topBlocks = pageId ? getTopLevelBlocks(allBlocks, pageId) : allBlocks.filter(b => !b.parent_id);

    const mdBody = blocksToMarkdown(topBlocks, blockMap);

    // 5. 加 frontmatter（enableToc: true 启用右侧大纲，桌面端显示）
    const frontmatter = [
        "---",
        `title: ${title || name}`,
        `description: ${description || ""}`,
        `source: feishu-wiki-${wiki_token}`,
        `enableToc: true`,
        `syncedAt: ${new Date().toISOString()}`,
        "---",
        ""
    ].join("\n");

    const finalMd = frontmatter + "\n" + mdBody;

    // 6. 写文件
    const outputPath = path.join("./content", outputDir);
    fs.mkdirSync(outputPath, { recursive: true });
    const mdPath = path.join(outputPath, outputFileName || "index.md");
    fs.writeFileSync(mdPath, finalMd, "utf-8");
    console.log(`✅ 已写入: ${mdPath}`);

    // 7. 更新缓存
    cache[wiki_token] = {
        hash: newHash,
        syncedAt: new Date().toISOString(),
        blockCount: allBlocks.length
    };
    saveCache(cache);

    return { name, skipped: false, mdPath, blockCount: allBlocks.length };
}

function loadCache() {
    if (!fs.existsSync(CACHE_PATH)) return {};
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch (e) {
        return {};
    }
}

function saveCache(cache) {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

// 主流程
async function main() {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    const token = await getTenantToken();
    console.log("✅ 飞书 token 获取成功");

    const results = [];
    for (const course of config.courses) {
        try {
            const r = await syncCourse(course, token);
            results.push(r);
        } catch (e) {
            console.error(`❌ ${course.name} 同步失败:`, e.message);
            results.push({ name: course.name, error: e.message });
        }
    }

    console.log("\n========== 同步结果 ==========");
    for (const r of results) {
        if (r.skipped) console.log(`⏭️  ${r.name}: 跳过`);
        else if (r.error) console.log(`❌ ${r.name}: 失败 - ${r.error}`);
        else console.log(`✅ ${r.name}: ${r.blockCount} blocks → ${r.mdPath}`);
    }
}

main().catch(e => {
    console.error("Fatal:", e);
    process.exit(1);
});
