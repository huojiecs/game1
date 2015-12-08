/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-8-28
 * Time: 下午3:02
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('./../tools/errorCodes');
var config = require('./../tools/config');
var defaultValues = require('./../tools/defaultValues');
var globalFunction = require('./../tools/globalFunction');
var _ = require('underscore');
var messageService = require('./../tools/messageService');

var Handler = module.exports;

Handler.Init = function () {
    this.servers = {};

    logger.info("gameServerList: %j", config.gameServerList);

    this.serverCache = [];

    // total var.
//    public int id;
//    public string displayName;
//    public int maxUsers;
//    public string host;
//    public int port;
//    public int state = 0;             // 0流畅 1繁忙 2拥挤 3维护
//    public bool isNew = false;        // 是否是“新”服务器
//    public int isLastUse = 0;         // 0非上次登录，非最近创建角色 1上次登录 2最近创建过角色 3上次登录并且最近创建过角色
//    public bool isRecommend = false;  // 是否是推荐服务器
//    public int roleNum = 0;           // 拥有的角色数量

    // used in gameServerList
//    "serverUid": "3",
//    "displayName": "QQ 003",
//    "isNew": false,
//    "isRecommend": true

    // used in each list
//    "serverUid": 1,
//    "displayName": null,
//    "maxUsers": 1000,
//    "isNew": false,
//    "isRecommend": false
};

/**
 * //    public int isLastUse = 0;         // 0非上次登录，非最近创建角色 1上次登录 2最近创建过角色 3上次登录并且最近创建过角色
 * @param listRoles
 * @param listLast
 * @returns {Array|*}
 * @constructor
 */
Handler.GenerateServerList = function (listRoles, listLast) {
    var listRolesMap = _.indexBy(listRoles, 'serverUid');
    var serverList = _.map(this.serverCache, function (item) {
        delete item.isLastUse;
        var listRole = listRolesMap[item.serverUid];
        if (listRole) {
            item.isLastUse = 2;
        }

        if (listLast && listLast[0] && listLast[0].serverUid == item.serverUid) {
            item.isLastUse = 1;
        }
        return item;
    });

    logger.info("GenerateServerList listRoles: %j, listLast: %j, serverList: %j", listRoles, listLast, serverList);
    return serverList;
};

/**
 * E:\xyStudio\WorkSpace\GameRoot\designers\7月新需求文档>svn info "2014-5-26 账号相关.docx"
 Path: 2014-5-26 账号相关.docx
 Name: 2014-5-26 账号相关.docx
 Working Copy Root Path: E:\xyStudio\WorkSpace\GameRoot\designers
 URL: https://188.188.0.102/svn/designers/trunk/7%E6%9C%88%E6%96%B0%E9%9C%80%E6%B1%82%E6%96%87%E6%A1%A3/2014-5-26%20%E8%B4%A6%E5%8F%B7%E7%9B%
 B8%E5%85%B3.docx
 Relative URL: ^/trunk/7%E6%9C%88%E6%96%B0%E9%9C%80%E6%B1%82%E6%96%87%E6%A1%A3/2014-5-26%20%E8%B4%A6%E5%8F%B7%E7%9B%B8%E5%85%B3.docx
 Repository Root: https://188.188.0.102/svn/designers
 Repository UUID: 130152ea-c07c-8d46-8bdb-59a157dca98e
 Revision: 1034
 Node Kind: file
 Schedule: normal
 Last Changed Author: liuchao
 Last Changed Rev: 992
 Last Changed Date: 2014-07-16 21:21:45 +0800 (周三, 16 七月 2014)
 Text Last Updated: 2014-07-25 21:30:35 +0800 (周五, 25 七月 2014)
 Checksum: 3a2c9e14c0610ddb9148044506f5f5fca1a5a72c
 * 3.    本服的当前服务器状态（根据人数判断流畅，繁忙，拥挤，若服务器维护，则显示维护）
 设置A=当前游戏在线人数/服务器同时在线承载人数上限
 策划填写流畅，繁忙，拥挤对应的A值上限。
 根据当前A值当前所处区间，显示对应的服务器状态。
 服务器状态    A值对应区间
 流畅    0＜A≤40%
 繁忙    40%＜A≤60%
 拥挤    60%＜A≤100%

 // 0流畅 1繁忙 2拥挤 3维护
 * @param curUsers
 * @param maxUsers
 */
var calcServerState = function (curUsers, maxUsers) {
    var rate = curUsers / maxUsers;

    if (rate <= 0.4) {
        return 0;
    }
    else if (rate <= 0.6) {
        return 1;
    }
    else {
        return 2;
    }
};

