/**
 * Created by Administrator on 14-9-29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var Q = require('q');
var async = require('async');
var _ = require('underscore');
var config = require('../../tools/config');
var usSql = require('../../tools/mysql/usSql');
var Union = require('./union');
var ePlayerInfo = gameConst.ePlayerInfo;
var errorCodes = require('../../tools/errorCodes');
var constValue = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var templateManager = require('../../tools/templateManager');
var templateConst = require('./../../../template/templateConst');
var util = require('util');
var stringValue = require('../../tools/stringValue');
var redis = require("redis");
var playerManager = require('../../us/player/playerManager');
var utilSql = require('../../tools/mysql/utilSql');
var unionIOController = require('./unionIOController');
var unionAnimal = require('./unionAnimal');
var unionFight = require('./unionFighting');


var sUsString = stringValue.sUsString;
var eUnionInfo = constValue.eUnionInfo;
var eUnionMemberInfo = constValue.eUnionMemberInfo;

var tUnionLeve = templateConst.tUnionLeve;
var tUnionShop = templateConst.tUnionShop;
var eAssetsAdd = gameConst.eAssetsChangeReason.Add;
var eUnionAnimal = gameConst.eUnionAnimal;



var Handler = module.exports;

var INT_MAX = 2100000000;       // INT型最高值
var ATT_MAX = 21000000;         // 神兽属性通常的最高值
var MAX_APPLY_NUM = 10;         // 角色最多可以申请的公会数量

// 初始化成员变量  构造函数  初始化成员变量
Handler.Init = function () {


    this.unionList = {};                   // 所有公会信息        key:unionID                              数量级 ：200
    this.unionMemberList = {};             // 所有公会成员信息     key:unionID                             数量级 ： 10000
    this.unionApplyList = {};              // 所有公会成员邀请信息
    this.unionLogList = {};                // 所有公会日志信息
    this.unionRoleShopInfo = {};           // 公会商店信息
    this.unionMagicInfo = {};              // 公会技能信息
    this.unionTempleInfo = {};             // 公会神殿信息        key: unionID
    this.playerOfferInfo = {};             // 角色祭拜信息        key: roleID  value : ladyNum
    this.unionAnimalList = {};             // 公会神兽信息        key: unionID value : animal
    this.unionMemFightDamage = {};         // 成员伤害信息        key: roleID
    this.unionDamageInfo = {};             // 公会伤害信息        key: unionID
    this.unionGiftReceive = {};            // 公会红包 已领取
    this.unionGiftSend = {};               // 所有公会红包 送出的
    this.unionData = {};                   // 存储公会其他数据 （目前记录 公会炼狱次数 ps: 用于每天0点可清空的数据）
    this.playerSignOutTime = {};           // 玩家离开公会的时间，冷却计时器用
    this.cultureLogs = {};                 // 公会神兽培养日志


    // 以下为内存信息，不存盘

    this.playerApplyList = {};             // 玩家申请列表 key : roleID value : array for applied unions

    this.memberDamageRank = {};            // 成员伤害排行排序    key :unionID  value : array for rank
    this.unionDamageRank = [];             // 公会伤害排行，数组

    this.isUnionLoad = false;
    this.isMemberLoad = false;
    this.isUnionApplyLoad = false;
    this.isLogLoad = false;
    this.isShopLoad = false;
    this.isMagicLoad = false;

    this.isChecked = false;
    this.isGetOcc = false;

    this.unionQueque = {};

    this.dukeUnion = null;            // 守城公会

    this.union = new Union();
    this.unionFighting = new unionFight();
};

//
Handler.GetAllUnion = function () {
    return this.unionList;
};

// 得到守城公会会长ID，没有为0
Handler.getDukeUnionLeader = function(){
    return this.dukeUnion != null ? this.dukeUnion['bossID'] : 0;
};

Handler.getFightState = function(){
    return this.unionFighting.getFightState();
};

// 设置新的公会城主
Handler.setDukeUnion = function(unionInfo){
    if(unionInfo == null){
        return;
    }
    if(this.dukeUnion != null){
        this.unionList[this.dukeUnion['unionID']]['isDuke'] = 0;
    }
    this.dukeUnion = unionInfo;
    this.unionList[this.dukeUnion['unionID']]['isDuke'] = 1;
};

// 得到战斗日期类型
Handler.getFightDayType = function(){
    if(this.unionFighting.getFightState() == 1){
        return 3;
    }
    var thisDate = new Date();
    var thisDay = thisDate.getDay();
    if(thisDay == 1){
        return 1;
    }
    else if(thisDay > 1 && thisDay <= 6){
        return 2
    }
    else {
        if(thisDate.getHours() < 21){
            return 2;
        }else if(thisDate.getHours() == 21 && thisDate.getMinutes() <= 30){
            if(this.unionFighting.getFightState() == 1){
                return 3;
            }
        }

        return 0;
    }
};

Handler.getNextTimer = function(thisDate, diffDay, nextHour){
    var hour = nextHour - thisDate.getHours();
    var mini = 0 - thisDate.getMinutes();
    var sec = 0 - thisDate.getSeconds();
    var millSec = 0 - thisDate.getMilliseconds();
    return (diffDay * 86400 + hour * 3600 + mini * 60 + sec) * 1000 + millSec;
};

// 得到下一阶段的毫秒数
Handler.getNextStateTimer = function(){
    var thisDate = new Date();
    var thisDay = thisDate.getDay();
    if(thisDay == 1){
        return this.getNextTimer(thisDate, 0, 24);
    }
    else if(thisDay > 1 && thisDay <= 6){
        return this.getNextTimer(thisDate, 6 - thisDay, 24 + 21);
    }
    else {
        if(thisDate.getHours() < 21){
            return this.getNextTimer(thisDate, 0, 21);
        }else if(thisDate.getHours() == 21 && thisDate.getMinutes() <= 30){
            if(this.unionFighting.getFightState() == 1){
                return this.unionFighting.getLeftTimer();
            }
        }

        return this.getNextTimer(thisDate, 0, 24);
    }
};

// 更新状态
Handler.updateState = function () {
    var self = this;
    if(self.isUnionLoad && self.isMemberLoad && self.isUnionApplyLoad && self.isLogLoad && self.isShopLoad && self.isMagicLoad){
        if(self.isChecked == false){
            this.CheckAndFixUnionData();
            self.isChecked = true;
        }
        if (self.isGetOcc == false) {
            self.isGetOcc = true;
        }
    }
};

// 检测公会服务器数据信息是否异常
Handler.CheckAndFixUnionData = function () {
    var deleteList = {};


    for (var roleID in this.unionMemberList) {
        var member = this.unionMemberList[roleID];
        if (member == null) {
            continue;
        }

        var union = this.unionList[member.unionID];
        if (union == null) {
            deleteList[member.unionID] = 1;
        }
    }

    for (var unionID in deleteList) {
        if (deleteList[unionID] != 1) {
            continue;
        }
        this.DeleteUnionInfo(unionID);
    }
};

// 更新角色出公会后的冷却时间
Handler.updatePlayerUnionCD = function () {
    var nDate = new Date();

    for(var roleID in this.playerSignOutTime){
        if(this.playerSignOutTime[roleID] == null){
            continue;
        }
        var sDate = new Date(this.playerSignOutTime[roleID].leaveTime);
        if (nDate - sDate >= 86400 * 1000) {
            delete this.playerSignOutTime[roleID];
        }
    }
};

// get
Handler.GetUnion = function (unionID) {
    return this.unionList[unionID];
};

Handler.GetUnionData = function (unionID) {
    return this.unionData[unionID];
};

// 获取公会成员
Handler.GetUnionMember = function (roleID) {
    if (!this.unionMemberList[roleID]) {
        return null;
    }
    var unionID = this.unionMemberList[roleID]['unionID'];
    return this.union.GetUnionMemberList(unionID, this.unionMemberList);
};
//
Handler.AddUnion = function (unionID, union) {
    this.unionList[unionID] = union;
    if(this.unionTempleInfo[unionID] == null){
        //this.CreateTemple(unionID);
        //this.SaveUnionTempleInfo();
    }
};


Handler.AddUnionLog = function (unionID, log) {
    var self = this;
    if (!self.unionLogList[unionID]) {
        var logs = [];
        logs.unshift(log);
        self.unionLogList[unionID] = logs;
    } else {
        self.unionLogList[unionID].unshift(log);
    }
};

// add
Handler.AddMember = function (roleID, member) {
    this.unionMemberList[roleID] = member;
};


Handler.AddUnionApply = function (unionID, unionApply) {
    this.unionApplyList[unionID] = unionApply;
};


/**
 * 回去当前队列中的任务数
 * @return {Number} 任务数
 * */
Handler.getCurrQueueNum = function () {
    var sum = 0;
    for (var i in this.unionQueque) {
        sum += this.unionQueque[i].length;
    }
    return sum;
};

//
Handler.getUnionList = function (roleID, unionID, callback) {
    var self = this;
    var unionArray = _.toArray(self.unionList);
    if (null == unionID || null == roleID) {
        return callback({result: errorCodes.ParameterNull});
    }
    var playerApplyInfo = self.playerApplyList[roleID];
    if (0 === unionID) {//判断是否是搜索  0无搜索内容
        if (null == unionArray || 0 == unionArray.length) {
            return callback({result: errorCodes.NoUnion});
        }
        if (unionArray.length > 5) {
            var refurbishUnions = _.sample(unionArray, 8);
            if (null == unionArray) {
                return  callback({result: errorCodes.NoUnion});
            }
            self.SetUnionListMemberNum(refurbishUnions);
            return self.union.GetUnionList(refurbishUnions, playerApplyInfo, callback);
        } else if (unionArray.length > 0) {
            var refurbishUnions = unionArray;
            if (null == unionArray) {
                return  callback({result: errorCodes.NoUnion});
            }
            self.SetUnionListMemberNum(refurbishUnions);
            return self.union.GetUnionList(refurbishUnions, playerApplyInfo, callback);
        } else {
            return  callback({result: errorCodes.NoUnion});
        }
    } else {
        return self.findUnion(unionID, playerApplyInfo, callback);
    }

};

//
Handler.createUnion = function (csID, roleID, unionName, next) { //创建公会
    var self = this;
    if (null == roleID || null == unionName || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    if (globalFunction.IsValidUnionName(unionName) == false) {
        return next(null, {
            result: errorCodes.UnionNameNumLong
        });
    }
    pomelo.app.rpc.cs.csRemote.VerifyProperty(null, csID, roleID, function (res) {
        if (errorCodes.OK != res.result) {
            return next(null, res);
        }
        var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
        if (!!unionID) {
            return next(null, {
                result: errorCodes.PlayerExistUnion
            });
        }
        self.createUnionRealize(csID, roleID, unionName, next);


    });
};

// 创建公会
Handler.createUnionRealize = function (csID, roleID, unionName, next) {
    var self = this;
    Q.nfcall(usSql.CheckUnionName, unionName)
        .then(function (res) {
                  var result = res['_result'];
                  var unionID = res['_resultID'];
                  if (result != 0) {
                      var result = errorCodes.UnionNameExist;
                      return Q.reject(result);
                  }
                  //公会初始化
                  self.union.GetPlayerInfo(roleID, function (err, details) {
                      if (!!err) {
                          return next(null, {
                              'result': errorCodes.CreateUnionDefeated
                          });
                      }
                      if (!details) {
                          logger.warn('warn when GetUnionList for union file,roleID=%j,details=%j', roleID,
                                      details);
                          return next(null, {
                              'result': errorCodes.CreateUnionDefeated
                          });
                      }
                      var unionInfo = new Array(eUnionInfo.MAX);
                      for (var uInfo in eUnionInfo) {
                          if(eUnionInfo[uInfo] != eUnionInfo.MAX){
                              unionInfo[eUnionInfo[uInfo]] = 0;
                          }
                      }
                      unionInfo[eUnionInfo.unionID] = unionID;
                      unionInfo[eUnionInfo.unionName] = unionName;
                      unionInfo[eUnionInfo.unionLevel] = 1;
                      unionInfo[eUnionInfo.unionZhanLi] = details.zhanli;
                      unionInfo[eUnionInfo.memberNum] = 1;
                      unionInfo[eUnionInfo.announcement] = sUsString.InitAnnouncement;
                      unionInfo[eUnionInfo.bossID] = roleID;

                      //公会成员
                      var unionMemberInfo = new Array(eUnionMemberInfo.MAX);
                      for (var mInfo in eUnionMemberInfo) {
                          if(eUnionMemberInfo[mInfo] != eUnionMemberInfo.MAX){
                              unionMemberInfo[eUnionMemberInfo[mInfo]] = 0;
                          }

                      }
                      unionMemberInfo[eUnionMemberInfo.roleID] = roleID;
                      unionMemberInfo[eUnionMemberInfo.unionID] = unionID;
                      unionMemberInfo[eUnionMemberInfo.unionRole] = 1;
                      unionMemberInfo[eUnionMemberInfo.createTime] = utilSql.DateToString(new Date());
                      unionMemberInfo[eUnionMemberInfo.logTime] = utilSql.DateToString(new Date());



                      //对应sql语句
                      var unionInfoSqlStr = unionIOController.GetUnionInfoSqlStr(unionInfo);
                      var unionMemberInfoSqlStr = unionIOController.GetUnionMemberInfoSqlStr(unionMemberInfo);
                      usSql.CreateUnion(
                          unionID, roleID, unionInfoSqlStr, unionMemberInfoSqlStr,
                          function (err, result) {
                              if (!!err || result > 0) {
                                  if (result != errorCodes.UnionNameExist) {
                                      logger.error('CreateUnion failed: result: %j, err: %s',
                                                   result, utils.getErrorMessage(err));
                                  }
                                  usSql.DeleteUnionName(unionName, utils.done);
                              }
                              var createUnionInfo = self.union.convertArrayToJson(unionInfo, eUnionInfo);
                              var memberInfo = self.union.convertArrayToJson(unionMemberInfo, eUnionMemberInfo);
                              if (typeof(unionInfo) != 'number') {
                                  self.unionList[unionID] = createUnionInfo;
                                  self.unionMemberList[roleID] = memberInfo;
                                  self.union.SetPlayerUnionInfo( csID, roleID, unionID, unionName, 1,function (err, uID) {
                                      pomelo.app.rpc.cs.csRemote.SetAssetsValue(null, csID, roleID, function (res) {
                                          if (errorCodes.OK != res.result) {
                                              return next(null, res);
                                          }
                                          self.SetUnionLog(unionID,
                                              defaultValues.Union_RiZhiType_1,
                                              roleID, null);
                                          self.union.UpdateUnionRedisInfo(unionID,
                                              createUnionInfo);
                                          self.union.UpdateUnionScoreRedisInfo(unionID,
                                              createUnionInfo);
                                          //创建完公会给玩家发送个消息可发红包
                                          self.SendUnionGiftChange(roleID, null, utils.done);

                                          return next(null, { result: createUnionInfo });
                                      });
                                  });
                              } else {
                                  return next(null, {
                                      result: createUnionInfo
                                  });
                              }

                          });
                  });

              })
        .catch(function (err) {
                   if (!!err) {
                       if (err != errorCodes.UnionNameExist) {
                           logger.error('check union name faild, %s', utils.getErrorMessage(err));
                       }
                   }

                   var result = {
                       'result': _.isNumber(err) ? err : errorCodes.SystemWrong
                   };
                   if (result.result != errorCodes.UnionNameExist) {  //非名称冲突时删除角色名
                       usSql.DeleteUnionName(unionName, utils.done);
                   }
                   return next(null, result);
               }).done();
};

/**
 * 获取从redis角色
 * */
Handler.getRoleByRedis = function (ret, callback) {
    var self = this;
    //从redis中获取角色信息   name  openID vip
    self.redisRoleInfo = config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    //创建readis连接
    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });
    var hmGet = Q.nbind(self.client.hmget, self.client); //readis hash获取方法
    var method = [];
    for(var i in ret){
        method.push(hmGet(self.redisRoleInfo, ret[i].roleID));
    }
    Q.all(method).then(function (roles) {
        for(var i in roles){
            var newRole = JSON.parse(roles[i]);
            for(var j in ret){
                if(ret[j]["roleID"] == newRole["roleID"]){
                    ret[j]["openID"] = newRole["openID"];
                    ret[j]["name"] = newRole["name"];
                    ret[j]["viplevel"] = newRole["vipLevel"];
                }
            }
        }
        return callback(null, ret);
    })
    .catch(function (err) {
        logger.error("error when GetChart %s", utils.getErrorMessage(err));
        return callback(errorCodes.ParameterWrong);
    })
    .done();
}


/**
 * 发放公会红包
 */
