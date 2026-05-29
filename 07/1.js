// 1. 物件屬性存取 (Object Property Access)
const post = { id: 1, title: "Hello World", content: "Markdown content" };
console.log(post.title);          // dot notation
console.log(post["title"]);     // bracket notation

// 2. 物件解構賦值 (Object Destructuring)
const req = { body: { title: "JS教學", content: "內容在此", author: "Gemini" } };
const { title, content } = req.body;
console.log(title, content);

// 3. 陣列的遍歷與字串拼接 (Array forEach & Template Literals)
const posts = [{id: 1, t: "A"}, {id: 2, t: "B"}];
let html = "";
posts.forEach(post => {
  html += `<div>${post.t}</div>`;
});
console.log(html);

// 4. 字典與動態參數 (URL Params / Dictionary)
const params = {};
params["id"] = 99;
console.log(params);

// 5. Callback 函數傳參 (Passing Data via Callbacks)
function fetchData(id, callback) {
  const data = { id: id, status: "success" };
  callback(null, data);
}
fetchData(5, (err, result) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(result);
});

// 6. JSON 處理 (Parsing JSON)
const jsonStr = '{"title": "Post 1", "tags": ["js", "node"]}';
const obj = JSON.parse(jsonStr);
console.log(obj.tags[1]);

// 7. 模擬資料庫查詢 (Simulating DB Queries)
function fakeGet(sql, params, callback) {
  callback(null, { title: "Fake Title" });
}
fakeGet("SELECT * FROM posts", [1], (err, row) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(row.title);
});

// 8. 樣板字串中的邏輯運算 (Template Literals with Logic)
const user = "Guest";
const welcomeHtml = `<h1>Welcome, ${user ? user : "Stranger"}</h1>`;
console.log(welcomeHtml);

// 9. 陣列物件的排序與切片 (Sort & Substring)
const contents = [
  "Very long content here",
  "Another Very long content here",
  "3rd Very long content here"
];
const shortText = contents[0].substring(0, 10) + "...";
console.log(shortText);

// 10. 錯誤優先回呼模式 (Error-First Callback Pattern)
function checkAdmin(role, callback) {
  if (role !== "admin") {
    callback("Access Denied");
    return;
  }
  callback(null, "Welcome");
}

checkAdmin("guest", (err, message) => {
  if (err) {
    console.error("guest =>", err);
  } else {
    console.log(message);
  }
});

checkAdmin("admin", (err, message) => {
  if (err) {
    console.error("admin =>", err);
  } else {
    console.log("admin =>", message);
  }
});
