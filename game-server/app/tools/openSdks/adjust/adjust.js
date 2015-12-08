/**
 * Created by xykong on 2015/5/13.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('tencent-payment', __filename);
var apiWrapper = require('./../common/apiWrapper');
var config = require('./../../config');
var urlencode = require('urlencode');
var request = require('request');
var util = require('util');
var Q = require('q');
var _ = require('underscore');


var Handler = module.exports;

var makeURL = function (host, url_path, params) {
    var self = this;

    var sortParams = apiWrapper.sortObjectByKey(params, true);

    return host + url_path + '?' + sortParams;
};

Handler.revenue = function (params) {
    var path = '/revenue';

    var requires = {
        app_token: 'string',
        event_token: 'string',
        s2s: 'number',
        created_at: 'string',
        revenue: 'number',
        currency: 'string',
        environment: 'string'
    };

    var deviceIds = ['idfa', 'idfv', 'mac', 'mac_md5', 'mac_sha1', 'gps_adid', 'android_id'];
    var found = false;
    _.each(deviceIds, function (deviceId) {
        if (deviceId in params) {
            requires[deviceId] = 'string';
            found = true;
        }
    });

    if (!found) {
        return Q.reject(new Error(util.format('No valid deviceId in params: %j, required one in %j', params,
                                              deviceIds)));
    }

    var adjust = 'idfa' in params || 'idfv' in params ? config.vendors.adjust.ios : config.vendors.adjust.android;

    if (!adjust) {
        return Q.reject(new Error(util.format('No valid adjust configuration %j', config.vendors.adjust)));
    }

    params.created_at = new Date().toISOString();
    params.app_token = adjust.app_token;
    params.event_token = adjust.event_token;
    params.s2s = adjust.s2s;
    params.currency = adjust.currency;
    params.environment = adjust.environment;

    return apiWrapper.request(requires, params, {}, function () {
        return makeURL(adjust.hostUrl, path, params);
    });
};

