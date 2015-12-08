# map

Call `fn`, which returns a promise, on each item in `array`, returning new array.

```js

var q = require('q');
require('q-flow'); // extends q

var fn = function (each) {
    return q.when(each + 1);
};

var array = [ 1, 2, 3 ];

q.map(array, fn).then(function (array) {
    expect(array).to.deep.equal([ 2, 3, 4 ]);
});
```

# each

Like `map` except new array is not created.

# find

Find first object in `array` satisfying the condition returned by the promise returned by `fn`.

```js
var array = [ 1, 2, 3 ];
q.find(array, function (each) {
    return q.fcall(function () {
        return each === 2;
    });
}).then(function (result) {
    expect(result).to.equal(2);
});
```

# until

Loop until the promise returned by `fn` returns a truthy value.

```js
q.until(function () {
    return q.fcall(function () {
        /* code which eventually returns true */
    });
}).then(function (each) {
    /* finished */
});
```

# addBack

Allow one to place node-styled callback onto promise. This exits the promise run-loop so that it no longer catches exceptions.

```js
promise.addBack(function (err, result) {
    // gets `err` if failure happened, otherwise `result` is populated
});
```
