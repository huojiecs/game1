/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-10
 * Time: 下午3:59
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var globalFunction = require('../../tools/globalFunction');
var errorCodes = require('../../tools/errorCodes');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var utilSql = require('../../tools/mysql/utilSql');
var templateConst = require('../../../template/templateConst');
var csSql = require('../../tools/mysql/csSql');
var tVipTemp = templateConst.tVipTemp;
var tItem = templateConst.tItem;
var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};
var handler = Handler.prototype;

handler.GetCodeSqlStr = function (giftCodeInfo) {  //数据库保存sql
    var strInfo = '(';
    for (var t in giftCodeInfo) {
        if (t < giftCodeInfo.length - 1) {
            if (typeof (giftCodeInfo[t]) == 'string') {
                strInfo += '\'' + giftCodeInfo[t] + '\',';
            } else {
                strInfo += giftCodeInfo[t] + ',';
            }
        } else {
            strInfo += giftCodeInfo[t] + ')';
        }
    }
    var sqlString = utilSql.BuildSqlValues(new Array(giftCodeInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }
    return sqlString;
};

handler.GetGiftCodeInfo = function (giftID) {
    var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (!GiftTemplate || !giftID) {
        return {result: errorCodes.ParameterNull};
    }
    var giftIDList = [];
    var giftNumList = [];
    for (var gift = 0; gift < 10; gift++) {
        var itemID = GiftTemplate['itemID_' + gift];
        var itemNum = GiftTemplate['itemNum_' + gift];
        if (0 != itemID) {
            giftIDList.push(itemID);
            giftNumList.push(itemNum);
        }
    }
    var giftInfo = {
        result: errorCodes.OK,
        giftName: GiftTemplate['description'],
        giftID: giftID,
        giftIDList: giftIDList,
        giftNumList: giftNumList
    }
    return giftInfo;
};

handler.verifyGiftCodeNum = function (roleID, giftID, giftCodeID, callback) {
    var repeat = handler.GetGiftCodeRepeat(giftID);
    if (!repeat) {
        return callback(errorCodes.ParameterNull, repeat);
    }
    if (0 == repeat) {
        return callback(errorCodes.OK, repeat);
    } else {
        csSql.getGiftCodeRepeat(roleID, giftID, function (err, req) {
                                    var req = req[0][0];
                                    var repeatNumSql = handler.GetCodeSqlStr([0, 0, 0, 0]);
                                    if (!!err || !req) {
                                        repeatNumSql = handler.GetCodeSqlStr([0, roleID, giftID, 1]);
                                        csSql.SaveGiftCodeRepeat(roleID, giftID, repeatNumSql, function (err) {
                                            if (!!err) {
                                                logger.error("error when getGiftCodeRepeat %s",
                                                             utils.getErrorMessage(err));
                                            }
                                            return callback(errorCodes.OK, repeat);
                                        });
                                    } else {
                                        if (repeat - req['useNum'] > 0) {
                                            var useNum = +req['useNum'] + 1;
                                            repeatNumSql = handler.GetCodeSqlStr([0, roleID, giftID, +useNum]);
                                            csSql.SaveGiftCodeRepeat(roleID, giftID, repeatNumSql, function (err) {
                                                if (!!err) {
                                                    logger.error("error when getGiftCodeRepeat %s",
                                                                 utils.getErrorMessage(err));
                                                }
                                                return callback(errorCodes.OK, repeat);
                                            });
                                        } else {
                                            csSql.UpdateGiftCode('"' + giftCodeID + '"', function (err) {
                                                if (!!err) {
                                                    logger.error("error when getGiftCodeRepeat %s",
                                                                 utils.getErrorMessage(err));
                                                }
                                                return callback(errorCodes.GiftCodeOverLength, repeat);
                                            });
                                        }
                                    }
                                }
        );
    }
};

handler.GetGiftCodeRepeat = function (giftID) {
    var GiftTemplate = templateManager.GetTemplateByID('GiftTemplate', giftID);
    if (!GiftTemplate || !giftID) {
        return errorCodes.ParameterNull;
    }
    var repeat = GiftTemplate['repeat'];
    return repeat;
};