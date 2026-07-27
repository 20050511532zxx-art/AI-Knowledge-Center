import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const root =
path.resolve(
    __dirname,
    ".."
);


// 输出文件

const outputPath =
path.join(
    root,
    ".runtime",
    "ai-monitor",
    "new-ai-tools.json"
);


// 已有数据库

const databasePath =
path.join(
    root,
    "automation",
    "ai-tools-database.json"
);



console.log(
    "START: Discover new AI tools"
);



const database =
JSON.parse(
    fs.readFileSync(
        databasePath,
        "utf8"
    )
);



const existingNames =
database.tools.map(
    item => item.name.toLowerCase()
);



// 发现来源

const sources = [

{
name:"Product Hunt AI",
url:"https://www.producthunt.com/topics/artificial-intelligence"
},

{
name:"HuggingFace Trending",
url:"https://huggingface.co/models?sort=trending"
},

{
name:"AI News",
url:"https://www.artificialintelligence-news.com/"
}

];



const browser =
await chromium.launch({
    headless:true
});


const page =
await browser.newPage();



let discoveries = [];



for(const source of sources){


console.log(
"Scanning:",
source.name
);



try{


await page.goto(
source.url,
{
waitUntil:"domcontentloaded",
timeout:60000
}
);


await page.waitForTimeout(5000);



const text =
await page.evaluate(()=>{

return document.body.innerText
.replace(/\s+/g," ")
.slice(0,5000);

});



discoveries.push({

source:source.name,

content:text,

time:
new Date().toISOString()

});


}

catch(e){

console.log(
"Failed:",
source.name
);

}


}



await browser.close();



// 过滤结果

const result = {

date:
new Date().toISOString(),


existingTools:
existingNames,


discoveries

};



fs.mkdirSync(

path.dirname(outputPath),

{
recursive:true
}

);



fs.writeFileSync(

outputPath,

JSON.stringify(
result,
null,
2
),

"utf8"

);



console.log(
"New AI tools discovery completed"
);


console.log(
outputPath
);