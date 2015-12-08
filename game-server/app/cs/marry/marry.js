/**
 * Created with JetBrains WebStorm.
 * User: chenTest
 * Date: 15-7-1
 * Time: 上午10:15
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var defaultValues = require('../../tools/defaultValues');
var redisManager = require('../../cs/chartRedis/redisManager');
var playerManager = require('../../cs/player/playerManager');
var config = require('../../tools/config');
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');
var eMarryInfo = gameConst.eMarryInfo;
var eXuanYan = gameConst.eXuanYan;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.itemData = 111;

};

var handler = Handler.prototype;

/** 获取离线玩家数据*/
handler.GetPlayerInfo = function (roleID, callback) {
    var self = this;
    var client = redisManager.getClient(gameConst.eRedisClientType.Chart);
    client.hGet(redisManager.getRoleInfoOpenIDByServerUid(config.list.serverUid), roleID, function (err, info) {
        var roleInfo = JSON.parse(info) || {};
        client.hGet(redisManager.getRoleDetailSetNameByServerUid(config.list.serverUid), roleID,  function (err, data) {
            if (!!err || null == data || null == roleInfo) {
//                        logger.error("get across player detail: %d, %s, %j", roleID,
//                                     utils.getErrorMessage(err), data);
                pomelo.app.rpc.ps.psRemote.GetPlayerDetails(null, roleID, function (rpcErr, details, csID) {
                    if (!!rpcErr) {
                        logger.error("get across player detail: %d, %s, %j", roleID,
                            utils.getErrorMessage(rpcErr), details);
                        return callback(rpcErr);
                    }
                    var openID = roleInfo.openID ? roleInfo.openID : "default-openid";
                    var picture = !!roleInfo.wxPicture ? roleInfo.wxPicture : '';
                    details['openID'] = openID;
                    details['picture'] = picture;
                    if(!!details['marryXuanYan']){
                        details['xuanYan'] = details['marryXuanYan'];
                    }else{
                        details['xuanYan'] = '';
                    }

                    return  callback(null, details, csID);
                });
            } else {
                data = JSON.parse(data);
                var playerInfo = data[1];
//                    var roleID = playerInfo[gameConst.ePlayerInfo.ROLEID];
                var tempID = playerInfo[gameConst.ePlayerInfo.TEMPID];
                var roleName = roleInfo.name ? roleInfo.name : playerInfo[gameConst.ePlayerInfo.NAME];
                var expLevel = roleInfo.expLevel ? roleInfo.expLevel :
                    playerInfo[gameConst.ePlayerInfo.ExpLevel];
                var zhanLi = roleInfo.zhanli ? roleInfo.zhanli : playerInfo[gameConst.ePlayerInfo.ZHANLI];
                var vipLevel = roleInfo.vipLevel ? roleInfo.vipLevel :
                    playerInfo[gameConst.ePlayerInfo.VipLevel];
                var loginTime = playerInfo[gameConst.ePlayerInfo.LoginTime];
                var openID = roleInfo.openID ? roleInfo.openID : "default-openid";
                var picture = !!roleInfo.wxPicture ? roleInfo.wxPicture : '';
                var xuanYan = '';
                if(!!data[11]){
                    xuanYan = data[11];
                }


                var details = {
                    roleID: roleID,
                    name: roleName,
                    tempID: tempID,
                    expLevel: expLevel,
                    zhanli: zhanLi,
                    VipLevel: vipLevel,
                    LoginTime: loginTime,
                    openID: openID,
                    picture: picture,
                    xuanYan: xuanYan
                };
                var player = playerManager.GetPlayer(roleID);

                return  callback(null, details);
            }
        });
    });
};

/** 校验职业是否符合结婚  1战士 男 2刺客 女 3法师 女 4枪手 男 5召唤 女  */
handler.jobMarryCheck = function(roleTemp, toMarryTemp){

    if(1==roleTemp || 4==roleTemp){ //男性
        if(1==toMarryTemp || 4==toMarryTemp){
            return false;
        }else{
            return true;
        }
    }else{ //女性
        if(1==toMarryTemp || 4==toMarryTemp){
            return true;
        }else{
            return false;
        }
    }
}

/** 给被求婚者发送消息提示 */
handler.toMarryMassage = function(roleID, lookNum, callback){
        logger.fatal("##### toMarryMassager  roleID: %j   ", roleID);
        var self = this;
        var route = 'SendtoMarryMassager';
        //var route = 'SendUnionGiftMsg';
        //var route = 'SendTempleMsg';
        var player = playerManager.GetPlayer(roleID);
        if (!player) {
            logger.fatal("##### toMarryMassage player  is null, roleID: %j     ", roleID);
            return callback(null, errorCodes.NoRole);
        }

        var Msg = {
            result: errorCodes.OK,
            lookNum: lookNum
        };
        player.SendMessage(route, Msg);
        return callback(null, errorCodes.OK);

}

//求婚时  被求婚人 提示消息数量
handler.SendToMarryMsg = function(roleID, lookNum, notRead){
    var self = this;
    var route = 'SendToMarryMsg';
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.fatal("****SendToMarryMsg player  is null, roleID: %j     ", roleID);
        return callback(null, errorCodes.NoRole);
    }
    if(!notRead){
        notRead = 0;
    }else{
        lookNum = 0;
    }
    var Msg = {
        result: errorCodes.OK,
        msgNum: lookNum, //提示消息数量
        notRead: notRead
    };
    player.SendMessage(route, Msg);
}