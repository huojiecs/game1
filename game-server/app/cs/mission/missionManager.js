/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-13
 * Time: 下午5:31
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Mission = require('./mission');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var csSql = require('../../tools/mysql/csSql');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var errorCodes = require('../../tools/errorCodes');
var defaultValues = require('../../tools/defaultValues');
var _ = require('underscore');

var eMissionInfo = gameConst.eMisInfo;
var eMissionState = gameConst.eMisState;
var eMisBigType = gameConst.eMisBigType;
var ePlayerInfo = gameConst.ePlayerInfo;
var eMisType = gameConst.eMisType;
var eMisStartCon = gameConst.eMisStartCon;
var eLevelTarget = gameConst.eLevelTarget;
var tNotice = templateConst.tNotice;

var tMissions = templateConst.tMissions;
var tSoul = templateConst.tSoul;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eExpChange = gameConst.eExpChangeReason;
var eMagicSoulInfo = gameConst.eMagicSoulInfo;
var eMisInfo = gameConst.eMisInfo;
var eSoulInfo = gameConst.eSoulInfo;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var log_getGuid = require('../../tools/guid');
var log_utilSql = require('../../tools/mysql/utilSql');
var log_insLogSql = require('../../tools/mysql/insLogSql');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.misGroup = []; //组ID
    this.misFinish = [];    //已完成非账号任务ID组(特定类型，非全部)
    this.dataList = [];
    for (var i = 0; i < eMisBigType.Max; ++i) {
        this.dataList[i] = {};
    }
    this.hasMagicMiss = false;  //玩家是否有魔翼任务
    this.openSoul = 0;           //玩家开放邪神任务的ID
    this.hasSoulMiss1 = false;  //是否有嗤血邪神任务
    this.hasSoulMiss2 = false;  //是否有黑暗邪神任务
    this.hasSoulMiss3 = false;  //是否有狡诈邪神任务
    this.hasSoulMiss4 = false;  //是否有恐惧邪神任务
    this.hasSoulMiss5 = false;  //是否有毁灭邪神任务

};

var handler = Handler.prototype;

handler.LoadDataByDB = function (dataList) {        //加载任务信息
    var self = this;

    for (var index in dataList) {
        var misID = dataList[index][eMissionInfo.MisID];
        var MissionTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);
        if (MissionTemplate != null) {
            var bigType = MissionTemplate[tMissions.bigType];   //大任务类型
            var misType = MissionTemplate[tMissions.misType];   //详细任务类型
            var temp = new Mission(MissionTemplate);
            temp.SetAllInfo(dataList[index]);
            self.dataList[bigType][misID] = temp;
            if(!!misType && misType==eMisType.MagicSoul){   //此玩家有魔翼任务，魔翼升阶任务兼容老玩家
                //self.AddOverMission(MissionTemplate);
                self.hasMagicMiss = true;
            }if(!!misType && misType==eMisType.OpenSoul){   //玩家开放邪神的任务类型
                self.openSoul = MissionTemplate[tSoul.attID];
            }if(!!misType && misType==eMisType.SoulUpLev){  //玩家升级邪神等级任务类型,任务兼容老玩家
                var soulID = Math.floor(misID/100);
                if(310001 == soulID){
                    self.hasSoulMiss1 = true;
                }else if(310002 == soulID){
                    self.hasSoulMiss2 = true;
                }else if(310003 == soulID){
                    self.hasSoulMiss3 = true;
                }else if(310004 == soulID){
                    self.hasSoulMiss4 = true;
                }else if(310005 == soulID){
                    self.hasSoulMiss5 = true;
                }
            }
        }
    }

    self.ExtendMainMissCompaOldPlayer();
    self.ExtendBranchHellMissCompaOldPlayer();
};

// 添加断裂的任务  注意： 此处 50500021 需要根据最高的战力任务ID配置
handler.AddBreakMission = function () {
    var Missions = this.dataList[eMisBigType.branchLine];
    for(var i = 50500001; i <= 50500023; ++i){
        if(Missions[i] != null){
            return;
        }
    }

    for(var i = 0; i < this.misFinish.length; ++i){
        if(this.misFinish[i] >= 50500001 && this.misFinish[i] < 50500022){
            delete this.misFinish[i];
            break;
        }
    }
};

//老玩家邪神到达10星任务将产生断档 需要触发11星任务
handler.hasSoulMiss = function(){
    var self = this;
    if(!!self.owner.soulManager.soulList){
        //嗤血邪神任务兼容  邪神等级为10
        if(!self.hasSoulMiss1 && self.owner.soulManager.soulList[1000]['soulInfo'][eSoulInfo.LEVEL]>=10 && self.owner.soulManager.soulList[1000]['soulInfo'][eSoulInfo.LEVEL] < 20){
            logger.fatal("****hasSoulMiss soulInfo1 chixieSoul lever : %j" ,self.owner.soulManager.soulList[1000]['soulInfo'][eSoulInfo.LEVEL]);
            //添加任务
            self.addMissByID(31000009);// 31000101
        }
        //黑暗邪神任务兼容  邪神等级为10
        if(!self.hasSoulMiss2 && self.owner.soulManager.soulList[1001]['soulInfo'][eSoulInfo.LEVEL]>=10 && self.owner.soulManager.soulList[1001]['soulInfo'][eSoulInfo.LEVEL] < 20){
            logger.fatal("****hasSoulMiss soulInfo2 heianSoul lever : %j" ,self.owner.soulManager.soulList[1001]['soulInfo'][eSoulInfo.LEVEL]);
            //添加任务
            self.addMissByID(31000018);// 31000201
        }
        //狡诈邪神任务兼容  邪神等级为10
        if(!self.hasSoulMiss3 && self.owner.soulManager.soulList[1002]['soulInfo'][eSoulInfo.LEVEL]>=10 && self.owner.soulManager.soulList[1002]['soulInfo'][eSoulInfo.LEVEL] < 20){
            logger.fatal("****hasSoulMiss soulInfo3 jiaozhaSoul lever : %j" ,self.owner.soulManager.soulList[1002]['soulInfo'][eSoulInfo.LEVEL]);
            //添加任务
            self.addMissByID(31000027);
        }
        //恐惧邪神任务兼容  邪神等级为10
        if(!self.hasSoulMiss4 && self.owner.soulManager.soulList[1003]['soulInfo'][eSoulInfo.LEVEL]>=10 && self.owner.soulManager.soulList[1003]['soulInfo'][eSoulInfo.LEVEL] < 20){
            logger.fatal("****hasSoulMiss soulInfo4 kongjuSoul lever : %j" ,self.owner.soulManager.soulList[1003]['soulInfo'][eSoulInfo.LEVEL]);
            //添加任务
            self.addMissByID(31000036);
        }
        //毁灭邪神任务兼容  邪神等级为10
        if(!self.hasSoulMiss5 && self.owner.soulManager.soulList[1004]['soulInfo'][eSoulInfo.LEVEL]>=10 && self.owner.soulManager.soulList[1004]['soulInfo'][eSoulInfo.LEVEL] < 20){
            logger.fatal("****hasSoulMiss soulInfo5 huimieSoul lever : %j" ,self.owner.soulManager.soulList[1004]['soulInfo'][eSoulInfo.LEVEL]);
            //添加任务
            self.addMissByID(31000045);
        }
    }

}

