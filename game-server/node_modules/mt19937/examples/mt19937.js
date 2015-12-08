var mt19937 = require('../');

console.log(mt19937.Seed(4357));

console.log(mt19937.Next());
console.log(mt19937.NextMax(100));
console.log(mt19937.NextMinMax(1000, 2000));

console.log(mt19937.NextDouble());
console.log(mt19937.NextDoubleOne());
console.log(mt19937.NextDoublePositive());

