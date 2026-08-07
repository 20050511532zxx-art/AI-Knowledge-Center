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

        y:Number(arr[7]),

        h:Number(arr[9])

    };


})
.filter(
x=>x.text
);





// =====================
// 合并行
// =====================


const lines={};


for(const w of words){


    const key =
    Math.floor(w.y/10)*10;


    if(!lines[key]){
        lines[key]=[];
    }


    lines[key].push(w);


}



const textLines =

Object.entries(lines)

.map(([y,list])=>{


    return {

        y:Number(y),

        text:list
        .map(x=>x.text)
        .join("")
        .replace(/\s/g,"")

    };


})


.sort(
(a,b)=>a.y-b.y
);





// =====================
// 章节
// =====================


let sections=[

{
name:"01_客服AI项目定级",
y:0
}

];



// 中文序号

const nums=[

"一、",
"二、",
"三、",
"四、",
"五、",
"六、",
"七、",
"八、",
"九、",
"十、",
"十一"

];




// =====================
// 找章节
// =====================


for(const line of textLines){


    // 跳过表格区域

    if(line.y<1000){
        continue;
    }



    let text =
    line.text;



    // 去空格

    text =
    text.replace(/\s/g,"");



    let index=-1;



    for(let i=0;i<nums.length;i++){


        if(
            text.startsWith(nums[i])
        ){

            index=i;

            break;

        }


    }



    // OCR漏掉“一、”

    if(
        index===-1
        &&
        text.startsWith("、")
        &&
        text.includes("客服")
    ){

        index=0;

    }



    if(index===-1){
        continue;
    }




    // 排除正文误识别

    const bad=[

        "接口",
        "试用",
        "已打通",
        "人工主要",
        "统一字段",
        "数据统一"

    ];



    if(
        bad.some(
            b=>text.includes(b)
        )
    ){

        continue;

    }




    console.log(
        "找到章节:",
        line.y,
        text
    );



    sections.push({

        name:
        `${String(index+2).padStart(2,"0")}_章节${index+1}`,

        y:line.y

    });



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


    return item.y !== sections[index-1].y;

});




console.log(
"最终切割点:",
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
"全部完成"
);