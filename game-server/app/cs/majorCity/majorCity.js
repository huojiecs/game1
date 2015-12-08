/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-11-13
 * Time: 上午10:07
 * To change this template use File | Settings | File Templates.
 */

var aoiManager = require('pomelo-aoi');
var aoiEventManager = require('../aoi/aoiEventManager');
var messageService = require('../../tools/messageService');
var playerManager = require('../player/playerManager');
var gameConst = require('../../tools/constValue');
var eEntityType = gameConst.eEntityType;
var defaultValues = require('../../tools/defaultValues');
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var csUtil = require('../csUtil');

var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function (frontendId) {
    return new Handler(frontendId);
};

var Handler = function (frontendId) {
    this.playerList = {};
    var config = {
        width: 100000,
        height: 100000,
        towerWidth: 100000,
        towerHeight: 100000
    };

    /** 是否定向分配的房间 */
    this.isOrient = csUtil.isOrient(frontendId, pomelo.app.getServerId());
    logger.info("check is isOrient room: %s --> %s jj: %s", frontendId, pomelo.app.getServerId(), this.isOrient);
    /** 服务器前端id 为了提高 push message 效率*/
    this.frontendId = frontendId;
    this.aoi = aoiManager.getService(config);
    aoiEventManager.addEvent(this, this.aoi.aoi);
};

var handler = Handler.prototype;
handler.AddPlayer = function (player, pos) {
    this.playerList[player.id] = player;
};

handler.DelPlayer = function (player, pos) {
    delete this.playerList[player.id];
};

/**
 * @return {number}
 */
handler.GetPlayerNum = function () {
    var num = 0;
    for (var index in this.playerList) {
        ++num;
    }
    return num;
};

/**
 * @param {String} frontendId 前端id, 同一主城玩家都在 同一个 connector
 * @return {boolean}
 */
handler.IsFull = function (frontendId) {
    if (defaultValues.USE_CONNECTOR_TO_CS) {
        /**  目标是定向分配的*/
        if (this.isOrient) {
            return this.frontendId != frontendId || this.GetPlayerNum() >= defaultValues.hallPlayerNum;
        } else {
            /** 自己是否是定向分配的*/
            if (csUtil.isOrient(frontendId, pomelo.app.getServerId())) {
                return this.frontendId != frontendId || this.GetPlayerNum() >= defaultValues.hallPlayerNum;
            } else {
                return this.GetPlayerNum() >= defaultValues.hallPlayerNum;
            }
        }
    }
    return this.frontendId != frontendId || this.GetPlayerNum() >= defaultValues.hallPlayerNum;
};

handler.AddAoi = function (player, pos) {
    this.aoi.addWatcher(player, pos, 2);
    this.aoi.addObject(player, pos);
};

handler.RemoveAoi = function (player, pos) {
    this.aoi.removeObject(player, pos);
    this.aoi.removeWatcher(player, pos, 2);
};

/**
 * 获取 主城信息
 *
 * @param {Object}
 * */
handler.toInfo = function () {
    return {
        csID: pomelo.app.getServerId(),
        isOrient: this.isOrient,
        frontendId: this.frontendId,
        userInfo: JSON.stringify(this.GetWatcherInfo())
    };
};

handler.UpdateAoi = function (player, oldPos, newPos) {
    this.aoi.updateObject(player, oldPos, newPos);
    this.aoi.updateWatcher(player, oldPos, newPos, 2, 2);
};

/**
 * 获取主城玩家情况
 *
 * @return {Object}
 * */
handler.GetWatcherInfo = function () {
    var watchers = this.aoi.getWatchers({x: 100, y: 100, z: 100}, [eEntityType.PLAYER]);
    var result = [];
    if (!!watchers && !!watchers[eEntityType.PLAYER]) {
        var pWatchers = watchers[eEntityType.PLAYER];
        for (var entityId in pWatchers) {
            var player = playerManager.GetPlayer(entityId);
            if (!!player && !!player.userId) {
                result.push({sid: player.serverId, roleID: player.GetPlayerInfo(ePlayerInfo.ROLEID),
                                name: player.GetPlayerInfo(ePlayerInfo.NAME)});
            }
        }
    }
    return result;
};

