/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-6
 * Time: 下午4:58
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('../../../us/player/playerManager');
var gameConst = require('../../../tools/constValue');
var ePlayerInfo = gameConst.ePlayerInfo;
var unionManager = require('../../../us/union/unionManager');
var errorCodes = require('../../../tools/errorCodes');

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.RemoveUnionScore = function (roleID, callback) {
    unionManager.DeleteRoleUnionInfo(roleID, callback);
};

handler.FindRoleUnionInfo = function (roleID, callback) {
    unionManager.FindRoleUnionInfo(roleID, callback);
};
handler.SetPlayerUnionWeiWang = function (roleID, weiWang, callback) {
    unionManager.SetPlayerWeiWang(roleID, weiWang, callback);
};

handler.AddPlayer = function (playerInfo, csID, uid, sid, callback) {
    playerManager.AddPlayer(playerInfo, csID, uid, sid);
    return callback();
};

handler.DeletePlayer = function (roleID, callback) {
    playerManager.DeletePlayer(roleID);
    return callback();
};

handler.AddUnionWeiWang = function (roleID, WeiWangNum, callback) {
    unionManager.GmAddUnionWeiWang(roleID, WeiWangNum);
    return callback(null);
};

handler.saveRoleUnionRank = function (unionID, callback) {
    var roleList = unionManager.getMemberList(unionID);
    var bossID = unionManager.getBossID(unionID);
    return callback(null, roleList, bossID);
};

/**
 * 玩家csID 改变
 *
 * @param {Number} roleID 玩家ID
 * @param {Number} csID 玩家csID
 * @param {Function} callback
 * */
handler.SetPlayerCsID = function (roleID, csID, callback) {
    playerManager.SetPlayerCs(roleID, csID);
    return callback();
};

/**
 * 获取当前工会成员的RoleID
 * @param roleID
 * @constructor
 */
handler.GetUnionMemberID = function (roleID, callback) {
    var unionMember = unionManager.GetUnionMember(roleID);
    if (!unionMember) {
        unionMember = [];
    }
    var memberID = [];
    for (var m in unionMember) {
        var mID = unionMember[m]['roleID'];
        memberID.push(mID);
    }
    return callback(null, memberID)
};

// 更新跨天信息
handler.Update12Info = function (roleID, csID, callback) {
    unionManager.clearRoleShopInfo(roleID);
    return callback(null);
};

// 添加公会积分
handler.AddUnionScore = function (roleID, csID, score, lianyuType, callback) {

    unionManager.AddUnionScore(roleID, score, lianyuType, callback);
};

// 添加公会神殿经验
handler.AddTempleExp = function (roleID, csID, exp, callback) {
    unionManager.AddTempleExp(roleID, exp);
    return callback(null);
};

// 添加公会女神人气
handler.AddLadyPop = function (roleID, csID, popNum, callback) {
    unionManager.AddLadyPop(roleID, popNum);
    return callback(null);
};

/**获取公会信息
 * @param unionID  公会ID
 * @param index  公会属�?�名
 */
handler.GetUnionInfo = function(unionID, index, callback){
    //参数�?�?
    if(!unionID){
        callback(new Error("Empty unionID!"), null);
        return;
    };

    //union
    var union = unionManager.GetUnion(unionID);
    if(!union){
//        callback(new Error("Union does not exist!"), null);
        callback("Union does not exist!", null);
        return;
    }

    //index
    if(!index){ //返回�?有Union属�??
        callback(null, union);
        return;
    }else{
        callback(null, union[index]);
        return;
    }
};

// 参加公会夺城�?
handler.CheckUnionFight = function(unionID, roleID, callback){
    if(unionID == null || roleID == null){
        return callback(null);
    }
    unionManager.onCheckFight(unionID, roleID, callback);
};

// 添加公会夺城战伤�?
handler.AddUnionFightDamage = function(unionID, roleID, animalOrder, hitDamage, callback){
    if(unionID == null || roleID == null || animalOrder == null || hitDamage == null || hitDamage <= 0){
        return callback(null, {result: errorCodes.ParameterNull});
    }

    unionManager.AddFightDamage(unionID, roleID, animalOrder, hitDamage, callback);
};

// 获得公会夺城战伤�?
handler.getPlayerDamage = function(roleID, callback) {
    if (roleID == null) {
        return callback(null, {result: errorCodes.ParameterNull});
    }

    unionManager.getPlayerDamage(roleID, callback);
};

// 获得公会夺城战伤�?
handler.getFightAnimal = function(unionID, teamRoleList, callback) {
    if (unionID == null) {
        return callback(null, {result: errorCodes.ParameterNull});
    }

    unionManager.getFightAnimal(unionID, teamRoleList, callback);
};

/**
 * 发放公会红包
 * */
handler.SendUnionGift = function (roleID, callback) {
    logger.fatal("****GM SendUnionGift Begin :", roleID);
    unionManager.SendUnionGift(roleID, callback);
};

/**
 * 领取公会红包
 * */
handler.GetUnionGiftForPlayer = function (roleID, fromID, callback) {
    logger.fatal("****GM GetUnionGiftForPlayer Begin ");
    unionManager.GetUnionGiftForPlayer(roleID, fromID, callback);
};

/**
 * 可领取红包查�?
 * */
handler.UnionList = function (roleID, callback) {
    logger.fatal("****GM UnionList Begin ");
    unionManager.GetUnionGiftSendList(roleID, callback);
};


/**
 * 保存红包信息
 * */
handler.SaveUnionGift = function (roleID, callback) {
    logger.fatal("****GM UnionList Begin ");
    unionManager.SaveUnionGift();
    return callback(null);

};

/**
 * 保存公会其他数据
 * */
handler.SaveUnionData = function (roleID, callback) {
    logger.fatal("****GM SaveUnionGift Begin ");
    unionManager.SaveUnionData();
    return callback(null);

};

/**
 * 登陆时�?�客户端请求  是否可发红包
 * */

handler.SendUnionGiftChange = function (roleID, callback) {
    unionManager.SendUnionGiftChange(roleID, null, callback);
};

/**
 * 同步到us 角色的vip等级
 * */
handler.UpdateRoleVIP = function (roleID, vip, callback) {
    unionManager.UpdateRoleVIP(roleID, vip, callback);
};

/**
 * 登陆时�?�客户端请求  是否可发红包
 * */

handler.GetUnionLianYu = function (roleID, callback) {
    unionManager.GetUnionLianYu(roleID, callback);
};

handler.CanGetDailyAward = function (roleID, callback) {
    unionManager.canGetDaily(roleID, callback);
};

// GM
handler.gmCreateAllAnimals = function (roleID, callback) {
    unionManager.onCreateAllAnimal(roleID, callback);
};

handler.gmCreateUnionFight = function (roleID, callback) {
    unionManager.gmCreateFight(callback);
};

handler.gmCreateFightEnd = function (roleID, callback) {
    unionManager.gmEndFight(callback);
};