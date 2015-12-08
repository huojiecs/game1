/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-13
 * Time: 下午5:31
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');


var ePlayerInfo = gameConst.ePlayerInfo;
var errorCodes = require('../../tools/errorCodes');
var eAchiInfo = gameConst.eAchiInfo;
var tNotice = templateConst.tNotice;
var tAchieve = templateConst.tAchieve;
var eAchiState = gameConst.eAchiState;
var eAchiType = gameConst.eAchiType;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.dataList = [];
};

var handler = Handler.prototype;
handler.LoadDataByDB = function (dataList) {
    for (var index in dataList) {
        this.dataList.push(dataList[index]);
    }
};

handler.GetSqlStr = function () {
    var sqlStr = '';
    for (var index in this.dataList) {
        var tempList = this.dataList[index];
        sqlStr += '(';
        for (var i = 0; i < eAchiInfo.Max; ++i) {
            var value = tempList[i];
            if (typeof  value == 'string') {
                sqlStr += '\'' + value + '\'' + ',';
            }
            else {
                sqlStr += value + ',';
            }
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr += '),';
    }
    sqlStr = sqlStr.substring(0, sqlStr.length - 1);
//    return sqlStr;

    var sqlString = utilSql.BuildSqlValues(this.dataList);

    if (sqlString !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, sqlStr);
    }

    return sqlString;
};

handler.AddAchieveToDB = function ( msg) {     //将数据库中没有的数据添加到数据库
    this.dataList.push(msg);
};

handler.IsAchieveOver = function ( bigType, cusID, achNum) {
    var tempTemplate = templateManager.GetAllTemplate('AchieveTemplate');
    if (null == tempTemplate) {
        return errorCodes.SystemWrong;
    }
    switch (bigType) {
        case eAchiType.Custom:
        {
            var cusFlag = false;    //模版中是否存在该关卡的标识符
            var achiID;
            for (var index in tempTemplate) {
                var temp = tempTemplate[index];
                var overID = temp[tAchieve.customID];
                if (cusID == overID) {
                    achiID = temp[tAchieve.attID];
                    cusFlag = true;
                    break;
                }
            }
            if (true == cusFlag) {
                var dbFlag = true;    //数据库中是否存在该关卡的标识
                for (var i in this.dataList) {
                    var dbAchiID = this.dataList[i][eAchiInfo.AchiID];
                    if (achiID == dbAchiID) {       //数据库中有该条的记录
                        dbFlag = false;
                        break;
                    }
                }
                if (true == dbFlag) {   //当数据库中没有该条数据时将数据插入到数据库中
                    msg = [achiID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), eAchiState.Finish, achNum];
                    this.AddAchieveToDB( msg);
                    this.SendOneAchieveMsg( msg);
                    return 0;
                }
            }
        }
            break;
        case eAchiType.KillNpc:
        {
            for (var index in tempTemplate) {
                var temp = tempTemplate[index];
                if (temp[tAchieve.AchieveType] == eAchiType.KillNpc) {  //当模版属于刷怪时
                    achiID = temp[tAchieve.attID];          //获取模版的唯一ID
                    var dbFlag = true;    //数据库中是否存在该关卡的标识
                    var pos;
                    var finishNum = temp[tAchieve.overNum];
                    for (var i in this.dataList) {
                        var dbAchiID = this.dataList[i][eAchiInfo.AchiID];
                        if (achiID == dbAchiID) {       //数据库中有该条的记录
                            dbFlag = false;
                            pos = i;
                            break;
                        }
                    }
                    var msg = [achiID, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID)];
                    if (true == dbFlag) {   //当数据库中没有数据时
                        if (achNum >= finishNum) {
                            msg.push(eAchiState.Finish);
                            msg.push(finishNum);
                            this.AddAchieveToDB( msg);
                            this.SendOneAchieveMsg( msg);
                            return 0;
                        }
                        else {
                            msg.push(eAchiState.Unfinish);
                            msg.push(achNum);
                        }
                        this.AddAchieveToDB( msg);
                        this.SendOneAchieveMsg( msg);
                    }
                    else {
                        if (this.dataList[pos][eAchiInfo.FinishNum] + achNum >= finishNum) {
                            this.dataList[pos][eAchiInfo.FinishNum] = finishNum;
                            this.dataList[pos][eAchiInfo.AchiState] = eAchiState.Finish;
                            this.SendOneAchieveMsg( this.dataList[pos]);
                            return 0;
                        }
                        else {
                            this.dataList[pos][eAchiInfo.FinishNum] += achNum;
                        }
                        this.SendOneAchieveMsg( this.dataList[pos]);
                    }
                }
            }
        }
            break;
    }
};

handler.AchieveOver = function ( bigType, cusID, achNum) {   //成就完成
    var retValue = this.IsAchieveOver( bigType, cusID, achNum);
    if (0 == retValue) {  //成就完成
        //this.SendAchieveMsg(player, eAchiType.Custom, cusID);
    }
};

handler.GetAchievePrize = function ( achiID) {
    var tempTemplate = templateManager.GetTemplateByID('AchieveTemplate', '' + achiID);
    var pos;
    for (var index in this.dataList) {
        if (achiID == this.dataList[index][eAchiInfo.AchiID]) {
            pos = index;
            break;
        }
    }
    if (null == tempTemplate) {           //无此成就
        return errorCodes.Cs_NoAchieve;
    }
    if (this.dataList[pos][eAchiInfo.AchiState] == eAchiState.Unfinish) {     //未完成
        return errorCodes.Cs_AchiUnfinish;
    }
    if (this.dataList[pos][eAchiInfo.AchiState] == eAchiState.Prize) {        //已领奖
        return errorCodes.Cs_AchiPrized;
    }
    for (var i = 0; i < 2; ++i) {
        var itemID = tempTemplate['prizeID_' + i];
        var itemNum = tempTemplate['prizeNum_' + i];
        if (itemID > 0 && itemNum > 0) {
            this.owner.AddItem(itemID, itemNum, gameConst.eMoneyChangeType.AchievePrize, 0);
        }
    }
    this.dataList[pos][eAchiInfo.AchiState] = eAchiState.Prize;
    //this.SendAchieveMsg(player, eAchiType.Custom, 0);
    return 0;
};

handler.SendAchieveMsg = function ( bigType, misID) {
    var route = 'ServerAchieveInfo';
    var Msg = {
        achieveList: []
    };
    for (var index in this.dataList) {
        var temp = {};
        for (var bIndex in eAchiInfo) {
            if (eAchiInfo[bIndex] < eAchiInfo.Max) {
                temp[bIndex] = this.dataList[index][eAchiInfo[bIndex]];
            }
        }
        Msg.achieveList.push(temp);
    }
    //player.SendMessage( route, Msg );
};

handler.SendOneAchieveMsg = function ( msg) {
    var route = 'ServerAchieveInfo';
    var Msg = {
        achieveList: []
    };
    var temp = {};
    for (var index in eAchiInfo) {
        if (eAchiInfo[index] < eAchiInfo.Max) {
            temp[index] = msg[eAchiInfo[index]];
        }
    }
    Msg.achieveList.push(temp);
    //player.SendMessage( route, Msg );
};