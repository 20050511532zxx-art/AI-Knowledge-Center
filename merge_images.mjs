import fs from "fs";
import path from "path";
import sharp from "sharp";


// 图片目录
const imageDir = "./content/images/feishu";


// 获取所有customer截图
const files = fs.readdirSync(imageDir)
.filter(
    f =>
    (
        /^customer_\d+\.png$/.test(f)
        ||
        f === "customer_last.png"
    )
)
.sort(
    (a,b)=>{

        const na =
        a === "customer_last.png"
        ? 9999
        : parseInt(a.match(/\d+/)[0]);


        const nb =
        b === "customer_last.png"
        ? 9999
        : parseInt(b.match(/\d+/)[0]);


        return na-nb;

    }
);


console.log(
    "发现图片:",
    files.length
);


// 读取图片尺寸
let images=[];

for(const file of files){

    const buffer =
    await sharp(
        path.join(imageDir,file)
    )
    .toBuffer();


    const meta =
    await sharp(buffer)
    .metadata();


    images.push({
        buffer,
        width:meta.width,
        height:meta.height
    });
}


// 总高度
const totalHeight =
images.reduce(
    (sum,img)=>sum+img.height,
    0
);


const width =
images[0].width;


// 创建画布
let composites=[];

let y=0;


for(const img of images){

    composites.push({

        input:img.buffer,

        top:y,

        left:0

    });


    y+=img.height;

}


// 输出长图

await sharp({

    create:{

        width,

        height:totalHeight,

        channels:4,

        background:{
            r:255,
            g:255,
            b:255,
            alpha:1
        }

    }

})
.composite(composites)
.png()
.toFile(
    "./content/images/feishu/customer_full.png"
);


console.log(
    "合并完成"
);