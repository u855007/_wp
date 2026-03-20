let answer = 7;
let guess = 10; 
while (true) {
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
}
// 測試結果：
// 太大了
// 太大了
// 太大了
// 恭喜猜中！
