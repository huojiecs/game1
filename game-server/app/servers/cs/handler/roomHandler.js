/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-28
 * Time: 上午10:29
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../cs/player/playerManager');
var cityManager = require('../../../cs/majorCity/cityManager');
var gameConst = require('../../../tools/constValue');
var globalFunction = require('../../../tools/globalFunction');
var defaultValues = require('../../../tools/defaultValues');
var utils = require('../../../tools/utils');
var csSql = require('../../../tools/mysql/csSql');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var roomManager = require('../../../cs/room/roomManager');
var itemLogic = require('../../../cs/item/itemLogic');
var utilSql = require('../../../tools/mysql/utilSql');
var teamManager = require('../../../rs/team/teamManager');
var ePlayerInfo = gameConst.ePlayerInfo;
var eMisType = gameConst.eMisType;
var eLifeState = gameConst.eLifeState;
var errorCodes = require('../../../tools/errorCodes');
var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;
var eItemChangeType = gameConst.eItemChangeType;
var eTeamInfo = gameConst.eTeamInfo;
var tCustom = templateConst.tCustom;
var eVipInfo = gameConst.eVipInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eExpChange = gameConst.eExpChangeReason;
var eCustomSmallType = gameConst.eCustomSmallType;
var eFashionSuitInfo = gameConst.eFashionSuitInfo;
var eMarryInfo = gameConst.eMarryInfo;
var tWeddingLevel = templateConst.tWeddingLevel;
var ePlayerTeamInfo = templateConst.ePlayerTeamInfo;
var _ = require('underscore');
module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.EnterScene = function (msg, session, next) {//进入场景

    var roleID = session.get('roleID');

    logger.info('handler.EnterScene: %d, %j', roleID, msg);

    var posX = parseInt(msg.posX);
    var posY = parseInt(msg.posZ);
    var posZ = parseInt(msg.posY);
    var tlogInfo = msg.tlogMsg;

    if (null == roleID || isNaN(posX) || isNaN(posY) || isNaN(posZ)) {
        logger.warn('handler.EnterScene: %d', errorCodes.ParameterNull);
        return next(null, {result: errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        logger.warn('handler.EnterScene: %d', errorCodes.NoRole);
        return next(null, {result: errorCodes.NoRole});
    }

    // Remove all buff when finish custom.
    // this should in prepare start game function. but there is no function called from client.
    // this is the only function that called from rs. so i placed here.
    var buffIDList = player.skillManager.GetBuffIDList();
    player.skillManager.PopSoulBuffList();
    player.skillManager.DelBuff(buffIDList);

    var pos = {x: posX, y: posY, z: posZ};
    player.SetPosition(pos);
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    var exp = player.GetPlayerInfo(gameConst.ePlayerInfo.EXP);
    var expLevel = player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);

    logger.info('Player EnterScene: roleID[%s], posState[%s]，teamID[%s]，customID[%j]，exp[%s]，expLevel[%s]', roleID,
                posState, teamID, customID, exp, expLevel);

    if (posState == ePosState.Hull) {
        //进入主城时主动给客户端发送婚姻状态
        player.toMarryManager.SendMarryState(player.id);

        pomelo.app.rpc.rs.rsRemote.SendNowWedding(null, player.id, function (err, res) {
            if (!!err) {
                logger.error('##### SendNowWedding callback res: %j', res);
            }
            var result = res.result;
            if(1 == result){   //由于姻缘值已经减到0  直接离婚
                var marryInfo = player.toMarryManager.marryInfo[0];
                var divorceID = player.id==marryInfo[eMarryInfo.roleID] ? marryInfo[eMarryInfo.toMarryID]:marryInfo[eMarryInfo.roleID];
                player.toMarryManager.Divorce(divorceID, 3, utils.done);
            }else{
                var notRead = res.notRead;
                if(!!player.toMarryManager.marryInfo[0] && 1 == player.toMarryManager.marryInfo[0][eMarryInfo.state]){
                    player.toMarryManager.lookNum[0] = {
                        0: player.id,
                        1: 0
                    }
                }
                player.toMarryManager.SendMarryMsgNum(player.id, notRead);
            }
        });
        //婚姻部分结束

        var tempCity = cityManager.GetCity(customID);
        //每次进入主城判断时效时装是否过期
        logger.fatal("^^^^^EnterScene Hull ^^^^^^^^^roleId:%j^^^^^^^", roleID);
        if(!!player.roleFashionManager.suits){
            _.map(player.roleFashionManager.suits, function (suit,suitId) {
                var temp = templateManager.GetTemplateByID('FashionTemplate', suitId);
                if(temp == null || temp.fashionLeftTime <= 0){
                    return;
                }
                //说明是限时时装 计算当前时间看是否过期  没有过期则开始倒计时
                var openDate = new Date(suit[eFashionSuitInfo.OPENTIME]);
                var nowDate = new Date();
                var openTime = openDate.getTime();
                var nowTime = nowDate.getTime();
                //限时小时数

                var hours = temp.fashionLeftTime;
                var leftTime = hours * 3600 * 1000;
                //logger.fatal("^^^^^ loadFashionTime roleID: %j , openTime: %j, nowTime :%j , leftTime:%j ,useTime: %j" ,roleID, openTime, nowTime, leftTime, nowTime - openTime);
                //首先判断碎片个数
                var suiPianNum = player.assetsManager.GetAssetsValue(temp.suiPianID);
                if(suiPianNum>0 && temp.isTimeFashion==1 && (openTime+leftTime) < nowTime){

                    if(suiPianNum < temp.suiPianNum*2){
                        suit[eFashionSuitInfo.OPENTIME] = utilSql.DateToString(new Date("1970-01-01 00:00:00"));
                        player.roleFashionManager.UnActivate(suitId);//取消时装激活状态
                        if(suiPianNum>= temp.suiPianNum){
                            //清楚碎片
                            player.assetsManager.AlterAssetsValue(temp.suiPianID, -temp.suiPianNum, eAssetsAdd.fashion);
                        }

                        player.roleFashionManager.SetFashionSuitValue(suitId, 0);
                        //更新戰力
                        player.roleFashionManager.delFashionZhanli(true);
                        //同步客户端
                        player.roleFashionManager.SendFashionTime(suitId);
                    }else{
                        suit[eFashionSuitInfo.OPENTIME] = utilSql.DateToString(new Date());
                        //清楚碎片
                        player.assetsManager.AlterAssetsValue(temp.suiPianID, -temp.suiPianNum, eAssetsAdd.fashion);
                    }
                }
            });
        }

        tempCity.AddAoi(player, pos);
    }
    else {
        var tempRoom = roomManager.GetRoom(customID, teamID);
        tempRoom.AddAoi(player, pos);
        player.GetCustomManager().AddCustom(customID, tempRoom.GetTeamInfo(eTeamInfo.LevelTarget));
        tempRoom.SetPlayerInCustom(roleID, player, tlogInfo);
    }

    sendFreeSweepNum(player); //同步免费扫荡剩余次数
    return next(null, {result: errorCodes.OK});
};

handler.Move = function (msg, session, next) {
    var roleID = session.get('roleID');
    var posX = msg.posX;
    var posY = msg.posZ;
    var posZ = msg.posY;
    var moveX = msg.moveX;
    var moveY = msg.moveY;
    var moveZ = msg.moveZ;
    var petPosX = msg.petPosX;
    var petPosY = msg.petPosY;
    var petPosZ = msg.petPosZ;
    if (null == roleID || null == posX || null == posY || null == posZ || null == moveX | null == moveY || null
        == moveZ || null == petPosX || null == petPosY || null == petPosZ) {
        return next();
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    var oldPos = player.GetPosition();
    var newPos = {x: posX, y: posY, z: posZ};
    player.SetPosition(newPos);
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    var tempCustom = null;
    if (posState == ePosState.Hull) {
        tempCustom = cityManager.GetCity(customID);
    }
    else {
        tempCustom = roomManager.GetRoom(customID, teamID);
    }
    tempCustom.UpdateAoi(player, oldPos, newPos);

    if (defaultValues.MONITOR_IS_PUSH_CB) {
        tempCustom.SendPlayerMoveWithCB(player, newPos, moveX, moveY, moveZ, petPosX, petPosY, petPosZ, function () {
            return next();
        });
    } else {
        tempCustom.SendPlayerMove(player, newPos, moveX, moveY, moveZ, petPosX, petPosY, petPosZ);
        return next();
    }
};

handler.PlayerAtt = function (msg, session, next) {
    var roleID = session.get('roleID');
    var attType = parseInt(msg.attType);
    var attNum = msg.attNum;
    var playerState = msg.playerState;
    var otherID = msg.otherID || roleID;
    var beforeValue = null == msg.beforeValue ? attNum : msg.beforeValue;
    var duringTime = msg.duringTime;

    if (null == roleID || null == attType || null == attNum || null == playerState) {
        return next();
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    if (posState == ePosState.Custom) {
        var tempRoom = roomManager.GetRoom(customID, teamID);
        if (null == tempRoom) {
            return next();
        }
        tempRoom.SendPlayerAtt(player, attType, attNum, playerState, otherID, beforeValue, duringTime);
    }
    return next();
};

handler.NpcDropHp = function (msg, session, next) {
    var roleID = session.get('roleID');
    var npcID = msg.npcID;
    var HpNum = msg.HpNum;
    var npcState = msg.npcState;
    var attType = msg.attType;
    var playerIndex = msg.playerIndex;
    if (null == roleID || null == npcID || null == HpNum || null == npcState || null == attType || null
        == playerIndex) {
        return next();
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    if (posState == ePosState.Custom) {
        var tempRoom = roomManager.GetRoom(customID, teamID);
        if (null == tempRoom) {
            return next();
        }
        if (npcState == eLifeState.Death) {
            player.GetMissionManager().MissionOver(0, npcID, 1);    //非任务完成，此处是npc击杀公告
        }
        tempRoom.SendNpcDropHp(player, npcID, HpNum, npcState, attType, playerIndex);
    }
    return next();
};

handler.Relay = function (msg, session, next) {
    var roleID = session.get('roleID');
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    if (posState == ePosState.Custom) {
        var tempRoom = roomManager.GetRoom(customID, teamID);
        if (null == tempRoom) {
            return next();
        }
        tempRoom.SendRoomRelay(player, msg);
    }
    return next();
};

handler.UseSkill = function (msg, session, next) {
    var roleID = session.get('roleID');
    var skillID = msg.skillID;
    var skillType = msg.skillType;
    var animName = msg.animName;
    var posX = msg.posX;
    var posY = msg.posY;
    var posZ = msg.posZ;
    var isPet = msg.isPet;

    if (null == roleID || null == skillID || null == skillType || null == animName || null == posX || null == posY
            || null == posZ || null == isPet) {
        return next();
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }

    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    var tempCustom = null;
    if (posState == ePosState.Hull) {
        tempCustom = cityManager.GetCity(customID);
    }
    else {
        tempCustom = roomManager.GetRoom(customID, teamID);
    }
    tempCustom.SendPlayerSkill(player, skillID, skillType, animName, posX, posY, posZ, isPet);
    return next();
};

handler.Box = function (msg, session, next) {
    var roleID = session.get('roleID');
    var boxName = msg.boxName;

    if (null == roleID || null == boxName) {
        return next();
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    var tempCustom = null;
    if (posState == ePosState.Hull) {
        tempCustom = cityManager.GetCity(customID);
    }
    else {
        tempCustom = roomManager.GetRoom(customID, teamID);
    }
    tempCustom.SendBoxName(player, boxName);
    return next();
};

handler.BianShen = function (msg, session, next) {
    var roleID = session.get('roleID');
    var soulLu = msg.soulLu;
    var soulType = msg.soulType;
    var soulID = msg.soulID;
    var soulIndex = msg.soulIndex;

    if (null == roleID || null == soulLu || null == soulType) {
        return next();
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    var soulManager = player.GetSoulManager();
    if (null == soulManager) {
        return next();
    }

    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);

    if (soulType == 1) {    //开启变身
        if (posState != ePosState.Custom) {
            return next();
        }

        if (!soulManager.BianShen(soulID)) {
            return next();
        }
    }
    else {  //当取消变身时删除已经添加的buff
        soulManager.UnBianShen();
    }

    var tempRoom = roomManager.GetRoom(customID, teamID);
    if (null == tempRoom) {
        return next();
    }

    tempRoom.SendBianShen(player, soulLu, soulType, soulID, soulIndex);
    return next();
};

handler.RoleDie = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next();
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next();
    }
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    if (posState == ePosState.Custom) {
        var tempRoom = roomManager.GetRoom(customID, teamID);
        if (null == tempRoom) {
            return next();
        }
        player.SetWorldState(eWorldState.LifeState, eLifeState.Death);
        tempRoom.SendPlayerAtt(player, 0, 0, eLifeState.Death, 0, 0, 0);
    }
    return next();
};

handler.Relive = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var lifeState = player.GetWorldState(eWorldState.LifeState);
    if (eLifeState.Death != lifeState) {
        return next(null, {
            'result': errorCodes.Cs_PlayerState
        });
    }
    var posState = player.GetWorldState(eWorldState.PosState);
    var customID = player.GetWorldState(eWorldState.CustomID);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    if (posState != ePosState.Custom) {
        return next(null, {
            'result': errorCodes.Cs_PlayerState
        });
    }
    var tempRoom = roomManager.GetRoom(customID, teamID);
    if (null == tempRoom) {
        return next(null, {
            'result': errorCodes.Cs_NoRoom
        });
    }
    var result = tempRoom.Relive(player);
    return next(null, {
        'result': result
    });
};

handler.CustomOver = function (msg, session, next) {
    var roleID = session.get('roleID');
    var ipAddress = session.get('remoteAddress').ip;
    //var itemList = msg.item;
    var areaWin = msg.customWin;
    var customSco = msg.customSco;
    var starNum = msg.starNum;
    var tlogInfo = msg.tlogMsg;

    var params = {
        useTime :   msg.useTime,  // 消耗时间
        isTrans :  msg.isTrans,   // 是否变身
        useHp : msg.useHp,        // 使用药瓶数
        beAttacked : msg.beAttacked  // 被攻击次数
    };

    if (null == roleID || null == areaWin || null == customSco ||
        null == starNum) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    //校验是否在关卡
    var posState = player.GetWorldState(eWorldState.PosState);
    if (posState != ePosState.Custom) {
        return next(null, {
            'result': errorCodes.Cs_PlayerState
        });
    }
    var customID = player.GetWorldState(eWorldState.CustomID);
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (!customTemplate) {
        return next(null, {'result': errorCodes.Cs_NoCustomTpl});
    }
    //击杀关卡怪物的记录
    var customMonstersInfo = roomManager.customMonsters[roleID];

    if(areaWin && globalFunction.isNeedCheckMonster(customTemplate.smallType)){
        if (!customMonstersInfo || !customMonstersInfo[customID]) {
            return next(null, {'result': errorCodes.Cs_NoCustomNpcData});
        }
        if(customTemplate.smallType == eCustomSmallType.Hell){
            //校验关卡积分是否超越上限
            if (customSco > gameConst.customScoreMax) {
                return next(null, {'result': errorCodes.Cs_CheckCustomScoreFailed});
            }
        }

        //检查击杀怪物数量是否达到模板数据要求
        if (customMonstersInfo[customID].monsterNum < customTemplate.checkMonsterNum) {
            return next(null, {'result': errorCodes.Cs_KilledMonsterNumNotEnough});
        }
        //检查boss是否被击杀
        if (customTemplate.bossID && !customMonstersInfo[customID].bossID) {
            return next(null, {'result': errorCodes.Cs_NoKilledCustomBoss});
        }
    }

    //清空关卡打怪记录
    if (customMonstersInfo && customMonstersInfo[customID]) {
        customMonstersInfo[customID] = null;
    }

    // Remove all buff when finish custom.
    player.soulManager.UnBianShen();

    var exp = player.GetPlayerInfo(gameConst.ePlayerInfo.EXP);
    var expLevel = player.GetPlayerInfo(gameConst.ePlayerInfo.ExpLevel);
    var teamID = player.GetWorldState(eWorldState.TeamID);
    var tempRoom = roomManager.GetRoom(customID, teamID);
    if (null == tempRoom) {
        return next(null, {'result': errorCodes.Cs_RoomState});
    }
    if (null != customTemplate) {
        var customType = customTemplate[templateConst.tCustom.smallType];   //关卡小类型
        var dropGet = customTemplate[templateConst.tCustom.dropGet];   //失败后是否有获得
        var dropItem = player.GetItemManager().GetCustomInfo();
        var expNum = dropItem.exps || 0;
        var moneyNum = dropItem.moneys || 0;
        var itemMap = dropItem.items || {};

        var trainID = customTemplate['trainID'];
        var trainHard = customTemplate['trainHard'];

        // QQ会员，剧情关经验、金币加成
        var baseDropItem = player.GetItemManager().GetCustomBaseInfo();
        var smallType = customTemplate['smallType'];
        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 1 && smallType == gameConst.eCustomSmallType.Single) { //普通会员 5%
            var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
            moneyNum = moneyNum + Math.ceil(baseDropItem.moneys * AllTemplate['89']['attnum'] / 100);
            expNum = expNum + Math.ceil(baseDropItem.exps * AllTemplate['88']['attnum'] / 100);
        }

        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 2 && smallType == gameConst.eCustomSmallType.Single) { //超级会员 10%
            var AllTemplate = templateManager.GetAllTemplate('AllTemplate');
            moneyNum = moneyNum + Math.ceil(baseDropItem.moneys * AllTemplate['184']['attnum'] / 100);
            expNum = expNum + Math.ceil(baseDropItem.exps * AllTemplate['183']['attnum'] / 100);
        }

        if (customType == eCustomSmallType.Single) {
            var factor = eAssetsAdd.NormalCustom;
            var expFactor = eExpChange.NormalCustom;
        } else if (customTemplate['smallType'] == eCustomSmallType.Activity) {
            var factor = eAssetsAdd.ActivityCustom;
            var expFactor = eExpChange.ActivityCustom;
        } else if (customTemplate['smallType'] == eCustomSmallType.Climb) {
            var factor = eAssetsAdd.ClimbCustom;
        } else if (customTemplate['smallType'] == eCustomSmallType.Hell) {
            var factor = eAssetsAdd.HellCustom;
            var expFactor = eExpChange.HellCustom;
        } else if (customTemplate['smallType'] == eCustomSmallType.Team) {
            var factor = eAssetsAdd.MultiCustom;
        } else if (customTemplate['smallType'] == eCustomSmallType.Train) {
            var factor = eAssetsAdd.UnionTrain;
        }

        //结婚关卡 甜蜜之旅加成  如果是夫妻双方共同完成 则双倍
        var marryDouble = player.toMarryManager.marryDouble;
        if (customTemplate['smallType'] == eCustomSmallType.Marry) {
            if(1 == marryDouble){
                var factor = eAssetsAdd.SweetTrip;
                moneyNum = moneyNum + baseDropItem.moneys;
                expNum = expNum + baseDropItem.exps;
                player.toMarryManager.marryDouble = 0;
                logger.fatal("############## marryDouble:%j , roleID: %j,  money : %j , exp :%j ", marryDouble, roleID, moneyNum, expNum);
            }

        }else{
            var marryLevel = 0;
            var reward = 0;     //其他关卡 结婚玩家 加成
            if(!!player.toMarryManager.marryInfo[0]){
                marryLevel = player.toMarryManager.marryInfo[0][eMarryInfo.marryLevel];
            }
            if(marryLevel > 0){
                var wedLevelTemp = templateManager.GetTemplateByID('weddingLevelTemplate', marryLevel);
                if(!wedLevelTemp){
                    logger.error("When  TlogRoundEndFlow  weddingLevelTemplate not find Level: %j ", marryLevel);
                }else{
                    reward = wedLevelTemp[tWeddingLevel.reward];
                    moneyNum = moneyNum + Math.ceil(baseDropItem.moneys * reward / 100);
                    expNum = expNum + Math.ceil(baseDropItem.exps * reward / 100);
                }
            }
        }

        logger.info('CustomOver roleID: %s, exp: %s, expLevel: %s dropItem: %j, expNum: %j, expFactor: %j', roleID, exp,
                    expLevel, dropItem, expNum, expFactor);

        if (areaWin == 1) {     //关卡战斗成功
            player.AddExp(expNum, expFactor);
            player.GetAssetsManager().AlterAssetsValue(globalFunction.GetMoneyTemp(), moneyNum, factor); //加金币
            //for tlog
            tempRoom.UpdatePlayerTlogInfoValue(roleID, gameConst.eRoomMemberTlogInfo.moneyGet, moneyNum);
            tempRoom.UpdatePlayerTlogInfoValue(roleID, gameConst.eRoomMemberTlogInfo.expGet, expNum);
        }

        if (areaWin == 0 && dropGet == 1) { //关卡失败且可以活动收益
            player.AddExp(expNum, expFactor);  //加经验
            player.GetAssetsManager().AlterAssetsValue(globalFunction.GetMoneyTemp(), moneyNum, factor); //加金币
            //for tlog
            tempRoom.UpdatePlayerTlogInfoValue(roleID, gameConst.eRoomMemberTlogInfo.moneyGet, moneyNum);
            tempRoom.UpdatePlayerTlogInfoValue(roleID, gameConst.eRoomMemberTlogInfo.expGet, expNum);
            //非活动掉落
            for (var index in itemMap) {
                var itemNum = itemMap[index] || 0;
                if (index > 0 && itemNum > 0) {
                    player.AddItem(+index, +itemNum, factor, 0);
                }
            }

            //活动掉落
            var itemInfos = player.GetItemManager().getItemInfos();
            var npcTopList = itemInfos.npcTop.npcDropList;
            var activityNpcItem = itemInfos.items.activityNpcDropList;
            var totalDrop = {};
            if (!!activityNpcItem) {
                npcTopList.forEach(function (npcDrop, index) {
                    if (_.isEmpty(npcDrop)) {
                        var npcDrops = activityNpcItem[index];  //[{dropType:0, assetID:id, assetNum:3}, ] 一个npc身上的掉落
                        npcDrops.forEach(function (drop) {
                            var key = drop.assetID;
                            var value = drop.assetNum;
                            totalDrop[key] = totalDrop[key] ? totalDrop[key] + value : value;
                        });
                    }
                });
            }
            for (var key in totalDrop) {
                player.AddItem(+key, totalDrop[key], factor, 0);
            }
        }
    }

    if (areaWin == 1) {     //关卡战斗成功
        player.GetCustomManager().SetItemFlag(true);
    }

    tempRoom.GameOver(player, areaWin, customSco, starNum, ipAddress, tlogInfo, params,
                      function (err, result) {
                          pomelo.app.rpc.chat.chatRemote.RoomDeletePlayer(null, customID, teamID, roleID, utils.done);
                          var areaInfo = player.GetCustomManager().GetSqlStr(roleID);
                          csSql.SaveAreaSco(roleID, areaInfo, function (err) {
                              if (!!err) {
                                  logger.error('Custom function SaveAreaSco err: %s', utils.getErrorMessage(err));
                              }
                              player.addDirtyTemplate(gameConst.ePlayerDB.PLAYERDB_AREA, areaInfo);
                          });

                          if (customType == gameConst.eCustomSmallType.Coliseum) {
                              // 添加斗兽场奖励
                              player.GetColiseumManager().addColiseumItem();

                              // 保存斗兽场记录
                              var coliseumInfo = player.GetColiseumManager().GetSqlStr();
                              csSql.SaveColiseumInfo(roleID, coliseumInfo, function (err) {
                                  if (!!err) {
                                      logger.error('Custom function coliseumInfo err: %s', utils.getErrorMessage(err));
                                  }
                                  player.addDirtyTemplate(gameConst.ePlayerDB.Coliseum, coliseumInfo);
                              });
                              // 客户端更新NPC消息
                              player.GetColiseumManager().SendColiseumOver();
                          }
                          return next(null, result);
                      });
};

