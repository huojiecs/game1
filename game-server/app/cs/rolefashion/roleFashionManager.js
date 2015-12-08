/**
 * The file roleSuitManager.js.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/9/25 16:22:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utils = require('../../tools/utils');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var errorCodes = require('../../tools/errorCodes');
var stringValue = require('../../tools/stringValue');
var utilSql = require('../../tools/mysql/utilSql');

var ePlayerInfo = gameConst.ePlayerInfo;
var eFashionSuitInfo = gameConst.eFashionSuitInfo;
var eFashionStats = gameConst.eFashionStats;
var eAttLevel = gameConst.eAttLevel;
var ePlayerEventType = gameConst.ePlayerEventType;
var ePlayerDB = gameConst.ePlayerDB;
var eAttInfo = gameConst.eAttInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var _ = require('underscore');
var Q = require('q');

var MAX_ATT = eAttInfo.MAX;
var MAX_ATT_INDEX = 4;

/**
 * 玩家时装管理器
 * */
module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    /** 管理器owner*/
    this.owner = owner;
    /** 时装状态列表*/
    this.suits = {};

};

var handler = Handler.prototype;

/**
 * add check event
 * @api private
 * */
var addCheckEvent = function (owner, manager) {
    for (var key in manager.suits) {
        if (manager.suits[key][eFashionSuitInfo.STATS] == eFashionStats.NO) {
            owner.on(ePlayerEventType.CollectFashionSuit, function () {
                owner.GetRoleFashionManager().checkFashionSuitStats(true);
            });
            break;
        }
    }
};

/**
 * 玩家财产添加时装碎片时，检查时装是否达到开启条件并开启
 * @api public
 */
handler.checkFashionSuitStats = function (isSend) {
    var owner = this.owner;
    var computeFlag = false;
    var noticeFlag = false;

    for (var id in this.suits) {
        var temp = this.suits[id];
        if (!!temp && temp[eFashionSuitInfo.STATS] == eFashionStats.NO) {
            var template = getTemplateById(temp[eFashionSuitInfo.SUITID]);
            if (!!template) {
                var value = owner.assetsManager.GetAssetsValue(template.suiPianID);
                if (!!value && value >= template.suiPianNum) {
                    logger.info('set role: %d fashion suit %s stats to 1 whith value: %d', owner.id, template.suiPianID,
                                value);
                    this.SetFashionSuitValue(id, 1);

                    //添加时装的激活时间  用于限时时装倒计时计算
                    var isTimeFashion = template.isTimeFashion; //是否是时效时装
                    logger.fatal("^^^^^jihuo Fashion isTimeFashion :%j  ,  openTime  %j", isTimeFashion, utilSql.DateToString(new Date(this.suits[id][eFashionSuitInfo.OPENTIME])));
                    if(isTimeFashion && utilSql.DateToString(new Date("1970-01-01 00:00:00")) == utilSql.DateToString(new Date(this.suits[id][eFashionSuitInfo.OPENTIME]))){
                        this.suits[id][eFashionSuitInfo.OPENTIME] =  utilSql.DateToString(new Date());
                    }

                    //公告
                    var noticeID = "fashion_" + id;
                    this.owner.GetNoticeManager().SendRepeatableGM(gameConst.eGmType.Fashion, noticeID);

                    computeFlag = true;
                }
            }
        }
    }

    if (computeFlag) {
        this.computeAttAndZhanli(isSend);
    }


};

/**
 * Brief: 玩家销毁事件
 *  1, 添加销毁事件, 防止泄露
 * -------------------------
 * @api private
 *
 * */
handler.destroy = function () {
    this.suits = null;
    if (!!this.owner) {
        this.owner.removeAllListeners(ePlayerEventType.CollectFashionSuit);
    }
    this.owner = null;
};

/**
 * 属性战力重算
 * @api public
 */
