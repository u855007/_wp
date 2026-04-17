const posts = [{id: 1, t: "A"}, {id: 2, t: "B"}];
let html = "";

posts.forEach(post => {
  html += `<div>${post.t}</div>`;
});
