/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-26
 * Time: 下午1:48
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var defaultValues = require('../../tools/defaultValues');
var psSql = require('../../tools/mysql/psSql');
var utilSql = require('../../tools/mysql/utilSql');
var messageService = require('./../../tools/messageService');
var tAtt = templateConst.tAtt;
var ePlayerInfo = gameConst.ePlayerInfo;
var eLoginState = gameConst.eLoginState;
var eAttFactor = gameConst.eAttFactor;
var Q = require('q');
var _ = require('underscore');

var Handler = module.exports;

Handler.Init = function () {
    var self = this;
    this.accountList = {};
    this.playerList = {};

    this.startTime = 0;
    psSql.GetServiceTime(function (err, result) {
        self.startTime = new Date(result);
    });

    setInterval(this.PrintStateInfo.bind(this), defaultValues.PrintStateInfoDelaySeconds * 1000);
    setInterval(this.NotifyAllUsersStatus.bind(this), defaultValues.PsNotifyAllUsersStatusDelaySeconds * 1000);
};

Handler.PrintStateInfo = function () {
    logger.fatal('PlayerManger AccountCount: %d PlayerCount: %d', _.size(this.accountList), _.size(this.playerList));
};

Handler.NotifyAllUsersStatus = function () {
    var self = this;

    var playerList = _.map(self.accountList, function (player, accountID) {
        if (!player) {
            return{};
        }

        return {
            roleID: player.loginRole,
            accountID: accountID,
            csServerID: player.playerList[player.loginRole] ? player.playerList[player.loginRole].csServerID : '',
            frontendID: player.frontendId,
            checkID: player.checkID
        }
    });

    messageService.broadcastRpc('psIdip', {playerList: playerList},
                                {service: 'psIdipRemote', method: 'notifyAllUsersStatus'});

    logger.fatal('PlayerManger NotifyAllUsersStatus: %d', _.size(playerList));
//    logger.fatal('PlayerManger NotifyAllUsersStatus: %d playerList: %j', _.size(playerList), playerList);
};

Handler.AddAccount = function (accountID, accountType, isBind, openID, key, checkID, frontendId, initTime) {
    this.accountList[accountID] = {
        playerList: {},                                //玩家列表
        loginRole: 0,                                  //现在那个角色在使用
        accountType: accountType,                               //账号登陆状态
        isBind: isBind,                                     //是否绑定邮箱了
        accountState: eLoginState.CHECK,              //账号状态
        openID: openID,                                 //QQ登陆openid
        key: key,                                       //token
        checkID: checkID,
        frontendId: frontendId,
        initTime: initTime
    }
};

Handler.DeleteAccountID = function (accountID) {

    if (!this.accountList) {
        return;
    }

    var tempLogin = this.accountList[accountID];
    if (tempLogin && tempLogin.loginRole != 0) {

        var roleID = tempLogin.loginRole;
        logger.fatal('PlayerManger DeleteAccountID: %d', roleID);
        messageService.broadcastRpc('psIdip', {roleID: roleID, csServerID: '', accountID: accountID},
                                    {service: 'psIdipRemote', method: 'notifyUserStatus'});

        delete this.playerList[tempLogin.loginRole];
    }
    delete this.accountList[accountID];


};

Handler.AddRole = function (accountID, roleID, playerInfo) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        tempLogin.playerList[roleID] = {
            csServerID: '',
            playerInfo: playerInfo
        };
    }
};

Handler.AddAllRole = function (accountID, playerList) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        for (var index in playerList) {
            var roleID = playerList[index][ePlayerInfo.ROLEID];
            tempLogin.playerList[roleID] = {
                csServerID: '',
                playerInfo: playerList[index]
            };
        }
    }
};

/**
 * @return {string}
 */
Handler.GetRoleName = function (accountID, roleID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin && null != tempLogin.playerList[roleID]) {
        return tempLogin.playerList[roleID].playerInfo[ePlayerInfo.NAME];
    }
    return '';
};

Handler.DeleteRole = function (accountID, roleID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        delete tempLogin.playerList[roleID];
    }
};

/**
 * @return {number}
 */
Handler.GetOnlineNum = function () {   //获取当前在线人数
    var onlineNum = 0;
    for (var index in this.accountList) {
        ++onlineNum;
    }
    return onlineNum;
};

/**
 * @return {number}
 */
Handler.GetPlayerNum = function (accountID) {
    var tempLogin = this.accountList[accountID];
    var playerNum = 0;
    if (null != tempLogin) {
        for (var index in tempLogin.playerList) {
            ++playerNum;
        }
    }
    return playerNum;
};

/**
 * @return {number}
 */
Handler.GetAccountInitTime = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.initTime;
    }
    return '';
};

/**
 * @return {number}
 */
Handler.GetAccountType = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.accountType;
    }
    return 0;
};

/**
 * @return {string}
 */
Handler.GetAccountOpenID = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.openID;
    }
    return '';
};

/**
 * @return {string}
 */
