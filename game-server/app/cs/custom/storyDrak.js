
/**
 * 剧情炼狱
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
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eAttInfo = gameConst.eAttInfo;
var eRoleStoryDrak = gameConst.eRoleStoryDrak;
var eCustomInfo = gameConst.eCustomInfo;
var eLevelTarget = gameConst.eLevelTarget;
var _ = require('underscore');


var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
var eMoneyChangeType = gameConst.eMoneyChangeType;
var eTableTypeInfo = gameConst.eTableTypeInfo;
var log_utilSql = require('../../tools/mysql/utilSql');

module.exports = function (owner) {
       return new Handler(owner);
};

var Handler = function (owner) {
       this.owner = owner;
       this.atkTimes = 0;        // 剧情噩梦次数
       this.storyScore = 0;      // 历史最高积分
       this.teamTimes = 0;      // 组队噩梦次数
};

var handler = Handler.prototype;

//
handler.getAtkTimes = function () {
      return this.atkTimes;
};

//
handler.getTeamTimes = function () {
    return this.teamTimes;
};


//
handler.addAtkTimes = function () {
      return ++this.atkTimes;
};

//
handler.addTeamTimes = function () {
    return ++this.teamTimes;
};

//
handler.getStoryScore = function () {
       return this.storyScore;
};

// 计算总积分
handler.calStoryScore = function () {
      this.storyScore = 0;
      var cusManage = this.owner.GetCustomManager();
      var storyCustoms = cusManage.GetCustoms(eLevelTarget.StoryDrak);
      if(storyCustoms == null){
          return this.storyScore;
      }

      for(var id in storyCustoms){
           var cusInfo = storyCustoms[id];
           if(cusInfo == null){
               continue;
           }

           this.storyScore += cusInfo.GetCustomInfo(eCustomInfo.SCO);
      }

      return this.storyScore;
};

handler.LoadDataByDB = function (dataList) {
      var self = this;
      if (null != dataList && dataList.length > 0) {
          self.atkTimes = dataList[eRoleStoryDrak.atkTimes];
          self.storyScore = dataList[eRoleStoryDrak.storyScore];
          self.teamTimes = dataList[eRoleStoryDrak.teamTimes];
      }

    var roleInfo = {
        roleID: this.owner.GetPlayerInfo(ePlayerInfo.ROLEID),
        score:this.storyScore
    };

    pomelo.app.rpc.chart.chartRemote.UpdateStoryScore(null,roleInfo, function(err){

    });
};

handler.GetSqlStr = function (roleID) {
      var info = '';
      info += '(';
      info += roleID
          + ',' + this.atkTimes
          + ',' + this.storyScore
          + ',' + this.teamTimes
      ;
      info += ')';
      return info;
};

// 12点定时更新
handler.Update12Info = function () {
     this.atkTimes = 0;
     this.teamTimes = 0;
     this.SendStoryMsg();
};

// 发送消息给玩家
handler.SendStoryMsg = function () {
     var player = this.owner;
     if (null == player) {
         logger.error('SendStoryMsg');
         return;
     }
     var route = 'SendStoryMsg';
     var self = this;

     var retMsg = {
         'atkTimes' : self.atkTimes,
         'storyScore' : self.storyScore,
         'teamTimes' : self.teamTimes
     };

     player.SendMessage(route, retMsg);
};
