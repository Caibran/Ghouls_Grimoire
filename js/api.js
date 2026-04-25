/**
 * js/api.js -- Grimoire frontend data loader
 *
 * Fetches /api/projects and /api/posts, then exposes the same
 * globals that the old static scripts did so no other page JS changes.
 *
 * Globals set:
 *   window.PROJECTS      -- array of project objects
 *   window.POSTS_DATA    -- array of post metadata
 *   window.POSTS         -- same array, sorted newest-first
 *
 * Also re-exports rendering helpers from posts.js if already loaded.
 * Fires 'grimoire:ready' on document when data is loaded.
 */
(function () {
  'use strict';

  var BASE = '';  // same origin always

  function get(url) {
    return fetch(BASE + url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }

  Promise.all([
    get('/api/projects'),
    get('/api/posts')
  ]).then(function (results) {
    var projects = results[0] || [];
    var posts    = results[1] || [];

    // Sort newest-first
    posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    // Expose the same globals the old static files did
    window.PROJECTS   = projects;
    window.POSTS_DATA = posts;
    window.POSTS      = posts;

    // Helpers expected by old inline scripts
    window.getProjectPosts = function (slug) {
      return posts.filter(function (p) { return p.project === slug; });
    };
    window.formatDate = function (str) {
      if (!str) return '';
      return new Date(str + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    };

    // Signal that data is ready
    document.dispatchEvent(new Event('grimoire:ready'));

  }).catch(function (err) {
    console.error('Grimoire: failed to load site data', err);
    window.PROJECTS   = [];
    window.POSTS_DATA = [];
    window.POSTS      = [];
    document.dispatchEvent(new Event('grimoire:ready'));
  });

})();
