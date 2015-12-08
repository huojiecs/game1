/**
 * Created by kazi on 2014/6/18.
 */

var assert = require("assert");
var Q = require('q');
require('q-flow');  // extends q

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        })
    })
});

describe('Q', function () {
    describe('#Q()', function () {
        it('should return null and result.', function (done) {
//            Q.onerror(function (error) {
//                console.error(error);
//            });

            Q.resolve().then(function () {
                console.log("then 1.");
                return Q.reject();
            })
                .then(function () {
                          console.log("then 3.");
                          return Q.reject();
                      })
                .fail(function () {
                          console.log("fail 1.");
                          return Q.reject();
                      })
                .then(function () {
                          console.log("then 2.");
                          return Q.reject();
                      })
                .fail(function () {
                          console.log("fail 2.");
                          return Q.reject();
                      })
                .finally(function () {
                             console.log("finally 1.");
                             return Q.resolve();
                         })
                .fail(function () {
                          console.log("finally 2.");
                          return Q.reject();
                      })
                .finally(function () {
                             console.log("finally 3.");
                             return Q.resolve();
                         })
                .fail(function () {
                          console.log("fail 3.");
                          return Q.resolve();
                      })
                .done(function () {
                          console.log("done 1.");
                          done();
                      });

        })
    })
});


describe('Q', function () {
    describe('#Q()', function () {
        it('should return null and result.', function (done) {

            var outerLoopCount = 3;
            Q.until(function () {
                --outerLoopCount;
                console.log("outerLoopCount: %s", outerLoopCount);
                var innerLoopCount = 2;
                return Q.until(function () {
                    --innerLoopCount;
//                        console.log("innerLoopCount: %s", innerLoopCount);
                    return Q.fcall(function () {
                        console.log("innerLoopCount: %s", innerLoopCount);

                        return innerLoopCount === 0;
                    });
                }).then(function (each) {
                    /* finished */
                    console.log("finished innerLoopCount: %s", innerLoopCount);

                    return outerLoopCount === 0;
                });
            }).then(function (each) {
                /* finished */
                console.log("finished outerLoopCount: %s", outerLoopCount);
                done();
            });

        })
    })
})
;

