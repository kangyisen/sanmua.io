#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_index.py —— 扫描 posts/*.md 的 frontmatter，自动生成首页索引 data/posts.json。

零第三方依赖，只用标准库。本地可直接运行：
    python tools/build_index.py
GitHub Actions 在 push 时也会运行本脚本（见 .github/workflows/markdown-index.yml）。

约定：
- 新文章是 posts/ 下的 .md 文件，顶部用 --- 包裹的 frontmatter，字段：
    title、date、tags、excerpt
- 文章正文从第二个 --- 之后开始，正文不要写一级标题（大标题来自 frontmatter）。
- 旧的手写 HTML 文章固定在 data/posts.legacy.json，本脚本会把它们合并在 md 文章之后。
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(ROOT, "posts")
LEGACY = os.path.join(ROOT, "data", "posts.legacy.json")
OUT = os.path.join(ROOT, "data", "posts.json")


def strip_quotes(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        value = value[1:-1]
    return value.strip()


def split_tags(raw):
    raw = raw.strip()
    if not raw:
        return []
    if raw.startswith("[") and raw.endswith("]"):
        raw = raw[1:-1]
    parts = re.split(r"[,，]", raw)
    return [p.strip().strip("'\"") for p in parts if p.strip()]


def parse_frontmatter(text):
    """解析顶部 --- ... --- 块，返回 (fields, error)。"""
    if not text.lstrip().startswith("---"):
        return None, "缺少 frontmatter（文件需以 --- 开头）"
    # 找到第二个 ---
    m = re.match(r"^\s*---\s*\n(.*?)\n---\s*(?:\n|$)", text, re.S)
    if not m:
        return None, "frontmatter 没有以第二个 --- 结束"
    block = m.group(1)
    fields = {}
    lines = block.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        # block list: 以 "- " 开头，依附上一个 key（用于 tags）
        bm = re.match(r"^\s*-\s+(.*)$", line)
        if bm:
            key = fields.get("__last_key__")
            if key:
                fields.setdefault(key, [])
                if isinstance(fields[key], list):
                    fields[key].append(strip_quotes(bm.group(1)))
            i += 1
            continue
        km = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$", line)
        if not km:
            i += 1
            continue
        key, value = km.group(1), km.group(2)
        fields["__last_key__"] = key
        if key == "tags":
            if value.strip():
                fields[key] = split_tags(value)
            else:
                fields[key] = []
        else:
            fields[key] = strip_quotes(value)
        i += 1
    fields.pop("__last_key__", None)
    return fields, None


def collect_md():
    entries = []
    for name in os.listdir(POSTS_DIR):
        if not name.endswith(".md"):
            continue
        if name.startswith("_"):
            # 下划线开头（如 _template.md）为模板/草稿，不纳入索引
            continue
        path = os.path.join(POSTS_DIR, name)
        with io.open(path, encoding="utf-8") as f:
            text = f.read()
        fm, err = parse_frontmatter(text)
        if err:
            print("跳过 %s：%s" % (name, err))
            continue
        missing = [k for k in ("title", "date") if not fm.get(k)]
        if missing:
            print("跳过 %s：frontmatter 缺少字段 %s" % (name, ", ".join(missing)))
            continue
        base = name[:-3]
        entries.append({
            "title": fm["title"],
            "href": "/posts/view.html?f=" + base,
            "date": fm["date"],
            "tags": fm.get("tags", []),
            "excerpt": fm.get("excerpt", ""),
            "isNew": True,
        })
    # md 文章：日期降序，同日按文件名降序
    entries.sort(key=lambda e: (e["date"], e["href"]), reverse=True)
    return entries


def collect_legacy():
    # 旧的手写 HTML 文章：沿用 legacy 文件中的既有顺序，不重新排序，
    # 以保持历史文章在首页的展示顺序稳定。
    if not os.path.exists(LEGACY):
        return []
    with io.open(LEGACY, encoding="utf-8") as f:
        return json.load(f)


def main():
    md = collect_md()
    legacy = collect_legacy()
    merged = md + legacy
    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("已生成 %s：md 文章 %d 篇 + 旧 HTML %d 篇，共 %d 篇"
          % (os.path.relpath(OUT, ROOT), len(md), len(legacy), len(merged)))


if __name__ == "__main__":
    main()
