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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
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
  secret: 'blog-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

app.get('/', (req, res) => {
  const stmt = db.prepare('SELECT posts.id, posts.title, posts.content, posts.created_at, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY posts.created_at DESC');
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
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>X Blog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; border-left: 1px solid #2f3336; border-right: 1px solid #2f3336; min-height: 100vh; }
    .header { position: sticky; top: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(12px); border-bottom: 1px solid #2f3336; padding: 12px 16px; z-index: 100; }
    .header h1 { font-size: 20px; font-weight: 700; }
    .nav { display: flex; gap: 20px; padding: 12px 16px; border-bottom: 1px solid #2f3336; }
    .nav a { color: #1d9bf0; text-decoration: none; font-weight: 500; }
    .nav a:hover { text-decoration: underline; }
    .tweet-box { padding: 16px; border-bottom: 1px solid #2f3336; }
    .tweet-box textarea { width: 100%; background: transparent; border: none; color: #fff; font-size: 20px; resize: none; outline: none; min-height: 80px; font-family: inherit; }
    .tweet-box textarea::placeholder { color: #71767b; }
    .tweet-box .btn { background: #1d9bf0; color: #fff; border: none; padding: 10px 20px; border-radius: 9999px; font-weight: 700; cursor: pointer; float: right; margin-top: 10px; }
    .tweet-box .btn:hover { background: #1a8cd8; }
    .tweet-box .btn:disabled { opacity: 0.5; }
    .post { padding: 16px; border-bottom: 1px solid #2f3336; cursor: pointer; transition: background 0.2s; }
    .post:hover { background: rgba(255,255,255,0.03); }
    .post-header { display: flex; gap: 4px; margin-bottom: 4px; }
    .post-header .name { font-weight: 700; }
    .post-header .username { color: #71767b; }
    .post-header .time { color: #71767b; }
    .post-content { font-size: 16px; line-height: 1.5; white-space: pre-wrap; }
    .post-content a { color: #1d9bf0; }
    .auth-page { padding: 20px; }
    .auth-page h1 { font-size: 32px; margin-bottom: 32px; }
    .auth-page input { width: 100%; background: #000; border: 1px solid #2f3336; color: #fff; padding: 16px; border-radius: 4px; font-size: 16px; margin-bottom: 16px; }
    .auth-page input:focus { outline: none; border-color: #1d9bf0; }
    .auth-page button { width: 100%; background: #1d9bf0; color: #fff; border: none; padding: 16px; border-radius: 9999px; font-weight: 700; font-size: 16px; cursor: pointer; }
    .auth-page button:hover { background: #1a8cd8; }
    .auth-page .link { text-align: center; margin-top: 20px; color: #1d9bf0; }
    .auth-page .link a { color: #1d9bf0; text-decoration: none; }
    .detail-page { padding: 16px; }
    .detail-page .back { color: #1d9bf0; text-decoration: none; margin-bottom: 12px; display: block; }
    .detail-page .back:hover { text-decoration: underline; }
    .detail-page h1 { font-size: 24px; margin-bottom: 8px; }
    .detail-page .meta { color: #71767b; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #2f3336; }
    .detail-page .content { font-size: 18px; line-height: 1.6; }
    .error { color: #f4212e; margin-bottom: 10px; }
    .empty { text-align: center; padding: 40px; color: #71767b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Home</h1>
    </div>
    <div class="nav">
      ${user ? `<span style="color: #71767b;">@${escapeHtml(user.username)}</span><a href="/logout">Logout</a>` : `<a href="/login">Login</a><a href="/register">Register</a>`}
    </div>
    ${user ? `<div class="tweet-box">
      <form action="/posts" method="POST">
        <textarea name="content" placeholder="What is happening?!" required></textarea>
        <button type="submit" class="btn">Post</button>
      </form>
    </div>` : ''}`;
  
  if (posts.length === 0) {
    html += '<div class="empty">No posts yet</div>';
  }
  
  posts.forEach(post => {
    const time = post.created_at ? new Date(post.created_at).toLocaleString() : '';
    html += `<a href="/post/${post.id}" style="text-decoration:none;color:inherit">
      <div class="post">
        <div class="post-header">
          <span class="name">${escapeHtml(post.username)}</span>
          <span class="username">@${escapeHtml(post.username)}</span>
          <span class="time">· ${time}</span>
        </div>
        <div class="post-content">${escapeHtml(post.content)}</div>
      </div>
    </a>`;
  });
  
  html += `</div></body></html>`;
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
  
  const time = post.created_at ? new Date(post.created_at).toLocaleString() : '';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>@${escapeHtml(post.username)} on X Blog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; border-left: 1px solid #2f3336; border-right: 1px solid #2f3336; min-height: 100vh; }
    .detail-page { padding: 16px; }
    .back { color: #1d9bf0; text-decoration: none; font-size: 24px; }
    .back:hover { text-decoration: underline; }
    h1 { font-size: 24px; margin: 12px 0; }
    .meta { color: #71767b; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #2f3336; }
    .content { font-size: 20px; line-height: 1.6; white-space: pre-wrap; }
    .content a { color: #1d9bf0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="detail-page">
      <a href="/" class="back">←</a>
      <h1>@${escapeHtml(post.username)}</h1>
      <p class="meta">${time}</p>
      <div class="content">${escapeHtml(post.content)}</div>
    </div>
  </div>
</body>
</html>`;
  res.send(html);
});

app.post('/posts', requireLogin, (req, res) => {
  const { content } = req.body;
  db.run('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)', [req.session.userId, '', content]);
  saveDB();
  res.redirect('/');
});

app.get('/register', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Register</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .container { max-width: 400px; margin: 60px auto; padding: 20px; }
    h1 { font-size: 32px; margin-bottom: 32px; }
    input { width: 100%; background: #000; border: 1px solid #2f3336; color: #fff; padding: 16px; border-radius: 4px; font-size: 16px; margin-bottom: 16px; }
    input:focus { outline: none; border-color: #1d9bf0; }
    button { width: 100%; background: #1d9bf0; color: #fff; border: none; padding: 16px; border-radius: 9999px; font-weight: 700; font-size: 16px; cursor: pointer; }
    button:hover { background: #1a8cd8; }
    .link { text-align: center; margin-top: 20px; }
    .link a { color: #1d9bf0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Create account</h1>
    <form action="/register" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Sign up</button>
    </form>
    <p class="link">Already have an account? <a href="/login">Sign in</a></p>
  </div>
</body>
</html>`;
  res.send(html);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.send('Username and password required');
  }
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
  <title>Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .container { max-width: 400px; margin: 60px auto; padding: 20px; }
    h1 { font-size: 32px; margin-bottom: 32px; }
    input { width: 100%; background: #000; border: 1px solid #2f3336; color: #fff; padding: 16px; border-radius: 4px; font-size: 16px; margin-bottom: 16px; }
    input:focus { outline: none; border-color: #1d9bf0; }
    button { width: 100%; background: #1d9bf0; color: #fff; border: none; padding: 16px; border-radius: 9999px; font-weight: 700; font-size: 16px; cursor: pointer; }
    button:hover { background: #1a8cd8; }
    .link { text-align: center; margin-top: 20px; }
    .link a { color: #1d9bf0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sign in</h1>
    <form action="/login" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Sign in</button>
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
  if (!stmt.step()) {
    stmt.free();
    return res.send('Invalid username or password');
  }
  const user = stmt.getAsObject();
  stmt.free();
  
  const match = await bcrypt.compare(password, user.password);
  if (match) {
    req.session.userId = user.id;
    return res.redirect('/');
  }
  res.send('Invalid username or password');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

initDB().then(() => {
  app.listen(3000, () => {
    console.log('Blog running at http://localhost:3000');
  });
});