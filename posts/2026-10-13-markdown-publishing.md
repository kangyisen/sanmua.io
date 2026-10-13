---
title: 博客改造：只写 Markdown，剩下的交给脚本与 Actions
date: 2026-10-13
tags: [编程, 设计]
excerpt: 新增一篇文章不再需要手写 HTML：一个 .md 文件、一个通用 viewer、自动生成的 posts.json，外加一条 push 时自动更新索引的 Actions。
---

这个博客最早的文章是手写 HTML 的：复制一个模板、改 header 里的标题日期标签、再去 `data/posts.json` 手工加一条登记，三步里漏一步，首页就出问题。这次把发布流程彻底改成「**只写 Markdown**」：作者新增一个 `.md` 文件，文章页渲染、样式、代码高亮、首页索引全部自动。这篇就用新流程写出来，顺带把整套机制讲清楚。

## 为什么要把发布流程改成 Markdown

手写 HTML 发文章，重复劳动和出错点都集中在「外壳」上：

- 每篇都要复制同一段 `<head>`、引用同样的 CSS/JS，写错一个路径样式就崩；
- 代码块里的 `<`、`>`、`&` 必须手工转义，泛型和比较符尤其容易漏；
- 标题、日期、标签要同时写在 HTML 和 `posts.json` 两处，两处对不上就出现“能打开但首页搜不到”的脏状态。

而文章真正的内容——文字、代码、表格——本来就是 Markdown 最擅长表达的。把“外壳”固定下来，作者只写 Markdown，才是合理的分工。

## 一个 md 文件长什么样

新文章就是 `posts/` 下的一个 `.md` 文件，顶部用 `---` 包裹一段 **frontmatter**，写清标题、日期、标签、摘要：

```text
---
title: 文章标题
date: 2026-10-13
tags: [编程, 设计]
excerpt: 一句话亮点，会显示在首页卡片上。
---

正文从第二个 --- 之后开始，用 ## 分节，不要写一级标题
（大标题已经由 frontmatter 的 title 渲染到页面顶部）。
```

`tags` 既可以写成 `[a, b]` 这种行内列表，也可以写成每行一个 `- a` 的块状列表，脚本都能识别。

## 通用 viewer：在浏览器里渲染

我没有给每篇 md 生成 HTML，而是写了一个**通用 viewer** `posts/view.html`。它通过查询参数拿到文件名，fetch 对应的 md，解析 frontmatter，再用 [marked](https://marked.js.org/) 把正文渲染出来：

```js
var f = new URLSearchParams(location.search).get("f");
fetch("/posts/" + encodeURIComponent(f) + ".md")
  .then(function (r) { return r.text(); })
  .then(function (text) {
    var parsed = splitMarkdown(text);
    titleEl.textContent = parsed.fields.title;
    writeEl.innerHTML = marked.parse(parsed.body);
  });
```

文件名参数做了白名单校验（只允许字母、数字、点、连字符），避免 `../` 之类的路径穿越。因为渲染逻辑只有这一份，所有 Markdown 文章的样式天然一致，不会再出现“两篇文章长得不一样”。

## 代码高亮：Go / JavaScript / Python

代码块用 [highlight.js](https://highlightjs.org/) 做语法高亮，配色复用了博客原有的代码主题：

```go
func (s *ToolBox) Render(ctx context.Context, f GenerateForm) (map[string]any, error) {
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}
	out := make(map[string]any)
	for k, v := range f.Params {
		out[k] = v
	}
	return out, nil
}
```

```js
marked.use({
  renderer: {
    code(code, lang) {
      const html = hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value;
      return `<pre><code class="hljs language-${lang}">${html}</code></pre>`;
    },
  },
});
```

```python
def collect_md(posts_dir):
    entries = []
    for name in os.listdir(posts_dir):
        if not name.endswith(".md"):
            continue
        fields, _ = parse_frontmatter(open(join(posts_dir, name), encoding="utf-8").read())
        entries.append({"title": fields["title"], "href": f"/posts/view.html?f={name[:-3]}"})
    return sorted(entries, key=lambda e: e["date"], reverse=True)
```

深色模式下高亮会自动切换，代码块支持横向滚动，长行不会撑破布局。

## posts.json 自动生成

首页是纯静态的，不能列目录，所以仍然需要一份 `posts.json` 作为索引。但它不再手写——由零依赖脚本 `tools/build_index.py` 扫描所有 md 的 frontmatter 自动生成：

```python
md = collect_md()                       # 扫描 posts/*.md
legacy = collect_legacy()               # 合并旧的手写 HTML 文章
json.dump(md + legacy, open(OUT, "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
```

旧的手写 HTML 文章固定在 `data/posts.legacy.json`，脚本每次把它们合并在 Markdown 文章之后，所以历史文章的链接完全不受影响。

两条路线的取舍如下：

| 方案 | 作者要提交什么 | 依赖 | 缺点 |
| --- | --- | --- | --- |
| 运行时渲染（选定） | 只提交 `.md` | 浏览器端 marked | 首屏需要 JS |
| 构建时转换 | md + 生成的 HTML | 本地 md 库 / Node | 产物多、易漂移 |
| 运行时 + Actions（最终） | 只提交 `.md` | 无（CI 自动生成索引） | 索引有几秒延迟 |

## 真正“只提交 md”：GitHub Actions

光有本地脚本，作者还得记得跑一次。于是又加了一条 GitHub Actions 工作流：push 到 `666` 时，只要 `.md` 有变化，就自动运行 `build_index.py`，把更新后的 `posts.json` 提交回来（使用默认 `GITHUB_TOKEN`，不会触发循环）。

发一篇新文章的完整步骤因此被压缩到：

1. 在 `posts/` 新建一个 `YYYY-MM-DD-英文slug.md`，写好 frontmatter 和正文；
2. `git add` 这个文件并提交、推送到 `666`；
3. 等几秒，Actions 自动更新首页索引，文章即上线。

本地想预览也很简单：在博客根目录起 `python -m http.server`，浏览器打开 `http://127.0.0.1:8000/posts/view.html?f=你的文件名`。

> 这套改造的关键，是把「写内容」和「搭外壳」彻底分离：作者只负责 Markdown，外壳由一个 viewer、一份样式、一个脚本和一条工作流固定下来。需要人重复做的事，都应该交给工具。

## 其他排版也都正常

正文里的**加粗**、*斜体*、行内代码 `const x = 1`、链接（比如博客的 [GitHub 仓库](https://github.com/kangyisen/sanmua.io)）、图片（站点图标）：

![站点图标](/assets/favicon.svg)

有序列表、无序列表、引用、表格都已在上面验证。根目录还加了一个空的 `.nojekyll` 文件，确保 GitHub Pages 不经过 Jekyll、把 `.md` 原样返回给 fetch，而不是提前转成 HTML。

> 好的发布流程不是“功能更多”，而是让作者每次只做“写文章”这一件真正有价值的事——这就是这次改造的全部目的。
