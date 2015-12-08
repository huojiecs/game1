/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-10
 * Time: 下午3:59
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Occupant = require('./occupant');
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var messageService = require('../../tools/messageService');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var rsSql = require('../../tools/mysql/rsSql');
var defaultValues = require('../../tools/defaultValues');
var playerManager = require('../player/playerManager');
var config = require('../../tools/config');
var utilSql = require('../../tools/mysql/utilSql');
var redis = require("redis");
var _ = require("underscore");
var Q = require('q');
var util = require('util');
var stringValue = require('../../tools/stringValue');
var sRsString = stringValue.sRsString;
var eLevelTarget = gameConst.eLevelTarget;

var timerConst = 1000 * 60 * 60;

var eOccupantInfo = gameConst.eOccupantInfo;

var Handler = module.exports;

Handler.Init = function () {
    var tempTime = new Date();
    this.saveTime = tempTime.getTime() + defaultValues.OccupantSaveTime;
    this.occupantList = {};
    this.customList = {};

    //定时器列表
    this.intervalList = {};

    this.redisRoleInfo =
    config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    this.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });
    this.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });
};

Handler.ChangeRoleUnionID = function (roleID, unionID, unionName) {
    var occInfo = this.occupantList[roleID];
    if (occInfo != null) {
        occInfo.SetOccuInfo(eOccupantInfo.UnionID, unionID);
        occInfo.SetOccuInfo(eOccupantInfo.UnionName, unionName);
    }
}

Handler.GetOccupantRoleID = function (customID) {
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return;
    }

    var temp = this.customList[customID];
    var roleID = null;
    if (temp) {
        roleID = temp.GetOccupantInfo(eOccupantInfo.RoleID);
    }
    return roleID;
};

Handler.DeleteCustom = function (roleID) {
    var tempOcc = this.occupantList[roleID];
    if (null != tempOcc) {
        var customID = tempOcc.GetOccupantInfo(eOccupantInfo.CustomID);
        delete this.customList[customID];
        delete this.occupantList[roleID];
        if (this.intervalList[roleID] != null) {
            clearInterval(this.intervalList[roleID]);
        }
    }

};

// 计算角色积分
Handler.PlayerSco = function (roleID, roleName, roleSco, customID, unionID, unionName, roleLevel) {
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return;
    }

    var occupantList = this.occupantList;
    var customList = this.customList;

    var tempOcc = occupantList[roleID];
    var tempCus = customList[customID];
    var tempTime = new Date();
    var occupanted = true;
    if (tempCus == null) {    //开辟新关卡
        if (tempOcc == null) {            //这个人也没有占领任何关卡
            var newOccupant = new Occupant();
            newOccupant.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
            occupantList[roleID] = newOccupant;
            customList[customID] = newOccupant;
            this.OccupantMisOver(roleID);
        }
        else {
            var oldCustomID = tempOcc.GetOccupantInfo(eOccupantInfo.CustomID);
            if (oldCustomID < customID) {//占领高级关卡了
                var oldTime = tempOcc.GetOccupantInfo(eOccupantInfo.LeaveTime);
                oldTime = GetZhanHour(tempTime.getTime(), oldTime);
                this.SendMail(roleID, oldCustomID, oldTime, roleName, false);
                var newOccupant = new Occupant();
                newOccupant.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
                delete occupantList[roleID];
                delete customList[oldCustomID];
                occupantList[roleID] = newOccupant;
                customList[customID] = newOccupant;
                this.OccupantMisOver(roleID);
            }
        }
    }
    else {  //已经被人占领了
        var oldSco = tempCus.GetOccupantInfo(eOccupantInfo.RoleSco);
        var oldRoleID = tempCus.GetOccupantInfo(eOccupantInfo.RoleID);
        var oldUnionID = tempCus.GetOccupantInfo(eOccupantInfo.UnionID);
        if (oldSco < roleSco) {
            if (tempOcc == null) {            //这个人也没有占领任何关卡
                var oldTime = tempCus.GetOccupantInfo(eOccupantInfo.LeaveTime);
                oldTime = GetZhanHour(tempTime.getTime(), oldTime);
                this.SendMail(oldRoleID, customID, oldTime, roleName, true);
                delete occupantList[oldRoleID];
                tempCus.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
                occupantList[roleID] = tempCus;
                this.OccupantMisOver(roleID);
            }
            else {
                var oldCustomID = tempOcc.GetOccupantInfo(eOccupantInfo.CustomID);
                if (oldCustomID <= customID) {//占领高级关卡了
                    var oldTime = tempCus.GetOccupantInfo(eOccupantInfo.LeaveTime);
                    oldTime = GetZhanHour(tempTime.getTime(), oldTime);
                    if (roleID != oldRoleID) {
                        this.SendMail(oldRoleID, customID, oldTime, roleName, true);
                    }
                    oldTime = tempOcc.GetOccupantInfo(eOccupantInfo.LeaveTime);
                    oldTime = GetZhanHour(tempTime.getTime(), oldTime);
                    if (oldCustomID < customID) {
                        this.SendMail(roleID, oldCustomID, oldTime, roleName, false);
                    }
                    tempCus.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
                    delete occupantList[roleID];
                    if (oldCustomID < customID) {
                        delete customList[oldCustomID];
                    }
                    delete occupantList[oldRoleID];
                    occupantList[roleID] = tempCus;
                    this.OccupantMisOver(roleID);
                }
            }

            if (this.intervalList[oldRoleID] != null) {
                clearInterval(this.intervalList[oldRoleID]);
            }
            delete this.intervalList[oldRoleID];
        }
        else {
            occupanted = false;
        }
    }

    // 占领了才设置定时器
    if (occupanted) {
        if (this.intervalList[roleID] != null) {
            clearInterval(this.intervalList[roleID]);
        }

        var timer = setInterval(this.OnTimeFunction(roleID, customID), timerConst);
        this.intervalList[roleID] = timer;
    }
};


