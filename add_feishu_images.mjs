import fs from "fs";
import path from "path";

const mdDir =
"./content/AI案例库/客服部";

const imgDir =
"./content/images/feishu/customer_cases";


const mapping = [
"01_客服AI项目定级.png",
"02_客服聊天记录质检分析.png",
"03_AI外呼系统.png",
"04_多平台退款率分析软件.png",
"05_E店S店亚马逊三平台马帮建退款单软件.png",
"06_探域机器人使用情况.png",
"07_跨境进口退款核对工具.png",
"08_亚马逊发货物流查询AI.png",
"09_大疆激活查询软件.png",
"10_长租售后查询关联订单筛选.png",
"11_美客多跟单软件.png",
"12_跨境韩国本土店退货跟单软件.png",
"13_微信聊天记录分析系统.png"
];


// 获取md
let files = fs.readdirSync(mdDir)
.filter(x=>x.endsWith(".md"))
.filter(x=>x !== "客服+AI数字化解决案例.md");

// 排除文件夹
files.sort((a,b)=>{

let getNum=(name)=>{

let m=name.match(
/^[一二三四五六七八九十]+/
);

if(!m)return 0;

let map={
一:1,
二:2,
三:3,
四:4,
五:5,
六:6,
七:7,
八:8,
九:9,
十:10,
十一:11,
十二:12
};

return map[m[0]]||0;

}

return getNum(a)-getNum(b);

});


// 客服AI项目定级放第一

files=[
files.find(x=>x.includes("客服AI项目定级")),
...files.filter(x=>!x.includes("客服AI项目定级"))
];


console.log(files);


files.forEach((file,index)=>{


let img=mapping[index];


if(!img){
return;
}


let filePath=
path.join(mdDir,file);


let content=
fs.readFileSync(
filePath,
"utf8"
);


// 防止重复

if(content.includes(img)){
console.log("已有图片:",file);
return;
}


// 图片引用

let imageText=
`\n\n![](/images/feishu/customer_cases/${img})\n`;


// 插入正文顶部

// 插入图片到标题下面

let lines = content.split("\n");

let insertIndex = 0;


// 找 frontmatter 结束位置

if(lines[0].trim()==="---"){

    let endIndex = lines.findIndex(
        (line,index)=>index>0 && line.trim()==="---"
    );

    if(endIndex!==-1){
        insertIndex=endIndex+1;
    }

}


// 插入图片

lines.splice(
    insertIndex,
    0,
    "",
    `![](/images/feishu/customer_cases/${img})`,
    ""
);


content = lines.join("\n");



fs.writeFileSync(
filePath,
content,
"utf8"
);


console.log(
"完成:",
file,
"->",
img
);


});


console.log("全部完成");