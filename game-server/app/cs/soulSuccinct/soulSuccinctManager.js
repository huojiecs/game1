/**
 * @Author        wangwenping
 * @Date          2015/01/06
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');
var redisManager = require('../chartRedis/redisManager');
var _ = require('underscore');

var eAttInfo = gameConst.eAttInfo;
var eAttLevel = gameConst.eAttLevel;
var tSuccinctInfo = templateConst.tSuccinctInfo;
var tAttTempInfo = templateConst.tAttTempInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eSuccinctInfo = gameConst.eSuccinctInfo;
var eAttState = gameConst.eAttState;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eRedisClientType = gameConst.eRedisClientType;
var eForbidChartType = gameConst.eForbidChartType;
var ePlayerInfo = gameConst.ePlayerInfo;

var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');

module.exports = function (owner) {
    return new Handler(owner);
};
var Handler = function (owner) {

    this.succinctList = {};
    this.owner = owner;
    this.succinctNum = 0;
    this.souls = [1000, 1001, 1002, 1003, 1004];
    this.soulsZhanli = [0, 0, 0, 0, 0];
};

var handler = Handler.prototype;
/**
 * player当前已经洗练的次数
 * @param succinctInfo
 * @constructor
 */
handler.LoadSuccinctNumByDB = function (succinctInfo) {
    var self = this;
    if (!_.isEmpty(succinctInfo)) {
        self.succinctNum = succinctInfo[0].succinctNum;
    }
    self.SendSuccinctNum();
};
/**
 *
 * @param player
 * @param succinctList
 * @constructor
 */
handler.LoadDataByDB = function ( succinctList) {
    var self = this;
    var soulSuccinctList = {};
    if (!_.isEmpty(succinctList)) {
        for (var id in self.souls) {
            var key = self.souls[id];
            var soulSuccinct = [];
            for (var index in succinctList) {
                if (_.keys(succinctList[index])[0] == key) {
                    soulSuccinct.push(_.values(succinctList[index])[0]);
                }
            }
            soulSuccinctList[key] = soulSuccinct;
        }
        self.succinctList = soulSuccinctList;
        var addZhanli = [];
        for (var soulID in soulSuccinctList) {
            var oneSoulzhanli = 0;
            for (var succinctID in soulSuccinctList[soulID]) {
                if (soulSuccinctList[soulID][succinctID] != null) {
                    if (soulSuccinctList[soulID] != null) {
                        var succinctZhanli = 0;
                        for (var gridID = 0; gridID < 3; gridID++) {
                            succinctZhanli += self.SetAttZhanli(soulSuccinctList[soulID][succinctID], 'LEFT', gridID);
                            succinctZhanli += self.SetAddZhanli(soulSuccinctList[soulID][succinctID], 'LEFT', gridID);
                            self.SetAttList(soulSuccinctList[soulID][succinctID], 'LEFT', gridID, true, true); //更新属性
                        }
                    }
                }
                oneSoulzhanli += succinctZhanli;
            }
            addZhanli.push(oneSoulzhanli);
        }
        self.owner.attManager.SendAttMsg(null);
        self.soulsZhanli = self.GetArray(addZhanli, 5);

        var allZhanli = 0;
        for (var i = 0; i < this.soulsZhanli.length; i++) {
            allZhanli += this.soulsZhanli[i];
        }
        self.owner.UpdateZhanli(allZhanli, true, false); //更新战力
    } else {
        self.OpenFirstSuccinct();//开启第一个邪神的第一个水晶
    }
    self.SendSuccinctMsg(soulSuccinctList);

    /** 属性变化 添加 add by gaosi*/
    self.owner.buildSoulPvpToRedis();
};
/**
 * 开启指定邪神上的某块石头
 * @param player
 * @param soulID
 * @param succinctID
 * @returns {*}
 * @constructor
 */