//魔翼任务在15阶5品产生断档 兼容老玩家超过此等级 未到达满级的  并且没有正常领到此新任务的  15005
handler.MagicMiss = function(){
    var self = this;
    if(!this.hasMagicMiss && this.owner.magicSoulManager.magicSoulInfo[eMagicSoulInfo.TEMPID]>=15005 && this.owner.magicSoulManager.magicSoulInfo[eMagicSoulInfo.TEMPID]<17005){
        logger.fatal("****magicSoulInfo oldPlayer *** lever %j" ,this.owner.magicSoulManager.magicSoulInfo[eMagicSoulInfo.TEMPID]);
        self.addMissByID(30800074);
    }
}

//根据任务ID添加断档任务
handler.addMissByID = function(MissID){
    var self = this;
    var MissionTemplate = templateManager.GetTemplateByID('MissionTemplate', MissID);//30800074  15品5阶魔翼开始为最高等级  后来被突破
    if (MissionTemplate != null) {
        var bigType = MissionTemplate[tMissions.bigType];   //大任务类型
        var misType = MissionTemplate[tMissions.misType];   //详细任务类型
        var temp = new Mission(MissionTemplate);
        var magicData = new Array(eMisInfo.Max);
        magicData[0] = MissID;
        magicData[1]=this.owner.id;
        magicData[2]=0;
        magicData[3]=0;
        magicData[4]=0;
        magicData[5]=0;
        magicData[6]=0;
        magicData[7]=0;
        magicData[8]=0;
        magicData[9]=0;
        magicData[10]=0;
        magicData[11]=0;
        magicData[12]=0;
        magicData[13]=0;
        magicData[14]=1;
        temp.SetAllInfo(magicData);
        self.dataList[bigType][MissID] = temp;
        self.AddOverMission(MissionTemplate);
    }
}

/**延长主线任务，兼容老用户*/
handler.ExtendMainMissCompaOldPlayer = function () {
    var mainMission = this.dataList[eMisBigType.MainLine];
	var roleLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);
    if (_.isEmpty(mainMission) && roleLevel > 75 ) {
        var extendMainTemplate = templateManager.GetTemplateByID('AllTemplate', 169);
        if (null != extendMainTemplate) {
            var extendMisID = extendMainTemplate['attnum'];
            var extendMisTemplate = templateManager.GetTemplateByID('MissionTemplate', extendMisID);
            if (null != extendMisTemplate) {
                var extendTemp = new Mission(extendMisTemplate);
                extendTemp.SetMissionInfo(eMissionInfo.MisState, eMissionState.Get);
                extendTemp.SetMissionInfo(eMissionInfo.MisID, extendMisID);
                extendTemp.SetMissionInfo(eMissionInfo.RoleID, this.owner.id);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_0, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_1, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_2, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_3, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_4, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_5, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_6, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_7, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_8, 0);
                extendTemp.SetMissionInfo(eMissionInfo.MisNum_9, 0);
                extendTemp.SetMissionInfo(eMissionInfo.PreOverNum, 1);

                this.dataList[eMisBigType.MainLine][extendMisID] = extendTemp;
            }
        }
    }
};

/**延长炼狱支线任务，兼容老用户*/
handler.ExtendBranchHellMissCompaOldPlayer = function () {
    var lastCustomTemplate = templateManager.GetTemplateByID('AllTemplate', 170);
    var lastCustomID = lastCustomTemplate['attnum'];
    var isNinePass = this.owner.GetCustomManager().IsWin(lastCustomID, eLevelTarget.Normal);
    var isTenPass = this.owner.GetCustomManager().IsWin(910001, eLevelTarget.Normal);
    if (isNinePass === 0) {
        var extendBranchTemplate = templateManager.GetTemplateByID('AllTemplate', 171);
        if (null != extendBranchTemplate) {
            var misID = extendBranchTemplate['attnum'];
            if (_.isEmpty(this.dataList[eMisBigType.branchLine][misID]) && (isTenPass === 1)) {
                var extendBranchMisTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);
                if (null != extendBranchMisTemplate) {
                    var extendBranchTemp = new Mission(extendBranchMisTemplate);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisState, eMissionState.Get);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisID, misID);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.RoleID, this.owner.id);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_0, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_1, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_2, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_3, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_4, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_5, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_6, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_7, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_8, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_9, 0);
                    extendBranchTemp.SetMissionInfo(eMissionInfo.PreOverNum, 2);

                    this.dataList[eMisBigType.branchLine][misID] = extendBranchTemp;
                }
            }
        }
    }

    //继续兼容11章
    var isTenPass = this.owner.GetCustomManager().IsWin(910010, eLevelTarget.Normal); //910010
    var isElevenPass = this.owner.GetCustomManager().IsWin(911001, eLevelTarget.Normal); //911001
    if (isTenPass === 0) {
        var misID = 30500070;
        if (_.isEmpty(this.dataList[eMisBigType.branchLine][misID]) && (isElevenPass === 1)) {
            var extendBranchMisTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);
            if (null != extendBranchMisTemplate) {
                var extendBranchTemp = new Mission(extendBranchMisTemplate);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisState, eMissionState.Get);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisID, misID);
                extendBranchTemp.SetMissionInfo(eMissionInfo.RoleID, this.owner.id);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_0, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_1, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_2, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_3, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_4, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_5, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_6, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_7, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_8, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.MisNum_9, 0);
                extendBranchTemp.SetMissionInfo(eMissionInfo.PreOverNum, 2);

                this.dataList[eMisBigType.branchLine][misID] = extendBranchTemp;
            }
        }

    }
};

handler.GetSqlStr = function () {
    var sqlArray = [];
    for (var index in this.dataList) {
        sqlArray.push(utilSql.BuildSqlStringFromObjects(this.dataList[index], 'GetMissionInfo', eMissionInfo));
    }
    var sqlString = _.compact(sqlArray).join(',');
logger.fatal("****GetSqlStr : sqlString : %j" , sqlString);
    return sqlString;
};

handler.LoadMisGroupDataByDB = function (groupdataList, misFinishLish) {        //加载任务组ID,已完成任务ID
    var self = this;
    if (null == groupdataList[1]) {
        groupdataList[1] = '[]';
    }
    if (null == misFinishLish[1]) {
        misFinishLish[1] = '[]';
    }
    this.misGroup = JSON.parse(groupdataList[1]);
    this.misFinish = JSON.parse(misFinishLish[1]);

    //删除过期任务
    for (var id in this.misFinish) {
        var attID = this.misFinish[id];
        if (null == templateManager.GetTemplateByID('MissionTemplate', attID)) {
            this.misFinish = _.without(this.misFinish, attID);
        }
    }
    //删除已经完成的
    this.AddBreakMission();
};

handler.GetMisGroupSqlStr = function (roleID) {               //保存任务组ID
    var sqlStr = '(' + roleID + ',\'' + JSON.stringify(this.misGroup) + '\')';
    var misFinishSte = '(' + roleID + ',\'' + JSON.stringify(this.misFinish) + '\')';

    var sqlStrings = [
        utilSql.BuildSqlValues([
                                   [roleID, JSON.stringify(this.misGroup)]
                               ]),
        utilSql.BuildSqlValues([
                                   [roleID, JSON.stringify(this.misFinish)]
                               ])

    ];

    if (sqlStrings[0] !== sqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlStrings[0], sqlStr);
    }
    if (sqlStrings[1] !== misFinishSte) {
        logger.error('sqlString not equal:\n%j\n%j', sqlStrings[1], misFinishSte);
    }
    return sqlStrings;
};