Handler.SendUnionGift = function (roleID, callback) {
    logger.fatal("****SendUnionGift 111111111 ,roleID: %j ", roleID);
    //获取工会ID
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if(!player){
        return callback(null, {result: errorCodes.NoRole});
    }
    var vip =  player["playerInfo"][ePlayerInfo.VipLevel];
    var picture = player["playerInfo"][ePlayerInfo.Picture];
    var openID =  player["playerInfo"][ePlayerInfo.openID];
    var name =  player["playerInfo"][ePlayerInfo.NAME];

    if(vip == 0){
        logger.fatal("****SendUnionGift 222222 ,roleID: %j ", roleID);
        return callback(null, {result: errorCodes.SEDN_VIP_LEVEL_UNION_GIFT});
    }
    var VipTemplate = templateManager.GetTemplateByID('VipTemplate', vip+1);
    if(!VipTemplate){
        logger.fatal("****SendUnionGift 33333 ,roleID: %j ", roleID);
        return callback(null, {result: errorCodes.NoTemplate});
    }
    if(VipTemplate["consumeNum"]==0){
        //VIP等级不够发放红包
        logger.fatal("****SendUnionGift 4444444 ,roleID: %j ", roleID);
        return callback(null, {result: errorCodes.SEDN_VIP_LEVEL_UNION_GIFT});
    }
    //var unionID = player["playerInfo"][ePlayerInfo.UnionID];
    if(!self.unionMemberList[roleID]){
        logger.fatal("****SendUnionGift 55555 ,roleID: %j ", roleID);
        return callback(null, {result: errorCodes.RoleNoUnion});
    }
    var unionID = self.unionMemberList[roleID].unionID;

    //查看今天是否已经发放过
    var unionGiftSend = self.unionGiftSend[unionID];
    for (var send in unionGiftSend) {
       if(unionGiftSend[send].roleID == roleID){
            //已经发送过了土豪
           logger.fatal("****SendUnionGift 66666 ,roleID: %j ", roleID);
           return callback(null, {result: errorCodes.SEDN_ALREADY_UNION_GIFT});
        }
    }
    //钻石资产
    var assets = {
        tempID : globalFunction.GetYuanBaoTemp(),
        value : VipTemplate["consumeNum"]
    };
    logger.fatal("****SendUnionGift ,roleID: %j , assets : %j , giftID: %j , csID: %j", roleID, assets, VipTemplate["giftID"], player["csID"]);
    //rpc调用cs发放公会红包   扣掉消费钻石 奖励发放者礼包
    pomelo.app.rpc.cs.csRemote.SendUnionGift(null, player["csID"], roleID, assets, gameConst.eAssetsChangeReason.Reduce.SendUnionGift , VipTemplate["giftID"], function (err, result) {
        logger.fatal("****SendUnionGift rpc to csRemote  result : %j ,roleID :%j", result, roleID);
        if (err != null) {
            logger.fatal("****SendUnionGift rpc to csRemote  err: %s ", utils.getErrorMessage(err));
            return callback(null, {result: errorCodes.SystemWrong});
        }
        if (result.result != 0) {
            logger.fatal("****SendUnionGift 7777777 ,roleID: %j ", roleID);
            return callback(null, {result: result.result});
        }
        var sendTime = utilSql.DateToString(new Date());
        var sendInfo = {
            unionID : unionID,
            roleID : roleID,
            giftID : VipTemplate["treasureChestID"],
            createTime : sendTime,
            openID : openID,
            picture : picture,
            name : name,
            viplevel : vip
        };
        //添加发放记录
        if(!self.unionGiftSend[unionID]){
            self.unionGiftSend[unionID] = {};
        }
        self.unionGiftSend[unionID][roleID] = sendInfo
        logger.fatal("****SendUnionGift ,The union unionGiftSendInfo: %j  , roleID :%j ", self.unionGiftSend[unionID], roleID);
        var retOK = {
            result: errorCodes.OK
        }
        self.SendUnionGiftChange(roleID, null, utils.done);
        self.SetUnionLog(unionID,
            defaultValues.Union_RiZhiType_8,
            roleID, null);
        return callback(null,  retOK);
    });
};

/**
 * 同步VIP等级
 */
Handler.UpdateRoleVIP = function (roleID, vip, callback) {
    logger.fatal("****UpdateRoleVIP ,roleID:%j , vip :%j  ", roleID, vip);
    var player = playerManager.GetPlayer(roleID);
    if(!!player){
        player["playerInfo"][ePlayerInfo.VipLevel] = vip;
    }
    return callback(null);
}

/**
 * 领取公会玩家发的红包（其实是随机宝箱中的一个东西）
 */
Handler.GetUnionGiftForPlayer = function (roleID, fromID, callback) {
    logger.fatal("****GetUnionGiftForPlayer,roleID:%j , fromID:%j  ", roleID, fromID);
    //获取工会ID
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    //var unionID = player["playerInfo"][ePlayerInfo.UnionID]; 第一次登陆值为空
    if(!self.unionMemberList[roleID]){
        logger.fatal("****GetUnionGiftForPlayer 11111 ,roleID:%j   ", roleID);
        return callback(null, {result: errorCodes.RoleNoUnion});
    }
    var unionID = self.unionMemberList[roleID].unionID;
    var unionGiftSend = self.unionGiftSend[unionID]; //此公会下发放的所有红包
    var unionGiftRec = self.unionGiftReceive[roleID]; //此角色领取过的所有红包
    if(!unionGiftSend){
        logger.fatal("****GetUnionGiftForPlayer 22222 ,roleID:%j   ", roleID);
        return callback(null, {result: errorCodes.RECH_NULL_UNION_GIFT});
    }
    var joinUnionTime = self.unionMemberList[roleID].createTime; //玩家入公会时间
    var unionNowSend = unionGiftSend[fromID];    //将要领取的红包

    if(!unionNowSend){
        logger.fatal("****GetUnionGiftForPlayer 33333 ,roleID:%j   ", roleID);
        return callback(null, {result: errorCodes.RECH_NULL_UNION_GIFT});
    }

//    //不能领取自己的
//    if (unionNowSend.roleID==roleID) {
//        return callback(null, {result: errorCodes.RECH_SELF_UNION_GIFT});
//    }
    //判断是否领取过
    for (var r in unionGiftRec) {
        if(unionGiftRec[r].fromID == fromID){
            logger.fatal("****GetUnionGiftForPlayer 44444 ,roleID:%j   ", roleID);
            return callback(null, {result: errorCodes.RECH_RECEIVE_UNION_GIFT});
        }
    }
    //判断入会时间是否在发送礼包时间之后
    logger.fatal("****GetUnionGiftForPlayer, joinUnionTime :%j , giftSendTime :%j , roleID :%j ", joinUnionTime, unionNowSend.createTime, roleID);
    if(new Date(joinUnionTime) > new Date(unionNowSend.createTime)){
        return callback(null, {result: errorCodes.RECH_BEFORE_UNION_GIFT});
    }

    //记录已发送
    var recTime = utilSql.DateToString(new Date());
    var recInfo = {
        roleID : roleID,
        fromID : fromID,
        createTime : recTime
    };

    //发送红包礼物  其实是从宝箱中随机获取一个
    var giftId = unionNowSend.giftID;
    var items = this.RandOneByBox(giftId);

    if(!items){
        logger.fatal("****GetUnionGiftForPlayer,NoGift:%j ",giftId);
        return callback(null, {result: errorCodes.Cs_NoGift});
    }else{
        //给用户添加物品
        logger.fatal("****GetUnionGiftForPlayer ,getBoxItem: %j ", items);
        //rpc调用cs发放公会红包   扣掉消费钻石 奖励发放者礼包
        pomelo.app.rpc.cs.csRemote.GetUnionGift(null, player["csID"], roleID, items, gameConst.eAssetsChangeReason.Add.UnionGift , function (err, result) {
            logger.fatal("****ReceiveUnionGift rpc to csRemote  result : %j ", result);
            if (err != null) {
                logger.fatal("****ReceiveUnionGift rpc to csRemote  err: %s ", utils.getErrorMessage(err));
                return callback(null, {result: errorCodes.SystemWrong});
            }
            if (result.result != 0) {
                return callback(null, {result: result.result});
            }

            //添加领取记录
            if(!self.unionGiftReceive[roleID]){
                self.unionGiftReceive[roleID] = {};
            }
            self.unionGiftReceive[roleID][fromID] = recInfo;

            var retOK = {
                result: errorCodes.OK
            }
            retOK["item"] = items;
            logger.fatal("****GetUnionGiftForPlayer, unionGiftReceive :%j ,return: %j , roleID :%j   ", self.unionGiftReceive, retOK, roleID);
            return callback(null, retOK);
        });
    }
};

/**
 * 主动给客户端发送 已发送过公会红包状态
 * */
Handler.SendUnionGiftChange = function ( roleID, isSend, callback) {
    logger.fatal("****SendUnionGiftChange player  roleID: %j   ", roleID);
    var self = this;
    var route = 'SendUnionGiftChange';
    //var route = 'SendUnionGiftMsg';
    //var route = 'SendTempleMsg';
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.fatal("****SendUnionGiftChange player  is null, roleID: %j     ", roleID);
        return callback(null, errorCodes.NoRole);
    }
    if(!self.unionMemberList[roleID]){
        //没有公会
        logger.fatal("****SendUnionGiftChange this unionMemberList[%j] is null     ", roleID);
        return callback(null, errorCodes.RoleNoUnion);
    }
    var unionID = self.unionMemberList[roleID].unionID;
    var Msg = {
        result: errorCodes.OK,
        isSendUnionGift: 2 //1 已发过 不能发红包 2 可以发红包
    };
    if(!!isSend){ //12点清空记录时有值 传默认值2
        player.SendMessage(route, Msg);
        return callback(null, Msg);
    }else{      //其他调用判断是否有发送红包记录
        if(!!self.unionGiftSend[unionID]){
            var roleSend = self.unionGiftSend[unionID][roleID];
            if(!!roleSend){//此人发送过红包
                Msg["isSendUnionGift"] = 1;
            }
        }
        logger.fatal("****SendUnionGiftChange this unionGiftSend[%j] is Send Msg: %j    ", unionID, Msg);
        player.SendMessage(route, Msg);
        return callback(null, Msg);
    }
}

/**
 * 获取是否可以获得炼狱积分
 * */
Handler.GetUnionLianYu = function (roleID, callback) {
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.fatal("****SendUnionGiftChange player  is null, roleID: %j     ", roleID);
        return callback(null, errorCodes.NoRole);
    }
    if(!self.unionMemberList[roleID]){
        //没有公会
        logger.fatal("****SendUnionGiftChange this unionMemberList[%j] is null     ", roleID);
        return callback(null, errorCodes.RoleNoUnion);
    }
    var unionID = self.unionMemberList[roleID].unionID;
    if(!!self.unionData[unionID]){
        var count = self.unionData[unionID].lianYuCount;
        //取公会人数
        //var memberNum = self.unionList[unionID].memberNum;
        var thisUnion = self.union.GetUnionInfo(unionID, self.unionList);
        var unionLevel = thisUnion.unionLevel;
        var attID = 1000 + unionLevel;
        var UnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', attID);
        if (!UnionLevelTemplate) {
            return callback({'result': errorCodes.ParameterNull});
        }
        var memberNum = UnionLevelTemplate[tUnionLeve.maxRoleNum];
        logger.fatal("****GetUnionLianYu count :%j, memberNumX3 : %j ", count, memberNum*3 );
        if(count > (memberNum*3)){
            var Msg = {
                result: errorCodes.OK,
                lianyu: 2 //1 可以领取不用弹提示  2 炼狱次数已超过 不能增加积分
            };
            return callback(null, Msg);
        }
    }
    var Msg = {
        result: errorCodes.OK,
        lianyu: 1 //1 可以领取不用弹提示  2 炼狱次数已超过 不能增加积分
    };
    return callback(null, Msg);
};

// 查找公会信息
Handler.findUnion = function (unionID, playerApplyInfo, callback) {
    var self = this;
    var unionList = [];
    var u = self.unionList[unionID];
    if (!!u) {
        unionList.push(u);
        return self.union.GetUnionList(unionList, playerApplyInfo, callback);
    }
    return callback({result: errorCodes.UnionNoExist});
};

// 查看公会成员
Handler.joinUnion = function (csID, roleID, callback) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        if (!self.unionApplyList[unionID]) {
            unionApplyNum = 0;
        } else {
            var unionApplyNum = JSON.parse(self.unionApplyList[unionID].applyList).length;
        }
        self.union.GetPlayerUnionInfo(roleID, self.unionList, self.unionMemberList, unionApplyNum, callback);
        var unionInfo = self.GetUnion(unionID);
        if (unionInfo) {
            self.union.SetPlayerUnionInfo(csID, roleID, unionID, unionInfo.unionName, unionInfo.unionLevel,
                                          function (err, unionID) {
                                              ;
                                          });
        }

    } else {
        self.union.SetPlayerUnionInfo(csID, roleID, 0, '', 0,
                                      function (err, uID) {
                                          return  callback({'result': errorCodes.UnionNoExist});
                                      });
    }

};

// 分页
Handler.unionMemberListPaging = function (csID, roleID, begenID, callback) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        self.union.unionMemberPaging(roleID, begenID, self.unionMemberList, callback);
    } else {
        self.union.SetPlayerUnionInfo(csID, roleID, 0, '', 0,
                                      function (err, uID) {
                                          return  callback({'result': errorCodes.UnionNoExist});
                                      });
    }
};

//
Handler.editAnnouncement = function (roleID, announcement) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        if (!globalFunction.IsValidUnionAnnouncement(announcement)) {
            return {result: errorCodes.UnionAnnouncementNumLong};
        }
        var unionRole = self.unionMemberList[roleID].unionRole;
        if (!_.contains([1, 2], unionRole)) {
            return { 'result': errorCodes.NoUnionAuthority };
        }
        self.unionList[unionID].announcement = announcement;
        return { 'result': errorCodes.OK, 'editAnnouncement': announcement };
    }
    return { 'result': errorCodes.UpdateAnnouncementDefeated };

};

