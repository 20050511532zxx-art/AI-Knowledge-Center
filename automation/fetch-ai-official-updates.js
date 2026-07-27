import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const root = path.resolve(__dirname, "..");


const outputPath =
path.join(
root,
".runtime",
"ai-monitor",
"official-updates.json"
);



const targets = [

{
name:"OpenAI",
url:"https://openai.com/news/"
},

{
name:"Anthropic Claude",
url:"https://www.anthropic.com/news"
},

{
name:"Google Gemini",
url:"https://blog.google/technology/ai/"
},

{
name:"Midjourney",
url:"https://www.midjourney.com/news"
},

{
name:"可灵AI Kling",
url:"https://klingai.com/"
},

{
name:"豆包AI",
url:"https://www.doubao.com/"
},

{
name:"即梦AI",
url:"https://jimeng.jianying.com/"
},

{
name:"Runway",
url:"https://runwayml.com/"
},

{
name:"Pika",
url:"https://pika.art/"
},

{
name:"Canva AI",
url:"https://www.canva.com/newsroom/"
},

{
name:"Shopify AI",
url:"https://www.shopify.com/news"
},

{
name:"Amazon AI",
url:"https://www.amazon.science/"
}

];



async function main(){


console.log(
"START: AI news extractor"
);



const browser =
await chromium.launch({
headless:true
});


const page =
await browser.newPage();



let results=[];



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
new Date()
.toISOString(),

status:"success"

});


}

catch(e){


results.push({

name:item.name,

url:item.url,

status:"failed",

error:e.message

});


}


}



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