//登陆时加载新任务 直接完成已过的任务
//需要添加已经超越等级完成的任务直接完成任务到当前等级任务
handler.AddOverMission = function(template){
    var self = this;
    var owner = self.owner;
    var misType = template[tMissions.misType];
    var need =  template[tMissions.nextMisID_0];

    switch (misType) {
        case eMisType.SpecifyCus:   //通关指定副本XX次
        case eMisType.AnyCustom:    //通关多个副本中任意副本XX次
        case eMisType.AnyBoss:      //参与多个BOSS活动中任意活动XX次
        case eMisType.OpenSoul:     //开启第XX个邪神
        case eMisType.RecvGift:     //领取XX礼包ID
        case eMisType.TakePvp:       //参与PVP战斗XX次
        case eMisType.SynthesisEquip:   //合成多个装备中的任意装备XXX次
        case eMisType.MineSweep:        //完成多个魔域关卡中的任意关卡XXX次
        {

        }
            break;
        case eMisType.SoulUpLev:        ///xx邪神达到XX星级
        {

            var nextID = Math.floor(need/100); //邪神11任务ID
            var tempID = 0;
            if(310001 == nextID){
                tempID = 1000;
            }else if(310002 == nextID){
                tempID = 1001;
            }else if(310003 == nextID){
                tempID = 1002;
            }else if(310004 == nextID){
                tempID = 1003;
            }else if(310005 == nextID){
                tempID = 1004;
            }

            if(tempID){
                var level = self.owner.soulManager.soulList[tempID]['soulInfo'][eSoulInfo.LEVEL];
                self.IsMissionOverBefore( gameConst.eMisType.SoulUpLev,
                    tempID, level);   //任务完成
            }


        }
            break;
        case eMisType.MagicSoul:    //魔灵品阶达到对应ID
        {
            if(owner.magicSoulManager.magicSoulInfo[eMagicSoulInfo.TEMPID]>=need){
                logger.fatal("*******AddOverMission MagicSoul TEMPID : %j" , owner.magicSoulManager.magicSoulInfo[eMagicSoulInfo.TEMPID] );
                self.IsMissionOverBefore( gameConst.eMisType.MagicSoul,
                    owner.magicSoulManager.magicSoulInfo[eMagicSoulInfo.TEMPID], 1);   //任务完成
            }
        }
            break;
    }

}

handler.AddMissionByExpLevel = function () {     //当玩家升级时检测是否有合适的任务要开启
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);      //获取玩家的等级
    var self = this;

    var addLevelMissions = function(missionList){
        if(missionList == null){
            logger.error('cant find the miss type ');
            return;
        }
        for(var index = 0; index < missionList.length; ++index){
            var template = templateManager.GetTemplateByID('MissionTemplate', missionList[index]);
            if(template == null){
                continue;
            }
            //已经完成
            if (-1 != self.misFinish.indexOf(template[tMissions.attID])) {
                continue;
            }

            //等级不够
            if (expLevel < template[tMissions.lowLevel] || expLevel > template[tMissions.highLevel]) {
                continue;   //当该任务是由等级触发且等级不满足要求时继续遍历
            }

            //已经在dataList中
            var attID = template[tMissions.attID];
            var bigType = template[tMissions.bigType];
            var tempMis = self.dataList[bigType][attID];
            if (null != tempMis) {
                continue;
            }

            //添加任务
            self.misFinish.push(attID);
            if (0 == template[tMissions.isUpdate]) {    //非每日刷新任务
                self.AddNewMission(attID);  //将符合规则的任务添加到用户任务列表
            }
            else {  //每日刷新任务
                var groupID = template[tMissions.isUpdate];    //组ID
                if (-1 == self.misGroup.indexOf(groupID)) {     //当改组的任务还没有出现过时添加任务
                    self.misGroup.push(groupID);                //首先将组ID加入到列表中
                    self.AddNewMission(attID);  //将符合规则的任务添加到用户任务列表
                }
            }
        }
    };

    var missionLevelList = templateManager.GetMissListByType(eMisStartCon.Level);
    var missionLevelFirList = templateManager.GetMissListByType(eMisStartCon.LevFir);
    addLevelMissions(missionLevelList);
    addLevelMissions(missionLevelFirList);


    //添加公会任务
    this.AddUnionMissions();
};

handler.GiveMissionPrize = function (misID) {      //发放任务奖励
    var missionTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);    //获取对应任务ID的任务模版
    if (null == missionTemplate) {
        return; //没有该任务
    }
    var prizeNum = missionTemplate[tMissions.prizeNum];   //获取任务奖励的数量
    for (var i = 0; i < prizeNum; ++i) {
        var itemID = missionTemplate['prizeID_' + i];       //奖励的物品ID
        var itemNum = missionTemplate['prizeNum_' + i];     //对应的奖励物品数量
        if (itemID > 0 && itemNum > 0) {
            this.owner.AddItem(itemID, itemNum, eAssetsAdd.Misson, eExpChange.MissionComplete);      //添加物品或者财产
        }
    }
};

handler.AddNewMission = function (misID) {      //添加新任务
    var missionTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);    //获取对应任务ID的任务模版
    if (null == missionTemplate) {
        return; //没有该任务
    }
    var bigType = missionTemplate[tMissions.bigType];   //获取任务对应的任务大类型
    var conNum = missionTemplate[tMissions.conNum];     //该任务触发所需的前置条件数量
    if (null != this.dataList[bigType][misID] && conNum <= 1) {    //该任务已经存在
        return;
    }
    if (conNum <= 1) {  //当任务为单条件触发时，直接添加该任务
        var tempMis = new Mission(missionTemplate);    //添加任务
        tempMis.SetMissionInfo(eMissionInfo.MisState, eMissionState.Get);
        tempMis.SetMissionInfo(eMissionInfo.MisID, misID);
        tempMis.SetMissionInfo(eMissionInfo.RoleID, this.owner.id);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_0, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_1, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_2, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_3, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_4, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_5, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_6, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_7, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_8, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_9, 0);
        tempMis.SetMissionInfo(eMissionInfo.PreOverNum, 1);
        this.dataList[bigType][misID] = tempMis;
        this.SendMissionMsg(bigType, misID);
        return;
    }
    //当该任务由多条件触发时
    var tempMis = this.dataList[bigType][misID];
    if (null == tempMis) {      //当该任务还没有被任何任务激活时新建
        var tempMis = new Mission(missionTemplate);    //添加任务
        tempMis.SetMissionInfo(eMissionInfo.MisState, eMissionState.NoActivate);
        tempMis.SetMissionInfo(eMissionInfo.MisID, misID);
        tempMis.SetMissionInfo(eMissionInfo.RoleID, this.owner.id);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_0, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_1, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_2, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_3, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_4, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_5, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_6, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_7, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_8, 0);
        tempMis.SetMissionInfo(eMissionInfo.MisNum_9, 0);
        tempMis.SetMissionInfo(eMissionInfo.PreOverNum, 1);
        this.dataList[bigType][misID] = tempMis;
        return;
    }
    //当该任务已经激活，将前置条件数+1
    tempMis.SetMissionInfo(eMissionInfo.PreOverNum, tempMis.GetMissionInfo(eMissionInfo.PreOverNum) + 1);
    if (conNum <= tempMis.GetMissionInfo(eMissionInfo.PreOverNum)) {    //该任务的前置条件已经全部满足
        tempMis.SetMissionInfo(eMissionInfo.MisState, eMissionState.Get);   //设置任务状态为获取状态
        this.SendMissionMsg(bigType, misID);
    }
};

