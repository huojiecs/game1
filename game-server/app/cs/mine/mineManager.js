/**
 * Created by Administrator on 14-6-16.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var errorCodes = require('../../tools/errorCodes');
var utilSql = require('../../tools/mysql/utilSql');
var templateManager = require('../../tools/templateManager');
var playerManager = require('../player/playerManager');
var mine = require('./mine');
var ePlayerInfo = gameConst.ePlayerInfo;
var eVipInfo = gameConst.eVipInfo;
var eMineSweepField = gameConst.eMineSweepField;
var defaultValue = require('../../tools/defaultValues');
var _ = require('underscore');
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.mine = new mine();
    this.owner = owner;
    this.mineInfo = {};
    this.resetInfo = {};
};
var handler = Handler.prototype;

//初始化加载数据
handler.LoadDataByDB = function (mineDataInfo) {
    if (mineDataInfo.length > 0) {
        this.mineInfo = this.mine.getMineSweepInitData(mineDataInfo);
        var itmeTop = this.mine.VerifyMineSweepTemplate(this.mineInfo);
        if (!itmeTop) {
            var mineInitData = this.mine.createNewMineSweepInitData();
            this.mineInfo = this.mine.getMineSweepInitData(mineInitData);
        }
        var passCdTime = new Date(this.mineInfo['passCdTime']);
        var newCdTime = new Date();
        if (this.mineInfo['cdTime'] > 0) {
            var timeSum = this.mine.getCdTime(this.mineInfo);
            if (!timeSum) {
                var mineInitData = this.mine.createNewMineSweepInitData();
                this.mineInfo = this.mine.getMineSweepInitData(mineInitData);
            }
            var time = Math.floor((newCdTime - passCdTime) / 1000);
            if (time > this.mineInfo['cdTime']) {
                this.mineInfo['cdTime'] = 0;
            } else {
                this.mineInfo['cdTime'] = timeSum - time;
            }
        }
        this.mineInfo['passCdTime'] = utilSql.DateToString(passCdTime);
    } else {
        var mineInitData = this.mine.createNewMineSweepInitData();
        this.mineInfo = this.mine.getMineSweepInitData(mineInitData);
    }
    var resetData = this.mine.createNewMineSweepInitData();
    this.resetInfo = this.mine.getMineSweepInitData(resetData);
};

//（1）上线同步一次
handler.SendMineManager = function () {
    var player = this.owner
    if (null == player) {
        logger.error('SendMineManager玩家是空的');
        return;
    }
    var route = 'ServerMineSweepInitData';
    player.SendMessage(route, this.mineInfo);

};
//（2）根据总关卡ID 获取关卡信息
handler.getMineSweepData = function (mineSweepID) {
    var playerLevel = this.owner.GetPlayerInfo(ePlayerInfo.ExpLevel);   //玩家当前等级
    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);

    var forbidPlayList = playerManager.GetForbidPlayInfo(roleID);
    if (_.isEmpty(forbidPlayList) == false) {
        if (forbidPlayList[gameConst.eCustomSmallType.Mine]
            && new Date() < new Date(forbidPlayList[gameConst.eCustomSmallType.Mine][0])) {
            return errorCodes.IDIP_FORBID_PLAY;
        } else if (forbidPlayList[99] && new Date() < new Date(forbidPlayList[99][0])) {
            return errorCodes.IDIP_FORBID_PLAY;
        }
    }

    var mineSweepTemplate = templateManager.GetTemplateByID('MineSweepTemplate', mineSweepID);
    if (null == mineSweepTemplate) {
        return errorCodes.NoTemplate;
    }
    var needLevel = mineSweepTemplate['limitExpLevel'];
    if (needLevel > playerLevel) {
        logger.warn('player getMineSweepData level less, roleID: %j, mineSweepID: %j', roleID, mineSweepID);
        return errorCodes.ExpLevel;
    }
    this.mineInfo = this.mine.getMineSweepData(mineSweepID, this.owner);
    this._SendMineSweepManager(this.mineInfo);
    return 0;
};
/**判断玩家是否达到vip等级，可以一键领取*/
handler.reacheVipLevel = function () {
    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    if (null == vipTemplate) {
        return errorCodes.NoTemplate;
    }
    if (vipTemplate['isComplete'] == 0) {
        return errorCodes.Mine_NoVipLevel;
    }
    return 0;
};
/**获得所有所有怪物的血量之和*/
handler.monsterAllHp = function () {
    var monsterHp = 0;
    for (var index = 0; index < defaultValue.GridNum; index++) {
        this.mineInfo = this.mine.mineSweepRequestServerChangeState(index, this.mineInfo, this.owner);

        var item = this.mineInfo.items[index];

        while (true) {
            var state = item[eMineSweepField.state];
            if (state == 1) {
                var itemID = item[eMineSweepField.id];
                var mineSweepItemTemplate = templateManager.GetTemplateByID('MineSweepItemTemplate', itemID);
                var type = mineSweepItemTemplate['type'];
                /**type 3 小怪  4 大怪*/
                if (type == 3 || type == 4) {
                    monsterHp += item[eMineSweepField.attValue];
                }
            }
            /**state 3 等待领取  4 死亡*/
            if (state != 3 && state != 4) {
                this.mineInfo = this.mine.mineSweepRequestServerChangeState(index, this.mineInfo, this.owner);
            } else {
                break;
            }
        }
    }
    return monsterHp;
}

