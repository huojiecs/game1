/**
 * Created by chen on 15-7-1.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var playerManager = require('../../../cs/player/playerManager');

module.exports = function() {
    return new Handler();
};

var Handler = function() {
};

var handler = Handler.prototype;

/** 修改求爱宣言 */
handler.UpdateXuanYan = function(msg, session, next) {
    var roleID = session.get('roleID');
    var xuanyan = msg.xuanyan;
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    if(xuanyan.length> defaultValues.marry_xuanyan_length){
        return next(null, {'result': errorCodes.MARRY_XUANYAN_BEYOND_LENGTH});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.UpdateXuanYan(xuanyan, function(err, res) {
        if (!!err) {
            logger.error('error hadnler UpdateXuanYan , %s', roleID,
                utils.getErrorMessage(err));
        }
        return next(null, {
            result: res
        });
    });
}

/** 获取好友中求婚对象列表 */
handler.GetToMarryFriendList = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    player.toMarryManager.GetToMarryFriendList(next);
};

/** 获取公会中求婚对象列表 */
handler.GetToMarryUnionList = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    player.toMarryManager.GetToMarryUnionList(next);

};

/** 获取主城中求婚对象列表 */
handler.GetToMarryRoundList = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.GetToMarryRoundList(next);
};


/** 获取求婚信物列表 */
handler.GetXinWuList = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    player.toMarryManager.GetXinWuList(next);
};

/** 同意离婚 */
handler.AgreeDivorce = function(msg, session, next) {
    var roleID = session.get('roleID');
    var fromDivorceID = +msg.fromDivorceID;
    if (typeof roleID !== 'number' || typeof fromDivorceID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.AgreeDivorce(fromDivorceID, next);
};

/** 拒绝离婚 */
handler.ToRefuseDivorce = function(msg, session, next) {
    var roleID = session.get('roleID');
    var fromDivorceID = +msg.fromDivorceID;
    if (typeof roleID !== 'number' || typeof fromDivorceID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.RefuseDivorce(fromDivorceID, next);
};

/** 发出求婚请求*/
handler.ToMarry = function(msg, session, next) {
    var roleID = session.get('roleID');
    var toMarryID = +msg.toMarryID;
    var xinWuID = +msg.xinWuID;
    if (typeof roleID !== 'number' || !toMarryID || !xinWuID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    player.toMarryManager.ToMarry(toMarryID, xinWuID, function(err, res){
        if (!!err) {
            logger.error('error hadnler ToMarry , %s', roleID,
                utils.getErrorMessage(err));
        }
        return next(null, {
            result: res
        });
    });
};

/** 同意求婚 */
handler.Agree = function(msg, session, next) {
    var roleID = session.get('roleID');
    var fromMarryID = +msg.fromMarryID; //求婚人ID
    var marryID = +msg.marryID; // 每人收到信件独立ID
    if (typeof roleID !== 'number' || typeof fromMarryID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.Agree(fromMarryID, marryID, function(err, res){
        if (!!err) {
            logger.error('error hadnler Agree Marry , %s', roleID,
                utils.getErrorMessage(err));
        }
        return next(null, {
            result: res
        });
    });
};

/** 拒绝求婚 */
handler.Refuse = function(msg, session, next) {
    var roleID = session.get('roleID');
    var fromMarryID = +msg.fromMarryID; //求婚人ID
    var marryID = +msg.marryID; // 每人收到信件独立ID
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.Refuse(fromMarryID, marryID, function(err, res){
        if (!!err) {
            logger.error('error hadnler Refuse Marry , %s', roleID,
                utils.getErrorMessage(err));
        }
        return next(null, {
            result: res
        });
    });
};

/** 获取求婚信 和 拒绝信*/
handler.GetMarryMassage = function(msg, session, next) {
    var roleID = session.get('roleID');
    var type = msg.type;
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.GetMarryMassage(type, next);
};

/** 离婚请求 */
handler.Divorce = function(msg, session, next) {
    var roleID = session.get('roleID');
    var divorceID = +msg.divorceID; //求婚人ID
    var type = +msg.type; //离婚方式 1 强制离婚  2 协议离婚
    if (typeof roleID !== 'number' || !divorceID || !type) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.Divorce(divorceID, type, function(err, res){
        if (!!err) {
            logger.error('error hadnler Refuse Marry , %s', roleID,
                utils.getErrorMessage(err));
        }
        return next(null, {
            result: res
        });
    });
};


/** 获取婚姻 姻缘排行榜 */
handler.GetMarryChart = function(msg, session, next) {
    var roleID = session.get('roleID');

    if (typeof roleID !== 'number' ) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }
    player.toMarryManager.GetMarryChart(next);


};
