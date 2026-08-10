import fs from "fs";
import path from "path";


const dir =
"./content/AI案例库/客服部";


const orders = [
["客服AI项目定级",1],
["一、客服聊天记录质检分析",2],
["二、AI外呼系统",3],
["三、多平台退款率分析软件",4],
["四、E店",5],
["五、探域机器人使用情况",6],
["六、跨境进口退款核对工具",7],
["七、亚马逊发货物流查询AI",8],
["八、大疆激活查询软件",9],
["九、长租售后查询关联订单筛选",10],
["十、美客多跟单软件",11],
["十一、跨境韩国本土店退货跟单软件",12],
["十二、微信聊天记录分析系统",13]
];


let files =
fs.readdirSync(dir)
.filter(x=>x.endsWith(".md"));


files.forEach(file=>{


let item =
orders.find(x=>file.includes(x[0]));


if(!item)return;


let filePath =
path.join(dir,file);


let content =
fs.readFileSync(filePath,"utf8");


// 已有order跳过

if(content.includes("order:")){
console.log("已有:",file);
return;
}


content =
content.replace(
"source: 飞书知识库",
`source: 飞书知识库\norder: ${item[1]}`
);


fs.writeFileSync(
filePath,
content,
"utf8"
);


console.log(
"完成:",
file,
item[1]
);


});