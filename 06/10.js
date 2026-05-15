function calculateTotal(cart, discountFunc) {
  const sum = cart.reduce((acc, cur) => acc + cur, 0);
  return discountFunc(sum);
}

const total = calculateTotal([100, 200, 300], sum => sum - 50);
console.log(total); // 550