/**一键完成*/
handler.oneKeyComplete = function (layerID) {

    var mineSweepLevelTemplate = templateManager.GetTemplateByID('MineSweepLevelTemplate', layerID);
    if (null == mineSweepLevelTemplate) {
        return errorCodes.NoTemplate;
    }
    /**是否是禁止玩家*/
    this.isForbidPlayer();

    /**贵族等级是否满足*/
    this.reacheVipLevel();

    if( this.mineInfo['mineSweepLevelID'] != layerID ) {
        return errorCodes.ParameterWrong;
    }

    /**备份mineInfo*/
    var tempMineInfo = this.mine.copyMineInfo(this.mineInfo);

    /**判断当前血量能否满足杀出所有怪物*/
    var currentHp = this.mineInfo[eMineSweepField.currentHp];
    var monsterHp = this.monsterAllHp();
    if (currentHp < monsterHp) {
        this.mineInfo = tempMineInfo;
        return errorCodes.Mine_NoHp;
    }
    /**一键完成的次数+1*/
    this.mineInfo[eMineSweepField.times] += 1;
    this.mineInfo.type = 0;//0:正常操作(包括一键完成) 1:一键通关未完 2:一键通关完成
    this._SendMineSweepManager(this.mineInfo);
    return errorCodes.OK;
};
/**是否是禁止玩家*/
handler.isForbidPlayer = function () {
    var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
    var forbidPlayList = playerManager.GetForbidPlayInfo(roleID);
    if (_.isEmpty(forbidPlayList) == false) {
        if (forbidPlayList[gameConst.eCustomSmallType.Mine]
            && new Date() < new Date(forbidPlayList[gameConst.eCustomSmallType.Mine][0])) {
            return {'result': errorCodes.IDIP_FORBID_PLAY};
        } else if (forbidPlayList[99] && new Date() < new Date(forbidPlayList[99][0])) {
            return {'result': errorCodes.IDIP_FORBID_PLAY};
        }
    }
    return 0;
};

//(3)请求服务器更改格子状态
handler.mineSweepRequestServerChangeState = function (index) {
    this.isForbidPlayer();
    this.mineInfo = this.mine.mineSweepRequestServerChangeState(index, this.mineInfo, this.owner);
    return {
        'result': 0,
        'index': index,
        'state': this.mineInfo.items[index].state,
        'currentHp': this.mineInfo.currentHp
    };
};

//(4)请求服务器操作
// type 0:重置次数  1：领取小关礼包 2：领取大关礼包 3：清除CD 4：补满HP  5：进入下一关

