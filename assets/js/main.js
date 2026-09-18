/* ============================================================
 * Sanmua · 全站公共脚本
 * 职责：注入顶栏/侧边抽屉/页脚、主题切换、当前页高亮、
 *       回到顶部、打字机、时段问候、滚动动效
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

  /* ---------- 导航配置 ---------- */
  var NAV_LINKS = [
    { href: '/', label: '首页', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
    { href: '/docs/shuxue/shuxue.html', label: '数学专题', icon: 'M4 19V5m0 14h16M8 9l4 4 4-4' },
    { href: '/qisimiaoxiang/qisimiaoxiang.html', label: '杂项', icon: 'M12 2v20M2 12h20' },
    { href: '/friends.html', label: '友链', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' }
  ];
  var GITHUB_URL = 'https://github.com/kangyisen';

  function currentPath() {
    var p = window.location.pathname;
    if (p.endsWith('/')) p += 'index.html';
    return p;
  }
  function isActive(linkHref, path) {
    if (linkHref === '/') return path === '/index.html' || path === '/';
    return path.indexOf(linkHref) === 0;
  }

  var ICON_MOON = '<svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var ICON_SUN = '<svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  var ICON_BURGER = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var ICON_GITHUB = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.27 5.67.41.35.77 1.05.77 2.13v3.16c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>';

  function buildNav() {
    if (document.body.getAttribute('data-shell') === 'none') return;
    var path = currentPath();

    /* 顶栏 */
    var nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.innerHTML =
      '<div class="site-nav__inner">' +
      '  <div style="display:flex;align-items:center;gap:14px;">' +
      '    <button class="nav-burger" id="navBurger" aria-label="菜单" style="display:block;background:none;border:none;color:var(--text);cursor:pointer;padding:6px;">' + ICON_BURGER + '</button>' +
      '    <a class="site-nav__brand" href="/"><span class="logo-mark">S</span>sanmua</a>' +
      '  </div>' +
      '  <div style="display:flex;align-items:center;gap:6px;">' +
      '    <a class="theme-toggle" href="' + GITHUB_URL + '" target="_blank" rel="noopener" aria-label="GitHub" style="text-decoration:none;">' + ICON_GITHUB + '</a>' +
      '    <button class="theme-toggle" id="themeToggle" aria-label="切换主题">' + ICON_MOON + ICON_SUN + '</button>' +
      '  </div>' +
      '</div>';
    document.body.prepend(nav);
    document.body.classList.add('has-nav');

    /* 侧边抽屉 + 遮罩 */
    var drawer = document.createElement('aside');
    drawer.className = 'side-drawer';
    drawer.id = 'sideDrawer';
    drawer.innerHTML =
      '<div class="side-drawer__head">' +
      '  <div class="avatar-sm">S</div>' +
      '  <div><div class="name">sanmua</div><div class="sub">记录学习 · 工作 · 生活</div></div>' +
      '</div>' +
      '<nav>' +
        NAV_LINKS.map(function (l) {
          var active = isActive(l.href, path);
          return '<a href="' + l.href + '"' + (active ? ' class="is-active"' : '') + '>' +
                 '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + l.icon + '"/></svg>' +
                 l.label + '</a>';
        }).join('') +
      '</nav>' +
      '<div class="drawer-foot">© <span id="y"></span> sanmua</div>';
    document.body.appendChild(drawer);

    var mask = document.createElement('div');
    mask.className = 'drawer-mask';
    mask.id = 'drawerMask';
    document.body.appendChild(mask);

    /* 页脚 */
    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = '<p>© <span id="y"></span> sanmua · 记录学习、工作与生活</p>';
    document.body.appendChild(footer);

    /* 回到顶部 */
    var top = document.createElement('button');
    top.className = 'back-top';
    top.setAttribute('aria-label', '回到顶部');
    top.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(top);

    /* 抽屉开关 */
    var burger = document.getElementById('navBurger');
    function openDrawer() { drawer.classList.add('is-open'); mask.classList.add('is-open'); }
    function closeDrawer() { drawer.classList.remove('is-open'); mask.classList.remove('is-open'); }
    burger.addEventListener('click', openDrawer);
    mask.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', closeDrawer); });

    /* 主题切换 */
    document.getElementById('themeToggle').addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });

    /* 回到顶部 */
    window.addEventListener('scroll', function () {
      top.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    /* 年份 */
    var yr = new Date().getFullYear();
    document.querySelectorAll('#y').forEach(function (el) { el.textContent = yr; });

    /* 滚动动效 */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-inview'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(function (el) { io.observe(el); });

    /* 打字机 */
    var typer = document.querySelector('.hero-typing[data-words]');
    if (typer) typeWrite(typer, typer.getAttribute('data-words').split('|'));

    /* 时段问候 */
    var greet = document.querySelector('[data-greet]');
    if (greet) greet.textContent = greeting();
  }

  /* ---------- 打字机 ---------- */
  function typeWrite(el, words) {
    var wi = 0, ci = 0, deleting = false;
    function tick() {
      var word = words[wi];
      el.textContent = word.substring(0, ci);
      var pause;
      if (!deleting && ci < word.length) { ci++; pause = 110; }
      else if (!deleting && ci === word.length) { deleting = true; pause = 1800; }
      else if (deleting && ci > 0) { ci--; pause = 55; }
      else { deleting = false; wi = (wi + 1) % words.length; pause = 300; }
      setTimeout(tick, pause);
    }
    tick();
  }

  /* ---------- 时段问候 ---------- */
  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return '夜深了，注意休息 🌙';
    if (h < 9) return '早上好，新的一天 ☀️';
    if (h < 12) return '上午好，保持专注 💪';
    if (h < 14) return '中午好，记得吃饭 🍚';
    if (h < 18) return '下午好，喝杯茶吧 🍵';
    if (h < 22) return '傍晚好，放松一下 🌆';
    return '晚上好，今天辛苦了 ✨';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildNav);
  } else {
    buildNav();
  }
})();
