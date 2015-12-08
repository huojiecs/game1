/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-4
 * Time: 上午11:05
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var teamManager = require('./team/teamManager');
var playerManager = require('./player/playerManager');
var OccupantManager = require('./occupant/occupantManager');
var weddingManager = require('./marry/weddingManager');
var rsSql = require('../tools/mysql/rsSql');
var gameClient = require('../tools/mysql/gameClient');
var defaultValues = require('../tools/defaultValues');
var config = require('../tools/config');
var Q = require('q');

var Handler = module.exports;

Handler.InitServer = function () {
    var deferred = Q.defer();
    teamManager.Init();
    playerManager.Init();
    OccupantManager.Init();
    weddingManager.Init();
    rsSql.LoadOccupantInfo(function (err, List) {
        if (err) {
            logger.error('rs执行关卡占领者列表的时候出错' + err.stack);
            return deferred.reject(err);
        }

        OccupantManager.SetDataFromDB(List);
        setInterval(UpdateServer, 1000);

        deferred.resolve();
    });

    //定时存储婚礼预约列表
    setInterval(UpdateWedding, defaultValues.weddingSaveDBTime);
    setInterval(SendWedding, defaultValues.SendWeddingTime);

    return deferred.promise;
};

function UpdateServer() {
    var nowTime = new Date();
    OccupantManager.Update(nowTime);
};

function UpdateWedding() {
    //保存婚礼数据
    weddingManager.UpdateWedding();
    //保存爱的礼物数据
    weddingManager.UpdateMarryGift();
    //保存夫妻日志数据
    weddingManager.UpdateMarryLog();
};

function SendWedding(){
    //发送此时刻要举行的婚礼
    weddingManager.SendWedding();

}

//保存rs信息
Handler.BeforeCloseServer = function (cb) {
    OccupantManager.SaveOccupantInfo(cb);
    //保存婚礼数据
    UpdateWedding();
};