handler.mineSweepRequestServerDone = function (type) {
    switch (type) {//通过不同的类型调用功能
        case 0://type 0:重置次数
            var vipTop = this.mine.resetTimes(this.mineInfo, this.owner);
            if (vipTop == errorCodes.OK) {
                this.mineInfo = this.resetInfo;
                this._SendMineSweepManager(this.resetInfo);
            } else if (errorCodes.MineSweep == vipTop) {
                return errorCodes.MineSweep;
            } else if (errorCodes.NoAssets == vipTop) {
                return errorCodes.NoAssets;
            } else {
                return errorCodes.ParameterNull;
            }
            break;
        case 1://type 1：领取小关礼包
            var res = this.mine.receiveMineSweepLevelBaoXiang(this.mineInfo, this.owner);
            if (res == 0) {
                this.mineInfo['baoXiang_KillAll'] = 1;
            }
            return res;
            break;
        case 2://type 2：领取大关礼包
            var res = this.mine.receiveMineSweepBaoXiang(this.mineInfo, this.owner);
            if (res == 0) {
                this.mineInfo['baoXiang_ClearLevel'] = 1;
            }
            return res;
            break;
        case 3://type 3：清除CD
            var timeCD = this.mine.removeCDtime(this.mineInfo, this.owner);
            if (errorCodes.NoYuanBao == timeCD) {
                return errorCodes.NoYuanBao;
            } else if (typeof (timeCD) == 'number') {
                return errorCodes.ParameterNull;
            } else {
                this.mineInfo = timeCD;
            }
            break;
        case 4://4：补满HP
            var HPTop = this.mine.addHpMaxValue(this.mineInfo, this.owner);
            if (errorCodes.NoYuanBao == HPTop) {
                return errorCodes.NoYuanBao;
            } else if (typeof (HPTop) == 'number') {
                return errorCodes.ParameterNull;
            } else {
                this.mineInfo = HPTop;
                this.mineInfo['leftReviveTimes'] = 0;
            }
            break;
        case 5:// 5：进入下一关
            var beginTime = new Date(this.mineInfo['passCdTime']).getTime();    //计时开始时间
            var cdTime = (this.mineInfo['cdTime'] > 0 ? this.mineInfo['cdTime'] - 5 : this.mineInfo['cdTime']) * 1000;             //CD时间(给5s的容忍值)
            if (Date.now() < beginTime + cdTime) {
                return errorCodes.Mine_NoFinishCD;
            }

            this.mineInfo = this.mine.getIntoNextCustom(this.mineInfo, this.owner);
            this._SendMineSweepManager(this.mineInfo);
            break;
    }
    return 0;
};

handler._SendMineSweepManager = function (mineInfo) { //同步消息
    //logger.fatal("**********_SendMineSweepManager mineInfo :  %j",mineInfo);
    var player = this.owner;
    if (null == player) {
        logger.error('SendMineManager玩家是空的');
        return;
    }
    if (null == mineInfo) {
        logger.error('SendMineManager this.mineInfo是空的');
        return;
    }
    var route = 'ServerMineSweepInitData';
    player.SendMessage(route, mineInfo);
};
handler.GetSqlStr = function (roleID) {  //数据库保存
    var mineInfo = this.mine.createMineSweepSaveData(this.mineInfo, roleID);
    var strInfo = '(';
    for (var t in mineInfo) {
        if (typeof (mineInfo[t]) == 'string' || mineInfo[t] instanceof Array) {
            strInfo += "'" + mineInfo[t] + "',";
        } else {
            strInfo += mineInfo[t] + ',';
        }
    }
    strInfo = strInfo.substring(0, strInfo.length - 1) + ')';
    var sqlString = utilSql.BuildSqlValues(new Array(mineInfo));
    if (sqlString !== strInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
    }
    return sqlString;
};

handler.Update12Info = function () {
    var player = this.owner;
    var vipLevel = player.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipID = vipLevel + 1;
    var VipTemplate = templateManager.GetTemplateByID('VipTemplate', vipID);
    var mineSweepNum = VipTemplate['mineSweepNum'];
    this.mineInfo['leftTimes'] = mineSweepNum;
    var passCdTime = new Date(this.mineInfo['passCdTime']);
    var newCdTime = new Date();
    var timeSum = this.mine.getCdTime(this.mineInfo);
    if (timeSum > 0) {
        var time = Math.floor((newCdTime - passCdTime) / 1000);
        if (time > timeSum) {
            this.mineInfo['cdTime'] = 0;
        } else {
            this.mineInfo['cdTime'] = timeSum - time;
        }
    }
    this.mineInfo['passCdTime'] = utilSql.DateToString(passCdTime);
    this._SendMineSweepManager(this.mineInfo);
};

handler.SetMineInfoNum = function (vipLevel) { //vip升级
    var player = this.owner;
    var VipInfoManager = player.GetVipInfoManager();
    var vipID = vipLevel + 1;
    var VipTemplate = templateManager.GetTemplateByID('VipTemplate', vipID);
    var mineSweepNum = VipTemplate['mineSweepNum'];
    var vipTop = VipInfoManager.getNumByType(eVipInfo.MineSweepNum);
    var leftTimes = 0;
    if (mineSweepNum - vipTop > 0) {
        leftTimes = mineSweepNum - vipTop;
    }
    this.mineInfo['leftTimes'] = leftTimes;
    this._SendMineSweepManager(this.mineInfo);
};
handler.JumpLayer = function (layer) {
    this.mineInfo['mineSweepLevelID'] = layer;
    var top = this.mine.JumpLayer(this.mineInfo, this.owner);
    if (!top) {
        return;
    }
    this.mineInfo = top;
    this._SendMineSweepManager(this.mineInfo);
};