// 玩家加入公会
Handler.playerAddUnion = function (csID, roleID, playerID, callback) {
    var self = this;
    if (0 == playerID) {
        return  callback({'result': errorCodes.ParameterWrong});
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var playerUnionID = self.union.GetPlayerUnionID(playerID, self.unionMemberList);
    if(playerUnionID != null && playerUnionID != 0){
        self.DeleteUnionApplyListRole(unionID, playerID);
        return  callback({'result': errorCodes.PlayerExistUnion});
    }

    var thisUnion = self.union.GetUnionInfo(unionID, self.unionList);
    if(thisUnion == null){
        return  callback({'result': errorCodes.UnionNoExist});
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!self.VerifyRoleUnionApply(unionID, playerID)) {
        return  callback({'result': errorCodes.UnionNoRole});
    }
    var thisUnion = self.union.GetUnionInfo(unionID, self.unionList);
    var unionMembers = self.union.GetUnionMemberList(unionID, self.unionMemberList);
    var unionLevel = thisUnion.unionLevel;
    var attID = 1000 + unionLevel;
    var UnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', attID);
    if (!UnionLevelTemplate) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var maxRoleNum = UnionLevelTemplate[tUnionLeve.maxRoleNum];
    if (unionMembers.length >= maxRoleNum) {
        return callback({'result': errorCodes.UnionNumFull});
    }

    // 计算剩余冷却时间
    var cdTime = this.playerSignOutTime[playerID];
    if(cdTime != null){
        var day = 24 * 60 * 60 * 1000;
        var h = 60 * 60 * 1000;
        var m = 60 * 1000;
        var hours = 0;
        var minutes = 0;
        var sDate = new Date(cdTime.leaveTime);
        var nDate = new Date();
        var time = nDate - sDate;
        if (time <= day) {
            var dateTime = day - time;
            hours = Math.floor(dateTime / h);
            minutes = Math.floor((dateTime % h) / m);
            return callback( {'result': errorCodes.UnionSignOutTime, 'hours': hours, 'minutes': minutes});
        }else{
            delete this.playerSignOutTime[playerID];
        }
    }

    var unionMemberInfo = new Array(eUnionMemberInfo.MAX);
    for (var mInfo in eUnionMemberInfo) {
        if(eUnionMemberInfo[mInfo] != eUnionMemberInfo.MAX){
            unionMemberInfo[eUnionMemberInfo[mInfo]] = 0;
        }
    }

    unionMemberInfo[eUnionMemberInfo.roleID] = playerID;
    unionMemberInfo[eUnionMemberInfo.unionID] = unionID;
    unionMemberInfo[eUnionMemberInfo.devoteInit] = 1;
    unionMemberInfo[eUnionMemberInfo.createTime] = utilSql.DateToString(new Date());
    unionMemberInfo[eUnionMemberInfo.logTime] = utilSql.DateToString(new Date('1970-01-01'));
    var unionMemberInfoSqlStr = unionIOController.GetUnionMemberInfoSqlStr(unionMemberInfo);
    usSql.SaveUnionMember(unionID, [playerID, unionMemberInfoSqlStr], function (err, result) {
        if (!!err || result > 0) {
            if (result != errorCodes.UnionNameExist) {
                logger.error('playerAddUnion failed: result: %j, err: %s',
                    result, utils.getErrorMessage(err));
            }
        }
        var memberInfo = self.union.convertArrayToJson(unionMemberInfo, eUnionMemberInfo);
        self.unionMemberList[playerID] = memberInfo;
        var player = playerManager.GetPlayer(playerID);
        var csID = null;
        if (null != player) {
            csID = player.GetPlayerCs();
        }
        self.union.SetPlayerUnionInfo(csID, playerID, unionID, thisUnion.unionName, unionLevel, function (err, uID) {
            self.DeleteUnionApplyListRole(unionID, playerID);
            self.union.GetPlayerInfo(playerID, function (err, details, csID) {
                if (!!err) {
                    return  callback({'result': errorCodes.PlayerExistUnion});
                }
                if (!details) {
                    logger.warn('warn when playerAddUnion for union file,roleID=%j,details=%j',
                        roleID,
                        details);
                    return  callback({'result': errorCodes.PlayerExistUnion});
                }
                var log = {
                    'unionID': unionID,
                    'type': 1,
                    'roleID1': playerID,
                    'roleID2': 0,
                    'roleName1': details.name,
                    'roleName2': '',
                    'createTime': utilSql.DateToString(new Date())};

                self.SetUnionMemberNum(unionID);
                self.AddUnionLog(unionID, log);
                var mailDetail = {
                    recvID: playerID,
                    subject: sUsString.subject,
                    mailType: gameConst.eMailType.System,
                    content: util.format(sUsString.content_1, thisUnion.unionName), //thisUnion.unionName
                    items: []
                };
                self.SendUnionMail(mailDetail, utils.done);
                return  callback({'result': 0, 'roleID': playerID});
            });
        });
    });

};

//　玩家申请公会
Handler.playerApplyUnion = function (roleID, unionID, callback) {
    var self = this;
    if (null == roleID || null == unionID) {
        return callback({'result': errorCodes.ParameterNull});
    }

    var unionApplyInfo = self.unionApplyList[unionID];
    var playerApplyInfo = self.playerApplyList[roleID];
    var thisUnion = self.union.GetUnionInfo(unionID, self.unionList);
    if (null == thisUnion) {
        return callback({'result': errorCodes.SystemWrong});
    }
    var unionMembers = self.union.GetUnionMemberList(unionID, self.unionMemberList);
    var unionLevel = thisUnion.unionLevel;
    var attID = 1000 + unionLevel;
    var UnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', attID);
    if (!UnionLevelTemplate) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var maxRoleNum = UnionLevelTemplate[tUnionLeve.maxRoleNum];
    if (unionMembers.length >= maxRoleNum) {
        return callback({'result': errorCodes.UnionNumFull});
    }
    var applyList = [];
    if(unionApplyInfo != null){
        applyList = JSON.parse(unionApplyInfo.applyList);
        if (applyList.length >= defaultValues.UnionApplyNumMax) {
            return callback({'result': errorCodes.UnionAppalyNumFull});
        }
    }

    if(playerApplyInfo == null){
        playerApplyInfo = [];
    }else{
        if (_.contains(playerApplyInfo, unionID)) {
            return callback({'result': errorCodes.AlreadyApplyUnion});
        }
        if(playerApplyInfo.length >= MAX_APPLY_NUM){
            return callback({'result': errorCodes.PlayerAppalyNumFull});
        }
    }

    // 计算剩余冷却时间
    var cdTime = this.playerSignOutTime[roleID];
    if(cdTime != null){
        var day = 24 * 60 * 60 * 1000;
        var h = 60 * 60 * 1000;
        var m = 60 * 1000;
        var hours = 0;
        var minutes = 0;
        var sDate = new Date(cdTime.leaveTime);
        var nDate = new Date();
        var time = nDate - sDate;
        if (time <= day) {
            var dateTime = day - time;
            hours = Math.floor(dateTime / h);
            minutes = Math.floor((dateTime % h) / m);
            return callback({'result': errorCodes.UnionSignOutTime, 'hours': hours, 'minutes': minutes});
        }else{
            delete this.playerSignOutTime[roleID];
        }
    }

    if (unionApplyInfo == null) {
        var unionApply = {};
        applyList.push(roleID);
        unionApply['unionID'] = unionID;
        unionApply['applyList'] = JSON.stringify(applyList);
        self.AddUnionApply(unionID, unionApply);
    } else {
        if (!_.contains(applyList, roleID)) {
            applyList.push(roleID);
        }
        unionApplyInfo['applyList'] = JSON.stringify(applyList);
        self.AddUnionApply(unionID, unionApplyInfo);
    }

    if (playerApplyInfo == null) {
        playerApplyInfo = [];
    }
    playerApplyInfo.push(unionID);
    self.playerApplyList[roleID] = playerApplyInfo;

    return  callback({'result': 0, 'unionID': unionID, 'applyNum': 10 - playerApplyInfo.length});
};


// 删除角色信息
Handler.DeleteRoleUnionInfo = function (roleID, callback) {
    var self = this;
    self.DeleteUnionApplyOfRoleID(roleID);//删除申请列表
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        var thisMember = self.unionMemberList[roleID];
        var unionInfo = self.GetUnion(unionID);
        if (!!thisMember) {
            var mTop = thisMember.unionRole;
            var unionName = unionInfo.unionName;
            if (1 == mTop) {
                var memberNum = self.VerifyUnionMemberNum(unionID);
                if (memberNum.length <= 1) {
                    usSql.DeleteUnionName(unionName, function (err, result) {
                        self.DeleteUnionInfo(unionID);
                        self.SetUnionMemberNum(unionID);
                        return callback(err);
                    });
                } else {
                    var memberRoleArray = self.VerifyUnionMemberRole(unionID);
                    if (memberRoleArray.length > 0) {
                        var playerID = memberRoleArray[0];
                        self.playerMakeUnionBoos(roleID, playerID, false, function (res) {
                            usSql.DeleteMember(unionID, roleID, function (err, result) {
                                self.DeleteMemberOfRoleID(roleID);
                                self.SetUnionMemberNum(unionID);
                                return callback(err);
                            });
                        });
                    } else {
                        var members = self.VerifyUnionMemberWeiWang(memberNum);
                        if (members.length > 0) {
                            var playerID = members[0];
                            self.playerMakeUnionBoos(roleID, playerID, false, function (res) {
                                usSql.DeleteMember(unionID, roleID, function (err, result) {
                                    self.DeleteMemberOfRoleID(roleID);
                                    self.SetUnionMemberNum(unionID);
                                    return callback(err);
                                });
                            });
                        } else {
                            usSql.DeleteUnionName(unionName, function (err, result) {
                                self.DeleteUnionInfo(unionID);
                                self.SetUnionMemberNum(unionID);
                                return callback(err);
                            });
                        }
                    }
                }
            } else {
                usSql.DeleteMember(unionID, roleID, function (err, result) {
                    self.DeleteMemberOfRoleID(roleID);
                    self.SetUnionMemberNum(unionID);
                    return callback(err);
                });
            }

        }
    } else {
        return callback(null);
    }
};

// 删除公会信息 城主公会删除后，吊销掉城主
Handler.DeleteUnionInfo = function (unionID) {
    var self = this;
    var union = self.unionList[unionID];
    if (!!union) {
        if(union['isDuke'] > 0){
            self.dukeUnion = null;
        }
        self.union.DeleteUnionRedisInfo(unionID);
        delete self.unionList[unionID];
        if (!!self.unionLogList[unionID]) {
            delete self.unionLogList[unionID];
        }
    }

    var deleteList = {};

    for (var m in self.unionMemberList) {
        if (unionID == self.unionMemberList[m].unionID) {
            deleteList[m] = 1;
        }
    }

    for (var roleID in deleteList) {
        if (deleteList[roleID] != 1) {
            continue;
        }
        delete self.unionMemberList[roleID];
    }

    if (self.unionMagicInfo[unionID] != null) {
        delete self.unionMagicInfo[unionID];
    }

    if(self.unionTempleInfo[unionID] != null){
        delete self.unionTempleInfo[unionID];
    }

    if(self.unionAnimalList[unionID] != null){
        delete self.unionAnimalList[unionID];
    }

    usSql.DeleteUnionInfo(unionID, function (err, result) {
    });
};


// 删除成员信息
Handler.DeleteMemberOfRoleID = function (roleID) {
    var self = this;
    var member = self.unionMemberList[roleID];
    if (!!member) {
        delete  self.unionMemberList[roleID];
    }
};

// 删除申请中的角色信息
Handler.DeleteUnionApplyOfRoleID = function (roleID) {
    var self = this;
    for (var unionID in self.unionApplyList) {
        var unionApply = self.unionApplyList[unionID];
        if (!!unionApply) {
            var applyList = JSON.parse(unionApply['applyList']);
            var top = _.contains(applyList, roleID);
            if (top) {
                applyList = _.without(applyList, roleID);
                self.unionApplyList[unionID].applyList = JSON.stringify(applyList);
            }
        }
    }
};

// 得到公会的申请列表
Handler.getUnionApplyInfo = function (roleID, begenID, callback) {
    var self = this;
    if (null == roleID || null == begenID) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        var unionRole = self.unionMemberList[roleID].unionRole;
        if (!_.contains([1, 2], unionRole)) {
            return { 'result': errorCodes.NoUnionAuthority };
        }
        var unionApplyInfo = self.unionApplyList[unionID];
        if (!unionApplyInfo) {
//            return callback({'result': errorCodes.UnionApplyNumNo});
            var unionApplyList = [];
            self.union.getUnionApplyInfoList(begenID, unionApplyList, callback);
        } else {
            var unionApplyList = JSON.parse(unionApplyInfo.applyList);
            self.union.getUnionApplyInfoList(begenID, unionApplyList, callback);
        }
    } else {
        return callback({'result': errorCodes.NoUnion});
    }
};

// 拒绝所有的申请
Handler.refuseAllApply = function (roleID, applylist, callback) {
    var self = this;
    if (null == roleID || null == applylist) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        var unionApplyInfo = self.unionApplyList[unionID];
        if (!unionApplyInfo) {
            return callback({'result': errorCodes.UnionApplyNumNo});
        } else {
            var unionApplyList = JSON.parse(unionApplyInfo.applyList);
            if (0 == unionApplyList.length) {
                return callback({'result': errorCodes.UnionApplyNumNo});
            }
            var l = unionApplyList.length;
            for (var i = 0; i < l; i++) {
                var member = unionApplyList[i];
                if (_.contains(applylist, member)) {
                    unionApplyList.splice(i, 1)
                    i--;
                }
            }
            unionApplyInfo.applyList = JSON.stringify(unionApplyList);
            return callback({'result': errorCodes.OK})
        }
    }
};

// 发送公会邮件
Handler.SendUnionMail = function (mailDetail, callback) {
    if (!mailDetail) {
        return callback({'result': errorCodes.ParameterWrong});
    }
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, function (err) {
        if (!!err) {
            logger.error('callback error: %s', utils.getErrorMessage(err));
        }
        return callback(null, {'result': errorCodes.OK});
    });
};

// 离开
Handler.playerSignOutUnion = function (roleID, csID, callback) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        var unionRole = self.unionMemberList[roleID].unionRole;
        var memberNum = self.VerifyUnionMemberNum(unionID);
        if (1 == unionRole && memberNum.length > 1) {
            return callback({'result': errorCodes.PlayerUnoinBoss});
        }
        if(memberNum.length == 1 && self.dukeUnion != null && self.dukeUnion['unionID'] == unionID){
            return callback({'result': errorCodes.UnionDukeNotDis});
        }
        self.DeleteRoleUnionInfo(roleID, function (err, result) {
            self.union.SetPlayerUnionInfo(csID, roleID, 0, '', 0, function (err, uID) {
                self.SetUnionLog(unionID,
                                 defaultValues.Union_RiZhiType_2,
                                 roleID, null);
                self.SetUnionMemberNum(unionID);
                self.playerSignOutTime[roleID] = { roleID : roleID, leaveTime : utilSql.DateToString(new Date()) };
                return callback({'result': errorCodes.OK});
            });
        });
    } else {
        return callback({'result': errorCodes.NoUnion});
    }

};

// 清除公会成员
Handler.clearUnionMember = function (roleID, csID, playerID, callback) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(playerID, self.unionMemberList);
    if (!!unionID) {
        var thisUnion = self.GetUnion(unionID);
        self.DeleteRoleUnionInfo(playerID, function (err, result) {
            if (!!unionID) {
                var player = playerManager.GetPlayer(playerID);
                var csID = null;
                if (null != player) {
                    csID = player.GetPlayerCs();
                }

                self.union.SetPlayerUnionInfo(csID, playerID, 0, '', 0, function (err, uID) {
                    var unionMembers = self.union.GetUnionMemberList(unionID,
                                                                     self.unionMemberList);
                    self.SetUnionLog(unionID,
                                     defaultValues.Union_RiZhiType_3,
                                     roleID, playerID);
                    self.SetUnionMemberNum(unionID);
                    var mailDetail = {
                        recvID: playerID,
                        subject: sUsString.subject,
                        mailType: gameConst.eMailType.System,
                        content: util.format(sUsString.content_2, thisUnion.unionName), //thisUnion.unionName
                        items: []
                    };
                    self.SendUnionMail(mailDetail, utils.done);
                    self.playerSignOutTime[playerID] = { roleID : playerID, leaveTime : utilSql.DateToString(new Date()) };
                    return callback({'result': errorCodes.OK, 'roleID': playerID, 'memberNum': unionMembers.length });
                });
            } else {
                return callback({'result': errorCodes.NoUnionAuthority});
            }
        });
    } else {
        return callback({'result': errorCodes.NoUnion});
    }

};

// 升级公会信息
Handler.upgradeUnionInfo = function (roleID, callback) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        var unionRole = self.unionMemberList[roleID].unionRole;
        if (!_.contains([1, 2], unionRole)) {
            return { 'result': errorCodes.NoUnionAuthority };
        }
        var union = self.GetUnion(unionID);
        var unionLevel = union.unionLevel;
        var unionWeiWang = union.unionWeiWang;
        var attID = 1000 + unionLevel;
        var UnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', attID);
        if (!UnionLevelTemplate) {
            return callback({'result': errorCodes.ParameterNull});
        }
        var nextID = UnionLevelTemplate[tUnionLeve.nextID];
        if (0 == nextID) {
            return callback({'result': errorCodes.UnionLevelFull});
        }
        var NextUnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', nextID);
        if (!NextUnionLevelTemplate) {
            return callback({'result': errorCodes.ParameterNull});
        }
        var upNeedNum = NextUnionLevelTemplate[tUnionLeve.upNeedNum];
        if (unionWeiWang < upNeedNum) {
            return callback({'result': errorCodes.UnionWeiWangLack});
        }
        var newUnionLevel = NextUnionLevelTemplate[tUnionLeve.level];
        var newUnionWeiWang = unionWeiWang - NextUnionLevelTemplate[tUnionLeve.upNeedNum];
        union['unionLevel'] = newUnionLevel;
        union['unionWeiWang'] = newUnionWeiWang;

        // 升级后同步所有玩家的公会的等级，在线的。。
        var memberList = self.union.GetUnionMemberList(unionID, self.unionMemberList);
        for (var member in memberList) {
            var memRoleID = memberList[member]['roleID'];
            self.SyncUnionLevel(memRoleID);
        }

        self.SetUnionLog(unionID,
                         defaultValues.Union_RiZhiType_7,
                         roleID, newUnionLevel);
        self.union.UpdateUnionRedisInfo(unionID, union);
        self.union.GetUnionRanking(unionID, function (ranking) {
            var rank = 0;
            if (null != ranking) {
                rank = ranking + 1;
            }
            return callback(
                {'result': errorCodes.OK, 'unionLevel': newUnionLevel, 'unionWeiWang': newUnionWeiWang, 'ranking': rank});
        });
    } else {
        return callback({'result': errorCodes.NoUnion});
    }
};

// ？？
Handler.playerRobBoos = function (roleID, callback) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {
        var union = self.GetUnion(unionID);
        var bsID = union.bossID;
        self.unionMemberList[bsID].unionRole = 0;
        union.bossID = roleID;
        self.unionMemberList[roleID].unionRole = 1;
        self.SetUnionLog(unionID,
                         defaultValues.Union_RiZhiType_5,
                         roleID, bsID);
        var mailDetail = {
            recvID: bsID,
            subject: sUsString.subject,
            mailType: gameConst.eMailType.System,
            content: sUsString.content_3,
            items: []
        };
        self.SendUnionMail(mailDetail, utils.done);
        return callback({'result': errorCodes.OK});
    }
    return callback({'result': errorCodes.ParameterNull});
};

// 成为会长
Handler.playerMakeUnionBoos = function (roleID, playerID, logTop, callback) {
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!!unionID) {

        var targMember = self.unionMemberList[playerID];
        if (!targMember || targMember.unionID != unionID) {
            return callback({'result': errorCodes.UnionNoRole});
        }
        var union = self.GetUnion(unionID);
        self.unionMemberList[roleID].unionRole = 0;
        union.bossID = +playerID;
        self.unionMemberList[playerID].unionRole = 1;
        if (logTop) {
            self.SetUnionLog(unionID,
                             defaultValues.Union_RiZhiType_4,
                             playerID, roleID);
            var mailDetail = {
                recvID: playerID,
                subject: sUsString.subject,
                mailType: gameConst.eMailType.System,
                content: util.format(sUsString.content_4, union.unionName), //union.unionName
                items: []
            };
            self.SendUnionMail(mailDetail, utils.done);
        }
        return callback({'result': errorCodes.OK});
    } else {
        return callback({'result': errorCodes.ParameterNull});
    }
};

// 提升副会长操作, 操作只可能在2和0之间进行
Handler.boosTakeOfficeMember = function (roleID, playerID, type, callback) {
    var self = this;
    var member = self.unionMemberList[playerID];
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (!member || !unionID) {
        return callback({'result': errorCodes.RoleNoUnion});
    }
    if (!_.contains([0, 2], type)) {
        return callback({'result': errorCodes.ParameterWrong});
    }
    var unionBossID = self.unionList[unionID].bossID;
    if (roleID != unionBossID) {
        return callback({'result': errorCodes.NoUnionAuthority});
    }
    var officeMember = self.VerifyUnionMemberRole(unionID);
    if (officeMember.length >= 2 && 2 == type) {
        return callback({'result': errorCodes.OfficeNumFull});
    }
    self.unionMemberList[playerID].unionRole = type;
    if (2 == type) {
        self.SetUnionLog(unionID,
                         defaultValues.Union_RiZhiType_6,
                         roleID, playerID);
    }
    return callback({'result': errorCodes.OK});
};

