#!/usr/bin/env python3
"""Validate the generated blog without network access or third-party packages.

Run after build_index.py: python tools/check_site.py
"""
import json
import sys
import xml.etree.ElementTree as ET
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references = []
        self.jsonld = []
        self.in_jsonld = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("href", "src"):
            value = attrs.get(key)
            if value:
                self.references.append(value)
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_jsonld = True
            self.jsonld.append("")

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_jsonld = False

    def handle_data(self, data):
        if self.in_jsonld:
            self.jsonld[-1] += data


def local_target(reference, page):
    url = urlsplit(reference)
    if url.scheme or url.netloc or not url.path:
        return None
    relative = unquote(url.path)
    target = (ROOT / relative.lstrip("/")) if relative.startswith("/") else (page.parent / relative)
    target = target.resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError("reference escapes the site root: " + reference)
    if target.is_dir() or relative.endswith("/"):
        target = target / "index.html"
    return target


def check_site():
    errors = []
    pages = [path for path in ROOT.rglob("*.html")
             if not path.name.startswith("_") and not any(
                 part in (".git", "node_modules", "work") for part in path.relative_to(ROOT).parts
             )]
    for page in pages:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        for reference in parser.references:
            try:
                target = local_target(reference, page)
                if target is not None and not target.is_file():
                    errors.append("%s: missing %s" % (page.relative_to(ROOT), reference))
            except ValueError as error:
                errors.append("%s: %s" % (page.relative_to(ROOT), error))
        for block in parser.jsonld:
            try:
                json.loads(block)
            except ValueError as error:
                errors.append("%s: invalid JSON-LD: %s" % (page.relative_to(ROOT), error))

    posts = json.loads((ROOT / "data/posts.json").read_text(encoding="utf-8"))
    search = json.loads((ROOT / "data/search.json").read_text(encoding="utf-8"))
    post_hrefs = [post["href"] for post in posts]
    search_hrefs = [entry["href"] for entry in search]
    if len(post_hrefs) != len(set(post_hrefs)):
        errors.append("data/posts.json: duplicate article URLs")
    if len(search_hrefs) != len(set(search_hrefs)) or set(post_hrefs) != set(search_hrefs):
        errors.append("data/search.json: must contain every article exactly once")
    for source in (ROOT / "posts").glob("*.md"):
        if not source.name.startswith("_") and "/posts/%s/" % source.stem not in post_hrefs:
            errors.append("data/posts.json: Markdown article was skipped: " + source.name)
    for post in posts:
        try:
            date.fromisoformat(post["date"])
            if post.get("category") not in ("编程", "数据库", "数学", "随笔"):
                raise ValueError("invalid category")
            if not isinstance(post.get("title"), str) or not post["title"].strip():
                raise ValueError("empty title")
            if not isinstance(post.get("readingMinutes"), int) or post["readingMinutes"] < 1:
                raise ValueError("invalid reading time")
            target = local_target(post["href"], ROOT / "index.html")
            if target is None or not target.is_file():
                raise ValueError("article page does not exist")
        except (KeyError, TypeError, ValueError) as error:
            errors.append("data/posts.json: %s: %s" % (post.get("href", "unknown"), error))
    for entry in search:
        if not isinstance(entry.get("content"), str) or not entry["content"].strip():
            errors.append("data/search.json: empty article text: " + entry.get("href", "unknown"))

    sitemap = ET.parse(ROOT / "sitemap.xml")
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = [element.text for element in sitemap.findall("s:url/s:loc", namespace)]
    if len(locations) != len(set(locations)):
        errors.append("sitemap.xml: duplicate URLs")
    for href in post_hrefs:
        if not any(location.endswith(href) for location in locations):
            errors.append("sitemap.xml: article is missing: " + href)
    feed = ET.parse(ROOT / "feed.xml")
    feed_links = [element.text for element in feed.findall("channel/item/link")]
    latest = sorted(posts, key=lambda post: post["date"], reverse=True)[:20]
    if len(feed_links) != len(latest) or any(
        not link.endswith(post["href"]) for link, post in zip(feed_links, latest)
    ):
        errors.append("feed.xml: RSS items do not match the latest articles")

    if errors:
        print("Site validation failed:")
        for error in sorted(set(errors)):
            print("- " + error)
        return 1
    print("Validated %d HTML pages, %d articles, local resources, search, JSON-LD, sitemap and RSS."
          % (len(pages), len(posts)))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(check_site())
    except (OSError, KeyError, TypeError, ValueError, ET.ParseError) as error:
        print("Site validation failed: %s" % error)
        sys.exit(1)
