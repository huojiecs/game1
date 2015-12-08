/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-30
 * Time: 下午3:48
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');

var eAttInfo = gameConst.eAttInfo;
var eAttLevel = gameConst.eAttLevel;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.attList = new Array(eAttInfo.MAX);      //属性结构attInfo[[[0,0],[0,0]],[[0,0],[0,0]]] // 第一层是属性，第二层是属性层次，第三层区分是真实值还是百分比
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var tempInfo = new Array(eAttLevel.ATTLEVEL_MAX);
        for (var j = 0; j < eAttLevel.ATTLEVEL_MAX; ++j) {
            tempInfo[j] = [0, 0];   //自己真实值，百分比
        }
        this.attList[i] = tempInfo;
    }
    /**
     * 战力列表
     * */
    this.zhanliList = new Array(eAttLevel.ATTLEVEL_MAX);

    this.attValueTimeKey = 0;       //属性时间戳
};

var handler = Handler.prototype;
handler.GetAllAtt = function (roleID) {
    var attInfo = new Array(eAttInfo.MAX);
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        attInfo[i] = this.attList[i][eAttLevel.ATTLEVEL_END][0];
    }
    attInfo.unshift(roleID);
    return attInfo;
};

/**
 * @return {number}
 */
handler.GetAttValue = function (attIndex) {
    if (this.IsTrueAtt(attIndex)) {
        return this.attList[attIndex][eAttLevel.ATTLEVEL_END][0];
    }
    return 0;
};

/**
 * @return {boolean}
 */
handler.IsTrueAtt = function (attIndex) {
    return !!(attIndex >= eAttInfo.ATTACK && attIndex < eAttInfo.MAX);
};

/**
 * @return {boolean}
 */
handler.IsTrueLevel = function (levelIndex) {
    return !!(levelIndex >= 0 && levelIndex < eAttLevel.ATTLEVEL_END);
};

handler.Update = function (levelIndex, attInfo, isAdd) {
    if (this.IsTrueLevel(levelIndex)) {
        for (var i = 0; i < eAttInfo.MAX; ++i) {
            if (isAdd) {
                this.attList[i][levelIndex][0] += attInfo[i][0];
                this.attList[i][levelIndex][1] += attInfo[i][1];
            }
            else {
                this.attList[i][levelIndex][0] -= attInfo[i][0];
                this.attList[i][levelIndex][1] -= attInfo[i][1];
            }
        }
        this.UpdateAtt();
    }
};

handler.UpdateAtt = function () {
    for (var i = 0; i < eAttInfo.MAX; ++i) {
        var attValue = 0;
        for (var j = 0; j < eAttLevel.ATTLEVEL_END; ++j) {
            attValue += this.attList[i][j][0];
            attValue *= (100 + this.attList[i][j][1]) / 100;
        }
        this.attList[i][eAttLevel.ATTLEVEL_END][0] = Math.floor(attValue);
    }
};

handler.SendAttMsg = function (Index) {
    this.SendAttMsgRoute('ServerAttUpdate',Index);
};

handler.SendAttMsgToOther = function (Index, attLevel) {
    this.SendAttMsgRoute('ServerAttUpdateOther', Index, attLevel);
};

handler.SendAttMsgRoute = function (route, Index, attLevel) {
    if (null == this.owner) {
        logger.error('SendAttMsg玩家是空的');
        return;
    }
    this.attValueTimeKey = Date.now() % defaultValues.playerAttTimeKeyMax;
    logger.warn('SendAttMsgRoute, route: %j, roleID: %j, index: %j, value: %j',
                route, this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), Index, this.ConstructMessage(Index, attLevel));
    this.owner.SendMessage(route, this.ConstructMessage(Index, attLevel));
};

handler.ConstructMessage = function (Index, attLevel) {
    var levelAtt = attLevel ? attLevel :eAttLevel.ATTLEVEL_END;
    var temp;
    var playerAttMsg = {
        attList: [],
        attKey: this.attValueTimeKey,
        attLevel:levelAtt
    };
    if (null == Index) {
        for (var index in this.attList) {
            temp = {};
            temp[index] = this.attList[index][levelAtt][0];
            playerAttMsg.attList.push(temp);
        }
    }
    else {
        if (false == this.IsTrueAtt(Index)) {
            return;
        }
        temp = {};
        temp[Index] = this.attList[Index][levelAtt][0];
        playerAttMsg.attList.push(temp);
    }
    return playerAttMsg;
};

/**
 * @return {string}
 */
