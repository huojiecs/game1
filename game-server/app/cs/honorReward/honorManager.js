/**
 * Created by Administrator on 14-8-18.
 */
/**
 * Created by Administrator on 14-6-16.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');
var utils = require('../../tools/utils');
var csSql = require('../../tools/mysql/csSql');
var templateManager = require('../../tools/templateManager');
var globalFunction = require('../../tools/globalFunction');
var defaultValues = require('../../tools/defaultValues');
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.honor = {"roleID": 0, "honorPrize": 0, "honorPrizeDay": new Date(), "honorLastDay": new Date()};
};
var handler = Handler.prototype;

//初始化加载数据
handler.LoadDataByDB = function (honorInfo) {
    if (!!honorInfo[0] && honorInfo.length > 0) {
        this.honor = honorInfo[0];
    } else {
        this.honor.roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    }
};

//（1）上线同步一次
handler.SendHonorManager = function () {
    var player = this.owner;
    var honorTop = {HonorTop: 0};
    var playerLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var today = new Date(utils.GetDateNYR(new Date()));
    var prizeDay = new Date(utils.GetDateNYR(this.honor['honorPrizeDay']));
    var lastDay = new Date(utils.GetDateNYR(this.honor['honorLastDay']));
    if (playerLevel >= defaultValues.aPvPExpLevel && today - lastDay > 0) {
        if (0 == today - prizeDay) {
            var nowDate = new Date();
            if (nowDate.getHours() > 0 || nowDate.getMinutes() >= 5) {
                honorTop = {HonorTop: 1};
            }
        } else {
            var nowDate = new Date();
            if (nowDate.getHours() > 0 || nowDate.getMinutes() >= 5) {
                honorTop = {HonorTop: 1};
                this.honor['honorPrize'] = 0;
            }

        }
    }


//    if (this.honor['roleID'] == 0 || playerLevel < defaultValues.aPvPExpLevel) {
//        honorTop = {HonorTop: 0};
//    } else {
//        var today = new Date(utils.GetDateNYR(new Date()));
//        var prizeDay = new Date(utils.GetDateNYR(this.honor['honorPrizeDay']));
//        var lastDay = new Date(utils.GetDateNYR(this.honor['honorLastDay']));
//        var initDate = new Date(utils.GetDateNYR(new Date(0)));
//        if (today - prizeDay == 0) {
//            if (initDate - lastDay == 0) {
//                honorTop = {HonorTop: 1};
//            }
//        } else if (today - lastDay != 0) {
//            var nowDate = new Date();
//            if (nowDate.getHours() > 0 || nowDate.getMinutes() >= 5) {
//                honorTop = {HonorTop: 1};
//                this.honor['honorPrize'] = 0;
//            }
//        }
//    }
    if (null == player) {
        logger.error('SendHonorManager玩家是空的');
        return;
    }
    if (null == honorTop) {
        logger.error('SendHonorManager honor是空的');
        return;
    }
    var route = 'ServerHonorRewardInitData';
    player.SendMessage(route, honorTop);
};

handler._SendHonorManager = function(honorTop) { //同步消息
    var player = this.owner;
    if (null == player) {
        logger.error('SendHonorManager玩家是空的');
        return;
    }
    if (null == honorTop) {
        logger.error('SendHonorManager honor是空的');
        return;
    }
    var route = 'ServerHonorRewardInitData';
    player.SendMessage(route, honorTop);
};
handler.Update12HonorInfo = function () {
    var self = this;
    var player = self.owner;
    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);
    csSql.LoadHonorRewardData(roleID, function (err, honorInfo) {
        if (!!err) {
            logger.error('Update12HonorInfo:\n%j\n%j', err, honorInfo);
        }
        if (!!honorInfo[0] && honorInfo.length > 0) {
            self.honor = honorInfo[0];
        }
        var playerLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
        if (playerLevel < defaultValues.aPvPExpLevel) {
            var honorTop = {'HonorTop': 0};
        } else {
            var honorTop = {'HonorTop': 1};
        }

        self._SendHonorManager(honorTop);
    });
};
handler.getHonorReward = function () {//获取奖品信息
    var player = this.owner;
    var HonorRewardTemplate = templateManager.GetAllTemplate('HonorRewardTemplate');
    var lastTop = false;
//    var today = new Date(utils.GetDateNYR(new Date()));
//    var prizeDay = new Date(utils.GetDateNYR(this.honor['honorPrizeDay']));
//    var lastDay = new Date(utils.GetDateNYR(this.honor['honorLastDay']));
//    var initDate = new Date(utils.GetDateNYR(new Date(0)));
//    if (today - prizeDay == 0) {
//        if (initDate - lastDay == 0) {
//            lastTop = true;
//        }
//    } else if (today - lastDay != 0) {
//        var nowDate = new Date();
//        if (nowDate.getHours() > 0 || nowDate.getMinutes() >= 5) {
//            lastTop = true;
//        }
//    }
    var playerLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
    var today = new Date(utils.GetDateNYR(new Date()));
    var prizeDay = new Date(utils.GetDateNYR(this.honor['honorPrizeDay']));
    var lastDay = new Date(utils.GetDateNYR(this.honor['honorLastDay']));
    if (playerLevel >= defaultValues.aPvPExpLevel && today - lastDay > 0) {
        if (0 == today - prizeDay) {
            var nowDate = new Date();
            if (nowDate.getHours() > 0 || nowDate.getMinutes() >= 5) {
                lastTop = true;
            }
        } else {
            var nowDate = new Date();
            if (nowDate.getHours() > 0 || nowDate.getMinutes() >= 5) {
                lastTop = true;
            }

        }
    }


    var id = this.honor['honorPrize'];
    for (var i in HonorRewardTemplate) {
        if (id >= HonorRewardTemplate[i]["minLevel"] && id <= HonorRewardTemplate[i]["maxLevel"]) {
            var grade = i;
            break;
        }
    }
    if (id == 0) {      //荣誉发奖补救机制
        var grade = 11;
    }
    var lingliNum = HonorRewardTemplate[grade]["lingliNum"];
    var yuanbaoNum = HonorRewardTemplate[grade]["yuanbaoNum"];
    var linLiID = globalFunction.GetLingliTemp();
    if (!!lastTop) {
        player.AddItem(linLiID, lingliNum, eAssetsAdd.HonorReward, 0);//添加物品方法
        //player.GetAssetsManager().SetAssetsValue(globalFunction.GetYuanBaoTemp(), yuanbaoNum);
//        player.GetAssetsManager().AlterAssetsValue(globalFunction.GetYuanBaoTemp(), yuanbaoNum, eAssetsAdd.HonorReward);
    }
    this.honor['honorLastDay'] = new Date(utils.GetDateNYR(new Date()));
    this._SendHonorManager({'HonorTop': 0});
    return {result: 0, lingliReward: lingliNum, yuanbaoReward: yuanbaoNum, ranking: id};
};
handler.GetSqlStr = function (roleID) {  //数据库保存
    var self = this;
    var HonorRole = self.getHonorArray(roleID);
    var strInfo = '(';
    for (var t in HonorRole) {
        if (t < HonorRole.length - 1) {
            if (typeof (HonorRole[t]) == 'string') {
                strInfo += "'" + HonorRole[t] + "',";
            } else {
                strInfo += HonorRole[t] + ',';
            }
//            strInfo += mineInfo[t] + ',';
        } else {
            strInfo += '\'' + HonorRole[t] + '\')';
        }
    }
    var sqlString = utilSql.BuildSqlValues(new Array(HonorRole));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }
    return sqlString;
};

handler.getHonorArray = function (roleID) {
    this.honor.roleID = roleID;
    var honorRoleList = [
        this.honor.roleID,
        this.honor.honorPrize,
        utilSql.DateToString(new Date(this.honor.honorPrizeDay)),
        utilSql.DateToString(new Date(this.honor.honorLastDay))
    ];
    return honorRoleList;
};