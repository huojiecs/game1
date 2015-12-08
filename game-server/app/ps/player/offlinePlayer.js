/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-19
 * Time: 下午3:24
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var csUtil = require('../../cs/csUtil');
var util = require('util');
var Character = require('./../../cs/csObject/Character');
var gameConst = require('../../tools/constValue');
var ePlayerInfo = gameConst.ePlayerInfo;
var eAttInfo = gameConst.eAttInfo;
var eAttLevel = gameConst.eAttLevel;
var eEntityType = gameConst.eEntityType;
var templateManager = require('../../tools/templateManager');
var AssetsManager = require('./../../cs/assets/assetsManager');
var itemManager = require('../../cs/item/itemManager');
var EquipManager = require('./../../cs/equip/equipManager');
var soulManager = require('./../../cs/soul/soulManager');
var magicSoulManager = require('./../../cs/magicSoul/magicSoulManager');
var petManager = require('../../cs/pet/petManager');
var asyncPvPManager = require('./../../cs/pvp/asyncPvPManager');
var skillManager = require('./../../cs/skill/skillManager');
var runeManager = require('./../../cs/skill/runeManager');
var templateConst = require('../../../template/templateConst');
var utilSql = require('../../tools/mysql/utilSql');
var redisManager = require('./../../cs/chartRedis/redisManager');
var detailUtils = require('../../tools/redis/detailUtils');
var utils = require('../../tools/utils');
var _ = require('underscore');
var defaultValues = require('../../tools/defaultValues');
var toMarryManager = require('./../../cs/marry/toMarryManager');

var tRoleInit = templateConst.tRoleInit;
var eJJCInfo = gameConst.eJJCInfo;

var Handler = function (opts) {

    if (opts == null) {
        opts = {
            name: "name",
            id: 0,
            type: eEntityType.OFFLINEPLAYER,
            y: 0,
            x: 0,
            z: 0
        }
    }

    Character.call(this, opts);
    this.userId = null;
    this.serverId = null;
    this.playerInfo = new Array(ePlayerInfo.MAX);
    this.equipManager = new EquipManager();
    this.assetsManager = new AssetsManager(this);
    this.itemManager = new itemManager(this);
    this.soulManager = new soulManager(this);
    this.asyncPvPManager = new asyncPvPManager(this);
    this.magicSoulManager = new magicSoulManager(this);
    if (defaultValues.IsPetOpening) {
        this.petManager = new petManager(this);
    }
    this.toMarryManager = new toMarryManager(this);
    this.jjcInfo = null;
};

util.inherits(Handler, Character);

module.exports = Handler;

var handler = Handler.prototype;

/**
 * @return {number}
 */
handler.GetJobType = function () {
    var tempID = this.playerInfo[ePlayerInfo.TEMPID];
    var InitTemplate = templateManager.GetTemplateByID('InitTemplate', tempID);
    if (null == InitTemplate) {
        return 0;
    }
    return InitTemplate[tRoleInit.profession];
};

handler.GetAssetsManager = function () {
    return this.assetsManager;
};

handler.LoadDataByDB = function (roleID, callback) {
    var self = this;

    csUtil.LoadOfflinePlayerInfo(roleID, function (err, DBData) {
        if (!!err) {
            logger.error('roleID: %s LoadDataByDB LoadOfflinePlayerInfo failed, error: %s', roleID,
                         utils.getErrorMessage(err));
            return callback(err);
        }

        logger.info('LoadOfflinePlayerInfo, roleID: %j, date: %j', roleID, DBData);

        self.playerInfo = DBData['PLAYERDB_PLAYERINFO'];
        self.playerInfo[gameConst.ePlayerInfo.NickName] =
        utilSql.MysqlDecodeString(self.playerInfo[gameConst.ePlayerInfo.NickName]);
        var expLevel = self.playerInfo[ePlayerInfo.ExpLevel];
        var oldLogin = new Date(self.playerInfo[ePlayerInfo.LoginTime]);

        var PlayerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
        if (PlayerAttTemplate) {
            var attInfo = new Array(eAttInfo.MAX);
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                var temp = [0, 0];
                attInfo[i] = temp;
            }
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                attInfo[i][0] = PlayerAttTemplate['att_' + i];
            }
            self.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, attInfo, true);
        }

        self.itemManager.LoadDataByDB(DBData['PLAYERDB_ITEM'][0], DBData['PLAYERDB_ITEM'][1],
                                      function (itemLogic, roleID, itemGuid, newItem) {
                                          itemLogic.EquipOnWithoutCheck(newItem, itemGuid, self, true);
                                      });
        self.assetsManager.LoadDataByDB(DBData['PLAYERDB_ASSETS']);
        self.soulManager.LoadDataByDB(DBData['PLAYERDB_SOUL'], true);
        self.asyncPvPManager.LoadInfo(DBData['AsyncPvPInfo'], true);
        self.magicSoulManager.LoadDataByDB(DBData['PLAYERDB_MAGICSOUL']);
        if (defaultValues.IsPetOpening) {
            self.petManager.LoadDataByDB(DBData['PLAYERDB_PET']);
        }
        self.toMarryManager.LoadDataByDBByOffine(DBData['PLAYERDB_TOMARRY'], true);
        self.jjcInfo = DBData['PLAYERDB_JJC'];
        return callback(null);
    });
};

