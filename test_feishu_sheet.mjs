import { screenshotFeishuSheet } from "./feishu_sheet_screenshot.mjs";


const url =
"https://feishu.cn/sheets/Q2pKsaAdUhw5JStYjlMcIaX1nFj_pzwD7N";


await screenshotFeishuSheet(
    url,
    "测试在线表格"
);