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
// 解析OCR
// =====================


const words =
result.data.tsv
.split("\n")
.slice(1)
.map(row=>{


    const arr =
    row.split("\t");


    return {

        text:arr[11],

        y:Number(arr[7])

    };


})
.filter(
x=>x.text
);





// =====================
// 合并文字行
// =====================


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
// 章节配置
// =====================


const chapters=[


{
num:["一"],
name:"02_客服聊天记录质检分析",
keys:[
"客服",
"聊天",
"记录",
"质检"
]
},


{
num:["二"],
name:"03_AI外呼系统",
keys:[
"AI",
"外呼"
]
},


{
num:["三"],
name:"04_多平台退款率分析软件",
keys:[
"退款",
"分析"
]
},


{
num:["四"],
name:"05_探域机器人使用情况",
keys:[
"探域",
"机器人"
]
},


{
num:["五"],
name:"06_跨境进口退款核对工具",
keys:[
"进口",
"退款"
]
},


{
num:["六"],
name:"07_亚马逊发货物流查询AI",
keys:[
"亚马逊",
"物流"
]
},


{
num:["七"],
name:"08_大疆激活查询软件",
keys:[
"大疆",
"激活"
]
},


{
num:["八"],
name:"09_长租售后查询关联订单筛选",
keys:[
"长租",
"售后"
]
},


{
num:["九"],
name:"10_美客多跟单软件",
keys:[
"美客多",
"跟单"
]
},


{
num:["十"],
name:"11_跨境韩国本土店退货跟单软件",
keys:[
"韩国",
"退货"
]
},


{
num:["十一"],
name:"12_微信聊天记录分析系统",
keys:[
"微信",
"聊天",
"分析"
]
}


];





// =====================
// 第一章节
// =====================


let sections=[

{
name:"01_客服AI项目定级",
y:0
}

];





// =====================
// 查找章节
// =====================


for(const chapter of chapters){


let found=null;



for(const line of textLines){



    // 跳过顶部表格

    if(line.y<1000){

        continue;

    }



    const text =
    line.text;



    // 判断编号

    let hasNum =
    chapter.num.some(
        n =>
        text.startsWith(n)
        ||
        text.startsWith(n+"、")
        ||
        text.startsWith("、")
    );



    if(!hasNum){

        continue;

    }




    // 判断关键词数量

    let count=0;


    for(const key of chapter.keys){


        if(text.includes(key)){

            count++;

        }

    }




    // 至少匹配两个关键词

    if(count>=2){


        found=line;

        break;

    }



}




if(found){


    console.log(
        "找到章节:",
        chapter.name,
        found.y,
        found.text
    );



    sections.push({

        name:chapter.name,

        y:found.y

    });


}else{


    console.log(
        "未找到:",
        chapter.name
    );


}



}






// =====================
// 排序去重
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
// 切割
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



// 标题下移
if(i!==0){

    start += 80;

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