// 删除公会申请的角色
Handler.DeleteUnionApplyListRole = function (unionID, roleID) {
    var self = this;
    if (null == unionID || null == roleID) {
        return;
    }
    var unionApply = self.unionApplyList[unionID];
    if (!unionApply) {
        return;
    }
    var applyList = JSON.parse(unionApply['applyList']);
    if (_.contains(applyList, roleID)) {
        var index = _.indexOf(applyList, roleID);
        applyList.splice(index, 1);
        self.unionApplyList[unionID]['applyList'] = JSON.stringify(applyList);
    }

    var playerApplyInfo = this.playerApplyList[roleID];
    if(playerApplyInfo){
        if(_.contains(playerApplyInfo, unionID)){
            var index = _.indexOf(playerApplyInfo, unionID);
            playerApplyInfo.splice(index, 1);
        }
    }

};

// 查找角色的公会信息
Handler.FindRoleUnionInfo = function (roleID, callback) {
    var self = this;
    if (null == roleID) {
        return callback(null);
    }
    var member = self.unionMemberList[roleID];
    if (!member) {
        return callback(null);
    }
    var unionID = member['unionID'];
    var union = self.unionList[unionID];
    return callback(null, union);
};

// set威望
Handler.SetPlayerWeiWang = function (roleID, weiWang, callback) {
    var self = this;
    if (null == roleID) {
        return callback(null);
    }
    var member = self.unionMemberList[roleID];
    if (!member) {
        return callback(null);
    }
    self.unionMemberList[roleID].playerWeiWang += weiWang;
    self.unionMemberList[roleID].playerDevote += weiWang;
    var unionID = member['unionID'];
    if (!self.unionList[unionID]) {
        return callback(null);
    }
    var createTime = self.unionMemberList[roleID].createTime;
    if (0 != utils.getDayOfYear(new Date()) - utils.getDayOfYear(new Date(createTime))) {
        self.unionList[unionID].unionWeiWang += weiWang;
    }
    return callback(null);
};

// 公会日志分页
Handler.GetUnionLoggerListPaging = function (roleID, begenID) {
    var self = this;
    if (null == roleID || null == begenID) {
        return { 'result': errorCodes.ParameterNull};
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if(memberInfo == null){
        return { 'result': errorCodes.RoleNoUnion};
    }

    if (!!unionID) {
        var showTime = utilSql.DateToString(new Date());
        memberInfo['logTime'] = showTime;
        var unionLog = self.unionLogList[unionID];
        if (!unionLog) {
            unionLog = [];
        }
        var unionLogPage = begenID >= 0 ? unionLog.slice(begenID, begenID + 18) : unionLog.slice(0, 18);
        var msg = {
            'result': errorCodes.OK,
            'begenID': begenID,
            'listNum': unionLog.length,
            'LogList': []
        };
        for (var l in unionLogPage) {
            var log = {
                'type': unionLogPage[l].type,
                'roleName_1': unionLogPage[l].roleName1,
                'roleName_2': unionLogPage[l].roleName2,
                'time': utilSql.DateToString(new Date(unionLogPage[l].createTime))
            };
            msg.LogList.push(log);
        }
        return msg;
    } else {
        return { 'result': errorCodes.RoleNoUnion};
    }

};

// set公会日志
Handler.SetUnionLog = function (unionID, type, roleID, playerID) {
    var self = this;
    if (!unionID || !type || !roleID) {
        return;
    }
    self.union.GetPlayerInfo(roleID, function (err, detailOne) {
        if (!detailOne) {
            logger.warn('warn when SetUnionLog for union file,roleID=%j,details=%j',
                        roleID,
                        detailOne);
            return;
        }
        if (!playerID || defaultValues.Union_RiZhiType_7 == type) {
            var log = {
                'unionID': unionID,
                'type': type,
                'roleID1': roleID,
                'roleID2': defaultValues.Union_RiZhiType_7 == type ? playerID : 0,
                'roleName1': detailOne.name,
                'roleName2': defaultValues.Union_RiZhiType_7 == type ? playerID.toString() : '',
                'createTime': utilSql.DateToString(new Date())};
            self.AddUnionLog(unionID, log);
            return  errorCodes.OK;
        } else {
            self.union.GetPlayerInfo(playerID, function (err, detailTwo) {
                if (!detailTwo) {
                    logger.warn('warn when SetUnionLog for union file,roleID=%j,details=%j',
                                playerID,
                                detailTwo);
                    return;
                }
                var log = {
                    'unionID': unionID,
                    'type': type,
                    'roleID1': playerID,
                    'roleID2': roleID,
                    'roleName1': detailTwo.name,
                    'roleName2': detailOne.name,
                    'createTime': utilSql.DateToString(new Date())};
                self.AddUnionLog(unionID, log);
                return  errorCodes.OK;
            });
        }

    });
};

//
Handler.SetUnionListMemberNum = function (usionList) {
    var self = this;
    for (var i in usionList) {
        var unionID = usionList[i].unionID;
        self.SetUnionMemberNum(unionID)

    }
};

//
Handler.SetUnionMemberNum = function (unionID) {
    var self = this;
    if (!unionID) {
        return;
    }
    if (!!self.unionList[unionID]) {
        var unionMembers = self.union.GetUnionMemberList(unionID, self.unionMemberList);
        self.unionList[unionID].memberNum = unionMembers.length > 0 ? unionMembers.length : 1;
    }

};

//
Handler.VerifyUnionMemberNum = function (unionID) {
    var self = this;
    var memberArray = [];
    for (var u  in self.unionMemberList) {
        if (unionID == self.unionMemberList[u].unionID) {
            memberArray.push(u);
        }
    }
    return memberArray;
};

//
Handler.VerifyRoleUnionApply = function (unionID, roleID) {
    var self = this;
    var unionApply = self.unionApplyList[unionID];
    if (!unionApply || !roleID) {
        return false;
    }
    var al = JSON.parse(unionApply.applyList);
    if (!_.contains(al, roleID)) {
        return false;
    }
    return true;
};

//
Handler.VerifyUnionMemberRole = function (unionID) {
    var self = this;
    var memberArray = [];
    for (var u  in self.unionMemberList) {
        if (unionID == self.unionMemberList[u].unionID) {
            if (2 == self.unionMemberList[u].unionRole) {
                memberArray.push(u);
            }
        }
    }
    return memberArray;
};

//
Handler.VerifyUnionMemberWeiWang = function (memberArray) {
    var self = this;
    var members = [];
    for (var m  in memberArray) {
        var member = self.unionMemberList[memberArray[m]];
        if (1 != member.unionRole) {
            members.push(memberArray[m]);
        }
    }
    return members;
};

//
Handler.DeleteUnionLog = function () {
    var self = this;
    for (var unionID in self.unionLogList) {
        var unionLog = self.unionLogList[unionID];
        if(unionLog == null || unionLog.length <= 0){
            continue;
        }

        // 反向遍历
        for (var ul = unionLog.length - 1; ul >= 0; --ul) {
            var createTime = unionLog[ul].createTime;
            var logTime = utils.GetDateNYR(new Date(createTime));
            var todayTime = utils.GetDateNYR(new Date());
            var day = 24 * 60 * 60 * 1000;
            var logDay = new Date(todayTime) - new Date(logTime);
            if (Math.floor(logDay / day) >= 7) {
                unionLog.splice(+ul, 1);
            }
        }
    }
};

// 公会日志分页
Handler.HasNewLog = function (roleID) {
    var self = this;
    if (null == roleID) {
        return 0;
    }
    var memberInfo = self.unionMemberList[roleID];
    if(memberInfo == null){
        return 0;
    }

    var unionID = memberInfo['unionID'];
    if(!unionID){
        return 0;
    }

    var unionLog = self.unionLogList[unionID];
    if(unionLog == null || unionLog.length <= 0){
        return 0;
    }

    var roleTime = new Date(memberInfo['logTime']);

    for (var l in unionLog) {
        var loggerTime = new Date(unionLog[l]['createTime']);
        if(loggerTime > roleTime){
            return 1;
        }
    }

    return 0;
};


/**
 *
 * @constructor 十二点刷新
 */
Handler.UnionUpdate12Info = function () {
    var self = this;

    self.playerApplyList = {};

    // 角色祭拜奖励
    for(var roleID in self.playerOfferInfo){
        var roleIDINT = parseInt(roleID);
        self.OnGetLadyAward(roleIDINT);
    }

    self.playerOfferInfo = {};
    usSql.DeleteAllPlayerOffer(utils.done);

    for(var unionID in this.unionList){
        var unionInfo = this.unionList[unionID];
        if(unionInfo == null){
            continue;
        }
        this.resetLady(unionID);
    }

    //self.SaveUnionTempleInfo();
    var list = pomelo.app.getServersByType('cs');
    if (!list || !list.length) {
        logger.error('No cs available. %j', list);
        return;
    }
    for (var index in list) {
        var csSeverID = list[index].id;
        pomelo.app.rpc.cs.csRemote.UpdatePlayerTemple(null, csSeverID, function (err, result) {
            if (result != 0) {
                logger.error('UnionUpdate12Info:\n%j', result);
            }
        });
    }

    /** 每天0点清空公会红包*/
    //先给客户端用户发送消息可发送红包的消息
    for(var unionID in self.unionGiftSend){
        for(var roleID in self.unionGiftSend[unionID]){
            self.SendUnionGiftChange(roleID, 2,  utils.done);
        }
    }
    //再清空红包数据
    self.unionGiftSend = {};
    self.unionGiftReceive = {};
    usSql.DeleteAllUnionGift(utils.done);
    //清空公会炼狱次数
    self.unionData = {};
    usSql.DeleteAllUnionData(utils.done);

};

// 跨周清掉积分排行等数据
Handler.UnionUpdateWeekInfo = function () {
    for(var unionID in this.unionList){
        var unionInfo = this.unionList[unionID];
        if(unionInfo == null){
            continue;
        }
        unionInfo['unionScore'] = 0;
        unionInfo['scoreRank']= 0;
        unionInfo['ouccHel'] = 0;

        unionInfo['isRegister'] = 0;
        unionInfo['animalPowerful'] = 0;
        unionInfo['fightDamage'] = 0;
        this.union.UpdateUnionScoreRedisInfo(unionID, unionInfo);
    }
};

// 跨天获取公会祭拜奖励
Handler.OnGetLadyAward = function(roleID){
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if(unionID == null || unionID == 0){
        return;
    }

    var unionInfo = this.GetUnion(unionID);
    if(unionInfo == null){
        return;
    }

    var unionTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', unionInfo['unionLevel'] + 1000);
    if(unionTemplate == null){
        return;
            }

    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        return;
            }

    var offerInfo = this.playerOfferInfo[roleID];
    if(offerInfo == null){
        return;
    }

    var mailDetail = {
        recvID: roleID,
        subject: sUsString.subject1,
        mailType: gameConst.eMailType.System,
        content: sUsString.content_5,
        items: []
    };

    var ladyID1 = unionTemplate['ladyID1'] * 100 + templeInfo['templeLevel'];
    var ladyID2 = unionTemplate['ladyID2'] * 100 + templeInfo['templeLevel'];
    var ladyID3 = unionTemplate['ladyID3'] * 100 + templeInfo['templeLevel'];

    var sub = sUsString.subject2;
    var cont = sUsString.content_6;

    if(templeInfo['lady1ItemID'] > 0 && offerInfo['lady1Num'] > 0){
        var itemNum = templeInfo['lady1ItemNum'] * templeInfo['lady1PopDouble'] * offerInfo['lady1Num'] / 100;
        itemNum = Math.ceil(itemNum);
        mailDetail.items.push([templeInfo['lady1ItemID'], itemNum]);

        var giftMail = {
            recvID: roleID,
            subject: sub,
            mailType: gameConst.eMailType.System,
            content: cont,
            items: []
            }
        var ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID1);
        if(ladyTemplate != null){
            if(templeInfo['lady1PopDouble'] >= ladyTemplate['popularityDouble5']){
                var giftTemplate = templateManager.GetTemplateByID('GiftTemplate', ladyTemplate['giftID']);
                if (null != giftTemplate) {
                    var num = giftTemplate['itemNum'];
                    for (var i = 0; i < num; i++) {
                        var itemID1 = giftTemplate['itemID_' + i];
                        var itemNum1 = giftTemplate['itemNum_' + i];
                        giftMail.items.push([itemID1, itemNum1]);
                    }

                    if(giftMail.items.length > 0){
                        self.SendUnionMail(giftMail, utils.done);
                    }
                }
            }
        }
    }

    if(templeInfo['lady2ItemID'] > 0 && offerInfo['lady2Num'] > 0){
        var itemNum = templeInfo['lady2ItemNum'] * templeInfo['lady2PopDouble'] * offerInfo['lady2Num'] / 100;
        itemNum = Math.ceil(itemNum);
        mailDetail.items.push([templeInfo['lady2ItemID'], itemNum]);

        var giftMail = {
            recvID: roleID,
            subject: sub,
            mailType: gameConst.eMailType.System,
            content: cont,
            items: []
                    }
        var ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID2);
        if(ladyTemplate != null){
            if(templeInfo['lady2PopDouble'] >= ladyTemplate['popularityDouble5']){
                var giftTemplate = templateManager.GetTemplateByID('GiftTemplate', ladyTemplate['giftID']);
                if (null != giftTemplate) {
                    var num = giftTemplate['itemNum'];
                    for (var i = 0; i < num; i++) {
                        var itemID1 = giftTemplate['itemID_' + i];
                        var itemNum1 = giftTemplate['itemNum_' + i];
                        giftMail.items.push([itemID1, itemNum1]);
                    }

                    if(giftMail.items.length > 0){
                        self.SendUnionMail(giftMail, utils.done);
                    }
                }
            }
        }
    }

    if(templeInfo['lady3ItemID'] > 0 && offerInfo['lady3Num'] > 0){
        var itemNum = templeInfo['lady3ItemNum'] * templeInfo['lady3PopDouble'] * offerInfo['lady3Num'] / 100;
        itemNum = Math.ceil(itemNum);
        mailDetail.items.push([templeInfo['lady3ItemID'], itemNum]);

        var giftMail = {
            recvID: roleID,
            subject: sub,
            mailType: gameConst.eMailType.System,
            content: cont,
            items: []
                    }
        var ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID3);
        if(ladyTemplate != null){
            if(templeInfo['lady3PopDouble'] >= ladyTemplate['popularityDouble5']){
                var giftTemplate = templateManager.GetTemplateByID('GiftTemplate', ladyTemplate['giftID']);
                if (null != giftTemplate) {
                    var num = giftTemplate['itemNum'];
                    for (var i = 0; i < num; i++) {
                        var itemID1 = giftTemplate['itemID_' + i];
                        var itemNum1 = giftTemplate['itemNum_' + i];
                        giftMail.items.push([itemID1, itemNum1]);
                    }

                    if(giftMail.items.length > 0){
                        self.SendUnionMail(giftMail, utils.done);
                    }
                }
            }
        }
    }

    self.SendUnionMail(mailDetail, function(err, result){
        if(err != null){
            logger.error('sys err %s', err.stack);
            return;
        }
        if(result.result != errorCodes.OK){
            logger.error('ret err is %j ', result.result);
            return;
        }
    });
};

// 清除角色的公会商品购买信息  回调
Handler.clearRoleShopInfo = function (roleID) {
    var GoodsInfo = this.unionRoleShopInfo[roleID];
    if (GoodsInfo == null) {
        return;
    }

    delete this.unionRoleShopInfo[roleID];
};



/**
 *
 * @param method 方法
 * @param index 下标
 * @param sqlStr
 * @param cb    回调
 */
Handler.enterQueue = function (method, dbIndex, sqlStr, callback) {
    var self = this;
    var index = dbIndex % config.mysql.global.loopCount;
    if (!self.unionQueque[index]) {
        self.unionQueque[index] = [];
    }
    var argTemp = {
        'id': dbIndex,
        'sql': sqlStr,
        'method': method,
        'cb': callback
    };
    this.unionQueque[index].push(argTemp);

    if (1 == self.unionQueque[index].length) {
        var execSql = function () {
            if (self.unionQueque[index].length > 300) {
                logger.warn('gameQuery unionQueque index: %s, length: %s', index,
                            self.unionQueque[index].length);
            }
            var indexTop = self.unionQueque[index][0]['id'];
            var method = self.unionQueque[index][0]['method'];
            var sqlStr = self.unionQueque[index][0]['sql'];
            var savedCallback = self.unionQueque[index][0]['cb'];
            Q.ninvoke(usSql, method, indexTop, sqlStr, function (err, res) {
                self.unionQueque[index].splice(0, 1);
                if (!!self.unionQueque[index].length) {
                    process.nextTick(function () {
                        execSql();
                    });
                }
                return savedCallback(err, res);
            });
        };
        execSql();
    }
};

/**
 * GM 增加工会威望
 */

// 公会信息变化
Handler.SendUnionInfoChange = function (unionID, weiwang, score) {
    var route = 'SendUnionInfoChange';
    var Msg = {
        weiwang: weiwang,
        score: score
    };

    for (var roleID in this.memberList) {
        var member = this.memberList[roleID];
        if (member == null || member['unionID'] != unionID) {
            continue;
        }

        var player = playerManager.GetPlayer(roleID);
        if (player != null) {
            player.SendMessage(route, Msg);
        }
    }
};

/**
 * 公会可领红包获取
 */
