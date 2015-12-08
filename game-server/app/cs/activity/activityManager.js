/**
 * Created with JetBrains WebStorm.
 * User: xykong
 * Date: 13-8-13
 * Time: 下午4:54
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var activity = require('./activity');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var _ = require('underscore');
var errorCodes = require('../../tools/errorCodes');
var defaultValues = require('../../tools/defaultValues');
var itemLogic = require('../item/itemLogic');
var tCustom = templateConst.tCustom;
var eMisType = gameConst.eMisType;
var eLevelTarget = gameConst.eLevelTarget;
var ePlayerInfo = gameConst.ePlayerInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eExpChange = gameConst.eExpChangeReason;
var eCustomSmallType = gameConst.eCustomSmallType;
/** 活动本消除冷却时间*/
var CLEAR_ACTIVITY_CD_TIME = 176;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.activityList = {};
    this.owner = owner
};

var handler = Handler.prototype;

handler.LoadDataByDB = function (activityList) {
    for (var index in activityList) {
        var tempActivity = new activity();
        tempActivity.SetActivityRecord(activityList[index][2], activityList[index][3]);
        this.activityList[activityList[index][0]] = tempActivity;
    }

    if (activityList.length == 0) {
        var activities = templateManager.GetAllTemplate('ActivityTemplate');
        if (null != activities) {
            for (var index in  activities) {
                var temp = activities[index];
                var tempActivity = new activity();
                for (var i = 0; i < temp["activityNum"]; ++i) {
                    if (temp["activity_" + i] > 0) {
                        tempActivity.SetActivityRecord(temp["activity_" + i], 0);
                    }

                }
                this.activityList[temp["attID"]] = tempActivity;
            }
        }
    }

    var allActivity = templateManager.GetAllTemplate('ActivityTemplate');
    if (null != allActivity) {
        if (_.size(this.activityList) != _.size(allActivity)) {

            var dbIds = _.keys(this.activityList);
            for (var ind in allActivity) {
                if (!_.contains(dbIds, '' + allActivity[ind]["attID"])) {
                    var tmp = allActivity[ind];
                    var tmpAct = new activity();
                    for (var i = 0; i < tmp["activityNum"]; ++i) {
                        if (tmp["activity_" + i] > 0) {
                            tmpAct.SetActivityRecord(tmp["activity_" + i], 0);
                        }

                    }
                    this.activityList[tmp["attID"]] = tmpAct;
                }
            }
        }

    }

};

handler.LoadActivityCdByDB = function (cdList) {
    if (_.isEmpty(cdList) == false) {
        var activities = templateManager.GetAllTemplate('ActivityTemplate');
        for (var index in cdList) {
            if (this.activityList[index] != null) {
                this.activityList[index].SetActivityCD(new Date(cdList[index]));
            }
        }
        for (var index in this.activityList) {
            if (this.activityList[index].GetActivityCD() == 0) {
                if (activities[index]["timeCd"] == 0) {
                    this.activityList[index].SetActivityCD(new Date());
                }
            }
        }
    } else {
        for (var index in this.activityList) {
            this.activityList[index].SetActivityCD(new Date());
        }
    }

};

handler.GetSqlStr = function (roleID) {

    var rows = [];

    var activityInfo = '';
    for (var index in this.activityList) {
        var temp = this.activityList[index];
        //activityInfo += '(';
        for (var v in temp.records) {
            rows.push([+index, roleID, +v, temp.records[v]]);
            activityInfo += '(' + index + ',' + roleID + ',' + v + ',' + temp.records[v] + '),';
        }
        //activityInfo = activityInfo.substring(0, activityInfo.length - 1);
        //activityInfo += '),';
    }
    activityInfo = activityInfo.substring(0, activityInfo.length - 1);
//    return activityInfo;

    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== activityInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, activityInfo);
    }

    return sqlString;
};

handler.GetCdSqlStr = function (roleID) {
    var rows = [];
    var activityCdInfo = '';
    for (var index in this.activityList) {
        var cd = this.activityList[index].GetActivityCD();
        cd = utilSql.DateToString(cd);
        rows.push([roleID, +index, cd]);
        activityCdInfo += '(' + roleID + ',' + index + ',' + cd + '),';
    }
    activityCdInfo = activityCdInfo.substring(0, activityCdInfo.length - 1);

    var sqlString = utilSql.BuildSqlValues(rows);
    if (sqlString !== activityCdInfo) {
        //logger.error('sqlString not equal:\n%j\n%j', sqlString, activityCdInfo);
    }
    return sqlString;
};

handler.Update12Info = function () {
    var activities = templateManager.GetAllTemplate('ActivityTemplate');
    for (var index in this.activityList) {
        var temp = activities[index];
        if (!temp) {
            logger.warn('no template exist in ActivityTemplate');
            break;
        }
        this.activityList[index].SetActivityCD(new Date());
    }
};