Handler.OccupantMisOver = function (roleID) {
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return;
    }
    pomelo.app.rpc.cs.csRemote.OccupantMisOver(null, player.csID, roleID, gameConst.eMisType.OccupyCus, 0, 1,
                                               function (err, result) {
                                                   if (!!err) {
                                                       logger.error('占领炼狱关卡任务完成出错' + err.stack);
                                                       return;
                                                   }
                                                   if (result != 0) {
                                                       logger.error('占领炼狱关卡任务完成出错' + result);
                                                   }
                                               });
};

Handler.SendOccupant = function (uid, sid) {
    var route = 'ServerUpdateCustom_Remote';
    var msg = {
        customList: []
    };

    var tempTime = new Date();
    for (var index in this.customList) {
        var temp = this.customList[index];
        var tempMsg = temp.MakeMessage(tempTime);
        msg.customList.push(tempMsg);
    }

    logger.info('发送占领关卡的数据: %j', msg);

    messageService.pushMessageToPlayer({uid: uid, sid: sid}, route, msg);
};

Handler.SetDataFromDB = function (List) {
    for (var index in List) {
        var newOccupant = new Occupant();
        for (var i = 0; i < eOccupantInfo.Max; ++i) {
            newOccupant.SetOccuInfo(i, List[index][i]);
        }
        var roleID = newOccupant.GetOccupantInfo(eOccupantInfo.RoleID);
        var customID = newOccupant.GetOccupantInfo(eOccupantInfo.CustomID);
        this.occupantList[roleID] = newOccupant;
        this.customList[customID] = newOccupant;

        if (this.intervalList[roleID] != null) {
            clearInterval(this.intervalList[roleID]);
        }
        var timer = setInterval(this.OnTimeFunction(roleID, customID), timerConst);
        this.intervalList[roleID] = timer;
    }
};


Handler.SaveOccupantInfo = function (callback) {
    var Info = '';
    for (var index in this.customList) {
        var temp = this.customList[index];
        Info += '(';
        for (var i = 0; i < eOccupantInfo.Max; ++i) {
            var value = temp.GetOccupantInfo(i);
            if (typeof  value == 'string') {
                Info += '\'' + value + '\'' + ',';
            }
            else {
                Info += value + ',';
            }
        }
        Info = Info.substring(0, Info.length - 1);
        Info += '),';
    }
    Info = Info.substring(0, Info.length - 1);
    logger.info('Handler.SaveOccupantInfo sql=' + Info);
    rsSql.SaveOccupantInfo(Info, function (err) {
        if (!!err) {
            logger.error('存储占领关卡列表失败啦: %s', utils.getErrorMessage(err));
        }

        utils.invokeCallback(callback, err);
    });
};


