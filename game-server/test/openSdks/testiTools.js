/**
 * Created by xykong on 2014/7/16.
 */

var assert = require("assert");
var slootiAPI = require("./../../app/Tools/openSdks/iTools/slootiAPI");


//describe('makeSig', function () {
//    describe('#makeSig()', function () {
//        it('should return null and result.', function () {
//            var params = {
//                appid: 1,
//                sessionid: '122_3087c1291639190cb205a6dcd63d902c7e710c0b'
//            };
//            var result = slootiAPI.makeSig(params);
//
//            assert.equal(result, 'ed7f3ccda78c487485a7a552a65543a5');
//        })
//    })
//});
//
//describe('makeURL', function () {
//    describe('#makeURL()', function () {
//        it('should return null and result.', function () {
//            var params = {
//                appid: 1,
//                sessionid: '122_3087c1291639190cb205a6dcd63d902c7e710c0b'
//            };
//            var host = 'https://pay.slooti.com';
//            var url_path = '/?r=auth/verify';
//            var result = slootiAPI.makeURL(host, url_path, params);
//
//            assert.equal(result, 'https://pay.slooti.com/?r=auth/verify&appid=1&sessionid=122_3087c1291639190cb205a6dcd63d902c7e710c0b&sign=ed7f3ccda78c487485a7a552a65543a5');
//        })
//    })
//});

describe('verify', function () {
    describe('#verify()', function () {
        it('should return null and result.', function (done) {
            var params = {
//                appid: 1000001036,
                sessionid: '122_3087c1291639190cb205a6dcd63d902c7e710c0b'
            };

            slootiAPI.verify(params)
                .then(function (result) {
                          console.log(result);
                          done();
                      })
                .fail(function (error) {
                          done(error);
                      });
        })
    })
});

describe('verify', function () {
    describe('#verify()', function () {
        it('should return null and result.', function (done) {
            var params = {
//                appid: 1000001036,
                sessionid: '1269321_sqdttr5a30qe6gnstsbnp2jlm3'
            };

            slootiAPI.verify(params)
                .then(function (result) {
                          console.log(result);
                          done();
                      })
                .fail(function (error) {
                          done(error);
                      });
        })
    })
});
