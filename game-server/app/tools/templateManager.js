/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-31
 * Time: 下午4:02
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var utils = require('./utils');
var watch = require('node-watch');
var fs = require('fs');
var path = require('path');
var templateConst = require('../../template/templateConst');
var gameConst = require('./constValue');
var defaultValues = require('./defaultValues');
var eMisType = gameConst.eMisType;
var tMissions = templateConst.tMissions;


/** 需要特殊处理的数据*/
var SPECIAL = {
    "ZhanShenRewardTemplat": "aresTMgr", // 战神榜 奖励数据
    "PvPRewardExchangeTemplate": "exchangeTMgr", // 物品兑换
    "XieShenRewardTemplate": "soulPvpTMgr" // 邪神竞技场
};

var Handler = module.exports = {};

Handler.Init = function () {

    var self = this;

    self.configFolderPath = defaultValues.configFolderPath;

//    self.ReloadSync();

    watch(self.configFolderPath, function (filename) {
//        logger.debug("templateManager watch file changed: %s", filename);

        if (path.extname(filename).toLowerCase() == '.json') {

            var basename = path.basename(filename, '.json');
            if (!!self[basename]) {
                self.Reload(filename);
            }
        }
    });

    self.missionTypeList = {};         // 将任务配置按类型区分 key : 类型， value : mission list
    //时装碎片对应该时装所需数量
    self.fashionPieceObj = {};
    //称号碎片对应该称号所需数量
    self.titlePieceObj = {};
    self.initalized = true;
};

/**
 *
 * @param templateName
 * @returns {*}
 * @constructor
 */
Handler.ReloadTemplateSync = function (templateName) {
    var self = this;

    var pathname = self.configFolderPath + '/' + templateName + '.json';

    logger.warn("templateManager ReloadTemplateSync files %s", pathname);

    var basename = path.basename(pathname, '.json');

    if (basename != templateName) {
        logger.error("templateManager ReloadTemplateSync templateName: %s basename: %s not match!", templateName,
                     basename);
        return null;
    }

    if (!fs.existsSync(pathname)) {
        return null;
    }

    var stat = fs.lstatSync(pathname);

    if (stat.isDirectory()) {
        return null;
    }

    if (path.extname(pathname).toLowerCase() != '.json') {
        return null;
    }

    var content = fs.readFileSync(pathname, {encoding: 'utf8'});

    content = content.replace(/^\uFEFF/, '');

    try {
        self[templateName] = JSON.parse(content);

        if (!!SPECIAL[templateName]) {
            var mgr = require('./template/' + SPECIAL[templateName] + '.js');
            if (mgr['Load'] instanceof Function) {
                mgr.Load(filename, JSON.parse(content));
            }
        }
    }
    catch (err) {
        logger.error('ReloadTemplateSync parse file %s failed: %s', pathname, utils.getErrorMessage(err));
    }

    if(templateName == 'MissionTemplate'){
        self.ReloadMission();
    }

    return self[templateName];
};

Handler.ReloadMission = function(){
    var self = this;
    self.missionTypeList = {};
    var missionTemplate = self.GetAllTemplate('MissionTemplate');    //获取所有的任务列表
    for (var index in missionTemplate) {        //遍历任务列表，找出符合规则的任务并添加
        var template = missionTemplate[index];
        var starCon = template[tMissions.startCon];

        if(self.missionTypeList[starCon] == null){
            self.missionTypeList[starCon] = [];
        }
        self.missionTypeList[starCon].push(index);
    }
};

//遍历时装模板，取得时装所需碎片及碎片数量
Handler.ReloadFashionForPiece = function(){
    var self = this;
    var fashionTemplates= self.GetAllTemplate('FashionTemplate');
    for (var tplId in fashionTemplates) {
        var tpl = fashionTemplates[tplId];
        if(self.fashionPieceObj[tpl.suiPianID] == null){
            self.fashionPieceObj[tpl.suiPianID] = {};
        }
        self.fashionPieceObj[tpl.suiPianID] = tpl.suiPianNum;
    }
};