handler.OpenSuccinct = function ( soulID, succinctID) {
    var self = this;
    var player = self.owner;
    var roleID = player.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID);
    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }
    /*var upSuccinctID = (succinctID / 1000) * 1000;
     for (var id in self.succinctList[soulID]) {
     if (self.succinctList[soulID][id] && self.succinctList[soulID][id][eSuccinctInfo.SUCCINCTID]==upSuccinctID) {
     upSuccinctID++;
     }
     }
     if ((succinctID % 1000 != 0) && (upSuccinctID != succinctID)) {
     return errorCodes.Succinct_LowerLevelNo;
     }*/
    for (var index in self.succinctList[soulID]) {
        if (self.succinctList[soulID][index] && self.succinctList[soulID][index][eSuccinctInfo.SUCCINCTID]
            == succinctID) {
            return errorCodes.Succinct_Activate;
        }
    }
    var selfLevel = player.GetSoulManager().GetSoul(soulID).GetSoulInfo(eSoulInfo.LEVEL);
    var openLevel = soulSuccinctTemplate[tSuccinctInfo.openLevel];
    if (selfLevel < openLevel) {
        return errorCodes.Succinct_NoStartLevel;
    }
    var assetsManager = self.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    var YuanBaoID = soulSuccinctTemplate[tSuccinctInfo.openConsumeID_0];
    var yuanBaoNum = soulSuccinctTemplate[tSuccinctInfo.openConsumeNum_0];
    if (assetsManager.CanConsumeAssets(YuanBaoID, yuanBaoNum) == false) {
        return errorCodes.NoAssets;
    }
    var openConsumeID = soulSuccinctTemplate[tSuccinctInfo.openConsumeID_1];
    var openConsumeNum = soulSuccinctTemplate[tSuccinctInfo.openConsumeNum_1];
    if (assetsManager.CanConsumeAssets(openConsumeID, openConsumeNum) == false) {
        return errorCodes.Succinct_NoBloodBead;
    }
    assetsManager.AlterAssetsValue(YuanBaoID, -yuanBaoNum, eAssetsReduce.SoulSuccinct);
    assetsManager.AlterAssetsValue(openConsumeID, -openConsumeNum, eAssetsReduce.SoulSuccinct);
    var newSuccinct = self.CreateSuccinct(soulID, succinctID, roleID);
    var attZhanli = self.SetAttZhanli(newSuccinct, 'LEFT', 0); //属性增加的战力
    var addZhanli = self.SetAddZhanli(newSuccinct, 'LEFT', 0); //假战力
    var allAdd = attZhanli + addZhanli;

    self.SetAttList(newSuccinct, 'LEFT', 0, true, true); //更新属性
    self.owner.attManager.SendAttMsg(null);
    self.owner.UpdateZhanli(allAdd, true, true); //更新战力
    self.CalZhanli(parseInt(soulID), allAdd);

    if (null == self.succinctList[soulID]) {
        self.succinctList[soulID] = new Array(newSuccinct);
    } else {
        self.succinctList[soulID].push(newSuccinct);
    }

    /** 属性变化 添加 add by gaosi*/
    self.owner.buildSoulPvpToRedis();

    return errorCodes.OK;
};
handler.OpenFirstSuccinct = function () {
    var self = this;
    var newSuccinct = self.CreateSuccinct('1000', 1000, self.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
    var attZhanli = self.SetAttZhanli(newSuccinct, 'LEFT', 0); //属性增加的战力
    var addZhanli = self.SetAddZhanli(newSuccinct, 'LEFT', 0); //假战力
    var allAdd = attZhanli + addZhanli;

    self.SetAttList(newSuccinct, 'LEFT', 0, true, true); //更新属性
    self.owner.attManager.SendAttMsg(null);
    self.owner.UpdateZhanli(allAdd, true, false); //更新战力
    //self.UpdateSoulZhanli('1000', allAdd);//更新邪神战力
    self.CalZhanli(1000, allAdd);
    self.succinctList['1000'] = new Array(newSuccinct);


    /** 属性变化 添加 add by gaosi*/
    self.owner.buildSoulPvpToRedis();
};
/**
 * 增加每个邪神的洗练改变的战力
 * @param soulID
 * @param zhanli
 * @constructor
 */
handler.CalZhanli = function (soulID, zhanli) {
    var self = this;
    if (soulID == 1000) {
        self.soulsZhanli[0] += zhanli;
    } else if (soulID == 1001) {
        self.soulsZhanli[1] += zhanli;
    } else if (soulID == 1002) {
        self.soulsZhanli[2] += zhanli;
    } else if (soulID == 1003) {
        self.soulsZhanli[3] += zhanli;
    } else if (soulID == 1004) {
        self.soulsZhanli[4] += zhanli;
    }
};
/**
 * 激活属性
 * @param soulID
 * @param succinctID
 * @param gridID
 * @returns {exports.OK|*}
 * @constructor
 */
handler.ActivateAtt = function (soulID, succinctID, gridID) {
    var self = this;

    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }
    if (gridID > 4 || gridID < 0) {
        return errorCodes.ParameterNull;
    }
    var assetsManager = self.owner.GetAssetsManager();
    if (null == assetsManager) {
        return errorCodes.SystemWrong;
    }
    //根据格子消耗
    var attConsumeNum = 0;
    if (gridID == 2) {
        attConsumeNum = soulSuccinctTemplate[tSuccinctInfo.openAtt_ConsumeNum_0];
    } else {
        attConsumeNum = soulSuccinctTemplate[tSuccinctInfo.openAtt_ConsumeNum_1];
    }
    if (assetsManager.CanConsumeAssets(globalFunction.YuanBaoID, attConsumeNum) == false) {
        return errorCodes.NoYuanBao;
    }
    assetsManager.AlterAssetsValue(globalFunction.YuanBaoID, -attConsumeNum, eAssetsReduce.ActivateAtt);
    var attZhanli = 0;
    var addZhanli = 0;
    for (var id in self.succinctList[soulID]) {
        if (null != self.succinctList[soulID][id] && self.succinctList[soulID][id][eSuccinctInfo.SUCCINCTID]
            == succinctID) {
            var attInfo = self.OutputOneAtt(soulID, succinctID, 'LEFT');
            self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTID_' + (gridID - 1)]] = attInfo.attID;
            self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTNUM_' + (gridID - 1)]] = attInfo.attNum;
            self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTSTATE_' + (gridID - 1)]] = eAttState.Open;

            attZhanli = self.SetAttZhanli(self.succinctList[soulID][id], 'LEFT', (gridID - 1));
            addZhanli = self.SetAddZhanli(self.succinctList[soulID][id], 'LEFT', (gridID - 1));

            self.SetAttList(self.succinctList[soulID][id], 'LEFT', (gridID - 1), true, true); //更新属性
        }
    }
    self.owner.attManager.SendAttMsg(null);
    var addAll = attZhanli + addZhanli;
    self.CalZhanli(soulID, addAll);

    self.owner.UpdateZhanli(addAll, true, true); //更新战力
    //self.UpdateSoulZhanli(soulID, addAll);//更新邪神战力
    self.SendSuccinctNum();
    self.SendSuccinctMsg();

    /** 属性变化 添加 add by gaosi*/
    self.owner.buildSoulPvpToRedis();
    return errorCodes.OK;
};
handler.UpdateSoulZhanli = function (soulID, zhanli) {
    var nowZhanli = this.owner.GetSoulManager().GetSoul(soulID).GetSoulInfo(gameConst.eSoulInfo.Zhanli) + zhanli;
    this.owner.GetSoulManager().GetSoul(soulID).SetSoulInfo(gameConst.eSoulInfo.Zhanli, nowZhanli);

};
/**
 * 打开某属性
 */
