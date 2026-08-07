import sharp from "sharp";
import fs from "fs";


// 长图路径
const input =
"./content/images/feishu/customer_full.png";


// 输出目录
const outputDir =
"./content/images/feishu/customer_cases";


if(!fs.existsSync(outputDir)){
    fs.mkdirSync(
        outputDir,
        {
            recursive:true
        }
    );
}


// 读取图片信息

const meta =
await sharp(input)
.metadata();


console.log(
    "图片尺寸:",
    meta
);


// 总高度
const height =
meta.height;


// 宽度
const width =
meta.width;



// ========================
// 暂时平均切割测试
// ========================


const parts = 13;


const partHeight =
Math.floor(
    height / parts
);



for(
let i=0;
i<parts;
i++
){


    const top =
    i * partHeight;


    let h =
    partHeight;


    // 最后一张吃掉剩余高度

    if(i===parts-1){

        h =
        height-top;

    }



    await sharp(input)
    .extract({

        left:0,

        top:top,

        width:width,

        height:h

    })
    .png()
    .toFile(

        `${outputDir}/${String(i+1).padStart(2,"0")}.png`

    );


    console.log(
        "完成:",
        i+1
    );

}


console.log(
"全部切割完成"
);