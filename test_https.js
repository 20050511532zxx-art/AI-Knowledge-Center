import https from "https";
import { HttpsProxyAgent } from "https-proxy-agent";


const proxy = "http://127.0.0.1:7897";


const agent = new HttpsProxyAgent(proxy);



https.get(

"https://api.openai.com",

{
    agent: agent
},


(res)=>{


console.log(
"状态码:",
res.statusCode
);


res.on(
"data",
data=>{
console.log(data.toString());
});


}


).on(

"error",

err=>{


console.log(
"连接失败"
);


console.log(err);


}

);