handler.GetWatcherUids = function (pos, types, ignores) {
    var watchers = this.aoi.getWatchers(pos, types);
    var result = [];
    if (!!watchers && !!watchers[eEntityType.PLAYER]) {
        var pWatchers = watchers[eEntityType.PLAYER];
        for (var entityId in pWatchers) {
            if (!!ignores && entityId in ignores) {
                continue;
            }
            var player = playerManager.GetPlayer(entityId);
            if (!!player && !!player.userId) {
                if (defaultValues.USE_CONNECTOR_TO_CS) {
                    if (this.isOrient) {
                        result.push(player.userId);
                    } else {
                        result.push({uid: player.userId, sid: player.serverId});
                    }
                } else {
                    result.push(player.userId);
                }
            }
        }
    }
    return result;
};

handler.SendPlayerMove = function (player, pos, moveX, moveY, moveZ, petPosX, petPosY, petPosZ) {
    if (null == player) {
        return;
    }
    var route = 'ServerPosAoi';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        posX: pos.x,
        posY: pos.z,
        posZ: pos.y,
        moveX: moveX,
        moveY: moveY,
        moveZ: moveZ,
        petPosX: petPosX,
        petPosY: petPosY,
        petPosZ: petPosZ
    };
    var ignores = {};
    ignores[player.id] = true;
    this.SendAoiMsg(pos, route, msg, ignores);
};

handler.SendPlayerSkill = function (player, skillID, skillType, animName, posX, posY, posZ, isPet) {
    if (null == player) {
        return;
    }
    var route = 'ServerSkillAoi';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        skillID: skillID,
        skillType: skillType,
        animName: animName,
        posX: posX,
        posY: posY,
        posZ: posZ,
        isPet: isPet
    };
    this.SendAoiMsg(pos, route, msg);
};

handler.SendBoxName = function (player, boxName) {
    if (null == player) {
        return;
    }
    var route = 'ServerUpdateBox';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        boxName: boxName
    };
    this.SendAoiMsg(pos, route, msg);
};

handler.SendFightPet = function (player) {
    if(null == player) {
        return;
    }
    var route = 'ServerFightPetAoi';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        fightPet: player.GetAoiPet()
    };
    this.SendAoiMsg(pos, route, msg);
};

//添加结婚特效aoi 同步给其他玩家
handler.SendMarryAoi = function (player) {
    if(null == player) {
        return;
    }
    var route = 'ServerMarryAoi';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        marryInfo: player.GetAoiMarry()
    };
    this.SendAoiMsg(pos, route, msg);
};

handler.SendAoiMsg = function (pos, route, msg, ignores) {
    var uids = this.GetWatcherUids(pos, [eEntityType.PLAYER], ignores);
    if (uids.length > 0) {
        /** 添加开关 和新的cs  分配方法*/
        if (defaultValues.USE_CONNECTOR_TO_CS) {
            if (this.isOrient) {
                messageService.pushMessageByUidsAndSid(this.frontendId, uids, route, msg);
            } else {
                messageService.pushMessageByUids(uids, route, msg);
            }
        } else {
            messageService.pushMessageByUidsAndSid(this.frontendId, uids, route, msg);
        }
    }
};

/**
 * 添加cb 返回控制 性能测试用
 * */
handler.SendPlayerMoveWithCB = function (player, pos, moveX, moveY, moveZ, petPosX, petPosY, petPosZ, cb) {
    if (null == player) {
        return;
    }
    var route = 'ServerPosAoi';
    var pos = player.GetPosition();
    var msg = {
        roleID: player.id,
        posX: pos.x,
        posY: pos.z,
        posZ: pos.y,
        moveX: moveX,
        moveY: moveY,
        moveZ: moveZ,
        petPosX: petPosX,
        petPosY: petPosY,
        petPosZ: petPosZ
    };
    var ignores = {};
    ignores[player.id] = true;
    this.SendAoiMsgWithCB(pos, route, msg, ignores, cb);
};

/**
 * 添加cb 返回控制 性能测试用
 * */
handler.SendAoiMsgWithCB = function (pos, route, msg, ignores, cb) {
    var uids = this.GetWatcherUids(pos, [eEntityType.PLAYER], ignores);
    if (uids.length > 0) {
        messageService.pushMessageByUidsAndSidWithCb(this.frontendId, uids, route, msg, function (err, fails) {
            if (!!err) {
                logger.error('Push Message error! %j', err.stack);
            }
            cb();
        });
    }
};