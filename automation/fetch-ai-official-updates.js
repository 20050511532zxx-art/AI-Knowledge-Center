import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const root = path.resolve(__dirname, "..");


// ================================
// AI工具数据库
// ================================

const configPath =
path.join(
    root,
    "automation",
    "ai-tools-database.json"
);


if (!fs.existsSync(configPath)) {

    console.error(
        "AI tools database not found:"
    );

    console.error(configPath);

    process.exit(1);

}


const config =
JSON.parse(
    fs.readFileSync(
        configPath,
        "utf8"
    )
);



const targets =
config.tools
.map(tool => ({

    name: tool.name,

    url: tool.official_url

}))
.filter(
    item => item.url
);



// ================================
// 输出路径
// ================================

const outputPath =
path.join(
    root,
    ".runtime",
    "ai-monitor",
    "official-updates.json"
);



// ================================
// 主程序
// ================================

async function main(){


console.log(
    "START: AI news extractor"
);



console.log(
    "Loaded AI tools:",
    targets.length
);



const browser =
await chromium.launch({

    headless:true

});



const page =
await browser.newPage();



let results = [];



// ================================
// 循环抓取
// ================================

for(const item of targets){


console.log(
    "Scanning:",
    item.name
);



try{


await page.goto(

    item.url,

    {
        waitUntil:"domcontentloaded",

        timeout:60000
    }

);



await page.waitForTimeout(5000);



const data =
await page.evaluate(()=>{


let title =
document.title;



let text =
document.body.innerText
.replace(/\s+/g," ")
.slice(0,3000);



return {

    title,

    text

};


});



results.push({

    name:item.name,

    url:item.url,

    title:data.title,

    summary:data.text,

    time:
    new Date().toISOString(),

    status:"success"


});



}



catch(e){



results.push({

    name:item.name,

    url:item.url,

    status:"failed",

    error:e.message,

    time:
    new Date().toISOString()

});


}



}



// ================================
// 保存结果
// ================================


await browser.close();



fs.mkdirSync(

    path.dirname(outputPath),

    {
        recursive:true
    }

);



fs.writeFileSync(

    outputPath,

    JSON.stringify(

        results,

        null,

        2

    ),

    "utf8"

);



console.log(
"AI news extractor completed"
);



console.log(
outputPath
);



}



main();