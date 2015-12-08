/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-12-12
 * Time: 下午6:18
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var messageService = require('../../tools/messageService');

module.exports = function (playerInfo, csID, sid, uid) {
    return new Handler(playerInfo, csID, sid, uid);
};

var Handler = function (playerInfo, csID, uid, sid) {
    this.uid = uid;
    this.sid = sid;
    this.playerInfo = playerInfo;
    this.csID = csID;
};

var handler = Handler.prototype;

handler.GetPlayerInfo = function (index) {
    return this.playerInfo[index];
};

handler.SetPlayerInfo = function (index, value) {
    this.playerInfo[index] = value;
};

handler.GetPlayerCs = function () {
    return this.csID;
};

handler.SetPlayerCs = function (value) {
    this.csID = value;
};

handler.SendMessage = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.uid, sid: this.sid}, route, msg);
};

handler.AddItem = function (roleID, csSeverID, itemID, itemNum) {
    if (null == roleID || null == csSeverID || null == itemID || null == itemNum) {
        logger.warn('us player addItem roleID=%j,csServerID=%j,itemID=%j,itemNum=%j',
            roleID, csSeverID, itemID, itemNum);
        return false;
    }
    pomelo.app.rpc.cs.csRemote.AddItem(null, csSeverID, roleID, itemID, itemNum,function (res) {
        if (res.result != 0) {
            logger.error('union addItem err:\n%j', result);
        }
    });
};

// 购买商品的消耗
handler.ConsumeGoods = function (roleID, csSeverID, goods, callBack){
    if (null == roleID || null == csSeverID || null == goods) {
        return;
    }

    var asset1 = {
        tempID: goods['consumeID1'],
        value: goods['consumeNum1']
    }

    var asset2 = {
        tempID: goods['consumeID2'],
        value: goods['consumeNum2']
    }

    var assets = [];
    assets.push(asset1,asset2);
    pomelo.app.rpc.cs.csRemote.ConsumeAssets(null,csSeverID, roleID, assets, gameConst.eAssetsChangeReason.Reduce.UnionGoods ,callBack);

}