Handler.GetUnionGiftSendList = function (roleID, callback) {
    logger.fatal("**** GetUnionGiftSendList Begin roleID: %j " , roleID);
    var self = this;

    if(self.unionMemberList[roleID] == null){
        logger.fatal("**** GetUnionGiftSendList 11111111 roleID: %j " , roleID);
        return callback(null, {result: errorCodes.RoleNoUnion});
    }

    //获取工会ID
    var unionID =self.unionMemberList[roleID].unionID;
    var joinUnionTime = self.unionMemberList[roleID].createTime; //玩家入公会时间
    var unionGiftSend = self.unionGiftSend[unionID];
    var unionGiftRec = self.unionGiftReceive[roleID];
    if (!unionID) {
        logger.fatal("**** GetUnionGiftSendList 222222 roleID: %j " , roleID);
        return callback(null, {result: errorCodes.RoleNoUnion});
    }
    var sendList = [];
    if(!unionGiftSend){
        //没有红包
        var retArray = {
            result: errorCodes.OK
        };
        retArray['unionList'] = sendList;
        logger.fatal("**** GetUnionGiftSendList End  return :%j ,roleID :%j ", sendList, roleID);
        return callback(null, retArray);
    }
    for (var send in unionGiftSend) {
        var isGet = false;//默认没领过
        for(var r in unionGiftRec){
            //没有领过此发放人的礼包   并且  //入会时间在发放礼包之前
            if(unionGiftSend[send].roleID == unionGiftRec[r].fromID){
                isGet = true;
            }
        }
        if((!isGet) && (new Date(joinUnionTime) < new Date(unionGiftSend[send].createTime))){//可领时间之内 自己也可领了 && (unionGiftSend[send].roleID != roleID)
            sendList.push(unionGiftSend[send]);
        }
    }
    var retList = sendList;

//    self.getRoleByRedis(retList,function(err,retList){
//        if (!!resList || resList.length > 0) {
    var retArray = {
        result: errorCodes.OK
    };
    retArray['unionList'] = retList;
    logger.fatal("**** GetUnionGiftSendList End  return :%j  ,roleID :%j", retList, roleID);
    return callback(null, retArray);
//        }
//    });

};


// 添加公会威望
Handler.GmAddUnionWeiWang = function (roleID, WeiWangNum) {
    var self = this;
    if (null == roleID || null == WeiWangNum) {
        return;
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);//获取工会ID
    if (unionID == null || unionID <= 0) {
        return;
    }
    var unionInfo = self.GetUnion(unionID);
    if (!unionInfo) {
        return;
    }
    if (WeiWangNum <= 0 || 'number' != typeof(WeiWangNum)) {
        return;
    }
    var unionWeiWang = unionInfo['unionWeiWang'];
    if (unionWeiWang + WeiWangNum > INT_MAX) {
        unionInfo['unionWeiWang'] = INT_MAX;
    } else {
        unionInfo['unionWeiWang'] = unionInfo['unionWeiWang'] + WeiWangNum;
    }

    //this.SendUnionInfoChange(unionID,WeiWangNum, 0);
};
/**
 *工会商城列表
 */
Handler.GetUnionShopList = function (roleID) {
    var self = this;
    var UnionGoodsTemplate = templateManager.GetAllTemplate('UnionGoodsTemplate');
    if (!UnionGoodsTemplate) {
        return {result: errorCodes.NoTemplate};
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);//获取工会ID
    var memberInfo = self.unionMemberList[roleID];
    var unionShopInfo = self.unionRoleShopInfo[roleID];
    if (!unionID || !memberInfo) {
        return { result: errorCodes.RoleNoUnion};
    }
    var unionInfo = self.GetUnion(unionID);
    if (!unionInfo) {
        return { result: errorCodes.RoleNoUnion};
    }
    var uShop = {
        result: errorCodes.OK
        //contribute: memberInfo['playerDevote'] || 0 //工会贡献
    };
    var uLevel = unionInfo['unionLevel'];
    var shopGoods = [];
    for (var uTemp in UnionGoodsTemplate) {
        var showLevel = UnionGoodsTemplate[uTemp][tUnionShop.showUnionLevel];
        var uGoods = {};
        if (uLevel >= showLevel) {
            var attID = UnionGoodsTemplate[uTemp][tUnionShop.attID];
            uGoods[tUnionShop.attID] = attID;
            uGoods[tUnionShop.itemID] = UnionGoodsTemplate[uTemp][tUnionShop.itemID];
            uGoods[tUnionShop.itemNum] = UnionGoodsTemplate[uTemp][tUnionShop.itemNum];
            uGoods[tUnionShop.buyUnionLevel] = UnionGoodsTemplate[uTemp][tUnionShop.buyUnionLevel];
            if (!unionShopInfo || !unionShopInfo[attID]) {
                var tBuyNum = UnionGoodsTemplate[uTemp][tUnionShop.buyNum];
                uGoods[tUnionShop.buyNum] = tBuyNum;
            } else {
                var buyNum = unionShopInfo[attID];
                var tBuyNum = UnionGoodsTemplate[uTemp][tUnionShop.buyNum];
                if (-1 == tBuyNum) {
                    uGoods[tUnionShop.buyNum] = -1;
                } else if (tBuyNum - buyNum > 0) {
                    uGoods[tUnionShop.buyNum] = tBuyNum - buyNum;
                } else {
                    uGoods[tUnionShop.buyNum] = 0;
                }
            }
            uGoods[tUnionShop.consumeID1] = UnionGoodsTemplate[uTemp][tUnionShop.consumeID1];
            uGoods[tUnionShop.consumeNum1] = UnionGoodsTemplate[uTemp][tUnionShop.consumeNum1];
            uGoods[tUnionShop.consumeID2] = UnionGoodsTemplate[uTemp][tUnionShop.consumeID2];
            uGoods[tUnionShop.consumeNum2] = UnionGoodsTemplate[uTemp][tUnionShop.consumeNum2];
            shopGoods.push(uGoods);

            // devoteNum
        }
    }
    uShop['shopGoods'] = shopGoods;
    return uShop;
};

/**
 * 工会商城购买
 **/
Handler.BuyUnionShopGoods = function (roleID, GoodsID, csID, callback) {
    var self = this
    var UnionGoodsTemplate = templateManager.GetTemplateByID('UnionGoodsTemplate', GoodsID);
    if (!UnionGoodsTemplate) {
        callback(null, {result: errorCodes.NoTemplate});
        return false;
    }
    var tBuyNum = UnionGoodsTemplate[tUnionShop.buyNum];
    var roleUnionShopInfo = self.unionRoleShopInfo[roleID];
    if (!!roleUnionShopInfo) {
        if (null != roleUnionShopInfo[GoodsID]) {
            var buyNum = roleUnionShopInfo[GoodsID];
            if (tBuyNum - buyNum <= 0) {
                callback(null, {result: errorCodes.UnionNoBuyNum});
                return false;
            }
        }
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);//获取工会ID
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        callback(null, {result: errorCodes.RoleNoUnion});
        return false;
    }
    var unionInfo = self.GetUnion(unionID);
    if (!unionInfo) {
        callback(null, {result: errorCodes.RoleNoUnion});
        return false;
    }
    var uLevel = unionInfo['unionLevel'];
    var tBuyUnionLevel = UnionGoodsTemplate[tUnionShop.buyUnionLevel];
    if (uLevel < tBuyUnionLevel) {
        callback(null, {result: errorCodes.UnionLevelMeet});
        return false;
    }

    // 角色
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        callback(null, {result: errorCodes.NoRole});
        return false;
    }

    player.ConsumeGoods(roleID, csID, UnionGoodsTemplate, function (err, result) {
        if (err != null) {
            return callback(null, {result: errorCodes.SystemWrong});
            ;
        }
        if (result.result != 0) {
            if(errorCodes.NoAssets == result.result){ //财产不足时返回财产id
                return callback(null, {result: result.result, assetsID: result.assetsID});
            }else{
                return callback(null, {result: result.result});
            }
        }

        // 添加物品
        var itemID = UnionGoodsTemplate[tUnionShop.itemID];
        var itemNum = UnionGoodsTemplate[tUnionShop.itemNum];

        player.AddItem(roleID, csID, itemID, itemNum);//添加物品方法
        if (!!roleUnionShopInfo) {
            if (null != roleUnionShopInfo[GoodsID]) {
                var buyNum = roleUnionShopInfo[GoodsID];
                roleUnionShopInfo[GoodsID] = ++buyNum;
            } else {
                roleUnionShopInfo[GoodsID] = 1;
            }
        } else {
            var goodsInfo = {};
            goodsInfo[GoodsID] = 1;
            self.unionRoleShopInfo[roleID] = goodsInfo;
        }
        var newBuyNum = self.unionRoleShopInfo[roleID][GoodsID];

        var retOK = {
            result: errorCodes.OK,
            attID: GoodsID,
            buyNum: tBuyNum - newBuyNum
        }

        callback(null, retOK);
    });


    return true;
};

/**
 *公会技能列表获取
 */
Handler.GetUnionMagicList = function (roleID) {
    //获取工会ID
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return {result: errorCodes.RoleNoUnion};
    }

    var magicInfo = this.unionMagicInfo[unionID];

    var magicList = [];
    for (var magic in magicInfo) {
        var temp = { 'magicID': magic, 'magicLevel': magicInfo[magic]}
        magicList.push(temp);
    }

    var retArray = {
        result: errorCodes.OK
    };
    retArray['magics'] = magicList;
    return retArray;
};

/**
 *获取公会神殿信息
 */
Handler.GetUnionTempleInfo = function (roleID) {
    //获取工会ID
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return {result: errorCodes.RoleNoUnion};
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return {result: errorCodes.RoleNoUnion};
    }

    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        this.CreateTemple(unionID);
        templeInfo = this.unionTempleInfo[unionID];
    }

    var lady1Num = 0;
    var lady2Num = 0;
    var lady3Num = 0;

    if(this.playerOfferInfo[roleID] != null){
        lady1Num = this.playerOfferInfo[roleID]['lady1Num'];
        lady2Num = this.playerOfferInfo[roleID]['lady2Num'];
        lady3Num = this.playerOfferInfo[roleID]['lady3Num'];
    }

    var retInfo = {
        result: errorCodes.OK,

        content : {
            templeLevel :templeInfo['templeLevel'],
            templeExp :templeInfo['templeExp'],
            lady1ItemID :templeInfo['lady1ItemID'],
            lady1ItemNum :templeInfo['lady1ItemNum'],
            lady1PopNum :templeInfo['lady1PopNum'],
            lady1PopDouble :templeInfo['lady1PopDouble'],
            lady1Offers :templeInfo['lady1Offers'],
            lady2ItemID :templeInfo['lady2ItemID'],
            lady2ItemNum :templeInfo['lady2ItemNum'],
            lady2PopNum :templeInfo['lady2PopNum'],
            lady2PopDouble :templeInfo['lady2PopDouble'],
            lady2Offers :templeInfo['lady2Offers'],
            lady3ItemID :templeInfo['lady3ItemID'],
            lady3ItemNum :templeInfo['lady3ItemNum'],
            lady3PopNum :templeInfo['lady3PopNum'],
            lady3PopDouble :templeInfo['lady3PopDouble'],
            lady3Offers :templeInfo['lady3Offers'],

            unionWeiWang :unionInfo['unionWeiWang'],
            unionLevel :unionInfo['unionLevel'],

            lady1Num:lady1Num,
            lady2Num:lady2Num,
            lady3Num:lady3Num
        }
    };
    return retInfo;
};

// 创建神殿
Handler.CreateTemple = function (unionID) {
    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo != null){
        return;
    }
    this.unionTempleInfo[unionID] = {};
    templeInfo = this.unionTempleInfo[unionID];
    templeInfo['unionID'] = unionID;
    templeInfo['templeLevel'] = 1;
    templeInfo['templeExp'] = 0;

    this.resetLady(unionID);
};

// 从宝箱中按概率随机一组道具出来 (目前未按着)
Handler.RandOneByBox = function(boxID){
    var ret = {
        itemID : 0,
        itemNum : 0
    };

    var TreasureBoxListTemplate = templateManager.GetTemplateByID('TreasureBoxListTemplate',
        boxID);
    if (null == TreasureBoxListTemplate) {
        return ret;
    }
    var tempLevel = 'boxID_0';
    var boxTemplate = templateManager.GetTemplateByID('TreasureBoxTemplate',
        TreasureBoxListTemplate[tempLevel]);
    if(boxTemplate == null){
        return ret;
    }

    var itemRandom = 0;
    var itemNum = 0;
    for (var i = 0; i < 10; ++i) {
        if(boxTemplate['itemRandom_' + i] <= 0){
            break;
        }
        itemRandom += boxTemplate['itemRandom_' + i];
        ++itemNum;
    }

    var sum = 0;
    var resultRandom = Math.floor(Math.random() * itemRandom);
    for (var i = 0; i < itemNum; ++i) {
        sum += boxTemplate['itemRandom_' + i];
        if(resultRandom < sum){
            ret.itemID = boxTemplate['itemID_' + i];
            ret.itemNum = boxTemplate['itemNum_' + i];
            break;
        }
    }

    return ret;
};

// 重置女神信息
Handler.resetLady = function(unionID){
    var unionInfo = this.unionList[unionID];
    if(unionInfo == null){
        return;
    }
    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        return;
    }

    templeInfo['lady1ItemID'] = 0;
    templeInfo['lady1ItemNum'] = 0;
    templeInfo['lady1PopNum'] = 0;
    templeInfo['lady1PopDouble'] = 0;
    templeInfo['lady1Offers'] = 0;
    templeInfo['lady2ItemID'] = 0;
    templeInfo['lady2ItemNum'] = 0;
    templeInfo['lady2PopNum'] = 0;
    templeInfo['lady2PopDouble'] = 0;
    templeInfo['lady2Offers'] = 0;
    templeInfo['lady3ItemID'] = 0;
    templeInfo['lady3ItemNum'] = 0;
    templeInfo['lady3PopNum'] = 0;
    templeInfo['lady3PopDouble'] = 0;
    templeInfo['lady3Offers'] = 0;

    var unionTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', unionInfo['unionLevel'] + 1000);
    if(unionTemplate == null){
        logger.error('union template is null id is %j', unionInfo['unionLevel'] + 1000);
        return;
    }

    var ladyID1 = unionTemplate['ladyID1'] * 100 + templeInfo['templeLevel'];
    var ladyID2 = unionTemplate['ladyID2'] * 100 + templeInfo['templeLevel'];
    var ladyID3 = unionTemplate['ladyID3'] * 100 + templeInfo['templeLevel'];

    var thisDay = (new Date()).getDay().toString();

    var items = {};
    var ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID1);

    if(ladyTemplate != null){
        if(ladyTemplate['openDay'].toString().indexOf(thisDay) >= 0){
            items = this.RandOneByBox(ladyTemplate['boxID']);
            templeInfo['lady1ItemID'] = items.itemID;
            templeInfo['lady1ItemNum'] = items.itemNum;
            templeInfo['lady1PopDouble'] = ladyTemplate['popularityDouble1'];
        }
    }
    else {
        logger.error('lady2 temple is null id is %j', ladyID1);
    }

    ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID2);
    if(ladyTemplate != null){
        if(ladyTemplate['openDay'].toString().indexOf(thisDay) >= 0){
            items = this.RandOneByBox(ladyTemplate['boxID']);
            templeInfo['lady2ItemID'] = items.itemID;
            templeInfo['lady2ItemNum'] = items.itemNum;
            templeInfo['lady2PopDouble'] = ladyTemplate['popularityDouble1'];
        }
    }
    else {
        logger.error('lady2 temple is null id is %j', ladyID2);
    }

    ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID3);
    if(ladyTemplate != null){
        if(ladyTemplate['openDay'].toString().indexOf(thisDay) >= 0){
            items = this.RandOneByBox(ladyTemplate['boxID']);
            templeInfo['lady3ItemID'] = items.itemID;
            templeInfo['lady3ItemNum'] = items.itemNum;
            templeInfo['lady3PopDouble'] = ladyTemplate['popularityDouble1'];
        }
    }
    else {
        logger.error('lady3 temple is null id is %j', ladyID3);
    }
};

// 同步角色的公会等级
Handler.SyncUnionLevel = function (roleID) {
    if (roleID == null) {
        return;
    }
    // 同步在线角色的
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return;
    }

    var unionMemberInfo = this.unionMemberList[roleID];
    if(unionMemberInfo == null){
        return;
    }

    var unionID = this.union.GetPlayerUnionID(roleID, this.unionMemberList);
    if (unionID == null || unionID == 0) {
        return
    }
    var union = this.GetUnion(unionID);
    if (union == null) {
        return;
    }

    var unionData = {};
    unionData.level = union['unionLevel'];
    unionData.jionUnionTime = unionMemberInfo.createTime;
    pomelo.app.rpc.cs.csRemote.SyncUnionData(null, player.GetPlayerCs(), roleID, unionData, function (err, res) {
        if (!!err) {
            logger.error('cs SyncUnionLevel failed err: %s', utils.getErrorMessage(err));
            return;
        }
    });
};

