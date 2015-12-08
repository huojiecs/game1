/**
 * Created by kazi on 2014/6/10.
 */

var logger = require('pomelo/node_modules/pomelo-logger').getLogger('tencent-payment', __filename);
var apiWrapper = require('./../common/apiWrapper');
var config = require('./../../config');
var urlencode = require('urlencode');
var request = require('request');
var Q = require('q');
var _ = require('underscore');


var Handler = module.exports;

var makeCookie = function (path) {

    return {
        session_id: 'openid',
        session_type: 'kp_actoken',
        org_loc: urlencode(path),
        appip: '127.0.0.1'
    };
};

var getAppId = function () {

    if (config.vendors.tencent.platId === 0) {
        return config.vendors.msdkPayment.offerId
    }

    return config.vendors.msdkPayment.appid
};

Handler.get_balance_m = function (params) {
    var path = '/mpay/get_balance_m';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pay_token: 'string',
        pf: 'string',
        pfkey: 'string',
        zoneid: 'number',
        appip: 'string'
    };

    return apiWrapper.request(requires, params, makeCookie(path), function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  getAppId(),
                                  config.vendors.msdkPayment.appKey + '&');
    });
};

Handler.pre_transfer = function (params) {
    var path = '/mpay/pre_transfer';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pay_token: 'string',
        pf: 'string',
        pfkey: 'string',
        userip: 'string',
        zoneid: 'number',
        dstzoneid: 'number',
        amt: 'number',
        receiver: 'number',
        exchange_fee: 'number',
        accounttype: 'string',
        appremark: 'string'
    };

    return apiWrapper.request(requires, params, makeCookie(path), function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  getAppId(),
                                  config.vendors.msdkPayment.appKey + '&');
    });
};

Handler.confirm_transfer = function (params) {
    var path = '/mpay/confirm_transfer';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pay_token: 'string',
        pf: 'string',
        pfkey: 'string',
        userip: 'string',
        zoneid: 'number',
        token_id: 'string',
        accounttype: 'string',
        appremark: 'string'
    };

    return apiWrapper.request(requires, params, makeCookie(path), function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  getAppId(),
                                  config.vendors.msdkPayment.appKey + '&');
    });
};

Handler.cancel_transfer = function (params) {
    var path = '/mpay/cancel_transfer';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pay_token: 'string',
        pf: 'string',
        pfkey: 'string',
        userip: 'string',
        zoneid: 'number',
        token_id: 'string',
        accounttype: 'string',
        appremark: 'string'
    };

    return apiWrapper.request(requires, params, makeCookie(path), function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  getAppId(),
                                  config.vendors.msdkPayment.appKey + '&');
    });
};

Handler.pay_m = function (params) {
    var path = '/mpay/pay_m';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pay_token: 'string',
        pf: 'string',
        pfkey: 'string',
        userip: 'string',
        zoneid: 'number',
        amt: 'number',
        accounttype: 'string'
    };

    return apiWrapper.request(requires, params, makeCookie(path), function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  getAppId(),
                                  config.vendors.msdkPayment.appKey + '&');
    });
};

Handler.cancel_pay_m = function (params) {
    var path = '/mpay/cancel_pay_m';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pay_token: 'string',
        pf: 'string',
        pfkey: 'string',
        userip: 'string',
        zoneid: 'number',
        amt: 'number',
        billno: 'string'
    };

    return apiWrapper.request(requires, params, makeCookie(path), function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  getAppId(),
                                  config.vendors.msdkPayment.appKey + '&');
    });
};


Handler.present_m = function (params) {
    var path = '/mpay/present_m';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pay_token: 'string',
        pf: 'string',
        pfkey: 'string',
        userip: 'string',
        zoneid: 'number',
        discountid: 'number',
        giftid: 'number',
        presenttimes: 'number'
    };

    return apiWrapper.request(requires, params, makeCookie(path), function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  config.vendors.msdkPaymentQQSYGZ.appid,
                                  config.vendors.msdkPaymentQQSYGZ.appKey + '&');
    });
};

