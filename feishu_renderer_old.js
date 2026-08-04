// =====================================
// 飞书递归渲染器 V4
// 基于当前可运行版本修复
// Part 1
// =====================================



// =====================================
// 获取文字
// 支持：
// text
// bullet
// heading
// =====================================

function getText(block){

    let text = "";


    if(!block){

        return "";

    }



    const elements =
    block?.text?.elements
    ||
    block?.bullet?.elements
    ||
    block?.heading1?.elements
    ||
    block?.heading2?.elements
    ||
    block?.heading3?.elements;



    if(elements){

        elements.forEach(
            item=>{


                if(
                    item.text_run
                ){

                    text +=
                    item.text_run.content || "";

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
                    item.content || "";

                }


            }
        );

    }



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
// 获取子节点
// =====================================

function getChildren(
    block,
    blocks
){

    if(
        !block ||
        !block.children
    ){

        return [];

    }



    return block.children
    .map(
        id =>
        findBlock(
            id,
            blocks
        )
    )
    .filter(Boolean);

}







// =====================================
// 获取表格单元格文字
// =====================================

function getCellText(
    cell,
    blocks
){

    if(
        !cell
    ){

        return "";

    }



    let text = "";



    if(
        cell.children
    ){

        cell.children.forEach(
            id=>{


                const child =
                findBlock(
                    id,
                    blocks
                );



                if(child){

                    text +=
                    getText(
                        child
                    );

                }


            }
        );

    }



    return text.trim();

}







// =====================================
// 判断是否A/B/C等级
// =====================================

function isLevelText(
    text
){

    if(
        !text
    ){

        return false;

    }



    return /^[A-Z]$/.test(
        text.trim()
    );

}







// =====================================
// 判断是否分隔符
// =====================================

function isSeparator(
    text
){

    return (
        text === "/" ||
        text === "-" ||
        text === "—"
    );

}







// =====================================
// 判断是否在callout内部
// 防止重复渲染
// =====================================

function isInsideCallout(
    block,
    blocks
){

    const parent =
    findBlock(
        block.parent_id,
        blocks
    );



    return (
        parent &&
        parent.block_type === 19
    );

}


// =====================================
// Part 2
// render主体
// =====================================



// =====================================
// 渲染子节点
// =====================================

function renderChildren(
    block,
    blocks,
    imageMap={}
){

    let html = "";


    const children =
    getChildren(
        block,
        blocks
    );


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
// 主渲染函数
// =====================================

function renderBlock(
    block,
    blocks,
    imageMap={}
){

    const text =
    getText(
        block
    );



    let html = "";






    // =====================================
    // 根节点
    // =====================================

    if(
        block.block_type === 1
    ){

        return renderChildren(
            block,
            blocks,
            imageMap
        );

    }







    // =====================================
    // 一级标题
    // =====================================

    if(
        block.block_type === 3 ||
        block.block_type === 4
    ){

        return `

<div class="feishu-heading">

${text}

</div>

`;

    }








    // =====================================
    // 普通文本 / 二级标题
    // block_type 2
    // 关键修复：
    // 有children才认为标题
    // 无children就是正文
    // =====================================


    if(
        block.block_type === 2
    ){


        // callout里面不重复输出

        if(
            isInsideCallout(
                block,
                blocks
            )
        ){

            return "";

        }




        const hasChildren =
        block.children &&
        block.children.length > 0;




        // -------------------------------
        // 二级标题
        // -------------------------------

        if(
            hasChildren
        ){


            if(
                text.includes(
                    "用途及适用部门和平台"
                )
            ){

                return `

<div class="ai-title orange">

${text}

</div>

`;

            }




            if(
                text.includes(
                    "提效结果"
                )
                ||
                text.includes(
                    "质量优化结果"
                )
            ){

                return `

<div class="ai-title orange">

${text}

</div>

`;

            }





            if(
                text.includes(
                    "操作步骤"
                )
            ){

                return `

<div class="ai-title purple">

${text}

</div>

`;

            }




            return `

<div class="feishu-subtitle">

${text}

</div>

`;

        }





        // -------------------------------
        // 普通正文
        // -------------------------------

        if(
            text
        ){

            return `

<div class="feishu-text">

${text}

</div>

`;

        }


    }








    // =====================================
    // 列表
    // =====================================

    if(
        block.block_type === 12
    ){

        return `

<div class="feishu-list">

• ${text}

</div>

`;

    }







    // =====================================
    // Callout
    // =====================================

    if(
        block.block_type === 19
    ){

        return `

<div class="feishu-callout">

${renderChildren(
    block,
    blocks,
    imageMap
)}

</div>

`;

    }








    // =====================================
    // 图片
    // =====================================

    if(
        block.block_type === 27 &&
        block.image
    ){


        const token =
        block.image.token;



        if(
            imageMap[token]
        ){

            return `

<div class="feishu-image">

<img src="${imageMap[token]}">

</div>

`;

        }


        return "";

    }








    // =====================================
    // 双栏
    // =====================================

    if(
        block.block_type === 24 ||
        block.block_type === 25
    ){

        return `

<div class="feishu-columns">

${renderChildren(
    block,
    blocks,
    imageMap
)}

</div>

`;

    }







    // =====================================
    // 默认递归
    // =====================================

    return renderChildren(
        block,
        blocks,
        imageMap
    );


}


// =====================================
// Part 3
// 表格 + 总入口
// =====================================





// =====================================
// 普通飞书表格
// block_type 31
// =====================================

function renderTable(
    block,
    blocks
){

    const cells =
    block.table?.cells || [];



    const columnSize =
    block.table?.property?.column_size || 1;



    let html = `

<table class="feishu-table">

<tbody>

`;



    for(
        let i = 0;
        i < cells.length;
        i += columnSize
    ){


        html += `

<tr>

`;



        for(
            let j = 0;
            j < columnSize;
            j++
        ){


            const cellId =
            cells[i+j];



            const cell =
            findBlock(
                cellId,
                blocks
            );



            html += `

<td>

${getCellText(
    cell,
    blocks
)}

</td>

`;

        }



        html += `

</tr>

`;

    }



    html += `

</tbody>

</table>

`;



    return html;

}









// =====================================
// 飞书在线表格
// block_type 30
// 图片展示方案
// =====================================

function renderSheet(
    block
){

    return `

<div class="feishu-sheet">


<div class="feishu-sheet-title">

📊 飞书在线表格

</div>



<div class="feishu-sheet-box">


<img

src="/提效结果.png"

style="
width:100%;
max-width:900px;
border-radius:8px;
"

>


</div>


</div>

`;

}








// =====================================
// 总入口
// =====================================

function renderFeishuBlocks(
    blocks,
    imageMap={}
){

    let html = "";



    const rootBlocks =
    blocks.filter(
        block =>
        !block.parent_id
        ||
        block.parent_id === ""
    );



    rootBlocks.forEach(
        block=>{


            // 在线表格

            if(
                block.block_type === 30 &&
                block.sheet
            ){

                html +=
                renderSheet(
                    block
                );


                return;

            }



            // 普通表格

            if(
                block.block_type === 31 &&
                block.table
            ){

                html +=
                renderTable(
                    block,
                    blocks
                );


                return;

            }



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