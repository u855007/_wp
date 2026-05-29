// 3. 陣列的遍歷與字串拼接 (Array forEach & Template Literals)
const posts = [{ id: 1, t: "A" }, { id: 2, t: "B" }];
let html = "";
posts.forEach(post => {
  html += `<div>${post.t}</div>`;
});
console.log(html);
