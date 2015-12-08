/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-23
 * Time: 下午8:07
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var friendManager = require('../../../fs/friend/friendManager');
var playerManager = require('../../../fs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var _ = require("underscore");

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.RequireFriendList = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {result: errorCodes.NoRole});
    }

    friendManager.RequireFriendList(roleID, function (err, friendList) {

        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, {
            result: errorCodes.OK,
            friendList: friendList
        });
    });
};

handler.RequireBlessList = function (msg, session, next) {
    var roleID = session.get('roleID');

    if (null == roleID) {
        return next(null, {result: errorCodes.NoRole});
    }

    friendManager.RequireBlessList(roleID, function (err, players) {
        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, {
            result: errorCodes.OK,
            'players': players
        });
    });
};

handler.Bless = function (msg, session, next) {
    var roleID = session.get('roleID');

    if (!roleID) {
        return next(null, {result: errorCodes.NoRole});
    }

    var friendID = msg.friendID;
    if (!friendID) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    friendManager.Bless(roleID, friendID, function (err, result) {
        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }
        result.result = errorCodes.OK;
        return next(null, result);
    });
};

handler.RequireBlessing = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {result: errorCodes.NoRole});
    }

    friendManager.RequireBlessing(roleID, function (err, result) {
        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }
        return next(null, result);
    });
};

/**
 * 获取请求祝福的状态
 * @param {object} msg 客户端消息 {}
 * @param {object} session  客户端会话
 * @param {function} next 请求回调
 * */
handler.GetRequireBlessState = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {result: errorCodes.NoRole});
    }


    return next(null, {result: 0, state: 1});
};

/**
 * 设置请求祝福的状态
 * @param {object} msg 客户端消息 {}
 * @param {object} session  客户端会话
 * @param {function} next 请求回调
 * */
handler.SetRequireBlessState = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {result: errorCodes.NoRole});
    }

    return next(null, {result: 0});
};

/***
 * @brief: 好友申请
 * ---------------
 *
 * @param {object} msg 客户端消息 {}
 * @param {object} session  客户端会话
 * @param {function} next 请求回调
 * */
handler.ApplyFriend = function (msg, session, next) {
    var roleID = session.get('roleID');
    var friendID = msg.friendID;

    if (!roleID || !friendID) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (defaultValues.isNoLocalFriend) {
        return next(null, {
            'result': errorCodes.FRIEND_ZHANSHI_PINGBI,
            "message": "该功能暂未开放"
        });
    }

    var player = playerManager.GetPlayer(roleID);

    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }

    friendManager.applyLocalFriend(roleID, friendID, function (err, res) {
        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, {
            result: errorCodes.OK
        });
    });
};

/***
 * @brief: 回复好友申请
 * ---------------
 *
 * @param {object} msg 客户端消息 {}
 * @param {object} session  客户端会话
 * @param {function} next 请求回调
 * */
handler.ReplyApplyFriend = function (msg, session, next) {
    var roleID = session.get('roleID');
    var friendID = msg.friendID;
    var agreeType = msg.agreeType;

    if (!roleID || agreeType < 0 || agreeType > 3) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (defaultValues.isNoLocalFriend) {
        return next(null, {
            'result': errorCodes.FRIEND_ZHANSHI_PINGBI,
            "message": "该功能暂未开放"
        });
    }

    if (agreeType !== 2 && !friendID) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    var player = playerManager.GetPlayer(roleID);

    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }

    friendManager.replyApplyLocalFriend(roleID, friendID || 0, agreeType, function (err, res) {
        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, {
            result: errorCodes.OK
        });
    });
};

/***
 * @brief: 删除好友
 * ---------------
 *
 * @param {object} msg 客户端消息 {}
 * @param {object} session  客户端会话
 * @param {function} next 请求回调
 * */
handler.RemoveFriend = function (msg, session, next) {
    var roleID = session.get('roleID');
    var friendID = msg.friendID;

    if (!roleID || !friendID) {
        return next(null, {
            'result': errorCodes.ParameterWrong
        });
    }

    if (defaultValues.isNoLocalFriend) {
        return next(null, {
            'result': errorCodes.FRIEND_ZHANSHI_PINGBI,
            "message": "该功能暂未开放"
        });
    }

    var player = playerManager.GetPlayer(roleID);

    if (!player) {
        return next(null, {result: errorCodes.NoRole});
    }

    friendManager.requestRemoveLocalFriend(roleID, friendID, function (err, res) {
        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        return next(null, {
            result: errorCodes.OK
        });
    });
};

/***
 * @brief: 获取好友申请列表
 * ----------------------
 *
 * @param {object} msg 客户端消息 {}
 * @param {object} session  客户端会话
 * @param {function} next 请求回调
 * */
handler.RequireFriendApplyList = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {result: errorCodes.NoRole});
    }

    if (defaultValues.isNoLocalFriend) {
        return next(null, {
            'result': errorCodes.FRIEND_ZHANSHI_PINGBI,
            "message": "该功能暂未开放"
        });
    }

    friendManager.getLocalFriendApplyList(roleID, function (err, friendApplyList) {

        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }
        return next(null, {
            result: errorCodes.OK,
            friendApplyList: friendApplyList
        });
    });
};