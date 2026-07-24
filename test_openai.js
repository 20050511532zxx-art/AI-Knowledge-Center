import OpenAI from "openai";
import dotenv from "dotenv";


dotenv.config();


const client = new OpenAI({

    apiKey: process.env.OPENAI_API_KEY,

    timeout: 120000

});


async function test(){


try{


const res =
await client.chat.completions.create({

model:"gpt-4o-mini",


messages:[

{
role:"user",
content:"你好，请回复一句测试成功"
}

]


});


console.log(
res.choices[0].message.content
);


}

catch(error){

console.log("失败");
console.log(error);

}


}


test();