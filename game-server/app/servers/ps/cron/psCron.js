/**
 * Created by yqWang on 14-8-14.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('../../../tools/config');
var playerManager = require('./../../../../app/ps/player/playerManager');
var tbLogClient = require('../../../tools/mysql/tbLogClient');
var tlogger = require('tlog-client').getLogger(__filename);
var utils = require('../../../tools/utils');
var Q = require('q');
var _ = require('underscore');

module.exports = function (app) {
    return new Cron(app);
};

var Cron = function (app) {
    this.app = app;
    updateTime = new Date();
};

var cron = Cron.prototype;

cron.InsetOnlineNum = function () {
    var onLineNum = playerManager.GetOnlineNum();

    var gameappid = config.vendors.msdkOauth.appid;
    if (config.vendors.tencent.areaId == 1) {
        // wx
        gameappid = config.vendors.wxOauth.appid;
    }
    else if (config.vendors.tencent.areaId == 3) {
        gameappid = 'G_' + config.vendors.msdkOauth.appid;
    }

    var GameSvrId = config.list && config.list.serverUid || config.gameServerList.serverUid;
    var PlatID = config.vendors.tencent.platId;
    tlogger.logFormat('PlayerOnlineCount', GameSvrId, new Date(), gameappid, PlatID, onLineNum);

    var timekey = Math.floor(Date.now() / 60000);
    var gsid = config.list.serverUid;
    var platId = config.vendors.tencent.platId;
    var sqlStr = 'CALL sp_saveOnlineInfo(?)';
    var strInfo = '';
    if (platId === 0) { //IOS
        strInfo = '(\'' + gameappid + '\',' + timekey + ',\'' + gsid + '\',' + onLineNum + ', 0)';
    }
    if (platId === 1) { //Android
        strInfo = '(\'' + gameappid + '\',' + timekey + ',\'' + gsid + '\', 0, ' + onLineNum + ')';
    }
    var sqlArgs = [strInfo];
    Q.nfcall(tbLogClient.query, 0, sqlStr, sqlArgs)
        .catch(function (err) {
                   logger.error('insert into online player number error: %s', utils.getErrorMessage(err))
               }).done();
};