Handler.GetAccountKey = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.key;
    }
    return '';
};

/**
 * @return {string}
 */
Handler.GetAccountCheckID = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.checkID;
    }
    return '';
};

/**
 * @return {string}
 */
Handler.GetAccountFrontendID = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.frontendId;
    }
    return '';
};

Handler.SetAccountType = function (accountID, value) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        tempLogin.accountType = value;
    }
};

/**
 * @return {number}
 */
Handler.GetIsBind = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.isBind;
    }
    return 0;
};

Handler.SetIsBind = function (accountID, value) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        tempLogin.isBind = value;
    }
};

/**
 * @return {boolean}
 */
Handler.AccountIsHave = function (accountID) {

    if (!this.accountList) {
        return true;
    }

    return null != this.accountList[accountID];
};

/**
 * @return {boolean}
 */
Handler.RoleIsHave = function (accountID, roleID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        if (null != tempLogin.playerList[roleID]) {
            return true;
        }
    }
    return false;
};

/**
 * @return {number}
 */
Handler.GetLoginRole = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.loginRole;
    }
    return 0;
};

Handler.SetLoginRole = function (accountID, roleID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        tempLogin.loginRole = roleID;
        this.playerList[roleID] = this.accountList[accountID];
    }
};

Handler.SetLoginState = function (accountID, loginState) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        tempLogin.accountState = loginState;
    }
};

/**
 * @return {number}
 */
Handler.GetLoginState = function (accountID) {
    var tempLogin = this.accountList[accountID];
    if (null != tempLogin) {
        return tempLogin.accountState;
    }
    return 0;
};

/**
 * @return {null}
 */
Handler.GetPlayerInfo = function (accountID, roleID) {
    var tempLogin = this.accountList[accountID];
    if (!!tempLogin) {
        if (!!tempLogin.playerList[roleID]) {
            return tempLogin.playerList[roleID].playerInfo;
        }
    }
    return null;
};

/**
 * @return {null}
 */
Handler.GetPlayerCs = function (roleID) {
    var tempLogin = this.playerList[roleID];
    if (null != tempLogin) {
        if (null != tempLogin.playerList[roleID]) {
            return tempLogin.playerList[roleID].csServerID;
        }
    }
    return null;
};

Handler.SetPlayerCs = function (roleID, csServerID) {
    var tempLogin = this.playerList[roleID];
    if (null == tempLogin) {
        return;
    }

    if (null != tempLogin.playerList[roleID]) {
        tempLogin.playerList[roleID].csServerID = csServerID;
    }
};

Handler.DeletePlayer = function (roleID) {
    var tempLogin = this.playerList[roleID];
    if (null == tempLogin) {
        return;
    }
    if (null != tempLogin.playerList[roleID]) {
        delete tempLogin.playerList[roleID];
        delete this.playerList[roleID];
    }

    logger.fatal('PlayerManger DeletePlayer: %d', roleID);

    messageService.broadcastRpc('psIdip', {roleID: roleID, csServerID: ''},
                                {service: 'psIdipRemote', method: 'notifyUserStatus'});
};

Handler.UpdatePlayer = function (nowTime) {
    var time = nowTime.getTime();
    for (var index in this.accountList) {
        var temp = this.accountList[index];
        if (temp.accountState == eLoginState.LEAVE && time > temp.leaveTime) {
            this.DeleteAccountID(index);
        }
    }
};

/**
 * @return {number}
 */
Handler.GetInitZhan = function (expLevel) {      // 获取创建角色时的角色战力
    if (expLevel < 0 || null == expLevel) {
        return 0;
    }
    var PlayerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
    if (null == PlayerAttTemplate) {
        return 0;
    }

    // 各属性需要乘的因数
    var factor = [
        eAttFactor.GONGJI,
        eAttFactor.FANGYU,
        eAttFactor.HP,
        eAttFactor.MP,
        eAttFactor.MAXHP,
        eAttFactor.MAXMP,
        eAttFactor.BAOJILV,
        eAttFactor.BAOJISHANGHAI,
        eAttFactor.SHANGHAITISHENG,
        eAttFactor.HUNMI,
        eAttFactor.HOUYANG,
        eAttFactor.HPHUIFU,
        eAttFactor.MPHUIFU,
        eAttFactor.BAOJIDIKANG,
        eAttFactor.BJSHHJM,
        eAttFactor.SHANGHAIJIANMIAN
    ];
    var zhanLi = 0;
    for (var i = 0; i < factor.length; ++i) {
        var value = PlayerAttTemplate['att_' + i];
        zhanLi += value * factor[i];
    }
    zhanLi = Math.floor(zhanLi);
    return zhanLi;
};

/**
 * @return {number}
 */
Handler.GetPlayerCount = function () {
    var playerCount = 0;
    if (null != this.playerList) {
        playerCount = _.size(this.playerList)
    }
    return playerCount;
};

Handler.GetStartTime = function () {    //获取开服时间
    return this.startTime;
};