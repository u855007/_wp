const cartJSON = '[{"price": 100, "qty": 2}, {"price": 50, "qty": 3}]';
function getTotal(jsonStr) {
  const items = JSON.parse(jsonStr);
  let total = 0;
  for (let item of items) {
    total += item.price * item.qty;
  }
  return total;
}
console.log(getTotal(cartJSON));
// 測試結果：350
