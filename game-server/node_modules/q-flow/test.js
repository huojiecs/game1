/* jshint expr:true */

require('./');

var q      = require('q'),
    expect = require('chai').expect;

describe('q-flow', function () {
    it('each', function (done) {
        var sum = 0;

        return q.each([ 1, 2, 3 ], function (each) {
            sum += each;
            return q.when(each);
        }).then(function (value) {
            expect(value).to.be.undefined;
            expect(sum).to.equal(6);
        }).fin(done);
    });

    it('map', function (done) {
        return q.each([ 1, 2, 3 ], function (each) {
            return q.when(each + 1);
        }).then(function (value) {
            expect(value).to.deep.equal([ 2, 3, 4 ]);
        }).fin(done);
    });

    it('until', function (done) {
        var attempt = 0;
        return q.until(function () {
            return q.fcall(function () {
                return ++attempt > 3;
            });
        }).then(function () {
            expect(attempt).to.equal(4);
        }).fin(done);
    });

    describe('find', function () {
        var fn = function (each) {
            return q.fcall(function () {
                return each >= 3;
            });
        };

        it('returns first match', function (done) {
            return q.find([ 1, 2, 3, 4, 5 ], fn).then(function (item) {
                expect(item).to.equal(3);
            }).fin(done);;
        })

        it('results undefined if nothing matches', function (done) {
            return q.find([1, 1, 1, 1, 1 ], fn).then(function (item) {
                expect(item).to.be.undefined;
            }).fin(done);
        });
    });

    describe('addBack', function () {
        it('passes result on success', function (done) {
            return q.when('test').addBack(function (err, result) {
                expect(err).to.be.null;
                expect(result).to.equal('test');
                done();
            });
        });

        it('passes error on failure', function (done) {
            var error = new Error();

            return q.fcall(function () {
                throw error;
            }).addBack(function (err, result) {
                expect(err).to.equal(error);
                done();
            });
        });
    });
});