var generateServerCache = function (servers, loadServers) {
    var self = this;
    var cache = [];

    _.map(loadServers, function (item) {
        var reg = servers[item.serverUid];
        if (!!reg) {
            reg = _.clone(reg);
            reg.displayName = reg.displayName || item.displayName;
            reg.maxUsers = reg.maxUsers || item.maxUsers;
            reg.isNew = reg.isNew || item.isNew;
            reg.isRecommend = reg.isRecommend || item.isRecommend;

            reg.state = calcServerState(reg.curUsers, reg.maxUsers);

            delete reg['curUsers'];
            delete reg['maxUsers'];

            cache.push(reg);
        }
        else {
            item = _.clone(item);
            item.state = 3;
            item.maxUsers = 0;
            item.isNew = false;
            item.isRecommend = false;
            cache.push(item);
        }
    });

    if (!defaultValues.loginUseGameServerListRestrict) {
        _.map(servers, function (item) {
            if (!_.find(loadServers, function (loadInfo) {
                return loadInfo.serverUid == item.serverUid;
            })) {
                var reg = _.clone(item);
                reg.state = calcServerState(reg.curUsers, reg.maxUsers);
                reg.displayName = reg.displayName || 'Unnamed ' + reg.serverUid;

                delete reg['curUsers'];
                delete reg['maxUsers'];

                cache.push(reg);
            }
        });
    }

    logger.warn("generateServerCache cache: %j, servers: %j, loadServers: %j", cache, servers, loadServers);

    return cache;
};

Handler.Register = function (info) {
    logger.fatal('Register new server info: %j', info);

//    var ip = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
//    if (!ip.test(info.host)) {
//        return errorCodes.ParameterWrong;
//    }

    if (info.port < 1024 || info.port > 65535) {
        return errorCodes.ParameterWrong;
    }

//    if (info.displayName.length === 0) {
//        return errorCodes.ParameterWrong;
//    }

    if (!info.serverUid) {
        return errorCodes.ParameterWrong;
    }

    if (!info.maxUsers) {
        return errorCodes.ParameterWrong;
    }

    if (!this.servers) {
        return errorCodes.SystemInitializing;
    }

    if (info.serverUid in this.servers) {
        logger.warn('Replace server id: %s, old:%j, new:%j', info.serverUid, this.servers[info.serverUid], info);
    }

    this.servers[info.serverUid] = info;

    var mList = config.mergeServerList[info.serverUid];
    if (!!mList) {
        for (var index in mList) {
            var serverUid = +mList[index].serverUid;
            var tempInfo = _.clone(info);
            tempInfo.serverUid = serverUid;
            this.servers[serverUid] = tempInfo;
        }
    }
//    if (!!info.mList) {     //合服后处理
//        for (var index in info.mList) {
//            var tempInfo = _.clone(info);
//            tempInfo.serverUid = info.mList[index];
//            this.servers[info.mList[index]] = tempInfo;
//        }
//    }

    this.serverCache = generateServerCache(this.servers, config.gameServerList.list);

    /** 通知服务器状态到其他列表*/
    this.broadcastStatsToOther();

    return errorCodes.OK;
};

Handler.UnRegister = function (uid) {
    logger.warn('UnRegister server uid: %j, list: %j', uid, this.servers);

    if (!(uid in this.servers)) {
        logger.error('UnRegister server, no uid: %d server in current server list: %j.', uid, this.servers);
        return errorCodes.ParameterWrong;
    }

    delete this.servers[uid];

    var mList = config.mergeServerList[uid];
    if (!!mList) {
        for (var index in mList) {
            var serverUid = +mList[index].serverUid;
            delete this.servers[serverUid];
        }
    }

    this.serverCache = generateServerCache(this.servers, config.gameServerList.list);

    /** 通知服务器状态到其他列表*/
    this.broadcastStatsToOther();

    return errorCodes.OK;
};

Handler.NotifyLogin = function (accountID, serverUid, checkID) {
    var route = 'onNotifyLogin';

    var server = this.servers[serverUid];

    if (!server) {
        return;
    }

    this.SendMessage(route, {uid: server.uid, sid: server.sid}, {accountID: accountID, checkID: checkID});
};

Handler.SendMessage = function (route, addr, msg) {
    pomelo.app.get('channelService').pushMessageByUids(route, msg, [addr], function (err, fails) {
        if (!!err) {
            logger.error('Push Message error! %j', err.stack);
        }
    });
};

/**
 * 同步信息到其他ls服务器
 * */
Handler.broadcastStatsToOther = function () {
    messageService.broadcastRpc('ls', {serverCache: this.serverCache, servers: this.servers},
                                {service: 'lsRemote', method: 'broadcastStats', ignoreID: pomelo.app.getServerId()});
};


/**
 * 同步信息到其他ls服务器
 * -------------------
 *
 * @param {Object} servers 当前服务器列表
 * @param {Object} serverCache 当前服务器列表
 * */
Handler.broadcastStatsFromOther = function (servers, serverCache) {
    this.servers = servers;
    this.serverCache = serverCache;
};