handler.MissionComplete = function (misID) {      //任务已经完成，发送任务奖励并激活后继任务
    var self = this;
    var missionTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);    //获取对应任务ID的任务模版
    if (null == missionTemplate) {
        return errorCodes.NoTemplate; //没有该任务模版
    }
    var bigType = missionTemplate[tMissions.bigType];   //获取任务对应的任务大类型
    var tempMis = this.dataList[bigType][misID];       //找到在当前任务列表中的对应任务
    if (null == tempMis) {
        logger.warn('返回未知错误的任务编号：misID = ' + misID);
        return errorCodes.Cs_NoMission; //如过当前的任务列表中没有该任务不做任务处理
    }
    tempMis.SetMissionInfo(eMissionInfo.MisState, eMissionState.Over);  //设置任务状态为已完成
    //如果是充值任务则更新幸运转盘状态并同步给client
    if (eMisType.Recharge == missionTemplate[tMissions.misType] && tempMis.GetMissionInfo(eMissionInfo.MisState)
        == eMissionState.Over) {
        this.owner.GetZhuanPanManager().SetRechargeStatus(gameConst.eZhuanPanStatus.zhuanPanStatusOpen);
    }
    this.GiveMissionPrize(misID);               //发放任务奖励
    this.SendMissionMsg(bigType, misID);      //通知客户端该任务以完成
    var misNum = missionTemplate[tMissions.nextMisNum]; //后继任务的数量
    for (var i = 0; i < misNum; ++i) {
        if (missionTemplate['nextMisID_' + i] > 0) {
            this.AddNewMission(missionTemplate['nextMisID_' + i]);  //循环添加多个后继任务
        }
    }
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);      //获取玩家的等级
    var misTemplate = templateManager.GetAllTemplate('MissionTemplate');    //获取所有的任务列表
    if (null == misTemplate) {
        return;
    }

    var teamIDNum = missionTemplate[tMissions.nextTeamIDNum]; //后续任务组ID的数量
    for (var i = 0; i < teamIDNum; ++i) {       //添加双条件触发的任务
        var teamID = missionTemplate['nextTeamID_' + i];    //任务的组ID
        if (-1 != this.misGroup.indexOf(teamID)) {  //当改组任务已经出现在任务中
            continue;
        }
        for (var index in misTemplate) {
            var template = misTemplate[index];
            if (teamID != template[tMissions.isUpdate]) {   //排除组ID不相等的任务
                continue;
            }
            if (expLevel < template[tMissions.lowLevel] || expLevel > template[tMissions.highLevel]) {  //排除等级不符合规则的
                continue;
            }
            this.misGroup.push(teamID); //将组ID添加到组ID列表
            this.AddNewMission(template[tMissions.attID]);  //将符合规则的任务添加到用户任务列表
        }
    }
    delete this.dataList[bigType][misID];   //从列表中删除已经完成的任务
    this.IsMissionOver(gameConst.eMisType.UpLevel, 0, this.owner.playerInfo[ePlayerInfo.ExpLevel]);
    this.IsMissionOver(gameConst.eMisType.VipLevel, 0, this.owner.playerInfo[ePlayerInfo.VipLevel]);
    this.IsMissionOver(gameConst.eMisType.ZhanLi, 0, this.owner.playerInfo[ePlayerInfo.ZHANLI]);
    if (gameConst.eMisType.QQFriend == missionTemplate[tMissions.misType]) {        //只有当完成的任务为qq好友类型时才去获取qq好友数量，用来更新最新的qq好友数量
        pomelo.app.rpc.fs.fsRemote.GetFriendNum(null, this.owner.id, gameConst.eFriendType.QQ, function (err, res) {
            if (!!err) {
                logger.error('获取玩家好友数量出现错误');
            }
            else {
                var friendNum = res.number;
                self.IsMissionOver(gameConst.eMisType.QQFriend, 0, friendNum);  //更新QQ好友任务进度
            }
        });
    }

    return 0;
};

handler.OneKeyComplete = function (misID) {       //任务一键完成
    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);  //获取玩家的vip等级
    var VipTemplate = null;
    if (null == vipLevel || vipLevel == 0) {
        VipTemplate = templateManager.GetTemplateByID('VipTemplate', 1)
    } else {
        VipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }
    if (null == VipTemplate) {
        return;
    }

    if (0 == VipTemplate[templateConst.tVipTemp.misVipNeed]) {      //vip等级不满足要求
        return errorCodes.VipLevel;
    }
    var missionTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);    //获取对应任务ID的任务模版
    if (null == missionTemplate) {
        return errorCodes.NoTemplate;
    }
    var moneyID = missionTemplate[tMissions.oneKeyCusID];
    var moneyNum = missionTemplate[tMissions.oneKeyCusNum];
    if (this.owner.GetAssetsManager().CanConsumeAssets(moneyID, moneyNum) == false) {
        return errorCodes.NoYuanBao;
    }
    var res = this.MissionComplete(misID);
    if (0 == res) {
        //this.owner.GetAssetsManager().SetAssetsValue(moneyID, -moneyNum);  //扣除钻石
        this.owner.GetAssetsManager().AlterAssetsValue(moneyID, -moneyNum, eAssetsReduce.AllDailyMissonOver); // 扣钻石
    }
    return res;
};

handler.UpdateMission12Info = function () {     //每天12点刷新任务
    for (var index in this.dataList) {
        for (var aIndex in this.dataList[index]) {
            var tempMis = this.dataList[index][aIndex];
            var misID = tempMis.GetMissionInfo(eMissionInfo.MisID);
            var missionTemplate = templateManager.GetTemplateByID('MissionTemplate', misID);    //获取对应任务ID的任务模版
            if (null == missionTemplate) {
                continue;
            }
            var isUpdate = missionTemplate[tMissions.isUpdate];
            if (isUpdate > 0) {     //如果是每日刷新任务则删除
                delete this.dataList[index][aIndex];
            }
        }
    }
    var tempGroup = this.misGroup;  //定义临时存放组ID的数组
    this.misGroup = [];     //将组ID置空
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);      //获取玩家的等级
    var missionTemplate = templateManager.GetAllTemplate('MissionTemplate');    //获取所有的任务列表
    if (null == missionTemplate) {
        return;
    }
    for (var index in missionTemplate) {        //遍历任务列表，找出符合规则的任务并添加
        var template = missionTemplate[index];
        var groupID = template[tMissions.isUpdate];    //组ID
        var attID = template[tMissions.attID];
        var bigType = template[tMissions.bigType];
        if (-1 == tempGroup.indexOf(groupID) && tempGroup.length > 0) { //没有激活的任务组
            continue;
        }
        if (expLevel < template[tMissions.lowLevel] || expLevel > template[tMissions.highLevel]) {
            continue;   //当该任务是由等级触发且等级不满足要求时继续遍历
        }
        var tempMis = this.dataList[bigType][attID];
        if (null != tempMis) {
            continue;
        }
        if (-1 != this.misGroup.indexOf(groupID)) { //同组任务已经存在
            continue;
        }
        this.misGroup.push(groupID);                //首先将组ID加入到列表中
        this.AddNewMission(attID);  //将符合规则的任务添加到用户任务列表
    }
