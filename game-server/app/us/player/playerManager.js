/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午12:03
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Player = require('./player');
var gameConst = require('../../tools/constValue');
var unionManager = require('../union/unionManager');
var ePlayerInfo = gameConst.ePlayerInfo;

var Handler = module.exports;
Handler.Init = function () {
    this.playerList = {};
};

Handler.GetPlayer = function (roleID) {
    return this.playerList[roleID];
};

Handler.GetAllPlayer = function(){
    return this.playerList;
}

Handler.AddPlayer = function (playerInfo, csID ,uid, sid) {
    var player = new Player(playerInfo, csID, uid, sid);
    var roleID = playerInfo[ePlayerInfo.ROLEID];
    this.playerList[roleID] = player;
    unionManager.SyncUnionLevel(roleID);
    //主动给客户端发送是否可发红包
    unionManager.SendUnionGiftChange(roleID, null, function (err,res) {
        if (!!err) {
            logger.error('SendUnionGiftChange callback error: %s', utils.getErrorMessage(err));
        }else{
            logger.fatal('SendUnionGiftChange callback info: %j', res);
        }
    });
    unionManager.SendUnionFightDuke(roleID);
};

Handler.DeletePlayer = function (roleID) {
    delete this.playerList[roleID];
};

/**
 * 修改玩家的csID
 *
 * @param {Number} roleID 玩家id
 * @param {Number} csServerID 玩家csID
 * */
Handler.SetPlayerCs = function (roleID, csServerID) {
    var player = this.playerList[roleID];
    if (null != player) {
        player.SetPlayerCs(csServerID);
    }
};