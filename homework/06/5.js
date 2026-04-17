const multiplier = factor => n => n * factor;

const double = multiplier(2);
console.log(double(10)); // 20