/*
 *
 * 2	/v3/r/mpay/subscribe_m (订阅物品查询接口)
 1.1	功能说明
 示例：


 1.2	URL
 示例：
 http://[IP]/v3/r/mpay/subscribe_m

 1.3	格式
 示例：
 JSON
 1.4	HTTP请求方式
 示例：
 GET，POST
 1.5	输入参数说明
 Cookie里面需要包含的参数：
 org_loc     	需要填写: /v3/r/mpay/subscribe_m （注意：如果经过接口机器，需要填写应用签名时使用的URI）

 注意：cookie里面参数的值，需要进行urlencode

 请求参数：
 cmd			固定为：QUERY
 session_id    用户账户类型，参考公共参数说明。
 session_type	session类型，参考公共参数说明。
 openid：		用户帐号id（account），例如openid、uin
 openkey：	用户session。
 appid：		应用的唯一ID。可以通过appid查找APP基本信息。
 zoneid		分区id
 ts：		UNIX时间戳（从格林威治时间1970年01月01日00时00分00秒起至现在的总秒数）。
 sig：		请求串的签名（可以参考下面具体示例，或者到wiki下载SDK）。
 pf：		平台来源，$平台-$渠道-$版本-$业务标识。例如：mobile-1234-kjava-$大厅标识
 pfkey：		跳转到应用首页后，URL后会带该参数。由平台直接传给应用。

 1.6	请求示例
 示例：（仅演示sig生成使用）
 share_secret:56abfbcd12fe46f5ad85ad9f12345678&
 method:GET
 url_path:/v3/r/mpay/subscribe_m
 params:
 appid:15499
 openid:00000000000000000000000014BDF6E4
 openkey:AB43BF3DC5C3C79D358CC5318E41CF59
 pf:qzone
 pfkey:CA641BC173479B8C0B35BC84873B3DB9
 ts:1340880299

 把参数按规则排序后组装：
 key=56abfbcd12fe46f5ad85ad9f12345678&
 source=GET&%2Fv3%2Fr%2Fmpay%2Fquery_qualify_m&appid%3D15499%26openid%3D00000000000000000000000014BDF6E4%26openkey%3DAB43BF3DC5C3C79D358CC5318E41CF59%26pf%3Dqzone%26pfkey%3DCA641BC173479B8C0B35BC84873B3DB9%26ts%3D1340880299

 sha1后得到签名sig：
 sig= c4TL%2FLIXweAju8VWQKv4rIjFG8M%3D

 请求串：
 http://IP/v3/r/mpay/subscribe_m?appid=15499&openid=00000000000000000000000014BDF6E4&openkey=AB43BF3DC5C3C79D358CC5318E41CF59&pf=qzone&pfkey=CA641BC173479B8C0B35BC84873B3DB9&ts=1340880299&sig=NCvVPmnjGbBhNO7GB%2Fy3mQj6czQ%3D
 1.7	返回参数说明
 示例：
 ret：		返回码
 list：		用户开通的业务列表
 productid：	用户开通的订阅物品id
 begintime：	用户订阅的开始时间
 endtime：	用户订阅的结束时间
 paychan：	用户订阅该物品id最后一次的支付渠道
 paysubchan：	用户订阅该物品id最后一次的支付子渠道id
 autopaychan：目前没有使用
 autopaysubchan：目前没有使用
 extend：		预留扩展字段，目前没有使用
 grandtotal_opendays：累计购买天数
 grandtotal_presentdays：累计赠送天数
 first_buy_time：第一次购买时间

 注意：返回的记录中包括已经过期的，需要业务侧根据endtime进行过滤
 1.8	返回码说明
 0：成功；
 1018：登陆校验失败。
 其他：失败
 1.9	正确返回示例
 JSON示例:
 Content-type: text/html; charset=utf-8
 {"ret":0,"list" : [{"productid" : "wemusic_vip_1","begintime" : "2014-06-19 19:34:14","endtime" : "2014-07-09 19:34:14","paychan" : "","paysubchan" : 0,"autopaychan" : "","autopaysubchan" : 0,"extend" : ""}]}
 1.10	错误返回示例
 Content-type: text/html; charset=utf-8
 {"ret":1018,"msg":"请先登录"}

 .[2014-11-12 17:04:48.123] [INFO] openSdks - [E:\xyStudio\WorkSpace\GameRoot\programmers\Dev\Src\server\game-server\app\tools\openSdks\commo
 n\apiWrapper.js] send 1415783088123 request: http://msdktest.qq.com/mpay/subscribe_m?appid=1450001533&cmd=QUERY&openid=CBC62C23B70C899A2A291
 99515D9EF06&openkey=0F3A2F3DBFEED5E2BF85A1E764FC2CF8&pf=desktop_m_qq-2002-android-73213123-qq-1000001036-CBC62C23B70C899A2A29199515D9EF06&pf
 key=7e787feaecbc1ff9b92fd799abb528da&session_id=openid&session_type=kp_actoken&ts=1415783088&zoneid=1&sig=irgc4rBbBFGTYfTt9V%2F79NINrek%3D c
 ookie: {"org_loc":"%2Fmpay%2Fsubscribe_m","appip":"127.0.0.1"}
 [2014-11-12 17:04:48.572] [INFO] openSdks - [E:\xyStudio\WorkSpace\GameRoot\programmers\Dev\Src\server\game-server\app\tools\openSdks\common
 \apiWrapper.js] recv 1415783088123 response: {"ret":0,"list":[{"inner_productid":"BZGZ","begintime":"2014-11-12 17:04:36","endtime":"2562-06
 -10 17:04:36","paychan":"","paysubchan":0,"autopaychan":"","autopaysubchan":0,"grandtotal_opendays":0,"grandtotal_presentdays":199998,"first
 _buy_time":"1970-01-01 08:00:00","extend":""}]}
 { ret: 0,
 list:
 [ { inner_productid: 'BZGZ',
 begintime: '2014-11-12 17:04:36',
 endtime: '2562-06-10 17:04:36',
 paychan: '',
 paysubchan: 0,
 autopaychan: '',
 autopaysubchan: 0,
 grandtotal_opendays: 0,
 grandtotal_presentdays: 199998,
 first_buy_time: '1970-01-01 08:00:00',
 extend: '' } ] }
 */
