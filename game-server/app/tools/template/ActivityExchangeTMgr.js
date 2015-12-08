/**
 *  ActivityExchangeTemplate.json的管理者:
 *      作用是维护由json文件 抽取出的参数
 *      实现方式：
 *          对templateManager中得到的数据结构进行增强
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('../../tools/utils');
var templateManager = require('../templateManager');
var templateConst = require('../../../template/templateConst');
var _ = require('underscore');


//导出为对象
var Handler = module.exports = {};
var templateName = "ActivityExchangeTemplate";

/**--------增强方法----------------------*/

/**初始化： 从json文件抽出参数*/
Handler.Init = function(){
    //本地数据结构
    this.config = {};
    this.items = {costs:{}, rewards:{}};

    //template
    var templates = templateManager.GetAllTemplate(templateName);
    if(!templates){ //没有对应的json文件
        return;
    }

    //增强
    if(!templates.enhanced){
        if (this.Enchance()){
            templates.enhenced = true;
        }
    }
};

Handler.Initialized = function(){
    var templates = templateManager.GetAllTemplate(templateName);
    return templates && templates.enhenced;
};

/** ------------对外服务方法 ------------*/
/**获取表记录*/
Handler.GetTemplateByID = function(templateID){
    return templateManager.GetTemplateByID(templateName, templateID);
};

Handler.GetAllTemplate = function(){
    return templateManager.GetAllTemplate(templateName);
};

/**
 *  获取活动对应的兑换表
 *      {
 *          this.config[activityID],
 *         ...
 *      }
 * @constructor
 */
Handler.GetAllExchangesInfo = function(){
    //初始化
    if(!this.Initialized()) this.Init();

    //抽取
    var allExchanges = {};
    for(var activityID in this.config){
        var activity = this.config[activityID];
        allExchanges [activityID] = activity.exchangeTemplates;
    }

    return allExchanges;
};

/**
 *  获取正在进行的活动兑换
 *      {
 *          this.config[activityID],
 *         ...
 *      }
 * @constructor
 */
Handler.GetAllActiveExchangesInfo = function(nowDate){
    //初始化
    if(!this.Initialized()) this.Init();
    //帅选
    nowDate = nowDate || new Date();
    var activeExchanges = {};
    for(var activityID in this.config){
        var activity = this.config[activityID];
        var refinedActivity = {};
        refinedActivity.activityName = activity.activityName;
        refinedActivity.activityTitle = activity.activityTitle;
        refinedActivity.startDateTime = activity.startDateTime;
        refinedActivity.endDateTime = activity.endDateTime;
        refinedActivity.exchangeTemplates = {};

        //筛选正在进行的兑换
        var exchangeTemplates = activity.exchangeTemplates;
        for(var exchangeID in exchangeTemplates){
            var exchangeTemplate = exchangeTemplates[exchangeID];
            if(new Date(exchangeTemplate.startDateTime)<=nowDate && new Date(exchangeTemplate.endDateTime)>nowDate){
                refinedActivity.exchangeTemplates[exchangeID] = exchangeTemplate;
            }
        }
        if(!_.isEmpty(refinedActivity.exchangeTemplates)){//兑换进行中
            activeExchanges[activityID] = refinedActivity;
        }
    }

    return activeExchanges;
};

/**
 *  获取活动对应的兑换条目
 *        this.config[activityID]
 * @param activityID
 * @constructor
 */
Handler.GetExchangesInfo = function(activityID){
    //初始化
    if(!this.Initialized()) this.Init();

    if (this.config[activityID]){
        return this.config[activityID];
    }
    return null;
};

/**兑换消耗物品*/
Handler.GetCostItems = function(){
    //初始化
    if(!this.Initialized()) this.Init();
    return this.items.costs;
};

/**判断ActivityExchangeTemplate表是否改变*/
Handler.HasChanged = function(){
    var changed = false;

    var templates = templateManager.GetAllTemplate(templateName);
    if(!templates.changesInformed){
        changed = true;
    }

    return changed;
};

/**ActivityExchangeTemplate表的改变已经*/
Handler.ChangesInformed = function(){
    var templates = templateManager.GetAllTemplate(templateName);
    templates.changesInformed = true;
};

/**--------以下为对内服务方法-----------*/
/**
 *  this.config:
 *      {
 *          activityID:{
 *              activityName:activityName,
 *              activityTitle:activityTitle,
  *             startDateTime:startDateTime,
  *             endDateTime:endDateTime,
  *             exchangeTemplates:{attID1:template1, attID2:template2, ...}
  *         },
  *
 *      }
 * @returns {*}
 * @constructor
 */
Handler.Enchance = function(){
    //templates
    var templates = templateManager.GetAllTemplate(templateName);
    if(!templates){ //没有对应的json文件
        return null;
    }

    //遍历templates的每条记录， 更新数据
    for(var id in templates){
        this.UpdateConfig(templates[id]);
        this.UpdateItems(templates[id]);
    }
    return true;
};

/**更新本地配置*/
Handler.UpdateConfig = function(template){
    try{
        var config = this.config;
        var activityID = template.activityID;
        if(!config[activityID]){
            var activity = {};
            activity.activityName = template.name;
            activity.activityTitle = template.description;
            activity.startDateTime = new Date(template.startDateTime);
            activity.endDateTime = new Date(template.endDateTime);
            activity.exchangeTemplates = {};
            config[activityID] = activity;
        }
        config[activityID].exchangeTemplates[template.attID] = template;

        //更新开始和结束时间
        var tmptDate = new Date(template.startDateTime);
        if(tmptDate<config[activityID].startDateTime){
            config[activityID].startDateTime = tmptDate;
        }

        tmptDate = new Date(template.endDateTime);
        if(tmptDate > config[activityID].endDateTime){
            config[activityID].endDateTime = tmptDate;
        }
    }catch(err){
        logger.fatal("ActivityExchangeTMgr:  error passing template, err = %j", err);
    }

    return;
};

/**解析规则为: 先依据customIDs查找， 若没有再customTypes查找*/
Handler.GetConfig  = function(activityID, customID){
};

/**活动IDs的更新*/
Handler.UpdateItems = function(template){
    var exchangeNum = template.exchangeNum;
    for(var i=1; i<=exchangeNum; i++){
        var costID = template["item_" + i + "_ID"];
        var num = template["item_" + i + "_Num"];
        this.items.costs[costID] = num;
    }

    var rewardNum = template.rewardNum;
    for(var i=1; i<=rewardNum; i++){
        var rewardID = template['reward_' + i + '_ID'];
        var num = template['reward_' + i + '_Num'];
        this.items.rewards[rewardID] = num;
    }
};
