/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-29
 * Time: 上午11:54
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var itemLogic = require('../../../cs/item/itemLogic');
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.EquipItem = function (msg, session, next) {
    var itemGuid = msg.itemGuid;
    var roleID = session.get('roleID');
    if (null == roleID || null == itemGuid) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = itemLogic.EquipOn(player, itemGuid, true);
    return next(null, {
        result: result,
        itemGuid: itemGuid
    });
};

handler.SellItem = function (msg, session, next) {
    var itemGuid = msg.itemGuid;
    var roleID = session.get('roleID');
    if (null == roleID || null == itemGuid) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = itemLogic.SellItem(player, itemGuid);
    return next(null, {
        result: result,
        itemGuid: itemGuid
    });
};

handler.InlayStar = function (msg, session, next) {
    var itemGuid = msg.itemGuid;
    var starID = msg.starID;
    var starIndex = msg.starIndex;
    var roleID = session.get('roleID');
    if (null == roleID || null == itemGuid || starID == null || starIndex == null) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = itemLogic.InlayStar(player, itemGuid, starID, starIndex);
    return next(null, {
        'result': result
    });
};

handler.RemoveStar = function (msg, session, next) {
    var itemGuid = msg.itemGuid;
    var starIndex = msg.starIndex;
    var roleID = session.get('roleID');
    if (null == roleID || null == itemGuid || starIndex == null) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = itemLogic.RemoveStar(player, itemGuid, starIndex);
    return next(null, {
        result: result
    });
};

handler.SynthesizeStar = function (msg, session, next) {
    var synNum = msg.synNum;
    var synID = msg.synID;
    var roleID = session.get('roleID');
    if (null == roleID || null == synNum || synID == null || synNum <= 0) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = itemLogic.SynthesizeStar(player, synID, synNum);
    if (typeof  result == 'number') {
        return next(null, {
            'result': result
        });
    }
    else {
        return next(null, {
            'result': 0,
            itemList: result
        });
    }
};

handler.SynthesizeEquip = function (msg, session, next) {
    var synID = msg.synID;
    var roleID = session.get('roleID');
    if (null == roleID || null == synID) {
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
    var result = itemLogic.SynthesizeEquip(player, synID);
    if (null == result || undefined == result) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (typeof result == 'number') {
        return next(null, {
            'result': result
        });
    }
    else {
        var info = [];
        info.push(result.itemData);
        return next(null, {
            'result': 0,
            equipInfo: info
        });
    }
};

handler.Intensify = function (msg, session, next) {
    var itemGuid = msg.itemGuid;
    var roleID = session.get('roleID');
    if (null == roleID || null == itemGuid) {
        return next(null, {
            'result': 1
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = itemLogic.Intensify(player, itemGuid);
    return next(null, {
        'result': result
    });
};

handler.Resolve = function (msg, session, next) {
    var itemGuid = msg.itemGuid;
    var roleID = session.get('roleID');
    if (itemGuid == null || roleID == null) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (player == null) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    var result = itemLogic.Resolve(player, itemGuid);
    return next(null, {
        'result': result['result'],
        'itemIDList': result['itemIDList'],
        'itemNumList': result['itemNumList'],
        'itemGuid': itemGuid
    });
};

handler.activate = function (msg, session, next) {
    var attID = msg.attID;
    //activate:0取消激活  1:激活
    var activate = msg.activate;
    var roleID = session.get('roleID');

    if (null == attID || null == roleID || null == activate) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (activate < 0 || activate > 1) {
        return next(null, {
            result: errorCodes.ParameterWrong
        })
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var result = itemLogic.Activate(player, attID, activate);
    return next(null, {
        result: result
    });
};

/**
 * 激活时装
 * @param {object} msg 协议消息{
 *                                   attID：时装id
 *                                   activate：0取消激活  1:激活
 *                             }
 * @param {object} session 玩家session 会话
 * @param {function} next 请求回调
 * @api public
 * */
handler.ActivateFashionSuit = function (msg, session, next) {
    var attID = msg.attID;
    //activate:0取消激活  1:激活
    var activate = msg.activate;
    var roleID = session.get('roleID');

    if (null == attID || null == roleID || null == activate) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (activate < 0 || activate > 1) {
        return next(null, {
            result: errorCodes.ParameterWrong
        })
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = 0;
    if (activate == 1) {
        result = player.GetRoleFashionManager().Activate(attID);
    } else {
        result = player.GetRoleFashionManager().UnActivate(attID);
    }
    return next(null, {
        result: result
    });
};

/**
 * show 一下 号称
 * @param {object} msg 协议消息{
 *                                   attID：号称id
 *                                   activate：0隐藏  1:使用
 *                             }
 * @param {object} session 玩家session 会话
 * @param {function} next 请求回调
 * @api public
 * */
handler.ShowTitle = function (msg, session, next) {
    var attID = msg.titleID;
    //activate:0隐藏  1:使用
    var activate = msg.type;
    var roleID = session.get('roleID');

    if (null == attID || null == roleID || null == activate) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if (activate < 0 || activate > 1) {
        return next(null, {
            result: errorCodes.ParameterWrong
        })
    }

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }
    var result = 0;
    if (activate == 1) {
        result = player.GetRoleTitleManager().Activate(attID);
    } else {
        result = player.GetRoleTitleManager().UnActivate(attID);
    }
    return next(null, {
        result: result,
        titleID: attID,
        type: activate
    });
};

/**
 * Brief: 物品兑换
 * --------------
 * @api public
 *
 * @param {object} msg 协议消息{
 *                                   type: 兑换类型
 *                                   exchangeID：兑换id
 *                             }
 * @param {object} session 玩家session 会话
 * @param {function} next 请求回调
 * */
handler.exchangeGood = function (msg, session, next) {
    var roleID = session.get('roleID');
    var exchangeID = msg.exchangeID;
    var type = msg.type;

    if (null == roleID || null == exchangeID || null == type) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    /** 物品兑换 */
    player.GetRoleExchangeManager().exchangeGood(type, exchangeID, function(err, res) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        res.result = errorCodes.OK;
        return next(null, res);
    });
};

/**
 * Brief: 获取兑换 记录
 * --------------
 * @api public
 *
 * @param {object} msg 协议消息{
 *                                   type: 兑换类型
 *                             }
 * @param {object} session 玩家session 会话
 * @param {function} next 请求回调
 * */
handler.requestLeftList = function (msg, session, next) {
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
            result: errorCodes.NoRole
        });
    }

    /**  获取兑换 记录 */
    player.GetRoleExchangeManager().requestLeftList(type, function(err, res) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        res.result = errorCodes.OK;
        return next(null, res);
    });
};

//获取玩家限时时装的时间
handler.GetFashionTime = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    player.roleFashionManager.GetFashionTime( function(err, res) {
        var result = errorCodes.toClientCode(err);

        if (!!result) {
            return next(null, {
                result: result
            });
        }
        return next(null, res);
    });
}