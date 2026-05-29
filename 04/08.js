let original = { a: 1, b: { c: 2 } };
let clone = JSON.parse(JSON.stringify(original));
clone.b.c = 99;
console.log(`原物件: ${original.b.c}, 拷貝物件: ${clone.b.c}`);
// 測試結果：原物件: 2, 拷貝物件: 99 (兩者獨立)
