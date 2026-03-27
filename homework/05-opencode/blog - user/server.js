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
      max-width: 580px;
      margin: 0 auto;
      border-left: 1px solid #1f1f1f;
      border-right: 1px solid #1f1f1f;
      min-height: 100vh;
      position: relative;
    }
    
    .bg-gradient {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 400px;
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
      padding: 16px 20px;
      z-index: 100;
    }
    
    .header h1 {
      font-size: 22px;
      font-weight: 800;
      background: linear-gradient(135deg, #fff 0%, #1d9bf0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
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
      justify-content: flex-end;
      margin-top: 12px;
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
    <div class="header">
      <h1>𝕏 Blog</h1>
    </div>
    <div class="nav">
      ${user ? `
        <div class="nav-user">
          <div class="avatar">${user.username[0].toUpperCase()}</div>
          <span>@${escapeHtml(user.username)}</span>
        </div>
        <a href="/logout">Logout</a>
      ` : `
        <a href="/login">Login</a>
        <a href="/register" style="background: #1d9bf0; color: #fff; border-radius: 20px;">Sign up</a>
      `}
    </div>
    ${user ? `<div class="tweet-box">
      <form action="/posts" method="POST">
        <div class="user-row">
          <div class="avatar">${user.username[0].toUpperCase()}</div>
          <div class="input-area">
            <textarea name="content" placeholder="What is happening?!" required></textarea>
            <div class="actions">
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
  
  const time = post.created_at ? new Date(post.created_at).toLocaleString('zh-TW') : '';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
      max-width: 580px;
      margin: 0 auto;
      border-left: 1px solid #1f1f1f;
      border-right: 1px solid #1f1f1f;
      min-height: 100vh;
    }
    
    .detail-page { padding: 24px; }
    
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
    
    .detail-page h1 { font-size: 24px; margin-bottom: 4px; }
    .detail-page .meta { color: #71767b; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #1f1f1f; }
    .detail-page .content { font-size: 18px; line-height: 1.7; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="detail-page">
      <a href="/" class="back">←</a>
      <div class="header-row">
        <div class="avatar">${post.username[0].toUpperCase()}</div>
        <div>
          <h1>@${escapeHtml(post.username)}</h1>
          <p class="meta">${time}</p>
        </div>
      </div>
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

initDB().then(() => {
  app.listen(3000, () => console.log('Blog: http://localhost:3000'));
});