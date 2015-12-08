/**
 * Created by xykong on 2015/3/20.
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
        session_id: config.vendors.cmgePayment.cookie[accountType].session_id,
        session_type: config.vendors.cmgePayment.cookie[accountType].session_type,
        org_loc: urlencode(path),
        appip: '127.0.0.1'
    };
};

var makeURL = function (host, url_path, params) {
    var self = this;

    var sortParams = apiWrapper.sortObjectByKey(params, true);

    return host + url_path + '?' + sortParams;
};

Handler.query_balance = function (params) {
    var path = '/payment/query_balance';

    var requires = {
        serverId: 'string',
        roleId: 'string',
        sign: 'string'
    };

    var cmgePayment = config.vendors.cmgePayment;

    return apiWrapper.request(requires, params, {}, function () {
        return makeURL(cmgePayment.hostUrl, path, params);
    });
};

Handler.pay_balance = function (params) {
    var path = '/payment/pay_balance';

    var requires = {
        serverId: 'string',
        roleId: 'string',
        sign: 'string',
        amount: 'number'
    };

    var cmgePayment = config.vendors.cmgePayment;

    return apiWrapper.request(requires, params, {}, function () {
        return makeURL(cmgePayment.hostUrl, path, params);
    });
};