handler.GetCustomItem = function (msg, session, next) {     //获取关卡结算物品
    var roleID = session.get('roleID');
//    var itemList = msg.item;
    var customID = msg.customID;
    if (null == roleID || null == customID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var canGetFlag = player.GetCustomManager().GetItemFlag();
    if (!canGetFlag) {      //重复请求获取关卡结算物品
        return next(null, {'result': 0});
    }

    var itemInfos = player.GetItemManager().getItemInfos();
    var npcTopList = itemInfos.npcTop.npcDropList;
    var npcItem = itemInfos.items.itemInfo;
    var activityNpcItem = itemInfos.items.activityNpcDropList;

    // for tlog //////
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    var customType = customTemplate[templateConst.tCustom.smallType];   //关卡小类型
    var factor = eAssetsAdd.OtherCustom;
    if (customType == gameConst.eCustomSmallType.Single) {
        factor = eAssetsAdd.NormalCustom;
    } else if (customType == gameConst.eCustomSmallType.Activity) {
        factor = eAssetsAdd.ActivityCustom;
    } else if (customType == gameConst.eCustomSmallType.Hell) {
        factor = eAssetsAdd.HellCustom;
    } else if (customType == gameConst.eCustomSmallType.Team) {
        factor = eAssetsAdd.MultiCustom;
    } else if (customType == gameConst.eCustomSmallType.Train) {
        factor = eAssetsAdd.UnionTrain;
    }
    //////////////////
    var totalDrop = {};
    //非活动掉落
    for (var npc in npcTopList) {
        var npc_length = JSON.stringify(npcTopList[npc]).length;
        if (npc_length <= 2) {
            var this_npc = npcItem[npc];
            for (var item in this_npc) {
                var this_item = this_npc[item];
                for (var key in this_item) {
                    var int_key = parseInt(key);
                    var value = this_item[key];
                    var m = globalFunction.GetMoneyTemp();
                    if (m != int_key) {
                        totalDrop[int_key] = totalDrop[int_key] ? totalDrop[int_key] + value : value;
                        //player.AddItem(int_key, value, factor, 0);
                    }
                }
            }
        }
    }
    //活动掉落
    if (!!activityNpcItem) {
        npcTopList.forEach(function (npcDrop, index) {
            if (_.isEmpty(npcDrop)) {
                npcDrops = activityNpcItem[index];  //[{dropType:0, assetID:id, assetNum:3}, ] 一个npc身上的掉落
                npcDrops.forEach(function (drop) {
                    var key = drop.assetID;
                    var value = drop.assetNum;
                    totalDrop[key] = totalDrop[key] ? totalDrop[key] + value : value;
                });
            }
        });
    }
    logger.warn('GetCustomItem roleID: %j, npcTopList: %j, npcItem: %j, totalDrop: %j', roleID, npcTopList, npcItem,
                totalDrop);
    for (var key in totalDrop) {
        player.AddItem(+key, totalDrop[key], factor, 0);
    }

    player.GetCustomManager().SetItemFlag(false);       //设置关卡物品已领取
//    if (null == itemList) {
//        return next(null, {'result': 0});
//    }
//    var itemMsg = [];
//    for (var index in itemList) {
//        var ID = itemList[ index ].ID;
//        if (null != ID) {
//            var temp = player.GetItemManager().CreateItem(player, ID);
//            itemMsg.push(temp);
//        }
//    }
//    player.GetItemManager().SendItemMsg(player, itemMsg, gameConst.eCreateType.New, gameConst.eItemOperType.GetItem);
    return next(null, {'result': 0});
};

handler.CustomSweep = function (msg, session, next) {     //剧情关卡扫荡
    var roleID = session.get('roleID');
    var customID = msg.customID;
    var nType = msg.nType;  //扫荡类型  1次/5次
    var sType = msg.sType;  //扫荡类型  0是免费，1是消耗钻石
    var isResolve = msg.isResolve;  //自动分解 1自动分解 0不分解
    if (null == roleID || null == customID || null == nType || null == isResolve) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    if (player.GetItemManager().IsFull(gameConst.eBagPos.EquipOff) == true) {   //背包已满
        return next(null, {result: errorCodes.Cs_ItemFull});
    }
    var customManager = player.GetCustomManager();
    var cusTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == cusTemplate) {
        return next(null, {'result': errorCodes.SystemWrong});
    }
    var levelTarget = gameConst.eLevelTarget.Normal;
    if(cusTemplate['smallType'] == eCustomSmallType.StoryDrak){
        levelTarget = gameConst.eLevelTarget.StoryDrak;
    }
    var oldCustom = customManager.GetCustom(customID, levelTarget);
    if (null == oldCustom) {            //扫荡关卡不存在
        return next(null, {'result': errorCodes.SystemWrong});
    }

    var activityFlagList = customManager.GetActivityInfo(); //运营活动翻倍信息

    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }
    if (null == vipTemplate) {
        return next(null, {'result': errorCodes.SystemWrong});
    }

    if(cusTemplate['smallType'] == eCustomSmallType.StoryDrak){
        var allTemplate = templateManager.GetTemplateByID('AllTemplate', 232);
        if(player.GetStoryDrak().getAtkTimes() >= allTemplate['attnum']){
            return next(null, {'result': errorCodes.Cs_CustomNum});
        }
        if(oldCustom.GetCustomInfo(gameConst.eCustomInfo.WIN) <= 0){
            return next(null, {'result': errorCodes.Cs_RoomNoWin});
        }
        nType = 0;
        if(sType == 1){
            if(oldCustom.GetCustomInfo(gameConst.eCustomInfo.Achieve) != 7){
                return next(null, {'result': errorCodes.Cs_RoomStarNotEnough});
            }
        }

    }else{
        var starNum = oldCustom.GetCustomInfo(gameConst.eCustomInfo.StarNum);
        var openSweep = vipTemplate['openSweep'];
        if (5 > starNum && 0 == openSweep) {      //扫荡关卡星级不满足
            return next(null, {'result': errorCodes.Cs_RoomNoWin});
        }
    }

    var allTemplate = templateManager.GetTemplateByID('AllTemplate', 94);
    if (null == allTemplate) {
        return next(null, {'result': errorCodes.SystemWrong});
    }
    var openResolve = vipTemplate[templateConst.tVipTemp.openResolve];      //扫荡物品自动分解所需vip等级
    if (1 == isResolve && 0 == openResolve) {
        return next(null, {'result': errorCodes.VipLevel});
    }
    var isNobility = player.GetPlayerInfo(gameConst.ePlayerInfo.IsNobility);    //玩家手游贵族信息 0不是 1是
    var physical = cusTemplate['physical'];
    var msg = {
        result: 0,
        itemList: []
    };

    var allAllTemplate = templateManager.GetAllTemplate('AllTemplate');
    if (0 == nType) {   //扫荡一次
        if (player.GetVipInfoManager().getNumByType(eVipInfo.FreeSweepNum) >= vipTemplate['freeSweep']) {
            if(cusTemplate['smallType'] == eCustomSmallType.StoryDrak && sType == 0){
                return next(null, {'result': errorCodes.FreeSweepNumOver});
            }
            //免费扫荡次数已用完
            if ((vipTemplate['unlockYuanBaoSweep'] == 1 || 1 == isNobility) && sType == 0) { //开启钻石扫荡
                return next(null, {'result': errorCodes.UseYuanBaoSweep, 'costYuanBao': 1});
            } else if (sType == 0) {
                return next(null, {'result': errorCodes.FreeSweepNumOver});
            }
        }
        var freeNum = 1;

        if (player.assetsManager.CanConsumeAssets(globalFunction.GetPhysical(), physical) == false) {
            return next(null, {'result': errorCodes.Physical});
        }
        if ((cusTemplate['smallType'] == eCustomSmallType.StoryDrak&& sType == 1) || (player.GetVipInfoManager().getNumByType(eVipInfo.FreeSweepNum) >= vipTemplate['freeSweep']
            && (vipTemplate['unlockYuanBaoSweep'] == 1 || 1 == isNobility) && sType == 1)) {//免费次数已用完 TODO 增加一次付费扫荡
            var cusTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
            if (null == cusTemplate) {
                return next(null, {'result': errorCodes.SystemWrong});
            }
            var costYuanBao = cusTemplate['passCost'];
            if (player.assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), costYuanBao) == false) {
                return next(null, {'result': errorCodes.NoYuanBao});
            }
            //player.assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(), -costYuanBao);//扣除元宝
            player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -costYuanBao,
                eAssetsReduce.SweepCustom);
        }

        var tempMsg = {
            winExp: 0,
            winMoney: 0,
            instances: []
        };

        if((cusTemplate['smallType'] == eCustomSmallType.StoryDrak&& sType == 1)){
            var storyResult = this.StoryDrakFlop(customID);
            if(storyResult.result != errorCodes.OK){
                return next(null, {'result': storyResult.result});
            }

            tempMsg.instances.push({id: +storyResult.id, num: storyResult.num});
        }

        player.assetsManager.SetAssetsValue(globalFunction.GetPhysical(), -physical);  //扣除玩家体力
        var uID = player.GetPlayerInfo(ePlayerInfo.UnionID);
        if (0 != uID) {
            pomelo.app.rpc.us.usRemote.SetPlayerUnionWeiWang(null, roleID, physical, utils.done);//增加公会威望
        }

        var result = globalFunction.GetCustomItemList(customID, gameConst.eLevelTarget.Normal);
        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 1) { // 判断是否为QQ会员，0不是 1普通会员 2超级会员
            result.expNum = result.expNum + Math.ceil(result.expNum * allAllTemplate['88']['attnum'] / 100);
            result.winExp = result.winExp + Math.ceil(result.winExp * allAllTemplate['88']['attnum'] / 100);
            result.winMoney = result.winMoney + Math.ceil(result.winMoney * allAllTemplate['89']['attnum'] / 100);
        }
        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 2) { // 判断是否为QQ会员，0不是 1普通会员 2超级会员
            result.expNum = result.expNum + Math.ceil(result.expNum * allAllTemplate['183']['attnum'] / 100);
            result.winExp = result.winExp + Math.ceil(result.winExp * allAllTemplate['183']['attnum'] / 100);
            result.winMoney = result.winMoney + Math.ceil(result.winMoney * allAllTemplate['184']['attnum'] / 100);
        }
        if (activityFlagList[0].flag) {     //经验翻倍
            result.expNum = Math.floor(result.expNum * activityFlagList[0].double);
            result.winExp = Math.floor(result.winExp * activityFlagList[0].double);
        }
        if (activityFlagList[1].flag) {     //金币翻倍
            result.winMoney = Math.floor(result.winMoney * activityFlagList[1].double);
        }

        tempMsg.winExp = result.expNum + result.winExp;
        tempMsg.winMoney = result.winMoney;

        player.AddExp(result.expNum + result.winExp, eExpChange.CustomSweep);
        //player.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(), result.winMoney);
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetMoneyTemp(), result.winMoney,
                                                   eAssetsAdd.SweepCustom);

        //TODO 添加翻牌奖励  flopManager

        var flopMsg = player.flopManager.UseFlopForSweepReward(customID, 0);
        var sweepGetTake = vipTemplate['sweepGetTakeCardReward'];
        if (_.isObject(flopMsg) && vipLevel > 0 && sweepGetTake == defaultValues.sweepGetTakeCardReward) {
            var itemList = player.AddItem(flopMsg.id, flopMsg.num, eAssetsAdd.SweepCustom, eExpChange.Flop);
            this.SweepItemResolve(player, itemList, isResolve);
            tempMsg.instances.push({id: flopMsg.id, num: flopMsg.num});
        }

        for (var index in result.item) {
            if (activityFlagList[2].flag && -1 != activityFlagList[2].soul.indexOf(parseInt(index))) {  //魂翻倍
                result.item[index] = Math.floor(result.item[index] * activityFlagList[2].double);
            }
            if (activityFlagList[0].flag && parseInt(index) == globalFunction.GetExpTemp()) {     //经验翻倍
                result.item[index] = Math.floor(result.item[index] * activityFlagList[0].double);
            }
            if (activityFlagList[1].flag && parseInt(index) == globalFunction.GetMoneyTemp()) {     //金币翻倍
                result.item[index] = Math.floor(result.item[index] * activityFlagList[1].double);
            }
            var itemList = player.AddItem(index, result.item[index], eAssetsAdd.SweepCustom, null);
            this.SweepItemResolve(player, itemList, isResolve);
            tempMsg.instances.push({id: parseInt(index), num: result.item[index]});
        }

        //增加活动掉落
        var activityDrops = player.itemManager.getActivityDrops(customID);
        for (var id in activityDrops) {
            var drop = activityDrops[id];
            var itemList = player.AddItem(id, drop[1], eAssetsAdd.ActivityDrop, null);
            this.SweepItemResolve(player, itemList, isResolve);
            tempMsg.instances.push({id: +id, num: drop[1]});
        }

        msg.itemList.push(tempMsg);
        player.GetMissionManager().IsMissionOver(eMisType.SpecifyCus, customID, freeNum);
        player.GetMissionManager().IsMissionOver(eMisType.AnyCustom, customID, freeNum);

        if(cusTemplate['smallType'] == eCustomSmallType.StoryDrak){
            player.GetStoryDrak().addAtkTimes();
            player.GetStoryDrak().SendStoryMsg();
        }else{
            if (player.GetVipInfoManager().getNumByType(eVipInfo.FreeSweepNum) >= vipTemplate['freeSweep']
                && (vipTemplate['unlockYuanBaoSweep'] == 1 || 1 == isNobility) && sType == 1) {//免费次数已用完
                player.GetVipInfoManager().setNumByType(roleID, eVipInfo.FreeSweepNum, 0);//更新每日免费扫荡次数+1
            } else {
                player.GetVipInfoManager().setNumByType(roleID, eVipInfo.FreeSweepNum, freeNum);//更新每日免费扫荡次数+1
            }
            sendFreeSweepNum(player); //同步免费扫荡剩余次数
        }

        return next(null, msg);
    }
    //扫荡五次 原来是10次
    var vipSweepNum = player.GetVipInfoManager().getNumByType(eVipInfo.FreeSweepNum);
    if (vipTemplate['freeSweep'] - vipSweepNum < 5) {
        if ((vipTemplate['unlockYuanBaoSweep'] == 1 || 1 == isNobility) && sType == 0 && vipTemplate['freeSweep']
                                                                                             - vipSweepNum >= 0) { //开启钻石扫荡
            return next(null,
                        {'result': errorCodes.UseYuanBaoSweep, 'costYuanBao': 5 - (vipTemplate['freeSweep']
                            - vipSweepNum)});
        } else if ((vipTemplate['unlockYuanBaoSweep'] == 1 || 1 == isNobility) && sType == 0) {
            return next(null,
                        {'result': errorCodes.UseYuanBaoSweep, 'costYuanBao': 5 });
        } else if (sType == 0) {
            return next(null, {'result': errorCodes.FreeSweepNumOver});
        }
    }
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate',
                                                      player.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel) + 1);
    if (null == vipTemplate) {
        return next(null, {'result': errorCodes.NoTemplate});
    }
    if (0 != vipTemplate[templateConst.tVipTemp.needSweep]) {       //vip等级不足
        return next(null, {'result': errorCodes.VipLevel});
    }
    if (player.assetsManager.CanConsumeAssets(globalFunction.GetPhysical(), physical * 5) == false) {
        return next(null, {'result': errorCodes.Physical});
    }
    var freeNum = vipTemplate['freeSweep'] - vipSweepNum;
    var costNum = 5;
    if (freeNum > 0 && freeNum < 5) {
        costNum = 5 - freeNum;
    }
    if (player.GetVipInfoManager().getNumByType(eVipInfo.FreeSweepNum) >= vipTemplate['freeSweep']
            && (vipTemplate['unlockYuanBaoSweep'] == 1 || 1 == isNobility) && sType == 1) {//消耗钻石扫荡
        var costYuanBao = templateManager.GetTemplateByID('CustomTemplate', customID)['passCost'];
        if (player.assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), costYuanBao * costNum) == false) {
            return next(null, {'result': errorCodes.NoYuanBao});
        }
        //player.assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(), -costYuanBao * costNum);//扣除元宝
        player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -costYuanBao * costNum,
                                              eAssetsReduce.SweepCustom);
    } else if (vipTemplate['freeSweep'] - vipSweepNum < 5 && (vipTemplate['unlockYuanBaoSweep'] == 1 || 1 == isNobility)
        && sType == 1) {
        var vipCostNum = 5 - (vipTemplate['freeSweep'] - vipSweepNum); //==免费扫荡次数
        var costYuanBao = templateManager.GetTemplateByID('CustomTemplate', customID)['passCost'];
        if (player.assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), costYuanBao * costNum) == false) {
            return next(null, {'result': errorCodes.NoYuanBao});
        }
        //player.assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(), -costYuanBao * vipCostNum);//扣除元宝
        player.assetsManager.AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -costYuanBao * vipCostNum,
                                              eAssetsReduce.SweepCustom);
    }
    player.assetsManager.SetAssetsValue(globalFunction.GetPhysical(), -(physical * 5));  //扣除玩家体力
    var uID = player.GetPlayerInfo(ePlayerInfo.UnionID);
    if (0 != uID) {
        pomelo.app.rpc.us.usRemote.SetPlayerUnionWeiWang(null, roleID, physical * 5, utils.done);//增加公会威望
    }
    for (var i = 0; i < 5; ++i) {
        var result = globalFunction.GetCustomItemList(customID, gameConst.eLevelTarget.Normal);
        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 1) { // 判断是否为QQ会员，0不是 1普通会员 2超级会员
            result.expNum = result.expNum + Math.ceil(result.expNum * allAllTemplate['88']['attnum'] / 100);
            result.winExp = result.winExp + Math.ceil(result.winExp * allAllTemplate['88']['attnum'] / 100);
            result.winMoney = result.winMoney + Math.ceil(result.winMoney * allAllTemplate['89']['attnum'] / 100);
        }
        if (player.GetPlayerInfo(ePlayerInfo.IsQQMember) == 2) { // 判断是否为QQ会员，0不是 1普通会员 2超级会员
            result.expNum = result.expNum + Math.ceil(result.expNum * allAllTemplate['183']['attnum'] / 100);
            result.winExp = result.winExp + Math.ceil(result.winExp * allAllTemplate['183']['attnum'] / 100);
            result.winMoney = result.winMoney + Math.ceil(result.winMoney * allAllTemplate['184']['attnum'] / 100);
        }
        if (activityFlagList[0].flag) {     //经验翻倍
            result.expNum = Math.floor(result.expNum * activityFlagList[0].double);
            result.winExp = Math.floor(result.winExp * activityFlagList[0].double);
        }
        if (activityFlagList[1].flag) {     //金币翻倍
            result.winMoney = Math.floor(result.winMoney * activityFlagList[1].double);
        }
        player.AddExp(result.expNum + result.winExp, eExpChange.CustomSweep);
        //player.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(), result.winMoney);
        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetMoneyTemp(), result.winMoney,
                                                   eAssetsAdd.SweepCustom);
        var tempMsg = {
            winExp: result.expNum + result.winExp,
            winMoney: result.winMoney,
            instances: []
        }
        for (var index in result.item) {
            if (activityFlagList[2].flag && -1 != activityFlagList[2].soul.indexOf(parseInt(index))) {
                result.item[index] = Math.floor(result.item[index] * activityFlagList[2].double);
            }
            if (activityFlagList[0].flag && parseInt(index) == globalFunction.GetExpTemp()) {     //经验翻倍
                result.item[index] = Math.floor(result.item[index] * activityFlagList[0].double);
            }
            if (activityFlagList[1].flag && parseInt(index) == globalFunction.GetMoneyTemp()) {     //金币翻倍
                result.item[index] = Math.floor(result.item[index] * activityFlagList[1].double);
            }
            var itemList = player.AddItem(index, result.item[index], eAssetsAdd.SweepCustom, null);
            this.SweepItemResolve(player, itemList, isResolve);
            tempMsg.instances.push({id: parseInt(index), num: result.item[index]});
        }

        //增加活动掉落
        var activityDrops = player.itemManager.getActivityDrops(customID);
        for (var id in activityDrops) {
            var drop = activityDrops[id];
            var itemList = player.AddItem(id, drop[1], eAssetsAdd.ActivityDrop, null);
            this.SweepItemResolve(player, itemList, isResolve);
            tempMsg.instances.push({id: +id, num: drop[1]});
        }

        //TODO 扫荡5次添加翻牌奖励  flopManager
        var flopMsg = player.flopManager.UseFlopForSweepReward(customID, 0);
        var sweepGetTake = vipTemplate['sweepGetTakeCardReward'];
        if (_.isObject(flopMsg) && vipLevel > 0 && sweepGetTake == defaultValues.sweepGetTakeCardReward) {
            var itemList = player.AddItem(flopMsg.id, flopMsg.num, eAssetsAdd.SweepCustom, eExpChange.Flop);
            this.SweepItemResolve(player, itemList, isResolve);
            tempMsg.instances.push({id: flopMsg.id, num: flopMsg.num});
        }
        msg.itemList.push(tempMsg);
    }
    player.GetMissionManager().IsMissionOver(eMisType.SpecifyCus, customID, 5);
    player.GetMissionManager().IsMissionOver(eMisType.AnyCustom, customID, 5);


    if (costNum > 0 && costNum < 5) {
        player.GetVipInfoManager().setNumByType(roleID, eVipInfo.FreeSweepNum, 5 - costNum);//更新扫荡次数+5
    } else if (freeNum <= 0) {
        player.GetVipInfoManager().setNumByType(roleID, eVipInfo.FreeSweepNum, 0);//更新扫荡次数+5
    } else {
        player.GetVipInfoManager().setNumByType(roleID, eVipInfo.FreeSweepNum, costNum);//更新扫荡次数+5
    }
    sendFreeSweepNum(player); //同步免费扫荡剩余次数

    return next(null, msg);
};