handler.GetSqlStr = function (roleID) {
    var rows = [];
    var row = [roleID];
    var dataStr = '(' + roleID + ',';
    for (var index in this.attList) {
        var value = this.attList[index][eAttLevel.ATTLEVEL_END][0];
        dataStr += value + ',';

        row.push(value);
    }
    dataStr = dataStr.substring(0, dataStr.length - 1);
    dataStr += ')';

    rows.push(row);

//    return dataStr;

    var sqlString = utilSql.BuildSqlValues(rows);

    if (sqlString !== dataStr) {
        logger.error('sqlString not equal:\n%j\n%j', sqlString, dataStr);
    }

    return sqlString;
};

/**
 * 重算战力， 1， 战力是通过属性计算得到的，
 *           2， 特殊战力需要，单独计算
 *           3, 属性没有不全后续添加
 * @param {number} attLevel 那个类型的属性
 * @param {number} max 有些功能只有基本属性， 加循环上限 提高效率
 * @api public
 * */
handler.computeZhanli = function (attLevel, max) {
    if (!this.IsTrueLevel(attLevel)) {
        return;
    }
    attLevel = attLevel || eAttLevel.ATTLEVEL_END;
    max = max || eAttInfo.MAX;
    var zhanli = 0;
    for (var i = 0; i < max; ++i) {
        var attValue = Math.floor(this.attList[i][attLevel][0] * ((100 + this.attList[i][attLevel][1]) / 100));
        switch (i) {
            case eAttInfo.ATTACK:        //攻击力
                zhanli += attValue * gameConst.eAttFactor.GONGJI;
                break;
            case eAttInfo.DEFENCE:         //防御力
                zhanli += attValue * gameConst.eAttFactor.FANGYU;
                break;
            case eAttInfo.HP:         //HP
                zhanli += attValue * gameConst.eAttFactor.HP;
                break;
            case eAttInfo.MP:         //MP
                zhanli += attValue * gameConst.eAttFactor.MP;
                break;
            case eAttInfo.MAXHP:           //最大血量
                zhanli += attValue * gameConst.eAttFactor.MAXHP;
                break;
            case eAttInfo.MAXMP:           //最大魔法量
                zhanli += attValue * gameConst.eAttFactor.MAXMP;
                break;


            case eAttInfo.CRIT:           //暴击值
                zhanli += attValue * gameConst.eAttFactor.BAOJILV;
                break;
            case eAttInfo.CRITDAMAGE:           //暴击伤害
                zhanli += attValue * gameConst.eAttFactor.BAOJISHANGHAI;
                break;
            case eAttInfo.DAMAGEUP:           //伤害提升
                zhanli += attValue * gameConst.eAttFactor.SHANGHAITISHENG;
                break;
            case eAttInfo.HUNMIREDUCE:           //昏迷
                zhanli += attValue * gameConst.eAttFactor.HUNMI;
                break;
            case eAttInfo.HOUYANGREDUCE:           //后仰
                zhanli += attValue * gameConst.eAttFactor.HOUYANG;
                break;
            case eAttInfo.HPRATE:           //Hp回复速率
                zhanli += attValue * gameConst.eAttFactor.HPHUIFU;
                break;
            case eAttInfo.MPRATE:           //Mp回复速率
                zhanli += attValue * gameConst.eAttFactor.MPHUIFU;
                break;


            case eAttInfo.ANTICRIT:           //暴击抵抗
                zhanli += attValue * gameConst.eAttFactor.BAOJIDIKANG;
                break;
            case eAttInfo.CRITDAMAGEREDUCE:           //暴击伤害减免
                zhanli += attValue * gameConst.eAttFactor.BJSHHJM;
                break;
            case eAttInfo.DAMAGEREDUCE:           //伤害减免
                zhanli += attValue * gameConst.eAttFactor.SHANGHAIJIANMIAN;
                break;
            case eAttInfo.ANTIHUNMI:           //昏迷抵抗
                zhanli += attValue * gameConst.eAttFactor.HUNMIDIKANG;
                break;
            case eAttInfo.ANTIHOUYANG:           //后仰抵抗
                zhanli += attValue * gameConst.eAttFactor.HOUYANGDIKANG;
                break;


            case eAttInfo.ANTIFUKONG:           //浮空抵抗
                zhanli += attValue * gameConst.eAttFactor.FUKONGDIKANG;
                break;
            case eAttInfo.ANTIJITUI:           //击退抵抗
                zhanli += attValue * gameConst.eAttFactor.JITUIDIKANG;
                break;
            case eAttInfo.HUNMIRATE:           //昏迷几率
                zhanli += attValue * gameConst.eAttFactor.HUNMIJILV;
                break;
            case eAttInfo.HOUYANGRATE:           //后仰几率
                zhanli += attValue * gameConst.eAttFactor.HOUYANGJILV;
                break;
            case eAttInfo.FUKONGRATE:           //后仰几率
                zhanli += attValue * gameConst.eAttFactor.FUKONGJILV;
                break;
            case eAttInfo.JITUIRATE:           //击退几率
                zhanli += attValue * gameConst.eAttFactor.JITUIJILV;
                break;

            case eAttInfo.FREEZERATE:          //冰冻几率
                zhanli += attValue * gameConst.eAttFactor.FREEZERATE;
                break;
            case eAttInfo.STONERATE:          //石化几率
                zhanli += attValue * gameConst.eAttFactor.STONERATE;
                break;
            case eAttInfo.ANTIFREEZE:            //冰冻抵抗
                zhanli += attValue * gameConst.eAttFactor.ANTIFREEZE;
                break;
            case eAttInfo.ANTISTONE:           //石化抵抗
                zhanli += attValue * gameConst.eAttFactor.ANTISTONE;
                break;
        }
    }
    this.zhanliList[attLevel] = zhanli;
};

