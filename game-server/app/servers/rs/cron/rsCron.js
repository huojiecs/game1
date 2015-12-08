/**
 * Created by yqWang on 14-6-26.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var weddingManager = require('./../../../rs/marry/weddingManager');

module.exports = function (app) {
    return new Cron(app);
};

var Cron = function (app) {
    this.app = app;
};

var cron = Cron.prototype;

// 更新跨天
cron.Update12Info = function () {
    if (weddingManager == null) {
        return;
    }
    logger.warn('weddingUpdate12Info');
    weddingManager.Update12Info();
};




