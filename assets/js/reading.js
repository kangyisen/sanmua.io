/* Reading tools shared by static posts and exported notebook pages. */
(function () {
  "use strict";

  function create(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function init() {
    var article = document.querySelector("#write, .article-body");
    if (!article || article.dataset.readingReady || document.getElementById("viewTitle")) return;
    article.dataset.readingReady = "true";
    document.body.classList.add("has-reading-tools");

    var text = article.textContent || "";
    var chinese = (text.match(/[\u3400-\u9fff]/g) || []).length;
    var words = (text.match(/[A-Za-z0-9_]+/g) || []).length;
    var minutes = Math.max(1, Math.ceil(chinese / 350 + words / 200));
    var summary = create("span", "reading-time", "约 " + minutes + " 分钟阅读");
    var metadata = document.querySelector(".prose__meta");
    if (metadata) metadata.appendChild(summary);
    else {
      var note = create("p", "reading-summary");
      note.appendChild(summary);
      article.before(note);
    }

    buildOutline(article);
    addCopyButtons(article);
    restoreHeadingFragment(article);
  }

  function restoreHeadingFragment(article) {
    // Generated section IDs do not exist during the browser's first fragment
    // lookup. Resolve once after all reading tools have finished changing layout.
    var fragment = location.hash;
    if (!fragment) return;
    var id;
    try { id = decodeURIComponent(fragment.slice(1)); } catch (_) { return; }
    var target = document.getElementById(id);
    if (!target || !article.contains(target) || !/^H[1-6]$/.test(target.tagName)) return;
    requestAnimationFrame(function () {
      if (location.hash === fragment)
        target.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }

  function buildOutline(article) {
    var headings = Array.from(article.querySelectorAll("h1, h2, h3"))
      .filter(function (heading) { return heading.textContent.trim(); });
    if (headings.length < 3) return;

    var wide = matchMedia("(min-width: 1320px)");
    var outline = create("details", "reading-outline");
    outline.open = wide.matches;
    var summary = create("summary", "reading-outline__summary");
    summary.append(
      create("span", "", "文章目录"),
      create("span", "reading-outline__count", headings.length + " 节"),
    );
    var nav = create("nav", "reading-outline__nav");
    nav.setAttribute("aria-label", "文章目录");
    var list = create("ol", "reading-outline__list");
    var baseLevel = Math.min.apply(null, headings.map(function (heading) {
      return Number(heading.tagName.slice(1));
    }));
    var links = headings.map(function (heading, index) {
      if (!heading.id) {
        var id = "section-" + (index + 1);
        while (document.getElementById(id)) id += "-";
        heading.id = id;
      }
      var item = create("li", "reading-outline__item");
      if (Number(heading.tagName.slice(1)) > baseLevel)
        item.classList.add("reading-outline__item--nested");
      var link = create("a", "", heading.textContent.trim());
      link.href = "#" + encodeURIComponent(heading.id);
      link.addEventListener("click", function () {
        if (!wide.matches) {
          outline.open = false;
          // Collapsing the inline outline shifts every heading. Refresh before
          // the browser follows the fragment so the active section stays exact.
          measure();
        }
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      });
      item.appendChild(link);
      list.appendChild(item);
      return link;
    });
    nav.appendChild(list);
    outline.append(summary, nav);
    article.before(outline);

    var offsets = [];
    var scheduled = false;
    var current = -1;
    function updateActive() {
      scheduled = false;
      var position = window.scrollY + 130;
      var low = 0, high = offsets.length - 1;
      while (low <= high) {
        var middle = (low + high) >> 1;
        if (offsets[middle] <= position) low = middle + 1;
        else high = middle - 1;
      }
      var next = Math.max(0, high);
      if (next === current) return;
      if (current >= 0) links[current].removeAttribute("aria-current");
      links[next].setAttribute("aria-current", "location");
      current = next;
      if (wide.matches && outline.open) {
        var linkRect = links[next].getBoundingClientRect();
        var navRect = nav.getBoundingClientRect();
        if (linkRect.top < navRect.top)
          nav.scrollTop += linkRect.top - navRect.top - 8;
        else if (linkRect.bottom > navRect.bottom)
          nav.scrollTop += linkRect.bottom - navRect.bottom + 8;
      }
    }
    function scheduleActive() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateActive);
    }
    function measure() {
      offsets = headings.map(function (heading) {
        return heading.getBoundingClientRect().top + window.scrollY;
      });
      scheduleActive();
    }
    wide.addEventListener("change", function () {
      outline.open = wide.matches;
      measure();
    });
    outline.addEventListener("toggle", measure);
    window.addEventListener("scroll", scheduleActive, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(measure).observe(article);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  function addCopyButtons(article) {
    article.querySelectorAll("pre").forEach(function (pre, index) {
      // Exported CodeMirror documents can contain a <pre> for every code line.
      if (pre.parentElement.closest("pre") || pre.closest(".CodeMirror")) return;
      var code = pre.querySelector("code");
      var lines = pre.querySelectorAll(".CodeMirror-line");
      var codeText = lines.length
        ? Array.from(lines).map(function (line) { return line.textContent; }).join("\n")
        : (code || pre).textContent;
      if (!codeText || !codeText.trim()) return;

      var wrap = create("div", "code-frame");
      var toolbar = create("div", "code-frame__toolbar");
      var languageClass = code && Array.from(code.classList).find(function (name) {
        return name.indexOf("language-") === 0;
      });
      var language = languageClass ? languageClass.slice(9) : "CODE";
      var copy = create("button", "code-copy", "复制代码");
      copy.type = "button";
      copy.setAttribute("aria-label", "复制第 " + (index + 1) + " 个代码块");
      copy.setAttribute("aria-live", "polite");
      toolbar.append(create("span", "code-frame__language", language), copy);
      pre.before(wrap);
      wrap.append(toolbar, pre);

      var reset;
      copy.addEventListener("click", function () {
        clearTimeout(reset);
        function finish(success) {
          copy.textContent = success ? "已复制 ✓" : "请选择代码后复制";
          reset = setTimeout(function () { copy.textContent = "复制代码"; }, 2200);
        }
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(codeText).then(function () {
            finish(true);
          }).catch(function () { fallbackCopy(codeText, finish); });
        } else fallbackCopy(codeText, finish);
      });
    });
  }

  function fallbackCopy(text, done) {
    var input = create("textarea", "copy-buffer");
    input.value = text;
    input.setAttribute("readonly", "");
    input.setAttribute("aria-label", "待复制的代码");
    document.body.appendChild(input);
    var previousFocus = document.activeElement;
    input.select();
    var success = false;
    try { success = document.execCommand("copy"); } catch (_) {}
    input.remove();
    if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
    done(success);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
