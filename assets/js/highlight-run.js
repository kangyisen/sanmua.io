/* 给静态文章页里所有代码块做 highlight.js 高亮（配合 defer 在 hljs 之后加载）。 */
(function () {
  "use strict";
  if (typeof hljs === "undefined") return;
  document.querySelectorAll("pre code").forEach(function (el) {
    hljs.highlightElement(el);
  });
  // 兼容个别手写页面里没有 <code> 子元素的裸 <pre> 代码块。
  document.querySelectorAll("pre").forEach(function (el) {
    if (!el.querySelector("code")) hljs.highlightElement(el);
  });
})();