// 升级技能等级
Handler.UpUnionMagicLevel = function (roleID, magicID, next) {
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (unionID == null || unionID == 0) {
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var unionInfo = this.GetUnion(unionID);
    if (unionInfo == null) {
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    // 权限
    var unionRole = self.unionMemberList[roleID].unionRole;
    if (!_.contains([1, 2], unionRole)) {
        return next(null, {
            'result': errorCodes.NoUnionAuthority
        });
    }

    var magicAllTemplate = templateManager.GetTemplateByID('UnionMagicAllTemplate', magicID);
    if (magicAllTemplate == null) {
        return next(null, {
            'result': errorCodes.NoTemplate
        });
    }

    var magicLevel = 0;
    if (self.unionMagicInfo[unionID] != null) {
        magicLevel = self.unionMagicInfo[unionID][magicID];
    }

    if (magicLevel == null) {
        magicLevel = 0;
    }
    if (magicLevel >= 99) {
        return next(null, {
            'result': errorCodes.NoTemplate
        });
    }

    if (++magicLevel > magicAllTemplate['maxLevel']) {
        return next(null, {
            'result': errorCodes.UnionMagicLevelMax
        });
    }

    var magicTempID = (magicID * 100) + magicLevel;
    var magicTemplate = templateManager.GetTemplateByID('UnionMagicLevelTemplate', magicTempID);
    if (magicTemplate == null) {
        return next(null, {
            'result': errorCodes.NoTemplate
        });
    }

    if (unionInfo['unionLevel'] < magicTemplate['needLevel']) {
        return next(null, {
            'result': errorCodes.UnionLevelPer
        });
    }

    if (unionInfo['unionWeiWang'] < magicTemplate['needWeiwang']) {
        return next(null, {
            'result': errorCodes.UnionWeiWangLack
        });
    }

    if (self.unionMagicInfo[unionID] == null) {
        self.unionMagicInfo[unionID] = {};
    }

    var decWeiwang = magicTemplate['needWeiwang'];

    unionInfo['unionWeiWang'] -= decWeiwang;
    self.unionMagicInfo[unionID][magicID] = magicLevel;


    return next(null, {
        'result': errorCodes.OK,
        'magicID': magicID,
        'magicLevel': magicLevel,
        'decWeiwang': decWeiwang
    });
};

// 升级技能等级
Handler.UpPlayerMagicLevel = function (roleID, magicID, next) {
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if (unionID == null || unionID == 0) {
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var unionInfo = this.GetUnion(unionID);
    if (unionInfo == null) {
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var magicLevel = 0;
    if (self.unionMagicInfo[unionID] != null) {
        magicLevel = self.unionMagicInfo[unionID][magicID];
    }

    if (magicLevel == null || magicLevel <= 0) {
        return next(null, {
            'result': errorCodes.UnionMagicLevelOver
        });
    }

    if (magicLevel >= 99) {
        return next(null, {
            'result': errorCodes.NoTemplate
        });
    }

    pomelo.app.rpc.cs.csRemote.UpPlayerMagicLevel(null, player.csID, roleID, magicID, magicLevel, function (err, ret) {
        next(null, ret);
    });
};

// 添加公会积分
Handler.AddUnionScore = function (roleID, score, lianyuType, callback) {
    var self = this;
    if (null == roleID || null == score) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);//获取工会ID
    if (unionID == null || unionID <= 0) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var unionInfo = self.GetUnion(unionID);
    if (!unionInfo) {
        return callback({'result': errorCodes.ParameterNull});
    }
    var tpl = templateManager.GetTemplateByID('AllTemplate', 168);
    if(!tpl || !tpl.attnum || unionInfo.unionLevel < tpl.attnum) {
        return callback({'result': errorCodes.ParameterNull});
    }
    if (score <= 0 || 'number' != typeof(score)) {
        return callback({'result': errorCodes.ParameterNull});
    }

    logger.fatal("****AddUnionScore unionID: %j , lianyuType :%j ", unionID, lianyuType );
    //添加类型  此处为1 炼狱添加公会积分 需要判断炼狱次数， 其他传 0  不做判断
    if(1==lianyuType ){
        if(!!self.unionData[unionID]){
            var count = self.unionData[unionID].lianYuCount;
            //取公会人数
            //var memberNum = self.unionList[unionID].memberNum;
            //取公会上限的人数
            var thisUnion = self.union.GetUnionInfo(unionID, self.unionList);
            var unionLevel = thisUnion.unionLevel;
            var attID = 1000 + unionLevel;
            var UnionLevelTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', attID);
            if (!UnionLevelTemplate) {
                return callback({'result': errorCodes.ParameterNull});
            }
            var memberNum = UnionLevelTemplate[tUnionLeve.maxRoleNum];
            logger.fatal("****AddUnionScore forLianYu count :%j, memberNumX3 : %j ", count, memberNum*3 );
            //目前公会炼狱限制 人数 X3
            if(count <= (memberNum*3)){
                //次数加1
                self.unionData[unionID].lianYuCount = count+1;
                var unionScore = unionInfo['unionScore'];
                if (unionScore + score > INT_MAX) {
                    unionInfo['unionScore'] = INT_MAX;
                } else {
                    unionInfo['unionScore'] = unionInfo['unionScore'] + score;
                }
                self.union.UpdateUnionScoreRedisInfo(unionID, unionInfo);
            }
        }else{
            self.unionData[unionID] = {
                unionID: unionID,
                lianYuCount: 1
            };
            var unionScore = unionInfo['unionScore'];
            if (unionScore + score > INT_MAX) {
                unionInfo['unionScore'] = INT_MAX;
            } else {
                unionInfo['unionScore'] = unionInfo['unionScore'] + score;
            }
            self.union.UpdateUnionScoreRedisInfo(unionID, unionInfo);
        }

    }else{
        var unionScore = unionInfo['unionScore'];
        if (unionScore + score > INT_MAX) {
            unionInfo['unionScore'] = INT_MAX;
        } else {
            unionInfo['unionScore'] = unionInfo['unionScore'] + score;
        }
        self.union.UpdateUnionScoreRedisInfo(unionID, unionInfo);
    }
    //this.SendUnionInfoChange(unionID,0, score);
    return callback({'result': errorCodes.OK});
};

// 添加神殿经验
Handler.AddTempleExp = function (roleID, exp) {
    var self = this;
    if (null == roleID || null == exp) {
        return;
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);//获取工会ID
    if(unionID == null || unionID <= 0){
        return;
    }
    var unionInfo = self.GetUnion(unionID);
    if (!unionInfo) {
        return;
    }
    if (exp <= 0 || 'number' != typeof(exp)) {
        return;
    }

    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        this.CreateTemple(unionID);
        templeInfo = this.unionTempleInfo[unionID];
    }

    var tempExp = templeInfo['templeExp'];
    if (tempExp + exp > INT_MAX) {
        templeInfo['templeExp'] = INT_MAX;
    } else {
        templeInfo['templeExp'] += exp;
    }

    //self.union.UpdateUnionScoreRedisInfo(unionID, unionInfo);
};


// 添加女神人气
Handler.AddLadyPop = function (roleID, exp) {
    var self = this;
    if (null == roleID || null == exp) {
        return;
    }
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);//获取工会ID
    if(unionID == null || unionID <= 0){
        return;
    }
    var unionInfo = self.GetUnion(unionID);
    if (!unionInfo) {
        return;
    }
    if (exp <= 0 || 'number' != typeof(exp)) {
        return;
    }

    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        this.CreateTemple(unionID);
        templeInfo = this.unionTempleInfo[unionID];
    }

    if(templeInfo['lady1ItemID'] > 0){
        if (templeInfo['lady1PopNum'] + exp > INT_MAX) {
            templeInfo['lady1PopNum'] = INT_MAX;
        } else {
            templeInfo['lady1PopNum'] += exp;
        }
    }

    if(templeInfo['lady2ItemID'] > 0){
        if (templeInfo['lady2PopNum'] + exp > INT_MAX) {
            templeInfo['lady2PopNum'] = INT_MAX;
        } else {
            templeInfo['lady2PopNum'] += exp;
        }
    }

    if(templeInfo['lady3ItemID'] > 0){
        if (templeInfo['lady3PopNum'] + exp > INT_MAX) {
            templeInfo['lady3PopNum'] = INT_MAX;
        } else {
            templeInfo['lady3PopNum'] += exp;
        }
    }

    this.RefreshLadyInfo(unionID);

    //self.union.UpdateUnionScoreRedisInfo(unionID, unionInfo);
};


Handler.getMemberList = function(unionID){
    var list = {};
    for (var roleID  in this.unionMemberList) {
        var member = this.unionMemberList[roleID];
        if (member != null && member.unionID == unionID) {
            list[roleID] = 1;
        }
    }

    return list;
}

//获取公会会长 和 副会长 角色id
Handler.getBossID = function (unionID) {
    var self = this;
    var list = [];
    for (var roleID  in this.unionMemberList) {
        var member = this.unionMemberList[roleID];
        var unionRole = self.unionMemberList[roleID].unionRole;
        if (member != null && member.unionID == unionID && _.contains([1, 2], unionRole) ) {
            list.push(roleID);
        }
    }
    logger.fatal("****getBossID : %j ", list);
    return list;
};

//根据角色id判断是否是会长 或者 副会长 用于领取额外奖励
Handler.isBoss = function(roleID){
    var isBoss = true;
    var unionRole = this.unionMemberList[roleID].unionRole;
    if (!_.contains([1, 2], unionRole)) {
        isBoss = false;
    }
    return isBoss;
};


// 升级公会神殿
Handler.UpUnionTempleLevel = function (roleID, next) {
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if(unionID == null || unionID == 0){
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var unionInfo = this.GetUnion(unionID);
    if(unionInfo == null){
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var unionTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', unionInfo['unionLevel'] + 1000);
    if(unionTemplate == null){
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    // 权限
    var unionRole = self.unionMemberList[roleID].unionRole;
    if (!_.contains([1, 2], unionRole)) {
        return next(null, {
            'result': errorCodes.NoUnionAuthority
        });
    }

    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        this.CreateTemple(unionID);
        templeInfo = this.unionTempleInfo[unionID];
    }

    var tempID = unionTemplate['templeID1'] * 100 + templeInfo['templeLevel'];

    var templeTemplate = templateManager.GetTemplateByID('UnionTempleTemplate', tempID);
    if(templeTemplate == null){
        return next(null, {
            'result': errorCodes.UnionTempleLevel
        });
    }
    var needExp = templeTemplate['needExp'];
    if(needExp <= 0){
        return next(null, {
            'result': errorCodes.UnionTempleLevel
        });
    }

    if(templeTemplate['needLevel'] > unionInfo['unionLevel']){
        return next(null, {
            'result': errorCodes.UnionLevelPer
        });
    }

    var needWeiwang = templeTemplate['needWeiwang'];
    if(needWeiwang > unionInfo['unionWeiWang']){
        return next(null, {
            'result': errorCodes.UnionWeiWangLack
        });
    }

    if(needExp > templeInfo['templeExp']){
        return next(null, {
            'result': errorCodes.UnionTempleExpPer
        });
    }

    ++templeInfo['templeLevel'];
    templeInfo['templeExp'] -= needExp;
    unionInfo['unionWeiWang'] -= needWeiwang;
    this.RefreshLadyInfo(unionID);

    return next(null, {
        'result': errorCodes.OK,
        'content' : {
            'templeLevel': templeInfo['templeLevel'],
            'templeExp' : templeInfo['templeExp'],
            'unionWeiwang' : unionInfo['unionWeiWang']
        }
    });
};

// 刷新女神信息
Handler.RefreshLadyInfo = function(unionID){
    var unionInfo = this.unionList[unionID];
    if(unionInfo == null){
        return;
    }
    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        return;
    }

    var unionTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', unionInfo['unionLevel'] + 1000);
    if(unionTemplate == null){
        return;
    }

    var ladyID1 = unionTemplate['ladyID1'] * 100 + templeInfo['templeLevel'];
    var ladyID2 = unionTemplate['ladyID2'] * 100 + templeInfo['templeLevel'];
    var ladyID3 = unionTemplate['ladyID3'] * 100 + templeInfo['templeLevel'];

    var ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID1);
    if(ladyTemplate != null){
        for(var i = 5; i > 0; --i){
            if(templeInfo['lady1PopNum'] >= ladyTemplate['popularityNum' + i]){
                templeInfo['lady1PopDouble'] = ladyTemplate['popularityDouble' + i];
                break;
            }
        }
    }

    ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID2);
    if(ladyTemplate != null){
        for(var i = 5; i > 0; --i){
            if(templeInfo['lady2PopNum'] >= ladyTemplate['popularityNum' + i]){
                templeInfo['lady2PopDouble'] = ladyTemplate['popularityDouble' + i];
                break;
            }
        }
    }

    ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID3);
    if(ladyTemplate != null){
        for(var i = 5; i > 0; --i){
            if(templeInfo['lady3PopNum'] >= ladyTemplate['popularityNum' + i]){
                templeInfo['lady3PopDouble'] = ladyTemplate['popularityDouble' + i];
                break;
            }
        }
    }
};

// 敬供女神
Handler.OnLadyOffer = function (roleID, csID, ladyOrder, next) {
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if(ladyOrder <= 0 || ladyOrder > 3){
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    if(unionID == null || unionID == 0){
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var unionInfo = this.GetUnion(unionID);
    if(unionInfo == null){
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var unionTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', unionInfo['unionLevel'] + 1000);
    if(unionTemplate == null){
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var templeInfo = this.unionTempleInfo[unionID];
    if(templeInfo == null){
        this.CreateTemple(unionID);
        templeInfo = this.unionTempleInfo[unionID];
    }

    var tempID = unionTemplate['templeID1'] * 100 + templeInfo['templeLevel'];
    var templeTemplate = templateManager.GetTemplateByID('UnionTempleTemplate', tempID);
    if(templeTemplate == null){
        return next(null, {
            'result': errorCodes.NoUnion
        });
    }

    var itemID = 0;
    var itemNum = 0;
    var PopNum = 0;
    var PopDouble = 0;
    var Offers = 0;


    var ladyID1 = unionTemplate['ladyID1'] * 100 + templeInfo['templeLevel'];
    var ladyID2 = unionTemplate['ladyID2'] * 100 + templeInfo['templeLevel'];
    var ladyID3 = unionTemplate['ladyID3'] * 100 + templeInfo['templeLevel'];

    var ladyTemplate = null;
    if(ladyOrder == 1){
        itemID = templeInfo['lady1ItemID'];
        itemNum = templeInfo['lady1ItemNum'];
        ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID1);
    }else if(ladyOrder == 2){
        itemID = templeInfo['lady2ItemID'];
        itemNum = templeInfo['lady2ItemNum'];
        ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID2);
    }else if(ladyOrder == 3){
        itemID = templeInfo['lady3ItemID'];
        itemNum = templeInfo['lady3ItemNum'];
        ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID3);
    }

    if(ladyTemplate == null){
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var thisDay = (new Date()).getDay().toString();

    if(ladyTemplate['openDay'].toString().indexOf(thisDay) < 0){
        return next(null, {
            'result': errorCodes.UnionLadyDay
        });
    }

    pomelo.app.rpc.cs.csRemote.LadyOfferCheck(null, csID, roleID, ladyOrder, itemID, itemNum, templeTemplate['buyConsume'], function(err, result){
        if(result.result != errorCodes.OK){
            return next(null, result);
        }

        self.AddTempleExp(roleID, ladyTemplate['gainExp']);

        if(self.playerOfferInfo[roleID] == null){
            self.playerOfferInfo[roleID] = { roleID : roleID, lady1Num : 0,lady2Num : 0,lady3Num : 0};
        }

        var retNum  = self.OnRandRange(ladyTemplate['gainPopularityMin'], ladyTemplate['gainPopularityMax']);

        if(ladyOrder == 1){
            templeInfo['lady1PopNum'] += retNum['num'];
            ++templeInfo['lady1Offers'];
            ++self.playerOfferInfo[roleID].lady1Num;
        }else if(ladyOrder == 2){
            templeInfo['lady2PopNum'] += retNum['num'];
            ++templeInfo['lady2Offers'];
            ++self.playerOfferInfo[roleID].lady2Num;
        }else if(ladyOrder == 3){
            templeInfo['lady3PopNum'] += retNum['num'];
            ++templeInfo['lady3Offers'];
            ++self.playerOfferInfo[roleID].lady3Num;
        }

        self.RefreshLadyInfo(unionID);

        if(ladyOrder == 1){
            PopNum = templeInfo['lady1PopNum'];
            PopDouble = templeInfo['lady1PopDouble'];
            Offers = templeInfo['lady1Offers'];
        }else if(ladyOrder == 2){
            PopNum = templeInfo['lady2PopNum'];
            PopDouble = templeInfo['lady2PopDouble'];
            Offers = templeInfo['lady2Offers'];
        }else if(ladyOrder == 3){
            PopNum = templeInfo['lady3PopNum'];
            PopDouble = templeInfo['lady3PopDouble'];
            Offers = templeInfo['lady3Offers'];
        }

        //self.OnGetLadyAward(roleID);

        return next(null, {
            'result': errorCodes.OK,
            'content' : {
                'itemID': itemID,
                'itemNum' : itemNum,
                'PopNum' : PopNum,
                'PopDouble': PopDouble,
                'Offers' : Offers,
                'gainPop' :retNum['num'],
                'templeExp' : templeInfo['templeExp'],
                'attID' : ladyOrder
            }
        });
    });
};

// 接口，在一个区间内随机  参数和返回值均为整数
Handler.OnRandRange = function (fromNum, toNum) {
    var retNum = {};
    if(fromNum == toNum){
        retNum['num'] = fromNum;
        return retNum;
    }

    var diffNum = 0;
    var minNum = 0;
    if(fromNum > toNum){
        diffNum = fromNum - toNum;
        minNum = toNum;
    }
    else{
        diffNum = toNum - fromNum;
        minNum = fromNum;
    }

    retNum['num'] = Math.floor(Math.random() * diffNum + minNum);

    return retNum;
};

/*
============================================================================
                公会夺城战

============================================================================
 */


/**
 *获取公会神兽信息
 */
Handler.GetUnionAnimalInfo = function (csID, roleID) {
    //获取工会ID
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return {result: errorCodes.RoleNoUnion};
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return {result: errorCodes.RoleNoUnion};
    }

    var retInfo = {
        result: errorCodes.OK,
        fightDayType : this.getFightDayType(),
        delayTime : this.getNextStateTimer(),
        isRegister : unionInfo['isRegister']
    };

    // 没报名的没有神兽信息
    var info = this.unionAnimalList[unionID];
    if(info != null){
        retInfo.content = info.toMessage();
    }
    else{
        retInfo.content = new unionAnimal().toMessage();
    }

    this.SendUnionFightInfo(roleID);

    return retInfo;
};

// 报名公会夺城战
Handler.OnRegisterFight = function (roleID) {
    if(this.getFightDayType() != 1){
        return {result: errorCodes.UnionAnimalCantReg};
    }

    var retInfo = {
        result: errorCodes.OK
    };

    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return {result: errorCodes.RoleNoUnion};
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return {result: errorCodes.RoleNoUnion};
    }

    // 权限
    var unionRole = self.unionMemberList[roleID].unionRole;
    if (!_.contains([1, 2], unionRole)) {
        return {result: errorCodes.NoUnionAuthority};
    }

    if(unionInfo['isDuke'] > 0 ){
        return {result: errorCodes.UnionAnimalDuke};
    }

    if(unionInfo['isRegister'] > 0 ){
        return {result: errorCodes.UnionAnimalHasReg};
    }

    var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
    if(UnionDataTemplate == null){
        return {result: errorCodes.RoleNoUnion};;
    }

    // 消耗威望
    var needWeiwang = UnionDataTemplate['fightWeiwang'];
    if(needWeiwang > unionInfo['unionWeiWang']){
        return {'result': errorCodes.UnionWeiWangLack};
    }

    unionInfo['unionWeiWang'] -= needWeiwang;
    unionInfo['isRegister'] = 1;

    this.unionFighting.SendRegisterMail(unionID);

    retInfo.weiwang = unionInfo['unionWeiWang'];

    return retInfo;
};