handler.RequireState = function () {

    var result = new Array();
    var now = new Date();
    var activities = templateManager.GetAllTemplate('ActivityTemplate');
    activities = JSON.parse(JSON.stringify(activities));    // clone the list.
    if (null != activities) {
        for (var index in  activities) {
            var temp = activities[index];
            var cd = this.activityList[temp["attID"]].GetActivityCD();
            if (cd == 0 || cd.getTime() - now.getTime() < 0) {
                temp["cdLeft"] = -1;
            } else {
                temp["cdLeft"] = cd.getTime() - now.getTime();
            }
            temp["timeLeft"] = this.CalcTimeLeft(temp);
            //delete temp.dateSection;
            delete temp.weekSection;
            delete temp.daySection;

            temp["instances"] = new Array();
            for (var i = 0; i < temp["activityNum"]; ++i) {
                if (temp["activity_" + i] > 0) {
                    temp["instances"].push({
                                               id: temp["activity_" + i],
                                               num: 0
                                           });
                }
            }

            delete temp.activityNum;
            for (var i = 0; i < 10; ++i) {
                delete temp["activity_" + i];
            }

            result.push(temp);
        }
    }
    return result;

};

handler.RefreshCD = function (activityID) {
    var now = new Date();
    if (activityID in this.activityList) {
        var cd = this.activityList[activityID].GetActivityCD();
        if (cd == 0) {
            return errorCodes.SystemWrong;
        }
        if (now.getTime() > cd.getTime()) {
            return errorCodes.ActivityReady;
        }

        var assetsManager = this.owner.GetAssetsManager();

        var allTemplate = templateManager.GetTemplateByID('AllTemplate', CLEAR_ACTIVITY_CD_TIME);

        if (assetsManager.CanConsumeAssets(globalFunction.GetYuanBaoTemp(), allTemplate['attnum']/*defaultValues.ActivityRefreshCdCost*/)
            == false) {
            return errorCodes.NoYuanBao;
        }
        assetsManager.SetAssetsValue(globalFunction.GetYuanBaoTemp(), -allTemplate['attnum']/*defaultValues.ActivityRefreshCdCost*/);
        this.activityList[activityID].SetActivityCD(new Date());
        return errorCodes.OK;
    } else {
        return errorCodes.NoActivity;
    }
};

handler.CalcValidWeeks = function (activity) {
    var retWeeks = [];

    var weeks = activity["weekSection"];
    if (weeks == null || weeks.toString().lenth == 0 || weeks == "null") {
        weeks = "0~6";
    }
    weeks = weeks.toString().split(',');
    for (var week in weeks) {
        var ws = weeks[week].split('~');
        if (ws.length > 1) {
            for (var w = ws[0]; w <= ws[1]; w++) {
                retWeeks.push(w.toString());
            }
        }
        else {
            retWeeks.push(weeks[week]);
        }
    }

    return retWeeks;
};

handler.CalcTimeLeftByID = function (activityID, time) {
    if (!this.activityList[activityID]) {
        return -2;
    }

    return this.CalcTimeLeft(this.activityList[activityID], time);
};

handler.CalcTimeLeft = function (activity, time) {
    var now = time;
    if (now == null) {
        now = new Date();
    }
    //now = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    var weeks = this.CalcValidWeeks(activity);

    var dates = activity["dateSection"];

    if (null === dates || dates.toString().length < 10) {
        dates = new Date(now.getTime() - 1209600000) + "~" + new Date(now.getTime() + 1209600000);
    }

    dates = dates.split(',');

    for (var date in dates) {
        var ds = dates[date].split("~");

        var d0 = new Date(ds[0]);
        var d1 = new Date(ds[1]);

        if (now >= d0) {
            var testNow = new Date(now);
            // while (testNow <= d1) {
            var curDay = testNow.getDay();
            if (weeks.indexOf(curDay.toString()) != -1) {

                var days = activity["daySection"];

                if (null === days || dates.toString().length < 9) {
                    days = "0:00~24:00";
                }

                var days = days.split(',');

                for (var day in days) {
                    var das = days[day].split("~");

                    var day1 = new Date(testNow);//结束时间
                    var time = das[1].split(":");
                    day1.setHours(time[0]);
                    day1.setMinutes(time[1]);

                    var day0 = new Date(testNow);//开始时间
                    time = das[0].split(":");
                    day0.setHours(time[0]);
                    day0.setMinutes(time[1]);

                    if (day0 <= testNow) {
                        if (testNow <= day1) {
                            if (now.getTime() === testNow.getTime()) {
                                return 0;
                            }
                            else {
                                return (day0 - now) / 1000;
                            }
                        } else {
                            return (day0.setDate(day0.getDate() + 1) - testNow.getTime()) / 1000;
                            //return (((24-testNow.getHours())*60*60*1000+(60-testNow.getMinutes())*60*1000)+(9*60+30)*60*1000)/1000;

                        }
                    }
                    else {
                        return (day0 - now) / 1000;
                    }
                }

            }

            //  testNow = new Date(testNow.getTime() + 86400000);
            // }
        }
    }

    return -1;
};