//    logger.warn('UpdateMission12Info, roleID: %j, dataList: %j', player.id, this.dataList);
    this.clearMissionInfo();
    this.SendMissionMsg(null, null);
};

// 系统调用完成任务。。。做外网条件变更，实际上已经完成的任务的，兼容
handler.MissionSysOver = function(){
    for (var index in this.dataList) {
        for (var aIndex in this.dataList[index]) {
            var tempMis = this.dataList[index][aIndex];
            if(tempMis == null || tempMis.GetMissionInfo(eMissionInfo.MisState) == eMissionState.Over){
                continue;
            }
            var misID = tempMis.GetMissionInfo(eMissionInfo.MisID);
            var template = templateManager.GetTemplateByID('MissionTemplate', misID);    //获取对应任务ID的任务模版
            if (null == template) {
                continue;
            }

            var overNum = template[tMissions.overNum];  //需要完成条件的数量
            var misType = template[tMissions.misType];  //获取任务的类型
            if(misType == eMisType.Recharge){           //这个特殊，需要触发才行
                continue;
            }
            if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                this.MissionComplete(misID);    //进行任务完成的后续处理
            }
        }
    }
};

handler.SetMissionRate = function (bigType, misID, npcID, misNum) {    //设置任务的进度
    var tempMis = this.dataList[bigType][misID];
    if (null == tempMis) {
        return;
    }
    var template = tempMis.GetTemplate();   //获得任务的模版
    var misType = template[tMissions.misType];  //获取任务的类型
    var overNum = template[tMissions.overNum];  //需要完成条件的数量
    var needIDNum = template[tMissions.needIDNum];  //条件的总数量
    switch (misType) {
        case eMisType.SpecifyCus:   //通关指定副本XX次
        case eMisType.AnyCustom:    //通关多个副本中任意副本XX次
        case eMisType.AnyBoss:      //参与多个BOSS活动中任意活动XX次
        case eMisType.MagicSoul:    //魔灵品阶达到对应ID
        case eMisType.OpenSoul:     //开启第XX个邪神
        case eMisType.RecvGift:     //领取XX礼包ID
        case eMisType.TakePvp:       //参与PVP战斗XX次
        case eMisType.SynthesisEquip:   //合成多个装备中的任意装备XXX次
        case eMisType.MineSweep:        //完成多个魔域关卡中的任意关卡XXX次
        {
            for (var i = 0; i < needIDNum; ++i) {
                var needID = template['needID_' + i];   //获取条件ID
                if (npcID != needID) {  //当完成条件与要求条件不符时继续
                    continue;
                }
                tempMis.SetMissionInfo(eMissionInfo.MisNum_0,
                                       tempMis.GetMissionInfo(eMissionInfo.MisNum_0) + misNum);  //设置任务进度
                if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                    this.MissionComplete(misID);    //进行任务完成的后续处理
                    break;
                }
                else {  //当任务没有完成时通知客户端更新进度
                    this.SendMissionMsg(bigType, misID);
                    break;
                }
            }
        }
            break;
        case eMisType.SoulUpLev:    //xx邪神达到XX星
        case eMisType.StarNum:      //XX章节达到XX星
        {
            if(tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= misNum){    // 当前进度更高的时候不用更新
                break;
            }
            for (var i = 0; i < needIDNum; ++i) {
                var needID = template['needID_' + i];   //获取条件ID
                if (npcID != needID) {  //当完成条件与要求条件不符时继续
                    continue;
                }
                tempMis.SetMissionInfo(eMissionInfo.MisNum_0, misNum);  //设置任务进度
                if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                    this.MissionComplete(misID);    //进行任务完成的后续处理
                    break;
                }
                else {  //当任务没有完成时通知客户端更新进度
                    this.SendMissionMsg(bigType, misID);
                    break;
                }
            }
        }
            break;
        case eMisType.OverCus:      //闯关达到XX层
        case eMisType.UpLevel:      //等级达到XX级
        case eMisType.QQFriend:     //拥有XX名QQ好友
        case eMisType.VipLevel:     //达到或超过VIPXX级
        case eMisType.ZhanLi:       //战力达到XXXXX
        {
            tempMis.SetMissionInfo(eMissionInfo.MisNum_0, misNum);  //设置闯关的层数
            if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                this.MissionComplete(misID);    //进行任务完成的后续处理
            }
            else {  //当任务没有完成时通知客户端更新进度
                this.SendMissionMsg(bigType, misID);
            }
        }
            break;
        case eMisType.SemlSoul:      //任意邪神祭炼XX次
        //case eMisType.TakePvp:       //参与PVP战斗XX次
        case eMisType.WinPvp:        //PVP战斗胜利XX次
        case eMisType.Lottery:       //进行抽奖XX次
        case eMisType.GiveFri:       //赠送友情点XXX次
        case eMisType.BlessFri:      //祝福好友XX次
        case eMisType.OccupyCus:     //占领任意关卡XX次
        case eMisType.Intensify:     //任意装备强化成功XX次
        case eMisType.LearnSkill:    //学习任意技能XX次
        case eMisType.InlayStar:     //对任意装备镶嵌X个任意灵石
        case eMisType.MagicSoulJi:   //魔灵祭炼XXX次
        case eMisType.SignNum:       //累计签到XXX次
        {
            tempMis.SetMissionInfo(eMissionInfo.MisNum_0, tempMis.GetMissionInfo(eMissionInfo.MisNum_0) + misNum);  //设置任务进度
            if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                this.MissionComplete(misID);    //进行任务完成的后续处理
            }
            else {  //当任务没有完成时通知客户端更新进度
                this.SendMissionMsg(bigType, misID);
            }
        }
            break;
        case eMisType.Recharge: //充值任意金额
            this.MissionComplete(misID);    //进行任务完成的后续处理
            break;
        case eMisType.ShareSuccess:// 成功分享
        {
            tempMis.SetMissionInfo(eMissionInfo.MisNum_0, tempMis.GetMissionInfo(eMissionInfo.MisNum_0) + misNum);  //设置任务进度
            if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                this.MissionComplete(misID);    //进行任务完成的后续处理
            }
            else {  //当任务没有完成时通知客户端更新进度
                this.SendMissionMsg(bigType, misID);
            }
        }
            break;
    }
};