handler.LoadDetailToRedisDataByDB = function (roleID, refreshFunc, callback) {
    var self = this;
    var args = [].slice.call(arguments);
    callback = args.pop();
    refreshFunc = null;

    if (args.length > 0) {
        roleID = args[0];
    }
    if (args.length > 1) {
        refreshFunc = args[1];
    }

    csUtil.LoadDetailToRedisPlayerInfo(roleID, function (err, DBData) {
        if (!!err) {
            logger.error('roleID: %s LoadDetailToRedisDataByDB LoadDetailToRedisPlayerInfo failed, error: %s', roleID,
                         utils.getErrorMessage(err));
            return callback(err);
        }
//        logger.warn('LoadDetailToRedisDataByDB, roleID: %j, date: %j', roleID, JSON.stringify(DBData));

        self.skillManager = new skillManager(self);
        self.runeManager = new runeManager(self);

        self.playerInfo = DBData['PLAYERDB_PLAYERINFO'];

        if (!!self.playerInfo[gameConst.ePlayerInfo.NickName]) {
            self.playerInfo[gameConst.ePlayerInfo.NickName] =
            utilSql.MysqlDecodeString(self.playerInfo[gameConst.ePlayerInfo.NickName]);
        }

        var expLevel = self.playerInfo[ePlayerInfo.ExpLevel];
        var oldLogin = new Date(self.playerInfo[ePlayerInfo.LoginTime]);

        var PlayerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
        if (PlayerAttTemplate) {
            var attInfo = new Array(eAttInfo.MAX);
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                var temp = [0, 0];
                attInfo[i] = temp;
            }
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                attInfo[i][0] = PlayerAttTemplate['att_' + i];
            }
            self.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, attInfo, true);
        }

        self.itemManager.LoadDataByDB(DBData['PLAYERDB_ITEM'][0], DBData['PLAYERDB_ITEM'][1],
                                      function (itemLogic, roleID, itemGuid, newItem) {
                                          itemLogic.EquipOnWithoutCheck(newItem, itemGuid, self, true);
                                      });
        self.soulManager.LoadDataByDB(DBData['PLAYERDB_SOUL'], true);
        self.magicSoulManager.LoadDataByDB(DBData['PLAYERDB_MAGICSOUL']);
        self.skillManager.LoadDataByDB(DBData['PLAYERDB_SKILLS']);
        self.runeManager.LoadDataByDB(DBData['PLAYERDB_RUNE']);
        if (defaultValues.IsPetOpening) {
            self.petManager.LoadDataByDB(DBData['PLAYERDB_PET']);
        }
        self.jjcInfo = DBData['PLAYERDB_JJC'];
        var zippedInfo;
        if (refreshFunc) {
            zippedInfo = refreshFunc();
        } else {
            zippedInfo = self.refreshDetailToRedis();
        }
        return callback(null, zippedInfo);
    });
};

/**
 * copy from player.js
 * */
handler.refreshDetailToRedis = function () {
    var jjcInfo = this.jjcInfo;
    /**获取存储列表*/
    var playerList = {
        playerInfo: this.playerInfo,
        itemList: this.itemManager.GetEquipInfo(),
        soulList: this.soulManager.GetAllSoulInfo(),
        attList: this.attManager.GetAllAtt(),
        magicSoulList: this.magicSoulManager.GetMagicSoulAllInfo(),
        skillList: this.skillManager.GetAllSkillInfo(),
        runeList: this.runeManager.getAllRuneInfo(),
        bianShenAttList: this.soulManager.GetBianShenAttr(),
        petList: defaultValues.IsPetOpening ? this.petManager.GetCarryPetInfo() : [],
        jjcInfo: {
            'roleID': jjcInfo[eJJCInfo.ROLEID] || 0,
            'ranking': 0,
            'roleName': '',
            'friendName': '',
            'zhanli': 0,
            'openID': '',
            'picture': '',
            'expLevel': 0,
            'serverName': '',
            'credits': jjcInfo[eJJCInfo.CREDIS] || 0,
            'jjcCoin': 0,
            'winNum': jjcInfo[eJJCInfo.WINNUM] || 0,
            'winRate': Math.floor((jjcInfo[eJJCInfo.WINNUM] / jjcInfo[eJJCInfo.TOTALNUM]) * 100) || 0,
            'streaking': 0,
            'maxStreaking': 0,
            'phase': ( '' + jjcInfo[eJJCInfo.Phase] || '')

        }
    };
    var roleID = this.playerInfo[ePlayerInfo.ROLEID];

    /**数据添加到redis */
    var client = redisManager.getClient(gameConst.eRedisClientType.Chart);

    var zipped = detailUtils.zip(playerList);
    client.hSet(redisManager.getRoleDetailSetName(), roleID, zipped, function (err, data) {
        if (!!err) {
            logger.error('refreshDetailToRedis error: %s', utils.getErrorMessage(err));
        }
    });

    return zipped;
}
;

