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
        session_id: 'hy_gameid',
        session_type: 'st_dummy',
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
                                  getAppId(),
                                  config.vendors.msdkPayment.appKey + '&');
    });
};
