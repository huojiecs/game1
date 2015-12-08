/**
 * Created by kazi on 2014/6/10.
 */

var assert = require("assert");
var config = require("./../../app/tools/config");
config.ReloadSync(config.defaultConfigPath, 'development');
var msdkWxPayment = require("./../../app/tools/openSdks/tencent/msdkmsdkWxPayment");

var method = 'get';
var url_path = '/mpay/get_balance_m';

//var params = {
//    appid: 1000001036,
//    openid: 'EC80B842F34B48A0386246FA4BA5B44D',
//    openkey: 'BAB13D3F7CF38F08A81C94E4C4FF1F46',
//    pay_token: '08685A9FACA10444B37FFFE596C1EDD9',
//    pf: 'desktop_m_qq-73213123-android-73213123-qq-1000001036-EC80B842F34B48A0386246FA4BA5B44D',
//    pfkey: '3a755ec2f3db58bb22e4c848bb6d35d6',
//    ts: 1402411706,
//    zoneid: 1
//};


var openid = 'oZ6DRtzkgzAU2OpfFVKhzTRosbyw';
var openkey = accessToken =
              'OezXcEiiBSKSxW0eoylIeMu1cgIgWww0XLd0XmsWF9bwjUL9AvBJ59FjyWX6N1unSyxEEKivWJ9_eR2YOYcLjrnaHWmDqfFmc5WcaOXmpqVkXm-jzRZqbgLeCGrhaeCu9wcdhAY14IUblB656e6W0Q';
var pf = 'desktop_m_wx-2002-android-2002';
var pay_token = payToken =
                '';
var pfkey = pf_key = '3603f769755d00a9801e648255ee4eb1';

var host = 'http://119.147.19.43';

var opensdk_host = 'http://opensdktest.tencent.com';

//var appid = 'wx7347e911e01d54d3';
//var appKey = 'ab612d376c6de0797684cdaefa3c2101';
//var hostUrl = 'http://msdktest.qq.com';
//var secret = appKey + '&';
var zoneid = 1;
var userip = '127.0.0.1';