// 剧情关卡付费扫荡
handler.StoryDrakFlop = function(customID){
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return {
            result: errorCodes.SystemWrong,
            id : 0,
            num : 0
        };
    }
    if (CustomTemplate[tCustom.FlopID] <= 0) {
        return {
            result: errorCodes.Cs_RoomNotFlop,
            id : 0,
            num : 0
        };
    }
    var flopTemplate = templateManager.GetTemplateByID('FlopTemplate', CustomTemplate[tCustom.FlopID]);
    if (null == flopTemplate) {
        return {
            result: errorCodes.SystemWrong,
            id : 0,
            num : 0
        };
    }

    var feeRandom = 0;
    var feeNum = flopTemplate['feeNum'];
    for (var i = 0; i < feeNum; ++i) {
        feeRandom += flopTemplate['feeRandom_' + i];
    }
    var resultRandom = Math.floor(Math.random() * feeRandom);
    var sum = flopTemplate['feeRandom_0'];
    var prize = feeNum - 1;
    for (var i = 0; i < feeNum - 1; ++i) {
        if (resultRandom < sum) {
            prize = i;
            break;
        }
        else {
            sum += flopTemplate['feeRandom_' + ( i + 1 )];
        }
    }

    return {
        result: errorCodes.OK,
        id : flopTemplate['feeID_' + prize],
        num : flopTemplate['feeNum_' + prize]
    };
};

