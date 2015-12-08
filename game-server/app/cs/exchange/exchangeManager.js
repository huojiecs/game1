/**兑换业务逻辑*/
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var _ = require('underscore');
var errorCodes = require('../../tools/errorCodes');
var defaultValues = require('../../tools/defaultValues');
var tCustom = templateConst.tCustom;
var eMisType = gameConst.eMisType;
var eLevelTarget = gameConst.eLevelTarget;
var ePlayerInfo = gameConst.ePlayerInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var activityExchangeTMgr = require('../../tools/template/ActivityExchangeTMgr');
var constValue = require('../../tools/constValue');

var eActivityExchangeConst =constValue.eActivityExchangeConst;

//导出
module.exports = function(owner){
    return new Handler(owner);
};

var Handler = function(owner){
    this.owner = owner;
};

var handler = Handler.prototype;

//----对外服务方法
/**兑换剩余时间
 *      兑换剩余秒数。 如果有错误返回-1
 * @param activityID
 * @returns {number}
 * @constructor
 */
handler.GetLeftTime = function(activityID){
    try{
        var activityExchanges = activityExchangeTMgr.GetExchangesInfo(activityID);
        var millis = activityExchanges.endDateTime.getTime() - new Date().getTime();
        return Math.max(0, Math.floor(millis/1000));
    }catch(err){
        logger.fatal("exchangemanager.GetLeftTime: roleID=%j, activityID = %j, error = %j ", this.GetRoleID(), activityID, err);
    }
    return -1;
};

/**可兑换条目数
 *      玩家在activityID活动中， 可进行兑换的条目数
 *      如果有错误返回-1.
 * @param activityID
 * @returns {number}
 * @constructor
 */
handler.GetExchangableNum = function(activityID){
    var self = this;
    try{
        //可兑换条目次数
        var num = 0;

        //兑换条目数组
        var exchangeTemplates = activityExchangeTMgr.GetExchangesInfo(activityID).exchangeTemplates;

        //计算可兑换次数
        for(var id in exchangeTemplates){
            var exchangeTemplate = exchangeTemplates[id];
            if(this.HasShengyuNum(id)&&this._exchangable( exchangeTemplate)&&this.IsExchangeActive(id)) num ++;
        }
        return num;
    }catch(err){
        logger.fatal("exchangemanager.GetExchangableNum error: roleID=%j, activityID = %j, error = %j",this.GetRoleID(),  activityID, err);
    }

    return -1;
};

/**获得剩余可兑换次数
 *
 * @param exchangeID
 * @returns {*}
 * @constructor
 */
handler.GetShengyuNum = function(exchangeID){
    try{
        var exchangeInfo = this.GetExchangeInfo(exchangeID);
        if(!exchangeInfo){//还未兑换过
            var template = activityExchangeTMgr.GetTemplateByID(exchangeID);
            return template.limitNum;
        }else{
            return exchangeInfo[1];
        }
    }catch(err){
        logger.fatal("exchangeManager.GetShengyuNum error: roleID=%j, exchangeID = %j, err = %j", this.GetRoleID(), exchangeID, err);
    }

    return -1;
};

/**是否有剩余兑换次数*/
handler.HasShengyuNum = function(exchangeID){
    return this.isUnlimitType(exchangeID) ||this.GetShengyuNum(exchangeID) > 0;
};

/**更新可兑换次数*/
handler.DecreaseShengyuNum = function(exchangeID, deltaNum){
    try{
        //不限制次数
        if(this.isUnlimitType(exchangeID)) return;

        //计算剩余
        var shengyuNum = this.GetShengyuNum(exchangeID);
        shengyuNum -= deltaNum;
        shengyuNum = Math.max(0, shengyuNum);

        //保存
        var limitType = this.GetLimitType(exchangeID);
        this.SetExchangeInfo(exchangeID, limitType, shengyuNum, new Date());
    }catch(err){
        logger.fatal("exchangeManager.UpdateShengyuNum error: roleID=%j, exchangeID = %j, num = %j", this.GetRoleID(), exchangeID, num);
    }
};

