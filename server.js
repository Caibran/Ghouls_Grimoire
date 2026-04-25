'use strict';

/**
 * Ghoul's Grimoire — Express Server
 *
 * Routes:
 *   GET  /api/projects              List all projects
 *   GET  /api/posts                 List all post metadata (sorted newest first)
 *   GET  /api/posts/:project/:file  Read a single post (returns { meta, content })
 *   POST /api/auth                  { password } -> { token } or 401
 *   POST /api/posts         [auth]  { project, filename, content } -> save .md
 *   DELETE /api/posts/:project/:file [auth] -> delete .md
 *   POST /api/projects      [auth]  Full projects array -> overwrite data/projects.json
 *
 * Admin password:  set GRIMOIRE_PW env var, default 'ghoul1234'
 * Port:            set PORT env var, default 3000
 */

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const app   = express();
const ROOT  = __dirname;
const PORT  = process.env.PORT || 3000;
const PW    = process.env.GRIMOIRE_PW || 'ghoul1234';

// ---- Token store (in-memory, survives restarts with a fixed secret) ----
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const activeSessions = new Set();

function makeToken() {
  const tok = crypto.randomBytes(32).toString('hex');
  activeSessions.add(tok);
  return tok;
}
function validToken(tok) {
  return activeSessions.has(tok);
}

// ---- Middleware ----
app.use(express.json({ limit: '2mb' }));
app.use(express.static(ROOT, { index: 'index.html' }));

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const tok  = auth.replace(/^Bearer\s+/i, '').trim();
  if (!tok || !validToken(tok)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ---- Path safety ----
function safePath(base, ...parts) {
  const joined   = path.join(base, ...parts);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

// ---- Post metadata parser ----
function parseFrontmatter(raw) {
  const meta = { title: '', date: '', project: '', projectLabel: '', tags: [] };
  const body_parts = raw.split(/^---\s*$/m);
  let body = raw;

  if (body_parts.length >= 3) {
    const fm = body_parts[1];
    body     = body_parts.slice(2).join('---').trim();
    fm.split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
      if (!m) return;
      const [, key, val] = m;
      if (key === 'tags') {
        meta.tags = val.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        meta[key] = val.trim();
      }
    });
  }

  return { meta, body };
}

// ---- Scan all posts ----
function scanPosts() {
  const postsDir = path.join(ROOT, 'posts');
  const results  = [];

  if (!fs.existsSync(postsDir)) return results;

  const projects = fs.readdirSync(postsDir).filter(d => {
    return fs.statSync(path.join(postsDir, d)).isDirectory();
  });

  projects.forEach(project => {
    const projDir = path.join(postsDir, project);
    const files   = fs.readdirSync(projDir).filter(f => f.endsWith('.md'));
    files.forEach(file => {
      try {
        const raw          = fs.readFileSync(path.join(projDir, file), 'utf8');
        const { meta, body } = parseFrontmatter(raw);
        results.push({
          project,
          filename: file,
          path:     project + '/' + file,
          title:    meta.title        || file.replace(/\.md$/, ''),
          date:     meta.date         || '',
          projectLabel: meta.projectLabel || project,
          tags:     meta.tags         || [],
          md:       body
        });
      } catch (e) { /* skip unreadable files */ }
    });
  });

  results.sort((a, b) => new Date(b.date) - new Date(a.date));
  return results;
}

// ---- Projects helpers ----
function readProjects() {
  const fp = path.join(ROOT, 'data', 'projects.json');
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch (e) { return []; }
}
function writeProjects(arr) {
  const fp = path.join(ROOT, 'data', 'projects.json');
  fs.writeFileSync(fp, JSON.stringify(arr, null, 2), 'utf8');
}

// ================================================================
// ROUTES
// ================================================================

// Auth
app.post('/api/auth', (req, res) => {
  const { password } = req.body || {};
  if (password === PW) {
    return res.json({ token: makeToken() });
  }
  res.status(401).json({ error: 'Incorrect password' });
});

// Projects
app.get('/api/projects', (req, res) => {
  res.json(readProjects());
});

app.post('/api/projects', requireAuth, (req, res) => {
  const projects = req.body;
  if (!Array.isArray(projects)) return res.status(400).json({ error: 'Expected array' });
  try {
    writeProjects(projects);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Posts list
app.get('/api/posts', (req, res) => {
  res.json(scanPosts());
});

// Single post
app.get('/api/posts/:project/:filename', (req, res) => {
  const fp = safePath(ROOT, 'posts', req.params.project, req.params.filename);
  if (!fp || !fp.endsWith('.md')) return res.status(403).json({ error: 'Invalid path' });
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  try {
    const raw          = fs.readFileSync(fp, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    res.json({ meta, content: body, project: req.params.project, filename: req.params.filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Save / create post
app.post('/api/posts', requireAuth, (req, res) => {
  const { project, filename, content } = req.body || {};
  if (!project || !filename || !content) return res.status(400).json({ error: 'Missing fields' });
  const safe = filename.replace(/[^a-z0-9._-]/gi, '');
  if (!safe.endsWith('.md')) return res.status(400).json({ error: 'Filename must end with .md' });

  const dir = safePath(ROOT, 'posts', project);
  const fp  = safePath(ROOT, 'posts', project, safe);
  if (!dir || !fp) return res.status(403).json({ error: 'Invalid path' });

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
    res.json({ ok: true, path: project + '/' + safe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete post
app.delete('/api/posts/:project/:filename', requireAuth, (req, res) => {
  const fp = safePath(ROOT, 'posts', req.params.project, req.params.filename);
  if (!fp || !fp.endsWith('.md')) return res.status(403).json({ error: 'Invalid path' });
  try {
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Logout (invalidate token)
app.post('/api/logout', requireAuth, (req, res) => {
  const tok = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
  activeSessions.delete(tok);
  res.json({ ok: true });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log('');
  console.log("  Ghoul's Grimoire");
  console.log('  ----------------');
  console.log('  http://localhost:' + PORT);
  console.log('  Admin: http://localhost:' + PORT + '/admin/');
  console.log('  Password: set GRIMOIRE_PW env var (default: ghoul1234)');
  console.log('');
});