//一键全部完成魔域
handler.AllKeyComplete = function (layerID) {
    var player = this.owner;

    var mineSweepZuanShi = templateManager.GetTemplateByID('AllTemplate', 244);
    if(!mineSweepZuanShi){
        return errorCodes.NoTemplate;
    }
    var zuanShi = mineSweepZuanShi['attnum'];

    //钻石资产
    var assets = {
        tempID : 1002,
        value : zuanShi
    };
    //判断财产
    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false){
        return errorCodes.NoAssets;
    }

    if( this.mineInfo['mineSweepLevelID'] != layerID ) {
        return errorCodes.ParameterWrong;
    }

    /**备份mineInfo*/
    var tempMineInfo = this.mine.copyMineInfo(this.mineInfo);

    /**判断当前血量能否满足杀第一层出的所有怪物*/
    var currentHp = this.mineInfo[eMineSweepField.currentHp];
    var monsterHp = this.monsterAllHp();//不翻牌 不改状态
    if (currentHp <= monsterHp) {
        this.mineInfo = tempMineInfo;
        return errorCodes.Mine_NoHp;
    }

    if(this.mineInfo['baoXiang_ClearLevel'] == 1){
        return errorCodes.Mine_NoFinishCD;
    }

    /**贵族等级是否满足*/
//    var vip = this.reacheVipLevel();
//    if(vip != 0){
//        return vip;
//    }

        //消耗钻石
    player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], gameConst.eAssetsChangeReason.Reduce.AllKeyComplete);

    /**是否是禁止玩家*/
    var isp = this.isForbidPlayer();
    if(isp != 0){
        return isp;
    }

    for(var i=layerID ; i>1; i++){
        var mineSweepLevelT = templateManager.GetTemplateByID('MineSweepLevelTemplate', i);
        if (null == mineSweepLevelT) {
            return errorCodes.NoTemplate;
        }

        /**备份mineInfo*/
        var tempMineInfo = this.mine.copyMineInfo(this.mineInfo);
        /**判断当前血量能否满足杀出所有怪物*/
        var currentHp = this.mineInfo[eMineSweepField.currentHp];
        var monsterHp = this.monsterAllHp(); //翻牌 该状态为待领取
        if (currentHp <= monsterHp) {
            this.mineInfo = tempMineInfo;
            this.mineInfo.type = 3;//0:正常操作(包括一键完成) 1:一键通关未完 2:一键通关完成（通关） 3:一键通关完成（未通关）
            this._SendMineSweepManager(this.mineInfo);
            //return errorCodes.Mine_NoHp;
            this.mineInfo.type = 0;
            return errorCodes.OK;
        }
        /**一键完成的次数+1*/
        //this.mineInfo[eMineSweepField.times] += 1;
        this.mineInfo.type = 1; //0:正常操作(包括一键完成) 1:一键通关未完 2:一键通关完成（通关） 3:一键通关完成（未通关）
        //自动改变格子状态  领取格子奖励
        for (var index = 0; index < defaultValue.GridNum; index++) {
            this.mineInfo = this.mine.mineSweepRequestServerChangeState(index, this.mineInfo, this.owner);
        }
        //最后一层不发送消息 直接continue
        if(layerID>=1000629 || mineSweepLevelT['nextID']==0){
            i = 0;
            continue;
        }
        this._SendMineSweepManager(this.mineInfo);
        if(this.mineInfo['baoXiang_KillAll'] == 0){
            this.mineSweepRequestServerDone(1); //领取小关卡奖励
        }
        var beginTime = new Date(this.mineInfo['passCdTime']).getTime();    //计时开始时间
        var cdTime = (this.mineInfo['cdTime'] > 0 ? this.mineInfo['cdTime'] - 5 : this.mineInfo['cdTime']) * 1000;             //CD时间(给5s的容忍值)
        if (Date.now() < beginTime + cdTime) {
            return errorCodes.Mine_NoFinishCD;
        }
        this.mineInfo = this.mine.getIntoNextCustom(this.mineInfo, this.owner);

    }
    this.mineInfo.type = 2;//0:正常操作(包括一键完成) 1:一键通关未完 2:一键通关完成（通关） 3:一键通关完成（未通关）
    if(this.mineInfo['baoXiang_KillAll'] == 0){
        this.mineSweepRequestServerDone(1); //领取小关卡奖励
    }
    if(this.mineInfo['baoXiang_ClearLevel'] == 0){
        this.mineSweepRequestServerDone(2); //领取大关卡奖励
        this._SendMineSweepManager(this.mineInfo);
    }
    this.mineInfo.type = 0;
    return errorCodes.OK;
};
