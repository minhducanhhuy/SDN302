const sum = require('./sum');
const subtract = require('./subtract');

const a = 10;
const b = 5;
const c = sum(a, b);
const d = subtract(a, b);
console.log(`The sum of ${a} and ${b} is: ${c}`);
console.log(`The difference of ${a} and ${b} is: ${d}`);