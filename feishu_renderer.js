// =====================================
// 飞书文档渲染器 V5
// Part 1
//
// 目标：
// 1. 恢复正文解析
// 2. 恢复标题结构
// 3. 保留原同步逻辑
// =====================================




// =====================================
// 基础查找
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
// 飞书文字解析
// 支持：
// text
// heading
// bullet
// =====================================

function getText(
    block
){

    if(!block){

        return "";

    }



    let text = "";



    let elements = [];



    if(
        block.text &&
        block.text.elements
    ){

        elements =
        block.text.elements;

    }



    else if(
        block.heading1 &&
        block.heading1.elements
    ){

        elements =
        block.heading1.elements;

    }



    else if(
        block.heading2 &&
        block.heading2.elements
    ){

        elements =
        block.heading2.elements;

    }



    else if(
        block.heading3 &&
        block.heading3.elements
    ){

        elements =
        block.heading3.elements;

    }



    else if(
        block.bullet &&
        block.bullet.elements
    ){

        elements =
        block.bullet.elements;

    }

else if(
    block.ordered &&
    block.ordered.elements
)
{

    elements =
    block.ordered.elements;

}


else if(
    block.code &&
    block.code.elements
)
{

    elements =
    block.code.elements;

}


else if(
    block.quote &&
    block.quote.elements
)
{

    elements =
    block.quote.elements;

}

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
    item.text_run &&
    item.text_run.content
)
{

    text +=
    item.text_run.content;

}

        }
    );



    return text.trim();

}





// =====================================
// 判断block类型
// =====================================

function hasHeading(
    block
){

    return (
        block.heading1 ||
        block.heading2 ||
        block.heading3
    );

}





function hasText(
    block
){

    return (
        block.text ||
        block.bullet
    );

}





// =====================================
// 表格单元格文字
// =====================================

function getCellText(
    cell,
    blocks
){

    if(!cell){
        return "";
    }


    let result = "";


    function scan(block){

        if(!block){
            return;
        }


        const text =
        getText(block);


        if(text){

            result += text;

        }



        if(block.children){

            block.children.forEach(
                id=>{

                    const child =
                    findBlock(
                        id,
                        blocks
                    );


                    scan(child);

                }
            );

        }

    }



    scan(cell);


    return result.trim();

}





// =====================================
// 图片映射
// =====================================

function getImageUrl(
    token,
    imageMap
){

    if(
        !token
    ){

        return "";

    }



    return (
        imageMap[token]
        ||
        ""
    );

}





// =====================================
// 判断是否在callout
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
// 核心渲染
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

            // 普通表格
            if(
                child.block_type === 31 &&
                child.table
            ){

                html += renderTable(
                    child,
                    blocks
                );

                return;

            }


            // 飞书在线表格
            if(
                child.block_type === 30 &&
                child.sheet
            ){

                html += renderSheet(
                    child
                );

                return;

            }



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
// 判断标题样式
// =====================================

function renderTitle(
    text,
    level=2
){

    return `

<div class="feishu-title level-${level}">

${text}

</div>

`;

}








// =====================================
// 主渲染函数
// =====================================

function renderBlock(
    block,
    blocks,
    imageMap={}
){

    let html = "";


    // 跳过表格单元格
    if(
        block.block_type === 32
    ){

        return "";

    }



    const text =
    getText(
        block
    );








    // =====================================
    // 一级根节点
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
    block.heading1
){

    html +=
    renderTitle(
        text,
        1
    );


    html +=
    renderChildren(
        block,
        blocks,
        imageMap
    );


    return html;

}







    // =====================================
    // 二级标题
    // =====================================

    if(
    block.heading2 ||
    block.heading3
){

    html +=
    renderTitle(
        text,
        2
    );


    html +=
    renderChildren(
        block,
        blocks,
        imageMap
    );


    return html;

}








    // =====================================
    // Callout
    // =====================================

    if(
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


        return html;

    }








    // =====================================
    // 图片
    // =====================================

    if(
        block.image
    ){


        const token =
        block.image.token;



        const src =
        getImageUrl(
            token,
            imageMap
        );



        if(src){

            html += `

<div class="feishu-image">

<img src="${src}">

</div>

`;

        }


        return html;

    }








    // =====================================
    // 普通文本
    // =====================================

    if(
        hasText(block)
    ){


        if(
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
    // 列表
    // =====================================

    if(
        block.bullet
    ){


        html += `

<div class="feishu-list">

• ${text}

</div>

`;



        return html;

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
console.log(
    "进入表格渲染:",
    block.block_id
);
console.log(
    "表格数据:",
    JSON.stringify(
        block.table,
        null,
        2
    )
);
    if(
        !block.table
    ){

        return "";

    }



    const cells =
    block.table.cells || [];



    const columnSize =
    block.table.property?.column_size || 1;



   let html = `

<div class="feishu-table-wrapper">

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



           const cellText =
getCellText(
    cell,
    blocks
);


html += `

<td>

${cellText || ""}

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

</div>

`;

console.log(
    "生成表格HTML长度:",
    html.length
);

    return html;

}









// =====================================
// 飞书在线表格
// block_type 30
// =====================================

function renderSheet(
    block
){

    const token =
    block.sheet?.token || "";



    return `

<div class="feishu-sheet">


<div class="feishu-sheet-title">

📊 飞书在线表格

</div>



<div class="feishu-sheet-box">


<a

href="https://feishu.cn/sheets/${token}"

target="_blank"

>

打开飞书原表

</a>


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

console.log(
    "渲染表格数量:",
    blocks.filter(
        b =>
        b.block_type === 31 ||
        b.block_type === 30 ||
        b.block_type === 32
    ).length
);


console.log(
    "表格父级:",
    blocks.filter(
        b =>
        b.block_type === 31 ||
        b.block_type === 30
    )
    .map(
        b=>({
            type:b.block_type,
            parent:b.parent_id,
            children:b.children
        })
    )
);

   const roots = blocks.filter(
    block =>
    block.block_type !== 32
);



    roots.forEach(
    block=>{


        if(
            block.parent_id &&
            block.block_type !== 31 &&
            block.block_type !== 30
        ){

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