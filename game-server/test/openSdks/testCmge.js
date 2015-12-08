/**
 * Created by xykong on 2015/2/9.
 */

var assert = require("assert");
var config = require("./../../app/tools/config");
config.ReloadSync(config.defaultConfigPath, 'development');
var cmgeApi = require("./../../app/Tools/openSdks/cmge/cmge");
var _ = require('underscore');


describe('#cmgeApi()', function () {
    it('should return null and result.', function () {

        var params = {
            "userId": "195564975",
            "userName": "no3eye",
            "isVIP": 0,
            "isNewAccount": 0,
            "supportSmsPrices": "",
            "timestamp": 1423462460390,
            "sign": "UB3TParf5nTCrA8QDix1XA=="
        };

        var result = cmgeApi.verify(params);

        assert.equal(result, true);
    })
});

describe('#cmgeApi.verifyPaymentSign()', function () {
    it('should return null and result.', function () {


        //var reqBody = "payName=Google+Play&callBackInfo=1.2.31506&roleName=Carey+Shelley&paySUTime=20150318170638&serverName=%E8%85%BE%E8%AE%AF+Android+Head&payTime=20150318170504&orderStatus=SUCCESS&currency=USD&sign=ba3df79068b4d84835485c024a4f242d&payId=51&amount=499&payType=31&serverId=11001&orderId=1503181705030135481&roleId=78&openId=195564975";
        var reqBody = "payName=Google+Play&callBackInfo=1.2.31506&roleName=Carnegie+Bell&paySUTime=20150318164214&serverName=%E8%85%BE%E8%AE%AF+Android+Head&payTime=20150318164101&orderStatus=SUCCESS&currency=USD&sign=0af0ed2bbf6ed90fcc1bb8e1946b8c3c&payId=51&amount=499&payType=31&serverId=11001&orderId=1503181641010098981&roleId=69&openId=195564975";

        var params = reqBody.split('&');

        console.log(params);

        params = _.reduce(params, function (memo, value) {
            var keys = value.split('=');
            memo[keys[0]] = keys[1];
            return memo;
        }, {});


        console.log(params);

        var result = cmgeApi.verifyPaymentSign(params);

        assert.equal(result, true);
    })
});

