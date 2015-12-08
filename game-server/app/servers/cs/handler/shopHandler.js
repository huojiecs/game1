/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-21
 * Time: 下午5:17
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

handler.GetShopList = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
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
    player.GetShopManager().GetShopList( function (resultMsg) {
        if (typeof  resultMsg == 'number') {
            return next(null, {
                'result': resultMsg
            });
        }
        else {
            return next(null, resultMsg);
        }
    });
};

handler.BuyGoods = function (msg, session, next) {
    var roleID = session.get('roleID');
    var goodsID = msg.goodsID;
    if (null == roleID || goodsID == null) {
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
    player.GetShopManager().BuyGoods( goodsID, function (itemList) {
        if (typeof  itemList == 'number') {
            return next(null, {
                'result': itemList
            });
        }
        else {
            return next(null, itemList);
        }
    });
};

handler.BuyPhysical = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
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
    var res = player.GetPhysicalManager().BuyPhysical();
    return next(null, {
        'result': res
    });
};

handler.FriendPhysical = function (msg, session, next) {      //好友间的赠送和领取体力
    var roleID = session.get('roleID');
    var friendID = msg.friendID;    //好友ID
    var type = msg.type;             //赠送还是领取的类型
    if (null == roleID) {
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
    var res = player.GetPhysicalManager().FriendPhysical(friendID, type);
    return next(null, {
        'result': res
    });
};
