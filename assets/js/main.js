/* Shared navigation, theme preferences and searchable journal. */
(function () {
  "use strict";
  var root = document.documentElement;
  var assetQuery = document.currentScript ? new URL(document.currentScript.src).search : "";
  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    var saved = localStorage.getItem("theme");
    root.dataset.theme =
      saved === "light" || saved === "dark"
        ? saved
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
  } catch (_) {
    root.dataset.theme = "light";
  }

  function buildShell() {
    if (document.body.dataset.shell === "none") return;
    var path = location.pathname;
    var links = [
      { href: "/", label: "首页" },
      { href: "/#journal", label: "手记" },
      { href: "/archives.html", label: "归档" },
      { href: "/docs/shuxue/shuxue.html", label: "数学" },
      { href: "/qisimiaoxiang/qisimiaoxiang.html", label: "灵感" },
      { href: "/friends.html", label: "友链" },
    ];
    var nav = document.createElement("header");
    nav.className = "site-nav";
    nav.innerHTML =
      '<div class="site-nav__inner"><a class="site-nav__brand" href="/" aria-label="sanmua 首页"><span class="logo-mark" aria-hidden="true">s.</span>sanmua<span style="color:var(--text-tertiary)">.</span></a><span class="brand-note">个人手记</span><nav class="site-nav__links" id="siteLinks" aria-label="主导航">' +
      links
        .map(function (link) {
          var active =
            link.href === "/"
              ? path === "/" || path === "/index.html"
              : link.href === path;
          return (
            '<a href="' +
            link.href +
            '"' +
            (active ? ' class="is-active" aria-current="page"' : "") +
            ">" +
            link.label +
            "</a>"
          );
        })
        .join("") +
      '</nav><div class="nav-actions"><a class="nav-rss" href="/feed.xml" aria-label="RSS 订阅" title="RSS 订阅"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="5" cy="19" r="1" fill="currentColor"/><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/></svg></a><button class="theme-toggle" type="button" id="themeToggle"></button><button class="nav-burger" type="button" aria-label="展开导航" aria-expanded="false" aria-controls="siteLinks">☰</button></div></div>';
    document.body.prepend(nav);
    document.body.classList.add("has-nav");
    var themeButton = document.getElementById("themeToggle");
    function updateThemeLabel() {
      var dark = root.dataset.theme === "dark";
      themeButton.textContent = dark ? "☼" : "☾";
      themeButton.setAttribute(
        "aria-label",
        dark ? "切换到浅色主题" : "切换到深色主题",
      );
      themeButton.title = themeButton.getAttribute("aria-label");
    }
    updateThemeLabel();
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (event) {
      try { if (localStorage.getItem("theme")) return; } catch (_) {}
      root.dataset.theme = event.matches ? "dark" : "light";
      updateThemeLabel();
    });
    themeButton.addEventListener("click", function () {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", root.dataset.theme);
      } catch (_) {}
      updateThemeLabel();
    });
    var burger = nav.querySelector(".nav-burger");
    var menu = document.getElementById("siteLinks");
    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "收起导航" : "展开导航");
      burger.textContent = open ? "×" : "☰";
    }
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (
        event.key === "Escape" &&
        burger.getAttribute("aria-expanded") === "true"
      ) {
        setMenu(false);
        burger.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target)) setMenu(false);
    });
    matchMedia("(min-width: 761px)").addEventListener("change", function () {
      setMenu(false);
    });
    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML =
      "<p>© " +
      new Date().getFullYear() +
      ' sanmua · 记录学习与生活</p><p>保持好奇，慢慢生长。 <a href="https://github.com/kangyisen" target="_blank" rel="noopener noreferrer">GitHub ↗</a></p>';
    document.body.appendChild(footer);
    var top = document.createElement("button");
    top.className = "back-top";
    top.type = "button";
    top.hidden = true;
    top.setAttribute("aria-label", "回到顶部");
    top.textContent = "↑";
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
    document.body.appendChild(top);
    var article =
      document.getElementById("write") || document.querySelector(".prose");
    var progress;
    if (article) {
      progress = document.createElement("div");
      progress.className = "reading-progress";
      progress.setAttribute("aria-hidden", "true");
      document.body.appendChild(progress);
      if (article.id === "write" && !article.closest(".prose")) {
        var back = document.createElement("a");
        back.className = "article-back";
        back.href = "/#journal";
        back.textContent = "← 返回手记";
        article.before(back);
      }
    }
    var scrollPending = false;
    function updateScroll() {
      scrollPending = false;
      top.hidden = window.scrollY < 400;
      if (progress) {
        var bounds = article.getBoundingClientRect();
        var start = window.scrollY + bounds.top - 110;
        var distance = bounds.height - window.innerHeight + 110;
        var fraction = distance > 0 ? (window.scrollY - start) / distance : 1;
        progress.style.transform = "scaleX(" + Math.min(1, Math.max(0, fraction)) + ")";
      }
    }
    function requestScrollUpdate() {
      if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
    }
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    window.addEventListener("load", requestScrollUpdate, { once: true });
    updateScroll();
    var greet = document.querySelector("[data-greet]");
    if (greet) {
      var hour = new Date().getHours();
      greet.textContent =
        hour < 6
          ? "夜深了，记得早点休息。"
          : hour < 12
            ? "早上好，今天也保持好奇。"
            : hour < 18
              ? "下午好，坐下来喝杯茶吧。"
              : "晚上好，欢迎来这里歇歇脚。";
    }
    var postBox = document.querySelector(".js-posts");
    if (postBox) loadPosts(postBox);
    if (document.querySelector("#write, .article-body")) {
      var readingScript = document.createElement("script");
      readingScript.src = "/assets/js/reading.js" + assetQuery;
      document.body.appendChild(readingScript);
    }
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function loadPosts(box) {
    var posts = [],
      category = "全部",
      limit = 6,
      pageSize = 6,
      postsState = "loading",
      inputTimer;
    var search = document.getElementById("postSearch");
    var count = document.getElementById("postCount");
    var sort = document.getElementById("postSort");
    var status = document.getElementById("searchStatus");
    var feature = document.getElementById("latestPost");
    var pagination = document.getElementById("postPagination");
    var more = document.getElementById("loadMore");
    var browse = document.getElementById("browseStatus");
    var filters = document.querySelectorAll("[data-filter]");
    var illustrations = {
      数据库: ["▤", "DATABASE", ""],
      编程: ["</>", "CODE NOTES", "code"],
      数学: ["∑", "MATHEMATICS", ""],
      随笔: ["✎", "LIFE NOTES", "life"],
      杂项: ["✳", "IDEAS", "life"],
    };
    // 首页筛选按归一化后的 category；旧索引没有该字段时按标签兜底推断。
    function categoryOf(post) {
      if (post.category) return post.category === "杂项" ? "随笔" : post.category;
      var tags = post.tags || [];
      if (tags.includes("数据库")) return "数据库";
      if (tags.includes("数学")) return "数学";
      if (tags.includes("随笔") || tags.includes("杂项")) return "随笔";
      return "编程";
    }
    // 全文搜索索引（/data/search.json）懒加载：首次聚焦/输入搜索框时才拉取。
    var fullText = null,
      fullTextLoading = null,
      searchFailed = false;
    function ensureFullText() {
      if (fullText) return Promise.resolve();
      if (fullTextLoading) return fullTextLoading;
      fullTextLoading = fetch("/data/search.json", { cache: "no-cache" })
        .then(function (response) {
          if (!response.ok) throw new Error("no search index");
          return response.json();
        })
        .then(function (list) {
          fullText = {};
          searchFailed = false;
          (Array.isArray(list) ? list : []).forEach(function (entry) {
            if (entry && entry.href) fullText[entry.href] = String(entry.content || "");
          });
        })
        .catch(function () {
          searchFailed = true;
        })
        .then(function () {
          fullTextLoading = null;
          if (search.value.trim()) render();
        });
      return fullTextLoading;
    }
    search.addEventListener("focus", ensureFullText);
    function updateFilters() {
      filters.forEach(function (button) {
        var active = button.dataset.filter === category;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    function restoreState() {
      var params = new URLSearchParams(location.search);
      var requested = params.get("category");
      category = Array.from(filters).some(function (button) { return button.dataset.filter === requested; }) ? requested : "全部";
      search.value = (params.get("q") || "").slice(0, 200);
      sort.value = params.get("sort") === "oldest" ? "oldest" : "newest";
      limit = pageSize;
      updateFilters();
      if (search.value) ensureFullText();
    }
    function saveState() {
      var url = new URL(location.href);
      if (category === "全部") url.searchParams.delete("category");
      else url.searchParams.set("category", category);
      if (search.value.trim()) url.searchParams.set("q", search.value.trim());
      else url.searchParams.delete("q");
      if (sort.value === "oldest") url.searchParams.set("sort", "oldest");
      else url.searchParams.delete("sort");
      try { history.replaceState(null, "", url.pathname + url.search + url.hash); } catch (_) {}
    }
    // Text nodes keep both article content and search terms inert.
    function highlighted(tag, className, value, terms) {
      var node = element(tag, className);
      var text = String(value || ""), lower = text.toLocaleLowerCase(), cursor = 0;
      while (cursor < text.length) {
        var next = -1, length = 0;
        terms.forEach(function (term) {
          var position = lower.indexOf(term, cursor);
          if (position !== -1 && (next === -1 || position < next)) { next = position; length = term.length; }
        });
        if (next === -1) { node.appendChild(document.createTextNode(text.slice(cursor))); break; }
        node.appendChild(document.createTextNode(text.slice(cursor, next)));
        node.appendChild(element("mark", "", text.slice(next, next + length)));
        cursor = next + length;
      }
      return node;
    }
    function excerptOf(post, terms) {
      var excerpt = post.excerpt || "";
      if (!terms.length || !fullText || !fullText[post.href]) return excerpt;
      var content = fullText[post.href], lower = content.toLocaleLowerCase();
      var term = terms.find(function (value) { return !excerpt.toLocaleLowerCase().includes(value) && lower.includes(value); });
      if (!term) return excerpt;
      var start = Math.max(0, lower.indexOf(term) - 35), end = Math.min(content.length, start + 130);
      return (start ? "…" : "") + content.slice(start, end) + (end < content.length ? "…" : "");
    }
    function renderFeature(post) {
      if (!post || feature.childElementCount) return;
      var link = element("a", "feature-link");
      link.href = post.href;
      var kicker = element("div", "feature-kicker");
      kicker.append(element("span", "feature-label", "最新手记"), element("span", "", "A NEW PAGE IN THE JOURNAL"));
      var bottom = element("div", "feature-bottom");
      var date = element("time", "", post.date.replaceAll("-", "."));
      date.dateTime = post.date;
      bottom.append(date, element("span", "", categoryOf(post) + (post.readingMinutes ? " · 约 " + post.readingMinutes + " 分钟" : "")), element("strong", "", "翻开这一页 ↗"));
      link.append(kicker, element("h3", "", post.title), element("p", "", post.excerpt), bottom);
      feature.appendChild(link);
    }
    function render() {
      if (postsState !== "ready") return;
      var query = search.value.trim().toLocaleLowerCase();
      var terms = query.split(/\s+/).filter(Boolean);
      var results = posts.filter(function (post) {
        var matchesCategory = category === "全部" || categoryOf(post) === category;
        if (!matchesCategory) return false;
        if (!query) return true;
        var content = (fullText && fullText[post.href]) || "";
        var haystack = [post.title, post.excerpt || "", (post.tags || []).join(" "), content].join(" ").toLocaleLowerCase();
        return terms.every(function (term) { return haystack.includes(term); });
      });
      if (sort.value === "oldest") results.reverse();
      var showFeature = category === "全部" && !query && sort.value === "newest" && posts.length > 0;
      feature.hidden = !showFeature;
      renderFeature(posts[0]);
      var list = showFeature ? results.slice(1) : results;
      var visible = list.slice(0, limit);
      box.replaceChildren();
      count.textContent = "共 " + posts.length + " 篇手记";
      status.textContent = query
        ? "找到 " + results.length + " 篇相关手记" + (fullTextLoading ? " · 正在检索全文…" : searchFailed ? " · 全文暂不可用，已搜索标题、摘要与标签" : " · 已搜索标题、标签与正文")
        : category !== "全部" ? category + " · " + results.length + " 篇手记" : "每一篇，都是好奇心留下的脚印。";
      visible.forEach(function (post) {
        var tag = categoryOf(post);
        var link = element(
          "a",
          "post-item",
        );
        link.href = post.href;
        var content = element("div", "post-item__main");
        var meta = element("div", "post-item__meta");
        meta.appendChild(element("span", "post-item__tag", tag));
        var date = element("time", "", (post.date || "").replaceAll("-", "."));
        date.dateTime = post.date || "";
        meta.appendChild(date);
        if (post.readingMinutes) meta.appendChild(element("span", "", "约 " + post.readingMinutes + " 分钟"));
        content.append(
          meta,
          highlighted("h3", "", post.title, terms),
          highlighted("p", "post-item__excerpt", excerptOf(post, terms), terms),
        );
        var bottom = element("div", "post-item__bottom");
        bottom.append(
          element("span", "", (post.tags || []).slice(0, 3).join(" / ") || "SANMUA / JOURNAL"),
          element("span", "", "阅读全文 ↗"),
        );
        content.appendChild(bottom);
        var artwork = illustrations[categoryOf(post)] || illustrations["随笔"];
        var art = element(
          "div",
          "post-art post-art--" + artwork[2],
          artwork[0],
        );
        art.setAttribute("aria-hidden", "true");
        art.appendChild(element("small", "", artwork[1]));
        link.append(content, art);
        box.appendChild(link);
      });
      if (!results.length) {
        var empty = element("div", "empty-state");
        empty.appendChild(element("div", "empty-illustration", "⌕"));
        empty.appendChild(
          element("p", "", fullTextLoading && query ? "正在检索完整正文，请稍候…" : "还没有找到这篇手记，换个关键词试试？"),
        );
        var reset = element("button", "", "查看全部手记");
        reset.type = "button";
        reset.hidden = Boolean(fullTextLoading && query);
        reset.addEventListener("click", function () {
          search.value = "";
          setCategory("全部");
          search.focus();
        });
        empty.appendChild(reset);
        box.appendChild(empty);
      }
      pagination.hidden = !results.length;
      more.hidden = limit >= list.length;
      browse.textContent = "已翻开 " + (visible.length + (showFeature ? 1 : 0)) + " / " + results.length + " 篇手记";
      more.textContent = "再翻 " + Math.min(pageSize, Math.max(0, list.length - limit)) + " 篇 ↓";
    }
    function setCategory(value) {
      category = value;
      limit = pageSize;
      updateFilters();
      saveState();
      render();
    }
    filters.forEach(function (button) {
      button.addEventListener("click", function () {
        setCategory(button.dataset.filter);
      });
    });
    document.querySelectorAll("[data-topic]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        search.value = "";
        setCategory(link.dataset.topic);
        var journal = document.getElementById("journal");
        journal.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
        var heading = document.getElementById("journal-title");
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      });
    });
    search.addEventListener("input", function () {
      clearTimeout(inputTimer);
      limit = pageSize;
      if (search.value.trim()) ensureFullText();
      inputTimer = setTimeout(function () { saveState(); render(); }, 160);
    });
    sort.addEventListener("change", function () { limit = pageSize; saveState(); render(); });
    more.addEventListener("click", function () {
      var previous = box.children.length;
      limit += pageSize;
      render();
      if (box.children[previous]) box.children[previous].focus({ preventScroll: true });
    });
    document.addEventListener("keydown", function (event) {
      var target = event.target;
      if (target.isContentEditable || target.closest("input, textarea, select")) return;
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); search.focus(); }
    });
    window.addEventListener("popstate", function () { restoreState(); render(); });
    restoreState();
    function fetchPosts() {
      postsState = "loading";
      box.setAttribute("aria-busy", "true");
      // 预渲染的静态列表已就位时不再闪占位文案，避免首屏闪烁。
      if (!box.childElementCount) box.replaceChildren(element("p", "", "正在翻开手记…"));
      fetch("/data/posts.json", { cache: "no-cache" })
        .then(function (response) {
          if (!response.ok) throw new Error("Unable to load posts");
          return response.json();
        })
        .then(function (data) {
          if (!Array.isArray(data)) throw new Error("Invalid post list");
          posts = data
            .filter(function (post) {
              return (
                typeof post.title === "string" &&
                typeof post.href === "string" &&
                post.href.startsWith("/") &&
                !post.href.startsWith("//")
              );
            })
            .sort(function (a, b) {
              return (b.date || "").localeCompare(a.date || "");
            });
          postsState = "ready";
          box.removeAttribute("aria-busy");
          filters.forEach(function (button) {
            var total = posts.filter(function (post) { return button.dataset.filter === "全部" || categoryOf(post) === button.dataset.filter; }).length;
            button.appendChild(element("span", "filter-count", total));
          });
          document.querySelectorAll("[data-topic-count]").forEach(function (node) {
            node.textContent = String(posts.filter(function (post) { return categoryOf(post) === node.dataset.topicCount; }).length).padStart(2, "0");
          });
          render();
        })
        .catch(function () {
          postsState = "error";
          box.removeAttribute("aria-busy");
          count.textContent = "暂时无法加载";
          var error = element("div", "empty-state");
          error.appendChild(element("p", "", "手记暂时没能加载，请稍后再试。"));
          var retry = element("button", "", "重新加载");
          retry.type = "button";
          retry.addEventListener("click", fetchPosts);
          error.appendChild(retry);
          box.replaceChildren(error);
        });
    }
    fetchPosts();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", buildShell);
  else buildShell();
})();