/**
 * 获取战力， 1， 战力是通过属性计算得到的，
 *
 * @param {number} attLevel 那个类型的属性
 * @api public
 * @return {number}
 * */
handler.getZhanli = function (attLevel) {
    if (!this.IsTrueLevel(attLevel)) {
        return 0;
    }
    return this.zhanliList[attLevel];
};

/**
 * 添加战力（累加）， 假战力情况
 *
 * @param {number} attLevel 那个类型的属性
 * @param {number} value 添加战力
 * @api public
 * @return {number}
 * */
handler.addZhanli = function (attLevel, value) {
    if (!this.IsTrueLevel(attLevel)) {
        return 0;
    }
    this.zhanliList[attLevel] += value;
    return value;
};

/**
 * 清空战力
 *
 * @param {number} attLevel 那个类型的属性
 * @api public
 * @return {number}
 * */
handler.clearZhanli = function (attLevel) {
    if (!this.IsTrueLevel(attLevel)) {
        return 0;
    }
    this.zhanliList[attLevel] = 0;
    return this.zhanliList[attLevel];
};

/**
 * 获取指定类型（level）属性
 *
 * @param {number} attLevel 那个类型的属性
 * @param {number} attIndex 属性下标
 * @api public
 * @return {number}
 * */
handler.GetLevelAttValue = function (attLevel, attIndex) {
    if (this.IsTrueAtt(attIndex) && this.IsTrueLevel(attLevel)) {
        return this.attList[attIndex][eAttLevel.ATTLEVEL_END][0];
    }
    return 0;
};

/**
 * 设置指定类型（level）属性
 *
 * @param {number} attLevel 那个类型的属性
 * @param {number} attIndex 属性下标
 * @api public
 * */
handler.SetLevelAttValue = function (attLevel, attIndex, value) {
    if (this.IsTrueAtt(attIndex) && this.IsTrueLevel(attLevel)) {
        this.attList[attIndex][attLevel][0] = value;
    }
};

/**
 * add指定类型（level）属性 累加
 *
 * @param {number} attLevel 那个类型的属性
 * @param {number} attIndex 属性下标
 * @api public
 * @param value
 * */
handler.AddLevelAttValue = function (attLevel, attIndex, value) {
    if (this.IsTrueAtt(attIndex) && this.IsTrueLevel(attLevel)) {
        this.attList[attIndex][attLevel][0] += value;
    }
};

// 添加属性增加的百分比
handler.AddLevelAttPer = function (attLevel, attIndex, value) {
    if (this.IsTrueAtt(attIndex) && this.IsTrueLevel(attLevel)) {
        this.attList[attIndex][attLevel][1] += value;
    }
};

// 为了公会战，提供这个接口
handler.SetLevelAttPer = function (attLevel, attIndex, value) {
    if (this.IsTrueAtt(attIndex) && this.IsTrueLevel(attLevel)) {
        this.attList[attIndex][attLevel][1] = value;
    }
};

/**
 * clear指定类型（level）的属性
 *
 * @param {number} attLevel 那个类型的属性
 * @param {number} max 有些功能只有基本属性， 加循环上限 提高效率
 * @api public
 * */
handler.clearLevelAtt = function (attLevel, max) {
    max = max || eAttInfo.MAX;
    if (this.IsTrueLevel(attLevel)) {
        for (var i = 0; i < max; ++i) {
            this.attList[i][attLevel][0] = 0;
            this.attList[i][attLevel][1] = 0;
        }
    }
};

/**
 * 获取属性时间戳
 * @returns {number|*}
 * @constructor
 */
handler.GetTimeKey = function () {
    return this.attValueTimeKey;
};
