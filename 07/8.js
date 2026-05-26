// 8. 樣板字串中的邏輯運算 (Template Literals with Logic)
const user = "Guest";
const welcomeHtml = `<h1>Welcome, ${user ? user : "Stranger"}</h1>`;
console.log(welcomeHtml);
