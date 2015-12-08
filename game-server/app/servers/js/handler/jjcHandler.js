/**
 * The file jjcHandler.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/14 17:58:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var async = require('async');
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var playerManager = require('../../../js/player/playerManager');
var jjcManager = require('../../../js/jjc/jjcManager');
var csSql = require('../../../tools/mysql/csSql');
var errorCodes = require('../../../tools/errorCodes');
var defaultValue = require('../../../tools/defaultValues');
var jjcRewardTMgr = require('../../../tools/template/jjcRewardTMgr');
var _ = require('underscore');
var Q = require('q');

var eJJCInfo = gameConst.eJJCInfo;
var eRoundType = gameConst.eRoundType;
var eRankingRewardType = gameConst.eRankingRewardType;

/**
 * js 服务器对外（客户端接口）
 * */
module.exports = function () {
    return new Handler();
};


var Handler = function () {
};

var handler = Handler.prototype;

/**
 * 获取玩家jjc 数据
 * @param {object} msg 请求消息
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object} {
result: 0成功
winNum:胜利场次
winRate:胜率
credits:积分
maxStreaking:历史最高连胜
streaking:当前连胜
jjcCoin:竞技币数量
ranking:单服榜排名
lastRanking:单服榜排名_上届
friendRanking:好友榜排名
acrossRanking：跨服榜排名
lastAccrossRanking:跨服榜排名_上届
cutTime: '',
acrossCutTime:跨服榜赛季截止时间
RRStats:单服榜奖励领取状态（0已领取，1不可领取，3可领取）
ARRStats:跨服榜奖励领取状态（已领取，不可领取，可领取）
DRStatus:每日奖励领取状态（已领取，不可领取，可领取）
jjcStartTime:竞技开启时间
isStart:竞技开始状态 (0 为开始 1 已开始)
reTimes：剩余次数

  }
 * @api public
 * */
handler.GetRoleJjcInfo = function (msg, session, next) {

    var roleID = session.get('roleID');
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {result: errorCodes.NoRole});
    }

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {result: errorCodes.NoRole});
    }

    /** 检测玩家是否开启该功能*/
    if (!roleJJCManager.isOpenJJC()) {
        return next(null, {result: errorCodes.JJC_NO_OPEN});
    }

    /**获取本服排行榜*/
    roleJJCManager.GetShowMainMessage(function (err, data) {
        if (!!err) {
            /** 获取玩家信息错误*/
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        /** 正确返回竞技场信息 */
        data['result'] = errorCodes.OK;
        return next(null, data);
    });
};

/**
 * 请求jjc battle 匹配
 * @param {object} msg 请求消息{
 *                                   type
 *                             }
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object}
 * @api public
 * */
