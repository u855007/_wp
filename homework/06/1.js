function mathTool(num1, num2, action) {
  return action(num1, num2);
}
const sum = mathTool(10, 5, function(a, b) {
  return a + b;
});
const difference = mathTool(10, 5, (a, b) => a - b);
console.log(sum);        
console.log(difference); 
