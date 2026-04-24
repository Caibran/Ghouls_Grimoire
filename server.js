#!/usr/bin/env node
/**
 * Ghoul's Grimoire -- Local Dev Server
 * Serves the site and provides file-write API for the admin panel.
 *
 * Usage:  node server.js
 * Then open: http://localhost:3000/admin/
 *
 * API endpoints (POST, JSON body):
 *   POST /api/save-post    { project, filename, content }  -> writes posts/<project>/<filename>
 *   POST /api/delete-post  { project, filename }           -> deletes posts/<project>/<filename>
 *   POST /api/save-js      { filename, content }           -> writes js/<filename>
 *   GET  /api/ping                                         -> {"ok":true} (admin uses to detect local mode)
 */

'use strict';

var http  = require('http');
var fs    = require('fs');
var path  = require('path');
var url   = require('url');

var ROOT = __dirname;
var PORT = 3000;

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

/* ---- Helpers ----------------------------------------------- */
function readBody(req, cb) {
  var chunks = [];
  req.on('data', function(c) { chunks.push(c); });
  req.on('end', function() {
    try { cb(null, JSON.parse(Buffer.concat(chunks).toString())); }
    catch(e) { cb(e, null); }
  });
}

function json(res, code, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function safePath(base, rel) {
  var resolved = path.resolve(base, rel);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

/* ---- API handlers ------------------------------------------ */
function handlePing(req, res) {
  json(res, 200, { ok: true, cwd: ROOT });
}

function handleSavePost(req, res) {
  readBody(req, function(err, body) {
    if (err) return json(res, 400, { error: 'Bad JSON' });
    var project  = (body.project  || '').replace(/[^a-z0-9_-]/gi, '');
    var filename = (body.filename || '').replace(/[^a-z0-9_.@-]/gi, '');
    var content  = body.content || '';
    if (!project || !filename) return json(res, 400, { error: 'Missing project or filename' });
    if (!filename.endsWith('.md')) filename += '.md';
    var dir = safePath(ROOT, path.join('posts', project));
    var fp  = safePath(ROOT, path.join('posts', project, filename));
    if (!dir || !fp) return json(res, 403, { error: 'Invalid path' });
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fp, content, 'utf8');
      console.log('  SAVE  posts/' + project + '/' + filename);
      json(res, 200, { ok: true, path: 'posts/' + project + '/' + filename });
    } catch(e) {
      json(res, 500, { error: e.message });
    }
  });
}

function handleDeletePost(req, res) {
  readBody(req, function(err, body) {
    if (err) return json(res, 400, { error: 'Bad JSON' });
    var project  = (body.project  || '').replace(/[^a-z0-9_-]/gi, '');
    var filename = (body.filename || '').replace(/[^a-z0-9_.@-]/gi, '');
    if (!project || !filename) return json(res, 400, { error: 'Missing project or filename' });
    var fp = safePath(ROOT, path.join('posts', project, filename));
    if (!fp) return json(res, 403, { error: 'Invalid path' });
    try {
      if (fs.existsSync(fp)) { fs.unlinkSync(fp); console.log('  DEL   posts/' + project + '/' + filename); }
      json(res, 200, { ok: true });
    } catch(e) {
      json(res, 500, { error: e.message });
    }
  });
}

function handleSaveJS(req, res) {
  readBody(req, function(err, body) {
    if (err) return json(res, 400, { error: 'Bad JSON' });
    var filename = (body.filename || '').replace(/[^a-z0-9_.-]/gi, '');
    var content  = body.content || '';
    if (!filename || !filename.endsWith('.js')) return json(res, 400, { error: 'Invalid filename' });
    // Only allow known data files
    var allowed = ['posts-data.js', 'projects-data.js'];
    if (allowed.indexOf(filename) === -1) return json(res, 403, { error: 'Not allowed' });
    var fp = safePath(ROOT, path.join('js', filename));
    if (!fp) return json(res, 403, { error: 'Invalid path' });
    try {
      fs.writeFileSync(fp, content, 'utf8');
      console.log('  SAVE  js/' + filename);
      json(res, 200, { ok: true });
    } catch(e) {
      json(res, 500, { error: e.message });
    }
  });
}

/* ---- Static file server ------------------------------------ */
function handleStatic(req, res, urlPath) {
  var decoded = decodeURIComponent(urlPath);
  if (decoded === '/' || decoded === '') decoded = '/index.html';
  var fp = safePath(ROOT, decoded.slice(1));
  if (!fp) { res.writeHead(403); res.end('Forbidden'); return; }
  // If directory, serve index.html within it
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) {
    fp = path.join(fp, 'index.html');
  }
  fs.readFile(fp, function(err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + urlPath);
      return;
    }
    var ext  = path.extname(fp).toLowerCase();
    var mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

/* ---- Main router ------------------------------------------- */
var server = http.createServer(function(req, res) {
  var parsed = url.parse(req.url);
  var p = parsed.pathname || '/';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end(); return;
  }

  // API routes (POST only, except ping)
  if (p === '/api/ping') return handlePing(req, res);
  if (req.method === 'POST') {
    if (p === '/api/save-post')   return handleSavePost(req, res);
    if (p === '/api/delete-post') return handleDeletePost(req, res);
    if (p === '/api/save-js')     return handleSaveJS(req, res);
  }

  // Static files
  handleStatic(req, res, p);
});

server.listen(PORT, '127.0.0.1', function() {
  console.log('');
  console.log('  Grimoire Dev Server');
  console.log('  -------------------');
  console.log('  Site:  http://localhost:' + PORT + '/');
  console.log('  Admin: http://localhost:' + PORT + '/admin/');
  console.log('');
  console.log('  Saves write directly to the project folder.');
  console.log('  When done: git add -A && git commit -m "update" && git push');
  console.log('');
});
