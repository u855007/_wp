function factorial(n) {
  let result = 1;
  while (n > 1) {
    result *= n;
    n--;
  }
  return result;
}
console.log(factorial(5)); 
// 測試結果：120
