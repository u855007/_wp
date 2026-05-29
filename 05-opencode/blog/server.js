const express = require('express');
const initSqlJs = require('sql.js');
const marked = require('marked');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const DB_PATH = path.join(__dirname, 'blog.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  try { db.run('ALTER TABLE posts ADD COLUMN is_public INTEGER DEFAULT 1'); } catch(e) {}
  saveDB();
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'blog-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

app.get('/', (req, res) => {
  const stmt = db.prepare('SELECT posts.id, posts.title, posts.content, posts.created_at, posts.is_public, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.is_public = 1 ORDER BY posts.created_at DESC');
  const posts = [];
  while (stmt.step()) posts.push(stmt.getAsObject());
  stmt.free();
  
  const user = req.session.userId ? (() => {
    const s = db.prepare('SELECT username FROM users WHERE id = ?');
    s.bind([req.session.userId]);
    const u = s.step() ? s.getAsObject() : null;
    s.free();
    return u;
  })() : null;
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>X Blog</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background: #0a0a0a;
      color: #e7e9ea;
      font-family: 'Outfit', -apple-system, sans-serif;
      min-height: 100vh;
    }
    
    .container {
      display: flex;
      max-width: 1280px;
      margin: 0 auto;
      min-height: 100vh;
      position: relative;
    }
    
    .left-sidebar {
      width: 275px;
      padding: 12px;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    
    .sidebar-logo {
      padding: 12px;
      margin-bottom: 4px;
    }
    
    .sidebar-logo h1 {
      font-size: 30px;
      font-weight: 900;
      display: inline;
    }
    
    .sidebar-nav {
      margin-bottom: 20px;
    }
    
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px 16px;
      color: #e7e9ea;
      text-decoration: none;
      font-size: 20px;
      border-radius: 30px;
      transition: all 0.2s;
    }
    
    .sidebar-link:hover {
      background: rgba(29,155,240,0.1);
    }
    
    .sidebar-link.active {
      font-weight: 700;
    }
    
    .sidebar-link .icon {
      font-size: 26px;
    }
    
    .sidebar-user {
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 30px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .sidebar-user:hover {
      background: rgba(29,155,240,0.1);
    }
    
    .sidebar-user .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #9b5de5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }
    
    .sidebar-user-info {
      flex: 1;
    }
    
    .sidebar-user-info .name {
      font-weight: 700;
      font-size: 15px;
    }
    
    .sidebar-user-info .username {
      color: #71767b;
      font-size: 15px;
    }
    
    .main-content {
      flex: 1;
      border-left: 1px solid #1f1f1f;
      border-right: 1px solid #1f1f1f;
      max-width: 600px;
    }
    
    .bg-gradient {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: linear-gradient(180deg, rgba(29,155,240,0.15) 0%, transparent 100%);
      pointer-events: none;
      z-index: 0;
    }
    
    .header {
      position: sticky;
      top: 0;
      background: rgba(10,10,10,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid #1f1f1f;
      padding: 12px 16px;
      z-index: 100;
      cursor: pointer;
    }
    
    .header:hover {
      background: rgba(10,10,10,0.9);
    }
    
    .header h1 {
      font-size: 20px;
      font-weight: 700;
    }
    
    .header-tabs {
      display: flex;
      border-bottom: 1px solid #1f1f1f;
    }
    
    .header-tab {
      flex: 1;
      text-align: center;
      padding: 16px;
      color: #71767b;
      text-decoration: none;
      font-weight: 500;
      position: relative;
      transition: all 0.2s;
    }
    
    .header-tab:hover {
      background: rgba(29,155,240,0.05);
    }
    
    .header-tab.active {
      color: #1d9bf0;
    }
    
    .header-tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: #1d9bf0;
      border-radius: 2px;
    }
    
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid #1f1f1f;
      background: rgba(10,10,10,0.5);
    }
    
    .nav-user {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
    }
    
    .nav-user .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #9b5de5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
    }
    
    .nav a {
      color: #1d9bf0;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 8px 16px;
      border-radius: 20px;
      transition: all 0.2s;
    }
    
    .nav a:hover {
      background: rgba(29,155,240,0.1);
    }
    
    .nav .my-posts-link {
      background: #1f1f1f;
    }
    
    .sidebar-links {
      padding: 8px 12px;
    }
    
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      color: #e7e9ea;
      text-decoration: none;
      border-radius: 30px;
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 4px;
      transition: all 0.2s;
    }
    
    .sidebar-link:hover {
      background: rgba(29,155,240,0.1);
    }
    
    .sidebar-link.active {
      background: rgba(29,155,240,0.15);
      color: #1d9bf0;
    }
    
    .sidebar-link .icon {
      font-size: 20px;
    }
    
    .tweet-box {
      padding: 20px;
      border-bottom: 1px solid #1f1f1f;
      background: linear-gradient(180deg, rgba(29,155,240,0.03) 0%, transparent 100%);
    }
    
    .tweet-box .user-row {
      display: flex;
      gap: 12px;
    }
    
    .tweet-box .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #f15bb5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .tweet-box .input-area {
      flex: 1;
    }
    
    .tweet-box textarea {
      width: 100%;
      background: transparent;
      border: none;
      color: #e7e9ea;
      font-size: 18px;
      resize: none;
      outline: none;
      min-height: 70px;
      font-family: 'Outfit', sans-serif;
    }
    
    .tweet-box textarea::placeholder {
      color: #71767b;
      font-size: 18px;
    }
    
    .tweet-box .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }
    
    .visibility-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #71767b;
      font-size: 14px;
      cursor: pointer;
    }
    
    .visibility-toggle input {
      width: auto;
    }
    
    .tweet-box .btn {
      background: linear-gradient(135deg, #1d9bf0, #1d9bf0);
      color: #fff;
      border: none;
      padding: 10px 24px;
      border-radius: 24px;
      font-weight: 700;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(29,155,240,0.3);
    }
    
    .tweet-box .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(29,155,240,0.4);
    }
    
    .post {
      padding: 20px;
      border-bottom: 1px solid #1f1f1f;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .post:hover {
      background: rgba(255,255,255,0.02);
    }
    
    .post::before {
      content: '';
      position: absolute;
      left: 52px;
      top: 60px;
      width: 2px;
      height: calc(100% - 60px);
      background: #1f1f1f;
    }
    
    .post:hover::before {
      background: #2f3336;
    }
    
    .post-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 6px;
    }
    
    .post-header .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #00f5d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      margin-right: 8px;
      flex-shrink: 0;
    }
    
    .post-header .name {
      font-weight: 700;
      font-size: 16px;
    }
    
    .post-header .username {
      color: #71767b;
      font-size: 15px;
    }
    
    .post-header .time {
      color: #71767b;
      font-size: 15px;
    }
    
    .post-header .badge {
      background: #1f1f1f;
      color: #71767b;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .post-header .badge.public {
      background: rgba(29,155,240,0.2);
      color: #1d9bf0;
    }
    
    .post-content {
      font-size: 16px;
      line-height: 1.6;
      white-space: pre-wrap;
      margin-left: 48px;
      font-weight: 400;
      letter-spacing: 0.2px;
    }
    
    .post-stats {
      display: flex;
      gap: 24px;
      margin-left: 48px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #1f1f1f;
    }
    
    .post-stats span {
      color: #71767b;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .auth-page {
      padding: 40px 24px;
      position: relative;
      z-index: 1;
    }
    
    .auth-page h1 {
      font-size: 36px;
      font-weight: 800;
      margin-bottom: 40px;
      background: linear-gradient(135deg, #fff 0%, #1d9bf0 50%, #9b5de5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .auth-page input {
      width: 100%;
      background: #151515;
      border: 2px solid #1f1f1f;
      color: #e7e9ea;
      padding: 18px;
      border-radius: 12px;
      font-size: 16px;
      margin-bottom: 16px;
      transition: all 0.2s;
      font-family: 'Outfit', sans-serif;
    }
    
    .auth-page input:focus {
      outline: none;
      border-color: #1d9bf0;
      box-shadow: 0 0 0 4px rgba(29,155,240,0.1);
    }
    
    .auth-page button {
      width: 100%;
      background: linear-gradient(135deg, #1d9bf0, #0094f5);
      color: #fff;
      border: none;
      padding: 18px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 17px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 8px 25px rgba(29,155,240,0.3);
    }
    
    .auth-page button:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 35px rgba(29,155,240,0.4);
    }
    
    .auth-page .link {
      text-align: center;
      margin-top: 24px;
      color: #71767b;
    }
    
    .auth-page .link a {
      color: #1d9bf0;
      text-decoration: none;
      font-weight: 600;
    }
    
    .detail-page {
      padding: 24px;
    }
    
    .detail-page .back {
      color: #1d9bf0;
      text-decoration: none;
      font-size: 28px;
      display: inline-block;
      margin-bottom: 20px;
      transition: transform 0.2s;
    }
    
    .detail-page .back:hover {
      transform: scale(1.1);
    }
    
    .detail-page .header-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .detail-page .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #f15bb5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
    }
    
    .detail-page h1 {
      font-size: 24px;
      margin-bottom: 4px;
    }
    
    .detail-page .meta {
      color: #71767b;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #1f1f1f;
      font-size: 15px;
    }
    
    .detail-page .content {
      font-size: 18px;
      line-height: 1.7;
      white-space: pre-wrap;
    }
    
    .empty {
      text-align: center;
      padding: 60px 20px;
      color: #71767b;
    }
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="container">
    <div class="left-sidebar">
      <div class="sidebar-logo">
        <h1>𝕏</h1>
      </div>
      <nav class="sidebar-nav">
        <a href="/" class="sidebar-link ${req.path === '/' ? 'active' : ''}">
          <span class="icon">🏠</span>
          <span>Home</span>
        </a>
        ${user ? `<a href="/my-posts" class="sidebar-link ${req.path === '/my-posts' ? 'active' : ''}">
          <span class="icon">👤</span>
          <span>Profile</span>
        </a>
        <a href="/my-posts?view=self" class="sidebar-link">
          <span class="icon">📝</span>
          <span>My Posts</span>
        </a>
        <a href="/my-posts?filter=private" class="sidebar-link">
          <span class="icon">🔒</span>
          <span>Private</span>
        </a>` : ''}
        ${user ? `<a href="/logout" class="sidebar-link">
          <span class="icon">📤</span>
          <span>Logout</span>
        </a>` : `<a href="/login" class="sidebar-link">
          <span class="icon">🔑</span>
          <span>Login</span>
        </a>`}
      </nav>
      ${user ? `<div class="sidebar-user">
        <div class="avatar">${user.username[0].toUpperCase()}</div>
        <div class="sidebar-user-info">
          <div class="name">@${escapeHtml(user.username)}</div>
          <div class="username">${escapeHtml(user.username)}</div>
        </div>
      </div>` : ''}
    </div>
    <div class="main-content">
      <div class="header" onclick="window.location.href='/'">
        <h1>Home</h1>
      </div>
      <div class="header-tabs">
        <a href="/" class="header-tab active">For you</a>
        <a href="/" class="header-tab">Following</a>
      </div>
    ${user ? `<div class="tweet-box">
      <form action="/posts" method="POST">
        <div class="user-row">
          <div class="avatar">${user.username[0].toUpperCase()}</div>
          <div class="input-area">
            <textarea name="content" placeholder="What is happening?!" required></textarea>
            <div class="actions">
              <label class="visibility-toggle">
                <input type="checkbox" name="is_public" value="1" checked>
                <span>🌐 Public</span>
              </label>
              <button type="submit" class="btn">Post</button>
            </div>
          </div>
        </div>
      </form>
    </div>` : ''}`;
  
  if (posts.length === 0) {
    html += '<div class="empty"><div class="empty-icon">📝</div><p>No posts yet. Be the first!</p></div>';
  }
  
  const colors = ['#1d9bf0', '#f15bb5', '#00f5d4', '#fee440', '#9b5de5', '#ff6b6b'];
  posts.forEach((post, i) => {
    const time = post.created_at ? new Date(post.created_at).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const color = colors[post.username.charCodeAt(0) % colors.length];
    html += `<a href="/post/${post.id}" style="text-decoration:none;color:inherit;display:block">
      <div class="post">
        <div class="post-header">
          <div class="avatar" style="background: linear-gradient(135deg, ${color}, ${colors[(post.username.charCodeAt(0) + 1) % colors.length]})">${post.username[0].toUpperCase()}</div>
          <span class="name">${escapeHtml(post.username)}</span>
          <span class="username">@${escapeHtml(post.username)}</span>
          <span class="time">· ${time}</span>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
        <div class="post-stats">
          <span>💬 0</span>
          <span>🔄 0</span>
          <span>❤️ 0</span>
        </div>
      </div>
    </a>`;
  });
  
  html += `</div>
    </div>
  </div></body></html>`;
  res.send(html);
});

app.get('/post/:id', (req, res) => {
  const stmt = db.prepare('SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?');
  stmt.bind([parseInt(req.params.id)]);
  if (!stmt.step()) {
    stmt.free();
    return res.status(404).send('Not found');
  }
  const post = stmt.getAsObject();
  stmt.free();
  
  if (!post.is_public && (!req.session.userId || req.session.userId !== post.user_id)) {
    return res.status(404).send('Not found');
  }
  
  const user = req.session.userId ? (() => {
    const s = db.prepare('SELECT username FROM users WHERE id = ?');
    s.bind([req.session.userId]);
    const u = s.step() ? s.getAsObject() : null;
    s.free();
    return u;
  })() : null;
  
  const time = post.created_at ? new Date(post.created_at).toLocaleString('zh-TW') : '';
  const colors = ['#1d9bf0', '#f15bb5', '#00f5d4', '#fee440', '#9b5de5'];
  const color = colors[post.username.charCodeAt(0) % colors.length];
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@${escapeHtml(post.username)} - X Blog</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background: #0a0a0a;
      color: #e7e9ea;
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
    }
    
    .container {
      display: flex;
      max-width: 1280px;
      margin: 0 auto;
      min-height: 100vh;
    }
    
    .left-sidebar {
      width: 275px;
      padding: 12px;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    
    .sidebar-logo h1 {
      font-size: 30px;
      font-weight: 900;
      display: inline;
    }
    
    .sidebar-nav { margin-bottom: 20px; }
    
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px 16px;
      color: #e7e9ea;
      text-decoration: none;
      font-size: 20px;
      border-radius: 30px;
      transition: all 0.2s;
    }
    
    .sidebar-link:hover { background: rgba(29,155,240,0.1); }
    .sidebar-link.active { font-weight: 700; }
    .sidebar-link .icon { font-size: 26px; }
    
    .sidebar-user {
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 30px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .sidebar-user:hover { background: rgba(29,155,240,0.1); }
    
    .sidebar-user .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #9b5de5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }
    
    .sidebar-user-info { flex: 1; }
    .sidebar-user-info .name { font-weight: 700; font-size: 15px; }
    .sidebar-user-info .username { color: #71767b; font-size: 15px; }
    
    .main-content {
      flex: 1;
      border-left: 1px solid #1f1f1f;
      border-right: 1px solid #1f1f1f;
      max-width: 600px;
    }
    
    .header {
      position: sticky;
      top: 0;
      background: rgba(10,10,10,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid #1f1f1f;
      padding: 12px 16px;
      z-index: 100;
      cursor: pointer;
    }
    
    .header:hover { background: rgba(10,10,10,0.9); }
    .header h1 { font-size: 20px; font-weight: 700; }
    
    .header-tabs {
      display: flex;
      border-bottom: 1px solid #1f1f1f;
    }
    
    .header-tab {
      flex: 1;
      text-align: center;
      padding: 16px;
      color: #71767b;
      text-decoration: none;
      font-weight: 500;
      position: relative;
    }
    
    .header-tab.active { color: #1d9bf0; }
    .header-tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: #1d9bf0;
      border-radius: 2px;
    }
    
    .post-detail {
      padding: 20px;
      border-bottom: 1px solid #1f1f1f;
    }
    
    .post-detail-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .post-detail-header .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${color}, ${colors[(post.username.charCodeAt(0) + 1) % colors.length]});
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
    }
    
    .post-detail-header .info .name {
      font-weight: 700;
      font-size: 18px;
    }
    
    .post-detail-header .info .username {
      color: #71767b;
      font-size: 15px;
    }
    
    .post-detail .content {
      font-size: 20px;
      line-height: 1.6;
      white-space: pre-wrap;
      margin-left: 60px;
      margin-bottom: 16px;
    }
    
    .post-detail .meta {
      color: #71767b;
      margin-left: 60px;
      padding-bottom: 16px;
      border-bottom: 1px solid #1f1f1f;
      font-size: 15px;
    }
    
    .post-detail .badge {
      display: inline-block;
      background: #1f1f1f;
      color: #71767b;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
      margin-left: 8px;
    }
    
    .post-detail .badge.public {
      background: rgba(29,155,240,0.2);
      color: #1d9bf0;
    }
    
    .back-btn {
      color: #1d9bf0;
      text-decoration: none;
      font-size: 24px;
      display: inline-block;
      margin-bottom: 12px;
      transition: transform 0.2s;
    }
    
    .back-btn:hover { transform: scale(1.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="left-sidebar">
      <div class="sidebar-logo">
        <h1>𝕏</h1>
      </div>
      <nav class="sidebar-nav">
        <a href="/" class="sidebar-link">
          <span class="icon">🏠</span>
          <span>Home</span>
        </a>
        ${user ? `<a href="/my-posts" class="sidebar-link">
          <span class="icon">👤</span>
          <span>Profile</span>
        </a>
        <a href="/my-posts?view=self" class="sidebar-link">
          <span class="icon">📝</span>
          <span>My Posts</span>
        </a>
        <a href="/my-posts?filter=private" class="sidebar-link">
          <span class="icon">🔒</span>
          <span>Private</span>
        </a>` : ''}
        ${user ? `<a href="/logout" class="sidebar-link">
          <span class="icon">📤</span>
          <span>Logout</span>
        </a>` : `<a href="/login" class="sidebar-link">
          <span class="icon">🔑</span>
          <span>Login</span>
        </a>`}
      </nav>
      ${user ? `<div class="sidebar-user">
        <div class="avatar">${user.username[0].toUpperCase()}</div>
        <div class="sidebar-user-info">
          <div class="name">@${escapeHtml(user.username)}</div>
          <div class="username">${escapeHtml(user.username)}</div>
        </div>
      </div>` : ''}
    </div>
    <div class="main-content">
      <div class="header" onclick="window.location.href='/'">
        <h1>Post</h1>
      </div>
      <div class="post-detail">
        <a href="/" class="back-btn">←</a>
        <div class="post-detail-header">
          <div class="avatar">${post.username[0].toUpperCase()}</div>
          <div class="info">
            <div class="name">@${escapeHtml(post.username)}<span class="badge ${post.is_public ? 'public' : ''}">${post.is_public ? '🌐' : '🔒'}</span></div>
            <div class="username">${escapeHtml(post.username)}</div>
          </div>
        </div>
        <div class="content">${escapeHtml(post.content)}</div>
        <div class="meta">${time}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  res.send(html);
});

app.post('/posts', requireLogin, (req, res) => {
  const { content, is_public } = req.body;
  const isPublic = is_public === '1' ? 1 : 0;
  db.run('INSERT INTO posts (user_id, title, content, is_public) VALUES (?, ?, ?, ?)', [req.session.userId, '', content, isPublic]);
  saveDB();
  res.redirect('/');
});

app.get('/register', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Register - X Blog</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #e7e9ea; font-family: 'Outfit', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { width: 100%; max-width: 400px; padding: 24px; }
    h1 { font-size: 36px; font-weight: 800; margin-bottom: 40px; background: linear-gradient(135deg, #fff 0%, #1d9bf0 50%, #9b5de5 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    input { width: 100%; background: #151515; border: 2px solid #1f1f1f; color: #e7e9ea; padding: 18px; border-radius: 12px; font-size: 16px; margin-bottom: 16px; transition: all 0.2s; }
    input:focus { outline: none; border-color: #1d9bf0; box-shadow: 0 0 0 4px rgba(29,155,240,0.1); }
    button { width: 100%; background: linear-gradient(135deg, #1d9bf0, #0094f5); color: #fff; border: none; padding: 18px; border-radius: 30px; font-weight: 700; font-size: 17px; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 25px rgba(29,155,240,0.3); }
    button:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(29,155,240,0.4); }
    .link { text-align: center; margin-top: 24px; color: #71767b; }
    .link a { color: #1d9bf0; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Join 𝕏 Blog</h1>
    <form action="/register" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Create Account</button>
    </form>
    <p class="link">Already have an account? <a href="/login">Sign in</a></p>
  </div>
</body>
</html>`;
  res.send(html);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Username and password required');
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
    saveDB();
    res.redirect('/login');
  } catch (e) {
    res.send('Username already exists');
  }
});

