function filterEvens(arr) {
  let evens = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] % 2 === 0) evens.push(arr[i]);
  }
  return evens;
}
console.log(filterEvens([1, 2, 3, 4, 5, 6])); 
// 測試結果：[2, 4, 6]