handler.requireBattle = function (msg, session, next) {
    var roleID = session.get('roleID');
    var type = msg.type;

    if (null == type || type < eRoundType.Practice || type > eRoundType.Max) {
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

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    /** 检测玩家是否开启该功能*/
    if (!roleJJCManager.isOpenJJC()) {
        return next(null, {result: errorCodes.JJC_NO_OPEN});
    }

    var result = 0;

    if (type == eRoundType.Practice) {
        result = roleJJCManager.requestPracticeBattle();
    } else if (type == eRoundType.Battle) {
        result = roleJJCManager.requestBattle();
    } else {
        result = errorCodes.ParameterNull
    }

    return next(null, {
        result: result,
        leftTime: defaultValue.JJC_RefreshTimeOut / 1000,
        type: type
    });
};

/**
 * 请求jjc 领取jjc 奖励
 * @param {object} msg 请求消息{
 *                                  type
 *                             }
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object}
 * @api public
 * */
handler.GetRankingReward = function (msg, session, next) {
    var roleID = session.get('roleID');
    var type = msg.type;

    if (null == type || type < eRankingRewardType.LOCAL || type > eRankingRewardType.DAY) {
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

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    /** 检测玩家是否开启该功能*/
    if (!roleJJCManager.isOpenJJC()) {
        return next(null, {result: errorCodes.JJC_NO_OPEN});
    }

    if (type == eRankingRewardType.LOCAL) {
        /** 发放单区榜奖励*/
        roleJJCManager.GetRankingReward(function (err, res) {
            if (!!err) {
                return next(null, {result: errorCodes.toClientCode(err)});
            }

            res['result'] = errorCodes.OK;
            return next(null, res);
        });
    } else if (type == eRankingRewardType.ACROSS) {

        return next(null, {result: errorCodes.JJC_UN_START});
    } else if (type == eRankingRewardType.DAY) {
        /** 领取每日奖励 */
        roleJJCManager.GetDayReward(function (err, res) {
            if (!!err) {
                return next(null, {result: errorCodes.toClientCode(err)});
            }

            res['result'] = errorCodes.OK;
            return next(null, res);
        });
    } else {
        return next(null, {result: errorCodes.JJC_UN_START});
    }
};

/**
 * 请求jjc 获取前三名玩家展示
 * @param {object} msg 请求消息{
 *                             }
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object}
 * @api public
 * */
handler.GetThreeShow = function (msg, session, next) {
    var roleID = session.get('roleID');

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    /** 检测玩家是否开启该功能*/
    if (!roleJJCManager.isOpenJJC()) {
        return next(null, {result: errorCodes.JJC_NO_OPEN});
    }

    /** 获取前三名 玩家信息*/
    roleJJCManager.GetThreeShow(function (err, res) {
        if (!!err) {
            next(null, {result: errorCodes.toClientCode(err)});
        }

        res['result'] = errorCodes.OK;
        return next(null, {result: res});
    });

};

/**
 * 展示购买战斗次数 信息
 * @param {object} msg 请求消息{
 *                             }
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object}
 * @api public
 * */
handler.getBugTimesInfo = function (msg, session, next) {
    var roleID = session.get('roleID');

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    /** 检测玩家是否开启该功能*/
    if (!roleJJCManager.isOpenJJC()) {
        return next(null, {result: errorCodes.JJC_NO_OPEN});
    }

    /** 获取前三名 玩家信息*/
    roleJJCManager.getBugTimesInfo(function (err, res) {
        if (!!err) {
            next(null, {result: errorCodes.toClientCode(err)});
        }

        res['result'] = errorCodes.OK;
        return next(null, {result: res});
    });

};

/**
 * 购买战斗次数
 * @param {object} msg 请求消息{
 *                             }
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object}
 * @api public
 * */
handler.getBugTimes = function (msg, session, next) {
    var roleID = session.get('roleID');

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    /** 检测玩家是否开启该功能*/
    if (!roleJJCManager.isOpenJJC()) {
        return next(null, {result: errorCodes.JJC_NO_OPEN});
    }

    /** 获取前三名 玩家信息*/
    roleJJCManager.getBugTimes(function (err, res) {
        if (!!err) {
            next(null, {result: errorCodes.toClientCode(err)});
        }

        res['result'] = errorCodes.OK;
        return next(null, {result: res});
    });

};

/**
 * 打断战斗匹配请求
 *
 * @param {object} msg 请求消息{
 *                             }
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object}
 * @api public
 * */
handler.breakRequireBattle = function (msg, session, next) {
    var roleID = session.get('roleID');
    var type = msg.type;

    if (null == type || type < eRankingRewardType.LOCAL || type > eRankingRewardType.DAY) {
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

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    /** 检测玩家是否开启该功能*/
    if (!roleJJCManager.isOpenJJC()) {
        return next(null, {result: errorCodes.JJC_NO_OPEN});
    }

    /** 获取前三名 玩家信息*/
    roleJJCManager.breakRequireBattle(type, function (err, res) {
        if (!!err) {
            return next(null, {result: errorCodes.toClientCode(err)});
        }

        res['result'] = errorCodes.OK;
        return next(null, {result: res});
    });

};


/**
 * @当前竞技场 策划数据
 *
 * @param {object} msg 请求消息{
 *                             }
 * @param {object} session 会话对象
 * @param {function} next 客户端回调函数
 * @return {object}
 * @api public
 * */
handler.GetSyncPVPRewardTemplate = function (msg, session, next) {
    var roleID = session.get('roleID');

    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var roleJJCManager = player.GetRoleJJCManager();
    if (null == roleJJCManager) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var temps = jjcRewardTMgr.GetTempsByType(utils.getMonthOfYear2(new Date()));

    return  next(null, {result: errorCodes.OK, rankRewardData: temps});
};