Handler.Update = function (nowTime) {
    var nowSec = nowTime.getTime();
    for (var Index in this.customList) {
        var temp = this.customList[Index];
        var oldTime = temp.GetOccupantInfo(eOccupantInfo.LeaveTime);
        if (oldTime < nowSec) {
            logger.info('占领时间到删除占领者');
            var roleID = temp.GetOccupantInfo(eOccupantInfo.RoleID);
            var customID = temp.GetOccupantInfo(eOccupantInfo.CustomID);
            delete this.customList[customID];
            delete this.occupantList[roleID];
            // 占领时间到停止定时器
            if (this.intervalList[roleID] != null) {
                clearInterval(this.intervalList[roleID]);
            }

            this.SendMail(roleID, customID, 6, '', false);
        }
    }
    if (this.saveTime < nowSec) {
        this.saveTime = nowSec + defaultValues.OccupantSaveTime;
        this.SaveOccupantInfo();
    }
};

Handler.SendMail = function (roleID, customID, hourNum, newRoleName, highLevel) {
    logger.info('给玩家%j关卡%j时间%j发送邮件', roleID, customID, hourNum);
    if (hourNum < 0) {
        return;
    }
    if (hourNum == 0 && highLevel) {
        var mailDetail = {
            recvID: roleID,
            subject: sRsString.subject_1,//'占领关卡被抢夺',
            content: util.format(sRsString.content_1, newRoleName),//'您占领的炼狱关卡被 ' + newRoleName + ' 占领，快去夺回来吧！',
            mailType: gameConst.eMailType.System,
            items: []
        };
        pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, utils.done);
        return;
    }
    if (hourNum == 0 && !highLevel) {
        return;
    }
    var itemList = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0]
    ];
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return;
    }
    var prizeNum = CustomTemplate['zhanNum'];
    if (prizeNum > defaultValues.mailItemNum) {
        prizeNum = defaultValues.mailItemNum;
    }
    for (var i = 0; i < prizeNum; ++i) {
        var itemID = CustomTemplate['zhanID_' + i];
        var itemNum = CustomTemplate['zhanNum_' + i];
        itemList[i][0] = itemID;
        itemList[i][1] = itemNum * hourNum;
    }
    var mailDetail = {
        recvID: roleID,
        subject: sRsString.subject_2,//'占领关卡奖励',
        content: sRsString.content_2,//'勇敢的战士这是对你占领这个关卡的奖赏',
        mailType: gameConst.eMailType.System,
        items: itemList
    };

    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err, result) {
        if (!!err) {
            logger.error('房间获取系统奖励出错' + err.stack);
        }
        else {
            if (result != 0) {
                logger.error('房间获取系统奖励出错' + result);
            }
            else {
                logger.info('发送系统邮件成功啦');
            }
        }
    });
};

function GetZhanHour(nowSec, oldSec) {
    if (nowSec >= oldSec) {
        return 6;
    }
    var tempSec = defaultValues.OccupantTime - ( oldSec - nowSec );
    var result = tempSec / 3600000;
    if (result >= 0.5) {
        result = Math.ceil(result);
    }
    else {
        result = 0;
    }
    return result;
};

Handler.GetChart = function (callback) {
    var self = this;
    var msg = {
        customList: []
    };
    var tempTime = new Date();

    var jobs = _.map(this.customList, function (item) {
        var deferred = Q.defer();
        var temp = item;
        var tempList = [];
        for (var i = 0; i <= gameConst.eOccupantInfo.UnionName; ++i) {
            if (i == gameConst.eOccupantInfo.LeaveTime) {
                tempList.push(temp.GetOccupantInfo(eOccupantInfo.LeaveTime) - tempTime.getTime());
                continue;
            }
            tempList.push(temp.GetOccupantInfo(i));
        }
        self.client.hget(self.redisRoleInfo, temp.GetOccupantInfo(eOccupantInfo.RoleID), function (err, info) {
            if (err) {
                callback(err);
                return deferred.reject();
            }
            info = JSON.parse(info);
            if (null != info) {
                tempList.push(info.vipLevel);
                tempList.push(info.isNobility);
                tempList.push(info.isQQMember);
                tempList[gameConst.eOccupantInfo.UnionName] = info.unionName;
                msg.customList.push(tempList);
            }
            return deferred.resolve();
        });
        return deferred.promise;
    });

    Q.all(jobs)
        .then(function () {
                  callback(0, msg.customList);
              })
        .done();
};

