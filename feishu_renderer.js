// =====================================
// 飞书通用递归渲染器 V2
// 第一部分
// =====================================



// =====================================
// 获取文字
// =====================================

function getText(block){

    let text = "";


    function parseElements(elements){

        if(!elements){
            return;
        }


        elements.forEach(
            item=>{


                if(
                    item.text_run
                ){

                    text +=
                    item.text_run.content;

                }


                else if(
                    item.mention
                ){

                    text +=
                    item.mention.text || "";

                }


                else if(
                    item.content
                ){

                    text +=
                    item.content;

                }


            }
        );

    }




    const keys = [

        "text",

        "page",

        "bullet",

        "heading1",

        "heading2",

        "heading3",

        "heading4",

        "heading5"

    ];



    keys.forEach(
        key=>{


            if(
                block[key]
            ){

                parseElements(
                    block[key].elements
                );

            }


        }
    );



    return text.trim();

}






// =====================================
// 根据ID寻找block
// =====================================


function findBlock(
    id,
    blocks
){

    return blocks.find(
        b =>
        b.block_id === id
    );

}




// =====================================
// 获取表格单元格文字
// =====================================


function getCellText(
    cell,
    blocks
){

    let text = "";


    if(
        !cell.children
    ){

        return "";

    }



    cell.children.forEach(
        id=>{


            const child =
            findBlock(
                id,
                blocks
            );


            if(child){

                text +=
                getText(child);

            }


        }
    );



    return text.trim();

}







// =====================================
// 判断是否等级字段
// =====================================


function isLevelText(text){

    if(!text){
        return false;
    }


    return /^[A-Z]$/.test(
        text.trim()
    );

}






// =====================================
// 判断是否分隔符
// =====================================


function isSeparator(text){

    if(!text){
        return false;
    }


    return (
        text === "/" ||
        text === "-" ||
        text === "—"
    );

}






// =====================================
// 自动识别字段列表
// =====================================


function detectFieldGroup(
    children,
    blocks
){

    const result = [];



    for(
        let i = 0;
        i < children.length;
        i++
    ){


        const current =
        children[i];


        const currentText =
        getText(current);



        const next =
        children[i+1];



        const nextText =
        next ?
        getText(next)
        :
        "";



        // 名称 + 等级

        if(
            next &&
            isLevelText(nextText)
        ){

            result.push({

                name:
                currentText,

                level:
                nextText

            });


            i++;


            continue;

        }


        result.push({

            text:
            currentText

        });


    }


    return result;

}

// =====================================
// 第二部分
// renderChildren + renderBlock
// =====================================






// =====================================
// 渲染子节点
// =====================================


function renderChildren(
    block,
    blocks,
    imageMap
){

    if(
        !block.children ||
        block.children.length === 0
    ){

        return "";

    }



    let html = "";



    const children =
    block.children
    .map(
        id =>
        findBlock(
            id,
            blocks
        )
    )
    .filter(Boolean);




    // =====================================
// 飞书表格处理
// block_type 31 = 表格主体
// =====================================

if(
    block.block_type === 31 &&
    block.table
){

    const tableCells =
    block.table.cells
    .map(
        id =>
        findBlock(
            id,
            blocks
        )
    )
    .filter(Boolean);


    html += `

<table class="feishu-table">

<tbody>

`;


    const values = [];


    tableCells.forEach(
        cell=>{

            values.push(
                getCellText(
                    cell,
                    blocks
                )
            );

        }
    );


    const columnSize =
    block.table.property?.column_size || 2;


    for(
        let i = 0;
        i < values.length;
        i += columnSize
    ){

        html += `<tr>`;


        for(
            let j = 0;
            j < columnSize;
            j++
        ){

            html += `
<td>
${values[i+j] || ""}
</td>
`;

        }


        html += `</tr>`;

    }


    html += `

</tbody>

</table>

`;


    return html;

}






    // =====================================
    // 普通内容
    // =====================================


    children.forEach(
    child=>{


        html +=
        renderBlock(
            child,
            blocks,
            imageMap
        );


    }
);



    return html;

}









// =====================================
// 渲染单个block
// =====================================


