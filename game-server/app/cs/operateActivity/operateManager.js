/**
 * Created with JetBrains WebStorm.
 * User: yqWang
 * Date: 14-10-8
 * Time: 下午3:22
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var globalFunction = require('../../tools/globalFunction');
var utils = require('../../tools/utils');
var redisManager = require('../chartRedis/redisManager');
var utilSql = require('../../tools/mysql/utilSql');
var operateControl = require('./operateControl')
var _ = require('underscore');
var Q = require('q');
var util = require('util');

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.operateInfo = {};   //玩家的运营数据
};
var handler = Handler.prototype;

handler.LoadDataByDB = function (dataInfo) {
    var self = this;
    if (null != dataInfo) {
        for (var index in dataInfo) {
            var temp = dataInfo[index];
            var tempID = temp['tempID'];
            this.operateInfo[tempID] = temp;
        }
    }

//    setTimeout(function () {
//        operateControl.OnLogin(self.owner);
//    }, 3000);
};

handler.GetSqlStr = function () {
    var rows = [];
    for (var index in this.operateInfo) {
        var row = [];
        var temp = this.operateInfo[index];
        row.push(temp['roleID']);
        row.push(temp['tempID']);
        row.push(temp['dataInfo']);
        rows.push(row);
    }
    var sqlString = utilSql.BuildSqlValues(rows);
    return sqlString;
};

handler.SetOperateInfo = function (index, value) {
    if (null == this.operateInfo[index]) {
        this.operateInfo[index] = {roleID: this.owner.GetPlayerInfo(gameConst.ePlayerInfo.ROLEID),
                                    tempID: +index};
    }
    this.operateInfo[index].dataInfo = value;
};

handler.GetOperateInfo = function (index) {
    if (null == this.operateInfo[index]) {
        return null;
    }
    return this.operateInfo[index].dataInfo;
};

handler.ResetOperateInfo = function (index) {
    if (null != this.operateInfo[index]) {
        delete this.operateInfo[index];
    }
};

handler.StartAllOperate = function () {
    operateControl.OnLogin(this.owner);
};
