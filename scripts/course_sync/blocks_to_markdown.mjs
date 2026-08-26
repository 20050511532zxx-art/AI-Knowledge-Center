// blocks_to_markdown.mjs
// 飞书 docx blocks → Markdown 转换器（基于实测 API 响应）
//
// 真实 block_type 映射（来自 Codex 文档实测）：
//   1  = Page        (整篇标题，写到 frontmatter)
//   2  = Text        (普通段落)
//   3  = H1 (飞书没有 H1，本字段实测不存在，保留兼容)
//   4  = Heading2
//   5  = Heading3
//   6  = Heading4
//   7-9 = H5-H7 (实测不存在)
//   10 = Quote (老版本，实测这里是 15)
//   12 = Bullet
//   13 = Ordered
//   14 = Code
//   15 = Quote
//   17 = Callout
//   19 = Image
//   20 = Table (老版本，实测这里是 31)
//   22 = Divider
//   31 = Table
//   32 = TableCell

// 提取一个 text-elements 数组的纯文本，含行内链接
function extractInlineText(elements) {
    if (!Array.isArray(elements)) return "";
    return elements.map(el => {
        const run = el.text_run;
        if (!run) return "";
        let content = run.content || "";
        const link = run.text_element_style && run.text_element_style.link;
        if (link && link.url) {
            // 飞书 link URL 经常是双重 URL-encoded（%3A → %253A），先解码
            let url = link.url;
            try { url = decodeURIComponent(url); } catch (e) {}
            content = `[${content}](${url})`;
        }
        return content;
    }).join("");
}

// 提取某个 block 的纯文本
function blockText(block) {
    if (!block) return "";
    for (const key of [
        "text", "heading1", "heading2", "heading3", "heading4",
        "heading5", "heading6", "heading7", "heading8", "heading9",
        "bullet", "ordered", "quote", "callout", "todo"
    ]) {
        if (block[key] && Array.isArray(block[key].elements)) {
            return extractInlineText(block[key].elements);
        }
    }
    return "";
}

// 提取 code block 内容（含 language）
function extractCode(block) {
    if (!block.code) return { lang: "text", code: "" };
    const lang = block.code.language || "text";
    const code = (block.code.elements || []).map(e => e.text_run ? e.text_run.content : "").join("");
    return { lang, code };
}

// 把 cell block 里的内容拍平成字符串
function extractCellText(cellBlock) {
    if (!cellBlock) return "";
    const children = cellBlock.children || [];
    if (children.length === 0) {
        // 兼容：cell 本身就是文本块
        return blockText(cellBlock);
    }
    return children.map(cid => {
        const child = arguments[1] && arguments[1][cid];
        if (!child) return "";
        return blockText(child);
    }).filter(s => s).join("<br>");
}

// 渲染表格为 markdown
function renderTable(tableBlock, blockMap) {
    const props = tableBlock.table && tableBlock.table.property;
    if (!props) return "";
    const rowCount = props.row_size || 0;
    const colCount = props.column_size || 0;
    if (rowCount === 0 || colCount === 0) return "";

    // 飞书表格 cell 顺序：行优先，cell 的 children 是 cell 内部 block id
    // 拿 cell block（block_type 32），它们的 parent_id 是 table block id
    // 顺序：按 children 顺序遍历 cell，每个 cell 取它的 children 文本
    const cellIds = tableBlock.children || [];
    const cells = cellIds.map(id => blockMap[id]).filter(b => b && b.block_type === 32);

    if (cells.length === 0) return "";

    // 切成行
    const rows = [];
    for (let r = 0; r < rowCount; r++) {
        const row = [];
        for (let c = 0; c < colCount; c++) {
            const cell = cells[r * colCount + c];
            if (!cell) { row.push(""); continue; }
            // cell 内部 blocks
            const innerIds = cell.children || [];
            const text = innerIds.map(id => blockText(blockMap[id])).filter(s => s).join("<br>");
            row.push(text);
        }
        rows.push(row);
    }

    if (rows.length === 0) return "";

    const out = [];
    out.push("| " + rows[0].map(t => t.replace(/\|/g, "\\|")).join(" | ") + " |");
    out.push("| " + rows[0].map(() => "---").join(" | ") + " |");
    for (let r = 1; r < rows.length; r++) {
        out.push("| " + rows[r].map(t => t.replace(/\|/g, "\\|")).join(" | ") + " |");
    }
    return out.join("\n") + "\n";
}

// 主转换入口
// topBlocks: 顶层 block 数组（parent_id === pageId）
// blockMap: 全部 block 的 id→block 映射（用于解析嵌套）
export function blocksToMarkdown(topBlocks, blockMap) {
    const lines = [];

    for (const block of topBlocks) {
        const t = block.block_type;
        const text = blockText(block);

        if (t === 1) {
            // Page 标题：跳过（用 frontmatter 标题）
            continue;
        } else if (t === 2) {
            // 普通段落
            if (text) lines.push(text + "\n");
        } else if (t === 3 || t === 4) {
            // H1/H2 → 用 ##
            if (text) lines.push(`## ${text}\n`);
        } else if (t === 5) {
            if (text) lines.push(`### ${text}\n`);
        } else if (t === 6) {
            if (text) lines.push(`#### ${text}\n`);
        } else if (t === 7) {
            if (text) lines.push(`##### ${text}\n`);
        } else if (t === 8) {
            if (text) lines.push(`###### ${text}\n`);
        } else if (t === 12) {
            // Bullet
            if (text) lines.push(`- ${text}`);
        } else if (t === 13) {
            // Ordered
            if (text) lines.push(`1. ${text}`);
        } else if (t === 14) {
            // Code
            const { lang, code } = extractCode(block);
            lines.push("```" + lang + "\n" + code + "\n```\n");
        } else if (t === 15) {
            // Quote
            if (text) lines.push(`> ${text}\n`);
        } else if (t === 19) {
            // Image：占位
            const fileToken = block.image && block.image.token;
            if (fileToken) {
                lines.push(`<!-- image: ${fileToken} -->`);
            }
        } else if (t === 22) {
            // Divider
            lines.push("\n---\n");
        } else if (t === 31) {
            // Table
            const t = renderTable(block, blockMap);
            if (t) lines.push(t);
        } else {
            // 其他类型：尽量提取文本
            if (text) lines.push(text + "\n");
        }
    }

    return lines.join("\n");
}

// 工具：把 blocks 数组转成 id → block 的 map
export function buildBlockMap(allBlocks) {
    const map = {};
    for (const b of allBlocks) {
        map[b.block_id] = b;
    }
    return map;
}

// 工具：从 blocks 中抽出顶层 block（parent_id 是 page block id）
export function getTopLevelBlocks(allBlocks, pageId) {
    return allBlocks.filter(b => b.parent_id === pageId);
}