/**12点更新剩余兑换次数*/
handler.Update12Info = function(){
    //是否有兑换信息改变
    var exchangeInfoChanged = false;

    //更新兑换信息
    var exchangeInfo = activityExchangeTMgr.GetAllActiveExchangesInfo();
    for(var activityID in exchangeInfo){//进行中的活动
        //活动的数据库记录
        var dataInfo = this.owner.GetoperateManager().GetOperateInfo(activityID);
        if(!!dataInfo){
            dataInfo = JSON.parse(dataInfo);
            for(var exchangeID in dataInfo){//兑换条目
                if(this.GetLimitType(exchangeID) == eActivityExchangeConst.dailyClearType){//每日限制
                    delete dataInfo[exchangeID];//重置
                    exchangeInfoChanged = true;
                }
            }

            if(_.isEmpty(dataInfo)){//重置
                this.owner.GetoperateManager().ResetOperateInfo(activityID);
            }else{
                this.owner.GetoperateManager().SetOperateInfo(activityID, JSON.stringify(dataInfo));
            }
        }
    }


    //同步消息
    if(exchangeInfoChanged){
        onExchangeInfoChange(this.owner);
    }
};

/**返回exchangeID对应的数据库记录 (在operateInfo表中的)
 *      operate表中的记录 {exchaneID:[limitType, limitNum, updateTime], ...}
 *      返回[limitType, limitNum, updateTime]
 * @param exchangeID
 * @returns {*}
 * @constructor
 */
handler.GetExchangeInfo = function(exchangeID){
    try{
        var activityID = this.GetActivityID(exchangeID);
        var dataInfo = this.owner.GetoperateManager().GetOperateInfo(activityID);

        if(!!dataInfo){
            dataInfo = JSON.parse(dataInfo);
            var exchange =  dataInfo[exchangeID];
            return exchange;
        }
    }catch(err){
        logger.fatal("exchangeManager.GetExchangeInfo error: roleID=%j, exchangeID = %j, err = %j", this.GetRoleID(), exchangeID, err);
    }
    return null;
};

/**返回限制类型*/
handler.GetLimitType = function(exchangeID){
    try{
        var template = activityExchangeTMgr.GetTemplateByID(exchangeID);
        return template.limitType;
    }catch(err){
        logger.fatal("exchangeManager.GetLimitType error: roleID=%j, exchangeID =%j, err=%j", this.GetRoleID(), exchangeID, err);
    }

    return null;
};

/**是否是不限制次数的兑换类型*/
handler.isUnlimitType = function(exchangeID){
   return this.GetLimitType(exchangeID) == eActivityExchangeConst.unlimitType;
};

/**获取兑换所属于的活动ID*/
handler.GetActivityID = function(exchangeID){
    try{
        var template = activityExchangeTMgr.GetTemplateByID(exchangeID);
        return template.activityID;
    }catch(err){
        logger.fatal("exchangeManager.GetExchangeInfo error: roleID= %j, exchangeID = %j, err = %j", this.GetRoleID(), exchangeID, err);
    }
    return null;
};

/**重置每日活动*/
handler.ResetExchangeInfo = function(exchangeID){
    try{
        //dataInfo
        var activityID = this.GetActivityID(exchangeID);
        var dataInfo = this.owner.GetoperateManager().GetOperateInfo(activityID);
        if(!!dataInfo){
           dataInfo = JSON.parse(dataInfo);
           delete dataInfo[exchangeID];
           this.owner.GetoperateManager().SetOperateInfo(activityID, JSON.stringify(dataInfo));
        }
    }catch(err){
        logger.fatal("exchangeManager.ResetExchangeInfo error: roleID=%j, exchangeID = %j, err = %j", this.GetRoleID(), exchangeID,  err);
    }
};

/**设置兑换新活动信息*/
handler.SetExchangeInfo = function(exchangeID, limitType, limitNum, updateTime){
    try{
        //exchangeInfo
        var exchangeInfo = [limitType, limitNum, updateTime];

        //dataInfo
        var activityID = this.GetActivityID(exchangeID);
        var dataInfo = this.owner.GetoperateManager().GetOperateInfo(activityID);
        if(!dataInfo){
            dataInfo = {};
        }else{
            dataInfo = JSON.parse(dataInfo);
        }

        //设置
        dataInfo[exchangeID] = exchangeInfo;
        this.owner.GetoperateManager().SetOperateInfo(activityID, JSON.stringify(dataInfo));
    }catch(err){
        logger.fatal("exchangeManager.SetExchangeInfo error: roleID =%j, exchangeID = %j," +
                     " limitType=%j, limitNum=%j, updateTime=%j, err = %j", this.GetRoleID(), exchangeID, limitType, limitNum,updateTime, err);
    }
};

handler.GetAllActiveExchangesInfo =function(){
  return activityExchangeTMgr.GetAllActiveExchangesInfo();
};

