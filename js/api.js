/**
 * js/api.js -- Grimoire frontend data loader
 *
 * Fetches /api/projects and /api/posts, then:
 *  1. Sets window.PROJECTS, window.POSTS / window.POSTS_DATA
 *  2. Auto-populates the nav dropdown on EVERY page (detects URL depth)
 *  3. Fires 'grimoire:ready' so page scripts can render content
 */
(function () {
  'use strict';

  function get(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }

  Promise.all([
    get('/api/projects'),
    get('/api/posts')
  ]).then(function (results) {
    var projects = results[0] || [];
    var posts    = results[1] || [];

    posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    window.PROJECTS   = projects;
    window.POSTS_DATA = posts;
    window.POSTS      = posts;

    window.getProjectPosts = function (slug) {
      return posts.filter(function (p) { return p.project === slug; });
    };
    window.formatDate = function (str) {
      if (!str) return '';
      return new Date(str + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    };

    /* ---- Auto-populate nav dropdown on every page ----
       Detect if we are in a subdirectory (e.g. /projects/eojava.html)
       to build correct relative links.                              */
    var segments = window.location.pathname
      .split('/').filter(function (s) { return s !== ''; });
    /* If pathname has >1 segment we're in a subfolder (projects/) */
    var prefix = segments.length > 1 ? '' : 'projects/';

    var dd = document.getElementById('nav-projects-dropdown');
    var ml = document.getElementById('mobile-projects-links');
    if (dd) dd.innerHTML = projects.map(function (p) {
      return '<a href="' + prefix + p.slug + '.html">' + p.label + '</a>';
    }).join('');
    if (ml) ml.innerHTML = projects.map(function (p) {
      return '<a href="' + prefix + p.slug + '.html" class="indent">' +
             p.label + '</a>';
    }).join('');

    document.dispatchEvent(new Event('grimoire:ready'));

  }).catch(function (err) {
    console.error('Grimoire: failed to load site data:', err);
    /* Still fire ready so pages don't hang */
    window.PROJECTS   = [];
    window.POSTS_DATA = [];
    window.POSTS      = [];
    document.dispatchEvent(new Event('grimoire:ready'));
  });

})();
