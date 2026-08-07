import sharp from "sharp";
import fs from "fs";


const input =
"./content/images/feishu/customer_full.png";


const outputDir =
"./content/images/feishu/customer_cases";


// 清空目录

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
// 根据你的长图结构固定切割
// =====================


// 这里存标题开始位置
// 后续只需要调整这里

const sections=[


{
name:"01_客服AI项目定级",
start:0
},


{
name:"02_客服聊天记录质检分析",
start:1300
},


{
name:"03_AI外呼系统",
start:3000
},


{
name:"04_多平台退款率分析软件",
start:5000
},


{
name:"05_探域机器人使用情况",
start:7000
},


{
name:"06_跨境进口退款核对工具",
start:9000
},


{
name:"07_亚马逊发货物流查询AI",
start:11000
},


{
name:"08_大疆激活查询软件",
start:13000
},


{
name:"09_长租售后查询关联订单筛选",
start:15000
},


{
name:"10_美客多跟单软件",
start:17000
},


{
name:"11_跨境韩国本土店退货跟单软件",
start:19000
},


{
name:"12_微信聊天记录分析系统",
start:21000
}

];





const meta =
await sharp(input)
.metadata();



for(
let i=0;
i<sections.length;
i++
){


const start =
sections[i].start;



const end =
sections[i+1]
?
sections[i+1].start
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