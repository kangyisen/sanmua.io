/* ============================================================
 * Sanmua · 全站公共脚本
 * 职责：注入导航/页脚、主题切换、当前页高亮、回到顶部、滚动动效
 * 在每个页面 <head> 末尾内联一小段防闪烁脚本；本文件在 </body> 前加载。
 * 标记：<body data-shell="none"> 的页面（彩蛋/demo）不注入外壳。
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 主题 ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
  function getInitialTheme() {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(getInitialTheme());

  /* ---------- 导航配置（根绝对路径，部署在域名根下） ---------- */
  var NAV_LINKS = [
    { href: '/', label: '首页' },
    { href: '/docs/shuxue/shuxue.html', label: '数学专题' },
    { href: '/qisimiaoxiang/qisimiaoxiang.html', label: '杂项' },
    { href: '/friends.html', label: '友链' }
  ];

  function currentPath() {
    var p = window.location.pathname;
    if (p.endsWith('/')) p += 'index.html';
    return p;
  }

  function buildNav() {
    var shell = document.body.getAttribute('data-shell') === 'none';
    if (shell) return;

    var path = currentPath();

    /* 顶部导航 */
    var nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.innerHTML =
      '<div class="site-nav__inner">' +
      '  <a class="site-nav__brand" href="/"><span class="dot"></span>sanmua</a>' +
      '  <div class="site-nav__links" id="navLinks">' +
        NAV_LINKS.map(function (l) {
          var active = (l.href === '/' && (path === '/index.html' || path === '/')) ||
                       (l.href !== '/' && path.indexOf(l.href) === 0);
          return '<a href="' + l.href + '"' + (active ? ' class="is-active"' : '') + '>' + l.label + '</a>';
        }).join('') +
      '  </div>' +
      '  <div style="display:flex;align-items:center;gap:8px;">' +
      '    <button class="theme-toggle" id="themeToggle" aria-label="切换主题">' +
      '      <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
      '      <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' +
      '    </button>' +
      '    <button class="nav-burger" id="navBurger" aria-label="菜单">' +
      '      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
      '    </button>' +
      '  </div>' +
      '</div>';
    document.body.prepend(nav);
    document.body.classList.add('has-nav');

    /* 页脚 */
    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<p>© <span id="y"></span> sanmua · 记录学习、工作与生活</p>';
    document.body.appendChild(footer);

    /* 回到顶部 */
    var top = document.createElement('button');
    top.className = 'back-top';
    top.setAttribute('aria-label', '回到顶部');
    top.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(top);

    /* 年份 */
    var y = footer.querySelector('#y');
    if (y) y.textContent = new Date().getFullYear();

    /* 主题切换 */
    var toggle = document.getElementById('themeToggle');
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });

    /* 移动端菜单 */
    var burger = document.getElementById('navBurger');
    var links = document.getElementById('navLinks');
    burger.addEventListener('click', function () {
      links.classList.toggle('is-open');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('is-open');
    });

    /* 回到顶部显隐 */
    window.addEventListener('scroll', function () {
      top.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* 滚动进入动效 */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-inview');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildNav);
  } else {
    buildNav();
  }
})();