handler.OpenAtt = function (soulID, succinctID, gridID) {
    var self = this;
    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }
    if (gridID > 4 || gridID < 0) {
        return errorCodes.ParameterNull;
    }
    self.SetAtt(soulID, succinctID, gridID, eAttState.Open);
    self.SendSuccinctMsg();
    return errorCodes.OK;
};
/**
 * 锁定某属性某属性
 */
handler.LockAtt = function (soulID, succinctID, gridID) {
    var self = this;
    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }
    if (gridID > 4 || gridID < 0) {
        return errorCodes.ParameterNull;
    }

    self.SetAtt(soulID, succinctID, gridID, eAttState.Lock);
    self.SendSuccinctMsg();
    return errorCodes.OK;
};
/**
 * 设置属性的状态
 * @param soulID
 * @param succinctID
 * @param gridID
 * @param state
 * @constructor
 */
handler.SetAtt = function (soulID, succinctID, gridID, state) {
    var self = this;
    for (var id in self.succinctList[soulID]) {
        if (null != self.succinctList[soulID][id]) {
            if (self.succinctList[soulID][id][eSuccinctInfo.SUCCINCTID] == succinctID) {
                self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTSTATE_' + (gridID - 1)]] = state;
            }
        }
    }
    return errorCodes.OK;
};
/**
 * 需要洗练的个数
 * @param soulID
 * @param succinctID
 * @returns {*}
 * @constructor
 */
handler.CountOpenAtt = function (soulID, succinctID) {
    var self = this;
    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }
    var arrayState = [0, 0, 0];
    for (var id in self.succinctList[soulID]) {
        if (null != self.succinctList[soulID][id] && self.succinctList[soulID][id][eSuccinctInfo.SUCCINCTID]
            == succinctID) {
            for (var i = 0; i < 3; ++i) {
                switch (self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTSTATE_' + i]]) {
                    case eAttState.NoActivate:
                        arrayState[0]++;
                        break;
                    case eAttState.Lock:
                        arrayState[1]++;
                        break;
                    case eAttState.Open:
                        arrayState[2]++;
                        break;
                }
            }
        }
    }
    return arrayState;
};
/**
 * 统计洗练栏目中已有属性的数组列表
 * @param soulID
 * @param succinctID
 * @param local
 * @returns {*}
 * @constructor
 */