handler.SweepItemResolve = function (player, itemList, isResolve) {    //扫荡物品分解
    if (null == itemList || 0 == isResolve) {
        return;
    }
    for (var index in itemList) {
        var temp = itemList[index];
        if (null != temp) {
            var itemGuid = temp.itemData[gameConst.eItemInfo.GUID];     //要分解装备的guid
            var equipType = temp.itemTemplate.equipType;    //要分解装备的位置
            var newBaseZhanli = temp.itemData[gameConst.eItemInfo.BaseZhanli];      //要分解的装备的基础战力
            var nowItemGuid = player.GetEquipManager().GetEquip(equipType); //当前对应位置穿戴装备的guid
            if (0 == nowItemGuid) {     //当前位置无装备
                continue;
            }
            var nowItem = player.GetItemManager().GetItem(nowItemGuid);
            var nowItemBaseZhanli = nowItem.GetItemInfo(gameConst.eItemInfo.BaseZhanli);    //当前装备的基础战力
            if (nowItemBaseZhanli >= newBaseZhanli) {   //当前装备基础战力高于分解装备
                var res = itemLogic.Resolve(player, itemGuid);
                if (res.result == 0) {
                    player.GetItemManager().SendServerDeleteItem([itemGuid]);
                }
            }
        }
    }
};

