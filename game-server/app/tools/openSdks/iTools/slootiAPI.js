/**
 * Created by xykong on 2014/7/16.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('iTools-API', __filename);
var apiWrapper = require('./../common/apiWrapper');
var md5 = require('md5');
var request = require('request');
var Q = require('q');
var _ = require('underscore');

var appid = '1000001036';
var hostUrl = 'https://pay.slooti.com';


var Handler = module.exports;

var makeSource = function (params) {
    // iTools needs appid at first place.

    return apiWrapper.sortObjectByKey(params);
};

var makeSig = function (params) {

    var mk = makeSource(params);

    return md5.digest_s(mk);
};

var makeURL = function (host, url_path, params) {

    if (params) {
        params.appid = appid;
    }

    var result = makeSource(params);
    var sign = makeSig(params);

    return host + url_path + '&' + result + '&sign=' + sign;
};

Handler.verify = function (params) {
    var self = this;
    var path = '/?r=auth/verify';

    var requires = {
//        appid: 'number',
        sessionid: 'string'
    };

    return apiWrapper.request(requires, params, null, function () {
        return makeURL(hostUrl, path, params);
    });
};