function renderBlock(
    block,
    blocks,
    imageMap
){

    let html = "";


    const text =
    getText(block);
// =====================================
// 跳过已经特殊处理的内容
// 防止重复渲染
// =====================================

if(
    text.includes("Before-原来业务流程") ||
    text.includes("After-AI工作流程") ||
    text.includes("解决方案：")
){

    return "";

}

if(
    text.startsWith("覆盖部门")
){

    return "";

}
// =====================================
// Before / After 标题识别
// =====================================


if(text){

  if(
    text.includes("Before") ||
    text.includes("原来业务流程")
)
{

return `

<div class="before-title">

${text}

</div>

`;

}



    if(
    text.includes("After") ||
    text.includes("AI工作流程")
)
{

return `

<div class="after-title">

${text}

</div>

`;

}

}
// =====================================
// 飞书双栏布局
// =====================================

if(
    block.children &&
    block.children.length === 2
){

    const left =
    findBlock(
        block.children[0],
        blocks
    );


    const right =
    findBlock(
        block.children[1],
        blocks
    );


    if(
        left &&
        right
    ){

        return `

<div class="feishu-columns">

<div class="feishu-column">

${renderChildren(
    left,
    blocks,
    imageMap
)}

</div>


<div class="feishu-column">

${renderChildren(
    right,
    blocks,
    imageMap
)}

</div>

</div>

`;

    }

}

    // =====================================
    // 飞书高亮卡片识别
    // =====================================

    if(text){

        if(
            text.includes("业务痛点")
        ){

            return `

<div class="ai-card ai-card-yellow">

<h3>⚠️ ${text}</h3>

</div>

`;

        }





        if(
            text.includes("提效结果") ||
            text.includes("质量优化结果") ||
            text.includes("项目成果")
        ){

            return `

<div class="ai-card ai-card-green">

<h3>🚀 ${text}</h3>

</div>

`;

        }


    }



    // =========================
    // 页面
    // =========================

    if(
        block.block_type === 1
    ){

        return renderChildren(
            block,
            blocks,
            imageMap
        );

    }



    // =========================
    // 表格单元格
    // block_type 32
    // =========================

    if(
        block.block_type === 32
    ){

        return renderChildren(
            block,
            blocks,
            imageMap
        );

    }




    // =========================
    // 标题
    // =========================


    if(
        [
            3,
            4,
            5
        ].includes(
            block.block_type
        )
    ){

        html += `

<h2 class="feishu-heading">
${text}
</h2>

`;

    }




    // =========================
    // 普通文本
    // =========================


    else if(
        block.block_type === 2
    ){

        if(text){

            html += `

<div class="feishu-text">
${text}
</div>

`;

        }

    }





    // =========================
    // 列表
    // =========================


    else if(
        block.block_type === 12
    ){

        html += `

<div class="feishu-list">
• ${text}
</div>

`;

    }



// =====================================
// 飞书提示块 callout
// block_type 19
// =====================================

else if(
    block.block_type === 19
){

    html += `

<div class="feishu-callout">

${renderChildren(
    block,
    blocks,
    imageMap
)}

</div>

`;

}

   //============================
// 飞书表格主体
//============================

else if(
    block.table &&
    block.table.cells
){

    html += `

<table class="feishu-table">

<tbody>

<tr>
`;


    block.table.cells.forEach(
        cellId=>{

            const cell =
            findBlock(
                cellId,
                blocks
            );


            if(cell){

                html += `

<td>

${renderChildren(
    cell,
    blocks,
    imageMap
)}

</td>

`;

            }

        }
    );


    html += `

</tr>

</tbody>

</table>

`;

}



//============================
//图片
//============================

else if(
    block.block_type === 27 &&
    block.image
){

        const token =
        block.image.token;


        if(
            imageMap[token]
        ){

            html += `

<div class="feishu-image">

<img src="${imageMap[token]}">

</div>

`;

        }

    }





    // =========================
    // 子节点
    // =========================


    html +=
    renderChildren(
        block,
        blocks,
        imageMap
    );

// =====================================
// 未识别block兜底
// 防止飞书新增类型导致文字丢失
// =====================================

if(
    html === "" &&
    text
){

    html += `

<div class="feishu-text">

${text}

</div>

`;

}

    return html;

}

// =====================================
// 第三部分
// 总入口 + export
// =====================================






// =====================================
// 总渲染入口
// =====================================


function renderFeishuBlocks(
    blocks,
    imageMap
){

    let html = "";



    const rootBlocks =
    blocks.filter(
        block =>
        block.parent_id === ""
    );



    rootBlocks.forEach(
        block=>{


            html +=
            renderBlock(
                block,
                blocks,
                imageMap
            );


        }
    );



    return html;

}






// =====================================
// 导出
// =====================================


export {

    renderFeishuBlocks

};