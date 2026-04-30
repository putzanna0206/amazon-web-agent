# 报告生成规范

## HTML 模板样式

报告生成 HTML 时使用以下样式：
- 页面：A4 尺寸，margin: 20mm
- 字体：PingFang SC, Hiragino Sans GB, STHeiti, sans-serif
- 标题：H1 24px #1a1a1a，H2 18px #2563eb，H3 15px #374151
- 表格：全边框 + 斑马纹（偶数行 #f9fafb），表头 #f3f4f6
- 结论/启示：浅蓝背景色块（#eff6ff + 左边框 #3b82f6）
- 机会点标记：绿色标签
- 风险点标记：红色标签

## PDF 转换

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu \
  --print-to-pdf="[输出路径]" \
  --no-margins --print-to-pdf-no-header \
  "[HTML文件路径]"
```

## 报告整体结构
1. 封面（报告标题 + 日期 + 分析类型）
2. 执行摘要（核心结论 3-5 条）
3. 正文章节（根据 skill 的报告章节模板）
4. 数据来源说明