handler.AttArray = function (soulID, succinctID, local) {
    var self = this;
    var attArray = [];
    for (var id in self.succinctList[soulID]) {
        if (null != self.succinctList[soulID][id]) {
            if (self.succinctList[soulID][id][eSuccinctInfo.SUCCINCTID] == succinctID) {
                for (var i = 0; i < 3; i++) {
                    if (self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTSTATE_' + i]] == eAttState.Lock) {
                        attArray.push(self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTID_' + i]]);
                    }
                }
                for (var gridID = 0; gridID < 3; gridID++) {
                    var localAttID = self.succinctList[soulID][id][eSuccinctInfo[local + '_ATTID_' + gridID]];
                    if (localAttID != 0) {
                        attArray.push(localAttID);
                    }
                }
            }
        }
    }
    return _.uniq(attArray);
};
/**
 * 随机产生一个属性
 * @param soulID
 * @param succinctID
 * @param local
 * @returns {{attID: number, attNum: *}}
 * @constructor
 */
handler.OutputOneAtt = function (soulID, succinctID, local) {
    var self = this;
    var attArray = self.AttArray(soulID, succinctID, local);

    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    var attNum = soulSuccinctTemplate[tSuccinctInfo.attNum];
    var random = Math.floor(Math.random() * attNum);
    var attID = soulSuccinctTemplate['attTempID_' + random];

    var succinctAttID = 0;
    if (attArray.length > 0) {

        while (true) {
            if (_.contains(attArray, attID)) {
                random = Math.floor(Math.random() * attNum);
                attID = soulSuccinctTemplate['attTempID_' + random];
            } else {
                succinctAttID = attID;
                break;
            }
        }
    } else {
        succinctAttID = attID;
    }
    var attTemplate = templateManager.GetTemplateByID('SoulSuccinctAttTemplate', succinctAttID);

    var colorList = self.GetColorList(attTemplate);
    var index = self.GetRondamAttID(colorList);

    var minNum = attTemplate['min_' + index];
    var maxNum = attTemplate['max_' + index];

    var num = utils.randomAtoB(minNum, maxNum);
    var result = {
        'attID': succinctAttID,
        'attNum': num
    };
    return result;
};
/**
 * 根据属性开启的数据确定洗练消耗
 * @param arrayState
 * @param soulSuccinctTemplate
 * @returns {number}
 * @constructor
 */
handler.SuccinctAttConsume = function (arrayState, soulSuccinctTemplate) {
    var consumeNum = 0;
    if ((arrayState[0] == 1 && arrayState[1] == 1 && arrayState[2] == 1)) {
        consumeNum = soulSuccinctTemplate[tSuccinctInfo.lockConsumeNum_0];
    } else if (arrayState[1] == 1 && arrayState[2] == 2) {
        consumeNum = soulSuccinctTemplate[tSuccinctInfo.lockConsumeNum_0];
    } else if (arrayState[1] == 2 && arrayState[2] == 1) {
        consumeNum = soulSuccinctTemplate[tSuccinctInfo.lockConsumeNum_1];
    } else if (arrayState[0] == 1 && arrayState[1] == 2) {
        consumeNum = soulSuccinctTemplate[tSuccinctInfo.lockConsumeNum_1];
    }
    return consumeNum;
};
/**
 * 洗练生成属性
 * @param soulID
 * @param succinctID
 * @returns {*}
 * @constructor
 */
handler.SuccinctAtt = function (soulID, succinctID) {
    var self = this;
    var list = self.succinctList;
    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }
    var arrayState = self.CountOpenAtt(soulID, succinctID);

    if (self.succinctNum >= 3) {
        var assetsManager = self.owner.GetAssetsManager();
        if (null == assetsManager) {
            return errorCodes.SystemWrong;
        }
        var upConsumeID = soulSuccinctTemplate[tSuccinctInfo.upConsumeID];
        var upConsumeNum = soulSuccinctTemplate[tSuccinctInfo.upConsumeNum];
        if (assetsManager.CanConsumeAssets(upConsumeID, upConsumeNum) == false) {
            return errorCodes.Succinct_NoBloodBead;
        }
        var attConsume = self.SuccinctAttConsume(arrayState, soulSuccinctTemplate);
        if (assetsManager.CanConsumeAssets(globalFunction.YuanBaoID, attConsume) == false) {
            return errorCodes.NoYuanBao;
        }
        assetsManager.AlterAssetsValue(upConsumeID, -upConsumeNum, eAssetsReduce.SuccinctAtt);
        assetsManager.AlterAssetsValue(globalFunction.YuanBaoID, -attConsume, eAssetsReduce.SuccinctAtt);
    }
    for (var id in list[soulID]) {
        if (null != list[soulID][id] && list[soulID][id][eSuccinctInfo.SUCCINCTID] == succinctID) {
            if (arrayState[2] != 3) {
                for (var i = 0; i < 3; i++) {
                    if (list[soulID][id][eSuccinctInfo['LEFT_ATTSTATE_' + i]] == eAttState.Open) {
                        var attInfo = self.OutputOneAtt(soulID, succinctID, 'RIGHT');
                        list[soulID][id][eSuccinctInfo['RIGHT_ATTID_' + i]] = attInfo.attID;
                        list[soulID][id][eSuccinctInfo['RIGHT_ATTNUM_' + i]] = attInfo.attNum;
                    } else {
                        list[soulID][id][eSuccinctInfo['RIGHT_ATTID_' + i]] =
                        list[soulID][id][eSuccinctInfo['LEFT_ATTID_' + i]];
                        list[soulID][id][eSuccinctInfo['RIGHT_ATTNUM_' + i]] =
                        list[soulID][id][eSuccinctInfo['LEFT_ATTNUM_' + i]];
                    }
                }
            } else {
                for (var j = 0; j < 3; j++) {
                    var outputAtt = self.OutputOneAtt(soulID, succinctID, 'RIGHT');
                    list[soulID][id][eSuccinctInfo['RIGHT_ATTID_' + j]] = outputAtt.attID;
                    list[soulID][id][eSuccinctInfo['RIGHT_ATTNUM_' + j]] = outputAtt.attNum;
                }
            }
        }
    }
    self.succinctNum++;
    self.SendSuccinctNum();
    self.SendSuccinctMsg();
    return errorCodes.OK;
};
/**
 * 替换
 * @param soulID
 * @param succinctID
 * @constructor
 */
