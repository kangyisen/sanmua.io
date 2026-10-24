/* 给静态文章页里所有代码块做 highlight.js 高亮（配合 defer 在 hljs 之后加载）。 */
(function () {
  "use strict";
  if (typeof hljs === "undefined") return;
  document.querySelectorAll("pre code").forEach(function (el) {
    hljs.highlightElement(el);
  });
})();