Handler.subscribe_m = function (params) {
    var path = '/mpay/subscribe_m';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pf: 'string',
        pfkey: 'string',
        cmd: 'string',
        session_id: 'string',
        session_type: 'string',
        zoneid: 'number'
    };

    var cookie = makeCookie(path);

    params['cmd'] = 'QUERY';
    params['session_id'] = cookie.session_id;
    params['session_type'] = cookie.session_type;

    delete cookie['session_id'];
    delete cookie['session_type'];

//    var cookie = {
//        session_id: 'uin',
//        session_type: 'skey',
//        org_loc: urlencode(path),
//        appip: '127.0.0.1'
//    };
//
//    return apiWrapper.request(requires, params, cookie, function () {
//        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
//                                  getAppId(),
//                                  config.vendors.msdkPayment.appKey + '&');
//    });

    return apiWrapper.request(requires, params, cookie, function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  config.vendors.msdkPaymentQQSYGZ.appid,
                                  config.vendors.msdkPaymentQQSYGZ.appKey + '&');
    });
};

Handler.subscribe_m_PRESENT = function (params) {
    var path = '/mpay/subscribe_m';

    var requires = {
        openid: 'string',
        openkey: 'string',
        pf: 'string',
        pfkey: 'string',
        cmd: 'string',
        tss_inner_product_id: 'string',
        buy_quantity: 'number',
        session_id: 'string',
        session_type: 'string',
        zoneid: 'number'
    };

    var cookie = makeCookie(path);

    params['cmd'] = 'PRESENT';
    params['tss_inner_product_id'] = 'BZGZ';
    params['buy_quantity'] = 99999;
    params['session_id'] = cookie.session_id;
    params['session_type'] = cookie.session_type;

    delete cookie['session_id'];
    delete cookie['session_type'];

//    var cookie = {
//        session_id: 'uin',
//        session_type: 'skey',
//        org_loc: urlencode(path),
//        appip: '127.0.0.1'
//    };

    return apiWrapper.request(requires, params, cookie, function () {
        return apiWrapper.makeURL(config.vendors.msdkPayment.hostUrl, path, params,
                                  config.vendors.msdkPaymentQQSYGZ.appid,
                                  config.vendors.msdkPaymentQQSYGZ.appKey + '&');
    });
};
