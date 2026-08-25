#!/usr/bin/env node
// 飞书 md 图片引用自愈脚本
// 用途：扫描 .md 里引用的图片文件名，如果磁盘上找不到，就用磁盘上真实存在的同名/相近文件修正
// 不依赖 syncCase 或截图脚本，纯被动对照

import fs from "fs";
import path from "path";

const DEPT_JSON = "./feishu_departments.json";
const AI_DIR = "./content/AI案例库";
const IMG_ROOT = "./content/images/feishu";

const depts = JSON.parse(fs.readFileSync(DEPT_JSON, "utf-8"));

let fixedCount = 0;
let checkedCount = 0;
let missingReport = [];

for (const dept of depts) {
    const { imageDir, department } = dept;

    const imgDir = path.join(IMG_ROOT, imageDir);
    if (!fs.existsSync(imgDir)) {
        continue;
    }

    // 实际磁盘上的图片文件名集合
    const actualNames = new Set(
        fs.readdirSync(imgDir)
            .filter(f => f.toLowerCase().endsWith(".png"))
    );

    // 找 .md 目录：可能在 content/AI案例库/<department> 或其下任一子目录
    const possibleMdDirs = [
        path.join(AI_DIR, department)
    ];

    // 找所有 .md
    const mdFiles = [];
    for (const d of possibleMdDirs) {
        if (!fs.existsSync(d)) continue;
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
            if (e.isFile() && e.name.endsWith(".md")) {
                mdFiles.push(path.join(d, e.name));
            } else if (e.isDirectory()) {
                // 2 级子目录（专项案例/旺店通API自动化解决案例 等）
                const sub = path.join(d, e.name);
                for (const f of fs.readdirSync(sub)) {
                    if (f.endsWith(".md")) {
                        mdFiles.push(path.join(sub, f));
                    }
                }
            }
        }
    }

    for (const mdFile of mdFiles) {
        let content = fs.readFileSync(mdFile, "utf-8");
        let changed = false;
        const imgUrlPattern = new RegExp(
            `!\\[\\]\\(/images/feishu/${imageDir}/([^)]+\\.png)\\)`,
            "g"
        );
        const mdName = path.basename(mdFile);

        content = content.replace(imgUrlPattern, (full, fileName) => {
            checkedCount++;
            if (actualNames.has(fileName)) {
                return full;
            }

            // 不存在 → 找磁盘上编号/标题最接近的
            // 提取 md 文件名里可能的章节号
            const mdBase = mdName.replace(/\.md$/, "");
            // 在磁盘文件中找标题最像 mdBase 的
            let bestMatch = null;
            for (const actualName of actualNames) {
                // 去掉前缀序号
                const actualTitle = actualName.replace(/^\d+_/, "").replace(/\.png$/, "");
                if (actualTitle === mdBase) {
                    bestMatch = actualName;
                    break;
                }
                // 部分匹配：去掉"一、" "二、" 等前缀
                const stripPrefix = s => s.replace(/^[一二三四五六七八九十]+、/, "");
                if (stripPrefix(actualTitle) === stripPrefix(mdBase)) {
                    bestMatch = actualName;
                    break;
                }
            }

            if (bestMatch && bestMatch !== fileName) {
                fixedCount++;
                changed = true;
                return `![](/images/feishu/${imageDir}/${bestMatch})`;
            }

            missingReport.push({
                md: mdFile,
                wanted: fileName,
                imageDir
            });
            return full;
        });

        if (changed) {
            fs.writeFileSync(mdFile, content, "utf-8");
        }
    }
}

console.log("\n========== .md 图片引用自愈 ==========");
console.log("检查总数:", checkedCount);
console.log("修复成功:", fixedCount);
if (missingReport.length > 0) {
    console.log("\n以下 .md 引用了磁盘上不存在的图片，且未找到替代：");
    for (const m of missingReport) {
        console.log(`  ${m.imageDir}  ${m.wanted}  ←  ${m.md}`);
    }
}
console.log("=====================================\n");
