import fs from "fs";
import { exec } from "child_process";


console.log("===== Quartz自动监听启动 =====");


const filePath = "./content";


let lastTime = "";


function checkUpdate(){


    let files = [];


    function scan(dir){

        const list = fs.readdirSync(dir);


        for(const item of list){

            const full = dir + "/" + item;

            const stat = fs.statSync(full);


            if(stat.isDirectory()){

                scan(full);

            }else if(full.endsWith(".md")){

                files.push({
                    path:full,
                    time:stat.mtimeMs
                });

            }

        }

    }


    scan(filePath);


    const current = JSON.stringify(files);


    if(lastTime && current !== lastTime){


        console.log("检测到Obsidian内容变化");


        console.log("开始生成Quartz...");


        exec(
            "npx quartz build",
            (error,stdout)=>{


                if(error){

                    console.log(error);
                    return;

                }


                console.log(stdout);

                console.log(
                    "===== Quartz更新完成 ====="
                );


            }
        );


    }


    lastTime=current;


}



setInterval(checkUpdate,3000);


console.log(
    "正在每3秒检查content变化..."
);