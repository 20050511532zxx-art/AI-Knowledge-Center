import {
renderFeishuImage
}
from "./feishu_render_image.mjs";


const html = `

<html>

<body>

<h1>
客服+AI数字化解决案例
</h1>


<h2>
客服AI项目定级
</h2>


<table border="1">

<tr>
<td>
项目名称
</td>

<td>
等级
</td>

</tr>

<tr>

<td>
客服聊天记录质检分析
</td>

<td>
S
</td>

</tr>

</table>


<h2>
业务痛点
</h2>


<p>
人工分析聊天记录耗时较长，需要AI自动化处理。
</p>


<h2>
提效结果
</h2>


<p>
1.5小时降低到15分钟。
</p>


</body>

</html>

`;


await renderFeishuImage(
    html,
    "test.png"
);