Handler.GetOccupantCustomID = function (roleID) { //获取玩家占领的关卡ID
    var temp = this.occupantList[roleID];
    if (null == temp) {
        return 0;
    }
    return temp.GetOccupantInfo(eOccupantInfo.CustomID);
};

// 封装定时器回调函数
Handler.OnTimeFunction = function (roleID, customID) {
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return function(){
            logger.error('CustomTemplate is not exist customID: ' + customID);
        };
    }
    var self = this;

    var onTimerGetHellReward = function () {
        if (roleID == null || CustomTemplate == null) {
            return;
        }
        var temp = self.customList[customID];
        if(!temp){
            return;
        }
        var unionID = temp.GetOccupantInfo(eOccupantInfo.UnionID);
        if(unionID == null || unionID <= 0){
            return;
        }
        var addScore = CustomTemplate['perScore'];
        var addAnimate = CustomTemplate['perAnimate'];


        // 全占领，双倍
        if (self.isAllOccupant(roleID, customID)) {
            addScore = addScore * 2;
            //addAnimate *= 2;
        }
        //添加类型  此处为1 炼狱添加公会积分 需要判断炼狱次数， 其他传 0  不做判断
        var lianyuType = 0;
        pomelo.app.rpc.us.usRemote.AddUnionScore(null, roleID, 0, addScore, lianyuType, function (resp) {
            if(!resp.result){
                // 在线直接给，不在线发邮件
                var player = playerManager.GetPlayer(roleID);
                if (null != player) {
                    pomelo.app.rpc.cs.csRemote.AddAssets(null, player.GetPlayerCs(), roleID, 1606, addAnimate, 1,
                                                         function (err) {

                                                         });
                }
                else {
                    var itemList = [
                        [1606, addAnimate]
                    ];
                    var mailDetail = {
                        recvID: roleID,
                        subject: sRsString.subject_3,//'公会炼狱奖励',
                        content: sRsString.content_3,//'亲爱的勇士，下面的奖励是您在公会炼狱关卡占领中获得的所有奖励，下次占领时请一定要继续加油呀~',
                        mailType: gameConst.eMailType.System,
                        items: itemList
                    };

                    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err, result) {
                        if (!!err) {
                            logger.error('房间获取系统奖励出错' + err.stack);
                        }
                        else {
                            if (result != 0) {
                                logger.error('房间获取系统奖励出错' + result);
                            }
                            else {
                                logger.info('发送系统邮件成功啦');
                            }
                        }
                    });
                }
            }
        });
    }


    return onTimerGetHellReward;
}

