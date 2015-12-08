/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-9-26
 * Time: 上午10:33
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var playerManager = require('../../../cs/player/playerManager');
var globalFunction = require('../../../tools/globalFunction');
var operateControl = require('../../../cs/operateActivity/operateControl');
var defaultValues = require('../../../tools/defaultValues');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var advanceController = require('../../../cs/advance/advanceController');
var eMisType = gameConst.eMisType;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.RequireState = function (msg, session, next) {
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
    var activities = player.GetActivityManager().RequireState();
    return next(null, {
        'result': 0,
        'activities': activities
    });
};

//handler.LotteryDrawList = function (msg, session, next) {
//    var roleID = session.get('roleID');
//    if (null == roleID) {
//        next(null, {
//            'result': errorCodes.ParameterNull
//        });
//        return;
//    }
//    var player = playerManager.GetPlayer(roleID);
//    if (null == player) {
//        next(null, {
//            'result': errorCodes.NoRole
//        });
//        return;
//    }
//    var niuDanList = player.GetNiuDanManager().GetNiuDanList(roleID);
//    next(null, {
//        'result': 0,
//        'LotteryDraw': niuDanList
//    });
//};
/**
 *点击主城许愿石
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 * @constructor
 */
handler.ClickWishStone = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    var tempMs = player.GetNiuDanManager().SendNiuDanList( null, null ,1);
    return next(null, tempMs);
};

handler.UseLotteryDraw = function (msg, session, next) {
    var roleID = session.get('roleID');
    var niuDanID = msg.attID;
    var nType = msg.nType;
    var isFree = msg.isFree;//1 是免费  0开启一次 -1
    if (null == roleID || null == nType || null == niuDanID || null == isFree) {
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
    if (player.GetItemManager().IsFullEx(gameConst.eBagPos.EquipOff) == true) {   //背包已满
        return next(null, {
            'result': errorCodes.Cs_ItemFull
        });
    }
    var msg = player.GetNiuDanManager().UseNiuDan( niuDanID, nType, isFree);
    var useNum = 1;     //抽奖的次数
    if (1 == nType) {
        useNum = 10;
    }
    if (typeof msg == 'number') {
        return next(null, {
            'result': msg
        });
    }
    else {
        player.GetMissionManager().IsMissionOver( eMisType.Lottery, 0, useNum);
        return next(null, {
            'result': errorCodes.OK,
            'OpenLottery': msg
        });
    }
};

handler.RefreshCD = function (msg, session, next) {
    var roleID = session.get('roleID');
    var activityID = msg.activityID;
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
    var result = player.GetActivityManager().RefreshCD(activityID);
    return next(null, {
        'result': result
    });
};

handler.GetOperateTime = function (msg, session, next) {    //获取运营活动的剩余时间
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    operateControl.GetOperateLeftTime(player, next);
};
//历练扫荡
handler.ExperienceSweep = function (msg, session, next) {
    var roleID = session.get('roleID');
    var activityID = msg.activityID; //大活动ID
    var customID = msg.customID;  //关卡ID
    var levelTarget = msg.levelTarget;

    if(globalFunction.isLegalLevelTarget(levelTarget, customID) == false){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (null == roleID || null == activityID || null == customID || null == levelTarget) {
        return next(null, {
            'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole});
    }

    var fullResult = player.GetCustomManager().IsFull(customID, levelTarget);
    if (fullResult > 0) {
        return next(null, {'result': errorCodes.Cs_CustomNum});
    }

    var result = player.GetActivityManager().ExperienceSweep( activityID, customID, levelTarget);

    return next(null, result);
};

// 得到活动信息
handler.OnGetAdvanceInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var result = advanceController.toClientMessage();
    return next(null, result);
};

// 获取活动的奖励
// 得到活动信息
handler.OnGetAdvanceAward = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var attID = msg.attID;

    if(advanceController.isRunningAdvance(attID) == false){
        return next(null, {'result': errorCodes.NoRole});
    }
    var rewardStep = msg.step;

    var advanceInfo = player.GetAdvanceManager();

    var retMsg = advanceInfo.OnGetAward(attID, rewardStep);

    return next(null, retMsg);
};

//一键获得活动奖励
handler.OnGetAdvanceAwardAll = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var attID = msg.attID;

    if(advanceController.isRunningAdvance(attID) == false){
        return next(null, {'result': errorCodes.NoRole});
    }
    //var rewardStep = msg.step;

    var advanceInfo = player.GetAdvanceManager();

    var retMsg = advanceInfo.OnGetAwardAll(attID);

    return next(null, retMsg);
};