handler.ReplaceAtt = function (soulID, succinctID) {
    var self = this;
    var list = self.succinctList;
    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }
    var addAllZhanli = 0;
    for (var id in list[soulID]) {
        var succinctInfo = list[soulID][id];
        if (null != succinctInfo && null != succinctInfo[eSuccinctInfo.SUCCINCTID]) {
            if (succinctInfo[eSuccinctInfo.SUCCINCTID] == succinctID) {
                /********洗练左右增加属性及属性战力替换**********/
                for (var gridID = 0; gridID < 3; gridID++) {
                    if (0 != succinctInfo[eSuccinctInfo['RIGHT_ATTID_' + gridID]]) {
                        var leftAttZhanli = self.SetAttZhanli(succinctInfo, 'LEFT', gridID);
                        self.SetAttList(succinctInfo, 'LEFT', gridID, false, true);
                        var rightAttZhanli = self.SetAttZhanli(succinctInfo, 'RIGHT', gridID);
                        self.SetAttList(succinctInfo, 'RIGHT', gridID, true, true);
                        /******假战力******/
                        var leftAddZhanli = self.SetAddZhanli(succinctInfo, 'LEFT', gridID);
                        var rightAddZhanli = self.SetAddZhanli(succinctInfo, 'RIGHT', gridID);
                        addAllZhanli += (rightAttZhanli - leftAttZhanli) + (rightAddZhanli - leftAddZhanli );

                        var leftAtt = succinctInfo[eSuccinctInfo['LEFT_ATTID_' + gridID]];
                        var leftAttNum = succinctInfo[eSuccinctInfo['LEFT_ATTNUM_' + gridID]];
                        succinctInfo[eSuccinctInfo['LEFT_ATTID_' + gridID]] =
                        succinctInfo[eSuccinctInfo['RIGHT_ATTID_' + gridID]];
                        succinctInfo[eSuccinctInfo['LEFT_ATTNUM_' + gridID]] =
                        succinctInfo[eSuccinctInfo['RIGHT_ATTNUM_' + gridID]];
                        succinctInfo[eSuccinctInfo['RIGHT_ATTID_' + gridID]] = leftAtt;
                        succinctInfo[eSuccinctInfo['RIGHT_ATTNUM_' + gridID]] = leftAttNum;

                    }
                }
            }
        }
    }
    self.owner.attManager.SendAttMsg(null);
    self.owner.UpdateZhanli(addAllZhanli, true, true);
    self.CalZhanli(soulID, addAllZhanli);
    self.SendSuccinctNum();
    self.SendSuccinctMsg();

    /** 属性变化 添加 add by gaosi*/
    self.owner.buildSoulPvpToRedis();
    return errorCodes.OK;
};
/**
 * 属性颜色list
 * @param attTemplate
 * @constructor
 */
handler.GetColorList = function (attTemplate) {
    var colorList = [];
    for (var i = 0; i < defaultValues.AttColor; ++i) {
        var color = attTemplate['attNum_' + i];
        colorList.push(color);
    }
    return colorList;
};
/**
 * 根据权重数组获得属性数组的下标
 * @param attTemp
 * @returns {number}
 * @constructor
 */
handler.GetRondamAttID = function (attTemp) {
    var min = 1;
    var max = defaultValues.RandomNum;

    var rand = utils.randomAtoB(min, max);
    var index = 0; //概率下标
    for (var i = 0; i < attTemp.length; i++) {
        if (rand <= attTemp[i]) {
            index = i;
            break;
        }
        rand = rand - attTemp[i];
    }
    return index;
};
/**
 * 发送洗练次数
 * @constructor
 */
handler.SendSuccinctNum = function () {
    var self = this;
    if (null == self.owner) {
        logger.error('SendSoulMsg玩家是空的');
        return;
    }
    var route = 'ServerSuccinctNum';
    var result = {
        'succinctNum': self.succinctNum,
        'allZhanli': self.soulsZhanli
    };
    self.owner.SendMessage(route, result);
};
/**
 * 发送洗练的次数和每个邪神洗练的战力数组
 * @constructor
 */
handler.SendSuccinctMsg = function () {
    var self = this;
    if (null == self.owner) {
        logger.error('SendSoulMsg玩家是空的');
        return;
    }
    var route = 'ServerSuccinctUpdate';
    var succinctMsg = {
        list: {}
    };
    for (var index in self.succinctList) {
        succinctMsg.list[index] = self.succinctList[index];
    }
    self.owner.SendMessage(route, succinctMsg);
};
/**
 * 发送洗练的消息
 * @param soulID
 * @param succinctID
 * @constructor
 */
handler.SendSuccinctIDMsg = function (soulID, succinctID) {
    var self = this;
    if (null == self.owner) {
        logger.error('SendSoulMsg玩家是空的');
        return;
    }
    var route = 'ServerSuccinctUpdate';
    var succinctMsg = {
        list: {}
    };
    if (null == soulID) {
        for (var index in self.succinctList) {
            succinctMsg.list[index] = self.succinctList[index];
        }
    } else {
        if (null == self.succinctList[soulID]) {
            return;
        }
        if (null == succinctID) {
            succinctMsg.succinctList = self.succinctList[soulID];
        } else {
            for (var id in self.succinctList[soulID]) {
                if (self.succinctList[soulID][id][eSuccinctInfo.SUCCINCTID] == succinctID) {
                    succinctMsg.succinctList[succinctID] = self.succinctList[soulID][id]
                }
            }
        }
    }
    self.owner.SendMessage(route, succinctMsg);
};
/**
 * 创建一个洗练
 * @param soulID
 * @param succinctID
 * @param roleID
 * @returns {*}
 * @constructor
 */
