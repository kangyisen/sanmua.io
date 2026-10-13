---
title: 在这里写文章标题
date: 2026-10-13
tags: [标签一, 标签二]
excerpt: 一句话摘要，显示在首页卡片上，建议 20-40 字。
---

<!--
  使用说明（正式发布前请删掉本段注释）：
  1. 文件名：YYYY-MM-DD-英文slug.md，例如 2026-10-13-my-post.md
  2. 上面 frontmatter：title、date 必填；tags、excerpt 建议填
       - tags 可写成 [a, b]，也可写成每行一个 "- a"
       - 常用标签：编程 / 数据库 / 数学 / 随笔 / Go / Python / AI / 架构 / 设计 / 支付 / 安全 / Docker
  3. 正文从这里开始，不要写一级标题（大标题已由 title 生成），用 ## 分节
  4. 保存后 git add、commit、push 到 666 分支，Actions 会自动更新首页索引
  5. 本地预览：在博客根目录跑  python -m http.server，
     浏览器打开 /posts/view.html?f=你的文件名（不含 .md）
-->

开头第一段：用一两句话交代这篇文章要解决的问题、或项目背景。

## 小节标题

正文支持 **加粗**、*斜体*、`行内代码`、[链接](https://example.com)。

### 列表

- 无序列表项一
- 无序列表项二

1. 有序列表项一
2. 有序列表项二

### 引用

> 引用一段文字。

### 代码块

在三个反引号后标注语言即可高亮，常用：go / js / python / bash / sql：

```go
package main

import "fmt"

func main() {
	fmt.Println("hello, sanmua")
}
```

### 表格

| 列一 | 列二 | 列三 |
| --- | --- | --- |
| 数据 | 数据 | 数据 |

### 图片

![图片说明](/assets/favicon.svg)

> 结尾可以用一个引用块点题、总结全文。
