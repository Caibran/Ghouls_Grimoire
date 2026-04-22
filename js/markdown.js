/* =============================================================
   js/markdown.js — lightweight Markdown renderer
   Used by both the main site and the admin panel.
   Supports: headings, bold/italic, code blocks, inline code,
   links, lists, blockquotes, hr, paragraphs.
   ============================================================= */
(function () {
  'use strict';

  function parseMarkdown(src) {
    if (!src) return '';

    /* ── 1. Extract fenced code blocks ── */
    var codeBlocks = [];
    var s = src.replace(/```([\w]*)\r?\n([\s\S]*?)```/g, function (_, lang, code) {
      codeBlocks.push({ lang: lang, code: code });
      return '\x00CB' + (codeBlocks.length - 1) + '\x00';
    });

    /* ── 2. Extract inline code ── */
    var inlineCode = [];
    s = s.replace(/`([^`\r\n]+)`/g, function (_, code) {
      inlineCode.push(esc(code));
      return '\x00IC' + (inlineCode.length - 1) + '\x00';
    });

    /* ── 3. Process line-by-line ── */
    var lines  = s.split(/\r?\n/);
    var out    = [];
    var i      = 0;

    while (i < lines.length) {
      var raw = lines[i];

      /* Skip blank */
      if (raw.trim() === '') { out.push(''); i++; continue; }

      /* Code block placeholder */
      if (/^\x00CB\d+\x00$/.test(raw.trim())) {
        out.push(raw.trim()); i++; continue;
      }

      /* Headings */
      var hm = raw.match(/^(#{1,6})\s+(.+)$/);
      if (hm) {
        var lvl = hm[1].length;
        out.push('<h' + lvl + '>' + inline(hm[2], inlineCode) + '</h' + lvl + '>');
        i++; continue;
      }

      /* Horizontal rule */
      if (/^---+$/.test(raw.trim())) {
        out.push('<hr>'); i++; continue;
      }

      /* Blockquote */
      if (/^> /.test(raw)) {
        var bq = [];
        while (i < lines.length && /^> /.test(lines[i])) {
          bq.push(inline(lines[i].slice(2), inlineCode));
          i++;
        }
        out.push('<blockquote>' + bq.join('<br>') + '</blockquote>');
        continue;
      }

      /* Unordered list */
      if (/^[-*] /.test(raw)) {
        var ul = [];
        while (i < lines.length && /^[-*] /.test(lines[i])) {
          ul.push('<li>' + inline(lines[i].replace(/^[-*] /, ''), inlineCode) + '</li>');
          i++;
        }
        out.push('<ul>' + ul.join('') + '</ul>');
        continue;
      }

      /* Ordered list */
      if (/^\d+\. /.test(raw)) {
        var ol = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          ol.push('<li>' + inline(lines[i].replace(/^\d+\.\s+/, ''), inlineCode) + '</li>');
          i++;
        }
        out.push('<ol>' + ol.join('') + '</ol>');
        continue;
      }

      /* Paragraph: collect consecutive non-block lines */
      var para = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^#/.test(lines[i]) &&
        !/^[-*] /.test(lines[i]) &&
        !/^\d+\. /.test(lines[i]) &&
        !/^> /.test(lines[i]) &&
        !/^---+$/.test(lines[i].trim()) &&
        !/^\x00CB/.test(lines[i].trim())
      ) {
        para.push(inline(lines[i], inlineCode));
        i++;
      }
      if (para.length) out.push('<p>' + para.join('\n') + '</p>');
    }

    var html = out.join('\n');

    /* ── 4. Restore fenced code blocks ── */
    html = html.replace(/\x00CB(\d+)\x00/g, function (_, n) {
      var cb = codeBlocks[+n];
      return '<pre><code class="lang-' + (cb.lang || 'text') + '">' + esc(cb.code) + '</code></pre>';
    });

    /* ── 5. Restore inline code ── */
    html = html.replace(/\x00IC(\d+)\x00/g, function (_, n) {
      return '<code>' + inlineCode[+n] + '</code>';
    });

    return html;
  }

  /* ── HTML escape ── */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Inline formatting (bold, italic, links) ── */
  function inline(s, icStore) {
    /* Restore any inline code placeholders first */
    if (icStore) {
      s = s.replace(/\x00IC(\d+)\x00/g, function (_, n) {
        return '<code>' + icStore[+n] + '</code>';
      });
    }
    return s
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  }

  window.parseMarkdown = parseMarkdown;
})();
