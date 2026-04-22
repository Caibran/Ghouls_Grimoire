/* =============================================================
   posts.js — rendering utilities
   Depends on: markdown.js (must load first)
   ============================================================= */
(function () {
  'use strict';

  var data = (window.POSTS_DATA || []).slice();
  data.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  window.POSTS = data;

  window.getProjectPosts = function (slug) {
    return data.filter(function (p) { return p.project === slug; });
  };

  window.formatDate = function (str) {
    if (!str) return '';
    var d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  /* ── Full post block ─────────────────────────────────────── */
  window.renderFullPost = function (post) {
    var html = window.parseMarkdown ? window.parseMarkdown(post.md || '') : (post.html || '');
    var tags = (post.tags || []).map(function (t) {
      return '<span class="post-tag">#' + t + '</span>';
    }).join('');

    return '<div class="post-full">' +
      '<div class="post-header">' +
        '<span class="post-project-tag">' + (post.projectLabel || post.project) + '</span>' +
        '<span class="post-title-head">' + post.title + '</span>' +
        '<span class="post-date">' + window.formatDate(post.date) + '</span>' +
      '</div>' +
      '<div class="post-content">' + html + '</div>' +
      (tags ? '<div class="post-tags">' + tags + '</div>' : '') +
    '</div>';
  };

  /* ── Accordion items ─────────────────────────────────────── */
  window.renderAccordion = function (posts) {
    if (!posts.length) return '';
    return '<div class="post-accordion">' +
      posts.map(function (post) {
        var html = window.parseMarkdown ? window.parseMarkdown(post.md || '') : (post.html || '');
        var tags = (post.tags || []).map(function (t) {
          return '<span class="post-tag">#' + t + '</span>';
        }).join('');
        return '<div class="accordion-item" id="acc-' + post.id + '">' +
          '<div class="accordion-toggle" role="button" tabindex="0" aria-expanded="false">' +
            '<div class="accordion-left">' +
              '<span class="accordion-title">' + post.title + '</span>' +
              '<span class="accordion-meta">' +
                '<span class="post-project-tag" style="border:none;padding:0;background:none;font-size:10px">' + (post.projectLabel || post.project) + '</span>' +
                '<span>' + window.formatDate(post.date) + '</span>' +
              '</span>' +
            '</div>' +
            '<span class="accordion-chevron" aria-hidden="true">&#9660;</span>' +
          '</div>' +
          '<div class="accordion-body">' +
            '<div class="post-content">' + html + '</div>' +
            (tags ? '<div class="post-tags" style="margin-top:12px">' + tags + '</div>' : '') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  };

  /* ── Project page feed ───────────────────────────────────── */
  window.renderProjectFeed = function (posts) {
    if (!posts.length) {
      return '<div class="empty-state"><h3>No Posts Yet</h3><p>Check back soon for updates on this project.</p></div>';
    }
    return posts.map(function (p) { return window.renderFullPost(p); }).join('');
  };

})();
