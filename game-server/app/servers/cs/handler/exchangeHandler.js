/**兑换Handler*/

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var playerManager = require('../../../cs/player/playerManager');
var globalFunction = require('../../../tools/globalFunction');
var operateControl = require('../../../cs/operateActivity/operateControl');
var defaultValues = require('../../../tools/defaultValues');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var eMisType = gameConst.eMisType;

module.exports = function(){
    return new Handler();
};

var Handler = function(){
};

var handler = Handler.prototype;

/**
 * 返回给客户端活动兑换信息
 *       {
 *               "result": 0,    //错误码 0:OK
 *               "BigInfo": {
 *                   "AcitvtyInfo": [
 *                       {
 *                           "activityName": "",
 *                           "activityID": "",
 *                           "activityTime": "",
 *                           "activityTitle": "",
 *                           "exchangableNum": "",
 *                           "exchangeList": [{ }, { }],
 *                           "shenyuNums": [ ]
 *                       },
 *                       ...
 *                   ],
 *               }
 *           }
 * @param msg: 无参数
 * @param session
 * @param next
 * @constructor
 */
handler.ActivityExchangeInfo = function(msg, session, next){
    //获取玩家
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

    //计算 返回值
    var acitvtyInfo = [];
    var exchangeManager = player.GetExchangeManager();
    var exchangeInfo = exchangeManager.GetAllActiveExchangesInfo();
    for(var activityID in exchangeInfo){
        var activity = exchangeInfo[activityID];
        var exchangeTemplates =activity.exchangeTemplates;

        //AcitvtyInfo
        var info = {};
        info.activityName = activity.activityName;
        info.activityID   = +activityID;
        info.activityTime = exchangeManager.GetLeftTime(activityID);
        info.activityTitle = activity.activityTitle;
        info.exchangableNum = exchangeManager.GetExchangableNum(activityID);
        info.exchangeList = [];
        info.shenyuNum = [];
        for(var exchangeID in exchangeTemplates){
            var template = exchangeTemplates[exchangeID];
            info.exchangeList.push(template);
            info.shenyuNum.push(exchangeManager.GetShengyuNum(exchangeID));
        }
        acitvtyInfo.push(info);
    }

    //返回
    return next(null, {
        'result': 0,
        'AcitvtyInfo': acitvtyInfo
    });
};

/**
 *  兑换一次
 *       {
 *                   "result": 0,    //错误码 0:OK, 8: NoItem, 1: ParameterWrong
 *                    items:{ids:[], nums:[]}
 *       }
 * @param msg: {exchangeID:1001}
 * @param session
 * @param next
 * @constructor
 */
handler.ActivityExchange = function(msg, session, next){
    //获取玩家
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

    //兑换
    var exchangeID = msg.exchangeID;
    var res = player.GetExchangeManager().Exchange(exchangeID);
    if(!!res.errorCode){
        return next(null, {result:res.errorCode});
    }

    //调整属于次数
    player.GetExchangeManager().DecreaseShengyuNum(exchangeID, 1);

    //返回结果
    return next(null, {
        'result': 0,
        'items': res
    });
};