//玩家已经超越任务完成条件时登陆自动完成任务
handler.IsMissionOverBefore = function (misType, npcID, misNum) {     //判断任务是否完成
    for (var i = 0; i < eMisBigType.Max; ++i) {
        var tempList = this.dataList[i];
        for (var index in tempList) {
            var tempMis = tempList[index];
            var template = tempMis.GetTemplate();
            /** 任务类型不符 或任务已经完成 */
            if (npcID != template[tMissions.needID_0]|| misType != template[tMissions.misType] || tempMis.GetMissionInfo(eMissionInfo.MisState)
                == eMissionState.Over) {
                continue;
            }
            this.SetMissionRateBefore(i, index, npcID, misNum);
        }
    }
};

//玩家已经超越任务完成条件时登陆自动完成任务
handler.SetMissionRateBefore = function (bigType, misID, npcID, misNum) {    //设置任务的进度
    var self = this;
    var tempMis = this.dataList[bigType][misID];
    if (null == tempMis) {
        return;
    }
    var template = tempMis.GetTemplate();   //获得任务的模版
    var misType = template[tMissions.misType];  //获取任务的类型
    var overNum = template[tMissions.overNum];  //需要完成条件的数量
    var needIDNum = template[tMissions.needIDNum];  //条件的总数量
    switch (misType) {
        case eMisType.SpecifyCus:   //通关指定副本XX次
        case eMisType.AnyCustom:    //通关多个副本中任意副本XX次
        case eMisType.AnyBoss:      //参与多个BOSS活动中任意活动XX次
        case eMisType.MagicSoul:    //魔灵品阶达到对应ID
        case eMisType.OpenSoul:     //开启第XX个邪神
        case eMisType.RecvGift:     //领取XX礼包ID
        case eMisType.TakePvp:       //参与PVP战斗XX次
        case eMisType.SynthesisEquip:   //合成多个装备中的任意装备XXX次
        case eMisType.MineSweep:        //完成多个魔域关卡中的任意关卡XXX次
        {
            for (var i = 0; i < needIDNum; ++i) {
                var overList = []; //完成任务id数组
                var overNeedID = []; //完成任务id数组

                var needID = template['needID_' + i];   //获取条件ID
                overList[0] = template[tMissions.attID];
                overNeedID[0] = needID;
                if (npcID != needID) {  //当完成条件与要求条件不符时继续
                    //查看它的后置任务是否有这个完成条件 有的话之前任务全部完成
                     var OverId = self.overNeedMagic(npcID, template, overList, overNeedID);
                     logger.fatal("**** overList : %j", overList);
                     logger.fatal("**** overNeedID : %j", overNeedID);
                     if(OverId==0){
                         continue;
                     }
                    tempMis.SetMissionInfo(eMissionInfo.MisNum_0,
                            tempMis.GetMissionInfo(eMissionInfo.MisNum_0) + misNum);  //设置任务进度
                    if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                        this.MissionComplete(misID);    //进行任务完成的后续处理
                        for(var i=0; i<overList.length; i++ ){
                            this.SetMissionRate(bigType, overList[i], overNeedID[i], misNum);
                        }
                        break;
                    }
                    else {  //当任务没有完成时通知客户端更新进度
                        this.SendMissionMsg(bigType, misID);
                        break;
                    }
                }else{
                    this.SetMissionRate(bigType, template[tMissions.attID], needID, misNum);
                }

            }
        }
            break;
        case eMisType.SoulUpLev:   //xx邪神达到XX星级
        {
            for (var i = 0; i < needIDNum; ++i) {
                var overList = []; //完成任务id数组
                var overNeedID = []; //完成任务id数组

                var needID = template['needID_' + i];   //获取条件ID
                var overNum = template['overNum'];   //获取完成条件ID
                overList[0] = template[tMissions.attID];
                overNeedID[0] = needID;
                if (misNum >= overNum) {  //当完成条件与要求条件不符时继续
                    //查看它的后置任务是否有这个完成条件 有的话之前任务全部完成
                    var OverId = self.overNeedSoulUp(misNum, template, overList, overNeedID);
                    logger.fatal("**** overList : %j", overList);
                    logger.fatal("**** overNeedID : %j", overNeedID);
                    if(OverId==0){
                        continue;
                    }
                    tempMis.SetMissionInfo(eMissionInfo.MisNum_0,
                            tempMis.GetMissionInfo(eMissionInfo.MisNum_0) + misNum);  //设置任务进度
                    if (tempMis.GetMissionInfo(eMissionInfo.MisNum_0) >= overNum) {     //当任务完成进度已经满了
                        this.MissionComplete(misID);    //进行任务完成的后续处理
                        for(var i=0; i<overList.length; i++ ){
                            this.SetMissionRate(bigType, overList[i], overNeedID[i], misNum);
                        }
                        break;
                    }
                    else {  //当任务没有完成时通知客户端更新进度
                        this.SendMissionMsg(bigType, misID);
                        break;
                    }
                }else{
                    this.SetMissionRate(bigType, template[tMissions.attID], needID, misNum);
                }

            }
        }
            break;

    }
}

//迭代出邪神生星断档任务后置任务中的完成条件
handler.overNeedSoulUp = function(level ,template, overList, overNeedID){
    var nextID = template[tMissions.nextMisID_0];
    if(!!nextID) {
        var MissionTemplate = templateManager.GetTemplateByID('MissionTemplate', nextID);
        if(!!MissionTemplate){

            overList.push(MissionTemplate[tMissions.attID]);
            overNeedID.push(MissionTemplate[tMissions.needID_0]);
            var overNum = MissionTemplate[tMissions.overNum];
            if (level > overNum) {
                return this.overNeedSoulUp(level, MissionTemplate, overList, overNeedID);
            } else {
                return overList;
            }
        }else{
            return 0;
        }
    }else{
        return 0;
    }


}

//迭代出魔翼断档任务后置任务中的完成条件
handler.overNeedMagic = function(npcID ,template, overList, overNeedID){
    var nextID = template[tMissions.nextMisID_0];
    if(!!nextID) {
        var MissionTemplate = templateManager.GetTemplateByID('MissionTemplate', nextID);
        if(!!MissionTemplate){
            overList.push(MissionTemplate[tMissions.attID]);
            overNeedID.push(MissionTemplate[tMissions.needID_0]);
            var needID = MissionTemplate[tMissions.needID_0];
            if (npcID != needID) {
                return this.overNeedMagic(npcID, MissionTemplate, overList, overNeedID);
            } else {
                return overList;
            }
        }else{
            return 0;
        }
    }else{
        return 0;
    }


}

handler.IsMissionOver = function (misType, npcID, misNum) {     //判断任务是否完成
    for (var i = 0; i < eMisBigType.Max; ++i) {
        var tempList = this.dataList[i];
        for (var index in tempList) {
            var tempMis = tempList[index];
            var template = tempMis.GetTemplate();
            /** 任务类型不符 或任务已经完成 */
            if (misType != template[tMissions.misType] || tempMis.GetMissionInfo(eMissionInfo.MisState)
                == eMissionState.Over) {
                continue;
            }
            this.SetMissionRate(i, index, npcID, misNum);
        }
    }
};

handler.GetMissionStateByType = function (misType) {     //判断任务是否完成
    for (var index in this.dataList[eMisBigType.EveryDay]) {
        var tempMis = this.dataList[eMisBigType.EveryDay][index];
        /**  任务完成状态*/
        var template = tempMis.GetTemplate();
        if (template && misType == template[tMissions.misType]) {
            return  gameConst.eMisState.Get;
        }
    }
    return  gameConst.eMisState.Over;
};