handler.CreateSuccinct = function (soulID, succinctID, roleID) {
    var self = this;
    var soulTemplate = templateManager.GetTemplateByID('SoulTemplate', soulID);
    if (null == soulTemplate) {
        return errorCodes.NoTemplate;
    }
    var soulSuccinctTemplate = templateManager.GetTemplateByID('SoulSuccinctTemplate', succinctID);
    if (null == soulSuccinctTemplate) {
        return errorCodes.NoTemplate;
    }

    var attInfo = self.OutputOneAtt(soulID, succinctID, 'LEFT');

    var newSuccinct = new Array(eSuccinctInfo.Max);
    newSuccinct[eSuccinctInfo.SOULID] = parseInt(soulID);
    newSuccinct[eSuccinctInfo.SUCCINCTID] = succinctID;
    newSuccinct[eSuccinctInfo.RoleID] = roleID;
    newSuccinct[eSuccinctInfo.STATE] = 1; //1开启,0未激活
    newSuccinct[eSuccinctInfo.LEFT_ATTID_0] = attInfo.attID;
    newSuccinct[eSuccinctInfo.LEFT_ATTNUM_0] = attInfo.attNum;
    newSuccinct[eSuccinctInfo.LEFT_ATTSTATE_0] = eAttState.Open;
    newSuccinct[eSuccinctInfo.LEFT_ATTID_1] = 0;
    newSuccinct[eSuccinctInfo.LEFT_ATTNUM_1] = 0;
    newSuccinct[eSuccinctInfo.LEFT_ATTSTATE_1] = eAttState.NoActivate;
    newSuccinct[eSuccinctInfo.LEFT_ATTID_2] = 0;
    newSuccinct[eSuccinctInfo.LEFT_ATTNUM_2] = 0;
    newSuccinct[eSuccinctInfo.LEFT_ATTSTATE_2] = eAttState.NoActivate;
    newSuccinct[eSuccinctInfo.RIGHT_ATTID_0] = 0;
    newSuccinct[eSuccinctInfo.RIGHT_ATTNUM_0] = 0;
    newSuccinct[eSuccinctInfo.RIGHT_ATTID_1] = 0;
    newSuccinct[eSuccinctInfo.RIGHT_ATTNUM_1] = 0;
    newSuccinct[eSuccinctInfo.RIGHT_ATTID_2] = 0;
    newSuccinct[eSuccinctInfo.RIGHT_ATTNUM_2] = 0;

    return newSuccinct;
};
/**
 * 保存数据库
 * @returns {string}
 * @constructor
 */
handler.GetSqlStr = function () {
    var self = this;
    var succinctList = self.succinctList;
    var rows = [];
    var succinctListSqlStr = '';
    for (var index in succinctList) {
        for (var id in succinctList[index]) {
            var row = [];
            var temp = succinctList[index][id];
            succinctListSqlStr += '(';
            for (var i = 0; i < eSuccinctInfo.Max; ++i) {
                var value = temp[i];
                succinctListSqlStr += value + ',';
                row.push(value);
            }
            succinctListSqlStr = succinctListSqlStr.substring(0, succinctListSqlStr.length - 1);
            succinctListSqlStr += '),';
            rows.push(row);
        }
    }
    succinctListSqlStr = succinctListSqlStr.substring(0, succinctListSqlStr.length - 1);
    var sqlString = utilSql.BuildSqlValues(rows);
    if (sqlString !== succinctListSqlStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, succinctListSqlStr);
    }
    return sqlString;

};
/**
 * save洗练次数
 * @param roleID
 * @returns {string}
 * @constructor
 */
handler.GetSuccinctSqlStr = function (roleID) {
    var self = this;
    if (null == self.succinctNum) {
        self.succinctNum = 0;
    }
    var succinctSqlStr = '(' + roleID + ',' + self.succinctNum + ')';

    return succinctSqlStr;
};
/**
 * 计算指定水晶上左(右)位置的属性战力
 * @param succinctInfo
 * @param local
 * @param gridID
 * @returns {number}
 * @constructor
 */