// 每周一12点，报名的公会创建神兽
Handler.CreateAnimal = function (unionID, powerful) {
    var self = this;
    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        logger.error('no union %j', unionID);
        return;
    }

    // 不是城主，不报名的，不创建
    if(unionInfo['isDuke'] <= 0 && unionInfo['isRegister'] <= 0){
        logger.error('not reg');
        return;
    }

    var info = this.unionAnimalList[unionID];
    if(info != null){
        if(info.GetAnimalInfo(eUnionAnimal.unionID) == unionID){
            logger.error('union animal info has create why not recreate it %j', info);
            return;
        }
    }

    var UnionFixTemplate = templateManager.GetAllTemplate('UnionFixTemplate');
    if(UnionFixTemplate == null){
        return;
    }

    var index = 0;
    for (var i in UnionFixTemplate) {
        if(UnionFixTemplate[i]['attType'] != 3){
            continue;
        }
        if (powerful >= UnionFixTemplate[i]['rankLow'] && powerful <= UnionFixTemplate[i]['rankHigh']) {
            index = i;
            break;
        }
    }

    if(UnionFixTemplate[index] == null){
        logger.error('cant find the powerful  template %j', powerful);
        return;
    }

    var animal = new unionAnimal();
    animal.SetAnimalInfo(eUnionAnimal.unionID, parseInt(unionID));
    animal.SetAnimalInfo(eUnionAnimal.unionName, unionInfo.unionName);
    animal.SetAnimalInfo(eUnionAnimal.fixTempID, parseInt(index));
    animal.SetAnimalInfo(eUnionAnimal.isDefender, unionInfo['isDuke']);

    animal.refreshPowerful();

    this.unionAnimalList[unionID] = animal;
};

// 获取公会夺城战信息
Handler.getUnionFightInfo = function(roleID, next){
    var self = this;

    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    return next(null, this.unionFighting.toMessage(this.GetLeftAttackTimes(roleID)));
};

// 获取成员伤害榜
Handler.getMemberDamageRank = function(roleID, next){
    var self = this;

    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var info = {
        result : errorCodes.OK
    };

    var memDamages = self.memberDamageRank[unionID];
    info.damageRank = [];
    if(memDamages != null){
        for(var i = 0; i < memDamages.length; ++i){
            var memInfo = memDamages[i];
            var retDamage = {};
            retDamage['roleID'] = memInfo['roleID'];
            retDamage['unionID'] = memInfo['unionID'];
            retDamage['roleName'] = memInfo['roleName'];
            retDamage['roleLevel'] = memInfo['roleLevel'];
            retDamage['roleZhanli'] = memInfo['roleZhanli'];
            retDamage['fightDamage'] = memInfo['fightDamage'].toString();
            retDamage['attackTimes'] = memInfo['attackTimes'];
            info.damageRank.push(retDamage)
        }
    }

    info.myDamage = 0;

    var myDamage = self.unionMemFightDamage[roleID];
    if(myDamage != null){
        info.myDamage = myDamage['fightDamage'].toString();
    }

    return next(null, info);
};

// 获取公会伤害排行榜
Handler.getUnionsDamageRank = function(roleID, next){
    var info = {
        result : errorCodes.OK
    };

    info.damageRank = [];
    for(var i = 0; i < this.unionDamageRank.length; ++i){
        var unionDamage = this.unionDamageRank[i];
        var retDamage = {};
        retDamage['unionID'] = unionDamage['unionID'];
        retDamage['unionName'] = unionDamage['unionName'];
        retDamage['unionLevel'] = unionDamage['unionLevel'];
        retDamage['fightDamage'] = unionDamage['fightDamage'].toString() ;
        retDamage['animalPowerful'] = unionDamage['animalPowerful'];

        info.damageRank.push(retDamage);
    }

    return next(null, info);
};

// 培养神兽，包括普通培养，钻石培养，技能学习
Handler.CultureAnimal = function (csID, roleID, opType, next) {
    // 今天不开放
    if(this.getFightDayType() != 2){
        return next(null, {'result': errorCodes.UnionAnimalCultureNotOpen});
    }

    var self = this;

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    // 没报名的没有神兽信息
    var animalInfo = this.unionAnimalList[unionID];
    if(animalInfo == null){
        return next(null, {result: errorCodes.UnionAnimalCantReg});
    }

    var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
    if(UnionDataTemplate == null){
        return next(null, {result: errorCodes.NoTemplate});
    }

    var UnionFixTemplate = templateManager.GetTemplateByID('UnionFixTemplate', animalInfo.GetAnimalInfo(eUnionAnimal.fixTempID));
    if(UnionFixTemplate == null){
        return next(null, {result: errorCodes.NoTemplate});
    }

    var needWeiWang = templateManager.GetTemplateByID('AllTemplate', 243);
    if(needWeiWang == null){
        return next(null, {result: errorCodes.NoTemplate});
    }

    if(memberInfo['playerWeiWang'] < needWeiWang['attnum']){
        return next(null, {result: errorCodes.UnionCultureWeiwang });
    }

    var consumeAssetsID = 0;
    var consumeAssetsNum = 0;

    var retAssets = {};

    var retAssetsID = 0;
    var retAssetsNum = 0;

    var times = 0;
    var incAttValue = 0;
    switch (opType){
        case 0:
            consumeAssetsID = UnionDataTemplate['attkAssetsID'];
            consumeAssetsNum = UnionDataTemplate['attkAssetsNum'];

            retAssetsID = UnionDataTemplate['attkReturnID'];
            retAssetsNum = UnionDataTemplate['attkReturnNum'];

            retAssets[retAssetsID] = retAssetsNum;

            incAttValue = INT_MAX / 100 - animalInfo.GetAnimalTrueAtt(gameConst.eAttInfo.ATTACK);
            if(incAttValue <= 0){
                return next(null, {result: errorCodes.UnionAnimalAttMax});
            }

            times = Math.ceil(incAttValue/UnionFixTemplate['attkAdd']);
            break;
        case 1:
            consumeAssetsID = UnionDataTemplate['defAssetsID'];
            consumeAssetsNum = UnionDataTemplate['defAssetsNum'];
            retAssetsID = UnionDataTemplate['defReturnID'];
            retAssetsNum = UnionDataTemplate['defReturnNum'];
            retAssets[retAssetsID] = retAssetsNum;

            incAttValue = INT_MAX / 100- animalInfo.GetAnimalTrueAtt(gameConst.eAttInfo.DEFENCE);
            if(incAttValue <= 0){
                return next(null, {result: errorCodes.UnionAnimalAttMax});
            }

            times = Math.ceil(incAttValue/UnionFixTemplate['defAdd']);
            break;
        case 2:
            consumeAssetsID = UnionDataTemplate['hpAssetsID'];
            consumeAssetsNum = UnionDataTemplate['hpAssetsNum'];

            retAssetsID = UnionDataTemplate['hpReturnID'];
            retAssetsNum = UnionDataTemplate['hpReturnNum'];
            retAssets[retAssetsID] = retAssetsNum;

            incAttValue = INT_MAX - animalInfo.GetAnimalTrueAtt(gameConst.eAttInfo.MAXHP);
            if(incAttValue <= 0){
                return next(null, {result: errorCodes.UnionAnimalAttMax});
            }

            times = Math.ceil(incAttValue/UnionFixTemplate['hpAdd']);
            break;
        case 3:
            consumeAssetsID = 1002;
            consumeAssetsNum = UnionDataTemplate['yuanbaoNum'];
            times = UnionDataTemplate['yuanbaoTimes'];

            var addAssets = function(){
                retAssetsID = UnionDataTemplate['attkReturnID'];
                retAssetsNum = UnionDataTemplate['yuanbaoAttkDouble'] * UnionDataTemplate['attkReturnNum'];
                if(retAssets[retAssetsID] == null){
                    retAssets[retAssetsID] = 0;
                }
                retAssets[retAssetsID] += retAssetsNum;

                retAssetsID = UnionDataTemplate['defReturnID'];
                retAssetsNum = UnionDataTemplate['yuanbaoDefDouble'] * UnionDataTemplate['defAssetsNum'];
                if(retAssets[retAssetsID] == null){
                    retAssets[retAssetsID] = 0;
                }
                retAssets[retAssetsID] += retAssetsNum;

                retAssetsID = UnionDataTemplate['hpReturnID'];
                retAssetsNum = UnionDataTemplate['yuanbaoHPDouble'] * UnionDataTemplate['hpAssetsNum'];
                if(retAssets[retAssetsID] == null){
                    retAssets[retAssetsID] = 0;
                }
                retAssets[retAssetsID] += retAssetsNum;
            };

            addAssets();

            incAttValue = INT_MAX - animalInfo.GetAnimalTrueAtt(gameConst.eAttInfo.MAXHP);
            if(incAttValue > 0){
                break;
            }
            incAttValue = INT_MAX / 100 - animalInfo.GetAnimalTrueAtt(gameConst.eAttInfo.ATTACK);
            if(incAttValue > 0){
                break;
            }
            incAttValue = INT_MAX / 100 - animalInfo.GetAnimalTrueAtt(gameConst.eAttInfo.DEFENCE);
            if(incAttValue > 0){
                break;
            }

            return next(null, {result: errorCodes.UnionAnimalAttMax});
            break;
        case 4:
            var skillID = 1001 + animalInfo.GetAnimalInfo(eUnionAnimal.skillNum);
            var animalSkillTemplate = templateManager.GetTemplateByID('UnionBossSkillTemplate', skillID);
            if(animalSkillTemplate == null){
                return next(null, {result: errorCodes.NoTemplate});
            }
            if(animalInfo.GetAnimalInfo(eUnionAnimal.skillNum) >= animalSkillTemplate['maxLevel']){
                return next(null, {result: errorCodes.UnionAnimalSkillMax});
            }

            consumeAssetsID = animalSkillTemplate['assetsID'];
            consumeAssetsNum = animalSkillTemplate['assetsNum'];

            retAssetsID = animalSkillTemplate['returnAssetsID'];
            retAssetsNum = animalSkillTemplate['returnAssetsNum'];
            retAssets[retAssetsID] = retAssetsNum;

            times = 1;
            break;
        default :
            return next(null,{result: errorCodes.ParameterWrong});
    }

    if(times <= 0){
        return next(null, {result: errorCodes.UnionAnimalAttMax});
    }

    pomelo.app.rpc.cs.csRemote.CultureAnimalCheck(null, csID, roleID, consumeAssetsID, consumeAssetsNum, retAssets, opType, times, function(err, result) {
        if(err != null){
            return next(null, result);
        }
        if (result.result != errorCodes.OK) {
            return next(null, result);
        }

        animalInfo.onCulture(opType, result.cultureTimes);

        var player = playerManager.GetPlayer(roleID);
        if(player != null){
            var log = {
                unionID : unionID,
                roleName : player.GetPlayerInfo(ePlayerInfo.NAME),
                opType : opType,
                opPara1 : consumeAssetsNum * result.cultureTimes,
                opPara2 : result.coinAssets,
                createTime : utilSql.DateToString(new Date())
            };

            if (self.cultureLogs[unionID] == null) {
                var logs = [];
                logs.unshift(log);
                self.cultureLogs[unionID] = logs;
            } else {
                self.cultureLogs[unionID].unshift(log);
            }
            unionIOController.SaveCultureLog();
        }

        var retInfo = {
            result: errorCodes.OK,
            attID: opType,
            animalCoin :result.coinAssets,
            content : animalInfo.toMessage()
        };

        return next(null, retInfo);
    });

};

// 获取每日收益
Handler.getDukeDailyAward = function(roleID, csID, next){
    var self = this;

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    if(unionInfo['isDuke'] <= 0){
        return next(null, {result: errorCodes.UnionAwardNotDuke});
    }

    var thisTime = new Date();
    if(thisTime.getDay() == 0){
        return next(null, {result: errorCodes.UnionAwardCalling});
    }
    var joinTime = new Date(memberInfo['createTime']);
    var joinDay = utils.getDayOfDiff(thisTime, joinTime);

    if(joinDay < 6 && thisTime.getDay() > joinDay){
        return next(null, {result: errorCodes.UnionAwardLater});
    }
    //添加副会长额外收益
    var isBoss = self.isBoss(roleID);

    pomelo.app.rpc.cs.csRemote.DukeDailyAwardCheck(null, csID, roleID, isBoss, function(err, result) {
        if(err != null){
            return next(null, result);
        }
        if (result.result != errorCodes.OK) {
            return next(null, result);
        }

        return next(null, result);
    });
};

// 是否能领奖励
Handler.canGetDaily = function(roleID, next){
    if(this.dukeUnion == null){
        return next(null, {result: 1});
    }
    var self = this;
    var memberInfo = self.unionMemberList[roleID];
    if (!memberInfo) {
        return next(null, {result: 1});
    }
    if(memberInfo['unionID'] != this.dukeUnion['unionID']){
        return next(null, {result: 1});
    }
    var thisTime = new Date();
    var joinTime = new Date(memberInfo['createTime']);
    var joinDay = utils.getDayOfDiff(thisTime, joinTime);

    if(joinDay < 6 && thisTime.getDay() > joinDay){
        return next(null, {result: 1});
    }

    return next(null, {result: 0});
};

// 获得角色总伤害
Handler.getPlayerDamage = function(roleID, next){
    var ret = { result : errorCodes.OK, damage : 0};
    var roleDamage = this.unionMemFightDamage[roleID];
    if(roleDamage == null){
        return next(null, ret);
    }

    ret.damage = roleDamage['fightDamage'].toString();
    return next(null, ret)
};

// 获得将要打的神兽信息
Handler.getFightAnimal = function(unionID, teamRoleList, next){
    var unionInfo = this.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }
    if(this.unionFighting.getFightState() == 0) {
        return next(null, {result: errorCodes.UnionFightIsEnd});
    }

    for(var i = 0; i < teamRoleList.length; ++i){
        var roleID = teamRoleList[i];
        var player = playerManager.GetPlayer(roleID);
        if(player == null){
            continue;
        }
        var roleDamage = this.unionMemFightDamage[roleID];
        if(roleDamage == null){
            roleDamage = {};
            roleDamage['roleID'] = player.GetPlayerInfo(ePlayerInfo.ROLEID);
            roleDamage['unionID'] = unionID;
            roleDamage['roleName'] = player.GetPlayerInfo(ePlayerInfo.NAME);
            roleDamage['roleLevel'] = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
            roleDamage['roleZhanli'] = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
            roleDamage['fightDamage'] = 0;
            roleDamage['attackTimes'] = 0;
            this.unionMemFightDamage[roleID] = roleDamage;
        }
        ++roleDamage['attackTimes'];
    }

    var animalRet = { result : errorCodes.OK };
    var animalInfo = this.unionFighting.getNextFightAnimal(unionID);
    animalRet.animalOrder = animalInfo.animalOrder;
    animalRet.animalInfo = animalInfo.animal;

    return next(null, animalRet);
};

// 发送公会夺城的城主
Handler.SendUnionFightDuke = function (roleID) {
    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return;
    }

    var route = 'SendUnionFightDuke';
    var Msg = {
        dukeUnionLeader : this.getDukeUnionLeader()
    };

    player.SendMessage(route, Msg);
};

// 战斗结束，发送新城主
Handler.SendFightEnd = function (roleID) {
    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return;
    }

    var route = 'SendFightEnd';
    var Msg = {
        dukeUnionLeader : this.getDukeUnionLeader()
    };

    player.SendMessage(route, Msg);
};

