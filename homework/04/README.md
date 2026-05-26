## 習題4

AI問答--https://share.google/aimode/sLS9Nl5WemvqakAP1

## 我的測試結果
```sh
PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04>node 01.js
[ 2, 4, 6 ]

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04>node 02.js
120

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 03.js
姓名：小明，電話：0911
姓名：小華，電話：0922

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 04.js
7
6
5
提醒：快到囉！
4
3
2
1
0

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 05.js
B

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 06.js
350

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 07.js
olleh

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 08.js
原物件: 2, 拷貝物件: 99

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 09.js
你好，Jack
你好，匿名使用者

PS C:\Users\peter\OneDrive\桌面\peter\_wp\homework\04> node 10.js
太大了
太大了
太大了
恭喜猜中！
```

## 摘要
這是我為你準備的 10 個練習題範例程式碼與執行結果：
1. 偶數篩選器 (if, for, function)

function filterEvens(arr) {
  let evens = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) evens.push(arr[i]);
  }
  return evens;
}
console.log(filterEvens([1, 2, 3, 4, 5, 6])); // 測試結果：[2, 4, 6]

2. 階層計算機 (while, function)

function factorial(n) {
  let result = 1;
  while (n > 1) {
    result *= n;
    n--;
  }
  return result;
}
console.log(factorial(5)); // 測試結果：120

3. 通訊錄格式化 (JSON, object, for)

const contacts = [
  { name: "小明", phone: "0911" },
  { name: "小華", phone: "0922" }
];for (let i = 0; i < contacts.length; i++) {
  console.log(`姓名：${contacts[i].name}，電話：${contacts[i].phone}`);
}// 測試結果：// 姓名：小明，電話：0911// 姓名：小華，電話：0922

4. 倒數計時器 (while, if)

let count = 7;while (count >= 0) {
  console.log(count);
  if (count > 0 && count % 5 === 0) console.log("提醒：快到囉！");
  count--;
}// 測試結果：7, 6, 5, 提醒：快到囉！, 4, 3, 2, 1, 0

5. 最高分查詢 (array, object, for)

const students = [
  { name: "A", score: 80 },
  { name: "B", score: 95 },
  { name: "C", score: 90 }
];let topStudent = students[0];for (let i = 1; i < students.length; i++) {
  if (students[i].score > topStudent.score) topStudent = students[i];
}
console.log(topStudent.name);// 測試結果："B"

6. 購物車加總 (JSON, for, function)

const cartJSON = '[{"price": 100, "qty": 2}, {"price": 50, "qty": 3}]';function getTotal(jsonStr) {
  const items = JSON.parse(jsonStr);
  let total = 0;
  for (let item of items) {
    total += item.price * item.qty;
  }
  return total;
}
console.log(getTotal(cartJSON));// 測試結果：350

7. 反轉字串 (for, function)

function reverseString(str) {
  let reversed = "";
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}
console.log(reverseString("hello"));// 測試結果："olleh"

8. 物件深拷貝練習 (object, JSON)

let original = { a: 1, b: { c: 2 } };let clone = JSON.parse(JSON.stringify(original));
clone.b.c = 99;
console.log(`原物件: ${original.b.c}, 拷貝物件: ${clone.b.c}`);// 測試結果：原物件: 2, 拷貝物件: 99 (兩者獨立)

9. 打招呼產生器 (function, object, if)

function greet(user) {
  if (user.name) {
    console.log(`你好，${user.name}`);
  } else {
    console.log("你好，匿名使用者");
  }
}
greet({ name: "Jack" });
greet({});// 測試結果：// 你好，Jack// 你好，匿名使用者

10. 數字猜測邏輯 (while, if)

let answer = 7;let guess = 10; while (true) {
  if (guess > answer) {
    console.log("太大了");
    guess--; // 模擬自動調整猜測
  } else if (guess < answer) {
    console.log("太小了");
    guess++;
  } else {
    console.log("恭喜猜中！");
    break;
  }
}// 測試結果：// 太大了// 太大了// 太大了// 恭喜猜中！

你需要我針對其中哪一個範例做更深入的 語法解釋，或是想直接挑戰更高難度的 進階練習 嗎？

