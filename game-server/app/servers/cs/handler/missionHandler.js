/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-11-15
 * Time: 下午6:27
 * To change this template use File | Settings | File Templates.
 */
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;


handler.OneKeyComplete = function (msg, session, next) {    //任务一键完成
    var roleID = session.get('roleID');
    var misID = msg.misID;  //任务ID

    if (null == roleID || null == misID) {
        return next(null, {result: errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {result: errorCodes.NoRole});
    }
    var result = player.GetMissionManager().OneKeyComplete( misID);
    return next(null, {result: result});
};

handler.GetRewardPrize = function (msg, session, next) {    //悬赏任务领奖
    var roleID = session.get('roleID');
    var misID = msg.attID;  //任务ID
    if (null == roleID || null == misID) {
        return next(null, {result: errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {result: errorCodes.NoRole});
    }
    var result = player.GetrewardMisManager().GetRewardPrize(misID);
    return next(null, {result: result});
};


/*handler.GetMissionPrize = function (msg, session, next) {
 var roleID = session.get('roleID');
 var bigType = msg.bigType;
 var misID = msg.misID;

 if (null == roleID || null == bigType || null == misID ) {
 next(null, {
 result: errorCodes.ParameterNull
 });
 return;
 }
 var player = playerManager.GetPlayer(roleID);
 if (null == player) {
 next(null, {
 result: errorCodes.NoRole
 });
 return;
 }
 var result = player.GetMissionManager().GetMissionPrize( player, bigType, misID );
 next(null, {
 result: result
 });
 };*/
/*
 handler.GetAchievePrize = function (msg, session, next) {
 var roleID = session.get('roleID');
 var achiID = msg.achiID;

 if (null == roleID || null == achiID ) {
 next(null, {
 result: errorCodes.ParameterNull
 });
 return;
 }
 var player = playerManager.GetPlayer(roleID);
 if (null == player) {
 next(null, {
 result: errorCodes.NoRole
 });
 return;
 }
 var result = player.GetAchieveManager().GetAchievePrize( player, achiID );
 next(null, {
 result: result
 });
 };*/
