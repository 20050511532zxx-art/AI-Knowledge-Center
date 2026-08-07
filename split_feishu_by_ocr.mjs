import sharp from "sharp";
import { createWorker } from "tesseract.js";
import fs from "fs";


// =====================
// 路径
// =====================

const input =
"./content/images/feishu/customer_full.png";


const outputDir =
"./content/images/feishu/customer_cases";



// =====================
// 清空旧结果
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
// OCR解析
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
.map(
([y,text])=>({

    y:Number(y),

    text:text
    .join("")
    .replace(/\s/g,"")

})
)
.sort(
(a,b)=>a.y-b.y
);



console.log(
textLines.slice(0,60)
);






// =====================
// 章节配置
// =====================


const chapters=[

{
key:"一",
name:"02_客服聊天记录质检分析"
},

{
key:"二",
name:"03_AI外呼系统"
},

{
key:"三",
name:"04_多平台退款率分析软件"
},

{
key:"四",
name:"05_探域机器人使用情况"
},

{
key:"五",
name:"06_跨境进口退款核对工具"
},

{
key:"六",
name:"07_亚马逊发货物流查询AI"
},

{
key:"七",
name:"08_大疆激活查询软件"
},

{
key:"八",
name:"09_长租售后查询关联订单筛选"
},

{
key:"九",
name:"10_美客多跟单软件"
},

{
key:"十",
name:"11_跨境韩国本土店退货跟单软件"
},

{
key:"十一",
name:"12_微信聊天记录分析系统"
}

];





// =====================
// 标题位置
// =====================


let sections=[];


// 第一个固定

sections.push({

name:"01_客服AI项目定级",

y:0

});





for(const item of chapters){


const hit =

textLines.find(line=>{


let t =
line.text;


// 只找章节编号

return (

t.includes(item.key+"、")

||

t.includes(item.key+".")

);


});



if(hit){


console.log(
"找到:",
item.name,
hit.y
);



sections.push({

name:item.name,

y:hit.y

});



}else{


console.log(
"未找到:",
item.name
);


}

}





// =====================
// 排序
// =====================


sections.sort(
(a,b)=>a.y-b.y
);



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



const start =
sections[i].y;



const end =

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
"全部切割完成"
);