handler.computeAttAndZhanli = function (isSend) {
    /** 属性管理器*/
    var attManager = this.owner.attManager;
    /** 获取原来战力 */
    var oldZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_FASHION);
    if (null == oldZhanli) {
        oldZhanli = 0;
    }
    /**清除原来套装属性加成*/
    attManager.clearLevelAtt(eAttLevel.ATTLEVEL_FASHION, MAX_ATT);
    /** 清除战力 */
    attManager.clearZhanli(eAttLevel.ATTLEVEL_FASHION);
    for (var key in this.suits) {
        var temp = this.suits[key];
        if (temp[eFashionSuitInfo.STATS] != eFashionStats.NO) {
            var template = getTemplateById(temp[eFashionSuitInfo.SUITID]);
            if (!!template) {
                //添加套装属性
                addSuitSuit(temp, template, attManager, MAX_ATT_INDEX);
            }
        }
    }

    /** 重算玩家所有属性*/
    attManager.UpdateAtt();
    /** 重算玩家时装战力*/
//    attManager.computeZhanli(eAttLevel.ATTLEVEL_FASHION, MAX_ATT);
    /** 重新获取战力*/
    var newZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_FASHION);
    /**发布战力更新*/
    this.owner.UpdateZhanli(Math.floor((newZhanli - oldZhanli)), (newZhanli - oldZhanli) > 0 ? true : false, isSend);
    /**通知客户属性变更*/
    this.owner.attManager.SendAttMsg(null);
};


/**
 * 清除到期的時裝戰力
 * @api public
 */
handler.delFashionZhanli = function (isSend) {
    /** 属性管理器*/
    var attManager = this.owner.attManager;
    /** 获取原来战力 */
    var oldZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_FASHION);
    if (null == oldZhanli) {
        oldZhanli = 0;
    }
    /**清除原来套装属性加成*/
    attManager.clearLevelAtt(eAttLevel.ATTLEVEL_FASHION, MAX_ATT);
    /** 清除战力 */
    attManager.clearZhanli(eAttLevel.ATTLEVEL_FASHION);
    for (var key in this.suits) {
        var temp = this.suits[key];
        if (temp[eFashionSuitInfo.STATS] != eFashionStats.NO) {
            var template = getTemplateById(temp[eFashionSuitInfo.SUITID]);
            if (!!template) {
                //添加套装属性
                addSuitSuit(temp, template, attManager, MAX_ATT_INDEX);
            }
        }
    }

    /** 重算玩家所有属性*/
    attManager.UpdateAtt();
    /** 重算玩家时装战力*/
//    attManager.computeZhanli(eAttLevel.ATTLEVEL_FASHION, MAX_ATT);
    /** 重新获取战力*/
    var newZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_FASHION);
    /**发布战力更新*/
    this.owner.UpdateZhanli(Math.floor((newZhanli - oldZhanli)), (newZhanli - oldZhanli) < 0 ? true : false, isSend);
    /**通知客户属性变更*/
    this.owner.attManager.SendAttMsg(null);
};


/**
 * 添加一件套装属性
 * @param {Array} suit 套装数据
 * @param {Object} template  套装模板数据
 * @param {Object} attManager  玩家属性管理器
 * @param {number} max  最大属性索引
 * @api private
 * @return {number} 状态： 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
 */
var addSuitSuit = function (suit, template, attManager, max) {
    for (var i = 0; i < max; ++i) {
        var attID = template['att_' + i];
        var attNum = template['attValue_' + i];
        attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_FASHION, attID, attNum);
    }
    /** 添加假战力*/
    attManager.addZhanli(eAttLevel.ATTLEVEL_FASHION, template.baseZhanli);
};

/**
 * 获取时装状态
 * @param {string} suitID 时装ID
 * @api public
 * @return {number} 状态： 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
 */
handler.GetFashionSuitValue = function (suitID) {
    return this.suits[suitID][eFashionSuitInfo.STATS];
};

/**
 * 设置时装状态
 * @param {string} suitID 时装ID
 * @param {number} stats 时装stats 状态： 0:未解锁1：未激活（已解锁）2:已激活（已解锁）
 * @api public
 */
handler.SetFashionSuitValue = function (suitID, stats) {
    this.suits[suitID][eFashionSuitInfo.STATS] = stats;
};

