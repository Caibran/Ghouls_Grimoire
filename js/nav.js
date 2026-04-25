/* =============================================================
   nav.js — mobile full-screen overlay, active page, accordions
   ============================================================= */
(function () {
  'use strict';

  /* ── Active page ───────────────────────────────────────── */
  function setActive() {
    var path = window.location.pathname.toLowerCase();
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var href = (link.getAttribute('href') || '').toLowerCase();
      if (!href || href === '#') return;
      var active = false;
      if (path.endsWith(href) || (href !== '' && path.includes(href.replace(/^\.\.\//, '')))) {
        active = true;
      }
      if (href.includes('index.html') && (path === '/' || path === '' || path.endsWith('index.html'))) {
        active = path.endsWith(href.split('/').pop());
      }
      if (active) link.classList.add('active');
    });
    if (path.includes('/projects/')) {
      document.querySelectorAll('[data-section="projects"]').forEach(function (el) {
        el.classList.add('active');
      });
    }
  }

  /* ── Mobile menu ───────────────────────────────────────── */
  function initMobileMenu() {
    var btn  = document.getElementById('nav-hamburger');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    function open() {
      /* Measure where the nav bar actually ends in the viewport
         so the menu always starts exactly below it, whether or
         not the header has scrolled out of view yet. */
      var nav = document.getElementById('nav');
      var navBottom = nav ? Math.round(nav.getBoundingClientRect().bottom) : 48;
      menu.style.paddingTop = navBottom + 'px';

      menu.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    }
    function close() {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }

    btn.addEventListener('click', function () {
      menu.classList.contains('open') ? close() : open();
    });

    /* Close when a link in the menu is tapped */
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    /* Close on outside click (desktop) */
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 680) close();
    });
  }

  /* ── Accordion wiring ──────────────────────────────────── */
  function initAccordions() {
    document.querySelectorAll('.accordion-toggle').forEach(function (toggle) {
      var item = toggle.closest('.accordion-item');
      if (!item) return;

      function doToggle() {
        var open = item.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      }

      toggle.addEventListener('click', doToggle);
      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doToggle(); }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setActive();
    initMobileMenu();
    initAccordions();
  });

  /* Allow external callers to re-wire accordions after dynamic render */
  window.initAccordions = initAccordions;
})();