//describe('makeSource', function () {
//    describe('#makeSource()', function () {
//        it('should return null and result.', function () {
//            assert.equal(msdkWxPayment.makeSource(method, url_path, params), 'GET&%2Fmpay%2Fget_balance_m&appid%3D1000001036%26openid%3DEC80B842F34B48A0386246FA4BA5B44D%26openkey%3DBAB13D3F7CF38F08A81C94E4C4FF1F46%26pay_token%3D08685A9FACA10444B37FFFE596C1EDD9%26pf%3Ddesktop_m_qq-73213123-android-73213123-qq-1000001036-EC80B842F34B48A0386246FA4BA5B44D%26pfkey%3D3a755ec2f3db58bb22e4c848bb6d35d6%26ts%3D1402411706%26zoneid%3D1');
//        })
//    })
//});
//
//describe('makeSig', function () {
//    describe('#makeSig()', function () {
//        it('should return null and result.', function () {
//            assert.equal(msdkWxPayment.makeSig(method, url_path, params, secret), 'cC6c1mkDB8qoRBdn+tsGjKlR80U=');
//        })
//    })
//});
//
//describe('makeURL', function () {
//    describe('#makeURL()', function () {
//        it('should return null and result.', function () {
//            assert.equal(msdkWxPayment.makeURL(host, url_path, params, msdkWxPayment.makeSig(method, url_path, params, secret)), 'http://119.147.19.43/mpay/get_balance_m?appid=1000001036&openid=EC80B842F34B48A0386246FA4BA5B44D&openkey=BAB13D3F7CF38F08A81C94E4C4FF1F46&pay_token=08685A9FACA10444B37FFFE596C1EDD9&pf=desktop_m_qq-73213123-android-73213123-qq-1000001036-EC80B842F34B48A0386246FA4BA5B44D&pfkey=3a755ec2f3db58bb22e4c848bb6d35d6&ts=1402411706&zoneid=1&sig=cC6c1mkDB8qoRBdn%2BtsGjKlR80U%3D');
//        })
//    })
//});
//
//describe('makeURL', function () {
//    describe('#makeURL()', function () {
//        it('should return null and result.', function () {
//
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                appid: appid,
//                ts: 1402501074,
//                pf: pf,
//                pfkey: pfkey,
//                zoneid: 1
//            };
//
//            assert.equal(msdkWxPayment.makeURL(opensdk_host, url_path, params, msdkWxPayment.makeSig(method, url_path, params, secret)), 'http://opensdktest.tencent.com/mpay/get_balance_m?openid=87FE6F42489F43C6BB1B336B707C236C&openkey=D324EE2F76A93EBEBEB0E5B47BD3CD50&pay_token=30256C483F6DC43F07B5B5482ACE6DD5&appid=1000001036&ts=1402501074&sig=HjkXpxAubdLh9uX4Tv2IFO/Xq2U=&pf=desktop_m_qq-73213123-android-73213123-qq-1000001036-87FE6F42489F43C6BB1B336B707C236C&pfkey=00fc5ba45051607ba3a782596cd721c7&zoneid=1');
//        })
//    })
//});
//
describe('get_balance_m', function () {
    describe('#get_balance_m()', function () {
        it('should return null and result.', function (done) {

            var params = {
                openid: openid,
                openkey: openkey,
                pay_token: pay_token,
                pf: pf,
                pfkey: pfkey,
                zoneid: zoneid,
                appip: '127.0.0.1'
            };

            msdkWxPayment.get_balance_m(params)
                .then(function (result) {
                          console.log(result);

                          assert.equal(result.ret, 0);

                          done();
                      })
                .fail(function (error) {
                          done(error);
                      });
        })
    })
});
//
//var billinfo;
//
//describe('pay_m', function () {
//    describe('#pay_m()', function () {
//        it('should return null and result.', function (done) {
//
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                zoneid: zoneid,
//                amt: 1,
//                accounttype: 'common',
//                userip: userip,
//            };
//
//            msdkWxPayment.pay_m(params)
//                .then(function (result) {
//                          billinfo = result;
//                          console.log(result);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
//describe('cancel_pay_m', function () {
//    describe('#cancel_pay_m()', function () {
//        it('should return null and result.', function (done) {
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                zoneid: zoneid,
//                amt: billinfo.used_gen_amt || 0,
//                billno: billinfo.billno || '1234',
//                userip: userip,
//            };
//            msdkWxPayment.cancel_pay_m(params)
//                .then(function (result) {
//                          console.log(result);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
//describe('get_balance_m', function () {
//    describe('#get_balance_m()', function () {
//        it('should return null and result.', function (done) {
//
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                zoneid: zoneid,
//                appip: '127.0.0.1'
//            };
//
//            msdkWxPayment.get_balance_m(params)
//                .then(function (result) {
//                          console.log(result);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
//describe('present_m', function () {
//    describe('#present_m()', function () {
//        it('should return null and result.', function (done) {
//
//
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                zoneid: zoneid,
//                discountid: 1,
//                giftid: 1,
//                presenttimes: 1,
//                userip: userip,
//            };
//
//            msdkWxPayment.present_m(params)
//                .then(function (result) {
//                          console.log(result);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
//var transfer;
//
//describe('pre_transfer', function () {
//    describe('#pre_transfer()', function () {
//        it('should return null and result.', function (done) {
//
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                userip: '127.0.0.1',
//                zoneid: zoneid,
//                dstzoneid: 1,
//                amt: 10,
//                receiver: 10126232,
//                exchange_fee: 1,
//                accounttype: 'common',
//                appremark: 'appremark'
//            };
//
//            msdkWxPayment.pre_transfer(params)
//                .then(function (result) {
//                          transfer = result;
//                          console.log(result);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
//describe('confirm_transfer', function () {
//    describe('#confirm_transfer()', function () {
//        it('should return null and result.', function (done) {
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                userip: userip,
//                zoneid: zoneid,
//                token_id: transfer.token_id || 'AAAA',
//                accounttype: 'common',
//                appremark: 'appremark'
//            };
//            msdkWxPayment.confirm_transfer(params)
//                .then(function (result) {
//                          console.log(result);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
//describe('cancel_transfer', function () {
//    describe('#cancel_transfer()', function () {
//        it('should return null and result.', function (done) {
//            var params = {
//                openid: openid,
//                openkey: openkey,
//                pay_token: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                userip: userip,
//                zoneid: zoneid,
//                token_id: transfer.token_id || 'AAAA',
//                accounttype: 'common',
//                appremark: 'appremark'
//            };
//            msdkWxPayment.cancel_transfer(params)
//                .then(function (result) {
//                          console.log(result);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
