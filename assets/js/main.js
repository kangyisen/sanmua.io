/* Shared navigation, theme preferences and searchable journal. */
(function () {
  "use strict";
  var root = document.documentElement;
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
      '</nav><div class="nav-actions"><button class="theme-toggle" type="button" id="themeToggle"></button><button class="nav-burger" type="button" aria-label="展开导航" aria-expanded="false" aria-controls="siteLinks">☰</button></div></div>';
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
      if (article.id === "write") {
        var back = document.createElement("a");
        back.className = "article-back";
        back.href = "/#journal";
        back.textContent = "← 返回手记";
        article.before(back);
      }
    }
    function updateScroll() {
      top.hidden = window.scrollY < 400;
      if (progress) {
        var max = root.scrollHeight - root.clientHeight;
        progress.style.width =
          (max > 0 ? (root.scrollTop / max) * 100 : 0) + "%";
      }
    }
    window.addEventListener("scroll", updateScroll, { passive: true });
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
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function loadPosts(box) {
    var posts = [],
      category = "全部";
    var search = document.getElementById("postSearch");
    var count = document.getElementById("postCount");
    var filters = document.querySelectorAll("[data-filter]");
    var illustrations = {
      数据库: ["▤", "DATABASE", ""],
      编程: ["</>", "CODE NOTES", "code"],
      数学: ["∑", "MATHEMATICS", ""],
      随笔: ["✎", "LIFE NOTES", "life"],
      杂项: ["✳", "IDEAS", "life"],
    };
    function render() {
      var query = search.value.trim().toLocaleLowerCase();
      var results = posts.filter(function (post) {
        var tags = post.tags || [];
        var matchesCategory =
          category === "全部" ||
          tags.includes(category) ||
          (category === "随笔" && tags.includes("杂项"));
        return (
          matchesCategory &&
          [post.title, post.excerpt || "", tags.join(" ")]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query)
        );
      });
      box.replaceChildren();
      count.textContent = results.length + " / " + posts.length + " 篇手记";
      results.forEach(function (post, index) {
        var featured = index === 0 && category === "全部" && !query;
        var tag = (post.tags || [])[0] || "随笔";
        var link = element(
          "a",
          "post-item" + (featured ? " post-item--featured" : ""),
        );
        link.href = post.href;
        var content = element("div", "post-item__main");
        var meta = element("div", "post-item__meta");
        meta.appendChild(element("span", "post-item__tag", tag));
        var date = element("time", "", (post.date || "").replaceAll("-", "."));
        date.dateTime = post.date || "";
        meta.appendChild(date);
        if (featured) meta.appendChild(element("span", "", "最新手记 ↗"));
        content.append(
          meta,
          element("h3", "", post.title),
          element("p", "post-item__excerpt", post.excerpt || ""),
        );
        var bottom = element("div", "post-item__bottom");
        bottom.append(
          element("span", "", "SANMUA / JOURNAL"),
          element("span", "", "阅读全文 ↗"),
        );
        content.appendChild(bottom);
        var artwork = illustrations[tag] || illustrations["随笔"];
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
        empty.appendChild(
          element("p", "", "还没有找到这篇手记，换个关键词试试？"),
        );
        var reset = element("button", "", "查看全部手记");
        reset.type = "button";
        reset.addEventListener("click", function () {
          search.value = "";
          setCategory("全部");
          search.focus();
        });
        empty.appendChild(reset);
        box.appendChild(empty);
      }
    }
    function setCategory(value) {
      category = value;
      filters.forEach(function (button) {
        var active = button.dataset.filter === value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      render();
    }
    filters.forEach(function (button) {
      button.addEventListener("click", function () {
        setCategory(button.dataset.filter);
      });
    });
    search.addEventListener("input", render);
    function fetchPosts() {
      box.replaceChildren(element("p", "", "正在翻开手记…"));
      fetch("/data/posts.json")
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
          render();
        })
        .catch(function () {
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