// 获得角色剩余攻击次数
Handler.GetLeftAttackTimes = function(roleID){
    var self = this;
    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return 0;
    }

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);//获取工会ID
    if (unionID == null || unionID <= 0) {
        return 0;
    }

    var limitTimes = this.unionFighting.getAllFightTimes(unionID)

    if(this.unionMemFightDamage[roleID] == null || limitTimes > 9000){
        return limitTimes;
    }

    return limitTimes - this.unionMemFightDamage[roleID]['attackTimes'];
};

// 发送公会夺城战的战斗信息
Handler.SendUnionFightInfo = function (roleID) {
    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return;
    }

    var route = 'SendUnionFightInfo';
    player.SendMessage(route, this.unionFighting.toMessage(this.GetLeftAttackTimes(roleID)));
};


// 删掉所有公会神兽
Handler.deleteAllUnionAnimal = function(){
    this.unionAnimalList = {};
    usSql.DeleteAllUnionAnimal(function(err){

    });
};

// 清除成员伤害榜
Handler.clearMemberDamage = function(){
    this.memberDamageRank = {};
    this.unionMemFightDamage = {};
    usSql.DeleteAllMemFightDamage(function(err){

    });
};

// 清除公会伤害榜
Handler.clearUnionsDamage = function(){
    this.unionDamageRank = [];
    this.unionDamageInfo = {};
    usSql.DeleteAllUnionsDamage(function(err){

    });
};

// 删掉所有公会神兽
Handler.deleteAllCultureLog = function(){
    this.cultureLogs = {};
    usSql.DeleteCultureLog(function(err){

    });
};


// 创建公会夺城战
Handler.createFight = function () {
    var self = this;

    if(this.unionFighting.getFightState() == 1){
        return;
    }
    this.unionFighting.InitFight();

    this.clearMemberDamage();
    this.clearUnionsDamage();
    this.deleteAllCultureLog();

    // 创建NPC神兽
    if(this.dukeUnion == null){
        pomelo.app.rpc.chart.chartRemote.GetChart(null, 0, gameConst.eChartType.Zhanli, function (err, myChartID, rankList) {
            if (!!err) {
                logger.error('get zhanli error: %s', utils.getErrorMessage(err));
                return;
            }

            var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
            if(UnionDataTemplate == null){
                return;
            }

            var zhanli = 0;
            var num = 0;
            var maxRank = parseInt(UnionDataTemplate['zhanLiNum']);
            for(var i in rankList){
                if(rankList[i].id <= maxRank){
                    ++num;
                    zhanli += parseInt(rankList[i].zhanli);
                }
            }

            if(num <= 0){
                return;
            }

            var powerful = Math.floor(zhanli/num);

            var UnionFixTemplate = templateManager.GetAllTemplate('UnionFixTemplate');
            if(UnionFixTemplate == null){
                return;
            }

            var index = 0;
            for (var i in UnionFixTemplate) {
                if(UnionFixTemplate[i]['attType'] != 3){
                    continue;
                }
                if (powerful >= UnionFixTemplate[i]['rankLow'] && powerful <= UnionFixTemplate[i]['rankHigh']) {
                    index = i;
                    break;
                }
            }

            if(UnionFixTemplate[index] == null){
                return;
            }
            if(self.unionFighting.createNpcAnimal(index)){
                self.unionFighting.created();
                logger.fatal('union duke fight created by npc mode and power is %j npcID is %j', powerful, index);
            }
        });
    }
    else{
        var defAnimal = null;
        var atkAnimals = [];
        for(var unionID in this.unionList){
            var unionInfo = this.unionList[unionID];
            if(unionInfo == null){
                continue;
            }

            unionInfo['fightDamage'] = 0;
            unionInfo['animalPowerful'] = 0;

            if(unionInfo['isDuke'] > 0){
                if(this.unionAnimalList[unionID] != null){
                    defAnimal = this.unionAnimalList[unionID];
                }else {
                    logger.error('duke union %j unionAnimal not be created why?', unionID);
                }
            }else{
                if(unionInfo['isRegister'] > 0 && this.unionAnimalList[unionID] != null){
                    atkAnimals.push(this.unionAnimalList[unionID]);
                    unionInfo['animalPowerful'] = this.unionAnimalList[unionID].GetAnimalInfo(eUnionAnimal.powerful);
                }
            }
        }

        // 没人报名，活动不开启
        if(atkAnimals.length <= 0){
            return;
        }

        if(defAnimal == null){
            logger.error('why not has not def animal');
            return;
        }
        else{
            this.unionFighting.setDefAnimal(defAnimal);
        }

        atkAnimals.sort(function(a, b){
            return b.GetAnimalInfo(eUnionAnimal.powerful) - a.GetAnimalInfo(eUnionAnimal.powerful);
        });

        this.unionFighting.setAtkAnimal(atkAnimals);
        self.unionFighting.created();
        logger.fatal('union duke fight created by union mode and duke id is %j ',defAnimal.GetAnimalInfo(eUnionAnimal.unionID));
    }
};

// 计算公会夺城战胜出者, 定榜
Handler.CalFightFinal = function(){
    this.unionDamageRank = [];
    this.unionDamageInfo = {};
    var retArray = [];
    var damageUnions = [];
    var dukeUnion = null;
    for(var unionID in this.unionList){
        var unionInfo = this.unionList[unionID];
        if(unionInfo == null){
            continue;
        }

        if(unionInfo['isDuke'] > 0){
            dukeUnion = unionInfo;
        }
        else{
            if(unionInfo['isRegister'] > 0){
                damageUnions.push(unionInfo);
            }
        }
    }

    damageUnions.sort(function(a,b){
        if(b['fightDamage'] == a['fightDamage']){
            return b['animalPowerful'] - a['animalPowerful'];
        }
        return b['fightDamage'] - a['fightDamage'];
    });

    var createDamage = function(unionInfo){
        var retDamage = {};
        retDamage['unionID'] = unionInfo['unionID'];
        retDamage['unionName'] = unionInfo['unionName'];
        retDamage['unionLevel'] = unionInfo['unionLevel'];
        retDamage['fightDamage'] = unionInfo['fightDamage'];
        retDamage['animalPowerful'] = unionInfo['animalPowerful'];

        return retDamage;
    };

    var ranks = 0;
    for(var index = 0; index < damageUnions.length; ++index){
        var union = damageUnions[index];

        this.unionDamageInfo[union['unionID']] = createDamage(union);
        this.unionFighting.saveUnionDamageRank(union, ++ranks);
    }

    if(dukeUnion != null){
        this.unionFighting.saveUnionDamageRank(dukeUnion, 0);
    }

    this.makeSortUnionsDamage();

    retArray.push(dukeUnion, damageUnions[0]);

    return retArray;
};

// 伤害排序
Handler.makeSortMemDamage = function(){
    this.memberDamageRank = {};
    for(var roleID in this.unionMemFightDamage){
        var roleDamage = this.unionMemFightDamage[roleID];
        if(roleDamage == null){
            continue;
        }
        var unionID = roleDamage['unionID'];
        if(this.memberDamageRank[unionID] == null){
            this.memberDamageRank[unionID] = [];
        }
        this.memberDamageRank[unionID].push(roleDamage);
    }
    for(var unionID in this.memberDamageRank){
        var damageArray = this.memberDamageRank[unionID];
        if(damageArray == null){
            continue;
        }
        damageArray.sort(function(a, b){
            if(b['fightDamage'] == a['fightDamage']){
                return b['roleZhanli'] - a['roleZhanli'];
            }
            return b['fightDamage'] - a['fightDamage'];
        });
    }
};

// 公会伤害排行
Handler.makeSortUnionsDamage = function(){
    this.unionDamageRank = [];
    for(var unionID in this.unionDamageInfo){
        var damageInfo = this.unionDamageInfo[unionID];
        if(damageInfo == null){
            continue;
        }

        this.unionDamageRank.push(damageInfo);
    }
    this.unionDamageRank.sort(function(a, b){
        if(b['fightDamage'] == a['fightDamage']){
            return b['animalPowerful'] - a['animalPowerful'];
        }
        return b['fightDamage'] - a['fightDamage'];
    });
};

// 检查是否可以进行公会夺城战
Handler.onCheckFight = function(unionID, roleID, next){
    var unionInfo = this.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result : errorCodes.NoUnion});
    }

    var player  = playerManager.GetPlayer(roleID);
    if(player == null){
        return next(null, {result : errorCodes.NoUnion});
    }

    if(this.unionFighting.getFightState() != 1){
        return next(null, {result : errorCodes.UnionFightIsEnd});
    }

    if(unionInfo['isDuke'] <= 0 && unionInfo['isRegister'] <= 0){
        return next(null, {result : errorCodes.UnionAnimalNotFight});
    }

    var roleDamage = this.unionMemFightDamage[roleID];
    // 城主公会不限制次数
    if(roleDamage != null && unionInfo['isDuke'] <= 0){
        var limitTimes = this.unionFighting.getAllFightTimes(unionID);
        if(roleDamage['attackTimes'] >= limitTimes){
            return next(null, {result : errorCodes.UnionFightTimes});
        }
    }

    return next(null, {result : errorCodes.OK});
};

// 添加伤害
Handler.AddDamage = function(unionID, player, hitDamage){
    if(hitDamage <= 0){
        return;
    }

    //
    var unionInfo = this.unionList[unionID];
    if(unionInfo == null){
        return;
    }

    var roleID  = player.GetPlayerInfo(ePlayerInfo.ROLEID);

    var createDamage = function(){
        var retDamage = {};
        retDamage['roleID'] = roleID;
        retDamage['unionID'] = unionID;
        retDamage['roleName'] = player.GetPlayerInfo(ePlayerInfo.NAME);
        retDamage['roleLevel'] = player.GetPlayerInfo(ePlayerInfo.ExpLevel);
        retDamage['roleZhanli'] = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
        retDamage['fightDamage'] = hitDamage;
        retDamage['attackTimes'] = 1;

        return retDamage;
    };

    unionInfo['fightDamage'] += hitDamage;

    var roleDamage = this.unionMemFightDamage[roleID];
    if(roleDamage == null){
        roleDamage = createDamage();
        this.unionMemFightDamage[roleID] = roleDamage;
    }else{
        roleDamage['fightDamage'] += hitDamage;
    }

    var memDamage = this.memberDamageRank[unionID];
    if(memDamage == null){
        this.memberDamageRank[unionID] = [];
        this.memberDamageRank[unionID].push(roleDamage);
        memDamage = this.memberDamageRank[unionID];
    }else{
        var find = false;
        for(var i = 0; i < memDamage.length; ++i){
            if(memDamage[i]['roleID'] == roleID){
                find = true;
                break;
            }
        }
        if(find == false){
            memDamage.push(roleDamage);
        }
    }

    memDamage.sort(function(a, b){
        if(b['fightDamage'] == a['fightDamage']){
            return b['roleZhanli'] - a['roleZhanli'];
        }
        return b['fightDamage'] - a['fightDamage'];
    });


    // 城主不算排行榜
    if(this.dukeUnion != null && this.dukeUnion['unionID'] == unionID){
        return;
    }

    // 添加到公会伤害中

    var createUnionsDamage = function(){
        var retDamage = {};
        retDamage['unionID'] = unionInfo['unionID'];
        retDamage['unionName'] = unionInfo['unionName'];
        retDamage['unionLevel'] = unionInfo['unionLevel'];
        retDamage['fightDamage'] = hitDamage;
        retDamage['animalPowerful'] = unionInfo['animalPowerful'];

        return retDamage;
    };

    var unionsDamage = this.unionDamageInfo[unionID];
    if(unionsDamage == null){
        this.unionDamageInfo[unionID] = createUnionsDamage();
        unionsDamage = this.unionDamageInfo[unionID];
        this.unionDamageRank.push(unionsDamage);
    }else{
        unionsDamage['fightDamage'] += hitDamage;
    }

    this.unionDamageRank.sort(function(a, b){
        if(b['fightDamage'] == a['fightDamage']){
            return b['animalPowerful'] - a['animalPowerful'];
        }
        return b['fightDamage'] - a['fightDamage'];
    });
};

// 公会夺城站，对BOSS造成伤害
Handler.AddFightDamage = function(unionID, roleID, animalOrder, hitDamage, next){
    var unionInfo = this.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result : errorCodes.NoUnion});
    }

    if(this.unionFighting.getFightState() != 1){
        return next(null, {result : errorCodes.UnionFightIsEnd});
    }

    if(unionInfo['isDuke'] <= 0 && unionInfo['isRegister'] <= 0){
        return next(null, {result : errorCodes.UnionAnimalNotFight});
    }

    var player  = playerManager.GetPlayer(roleID);
    if(player == null){
        return next(null, {result : errorCodes.NoUnion});
    }

    var animalInfo = this.unionFighting.getAnimalInfo(unionID, animalOrder);
    if(animalInfo == null){
        return next(null, {result : errorCodes.UnionFightIsEnd});
    }

    if(animalInfo.IsAlive() == false){
        return next(null, {result : errorCodes.OK});
    }

    var self = this;
    // 开启公会战更强的校验
    if(defaultValues.cheatMaster){
        pomelo.app.rpc.cs.csRemote.calRoleRealDamage(null, player.GetPlayerCs(), roleID, hitDamage, animalInfo.getAnimalAtt(), function(err, result){
            if(err != null){
                return next(null, {result : errorCodes.ParameterNull});
            }
            if(result.result != errorCodes.OK){
                return next(null, {result : result.result});
            }

            self.AddDamage(unionID, player, hitDamage);
            self.unionFighting.onDamaged(unionID, animalOrder, hitDamage);
            return next(null, {result : errorCodes.OK});
        });
    }
    else{
        this.AddDamage(unionID, player, hitDamage);
        this.unionFighting.onDamaged(unionID, animalOrder, hitDamage);
        return next(null, {result : errorCodes.OK});
    }
};

// 周一创建
Handler.UnionUpdateAnimalInfo = function () {
    var self = this;
    // 没有城主的时候无需创建攻城神兽
    if(self.dukeUnion == null){
        logger.warn('no duke no need create');
        return;
    }
    pomelo.app.rpc.chart.chartRemote.GetChart(null, 0, gameConst.eChartType.Zhanli, function (err, myChartID, rankList) {
        if (!!err) {
            logger.error('get zhanli error: %s', utils.getErrorMessage(err));
            return;
        }

        var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
        if(UnionDataTemplate == null){
            logger.error('UnionUpdateAnimalInfo UnionDataTemplate is null');
            return;
        }

        var zhanli = 0;
        var num = 0;

        var maxRank = parseInt(UnionDataTemplate['zhanLiNum']);
        for(var i in rankList){
            if(rankList[i].id <= maxRank){
                ++num;
                zhanli += parseInt(rankList[i].zhanli);
            }
        }

        if(num <= 0){
            logger.error('rank list num is zero why ? %j', rankList);
            return;
        }

        var powerful = Math.floor(zhanli/num);

        for(var unionID in self.unionList){
            var unionInfo = self.unionList[unionID];
            if(unionInfo == null){
                continue;
            }
            if(unionInfo['isDuke'] <= 0 && unionInfo['isRegister'] <= 0){
                continue;
            }

            self.CreateAnimal(unionID, powerful);
        }

        unionIOController.SaveUnionAnimalInfo();
        logger.fatal('all animal has created by power %j', powerful);

    });
};

/*
====================================================================
            以下命令GM使用

====================================================================
 */
Handler.onCreateAllAnimal = function(roleID, next){
    var self = this;

    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    if(self.dukeUnion == null){
        unionInfo['isDuke'] = 1;
        self.dukeUnion = unionInfo;
    }

    for(var unionIDs in self.unionList){
        var union = self.unionList[unionIDs];
        if(union == null){
            continue;
        }
        union['isRegister'] = 1;
    }

    this.UnionUpdateAnimalInfo();

    var retInfo = {
        result: errorCodes.OK
    };

    return next(null, retInfo);
};

// 开启战斗
Handler.gmCreateFight = function(next){
    this.createFight();
    return next(null, {result : errorCodes.OK});
};

// 结束战斗
Handler.gmEndFight = function(type, next){

    return next(null, {result : errorCodes.OK});
};


// 获得公会神兽培养日志
Handler.getAnimalCultureLog = function(roleID, logPage, next){
    var self = this;
    var unionID = self.union.GetPlayerUnionID(roleID, self.unionMemberList);
    var memberInfo = self.unionMemberList[roleID];
    if (!unionID || !memberInfo) {
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var unionInfo = self.unionList[unionID];
    if(unionInfo == null){
        return next(null, {result: errorCodes.RoleNoUnion});
    }

    var ret = {
        result : errorCodes.OK,
        logList : [],
        attID : logPage,
        logNum : 0
    };

    var cultureLog = self.cultureLogs[unionID];
    if(cultureLog == null){
        return next(null, ret);;
    }

    ret.logNum = cultureLog.length;

    var pagedLogs = logPage > 0 ? cultureLog.slice(logPage, logPage + 10) : cultureLog.slice(0, 10);

    for(var i = 0; i < pagedLogs.length; ++i){
        if(pagedLogs[i] == null){
            continue;
        }

        var log = {
            roleName : pagedLogs[i].roleName,
            opType : pagedLogs[i].opType,
            opPara1 : pagedLogs[i].opPara1,
            opPara2 : pagedLogs[i].opPara2,
            opTime : pagedLogs[i].createTime
        };

        ret.logList.push(log);
    }

    return next(null, ret);
};