//遍历称号模板，取得称号所需碎片及碎片数量
Handler.ReloadTitleForPiece = function(){
    var self = this;
    var titleTemplates= self.GetAllTemplate('TitleTemplate');
    for (var tplId in titleTemplates) {
        var tpl = titleTemplates[tplId];
        if(self.titlePieceObj[tpl.assetsID] == null){
            self.titlePieceObj[tpl.assetsID] = {};
        }
        self.titlePieceObj[tpl.assetsID] = tpl.assetsNum;
    }
};

Handler.ReloadSync = function () {
    var self = this;
    var filenames = fs.readdirSync(self.configFolderPath);

    logger.info("templateManager ReloadSync files %s", self.configFolderPath);

    filenames.forEach(function (filename) {
        var pathname = self.configFolderPath + '/' + filename;
        if (!fs.existsSync(pathname)) {
            return;
        }

        var stat = fs.lstatSync(pathname);
        if (stat.isDirectory()) {
            return;
        }

        if (path.extname(pathname).toLowerCase() != '.json') {
            return;
        }

        var content = fs.readFileSync(pathname, {encoding: 'utf8'});

        content = content.replace(/^\uFEFF/, '');

        try {
            self[path.basename(filename, '.json')] = JSON.parse(content);

            if (!!SPECIAL[path.basename(filename, '.json')]) {
                var mgr = require('./template/' + SPECIAL[path.basename(filename, '.json')] + '.js');
                if (mgr['Load'] instanceof Function) {
                    mgr.Load(filename, JSON.parse(content));
                }
            }
        }
        catch (err) {
            logger.error('ReloadSync parse file %s failed: %s', pathname, utils.getErrorMessage(err));
        }

    });

    self.ReloadMission();
    //加载时装所需碎片及碎片数量的映射
    self.ReloadFashionForPiece();
    //加载称号所需碎片及碎片数量的映射
    self.ReloadTitleForPiece();
};

Handler.Reload = function (filename, callback) {
    var self = this;

    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
        return utils.invokeCallback(callback, null);
    }

    if (path.extname(filename).toLowerCase() != '.json') {
        return utils.invokeCallback(callback, null);
    }

    fs.readFile(filename, 'utf8', function (err, data) {
        logger.warn("templateManager Reload file %s", filename);

        if (!!err) {
            logger.error('templateManager Reload %j failed: %s', filename, err.stack);
            return utils.invokeCallback(callback, null);
        }

        try {
            data = data.replace(/^\uFEFF/, '');
            data = JSON.parse(data);
            self[path.basename(filename, '.json')] = data;

            if (!!SPECIAL[filename]) {
                var mgr = require('./template/' + SPECIAL[filename] + '.js');
                if (mgr['Reload'] instanceof Function) {
                    mgr.Reload(filename, data);
                }
            }
            if(filename == 'MissionTemplate.json'){
                self.ReloadMission();
            }
        } catch (err) {
            logger.error('templateManager Reload %j failed: %s', filename, utils.getErrorMessage(err));
        }

        utils.invokeCallback(callback, null, data);
    });
};

/**
 * @return {null}
 */
Handler.GetTemplateByID = function (templateName, templateID) {
    if (!this.initalized) {
        this.Init();
    }

    if (!this[templateName]) {
        this.ReloadTemplateSync(templateName);
    }

    if (!this[templateName]) {
        return null;
    }

    return this[templateName][templateID];
};

Handler.GetAllTemplate = function (templateName) {
    if (!this.initalized) {
        this.Init();
    }

    if (!this[templateName]) {
        this.ReloadTemplateSync(templateName);
    }

    return this[templateName];
};

Handler.GetMissListByType = function(type){
    return this.missionTypeList[type];
};
