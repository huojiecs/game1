/**
 * Created by Administrator on 14-11-20.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var defaultValues = require('../../tools/defaultValues');
var gameClient = require('../../tools/mysql/gameClient');
//var game_globalClient = require('../../tools/mysql/game_globalClient');
var utils = require('../../tools/utils');
var ePlayerInfo = gameConst.ePlayerInfo;
var eAttFactor = gameConst.eAttFactor;
var Q = require('q');
var _ = require('underscore');


var Handler = module.exports;

Handler.Init = function () {
    this.severNumList = {};
    this.LoadLimitGoodsInfo();
};

Handler.LoadLimitGoodsInfo = function () {
    var self = this;
    var sqlStr = 'select * from limitgoods';
    var sqlArgs = [];
    Q.nfcall(gameClient.query, 0, sqlStr, sqlArgs)
        .then(function (res) {
                  if (res[0] == null) {
                      res = [];
                  }
                  for (var i in res) {
                      var key = res[i].goodsID;
                      var value = res[i].goodsNum;
                      self.severNumList[key] = value;
                  }
              })
        .catch(function (err) {
                   logger.error('load LimitGoodsInfo error: %s', utils.getErrorMessage(err))
               }).done();

};

Handler.GetLimitGoodsInfo = function () {
    return this.severNumList;
};
Handler.GetLimitGoodInfo = function (goodsID) {
    return this.severNumList[goodsID];
};
Handler.SetLimitGoodInfo = function (goodsID, goodsNum) {
    this.severNumList[goodsID] = goodsNum;
    return null;
};
Handler.updateLimitGoodsInfo = function () {
    var self = this;
    var sqlStr = 'CALL sp_updateLimitGoodsInfo(?,?)';
    var sqlString = self.getSaveLimitGoodsInfoSql();
    if ("" != sqlString) {
        var args = ['limitgoods', sqlString];
        Q.nfcall(gameClient.query, 0, sqlStr, args)
            .catch(function (err) {
                       logger.error('update LimitGoods error: %s', utils.getErrorMessage(err))
                   }).done();
    }

};

Handler.getSaveLimitGoodsInfoSql = function () {
    var self = this;
    var str = '';
    var severNumArray = _.toArray(self.severNumList);
    var i = 0;
    for (var u in self.severNumList) {
        var key = self.severNumList[u];
        if (i < severNumArray.length - 1) {
            var strInfo = '(';
            strInfo += u + ',';
            strInfo += key + ')';
            str += strInfo + ',';
        } else {
            var strInfo = '(';
            strInfo += u + ',';
            strInfo += key + ')';
            str += strInfo;
        }
        i++;
    }
    var sqlString = str;
    return sqlString;
};


Handler.UpdateLimitGoods = function (cb) {
    var self = this;
    self.updateLimitGoodsInfo();
    cb();
};