/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-4
 * Time: 下午1:34
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Buff = require('./buff');
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var eBuffOpetype = gameConst.eBuffOpetype;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.buffList = [];
};

var handler = Handler.prototype;

handler.AddBuff = function (player, userPlayer, buffID, BuffTemplate) {
    var newBuff = new Buff(BuffTemplate);
    this.buffList[buffID] = newBuff;
    newBuff.BeginAction(player, userPlayer);
    this.SendBuffMsg(player, buffID, eBuffOpetype.Add);
};

handler.UpdateBuff = function (player, nowSec) {
    for (var index in this.buffList) {
        var temp = this.buffList[index];
        temp.StillAction(player, nowSec);
        var isEnd = temp.EndAction(player, nowSec);
        if (isEnd) {
            delete this.buffList[index];
            this.SendBuffMsg(player, index, eBuffOpetype.Del);
        }
    }
};

handler.DeleteBuff = function (player, buffID) {
    if (buffID >= 0) {
        var temp = this.buffList[buffID];
        if (null == temp) {
            return;
        }
        if (true == temp.DelAction(player)) {
            delete this.buffList[buffID];
            this.SendBuffMsg(player, buffID, eBuffOpetype.Del);
        }
    }
};

handler.SendBuffMsg = function (player, buffID, buffType) {
    if (null == player || null == buffID || null == buffType) {
        return;
    }
    var route = 'ServerBuffUpdate';
    var buffMsg = {
        buffList: []
    };
    var temp = {};
    temp['id'] = parseInt(buffID);
    temp['type'] = buffType;
    buffMsg.buffList.push(temp);
    //logger.info('SendBuffMsg  buffMsg = %j', buffMsg);
    player.SendMessage(route, buffMsg);
};

handler.GetBuffList = function () {
    var self = this;
    var buffIDList = [];
    for (var index in self.buffList) {
        if (!!self.buffList[index]) {
            if (!!self.buffList[index]['BuffTemplate']) {
                if (!!self.buffList[index]['BuffTemplate']['attID']) {
                    var buffID = self.buffList[index]['BuffTemplate']['attID'];
                    buffIDList.push(+buffID);
                }
            }
        }
    }
    return buffIDList;
};
