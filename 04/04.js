let count = 7;
while (count >= 0) {
  console.log(count);
  if (count > 0 && count % 5 === 0) console.log("提醒：快到囉！");
  count--;
}
// 測試結果：7, 6, 5, 提醒：快到囉！, 4, 3, 2, 1, 0