handler.Accomplish = function (activityID, instanceID) {
    if (!this.activityList[activityID]) {
        // error
        return;
    }

    var times = this.activityList[activityID].records[instanceID];
    if (times == null) {
        // error
        return;
    }

    this.activityList[activityID].records[instanceID] = times + 1;
};
//历练扫荡
handler.ExperienceSweep = function ( activityID, customID, levelTarget) {
    var player = this.owner;
    if (!this.activityList[activityID]) {
        return {'result': errorCodes.ParameterNull};
    }

    var cusTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == cusTemplate) {
        return {'result': errorCodes.NoTemplate};
    }

    //判断活动对应的邪神是否开启
    if (cusTemplate[tCustom.soulLevel] > 0 && customID != defaultValues.newRoleCustomID) {
        var soulLevel = player.GetSoulManager().GetSoul(cusTemplate[tCustom.soulLevel]).GetSoulInfo(eSoulInfo.LEVEL);
        if (soulLevel <= 0) {
            return {'result': errorCodes.NoSoul};
        }
    }
    var customSweep = cusTemplate[tCustom.customSweep];
    if (customSweep == 0) {
        return {'result': errorCodes.Cs_ActivityCustomNoSweep};
    }
    //vip等级是否满足
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }
    if (null == vipTemplate) {
        return {'result': errorCodes.SystemWrong};
    }
    var sweepGetTake = vipTemplate['activitySweepTakeCard']; //vip等级
    if (sweepGetTake != defaultValues.sweepGetTakeCardReward) {
        return {'result': errorCodes.VipLevel};
    }
    var msg = {
        'result': errorCodes.OK,
        'sweptPrizes': {
            'activityID': activityID,
            'customID': customID,
            'num': 0,
            'winExp': 0,
            'winMoney': 0,
            'instances': []
        }
    };
    var passCost = 0;
    if (vipLevel < defaultValues.maxVipLevel) {
        passCost = cusTemplate[tCustom.passCost];
    } else {

        passCost = cusTemplate[tCustom.vipPassCost_15];
    }
    var physical = cusTemplate[tCustom.physical];

    if (player.GetAssetsManager().CanConsumeAssets(globalFunction.GetYuanBaoTemp(), passCost) == false) {
        return {'result': errorCodes.NoYuanBao};
    }
    if (player.GetAssetsManager().CanConsumeAssets(globalFunction.GetPhysical(), physical) == false) {
        return {'result': errorCodes.Physical};
    }
    player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), -passCost, eAssetsReduce.ActivitySweep);
    player.GetAssetsManager().AlterAssetsValue(globalFunction.GetPhysical(), -physical, eAssetsReduce.ActivitySweep);

    var result = globalFunction.GetCustomItemList(customID, eExpChange.ActivityCustomSweep);
    player.AddExp(result.expNum + result.winExp);
    player.GetAssetsManager().AlterAssetsValue(globalFunction.GetMoneyTemp(), result.winMoney,
                                               eAssetsAdd.ActivityCustomSweep);
    msg.sweptPrizes.winExp = result.expNum + result.winExp;
    msg.sweptPrizes.winMoney = result.winMoney;
    if (!_.isEmpty(result.item)) {
        for (var index in result.item) {
            player.AddItem(index, result.item[index], eAssetsAdd.ActivityCustomSweep, null);
            msg.sweptPrizes.instances.push({id: parseInt(index), num: result.item[index]});
        }
    }

    //增加活动掉落
    var activityDrops = player.itemManager.getActivityDrops(customID);
    for(var id in activityDrops){
        var drop = activityDrops[id];
        msg.sweptPrizes.instances.push({id:+id, num:drop[1]});
        player.AddItem(id, drop[1], eAssetsAdd.ActivityDrop, null);
    }

    //免费翻牌
    this.TakeCardFlop( customID, 0, msg.sweptPrizes.instances);
    //付费翻牌
    if (vipLevel < defaultValues.maxVipLevel) {
        this.TakeCardFlop( customID, 1, msg.sweptPrizes.instances);
    } else {
        this.TakeCardFlop( customID, 1, msg.sweptPrizes.instances);
        this.TakeCardFlop( customID, 1, msg.sweptPrizes.instances);
    }

    if (this.activityList[activityID].GetActivityCD() > new Date().getTime()) {
        this.activityList[activityID].SetActivityCD(new Date());
    }
    if (cusTemplate[tCustom.timeCd] == 0) {
        var nowDate = new Date();
        this.activityList[activityID].SetActivityCD(new Date(nowDate.getTime() + 5 * 60 * 1000));
    }

    player.GetCustomManager().AddSpecialCustom( customID, levelTarget);
    return msg;
};
//翻牌
handler.TakeCardFlop = function ( customID, takeCardType, instances) {
    var FlopMsg = this.owner.GetFlopManager().UseFlop( customID, takeCardType, false);
    if (!_.isEmpty(FlopMsg)) {
        instances.push({id: FlopMsg.id, num: FlopMsg.num});
    }
};

handler.RemainTimes = function (activityID, instanceID) {
    if (!this.activityList[activityID]) {
        return 0;
    }

    var times = this.activityList[activityID].records[instanceID];
    if (!times) {
        return 0;
    }

    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', instanceID);
    if (customTemplate == null) {
        return 0;
    }

    if (customTemplate.customNum <= 0) {
        return -1;
    }

    return customTemplate.customNum - times;

};