/*handler.AddMission = function( player, misID, isSend ){
 var MissionTemplate = templateManager.GetTemplateByID( 'MissionTemplate', misID );
 if( null == MissionTemplate ){
 return;
 }
 var bigType = MissionTemplate[tMission.bigType];
 var tempMis =this.dataList[ bigType ][ misID ];
 if( null != tempMis ){
 return;
 }
 var tempMis = new Mission(MissionTemplate);
 tempMis.SetMissionInfo( eMissionInfo.MisState, eMissionState.Get );
 tempMis.SetMissionInfo( eMissionInfo.MisID, misID );
 tempMis.SetMissionInfo( eMissionInfo.RoleID, player.id );
 tempMis.SetMissionInfo( eMissionInfo.MisNum_0, 0 );
 tempMis.SetMissionInfo( eMissionInfo.MisNum_1, 0 );
 tempMis.SetMissionInfo( eMissionInfo.MisNum_2, 0 );
 tempMis.SetMissionInfo( eMissionInfo.MisNum_3, 0 );
 tempMis.SetMissionInfo( eMissionInfo.MisNum_4, 0 );
 this.dataList[ bigType ][ misID ] = tempMis;
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 var log_MisArgs = [ log_getGuid.GetUuid( ), gameConst.eMisOperType.Add ];
 for ( var i = 0; i < gameConst.eMisInfo.Max; ++i ) {
 log_MisArgs.push( tempMis.GetMissionInfo( i ) );
 }
 log_MisArgs.push( log_utilSql.DateToString( new Date() ) );
 log_insLogSql.InsertSql( gameConst.eTableTypeInfo.Mission, log_MisArgs );
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 if( isSend == true ){
 this.SendMissionMsg( player, bigType, misID );
 }
 };*/

handler.MissionOver = function (misType, npcID, misNum) {   //此接口保留，功能为发送公告内容
    /*for( var i = 0; i < eMisBigType.Max; ++i ){
     var tempList = this.dataList[i];
     for( var index in tempList ){
     var tempMis = tempList[ index ];
     var nextID =tempMis.IsMissionOver( misType, npcID, misNum );
     if( nextID >= 0 ){
     this.SendMissionMsg( player, i, tempMis.GetMissionInfo( eMissionInfo.MisID ) );
     }
     }
     }*/
    //发送首杀和击杀公告
    var firstKillID = 'firstKill_' + npcID;
    var killBossID = 'killBoss_' + npcID;
    var firstKillTemplate = templateManager.GetTemplateByID('NoticeTempalte', firstKillID);
    var killBossTemplate = templateManager.GetTemplateByID('NoticeTempalte', killBossID);
    var roleName = this.owner.playerInfo[gameConst.ePlayerInfo.NAME];
    if (null != firstKillTemplate && null != killBossTemplate) {    //当首杀和击杀为同一个npc时
        var beginStr = firstKillTemplate[tNotice.noticeBeginStr];
        var endStr = firstKillTemplate[tNotice.noticeEndStr];
        var content = beginStr + ' ' + roleName + ' ' + endStr;
        pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.FirstKill, npcID, content,
                                                function (err, res) {
                                                    if (1 == res.result) {
                                                        //logger.info('发送首杀数据失败，发送击杀数据');
                                                        var beginStr = killBossTemplate[tNotice.noticeBeginStr];
                                                        var endStr = killBossTemplate[tNotice.noticeEndStr];
                                                        var content = beginStr + ' ' + roleName + ' ' + endStr;
                                                        pomelo.app.rpc.chat.chatRemote.SendChat(null,
                                                                                                gameConst.eGmType.KillBoss,
                                                                                                npcID, content,
                                                                                                utils.done);
                                                    }
                                                });
    }
    else {
        if (null != firstKillTemplate) {            //只是首杀
            //logger.info('只是首杀');
            var beginStr = firstKillTemplate[tNotice.noticeBeginStr];
            var endStr = firstKillTemplate[tNotice.noticeEndStr];
            var content = beginStr + ' ' + roleName + ' ' + endStr;
            pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.FirstKill, npcID, content, utils.done);
        }
        if (null != killBossTemplate) {             //只是击杀
            //logger.info('只是击杀');
            var beginStr = killBossTemplate[tNotice.noticeBeginStr];
            var endStr = killBossTemplate[tNotice.noticeEndStr];
            var content = beginStr + ' ' + roleName + ' ' + endStr;
            pomelo.app.rpc.chat.chatRemote.SendChat(null, gameConst.eGmType.KillBoss, npcID, content, utils.done);
        }
    }
};

/*handler.GetMissionPrize = function( player, bigType, misID ){
 var tempList = this.dataList[ bigType ];
 if( null == tempList ){
 return errorCodes.Cs_NoMission;
 }
 var tempMis = tempList[ misID ];
 if( null == tempMis ){
 return errorCodes.Cs_NoMission;
 }
 if( tempMis.GetMissionInfo( eMissionInfo.MisState ) != eMissionState.Over ){
 return errorCodes.Cs_MissionLost;
 }
 var MissionTemplate = tempMis.GetTemplate();
 for( var i = 0; i < 2; ++i ){
 var itemID = MissionTemplate['prizeID_' + i ];
 var itemNum = MissionTemplate['prizeNum_' + i ];
 if( itemID > 0 && itemNum > 0 ){
 var log_ItemList = player.AddItem( itemID, itemNum, gameConst.eMoneyChangeType.MissionPrize, 0 );

 ////////////////////////////////////////////////////////////////////////////////////////////////////////////
 var log_ItemGuid = log_getGuid.GetUuid( );
 for( var j in log_ItemList ){
 var log_ItemArgs = [ log_ItemGuid ];
 var tempItem = log_ItemList[j];
 for ( var k = 0; k < gameConst.eItemInfo.Max; ++k ){      //将物品的详细信息插入到sql语句中
 log_ItemArgs.push( tempItem.GetItemInfo(k) );
 }
 log_ItemArgs.push(gameConst.eItemChangeType.MissionPrize);
 log_ItemArgs.push(gameConst.eEmandationType.ADD);
 log_ItemArgs.push(log_utilSql.DateToString( new Date() ));
 log_insLogSql.InsertSql( gameConst.eTableTypeInfo.ItemChange, log_ItemArgs );
 }
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////
 }
 }
 tempMis.SetMissionInfo( eMissionInfo.MisState, eMissionState.Prize );
 this.SendMissionMsg( player, bigType, misID );
 var nextID = MissionTemplate[ tMission.nextID ];
 if( nextID > 0 ){
 this.AddMission( player, nextID, true );
 }
 if( MissionTemplate[ tMission.bigType ] == eMisBigType.MainLine ){
 delete tempList[ misID ];
 }
 return 0;
 };*/

