import { spawn, execSync } from "node:child_process";
import fs from "node:fs";

console.log("启动飞书案例同步程序...");

// 自动读取部门配置
const departments = JSON.parse(
  fs.readFileSync("./feishu_departments.json", "utf8")
);

// 自动取得最后一个部门
const lastDepartment = departments[departments.length - 1];

const finishText =
  `准备退出syncCase: ${lastDepartment.name}`;

console.log("本次最后部门:", lastDepartment.name);

let finished = false;
let outputBuffer = "";

const child = spawn(
  process.execPath,
  ["feishu_ai_case_sync.mjs"],
  {
    cwd: process.cwd(),
    stdio: [
      "inherit",
      "pipe",
      "pipe"
    ]
  }
);

// 原样显示同步程序输出
child.stdout.on("data", (data) => {

  const text = data.toString();

  process.stdout.write(text);

  outputBuffer += text;

  // 防止缓存无限增长
  if (outputBuffer.length > 10000) {
    outputBuffer =
      outputBuffer.slice(-10000);
  }

  // 检测最后一个部门已经真正完成
  if (
    !finished &&
    outputBuffer.includes(finishText)
  ) {

    finished = true;

    console.log("");
    console.log("==============================");
    console.log("检测到全部部门同步完成");
    console.log("正在关闭残留浏览器进程...");
    console.log("==============================");

    // 给原程序一点收尾时间
    setTimeout(() => {

      try {

        // Windows：关闭这个 Node 子进程以及它启动的子进程
        execSync(
          `taskkill /PID ${child.pid} /T /F`,
          {
            stdio: "ignore"
          }
        );

      } catch (e) {
        // 进程可能已经自行退出，不视为错误
      }

      console.log("");
      console.log("==============================");
      console.log("飞书同步程序已完成并正常收尾");
      console.log("==============================");

      process.exit(0);

    }, 3000);
  }
});

child.stderr.on("data", (data) => {
  process.stderr.write(data);
});

child.on("error", (err) => {

  console.error(
    "飞书同步程序启动失败：",
    err
  );

  process.exit(1);
});

child.on("exit", (code) => {

  // 如果是我们完成后主动结束的，不算错误
  if (finished) {
    return;
  }

  if (code === 0) {

    console.log("");
    console.log("==============================");
    console.log("飞书同步程序已正常结束");
    console.log("==============================");

    process.exit(0);

  } else {

    console.log("");
    console.log(
      "飞书同步程序异常退出，代码：",
      code
    );

    process.exit(code ?? 1);
  }
});