// 这函数貌似没用了
handler.FastFinishCustom = function (msg, session, next) {
    var roleID = session.get('roleID');
    var customID = msg.customID;
    var levelTarget = msg.levelTarget;

    if (globalFunction.isLegalLevelTarget(levelTarget, customID) == false) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (null == roleID || null == customID || null == levelTarget) {
        return next(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == customTemplate) {
        return next(null, {'result': errorCodes.SystemWrong});
    }
    var customManager = player.GetCustomManager();
    if (null == customManager) {
        return next(null, {'result': errorCodes.SystemWrong});
    }

    var winResult = customManager.IsWin(customID, levelTarget);
    if (winResult > 0) {
        return next(null, {'result': errorCodes.Cs_RoomNoWin});
    }

    var fullResult = customManager.IsFull(customID, levelTarget);
    if (fullResult > 0) {
        return next(null, {'result': errorCodes.Cs_CustomNum});
    }
    var yuanbaoID = globalFunction.GetYuanBaoTemp();
    var cost = customTemplate[tCustom.passCost];
    if (player.assetsManager.CanConsumeAssets(yuanbaoID, cost) == false) {
        return next(null, {'result': errorCodes.NoYuanBao});
    }

    player.assetsManager.SetAssetsValue(yuanbaoID, -cost);

    customManager.AddCustom(customID, levelTarget);
    var result = globalFunction.GetCustomItemList(customID, 0);
    player.AddExp(result.expNum + result.winExp * 8);
    player.GetAssetsManager().SetAssetsValue(globalFunction.GetMoneyTemp(), result.winMoney * 8);
    var msg = {
        result: 0,
        winExp: result.winExp * 8 + result.expNum,
        winMoney: result.winMoney * 8,
        instances: []
    };
    for (var index in result.item) {
        player.AddItem(index, result.item[index], eAssetsAdd.DefaultAdd, null);
        msg.instances.push({ID: parseInt(index), num: result.item[index]});
    }

    return next(null, msg);
};

var sendFreeSweepNum = function (player) {
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }
    if (null == vipTemplate) {
        return;
    }

    var route = "ServerSendFreeWeeepNum";
    var msg = {num: 0};
    msg.num = vipTemplate['freeSweep'] - player.vipInfoManager.getNumByType(eVipInfo.FreeSweepNum);
    player.SendMessage(route, msg);
};

handler.testRpcSendChat = function (msg, session, next) {
    var content = msg.chatContent;
    pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.PaTa, 0, content, function (err, res) {
        return next(null, {result: 200});
    });
};