handler.LoadOfflineDataByDB = function (roleID, callback) {
    var self = this;

    csUtil.LoadOfflinePlayerInfo(roleID, function (err, DBData) {
        if (!!err) {
            logger.error('roleID: %s LoadOfflineDataByDB LoadOfflinePlayerInfo failed, error: %s', roleID,
                         utils.getErrorMessage(err));
            return callback(err);
        }
        logger.warn('LoadOfflinePlayerInfo, roleID: %j, date: %j', roleID, JSON.stringify(DBData));

        self.playerInfo = DBData['PLAYERDB_PLAYERINFO'];

        if (!!self.playerInfo[gameConst.ePlayerInfo.NickName]) {
            self.playerInfo[gameConst.ePlayerInfo.NickName] =
            utilSql.MysqlDecodeString(self.playerInfo[gameConst.ePlayerInfo.NickName]);
        }

        var expLevel = self.playerInfo[ePlayerInfo.ExpLevel];
        var oldLogin = new Date(self.playerInfo[ePlayerInfo.LoginTime]);

        var PlayerAttTemplate = templateManager.GetTemplateByID('PlayerAttTemplate', expLevel);
        if (PlayerAttTemplate) {
            var attInfo = new Array(eAttInfo.MAX);
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                var temp = [0, 0];
                attInfo[i] = temp;
            }
            for (var i = 0; i < eAttInfo.MAX; ++i) {
                attInfo[i][0] = PlayerAttTemplate['att_' + i];
            }
            self.UpdateAtt(eAttLevel.ATTLEVEL_JICHU, attInfo, true);
        }

        self.itemManager.LoadDataByDB(DBData['PLAYERDB_ITEM'][0], DBData['PLAYERDB_ITEM'][1],
                                      function (itemLogic, roleID, itemGuid, newItem) {
                                          itemLogic.EquipOnWithoutCheck(newItem, itemGuid, self, true);
                                      });
        self.assetsManager.LoadDataByDB(DBData['PLAYERDB_ASSETS']);
        self.soulManager.LoadDataByDB(DBData['PLAYERDB_SOUL'], true);
        self.asyncPvPManager.LoadInfo(DBData['AsyncPvPInfo'], true);
        self.magicSoulManager.LoadDataByDB(DBData['PLAYERDB_MAGICSOUL']);
        if (defaultValues.IsPetOpening) {
            self.petManager.LoadDataByDB(DBData['PLAYERDB_PET']);
        }
        self.toMarryManager.LoadDataByDBByOffine(DBData['PLAYERDB_TOMARRY'], true);
        return callback(null);
    });
};

handler.UpdateAtt = function (attLevel, attInfo, isAdd) {
    this.attManager.Update(attLevel, attInfo, isAdd);
};

handler.UpdateZhanli = function (value, isAdd) {
    /* if (isAdd) {
     this.playerInfo[ ePlayerInfo.ZHANLI ] += value;
     }
     else {
     this.playerInfo[ ePlayerInfo.ZHANLI ] -= value;
     }*/
};

/**
 * @return {boolean}
 */
handler.IsTrueIndex = function (Index) {
    return !!(Index >= 0 && Index < ePlayerInfo.MAX);
};

/**
 * @return {number}
 */
handler.GetPlayerInfo = function (Index) {
    if (this.IsTrueIndex(Index)) {
        return this.playerInfo[Index];
    }
    return 0;
};

/**
 * @return {null}
 */
handler.ModifyPlayerInfo = function (infoIndex, value, minValue, maxValue) {
    if (this.IsTrueIndex(infoIndex)) {
        var old = this.playerInfo[infoIndex];
        var newValue = old + value;
        if (minValue != null && newValue < minValue) {
            newValue = minValue;
        }
        if (maxValue != null && newValue > maxValue) {
            newValue = maxValue;
        }
        this.playerInfo[infoIndex] = newValue;
        return old;
    }
    return null;
};

handler.GetSqlStr = function () {
    this.playerInfo[gameConst.ePlayerInfo.LoginTime] =
    utilSql.DateToString(new Date(this.playerInfo[gameConst.ePlayerInfo.LoginTime]));
    var tempPlayerInfo = _.clone(this.playerInfo);
    tempPlayerInfo[gameConst.ePlayerInfo.NickName] =
    utilSql.MysqlEncodeString(tempPlayerInfo[gameConst.ePlayerInfo.NickName]);
    return tempPlayerInfo;
};