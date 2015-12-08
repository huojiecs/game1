/**
 * Created by Administrator on 13-12-23.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var csCommands = require('../../../adminCommands/csCommands');
var errorCodes = require('../../../tools/errorCodes');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var idipUtils = require('../../../tools/idipUtils');
var _ = require('underscore');

var ePlayerInfo = gameConst.ePlayerInfo;
var tAtt = templateConst.tAtt;
var tCustomList = templateConst.tCustomList;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.GMorder = function (csID, tarRoleID, cmd, params, callback) {
    var command = csCommands[cmd];
    if (_.isFunction(command)) {
        var result = command.apply(command, params ? [tarRoleID].concat(params) : [tarRoleID]);
        return callback(null, {
            'result': result
        });
    }

    return callback(null, {
        'result': errorCodes.ParameterWrong
    });
};

handler.idipCommands = function (csID, data_packet, callback) {

    if (!!data_packet.profiler) {
        data_packet.profiler.push({
                                      server: pomelo.app.getServerId(),
                                      command: 'idipCommands',
                                      start: Date.now()
                                  });
    }

    logger.debug('idipCommands: %j', data_packet);

    idipUtils.dispatchIdipCommands(csCommands, data_packet, callback);
};

handler.idipGetRoleInfo = function (csID, roleId, callback) {

    logger.debug('idipGetRoleInfo: %j', roleId);

    var roleInfo = {
//        "RoleId": item['_roleId'],
//        "Level": item['_expLevel'], /* ��ɫ�ȼ� */
//        "RoleName": item['_roleName'], /* ��ɫ�� */
//        "Title": item['_Title'], /* ��ɫ�ƺ� */
//        "DevilNum": item['_DevilNum'], /* а�������� */
//        "DevilLevel": item['_DevilLevel'], /* ��а��ȼ� */
//        "DevilSkillLevel": item['_DevilSkillLevel']     /* а������ܵȼ� */
    };

    var player = playerManager.GetPlayer(roleId);

    if (!player) {
        return callback(null, null);
    }

    roleInfo._roleId = roleId;
    roleInfo._expLevel = player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    roleInfo._roleName = player.GetPlayerInfo(gameConst.ePlayerInfo.NAME);
    roleInfo._Title = 'NoTitle';

    var soulManager = player.GetSoulManager();
    var soul = soulManager.GetMaxSoul();

    roleInfo._DevilNum = soul ? soul.GetSoulInfo(gameConst.eSoulInfo.LEVEL) : 0;
    roleInfo._DevilLevel = 0;
    roleInfo._DevilSkillLevel = 0;

    return callback(null, roleInfo);
};

handler.gmCommands = function (csID, gmStr, paramObj, callback) {
    var playerList = playerManager.GetAllPlayer();
    if (_.isEmpty(playerList)) {
        return callback();
    }
    if (gmStr == 'addallmoney') {
        for (var index in playerList) {
            var player = playerList[index];
            var assetsManager = player.GetAssetsManager();
            if (null == assetsManager) {
                continue;
            }
            var tempID = paramObj.tempID;
            var addNum = paramObj.addNum;
            assetsManager.SetAssetsValue(tempID, addNum);
        }
    }
    if (gmStr == 'setvippoint') {
        var player = playerManager.GetPlayer(paramObj.roleID);
        var oldVipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
        var addPointNum = paramObj.addPointNum;
        player.AddVipPoint(addPointNum);

        var newVipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);

        return callback(null, oldVipLv, newVipLv);
    }
    if (gmStr == 'setviplevel') {
        var player = playerManager.GetPlayer(paramObj.roleID);
        var setVipLv = paramObj.setVipLv;
        var nowVipPoint = player.GetPlayerInfo(ePlayerInfo.VipPoint);
        var nowVipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
        if (nowVipLv >= setVipLv) {
            return callback(errorCodes.ParameterWrong);
        }
        var setVipTemplate = templateManager.GetTemplateByID('VipTemplate', setVipLv + 1);
        var needVipPoint = setVipTemplate[templateConst.tVipTemp.needVipPoint];
        var addPointNum = needVipPoint - nowVipPoint;
        player.AddVipPoint(addPointNum);

        return callback(null, nowVipLv, setVipLv);
    }
    if (gmStr == 'setallviplevel') {
        for (var index in playerList) {
            var player = playerList[index];
            var setVipLv = paramObj.setVipLv;
            var nowVipPoint = player.GetPlayerInfo(ePlayerInfo.VipPoint);
            var nowVipLv = player.GetPlayerInfo(ePlayerInfo.VipLevel);
            if (nowVipLv >= setVipLv) {
                continue;
            }
            var setVipTemplate = templateManager.GetTemplateByID('VipTemplate', setVipLv + 1);
            var needVipPoint = setVipTemplate[templateConst.tVipTemp.needVipPoint];
            var addPointNum = needVipPoint - nowVipPoint;
            player.AddVipPoint(addPointNum);
        }
    }
    if (gmStr == 'setallplayerlevel') {
        for (var index in playerList) {
            var player = playerList[index];
            var nowLv = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
            var setLv = paramObj.setLv;
            if (nowLv >= setLv) {
                continue;
            }
            var nowExp = player.GetPlayerInfo(ePlayerInfo.EXP);
            var nowExpTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', nowLv);
            var setExpTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', setLv);
            var setTotalExp = setExpTemplate[tAtt.totalExp];
            var nowTotalExp = nowExpTemplate[tAtt.totalExp];
            var addExpNum = setTotalExp - nowExp - nowTotalExp;
            player.AddExp(addExpNum);
        }
    }
    if (gmStr == 'allplayerallcusopen') {
        for (var index in playerList) {
            var player = playerList[index];
            var customTemplateList = templateManager.GetAllTemplate('CustomListTemplate');
            var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
            for (var index in  customTemplateList) {
                var temp = customTemplateList[index];
                var customNum = temp[tCustomList.customNum];
                for (var i = 0; i < customNum; ++i) {
                    player.GetCustomManager().OpenOneCustom(temp['custom_' + i], roleID, gameConst.eLevelTarget.Normal);
                    player.GetCustomManager().OpenOneCustom(temp['hellCustom_' + i], roleID,
                                                            gameConst.eLevelTarget.Normal);
                }
            }
            player.GetCustomManager().SendCustomMsg( gameConst.eLevelTarget.Normal, null);
        }
    }
    if (gmStr == 'allitemdrop') {
        for (var index in playerList) {
            var player = playerList[index];
            var assetsManager = player.GetAssetsManager();
            if (null == assetsManager) {
                continue;
            }
            var tempID = paramObj.tempID;
            var addNum = paramObj.addNum;

            if (!player) {
                return errorCodes.NoRole;
            }
            var itemManager = player.GetItemManager();
            for (var i = 0; i < addNum; ++i) {
                var newItem = itemManager.CreateItem( tempID);
                itemManager.SendItemMsg( [newItem], gameConst.eCreateType.Old, gameConst.eItemOperType.GetItem);
            }
        }
    }
    return callback();
};