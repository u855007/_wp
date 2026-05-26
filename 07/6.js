// 6. JSON 處理 (Parsing JSON)
const jsonStr = '{"title": "Post 1", "tags": ["js", "node"]}';
const obj = JSON.parse(jsonStr);
console.log(obj.tags[1]);
