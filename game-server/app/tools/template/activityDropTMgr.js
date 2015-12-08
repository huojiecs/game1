/**
 *  ActivityDropTemplate.json的管理者:
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
var templateName = "ActivityDropTemplate";

/**--------增强方法----------------------*/

/**初始化： 从json文件抽出参数*/
Handler.Init = function(){
    //本地数据结构
    this.config = {};

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

/**返回对应活动的掉落 {assetID: [assetType, assetNum], ...}
 * @param activityID
 * @param customID
 * @param npcID 如果为undefine, 则计算整个活动的掉落
 * @param 要计算掉落的npcID （暂时忽略)
 * @constructor
 */
Handler.GetDrops = function(activityID, customID, npcID){
    //初始化
    if(!this.Initialized()) this.Init();
    //customConfig
    var customConfig = this.GetConfig(activityID, customID);
    if(!!customConfig){
        var drops = this.CalculateDrops(customConfig, npcID);
    }

    return drops || {};
};

/**--------以下为对内服务方法-----------*/
/**从template表中抽取数据， 放入本地数据结构
 *      this.config : {activityID:activityConfig, ...}
 *          activityConfig: {
 *                              customIDs:{customID: customConfig,....},
 *                              customTypes: {customType: customTypeConfig, ....}
 *                          }
 *                   customConfig: {
 *                      isNpc:0,    //  取值0 或 1
 *                      probabilities: probabilitiesConfig
 *                   }
 *                  customTypeConfig: {
 *                      isNpc:0, //只能取0
 *                      probabilities: probabilitiesConfig
 *                  }
 *                  probabilitiesConfig:      //当isNpc = 0
 *                      {   dropType: 0,
  *                         dropNum: 2,
 *                          ids: [1, 2],
 *                          percents: [30, 70],
 *                          mins: [1, 1],
 *                          maxs: [2, 2]
 *                      }
 * @returns {null}
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
    }
    return true;
};

/**更新本地配置*/
Handler.UpdateConfig = function(template){
    //增强template: 增加probabilities属性
    if(!template) return;


    //activityID层的检查
    var activityID = template[templateConst.tActivityDrop.activityID];
    if (!activityID) {
        return;
    }
    if (!this.config[activityID]){
        this.config[activityID] = {
            customIDs:{},
            customTypes:{}
        };
    }
    var activityConfig = this.config[activityID];

    //customTypes层的检测
    var customTypes;
    try{
        customTypes = JSON.parse(template[templateConst.tActivityDrop.customTypes]);
    }catch(err){
        logger.error("Error parse customTypes of %j, activityID: %j, err: %s", templateName, activityID, utils.getErrorMessage(err));
        return;
    }
    if(customTypes && _.isArray(customTypes)){
        enhanceCustomTemplate(template);
        customTypes.forEach(function(customType){
            activityConfig.customTypes[customType] = {};
            activityConfig.customTypes[customType].isNpc = 0;
            activityConfig.customTypes[customType].probabilities = template.probabilities;
        });
    }

    //customID层的检测
    var customIDs;
    try{
        customIDs = JSON.parse(template[templateConst.tActivityDrop.customIDs]);
    }catch(err){
        logger.error("Error parse customIDs of %j, activityID: %j, err: %s", templateName, activityID, utils.getErrorMessage(err));
        return;
    }
    if(customIDs && _.isArray(customIDs)){
        var isNpc = template[templateConst.tActivityDrop.isNpc];
        if(isNpc==0){
            enhanceCustomTemplate(template);
            customIDs.forEach(function(customID){
                activityConfig.customIDs[customID] = {};
                activityConfig.customIDs[customID].isNpc = isNpc;
                activityConfig.customIDs[customID].probabilities = template.probabilities;
            });
        }
    }
};

/**解析规则为: 先依据customIDs查找， 若没有再customTypes查找*/
Handler.GetConfig  = function(activityID, customID){
    //参数检查
    if(!customID || !activityID) {
        return;
    }

    //检查activityID
    var activityConfig = this.config[activityID];
    if(!activityConfig) {
        return;
    }

    //检查customID
    var customConfig = activityConfig.customIDs[customID];
    if(!!customConfig) {
        return customConfig;
    }

    //检查customType
    var customTemplate = templateManager.GetTemplateByID("CustomTemplate", customID);
    if(!customTemplate){
        return;
    }

    var  customType = customTemplate[templateConst.tCustom.smallType] + "";
    if(!!customType){
        return activityConfig.customTypes[customType];
    }

    return;
};

/**计算掉落： 当前实现对关卡中的怪物不区分对待
 * @param customConfig  活动掉落的配置
 * @param npcID     要计算掉落的npcID （暂时忽略)
 * @return {assetID: [assetType, assetNum], ...}, 目前assetType始终是1
 */
Handler.CalculateDrops =function(customConfig, npcID){
    try{
        var isNpc = customConfig.isNpc;
        var probabilities = customConfig.probabilities;
        if(isNpc==0){//关卡内npc不区分对待
            //检查npc类型
//            if(!dropEnabled(npcID)){
//                return {};
//            }

            //抽取数据
            var dropType = probabilities.dropType;
            var ids = probabilities.ids;
            var percents = probabilities.percents;
            var mins = probabilities.mins;
            var maxs = probabilities.maxs;

            //计算随机掉落
            var drops = {};
            if(dropType == 0){//每种物品单独掉落
                var nums = utils.getEach(percents, mins, maxs);
                for(var i=0; i<ids.length; i++){
                    if(nums[i]>0){
                        drops[ids[i]] = [1, nums[i]];
                    }
                }
            }else if(dropType == 1){//所有物品放到一起，最多掉落一件
                var res = utils.getOne(percents, mins, maxs);
                var i = res[0];
                var num = res[1];
                if(num>0){
                    drops[ids[i]] = [1, num];
                }
            }

            return drops;
        }
    }catch(err){
        logger.fatal("Error activityDropTMgr.CalculateDrops Error:  customConfig: %j, err: %s", customConfig, utils.getErrorMessage(err)) ;
    }

    return {};
};

//辅助方法
/**
 * 增强不区分npc的掉落配置条目
 */
var enhanceCustomTemplate = function(template){ //增强template表中的条目
    if(template && ! template.enchanced && template.isNpc ==0){
        var probabilities = {};

        //抽取数据
        var dropType = template.dropType;
        var dropNum = template.dropNum;
        var ids = [], percents =[], mins =[], maxs=[];
        for(var i=1; i<=dropNum; i++){
            ids.push(template["dropItemID_" + i]);
            percents.push(template["dropItemID_"+i +"_rate"]/100);
            mins.push(template["dropItemID_" + i+ "_min"]);
            maxs.push(template["dropItemID_" + i+ "_max"]);
        }

        //绑定
        probabilities.dropType = dropType;
        probabilities.dropNum  = dropNum;
        probabilities.ids = ids;
        probabilities.mins = mins;
        probabilities.maxs = maxs;
        probabilities.percents = percents;
        template.probabilities = probabilities;

        //调整
        template.enchanced = true;
    }
};

/**npc是否允许有掉落*/
var dropEnabled = function(npcID){
    try{
        var enabledRanks = [0, 1, 2];
        var template = templateManager.GetTemplateByID("NpcTemplate", npcID);
        var rank = template.rank;
        return _.has(enabledRanks, rank);
    }catch(err){
        logger.fatal("activityDropTMgr.dropEnabled Error: npcID: %j, err: %s", npcID, utils.getErrorMessage(err));
    }

    return false;
};
