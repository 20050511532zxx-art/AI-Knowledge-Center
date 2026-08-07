import sharp from "sharp";

const info = await sharp(
"./content/images/feishu/customer_full.png"
).metadata();

console.log(info);