app.get('/login', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Login - X Blog</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #e7e9ea; font-family: 'Outfit', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { width: 100%; max-width: 400px; padding: 24px; }
    h1 { font-size: 36px; font-weight: 800; margin-bottom: 40px; background: linear-gradient(135deg, #fff 0%, #1d9bf0 50%, #9b5de5 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    input { width: 100%; background: #151515; border: 2px solid #1f1f1f; color: #e7e9ea; padding: 18px; border-radius: 12px; font-size: 16px; margin-bottom: 16px; transition: all 0.2s; }
    input:focus { outline: none; border-color: #1d9bf0; box-shadow: 0 0 0 4px rgba(29,155,240,0.1); }
    button { width: 100%; background: linear-gradient(135deg, #1d9bf0, #0094f5); color: #fff; border: none; padding: 18px; border-radius: 30px; font-weight: 700; font-size: 17px; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 25px rgba(29,155,240,0.3); }
    button:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(29,155,240,0.4); }
    .link { text-align: center; margin: 24px 0; color: #71767b; }
    .link a { color: #1d9bf0; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome Back</h1>
    <form action="/login" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Sign In</button>
    </form>
    <p class="link">Don't have an account? <a href="/register">Sign up</a></p>
  </div>
</body>
</html>`;
  res.send(html);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);
  if (!stmt.step()) { stmt.free(); return res.send('Invalid username or password'); }
  const user = stmt.getAsObject();
  stmt.free();
  
  const match = await bcrypt.compare(password, user.password);
  if (match) { req.session.userId = user.id; return res.redirect('/'); }
  res.send('Invalid username or password');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/my-posts', requireLogin, (req, res) => {
  const filter = req.query.filter;
  const view = req.query.view;
  let query = 'SELECT posts.id, posts.title, posts.content, posts.created_at, posts.is_public, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.user_id = ?';
  if (filter === 'private') query += ' AND posts.is_public = 0';
  else if (filter === 'public') query += ' AND posts.is_public = 1';
  query += ' ORDER BY posts.created_at DESC';
  
  const stmt = db.prepare(query);
  stmt.bind([req.session.userId]);
  const posts = [];
  while (stmt.step()) posts.push(stmt.getAsObject());
  stmt.free();
  
  const user = (() => {
    const s = db.prepare('SELECT username FROM users WHERE id = ?');
    s.bind([req.session.userId]);
    const u = s.step() ? s.getAsObject() : null;
    s.free();
    return u;
  })();
  
  const pageTitle = filter === 'private' ? '🔒 Private' : filter === 'public' ? '🌐 Public' : view === 'self' ? '📝 My Posts' : 'Profile';
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@${escapeHtml(user.username)} - X Blog</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background: #0a0a0a;
      color: #e7e9ea;
      font-family: 'Outfit', -apple-system, sans-serif;
      min-height: 100vh;
    }
    
    .container {
      display: flex;
      max-width: 1280px;
      margin: 0 auto;
      min-height: 100vh;
    }
    
    .left-sidebar {
      width: 275px;
      padding: 12px;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    
    .sidebar-logo h1 {
      font-size: 30px;
      font-weight: 900;
      display: inline;
    }
    
    .sidebar-nav { margin-bottom: 20px; }
    
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px 16px;
      color: #e7e9ea;
      text-decoration: none;
      font-size: 20px;
      border-radius: 30px;
      transition: all 0.2s;
    }
    
    .sidebar-link:hover { background: rgba(29,155,240,0.1); }
    .sidebar-link.active { font-weight: 700; }
    .sidebar-link .icon { font-size: 26px; }
    
    .sidebar-user {
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 30px;
      cursor: pointer;
    }
    
    .sidebar-user .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #9b5de5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
    }
    
    .sidebar-user-info { flex: 1; }
    .sidebar-user-info .name { font-weight: 700; font-size: 15px; }
    .sidebar-user-info .username { color: #71767b; font-size: 15px; }
    
    .main-content {
      flex: 1;
      border-left: 1px solid #1f1f1f;
      border-right: 1px solid #1f1f1f;
      max-width: 600px;
    }
    
    .header {
      position: sticky;
      top: 0;
      background: rgba(10,10,10,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid #1f1f1f;
      padding: 12px 16px;
      z-index: 100;
    }
    
    .header h1 { font-size: 20px; font-weight: 700; }
    
    .header-tabs {
      display: flex;
      border-bottom: 1px solid #1f1f1f;
    }
    
    .header-tab {
      flex: 1;
      text-align: center;
      padding: 16px;
      color: #71767b;
      text-decoration: none;
      font-weight: 500;
      position: relative;
      transition: all 0.2s;
    }
    
    .header-tab:hover { background: rgba(29,155,240,0.05); }
    .header-tab.active { color: #1d9bf0; }
    .header-tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: #1d9bf0;
      border-radius: 2px;
    }
    
    .profile-header {
      padding: 20px;
      border-bottom: 1px solid #1f1f1f;
    }
    
    .profile-header .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #9b5de5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 40px;
    }
    
    .profile-header h2 {
      font-size: 20px;
      font-weight: 800;
      margin-top: 12px;
    }
    
    .profile-header .username {
      color: #71767b;
      font-size: 15px;
    }
    
    .post {
      padding: 16px 20px;
      border-bottom: 1px solid #1f1f1f;
      transition: all 0.2s;
      cursor: pointer;
    }
    
    .post:hover { background: rgba(255,255,255,0.02); }
    
    .post-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }
    
    .post-header .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #00f5d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
    }
    
    .post-header .name { font-weight: 700; font-size: 15px; }
    .post-header .username { color: #71767b; font-size: 14px; }
    .post-header .time { color: #71767b; font-size: 14px; }
    
    .post-content {
      font-size: 15px;
      line-height: 1.5;
      white-space: pre-wrap;
      margin-left: 48px;
    }
    
    .post-header .badge {
      background: #1f1f1f;
      color: #71767b;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      margin-left: 8px;
    }
    
    .post-header .badge.public {
      background: rgba(29,155,240,0.2);
      color: #1d9bf0;
    }
    
    .empty {
      text-align: center;
      padding: 60px 20px;
      color: #71767b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="left-sidebar">
      <div class="sidebar-logo">
        <h1>𝕏</h1>
      </div>
      <nav class="sidebar-nav">
        <a href="/" class="sidebar-link">
          <span class="icon">🏠</span>
          <span>Home</span>
        </a>
        <a href="/my-posts" class="sidebar-link ${!filter && !view ? 'active' : ''}">
          <span class="icon">👤</span>
          <span>Profile</span>
        </a>
        <a href="/my-posts?view=self" class="sidebar-link ${view === 'self' ? 'active' : ''}">
          <span class="icon">📝</span>
          <span>My Posts</span>
        </a>
        <a href="/my-posts?filter=private" class="sidebar-link ${filter === 'private' ? 'active' : ''}">
          <span class="icon">🔒</span>
          <span>Private</span>
        </a>
        <a href="/logout" class="sidebar-link">
          <span class="icon">📤</span>
          <span>Logout</span>
        </a>
      </nav>
      <div class="sidebar-user">
        <div class="avatar">${user.username[0].toUpperCase()}</div>
        <div class="sidebar-user-info">
          <div class="name">@${escapeHtml(user.username)}</div>
          <div class="username">${escapeHtml(user.username)}</div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <div class="header">
        <h1>${pageTitle}</h1>
      </div>
      <div class="header-tabs">
        <a href="/my-posts" class="header-tab ${!filter ? 'active' : ''}">Posts</a>
        <a href="/my-posts?filter=public" class="header-tab ${filter === 'public' ? 'active' : ''}">Public</a>
        <a href="/my-posts?filter=private" class="header-tab ${filter === 'private' ? 'active' : ''}">Private</a>
      </div>
      <div class="profile-header">
        <div class="avatar">${user.username[0].toUpperCase()}</div>
        <h2>@${escapeHtml(user.username)}</h2>
        <div class="username">${escapeHtml(user.username)}</div>
      </div>`;
  
  if (posts.length === 0) {
    html += '<div class="empty"><p>You haven\'t posted anything yet.</p></div>';
  }
  
  const colors = ['#1d9bf0', '#f15bb5', '#00f5d4', '#fee440', '#9b5de5'];
  posts.forEach((post, i) => {
    const time = post.created_at ? new Date(post.created_at).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const color = colors[post.username.charCodeAt(0) % colors.length];
    const badgeClass = post.is_public ? 'public' : 'private';
    const badgeText = post.is_public ? '🌐 Public' : '🔒 Private';
    html += `<a href="/post/${post.id}" style="text-decoration:none;color:inherit;display:block">
      <div class="post">
        <div class="post-header">
          <div class="avatar" style="background: linear-gradient(135deg, ${color}, ${colors[(post.username.charCodeAt(0) + 1) % colors.length]})">${post.username[0].toUpperCase()}</div>
          <span class="name">${escapeHtml(post.username)}</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
          <span class="time">· ${time}</span>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
      </div>
    </a>`;
  });
  
  html += `</div>
    </div>
  </div></body></html>`;
  res.send(html);
});

initDB().then(() => {
  app.listen(3000, () => console.log('Blog: http://localhost:3000'));
});