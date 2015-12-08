/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-13
 * Time: 下午3:10
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var util = require('util');
var CsObject = require('./csObject');
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var AttManager = require('./../attribute/attManager');
var messageService = require('../../tools/messageService');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var utilSql = require('../../tools/mysql/utilSql');
var utils = require('../../tools/utils');
var _ = require('underscore');
var errorCodes = require('../../tools/errorCodes');
var defaultValues = require('../../tools/defaultValues');

var tRoleInit = templateConst.tRoleInit;

var Handler = function (opts) {
    CsObject.call(this, opts);
    this.attManager = new AttManager(this);
    this.GetAttManager = function () {
        return this.attManager;
    }
};

util.inherits(Handler, CsObject);

module.exports = Handler;

var handler = Handler.prototype;

handler.GetDetails = function (other, callback) {
    var self = this;

    var details = {};
    details.roleID = self.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    details.name = self.GetPlayerInfo(gameConst.ePlayerInfo.NAME);
    details.tempID = self.GetPlayerInfo(gameConst.ePlayerInfo.TEMPID);
    details.expLevel = self.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    details.zhanli = self.GetPlayerInfo(gameConst.ePlayerInfo.ZHANLI);
//    details.lingli = self.GetAssetsManager().GetAssetsValue(globalFunction.GetLingliTemp());
//    details.honor = self.GetAssetsManager().GetAssetsValue(globalFunction.HonorID);
    details.zuanshi = self.GetAssetsManager().GetAssetsValue(globalFunction.GetYuanBaoTemp());
    details.activeEnhanceSuitID = self.GetPlayerInfo(gameConst.ePlayerInfo.ActiveEnhanceSuitID);
    details.activeInsetSuitID = self.GetPlayerInfo(gameConst.ePlayerInfo.ActiveInsetSuitID);
    details.activeFashionWeaponID = self.GetPlayerInfo(gameConst.ePlayerInfo.ActiveFashionWeaponID);
    details.activeFashionEquipID = self.GetPlayerInfo(gameConst.ePlayerInfo.ActiveFashionEquipID);
    details.titleID = self.GetPlayerInfo(gameConst.ePlayerInfo.titleID);
    details.APvPAttackedNum = self.asyncPvPManager.attackedNum;
    details.equips = [];
    var equips = self.equipManager.GetAllEquip();
    for (var i in equips) {
        var item = self.itemManager.GetItem(equips[i]);
        if (item) {
            details.equips.push(item.GetItemInfo(gameConst.eItemInfo.TEMPID));
        }
    }

    var magicSoulID = self.magicSoulManager.GetMagicSoulInfo(gameConst.eMagicSoulInfo.TEMPID);
    details.magicSoul = [];         // 魔灵ID
    details.magicSoul.push({"magicSoulID": magicSoulID});
    details.maxSoulTemplateID = self.soulManager.GetMaxSoulTemplate().GetSoulInfo(gameConst.eSoulInfo.TEMPID);
    details.maxSoulLevel = self.soulManager.GetMaxSoulTemplate().GetSoulInfo(gameConst.eSoulInfo.LEVEL);
    details.petList = defaultValues.IsPetOpening ? self.petManager.GetCarryPetInfo() : [];
    pomelo.app.rpc.pvp.pvpRemote.GetPlayerPvpInfo(null, details.roleID, function (err, obj) {
        if (!!err) {
            logger.error('error when GetDetails for pvp to get lingli and honor, %d, %s', details.roleID,
                         utils.getErrorMessage(err));
            return callback(err);
        }
        if (_.isEmpty(obj)) {
            logger.warn('GetPlayerPvpInfo obj is empty, %d', details.roleID);
            return callback(errorCodes.NoRole);
        }
        details.lingli = obj[gameConst.eAsyncPvPInfo_EX.lingli];
        details.honor = obj[gameConst.eAsyncPvPInfo_EX.honor];
        pomelo.app.rpc.chart.chartRemote.GetPlayerHonorRank(null, details.roleID, function (err, rank) {
            if (err) {
                return callback(err);
            }
            details.rank = rank;
            return callback(null, details);
        });
    });
    //return details;
};
handler.GetPlayerDetails = function (other, callback) {
    var self = this;

    var details = {};
    details.roleID = self.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    details.name = self.GetPlayerInfo(gameConst.ePlayerInfo.NAME);
    details.tempID = self.GetPlayerInfo(gameConst.ePlayerInfo.TEMPID);
    details.expLevel = self.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    details.zhanli = self.GetPlayerInfo(gameConst.ePlayerInfo.ZHANLI);
    details.VipLevel = self.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    details.LoginTime = self.GetPlayerInfo(gameConst.ePlayerInfo.LoginTime);
    details.activeEnhanceSuitID = self.GetPlayerInfo(gameConst.ePlayerInfo.ActiveEnhanceSuitID);
    details.activeInsetSuitID = self.GetPlayerInfo(gameConst.ePlayerInfo.ActiveInsetSuitID);
    details.APvPAttackedNum = self.asyncPvPManager.attackedNum;
    details.equips = [];
    var equips = self.equipManager.GetAllEquip();
    for (var i in equips) {
        var item = self.itemManager.GetItem(equips[i]);
        if (item) {
            details.equips.push(item.GetItemInfo(gameConst.eItemInfo.TEMPID));
        }
    }

    var magicSoulID = self.magicSoulManager.GetMagicSoulInfo(gameConst.eMagicSoulInfo.TEMPID);
    details.magicSoul = [];         // 魔灵ID
    details.magicSoul.push({"magicSoulID": magicSoulID});
    details.maxSoulTemplateID = self.soulManager.GetMaxSoulTemplate().GetSoulInfo(gameConst.eSoulInfo.TEMPID);
    details.maxSoulLevel = self.soulManager.GetMaxSoulTemplate().GetSoulInfo(gameConst.eSoulInfo.LEVEL);
    details.petList = defaultValues.IsPetOpening ? self.petManager.GetCarryPetInfo() : [];
    details.marryXuanYan = self.toMarryManager.GetXuanYan();
    details.picture = self.GetPlayerInfo(gameConst.ePlayerInfo.Picture);
    details.openID = self.GetPlayerInfo(gameConst.ePlayerInfo.openID);
    return callback(null, details);
};
/*handler.GetSqlStr = function () {
 this.playerInfo[gameConst.ePlayerInfo.LoginTime] = utilSql.DateToString(new Date());
 return this.playerInfo;
 };*/

handler.SendMessage = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.userId, sid: this.serverId}, route, msg);
};

/**
 *
 * @returns {openID|*|data.openID|openID.openID|opts.openID|exports.tSoul.openID}
 * @constructor
 */
handler.GetOpenID = function () {
    return this.openID || 'default-openid';
};

handler.GetToken = function () {
    return this.token || 'default-token';
};

handler.GetAccountType = function() {
    return this.accountType;
};

/**
 * @return {number}
 */
handler.GetMagicSoulInitID = function () {
    var tempID = this.playerInfo[gameConst.ePlayerInfo.TEMPID];
    var InitTemplate = templateManager.GetTemplateByID('InitTemplate', tempID);
    if (null == InitTemplate) {
        return 0;
    }
    return InitTemplate[tRoleInit.magicSoulID];
};
