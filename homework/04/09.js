function greet(user) {
  if (user.name) {
    console.log(`你好，${user.name}`);
  } else {
    console.log("你好，匿名使用者");
  }
}
greet({ name: "Jack" });
greet({});
// 測試結果：
// 你好，Jack
// 你好，匿名使用者
