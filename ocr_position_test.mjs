import { createWorker } from "tesseract.js";


const image =
"./content/images/feishu/customer_full.png";


const worker =
await createWorker("chi_sim");


console.log("开始OCR");


const result =
await worker.recognize(
    image,
    {},
    {
        tsv:true
    }
);

console.log(
    Object.keys(result)
);

console.log(
    Object.keys(result.data)
);

console.log(
    result.data
);

await worker.terminate();



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
        width:Number(arr[8]),
        height:Number(arr[9])
    };

})
.filter(
    item=>item.text
);

console.log(words.slice(0,20));

console.log(
"识别数量:",
words.length
);



const keywords=[

"客服AI项目定级",
"客服聊天记录质检分析",
"AI外呼系统",
"多平台退款率分析软件",
"探域机器人",
"跨境进口退款核对工具",
"亚马逊发货物流查询AI",
"大疆激活查询软件",
"长租售后查询关联订单筛选",
"美客多跟单软件",
"跨境韩国本土店退货跟单软件",
"微信聊天记录分析系统"

];



for(const key of keywords){

    const result =
    words.find(
        w =>
        w.text.includes(
            key.substring(0,4)
        )
    );


    if(result){

        console.log(
            "找到:",
            key,
            "Y:",
            result.bbox.y0
        );

    }
    else{

        console.log(
            "没找到:",
            key
        );

    }

}