/**
 * 重数据库加载数据：1, 如果数据为空， 初始化数据
 *                  2, 否， 则赋值给 suits
 *
 * */
handler.LoadDataByDB = function (suitInfo) {

    var self = this;
    if (null == suitInfo || suitInfo.length == 0) {
        this.suits = initSuitData(this.owner.GetPlayerInfo(ePlayerInfo.ROLEID));
        /**时装 初始化 添加模板数据*/
        this.owner.addDirtyTemplate(ePlayerDB.FashionSuit, this.GetSqlStr());
        this.checkFashionSuitStats(false);
    } else {

        _.each(suitInfo, function (suit, suitId) {
            self.suits[suit[eFashionSuitInfo.SUITID]] = suit;

            suit[eFashionSuitInfo.OPENTIME] = utilSql.DateToString(new Date(suit[eFashionSuitInfo.OPENTIME]));


        });

        /** 新增时装 兼容 处理*/
        addNewSuitData(this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), this.suits);

        /**登陆战力计算*/
        this.computeAttAndZhanli(false);
    }

    //添加事件监听
    addCheckEvent(this.owner, this);
};


// 返还多余的碎片
handler.returnRedundantFrag = function(){
    var self = this;
    var shopFrag = globalFunction.GetShopFragment();
    var trueConsume = 0;
    for( var id in self.suits) {
        var temp = this.suits[id];
        if (temp != null && temp[eFashionSuitInfo.STATS] != eFashionStats.NO) {
            var template = getTemplateById(temp[eFashionSuitInfo.SUITID]);
            if (template != null) {
                var value = this.owner.assetsManager.GetAssetsValue(template.suiPianID);
                if (value != null && value > template.suiPianNum) {
                    if(shopFrag[template.suiPianID.toString()] != null){
                        var consume = shopFrag[template.suiPianID.toString()]['attNum'];
                        if (consume != null) {
                            var dec = value - template.suiPianNum;
                            consume *= dec;
                            this.owner.assetsManager.AlterAssetsValue(template.suiPianID, -dec);
                            trueConsume += consume;
                        }
                    }
                }
            }
        }
    }

    if(trueConsume > 0){
        var roleID = this.owner.GetPlayerInfo(ePlayerInfo.ROLEID);
        var mailDetail = {
            recvID: roleID,
            subject: stringValue.sMsString.sendName,
            mailType: gameConst.eMailType.System,
            content: stringValue.sAdminCommandsString.fixShizhuang,
            items: [[1002, trueConsume]]
        };
        pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err) {
            if (!!err) {
                logger.error('callback error: %s', utils.getErrorMessage(err));
            }
        });
    }
}



/**
 * 初始化套装状态数据
 * @param {number} roleID 玩家id
 * @api private
 * @param {Array} 玩家初始化时装列表
 * */
var initSuitData = function (roleID) {
    var ids = getFashionTemplateIds();
    var suits = {};
    for (var id in ids) {
        suits[ids[id]] = [roleID, ids[id], 0, utilSql.DateToString(new Date("1970-01-01 00:00:00"))];
    }
    return suits;
};

/**
 * @Brief: 添加新时装， 增量添加
 * ---------------------------
 *
 *
 * @param {number} roleID 玩家id
 * @param {Object} suits 时装id
 * @api private
 * */
var addNewSuitData = function (roleID, suits) {


    /** 新增时装 兼容 处理*/
    var ids = getFashionTemplateIds();
    if (ids.length <= _.size(suits)) {
        return ;
    }

    for (var id in ids) {
        if (!suits[ids[id]]) {
            suits[ids[id]] = [roleID, ids[id], 0, utilSql.DateToString(new Date("1970-01-01 00:00:00"))];
        }
    }
    return suits;
};

/**
 * 获取时装套装 id列表
 * @api private
 * @return {Array} id列表数据
 * */
var getFashionTemplateIds = function () {
    var FashionTemplates = templateManager.GetAllTemplate('FashionTemplate');
    if (null == FashionTemplates) {
        logger.error('fashion suit template: {FashionTemplate all} not exists error !!!!');
        return [];
    }
    return _.keys(FashionTemplates).sort();
};

