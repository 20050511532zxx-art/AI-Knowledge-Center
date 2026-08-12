import fs from "fs";
import path from "path";

const CONTENT_DIR = "./content/AI案例库";
const IMAGE_ROOT = "./content/images/feishu";

function walk(dir) {
    let results = [];

    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) {
            results.push(...walk(full));
        } else {
            results.push(full);
        }
    }

    return results;
}

const mdFiles = walk(CONTENT_DIR)
    .filter(file => file.endsWith(".md"));

const imageDirs = fs.readdirSync(IMAGE_ROOT)
    .filter(name => {
        const full = path.join(IMAGE_ROOT, name);
        return fs.statSync(full).isDirectory()
            && !name.startsWith("temp_")
            && !name.endsWith("_temp");
    });

let fixedCount = 0;

for (const mdFile of mdFiles) {

    let content = fs.readFileSync(mdFile, "utf8");

    const titleMatch = content.match(/^title:\s*(.+)$/m);

    if (!titleMatch) {
        continue;
    }

    const title = titleMatch[1].trim();

    let matchedImage = null;
    let matchedDir = null;

    for (const imageDir of imageDirs) {

        const fullDir = path.join(IMAGE_ROOT, imageDir);

        const images = fs.readdirSync(fullDir)
            .filter(name => name.toLowerCase().endsWith(".png"));

        const safeTitle = title.replace(/[\/\\:*?"<>|]/g, "");

        const found = images.find(name => {
            const base = path.basename(name, ".png");

            return (
                base.endsWith("_" + safeTitle)
                ||
                base.includes(safeTitle)
            );
        });

        if (found) {
            matchedImage = found;
            matchedDir = imageDir;
            break;
        }
    }

    if (!matchedImage) {
        console.log("未找到对应图片:", title);
        continue;
    }

    const newImageLine =
        `![](/images/feishu/${matchedDir}/${matchedImage})`;

    const oldContent = content;

    if (/!\[\]\([^)]+\)/.test(content)) {
        content = content.replace(
            /!\[\]\([^)]+\)/,
            newImageLine
        );
    } else {
        content += `\n\n${newImageLine}\n`;
    }

    if (content !== oldContent) {
        fs.writeFileSync(mdFile, content, "utf8");

        console.log(
            "✅ 修复:",
            title,
            "→",
            `${matchedDir}/${matchedImage}`
        );

        fixedCount++;
    }
}

console.log("");
console.log("==============================");
console.log("修复完成");
console.log("共修复:", fixedCount, "个 md 文件");
console.log("==============================");