handler.SendMissionMsg = function (bigType, misID) {
    var route = 'ServerMissionInfo';
    var Msg = {
        missionList: []
    };
    if (null == bigType) {
        for (var index in this.dataList) {
            var tempList = this.dataList[index];
            for (var aIndex in tempList) {
                var tempMis = tempList[aIndex];
                //服务器端过滤非显示任务 isShow = 1 时候不显示
                var template = tempMis.GetTemplate();
                var isShow = template["isShow"];
                if(isShow==0){
                    var temp = {};
                    for (var bIndex in eMissionInfo) {
                        if (eMissionInfo[bIndex] >= eMissionInfo.PreOverNum) {
                            continue;
                        }
                        temp[bIndex] = tempMis.GetMissionInfo(eMissionInfo[bIndex]);
                    }
                    Msg.missionList.push(temp);
                }

            }
        }
    }
    else if (null == misID) {
        var tempList = this.dataList[bigType];
        if (null != tempList) {
            for (var aIndex in tempList) {
                var tempMis = tempList[aIndex];
                //服务器端过滤非显示任务 isShow = 1 时候不显示
                var template = tempMis.GetTemplate();
                var isShow = template["isShow"];
                if(isShow==0){
                    var temp = {};
                    for (var bIndex in eMissionInfo) {
                        if (eMissionInfo[bIndex] >= eMissionInfo.PreOverNum) {
                            continue;
                        }
                        temp[bIndex] = tempMis.GetMissionInfo(eMissionInfo[bIndex]);
                    }
                    Msg.missionList.push(temp);
                }

            }
        }
    }
    else {
        var tempList = this.dataList[bigType];
        if (null != tempList) {
            var tempMis = tempList[misID];
            //服务器端过滤非显示任务 isShow = 1 时候不显示
            var template = tempMis.GetTemplate();
            var isShow = template["isShow"];
            if(isShow==0){
                if (null != tempMis) {
                    var temp = {};
                    for (var bIndex in eMissionInfo) {
                        if (eMissionInfo[bIndex] >= eMissionInfo.PreOverNum) {
                            continue;
                        }
                        temp[bIndex] = tempMis.GetMissionInfo(eMissionInfo[bIndex]);
                    }
                    Msg.missionList.push(temp);
                }
            }

        }
    }
    if (!defaultValues.QQMemberEnableInIOS) {   //IOS提审版本中去掉不需要显示的任务
        for (var i = 0; i < Msg.missionList.length; ++i) {
            var temp = Msg.missionList[i];
            var misID = temp.MisID;
            if (-1 != defaultValues.MissionListEnableInIOS.indexOf(misID)) {
                Msg.missionList.splice(i, 1);
            }
        }
    }
    this.owner.SendMessage(route, Msg);
};

handler.clearMissionInfo = function () {
    var route = 'ServerclearMissionInfo';
    var msg = {};

    this.owner.SendMessage(route, msg);
};

handler.validateDailyMis = function () {
    var self = this;
    var expLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);      //获取玩家的等级
    var missionTemplate = templateManager.GetAllTemplate('MissionTemplate');    //获取所有的任务列表
    if (null == missionTemplate) {
        return;
    }
    for (var index in missionTemplate) {        //遍历任务列表，找出符合规则的任务并添加
        var template = missionTemplate[index];
        var groupID = template[tMissions.isUpdate];    //组ID
        var attID = template[tMissions.attID];
        var bigType = template[tMissions.bigType];
        if (groupID != eMisType.Recharge) {
            continue;
        }
        if (-1 != this.misGroup.indexOf(groupID)) {
            continue;
        }
        self.misGroup.push(groupID);                //首先将组ID加入到列表中
        var tempMis = this.dataList[bigType][attID];
        if (null != tempMis) {
            continue;
        }
        if (expLevel >= template[tMissions.lowLevel] && expLevel <= template[tMissions.highLevel]) {
            self.AddNewMission(attID);  //将符合规则的任务添加到用户任务列表
        }
    }
};

/**添加公会任务: 遍历任务清单，添加公会任务
 *
 * @param unionInfo （可选参数）玩家所在公会的信息
 * Detail:
 *      this.misFinish, this.dataList中记录的公会相关任务,始终对应于当前公会
 *      当退会时其中的公会相关任务会被清除
 */
handler.AddUnionMissions = function () {
    var self = this;
    var player = self.owner;

    //基本数据
    //经验
    var expLevel = player.GetPlayerInfo(ePlayerInfo.ExpLevel);      //获取玩家的等级
    //公会
    var unionID = player.GetPlayerInfo(ePlayerInfo.UnionID);
    if (!unionID || unionID === 0) {
        return;
    }

    // 不够时间不添加公会任务
    if(!player.jionUnionTime || 0 == utils.getDayOfYear(new Date()) - utils.getDayOfYear(new Date(player.jionUnionTime))){
        return;
    }

    var missionUnionList = templateManager.GetMissListByType(eMisStartCon.LevAndUnion);

    for (var index = 0; index < missionUnionList.length; ++index) {
        //任务信息
        var template = templateManager.GetTemplateByID('MissionTemplate', missionUnionList[index]);
        if (!template) {
            continue;
        }

        var groupID = template[tMissions.isUpdate];    //组ID

        //经验等级
        if (expLevel < template[tMissions.lowLevel] || expLevel > template[tMissions.highLevel]) {
            continue;   //当该任务是由等级触发且等级不满足要求时继续遍历
        }
        //公会等级
        if (player.unionLevel < template[tMissions.unionLevel]) {
            continue;
        }

        //已经添加到dataList
        var attID = template[tMissions.attID];
        var bigType = template[tMissions.bigType];
        var tempMis = self.dataList[bigType][attID];
        if (null != tempMis) {
            continue;
        }

        //已经在misFinish: 若是非日常任务做过就不应再做； 若是日常任务， 若新加公会必然已经清除； 若是老公会可通过12点更新获取任务
        if (-1 != self.misFinish.indexOf(template[tMissions.attID])) {
            continue;
        }

        //记录任务
        self.misFinish.push(attID); //记录任务曾经做过

        //非日常任务
        if (0 == groupID) {
            self.AddNewMission(attID);
            continue;
        }
        //日常任务
        if (-1 == self.misGroup.indexOf(groupID)) {     //改组任务还未被添加
            self.misGroup.push(groupID);                //组ID加入到列表中
            self.AddNewMission(attID);          //添加任务
        }
    }
};

/**退会时清除公会任务: 遍历任务列表this.dataList, this.misFinish, this.misGroup 去除公会相关任务*/
handler.ClearUnionMissions = function () {
    var player = this.owner;

    //基本数据
    //公会
    var unionID = player.GetPlayerInfo(ePlayerInfo.UnionID);
    if (unionID && unionID != 0) {//还在公会
        return;
    }

    var missionUnionList = templateManager.GetMissListByType(eMisStartCon.LevAndUnion);
    for (var index = 0; index < missionUnionList.length; ++index) {
        //任务信息
        var template = templateManager.GetTemplateByID('MissionTemplate', missionUnionList[index]);
        if (!template) {
            continue;
        }
        var attID = template[tMissions.attID];       //任务ID
        var bigType = template[tMissions.bigType];    //大类型
        var groupID = template[tMissions.isUpdate];    //组ID

        //从misGroup, misFinish 删除记录
        this.misGroup = _.without(this.misGroup, groupID);
        this.misFinish = _.without(this.misFinish, attID);

        //从dataList中删除记录
        var tempMis = this.dataList[bigType][attID];
        if (null != tempMis) {
            delete this.dataList[bigType][attID];
        }
    }

    //同步信息给客户端
    this.clearMissionInfo();
    this.SendMissionMsg(null, null);
};


