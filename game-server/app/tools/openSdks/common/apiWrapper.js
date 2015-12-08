/**
 * Created by xykong on 2014/7/16.
 */

var logger = require('pomelo/node_modules/pomelo-logger').getLogger('openSdks', __filename);
var utils = require('./../../utils');
var config = require('./../../config');
var crypto = require('crypto');
var request = require('request');
var urlencode = require('urlencode');
var Q = require('q');
var _ = require('underscore');
var util = require('util');


var Handler = module.exports;


Handler.rawUrlEncode = function (str) {
    //       discuss at: http://phpjs.org/functions/rawurlencode/
    //      original by: Brett Zamir (http://brett-zamir.me)
    //         input by: travc
    //         input by: Brett Zamir (http://brett-zamir.me)
    //         input by: Michael Grier
    //         input by: Ratheous
    //      bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //      bugfixed by: Brett Zamir (http://brett-zamir.me)
    //      bugfixed by: Joris
    // reimplemented by: Brett Zamir (http://brett-zamir.me)
    // reimplemented by: Brett Zamir (http://brett-zamir.me)
    //             note: This reflects PHP 5.3/6.0+ behavior
    //             note: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
    //             note: pages served as UTF-8
    //        example 1: rawurlencode('Kevin van Zonneveld!');
    //        returns 1: 'Kevin%20van%20Zonneveld%21'
    //        example 2: rawurlencode('http://kevin.vanzonneveld.net/');
    //        returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
    //        example 3: rawurlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
    //        returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'

    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.

    return urlencode(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/~/g, '%7E');
};

Handler.sortObjectByKey = function (obj, needEncode) {
    var self = this;
    var keys = [];
    var sorts = [];

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    keys.sort();
    _.each(keys, function (key) {
        sorts.push(key + '=' + (!!needEncode ? self.rawUrlEncode(obj[key]) : obj[key]));
    });

    return sorts.join('&');
};

Handler.requestWrapper = function (url, cookie) {
    var deferred = Q.defer();

    var now = Date.now();
//    logger.info("send %d request: %s cookie: %j", now, url, cookie);

    var options = {url: url};

    if (!!cookie) {
        var j = request.jar();
        _.each(cookie, function (v, k) {
            j.setCookie(request.cookie(k + '=' + v), url);
        });
        options.jar = j;
    }

    if (!!config.vendors.proxy && !!config.vendors.proxy.url) {
        options.proxy = config.vendors.proxy.url;
    }

    var profiler = utils.profiler();
    request(options, function (error, response, body) {
        profiler.check(1.0, logger, 'requestWrapper request: %s, cookie: %j', url, cookie);

        if (!!error) {
            logger.error("recv %d elapsed %s, request: %s cookie: %j, failed response: %j, error: %s", now,
                         profiler.elapsed(), url, cookie, response, utils.getErrorMessage(error));
        }

        if (!!response && response.statusCode !== 200) {
            logger.error("recv %d elapsed %s, request: %s cookie: %j, statusCode: %j, failed response body: %j, error: %s",
                         now, profiler.elapsed(), url, cookie, response.statusCode, response.body,
                         utils.getErrorMessage(error));
        }

        if (!!error) {
            return deferred.reject(error);
        }

        if (response.statusCode !== 200) {
            return deferred.reject(response);
        }

        try {
            var result = JSON.parse(body);
        }
        catch (error) {
            logger.error("recv %d elapsed %s, request: %s cookie: %j, body: %j, failed parse body, error: %s",
                         now, profiler.elapsed(), url, cookie, body, utils.getErrorMessage(error));
            return deferred.reject(error);
        }

        logger.warn("recv %d elapsed %s, request: %s cookie: %j, response result: %j", now, profiler.elapsed(), url,
                    cookie, result);

        return deferred.resolve(result);
    });

    return deferred.promise;
};

Handler.checkParams = function (requires, params) {
    var result;
    var errorMessage = '';

    _.find(requires, function (v, k) {
        if (!(k in params)) {
            errorMessage += util.format('require key: %s\n', k);
        }
        if (typeof params[k] !== requires[k]) {
            errorMessage +=
                util.format('require type key: %j, require: %j, value: %j, type: %j\n', k, v, params[k],
                            typeof params[k]);
        }
    });

    if (!!errorMessage) {
        result = new Error('Wrong params: ' + errorMessage);
    }

    if (!!result) {
        return Q.reject(result);
    }

    if (_.size(requires) !== _.size(params)) {
        return Q.reject(new Error('Wrong params: require %s, supply:%s' + params));
    }

    return Q.resolve();
};

Handler.request = function (requires, params, cookie, urlMaker) {
    var self = this;
    var deferred = Q.defer();
    self.checkParams(requires, params)
        .then(function () {
                  var url = _.isFunction(urlMaker) ? urlMaker() : urlMaker;

                  deferred.resolve(self.requestWrapper(url, cookie));
              })
        .catch(deferred.reject)
        .done();

    return deferred.promise;
};

Handler.makeSource = function (method, url_path, params) {
    var self = this;

    var strs = method.toUpperCase() + '&' + self.rawUrlEncode(url_path) + '&';

    var sortParams = self.sortObjectByKey(params);

    return strs + self.rawUrlEncode(sortParams);
};


Handler.makeSig = function (method, url_path, params, secret) {
    var self = this;

    var mk = self.makeSource(method, url_path, params);

    var my_sign = crypto.createHmac('sha1', secret).update(mk).digest();

    return my_sign.toString('base64');

};

Handler.makeURL = function (host, url_path, params, appid, secret) {
    var self = this;

    params['ts'] = params['ts'] || Math.floor((new Date).getTime() / 1000);
    params['appid'] = appid;

    var sig = self.makeSig('GET', url_path, params, secret);

    var sortParams = self.sortObjectByKey(params, true);

    return host + url_path + '?' + sortParams + '&sig=' + self.rawUrlEncode(sig);
};
