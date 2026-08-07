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

        x:Number(arr[6]),

        y:Number(arr[7]),

        h:Number(arr[8])

    };


})

.filter(
x=>x.text
);





// =====================
// 找章节标题
// =====================


const rules=[


{
num:"一、",
name:"02_客服聊天记录质检分析"
},


{
num:"二、",
name:"03_AI外呼系统"
},


{
num:"三、",
name:"04_多平台退款率分析软件"
},


{
num:"四、",
name:"05_探域机器人使用情况"
},


{
num:"五、",
name:"06_跨境进口退款核对工具"
},


{
num:"六、",
name:"07_亚马逊发货物流查询AI"
},


{
num:"七、",
name:"08_大疆激活查询软件"
},


{
num:"八、",
name:"09_长租售后查询关联订单筛选"
},


{
num:"九、",
name:"10_美客多跟单软件"
},


{
num:"十、",
name:"11_跨境韩国本土店退货跟单软件"
},


{
num:"十一、",
name:"12_微信聊天记录分析系统"
}


];





let sections=[

{
name:"01_客服AI项目定级",
y:0
}

];





for(const rule of rules){


const hit =

words.find(w=>{


let text =
w.text.replace(/\s/g,"");



// 必须包含编号

if(!text.includes(rule.num)){

    return false;

}



// 必须在正文区域

if(w.y < 1200){

    return false;

}



// 标题字体高度过滤

if(w.h < 25){

    return false;

}



// 标题靠左

if(w.x > 500){

    return false;

}



return true;



});



if(hit){


console.log(
"找到:",
rule.name,
hit.y
);



sections.push({

name:rule.name,

y:hit.y

});



}else{


console.log(
"没找到:",
rule.name
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
"最终:",
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