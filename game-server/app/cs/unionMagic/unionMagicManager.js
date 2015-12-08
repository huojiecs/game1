/**
 * 公会技能管理
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var templateManager = require('../../tools/templateManager');
var defaultValues = require('../../tools/defaultValues');
var templateConst = require('../../../template/templateConst');
var csSql = require('../../tools/mysql/csSql');
var errorCodes = require('../../tools/errorCodes');
var unionMagic = require('./unionMagic');
var ePlayerInfo = gameConst.ePlayerInfo;
var eUnionMagicInfo = gameConst.ePlayerMagicInfo;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eAttInfo = gameConst.eAttInfo;
var _ = require('underscore');


var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
var eMoneyChangeType = gameConst.eMoneyChangeType;
var eTableTypeInfo = gameConst.eTableTypeInfo;
var log_utilSql = require('../../tools/mysql/utilSql');
var eAttLevel = gameConst.eAttLevel;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.magicList = {};
};

var handler = Handler.prototype;


// 从数据库读取
handler.LoadDataByDB = function (List) {
    for (var index in List) {
        var magicID = List[index][eUnionMagicInfo.TempID];
        var temp = new unionMagic();
        temp.SetMagicAllInfo(List[index]);
        this.magicList[magicID] = temp;
    }
    this.UpdateAttr( false);
};

handler.GetSqlStr = function () {
    return "";
};

// 存盘
handler.SaveUnionPlayerMagic = function () {
    var sqlStr = utilSql.BuildSqlStringFromObjects(this.magicList, 'GetMagicInfo', eUnionMagicInfo);
    csSql.SaveUnionPlayerMagic(this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID), sqlStr, function (err) {
        if (!!err) {
            logger.error("save UnionMagic info error=%s", err.stack);
        }
    });
};

// 升级技能等级  maxLevel 不能超过的等级
handler.UpdateMagicLevel = function ( magicID, maxLevel) {
    var player = this.owner;
    if(player == null || magicID == null || maxLevel == null || maxLevel <= 0){
        return  { 'result': errorCodes.ParameterNull };
    }

    var magicObject = this.magicList[magicID];

    var magicLevel = magicObject != null ? magicObject.GetMagicInfo(eUnionMagicInfo.MagicLevel) : 0;

    var magicAllTemplate = templateManager.GetTemplateByID('UnionMagicAllTemplate', magicID);
    if(magicAllTemplate == null){
        return  { 'result': errorCodes.NoTemplate };
    }

    // 不能超过最大等级
    if( ++magicLevel > magicAllTemplate['maxLevel']){
        return  { 'result': errorCodes.UnionPlayerMagicLevel };
    }

    if(magicLevel > maxLevel ){
        return  { 'result': errorCodes.UnionMagicLevelOver };
    }

    var magicTempID = (magicID * 100) + magicLevel;
    var magicTemplate = templateManager.GetTemplateByID('UnionMagicLevelTemplate', magicTempID);
    if(magicTemplate == null){
        return  { 'result': errorCodes.NoTemplate };
    }

    if (magicTemplate['consumeID1'] != null && magicTemplate['consumeID1'] > 0
        && player.assetsManager.CanConsumeAssets(magicTemplate['consumeID1'], magicTemplate['consumeNum1']) == false) {
        return  { 'result': errorCodes.NoAssets };
    }

    if (magicTemplate['consumeID2'] != null && magicTemplate['consumeID2'] > 0
        && player.assetsManager.CanConsumeAssets(magicTemplate['consumeID2'], magicTemplate['consumeNum2']) == false) {
        return  { 'result': errorCodes.NoAssets };
    }

    if(magicTemplate['consumeID1'] != null && magicTemplate['consumeID1'] > 0){
        player.assetsManager.AlterAssetsValue(magicTemplate['consumeID1'], -magicTemplate['consumeNum1'], gameConst.eAssetsChangeReason.Reduce.UnionMagicLearn);
    }
    if(magicTemplate['consumeID2'] != null && magicTemplate['consumeID2'] > 0){
        player.assetsManager.AlterAssetsValue(magicTemplate['consumeID2'], -magicTemplate['consumeNum2'], gameConst.eAssetsChangeReason.Reduce.UnionMagicLearn);
    }

    var roleID = player.GetPlayerInfo(ePlayerInfo.ROLEID);

    if(magicObject == null){
        magicObject = new unionMagic();
        var tempInfo = new Array(eUnionMagicInfo.Max);
        tempInfo[eUnionMagicInfo.RoleID] = roleID;
        tempInfo[eUnionMagicInfo.TempID] = magicID;
        tempInfo[eUnionMagicInfo.MagicLevel] = 1;
        magicObject.SetMagicAllInfo(tempInfo);
        this.magicList[magicID] = magicObject;
    }
    else{
        magicObject.SetMagicInfo(eUnionMagicInfo.MagicLevel, magicLevel);
    }

    this.SaveUnionPlayerMagic();

    this.UpdateAttr(true);

    var log_skillArgs = [log_getGuid.GetUuid(), roleID, 1,
        magicID, log_utilSql.DateToString(new Date())];
    log_insLogSql.InsertSql(eTableTypeInfo.UnionMagic, log_skillArgs);

    return {
        'result': errorCodes.OK,
        'magicID':magicID,
        'magicLevel' : magicLevel
    };
}

// 发送消息给玩家
handler.SendUnionMagicMsg = function ( tempID) {
    var player = this.owner;
    if (null == player) {
        logger.error('SendUnionMagicMsg');
        return;
    }
    var route = 'SendUnionMagicUpdate';
    var skillMsg = {
        List: [],
        media_id: defaultValues.thumb_media_id
    };
    if (null == tempID) {
        for (var index in this.magicList) {
            var tempSkill = this.magicList[index];
            var tempMsg = {'magicID'  : tempSkill.GetMagicInfo(eUnionMagicInfo.TempID), 'magicLevel': tempSkill.GetMagicInfo(eUnionMagicInfo.MagicLevel)};
            skillMsg.List.push(tempMsg);
        }
    }
    else {
        if (null == this.magicList[tempID]) {
            return;
        }
        else {
            var tempSkill = this.magicList[tempID];
            var tempMsg = {'magicID'  : tempSkill.GetMagicInfo(eUnionMagicInfo.tempID), 'magicLevel': tempSkill.GetMagicInfo(eUnionMagicInfo.MagicLevel)};
            skillMsg.List.push(tempMsg);
        }
    }
    player.SendMessage(route, skillMsg);
};

// 更新属性战力信息
handler.UpdateAttr = function ( isSend) {
    var player = this.owner;
    if(player == null){
        return;
    }

    var attManager = player.attManager;
    var oldZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_MAGIC);
    if (null == oldZhanli) {
        oldZhanli = 0;
    }
    var unionID = player.GetPlayerInfo(ePlayerInfo.UnionID);
    attManager.clearLevelAtt(eAttLevel.ATTLEVEL_MAGIC, eAttInfo.Max);
    attManager.clearZhanli(eAttLevel.ATTLEVEL_MAGIC);
    var newZhanli = 0;
    if(unionID == null || unionID <= 0){
        attManager.UpdateAtt();
        attManager.SendAttMsg(null);
        player.UpdateZhanli(oldZhanli, false, isSend);
        return;
    }

    for(var magicID in this.magicList){
        var magicObject = this.magicList[magicID];
        var magicLevel = magicObject.GetMagicInfo(eUnionMagicInfo.MagicLevel);
        var magicTempID = (magicID * 100) + magicLevel;
        var magicTemplate = templateManager.GetTemplateByID('UnionMagicLevelTemplate', magicTempID);
        if(magicTemplate == null){
            continue;
        }

        var attNum = magicTemplate['attNum'];
        if(attNum == null || attNum <= 0 || attNum > 3){
            continue;
        }

        if(attNum == 3){
            attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_0'], magicTemplate['attVal_0']);
            attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_1'], magicTemplate['attVal_1']);
            attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_2'], magicTemplate['attVal_2']);

            attManager.AddLevelAttPer(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_0'], magicTemplate['attPer_0']);
            attManager.AddLevelAttPer(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_1'], magicTemplate['attPer_1']);
            attManager.AddLevelAttPer(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_2'], magicTemplate['attPer_2']);
        }
        else if(attNum == 2){
            attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_0'], magicTemplate['attVal_0']);
            attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_1'], magicTemplate['attVal_1']);

            attManager.AddLevelAttPer(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_0'], magicTemplate['attPer_0']);
            attManager.AddLevelAttPer(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_1'], magicTemplate['attPer_1']);
        }
        else if(attNum == 1){
            attManager.AddLevelAttValue(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_0'], magicTemplate['attVal_0']);

            attManager.AddLevelAttPer(eAttLevel.ATTLEVEL_MAGIC, magicTemplate['att_0'], magicTemplate['attPer_0']);
        }
    }
    attManager.computeZhanli(eAttLevel.ATTLEVEL_MAGIC, eAttInfo.MAX);
    attManager.UpdateAtt();
    newZhanli = attManager.getZhanli(eAttLevel.ATTLEVEL_MAGIC);
    player.UpdateZhanli(newZhanli - oldZhanli, (newZhanli - oldZhanli) > 0 ? true : false, isSend);

    /**通知客户属性变更*/
    attManager.SendAttMsg(null);
};