handler.SetAttZhanli = function (succinctInfo, local, gridID) {
    var succinctZhanli = 0;
    var attTempID = succinctInfo[eSuccinctInfo[local + '_ATTID_' + gridID]];
    var succinctAttTemplate = templateManager.GetTemplateByID('SoulSuccinctAttTemplate', attTempID);
    if (null != succinctAttTemplate) {
        var attID = succinctAttTemplate[tAttTempInfo.attType];
        var attNum = succinctInfo[eSuccinctInfo[local + '_ATTNUM_' + gridID]];
        switch (attID) {
            case eAttInfo.ATTACK:        //攻击力
                succinctZhanli += attNum * gameConst.eAttFactor.GONGJI;
                break;
            case eAttInfo.DEFENCE:         //防御力
                succinctZhanli += attNum * gameConst.eAttFactor.FANGYU;
                break;
            case eAttInfo.HP:         //HP
                succinctZhanli += attNum * gameConst.eAttFactor.HP;
                break;
            case eAttInfo.MP:         //MP
                succinctZhanli += attNum * gameConst.eAttFactor.MP;
                break;
            case eAttInfo.MAXHP:           //最大血量
                succinctZhanli += attNum * gameConst.eAttFactor.MAXHP;
                break;
            case eAttInfo.MAXMP:           //最大魔法量
                succinctZhanli += attNum * gameConst.eAttFactor.MAXMP;
                break;


            case eAttInfo.CRIT:           //暴击值
                succinctZhanli += attNum * gameConst.eAttFactor.BAOJILV;
                break;
            case eAttInfo.CRITDAMAGE:           //暴击伤害
                succinctZhanli += attNum * gameConst.eAttFactor.BAOJISHANGHAI;
                break;
            case eAttInfo.DAMAGEUP:           //伤害提升
                succinctZhanli += attNum * gameConst.eAttFactor.SHANGHAITISHENG;
                break;
            case eAttInfo.HUNMIREDUCE:           //昏迷
                succinctZhanli += attNum * gameConst.eAttFactor.HUNMI;
                break;
            case eAttInfo.HOUYANGREDUCE:           //后仰
                succinctZhanli += attNum * gameConst.eAttFactor.HOUYANG;
                break;
            case eAttInfo.HPRATE:           //Hp回复速率
                succinctZhanli += attNum * gameConst.eAttFactor.HPHUIFU;
                break;
            case eAttInfo.MPRATE:           //Mp回复速率
                succinctZhanli += attNum * gameConst.eAttFactor.MPHUIFU;
                break;


            case eAttInfo.ANTICRIT:           //暴击抵抗
                succinctZhanli += attNum * gameConst.eAttFactor.BAOJIDIKANG;
                break;
            case eAttInfo.CRITDAMAGEREDUCE:           //暴击伤害减免
                succinctZhanli += attNum * gameConst.eAttFactor.BJSHHJM;
                break;
            case eAttInfo.DAMAGEREDUCE:           //伤害减免
                succinctZhanli += attNum * gameConst.eAttFactor.SHANGHAIJIANMIAN;
                break;
            case eAttInfo.ANTIHUNMI:           //昏迷抵抗
                succinctZhanli += attNum * gameConst.eAttFactor.HUNMIDIKANG;
                break;
            case eAttInfo.ANTIHOUYANG:           //后仰抵抗
                succinctZhanli += attNum * gameConst.eAttFactor.HOUYANGDIKANG;
                break;


            case eAttInfo.ANTIFUKONG:           //浮空抵抗
                succinctZhanli += attNum * gameConst.eAttFactor.FUKONGDIKANG;
                break;
            case eAttInfo.ANTIJITUI:           //击退抵抗
                succinctZhanli += attNum * gameConst.eAttFactor.JITUIDIKANG;
                break;
            case eAttInfo.HUNMIRATE:           //昏迷几率
                succinctZhanli += attNum * gameConst.eAttFactor.HUNMIJILV;
                break;
            case eAttInfo.HOUYANGRATE:           //后仰几率
                succinctZhanli += attNum * gameConst.eAttFactor.HOUYANGJILV;
                break;
            case eAttInfo.FUKONGRATE:           //后仰几率
                succinctZhanli += attNum * gameConst.eAttFactor.FUKONGJILV;
                break;
            case eAttInfo.JITUIRATE:           //击退几率
                succinctZhanli += attNum * gameConst.eAttFactor.JITUIJILV;
                break;

            case eAttInfo.FREEZERATE:          //冰冻几率
                succinctZhanli += attNum * gameConst.eAttFactor.FREEZERATE;
                break;
            case eAttInfo.STONERATE:          //石化几率
                succinctZhanli += attNum * gameConst.eAttFactor.STONERATE;
                break;
            case eAttInfo.ANTIFREEZE:            //冰冻抵抗
                succinctZhanli += attNum * gameConst.eAttFactor.ANTIFREEZE;
                break;
            case eAttInfo.ANTISTONE:           //石化抵抗
                succinctZhanli += attNum * gameConst.eAttFactor.ANTISTONE;
                break;
        }
    }
    return Math.floor(succinctZhanli);
};
/**
 * 计算指定水晶上左(右)位置的属性，更改玩家身上的基础属性
 * @param succinctInfo
 * @param local
 * @param gridID
 * @param isAdd
 * @param isSend
 * @constructor
 */
