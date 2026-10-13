# 用 Markdown 发一篇新文章

从现在起，新增博客文章**只需要写 Markdown**，不用再手写 HTML、不用手工登记首页索引。

## 发布步骤

1. 在 `posts/` 下新建一个文件，命名为 `YYYY-MM-DD-英文slug.md`，例如
   `posts/2026-10-20-my-new-post.md`。
2. 文件顶部写 frontmatter（标题、日期、标签、摘要），下面写正文：

   ```markdown
   ---
   title: 文章标题
   date: 2026-10-20
   tags: [编程, 设计]
   excerpt: 一句话亮点，会显示在首页卡片上。
   ---

   ## 第一节

   正文从这里开始，用 ## 分节，**不要写一级标题**（大标题来自 title）。

   - 支持列表、`行内代码`、[链接](https://example.com)、图片、表格、引用等。
   - 代码块用三个反引号，并标注语言即可获得语法高亮：

     ```go
     func main() { println("hello") }
     ```
   ```

3. 提交并推送到 `666` 分支：

   ```bash
   git add posts/2026-10-20-my-new-post.md
   git commit -m "post: 文章标题"
   git push origin 666
   ```

   push 之后，GitHub Actions 会自动运行 `tools/build_index.py` 更新
   `data/posts.json` 并提交回来，几秒后首页即出现新文章。**只提交 .md 即可。**

## 本地预览

在博客根目录启动静态服务器：

```bash
python -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000/posts/view.html?f=2026-10-20-my-new-post
```

（`?f=` 后面是 md 文件名，不含 `.md`。）

## 说明 / 约定

- 通用文章页是 `posts/view.html`：它 fetch 对应的 md，用 **marked** 渲染正文、
  用 **highlight.js** 做代码高亮，样式由 `assets/css/article.css` 统一控制。
- 首页索引是 `data/posts.json`，由脚本自动生成，**不要手工编辑**。
- 旧的手写 HTML 文章固定在 `data/posts.legacy.json`；脚本会把它们合并在
  Markdown 文章之后。新增文章一律用 Markdown。
- 根目录的 `.nojekyll` 让 GitHub Pages 关闭 Jekyll、把 `.md` 原样返回。
- 相关文件：`tools/build_index.py`、`.github/workflows/markdown-index.yml`、
  `assets/js/marked.min.js`、`assets/js/highlight.min.js`。
