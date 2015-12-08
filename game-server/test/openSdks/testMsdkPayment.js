/**
 * Created by kazi on 2014/6/10.
 */

var assert = require("assert");
var gameConst = require("./../../app/tools/constValue");
var config = require("./../../app/tools/config");
config.ReloadSync(config.defaultConfigPath, 'development');
var apiWrapper = require("./../../app/tools/openSdks/common/apiWrapper");
var msdkPayment = require("./../../app/tools/openSdks/tencent/msdkPayment");
var urlencode = require('urlencode');

var host = 'http://119.147.19.43';
var url_path = '/v3/user/get_info';
var method = 'get';
var secret = '1000001036&';

var params = {
    appid: 1000001036,
    openid: '2CFDA74D5303D50EDA911533F3D13B75',
    openkey: '74597D859642BC25A055EDFEA7346A51',
    pay_token: '7B07DE992F8D64E51190FCCAF332A625',
    pf: 'desktop_m_qq-2002-android-73213123-qq-1000001036-2CFDA74D5303D50EDA911533F3D13B75-1000001036*1*2CFDA74D5303D50EDA911533F3D13B75*80*73213123*1*0',
    pfkey: '6c95cc1bdd9ae4abbebe8baa7af216d9',
    ts: 1420784570,
    appip: '127.0.0.1',
    zoneid: 1
};

var openid = '84124C279AE8509A44D2A6329763DB07'.trim();
var openkey = accessToken = 'B663E1365686FBA4500212EEE915E134   '.trim();
var pf = 'desktop_m_qq-2002-android-73213123-qq-1000001036-84124C279AE8509A44D2A6329763DB07'.trim();
var pay_token = payToken = '99D62453FD67CB6EE65182CFF85E7E25   '.trim();
var pfkey = pf_key = '6401558d713f1f39406d7d139c84ccf0   '.trim();

var pfExtend = '-1000001036*1*2CFDA74D5303D50EDA911533F3D13B75*80*73213123*1*0';


var appid = '1000001036';
var zoneid = '1';
var userip = '127.0.0.1';

var accountType = gameConst.eLoginType.LT_QQ;

describe('makeSource', function () {
    describe('#makeSource()', function () {
        it('should return null and result.', function () {

            console.log(apiWrapper.rawUrlEncode('***~!@#$%^&*()_+|-=`[]{};\':",.<>/?"  \\'));

            console.log(apiWrapper.makeSource(method, url_path, params));

            var checkSource = 'GET&%2Fv3%2Fuser%2Fget_info&appid%3D1000001036%26appip%3D127.0.0.1%26openid%3D2CFDA74D5303D50EDA911533F3D13B75%26openkey%3D74597D859642BC25A055EDFEA7346A51%26pay_token%3D7B07DE992F8D64E51190FCCAF332A625%26pf%3Ddesktop_m_qq-2002-android-73213123-qq-1000001036-2CFDA74D5303D50EDA911533F3D13B75-1000001036%2A1%2A2CFDA74D5303D50EDA911533F3D13B75%2A80%2A73213123%2A1%2A0%26pfkey%3D6c95cc1bdd9ae4abbebe8baa7af216d9%26ts%3D1420784570%26zoneid%3D1';

            console.log(checkSource);

            assert.equal(apiWrapper.makeSource(method, url_path, params), checkSource);
        })
    })
});

describe('makeSig', function () {
    describe('#makeSig()', function () {
        it('should return null and result.', function () {

            console.log(apiWrapper.makeSig(method, url_path, params, secret));

            var checkSource = 'UDlspq/AjtNOXJnHLagCjYogF6w=';

            console.log(checkSource);

            assert.equal(apiWrapper.makeSig(method, url_path, params, secret), checkSource);
        })
    })
});