handler.SetAttList = function (succinctInfo, local, gridID, isAdd, isSend) {
    var self = this;

    var attList = new Array(eAttInfo.MAX);
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var temp = [0, 0];
        attList[i] = temp;
    }
    var attTempID = succinctInfo[eSuccinctInfo[local + '_ATTID_' + gridID]];
    var succinctAttTemplate = templateManager.GetTemplateByID('SoulSuccinctAttTemplate', attTempID);
    if (null != succinctAttTemplate) {
        var attID = succinctAttTemplate[tAttTempInfo.attType];
        var attNum = succinctInfo[eSuccinctInfo[local + '_ATTNUM_' + gridID]];
        switch (attID) {
            case eAttInfo.ATTACK:        //攻击力
                attList[attID][0] += attNum;
                break;
            case eAttInfo.DEFENCE:         //防御力
                attList[attID][0] += attNum;
                break;
            case eAttInfo.HP:         //HP
                attList[attID][0] += attNum;
                break;
            case eAttInfo.MP:         //MP
                attList[attID][0] += attNum;
                break;
            case eAttInfo.MAXHP:           //最大血量
                attList[attID][0] += attNum;
                break;
            case eAttInfo.MAXMP:           //最大魔法量
                attList[attID][0] += attNum;
                break;


            case eAttInfo.CRIT:           //暴击值
                attList[attID][0] += attNum;
                break;
            case eAttInfo.CRITDAMAGE:           //暴击伤害
                attList[attID][0] += attNum;
                break;
            case eAttInfo.DAMAGEUP:           //伤害提升
                attList[attID][0] += attNum;
                break;
            case eAttInfo.HUNMIREDUCE:           //昏迷
                attList[attID][0] += attNum;
                break;
            case eAttInfo.HOUYANGREDUCE:           //后仰
                attList[attID][0] += attNum;
                break;
            case eAttInfo.HPRATE:           //Hp回复速率
                attList[attID][0] += attNum;
                break;
            case eAttInfo.MPRATE:           //Mp回复速率
                attList[attID][0] += attNum;
                break;


            case eAttInfo.ANTICRIT:           //暴击抵抗
                attList[attID][0] += attNum;
                break;
            case eAttInfo.CRITDAMAGEREDUCE:           //暴击伤害减免
                attList[attID][0] += attNum;
                break;
            case eAttInfo.DAMAGEREDUCE:           //伤害减免
                attList[attID][0] += attNum;
                break;
            case eAttInfo.ANTIHUNMI:           //昏迷抵抗
                attList[attID][0] += attNum;
                break;
            case eAttInfo.ANTIHOUYANG:           //后仰抵抗
                attList[attID][0] += attNum;
                break;


            case eAttInfo.ANTIFUKONG:           //浮空抵抗
                attList[attID][0] += attNum;
                break;
            case eAttInfo.ANTIJITUI:           //击退抵抗
                attList[attID][0] += attNum;
                break;
            case eAttInfo.HUNMIRATE:           //昏迷几率
                attList[attID][0] += attNum;
                break;
            case eAttInfo.HOUYANGRATE:           //后仰几率
                attList[attID][0] += attNum;
                break;
            case eAttInfo.FUKONGRATE:           //后仰几率
                attList[attID][0] += attNum;
                break;
            case eAttInfo.JITUIRATE:           //击退几率
                attList[attID][0] += attNum;
                break;

            case eAttInfo.FREEZERATE:          //冰冻几率
                attList[attID][0] += attNum;
                break;
            case eAttInfo.STONERATE:          //石化几率
                attList[attID][0] += attNum;
                break;
            case eAttInfo.ANTIFREEZE:            //冰冻抵抗
                attList[attID][0] += attNum;
                break;
            case eAttInfo.ANTISTONE:           //石化抵抗
                attList[attID][0] += attNum;
                break;
        }
    }
    self.owner.GetAttManager().Update(eAttLevel.ATTLEVEL_JICHU, attList, isAdd);
    //if (isSend) {
    //    self.owner.attManager.SendAttMsg(null);
    //}
};
/**
 * 推算假战力
 * @param succinctInfo
 * @param local
 * @param gridID
 * @returns {number}
 * @constructor
 */
handler.SetAddZhanli = function (succinctInfo, local, gridID) {
    var gridId = gridID - 1;
    var attTempID = succinctInfo[eSuccinctInfo[local + '_ATTID_' + gridId]];
    var succinctAttTemplate = templateManager.GetTemplateByID('SoulSuccinctAttTemplate', attTempID);
    var zhanli = 0;
    if (null != succinctAttTemplate) {
        var attNum = succinctInfo[eSuccinctInfo[local + '_ATTNUM_' + gridId]];
        for (var j = 0; j < 5; j++) {
            var minNum = succinctAttTemplate['min_' + j];
            var maxNum = succinctAttTemplate['max_' + j];
            if (attNum > minNum && attNum < maxNum) {
                zhanli = succinctAttTemplate['attZhanLi_' + j];
                break;
            }
        }
    }
    return zhanli;
};
handler.GetArray = function (array, n) {
    if (array.length < n) {
        for (var i = array.length; i < n; i++) {
            array.push(0);
        }
    }
    return array;
};


handler.Update12Info = function () {
    var self = this;
    self.succinctNum = 0;
    self.SendSuccinctNum();
};

/**
 * 获取每个邪神洗练的加成属性{soulID:{0:10,3:20....}}
 * @returns {{attID: *, attNum: *}}
 * @constructor
 */
handler.GetSuccinctInfo = function (soulID) {
    var self = this;
    var result = {};

    if (!self.succinctList[soulID]) {
        return result;
    }
    for (var id in self.succinctList[soulID]) {
        if (null != self.succinctList[soulID][id]) {
            for (var i = 0; i < 3; i++) {
                var attTempID = self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTID_' + i]];
                var succinctAttTemplate = templateManager.GetTemplateByID('SoulSuccinctAttTemplate', attTempID);

                if (null != succinctAttTemplate) {
                    var attType = succinctAttTemplate[tAttTempInfo.attType];
                    var attNum = self.succinctList[soulID][id][eSuccinctInfo['LEFT_ATTNUM_' + i]];
                    if (!result[attType]) {
                        result[attType] = 0;
                    }
                    result[attType] += attNum;
                }
            }
        }
    }
    return result;
};
/**
 * 增加每个邪神的洗练改变的战力
 * @param soulID
 * @return {Number}
 */
handler.GetSoulZhanliByID = function (soulID) {
    var self = this;
    if (soulID == 1000) {
        return self.soulsZhanli[0];
    } else if (soulID == 1001) {
        return self.soulsZhanli[1];
    } else if (soulID == 1002) {
        return self.soulsZhanli[2];
    } else if (soulID == 1003) {
        return self.soulsZhanli[3];
    } else if (soulID == 1004) {
        return self.soulsZhanli[4];
    }
    return 0;
};