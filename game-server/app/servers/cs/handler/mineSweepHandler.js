/**
 * Created by Administrator on 14-7-30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var playerManager = require('../../../cs/player/playerManager');
module.exports = function () {
    return new Handler();
};


var Handler = function () {
};

var handler = Handler.prototype;

handler.getMineSweepData = function (msg, session, next) {//根据关卡ID 获取魔域关卡数据
//    msg = {ID:}
    var roleID = session.get('roleID');
    var ID = msg.ID;
    if (null == roleID || null == ID) {
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
    var result = player.GetMineManager().getMineSweepData(ID);
    return next(null, {
        'result': result
    });
};
/**一键完成*/
handler.oneKeyComplete = function (msg, session, next) {
    var roleID = session.get('roleID');
    var layerID = msg.layerID;
    if (null == roleID || null == layerID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        })
    }

    var result = player.GetMineManager().oneKeyComplete(layerID);
    return next(null, {
        'result': result
    });
};

/**一键通关*/
handler.AllKeyComplete = function (msg, session, next) {
    var roleID = session.get('roleID');
    var layerID = msg.layerID;
    if (null == roleID || null == layerID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        })
    }

    var result = player.GetMineManager().AllKeyComplete(layerID);
    return next(null, {
        'result': result
    });
};

handler.setMineSweepChangeState = function (msg, session, next) {//更改格子状态
//    msg = { index:}
    var roleID = session.get('roleID');
    var index = msg.index;
    if (null == roleID || null == index) {
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

    var result = player.GetMineManager().mineSweepRequestServerChangeState(index);

    if (!result) {
        result = {
            result: errorCodes.SystemWrong
        }
    }
    return next(null, result);
};

/*请求服务器操作
 type 0:重置次数  1：领取小关礼包 2：领取大关礼包 3：清除CD 4：补满HP  5：进入下一关*/
handler.requestServerDone = function (msg, session, next) {//
    var roleID = session.get('roleID');
    var type = msg.type;
    if (null == roleID || null == type) {
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
    var result = player.GetMineManager().mineSweepRequestServerDone(type);
    return next(null, {
        'result': result
    });
};