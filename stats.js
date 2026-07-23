import fs from "fs";
import path from "path";

const folder = "./content/AI工具档案";

let count = 0;


function scan(dir){

    const items = fs.readdirSync(dir);

    items.forEach(item=>{

        const full = path.join(dir,item);

        const stat = fs.statSync(full);


        if(stat.isDirectory()){

            scan(full);

        }
        else if(item.endsWith(".md")){

            count++;

        }

    });

}


scan(folder);


const output = `
## 📊 工具统计

- 已收录工具：${count} 个

- 最近更新：
${new Date().toISOString().slice(0,10)}

- 覆盖领域：

  - 企业办公
  - 电商运营
  - 数据分析
  - 内容生产
  - 自动化流程
`;


fs.writeFileSync(
"./content/AI工具统计.md",
output
);


console.log(
"统计完成，共",
count,
"个工具"
);