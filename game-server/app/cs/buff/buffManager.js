/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-4
 * Time: 下午1:11
 * To change this template use File | Settings | File Templates.
 */
var BuffList = require('./buffList');
var playerManager = require('../player/playerManager');
var templateConst = require('../../../template/templateConst');
var templateManager = require('../../tools/templateManager');
var tBuff = templateConst.tBuff;

var Handler = module.exports;

Handler.Init = function () {
    this.CharacterList = {};
};

Handler.AddBuff = function (player, userPlayer, buffID) {
    if (player == null) {
        return;
    }

    if (userPlayer == null) {
        return;
    }

    var temp = this.CharacterList[player.id];

    if (temp == null) {
        temp = new BuffList();
        this.CharacterList[player.id] = temp;
    }

    var tempUser = this.CharacterList[userPlayer.id];
    if (null == tempUser) {
        tempUser = new BuffList();
        this.CharacterList[userPlayer.id] = tempUser;
    }

    var BuffTemplate = templateManager.GetTemplateByID('BuffTemplate', buffID);
    if (null == BuffTemplate) {
        return;
    }

    if (BuffTemplate[tBuff.playerType] == 0) {
        temp.AddBuff(player, userPlayer, buffID, BuffTemplate);
    }
    else {
        tempUser.AddBuff(userPlayer, userPlayer, buffID, BuffTemplate);
    }
};

Handler.DeleteBuff = function (player, buffID) {
    var temp = this.CharacterList[player.id];
    if (temp == null) {
        temp = new BuffList();
        this.CharacterList[player.id] = temp;
        return;
    }
    temp.DeleteBuff(player, buffID);
};

Handler.AddBuffByDB = function (roleID, buffList) {

};

Handler.SaveBuff = function (roleID) {

};

Handler.RemoveBuff = function (roleID, buffID) {

};

Handler.RemoveAllBuff = function (roleID) {
    delete this.CharacterList[roleID];
};

Handler.UpdateBuff = function (nowTime) {
    var nowSec = nowTime.getTime();
    for (var index in this.CharacterList) {
        var player = playerManager.GetPlayer(index);
        this.CharacterList[index].UpdateBuff(player, nowSec);
    }
};

Handler.GetBuffList = function (player) {
    var temp = this.CharacterList[player.id];
    if (temp == null) {
        return [];
    }
    var buffList = temp.GetBuffList();
    return buffList || [];
};