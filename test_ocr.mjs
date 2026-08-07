import { createWorker } from "tesseract.js";


const worker = await createWorker("chi_sim");


console.log("开始识别...");


const result = await worker.recognize(
"./content/images/feishu/customer_full.png"
);


await worker.terminate();


console.log(
result.data.text
);