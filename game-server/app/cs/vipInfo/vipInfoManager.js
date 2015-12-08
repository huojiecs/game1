/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 14-7-14
 * Time: 上午11:36
 * To change this template use File | Settings | File Templates.
 */
var gameConst = require('../../tools/constValue');
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var eVipInfo = gameConst.eVipInfo;
var config = require('../../tools/config');

var ePlayerInfo = gameConst.ePlayerInfo;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.roleID = 0;
    this.buyPvpNum = 0;
    this.freeSweepNum = 0;
    this.physicalNum = 0;
    this.freeReliveNum = 0;
    this.mineSweepNum = 0;

/**
 * 额外贵族点数，运营商通过idip调整的，只在idip中才会用到这个
 * 正常贵族点数是以米大师为准的，但如果运营需要调整，则总贵族点数为
 * 米大师返回的值加上底下这个值，这个值也可能是负值
 * */
    this.extraVipPoint = 0;
};

var handler = Handler.prototype;

handler.LoadDataByDB = function (dataList) {
    var self = this;
    if (null != dataList && dataList.length > 0) {

        self.roleID = dataList[eVipInfo.RoleID];
        self.buyPvpNum = dataList[eVipInfo.BuyPVPNum];
        self.freeSweepNum = dataList[eVipInfo.FreeSweepNum];
        self.physicalNum = dataList[eVipInfo.PhysicalNum];
        self.freeReliveNum = dataList[eVipInfo.FreeReliveNum];
        self.mineSweepNum = dataList[eVipInfo.MineSweepNum];
    }
};

/**
 * idip调整vip点数用到，上线时从库中取这个值再和米大师返回的值求合
 * */
handler.LoadExtraVipPoint = function(data) {
    var GameSvrId = this.owner.playerInfo[ePlayerInfo.serverUid];
    var point = null;
    for(var index in data) {
        if(data[index]['serverUid'] == GameSvrId) {
            point = data[index]['point'] || 0;
            break;
        }
    }
    point = point == null ? 0 : point;
    this.extraVipPoint = point;
};

handler.GetExtraVipPoint = function() {
    return this.extraVipPoint || 0;
};

handler.GetSqlStr = function (roleID) {
    var info = '';
    info += '(';
    info += roleID
                + ',' + this.buyPvpNum
                + ',' + this.freeSweepNum
                + ',' + this.physicalNum
                + ',' + this.freeReliveNum
                + ',' + this.mineSweepNum
    ;
    info += ')';
    return info;
};

handler.UpdateVip12Info = function () {
    this.buyPvpNum = 0;
    this.freeSweepNum = 0;
    this.physicalNum = 0;
    this.freeReliveNum = 0;
    this.mineSweepNum = 0;
};


handler.InitNumByType = function (roleID, type, num) {
    var self = this;
    if (this.roleID == 0) {
        this.roleID = roleID;
    }
    switch (type) {
        case eVipInfo.BuyPVPNum:
            self.buyPvpNum = num;
            break;
        case eVipInfo.FreeSweepNum:
            self.freeSweepNum = num;
            break;
        case eVipInfo.PhysicalNum:
            self.physicalNum = num;
            break;
        case eVipInfo.FreeReliveNum:
            self.freeReliveNum = num;
            break;
        case eVipInfo.MineSweepNum:
            self.mineSweepNum = num;
            break;

        default :
            logger.error("重置vip次数有错误类型");
    }
};


//加上用过的次数
handler.setNumByType = function (roleID, type, num) {
    var self = this;
    if (this.roleID == 0) {
        this.roleID = roleID;
    }
    switch (type) {
        case eVipInfo.BuyPVPNum:
            self.buyPvpNum += num;
            break;
        case eVipInfo.FreeSweepNum:
            self.freeSweepNum += num;
            break;
        case eVipInfo.PhysicalNum:
            self.physicalNum += num;
            break;
        case eVipInfo.FreeReliveNum:
            self.freeReliveNum += num;
            break;
        case eVipInfo.MineSweepNum:
            self.mineSweepNum += num;
            break;

        default :
            logger.error("更新vip次数有错误类型");
    }
};

handler.getNumByType = function (type) {
    switch (type) {
        case eVipInfo.BuyPVPNum:
            return this.buyPvpNum;
            break;
        case eVipInfo.FreeSweepNum:
            return this.freeSweepNum;
            break;
        case eVipInfo.PhysicalNum:
            return this.physicalNum;
            break;
        case eVipInfo.FreeReliveNum:
            return this.freeReliveNum;
            break;
        case eVipInfo.MineSweepNum:
            return this.mineSweepNum;
            break;

        default :
            logger.error("get vip次数有错误类型");
    }
};

handler.SendFreeSweepNum = function () {
    var self = this;
    var player = self.owner;
    var vipLevel = player.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }
    var route = "ServerSendFreeWeeepNum";
    var msg = {num: 0};
    if (null !== vipTemplate) {
        msg.num = vipTemplate[templateConst.tVipTemp.freeSweep] - self.freeSweepNum;
    }

//    logger.warn('SendFreeSweepNum, roleID: %j', this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID));

    player.SendMessage(route, msg);
};

//VIP等级升级时重置vip扫荡次数
handler.SetVipInfoNum = function ( vipLevel) {
    var self = this;
    var vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    if (null == vipTemplate) {
        return;
    }
    var sweepNum = self.getNumByType(gameConst.eVipInfo.FreeSweepNum);
    var vipNum = vipTemplate[templateConst.tVipTemp.freeSweep];
    if (vipNum <= 0) {
        return;
    }
    self.InitNumByType(self.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), gameConst.eVipInfo.FreeSweepNum, sweepNum);
    self.SendFreeSweepNum();
};

handler.GetVipTemplate = function () {
    var ownerVipLevel = this.owner.GetPlayerInfo(gameConst.ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == ownerVipLevel || ownerVipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', ownerVipLevel + 1);
    }
    return vipTemplate;
};