/**
 * get tempate with attID
 * @param {string} attrID  时装模板id
 * @api private
 * @return {object}
 * */
var getTemplateById = function (attID) {
    var FashionTemplates = templateManager.GetAllTemplate('FashionTemplate');
    if (null == FashionTemplates) {
        logger.error('fashion suit template: {FashionTemplate all} not exists error !!!!');
        return null;
    }
    var template = FashionTemplates[attID];
    if (null == template) {
        logger.error('fashion suit template: { id -> %d } not exists error !!!!', attID);
        return null;
    }
    return template;
};

/**
 * 激活套装
 * @param {string} attID 时装id
 * @api public
 * @return {number}
 * */
handler.Activate = function (attID) {
    var template = getTemplateById(attID);
    if (null == template) {
        return errorCodes.SystemWrong;
    }
    if (this.GetFashionSuitValue(attID) == 0) {
        return errorCodes.Suit_NoActivate;
    }
    if (template.type == 0) {
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveFashionWeaponID, attID);
    } else {
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveFashionEquipID, attID);
    }
    return 0;
};

/**
 * 取消套装激活
 * @param {string} attID 时装id
 * @api public
 * @return {number}
 * */
handler.UnActivate = function (attID) {
    var template = getTemplateById(attID);
    if (null == template) {
        return errorCodes.SystemWrong;
    }
    if (this.GetFashionSuitValue(attID) == 0) {
        return errorCodes.Suit_NoActivate;
    }
    if (template.type == 0) {
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveFashionWeaponID, 0);
    } else {
        this.owner.SetPlayerInfo(gameConst.ePlayerInfo.ActiveFashionEquipID, 0);
    }
    return 0;
};

/**
 * 获取存储字符串
 * @return {string}
 */
handler.GetSqlStr = function () {
    var rows = [];

    var suitInfo = '';
    for (var index in this.suits) {
        var temp = this.suits[index];

        suitInfo += '(';
        var row = [];

        for (var i = 0; i < eFashionSuitInfo.MAX; ++i) {
            var value = temp[i];
            if (typeof  value == 'string') {
                suitInfo += '\'' + value + '\'' + ',';
            }
            else {
                suitInfo += value + ',';
            }

            row.push(value);
        }
        suitInfo = suitInfo.substring(0, suitInfo.length - 1);
        suitInfo += '),';

        rows.push(row);
    }
    suitInfo = suitInfo.substring(0, suitInfo.length - 1);
    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== suitInfo) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, suitInfo);
    }
    return sqlString;
};

//获取玩家限时时装的时间
handler.GetFashionTime = function (callback) {
    var result = [];
    var self = this;
    _.map(self.suits, function (suit,suitId) {
        var temp = templateManager.GetTemplateByID('FashionTemplate', suitId);
        if(temp == null || temp.fashionLeftTime <= 0){
            return;
        }
        //说明是限时时装 计算当前时间看是否过期  没有过期则开始倒计时
        var openDate = new Date(suit[eFashionSuitInfo.OPENTIME]);
        var nowDate = new Date();
        var openTime = openDate.getTime();
        var nowTime = nowDate.getTime();
        //限时小时数
        var temp = templateManager.GetTemplateByID('FashionTemplate', suitId);
        var hours = temp.fashionLeftTime;
        var leftTime = hours * 3600 * 1000;
        var res = {
            fashionID:suitId,
            leftTime: (openTime + leftTime - nowTime)/1000
        }
        result.push(res);
    });

    var msg = {
        result : errorCodes.OK,
        fashionList : result
    };
    logger.fatal("^^^^^ GetFashionTime roleID: %j , msg : %j",this.owner.id, msg);
    callback(null, msg);
}

//同步0收益剩余时间消息
handler.SendFashionTime = function (fashionId) {
    var self = this;
    var route = "ServerSendFashionTime";
    var msg = {fashionID: fashionId};
    self.owner.SendMessage(route, msg);

};