Handler.SetOccupantInfo = function (roleID, roleName, roleSco, customID, unionID, unionName, occupyTpye, roleLevel) {   //设置炼狱关卡占领信息
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return;
    }

    var occupantList = this.occupantList;
    var customList = this.customList;

    if (occupyTpye == 0) {  //设置不占领
        var tempOcc = occupantList[roleID];
        if (null == tempOcc) {
            return;
        }
        var customID = tempOcc.GetOccupantInfo(eOccupantInfo.CustomID);
        delete customList[customID];
        delete occupantList[roleID];
        if (this.intervalList[roleID] != null) {
            clearInterval(this.intervalList[roleID]);
        }
        return;
    }
    if (roleSco == 0) {
        return;
    }

    var tempOcc = occupantList[roleID];
    var tempCus = customList[customID];
    var tempTime = new Date();
    if (tempCus == null) {    //开辟新关卡
        if (tempOcc == null) {            //这个人也没有占领任何关卡
            var newOccupant = new Occupant();
            newOccupant.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
            occupantList[roleID] = newOccupant;
            customList[customID] = newOccupant;
            this.OccupantMisOver(roleID);
        }
        else {
            var oldCustomID = tempOcc.GetOccupantInfo(eOccupantInfo.CustomID);
            if (oldCustomID < customID) {//占领高级关卡了
                var oldTime = tempOcc.GetOccupantInfo(eOccupantInfo.LeaveTime);
                oldTime = GetZhanHour(tempTime.getTime(), oldTime);
                this.SendMail(roleID, oldCustomID, oldTime, roleName, false);
                var newOccupant = new Occupant();
                newOccupant.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
                delete occupantList[roleID];
                delete customList[oldCustomID];
                occupantList[roleID] = newOccupant;
                customList[customID] = newOccupant;
                this.OccupantMisOver(roleID);
            }
        }
    }
    else {  //已经被人占领了
        var oldRoleID = tempCus.GetOccupantInfo(eOccupantInfo.RoleID);
        var oldUnionID = tempCus.GetOccupantInfo(eOccupantInfo.UnionID);
        if (tempOcc == null) {            //这个人也没有占领任何关卡
            var oldTime = tempCus.GetOccupantInfo(eOccupantInfo.LeaveTime);
            oldTime = GetZhanHour(tempTime.getTime(), oldTime);
            this.SendMail(oldRoleID, customID, oldTime, roleName, true);
            delete occupantList[oldRoleID];
            tempCus.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
            occupantList[roleID] = tempCus;
            this.OccupantMisOver(roleID);
        }
        else {
            var oldCustomID = tempOcc.GetOccupantInfo(eOccupantInfo.CustomID);
            if (oldCustomID <= customID) {//占领高级关卡了
                var oldTime = tempCus.GetOccupantInfo(eOccupantInfo.LeaveTime);
                oldTime = GetZhanHour(tempTime.getTime(), oldTime);
                this.SendMail(oldRoleID, customID, oldTime, roleName, true);
                oldTime = tempOcc.GetOccupantInfo(eOccupantInfo.LeaveTime);
                oldTime = GetZhanHour(tempTime.getTime(), oldTime);
                if (oldCustomID < customID) {
                    this.SendMail(roleID, oldCustomID, oldTime, roleName, false);
                }
                tempCus.CreateOccupant(roleID, roleName, roleSco, customID, unionID, unionName, roleLevel);
                delete occupantList[roleID];
                if (oldCustomID < customID) {
                    delete customList[oldCustomID];
                }
                delete occupantList[oldRoleID];
                occupantList[roleID] = tempCus;
                this.OccupantMisOver(roleID);
            }
        }

        if (this.intervalList[oldRoleID] != null) {
            clearInterval(this.intervalList[oldRoleID]);
        }
        delete this.intervalList[oldRoleID];
    }

    if (this.intervalList[roleID] != null) {
        clearInterval(this.intervalList[roleID]);
    }
    var timer = setInterval(this.OnTimeFunction(roleID, customID), timerConst);
    this.intervalList[roleID] = timer;
};

// 是否全占领
Handler.isAllOccupant = function (roleID, customID) {
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return false;
    }
    var bigID = CustomTemplate['bigCustomID'];
    var CustomListTemplate = templateManager.GetTemplateByID('CustomListTemplate', bigID);
    if (CustomListTemplate == null) {
        return false;
    }

    var occupant = this.occupantList[roleID];
    if (occupant == null) {
        return false;
    }

    var customNum = CustomListTemplate['customNum'];
    for (var i = 0; i < customNum; ++i) {
        var customID = CustomListTemplate['hellCustom_' + i];

        var occupantTemp = this.customList[customID];
        if (occupantTemp == null) {
            return false;
        }

        if (occupant.GetOccupantInfo(eOccupantInfo.UnionID) != occupantTemp.GetOccupantInfo(eOccupantInfo.UnionID)) {
            return false;
        }
    }

    return true;

};

Handler.SendAllCusPrize = function () {
    for (var index in this.occupantList) {
        var tempCus = this.occupantList[index];
        var roleID = tempCus.GetOccupantInfo(eOccupantInfo.RoleID);
        var customID = tempCus.GetOccupantInfo(eOccupantInfo.CustomID);
        var oldTime = tempCus.GetOccupantInfo(eOccupantInfo.LeaveTime);
        oldTime = GetZhanHour(new Date().getTime(), oldTime);
        this.SendMail(roleID, customID, oldTime, "", false);
        delete this.occupantList[roleID];
        delete this.customList[customID];
    }
};
