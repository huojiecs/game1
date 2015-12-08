# mt19937: a node.js Mersenne Twister 19937 generator #

`mt19937` is A Mersenne Twister pseudo-random generator of 32-bit numbers with a state size of 19937 bits.

## Usage ##

### Installing ###

`npm install mt19937`

### About seed ###

The default seed is 4357, Call Seed() set the seed if you need before Fetch any Number.

### Set Seed ###

```js
var mt19937 = require('mt19937');

console.log(mt19937.Seed(4357));
```

### Fetch a 32bit number ###

```js
var mt19937 = require('mt19937');

console.log(mt19937.Next());
```

### Fetch a real number (double) ###

```js
var mt19937 = require('mt19937');

console.log(mt19937.NextDouble());
```

## License ##

(The MIT License)

Copyright (c) 2013 Xiangyi Kong &lt;xy.kong@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
