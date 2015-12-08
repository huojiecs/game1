/**
 *  noticeTempalate.json的管理者:
 *      作用是维护由json文件 抽取出的参数
 *      实现方式：
 *          对templateManager中得到的数据结构进行增强
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('pomelo/lib/util/utils');
var templateManager = require('../templateManager');

//导出为对象
var Handler = module.exports = {};
var templateName = "NoticeTempalte";

/**--------增强方法----------------------*/

/**初始化： 从json文件抽出参数*/
Handler.Init = function(){
    //template
    var templates = templateManager.GetAllTemplate(templateName);
    if(!templates){ //没有对应的json文件
        return;
    }

    //增强
    if(!templates.enhanced){
        this.Enchance();
        templates.enhenced = true;
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

/**需要广播的战力值*/
Handler.GetZhanliValues = function(){
    if(!this.Initialized()) this.Init();
    return this.GetConfig("zhanliValues");
};

/**--------以下为对内服务方法-----------*/
Handler.Enchance = function(){
    //增加参数 zhanliValues
    this.ConfigZhanliValues();
};

Handler.ConfigZhanliValues = function(){
    //templates
    var templates = templateManager.GetAllTemplate(templateName);
    if(!templates){ //没有对应的json文件
        return;
    }

    //params
    var zhanliValues = [],
        regexp=/^zhanliValue_\d{1,}$/,  //zhanliValue_n
        zhanli;

    //抽取广播战力值
    for(var id in templates){
        if(regexp.test(id)){
            zhanli = id.substr(12, id.length);
            if(!isNaN(zhanli)){
                zhanliValues.push(+zhanli);
            }
        }
    }
    var sortNum = function(a,b){return a-b;};
    zhanliValues.sort(sortNum);

    //增强NoticeTempalte
    templates.zhanliValues =zhanliValues;
};

Handler.GetConfig = function(name){
    //templates
    var templates = templateManager.GetAllTemplate(templateName);
    if(!templates){ //没有对应的json文件
        return null;
    }

    if(!!name){
        return templates[name];
    }

    return null;
};