/**兑换物品
 *      兑换成功返回{ids:[], nums:[]}, 表示兑换所得物品
 *      否则返回{errorCode:...}
 * @param exchangeID
 * @constructor
 */
handler.Exchange = function(exchangeID){
    //兑换时间检查
    if(!this.IsExchangeActive(exchangeID)){
        return {errorCode: errorCodes.NotActive};
    }
    //剩余次数检查
    if(!this.HasShengyuNum(exchangeID)){
        return {errorCode: errorCodes.NoTimes};
    }

    //exchangable
    var exchangeTemplate = activityExchangeTMgr.GetTemplateByID(exchangeID);
    if(!this._exchangable( exchangeTemplate)){
        return {errorCode: errorCodes.NoItem};
    }

    try{
        //assetsManager
        var assetsManager = this.owner.GetAssetsManager();

        //兑换的消耗
        var factor = constValue.eAssetsChangeReason.Reduce.ActivityExchange;
        var exchangeNum = exchangeTemplate.exchangeNum;
        for(var i=1; i<=exchangeNum; i++){
            var itemID = exchangeTemplate["item_" + i + "_ID"];
            var num = exchangeTemplate["item_" + i + "_Num"];
            assetsManager.AlterAssetsValue(itemID, -num, factor, 0);
        }

        //兑换的所得
        var reward = {ids:[], nums:[]};
        factor = constValue.eAssetsChangeReason.Add.ActivityExchange;
        var rewardNum = exchangeTemplate.rewardNum;
        for(var i=1; i<=rewardNum; i++){
            var itemID = exchangeTemplate['reward_' + i + '_ID'];
            var num = exchangeTemplate['reward_' + i + '_Num'];
            assetsManager.AlterAssetsValue(itemID, num, factor, 0);

            reward.ids.push(itemID);
            reward.nums.push(num);
        }
        return reward;
    }catch(err){
        logger.fatal("exchangeMananger.Exchange error: roleID= %j, exchangeID=%j, err=%j", this.GetRoleID(), exchangeID, err);
    }

    return {errorCode: errorCodes.SystemWrong};
};


handler.GetRoleID = function(){
    return this.owner.playerInfo[ePlayerInfo.ROLEID];
};

/**财产改变*/
handler.OnAssetsChange = function(err, player, tempID, value){

    //参数检查
    if(!!err) return;

    //更新
    try{
        var costs = activityExchangeTMgr.GetCostItems();
        if(!!costs[tempID] && value !=0){
            onExchangeInfoChange(player);
        }
    }catch(err){
        logger.fatal("exchangeManager.OnAssetsChange error: roleID=%, tempID=%j, value=%j", player.playerInfo[ePlayerInfo.ROLEID], tempID, value);
    }
};

handler.IsExchangeActive = function(exchangeID){
    try{
        var nowDate = new Date();
        var template = activityExchangeTMgr.GetTemplateByID(exchangeID);
        var startDateTime = new Date(template.startDateTime);
        var endDateTime = new Date(template.endDateTime);
        return nowDate>=startDateTime && nowDate<endDateTime;
    }catch(err){
        logger.fatal("exchangeManager.IsExchangeActive Error: exchangeID=%j, err=%j", exchangeID,err);
    }

    return false;
};

var onExchangeInfoChange = function(player){
    var route = "activityExchangeInfoUpdated";
    var msg = {result: 0};
    player.SendMessage(route,msg);
};

handler.OnExchangeInfoChange = function(){
    onExchangeInfoChange(this.owner);
};
//----辅助方法
/** 玩家是否可以兑换该条目*/
handler._exchangable = function( exchangeTemplate){
    var player = this.owner;
    try{
        if(!player) return false;
        var assetsManager = player.GetAssetsManager();

        //判断玩家是否有足够多的要求财产
        var isExchangable = true;
        var exchangeNum = exchangeTemplate.exchangeNum;
        for(var i=1; i<=exchangeNum; i++){
            var itemID = exchangeTemplate["item_" + i + "_ID"];
            var num = exchangeTemplate["item_" + i + "_Num"];
            isExchangable = isExchangable && assetsManager.CanConsumeAssets(itemID, num);
        }
        return isExchangable;
    }catch(err){
        logger.fatal("exchangeManager, exchangable: roleID = %j, exchangeTemplate=%, err=%j",
                     player.playerInfo[ePlayerInfo.ROLEID],
                     err);
    }
   return false;
};

