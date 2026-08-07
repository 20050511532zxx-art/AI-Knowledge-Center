import sharp from "sharp";
import { createWorker } from "tesseract.js";
import fs from "fs";


// =====================
// 文件路径
// =====================

const input =
"./content/images/feishu/customer_full.png";


const outputDir =
"./content/images/feishu/customer_cases";




// =====================
// 清空旧图片
// =====================

if(fs.existsSync(outputDir)){

    fs.readdirSync(outputDir)
    .forEach(file=>{
        fs.unlinkSync(
            `${outputDir}/${file}`
        );
    });

}else{

    fs.mkdirSync(
        outputDir,
        {
            recursive:true
        }
    );

}




// =====================
// OCR
// =====================

console.log("开始OCR");


const worker =
await createWorker("chi_sim");


const result =
await worker.recognize(
    input,
    {},
    {
        tsv:true
    }
);


await worker.terminate();


console.log("OCR完成");




// =====================
// OCR行整理
// =====================


const words =
result.data.tsv
.split("\n")
.slice(1)
.map(row=>{

    const arr=row.split("\t");


    return {

        text:arr[11],

        y:Number(arr[7])

    };

})
.filter(
x=>x.text
);



const lines={};



for(const w of words){


    const key =
    Math.floor(w.y/10)*10;


    if(!lines[key]){

        lines[key]=[];

    }


    lines[key].push(w.text);


}



const textLines =

Object.entries(lines)

.map(([y,text])=>{


return {

    y:Number(y),

    text:text
    .join("")
    .replace(/\s/g,"")

};


})

.sort(
(a,b)=>a.y-b.y
);





// =====================
// 章节名称
// =====================


const chapterNames=[

"02_客服聊天记录质检分析",

"03_AI外呼系统",

"04_多平台退款率分析软件",

"05_探域机器人使用情况",

"06_跨境进口退款核对工具",

"07_亚马逊发货物流查询AI",

"08_大疆激活查询软件",

"09_长租售后查询关联订单筛选",

"10_美客多跟单软件",

"11_跨境韩国本土店退货跟单软件",

"12_微信聊天记录分析系统"

];



// 中文数字顺序

const numbers=[

"一",
"二",
"三",
"四",
"五",
"六",
"七",
"八",
"九",
"十",
"十一"

];





// =====================
// 第一章
// =====================


let sections=[

{
name:"01_客服AI项目定级",
y:0
}

];





// =====================
// 顺序寻找章节
// =====================


let startIndex=0;



for(
let i=0;
i<numbers.length;
i++
){


    let target =
    numbers[i];



    let found=null;



    for(
    let j=startIndex;
    j<textLines.length;
    j++
    ){



        const line =
        textLines[j];



        // 跳过顶部表格

        if(line.y<1000){

            continue;

        }



        let text =
        line.text;



        // OCR清理

        text =
        text.replace(
            /[，。；：]/g,
            ""
        );




        // 判断编号

        let ok=false;



        if(
            text.startsWith(target+"、")
            ||
            text.startsWith(target)
            ||
            text.startsWith("、")
        ){

            ok=true;

        }



        if(!ok){

            continue;

        }



        // 防止正文误识别

        if(text.length<5){

            continue;

        }



        found=line;

        break;


    }





    if(found){



        console.log(
            "找到章节:",
            target,
            found.y,
            found.text
        );



        sections.push({

            name:
            chapterNames[i],

            y:
            found.y

        });



        startIndex =
        textLines.indexOf(found)+1;



    }

    else{


        console.log(
            "未找到章节:",
            target
        );


    }



}





// =====================
// 去重排序
// =====================


sections.sort(
(a,b)=>a.y-b.y
);



sections =
sections.filter(
(item,index)=>{


if(index===0){

    return true;

}


return item.y!==sections[index-1].y;


});




console.log(
"最终章节:",
sections
);






// =====================
// 图片切割
// =====================


const meta =
await sharp(input)
.metadata();




for(
let i=0;
i<sections.length;
i++
){



let start =
sections[i].y;



if(i!==0){

    start += 50;

}




let end =
sections[i+1]
?
sections[i+1].y
:
meta.height;




if(end<=start){

    continue;

}




await sharp(input)

.extract({

    left:0,

    top:start,

    width:meta.width,

    height:end-start

})

.png()

.toFile(

`${outputDir}/${sections[i].name}.png`

);



console.log(
"生成:",
sections[i].name
);



}




console.log(
"全部完成"
);