describe('makeURL', function () {
    describe('#makeURL()', function () {
        it('should return null and result.', function () {

            console.log(apiWrapper.makeURL(host, url_path, params, appid, secret));

            var checkSource = 'http://119.147.19.43/v3/user/get_info?appid=1000001036&appip=127.0.0.1&openid=2CFDA74D5303D50EDA911533F3D13B75&openkey=74597D859642BC25A055EDFEA7346A51&pay_token=7B07DE992F8D64E51190FCCAF332A625&pf=desktop_m_qq-2002-android-73213123-qq-1000001036-2CFDA74D5303D50EDA911533F3D13B75-1000001036%2A1%2A2CFDA74D5303D50EDA911533F3D13B75%2A80%2A73213123%2A1%2A0&pfkey=6c95cc1bdd9ae4abbebe8baa7af216d9&ts=1420784570&zoneid=1&sig=UDlspq%2FAjtNOXJnHLagCjYogF6w%3D';

            console.log(checkSource);


            assert.equal(apiWrapper.makeURL(host, url_path, params, appid, secret), checkSource);
        })
    })
});

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
//            assert.equal(apiWrapper.makeURL(host, url_path, params,
//                                            apiWrapper.makeSig(method, url_path, params, secret)),
//                         'http://opensdktest.tencent.com/mpay/get_balance_m?openid=87FE6F42489F43C6BB1B336B707C236C&openkey=D324EE2F76A93EBEBEB0E5B47BD3CD50&pay_token=30256C483F6DC43F07B5B5482ACE6DD5&appid=1000001036&ts=1402501074&sig=HjkXpxAubdLh9uX4Tv2IFO/Xq2U=&pf=desktop_m_qq-73213123-android-73213123-qq-1000001036-87FE6F42489F43C6BB1B336B707C236C&pfkey=00fc5ba45051607ba3a782596cd721c7&zoneid=1');
//        })
//    })
//});

describe('get_balance_m', function () {
    describe('#get_balance_m()', function () {
        it('should return null and result.', function (done) {

            var params = {
                openid: openid,
                openkey: openkey,
                pay_token: pay_token,
                pf: pf + pfExtend,
                pfkey: pfkey,
                zoneid: zoneid,
                appip: '127.0.0.1'
            };

            msdkPayment.get_balance_m(params, accountType)
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
//                amt: 10,
//                accounttype: 'common',
//                userip: userip,
//            };
//
//            msdkPayment.pay_m(params, accountType)
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
//            msdkPayment.cancel_pay_m(params, accountType)
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
//            msdkPayment.get_balance_m(params, accountType)
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
////                discountid: 1,
////                giftid: 1,
//                presenttimes: 1,
//                userip: userip
//            };
//
//            msdkPayment.present_m(params, accountType)
//                .then(function (result) {
//                          console.log(result);
//                          assert.equal(result.ret, 0);
//
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
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
//            msdkPayment.get_balance_m(params, accountType)
//                .then(function (result) {
//                          console.log(result);
//                          assert.equal(result.ret, 0);
//
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});

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
//            msdkPayment.pre_transfer(params, accountType)
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
//            msdkPayment.confirm_transfer(params, accountType)
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
//            msdkPayment.cancel_transfer(params, accountType)
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
//describe('subscribe_m', function () {
//    describe('#subscribe_m()', function () {
//        it('should return null and result.', function (done) {
//            var params = {
//                openid: openid,
//                openkey: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                zoneid: zoneid
//            };
//            msdkPayment.subscribe_m(params, accountType)
//                .then(function (result) {
//                          console.log(result);
//                          assert.equal(result.ret, 0);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});
//
//
//describe('subscribe_m_PRESENT', function () {
//    describe('#subscribe_m_PRESENT()', function () {
//        it('should return null and result.', function (done) {
//            var params = {
//                openid: openid,
//                openkey: pay_token,
//                pf: pf,
//                pfkey: pfkey,
//                zoneid: zoneid
//            };
//            msdkPayment.subscribe_m_PRESENT(params, accountType)
//                .then(function (result) {
//                          console.log(result);
//                          assert.equal(result.ret, 0);
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});

