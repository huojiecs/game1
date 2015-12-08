/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-21
 * Time: 下午6:00
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../../tools/config');
var Friend = require('./friend');
var playerManager = require('./../player/playerManager');
var fsSql = require('../../tools/mysql/fsSql');
var messageService = require('../../tools/messageService');
var gameConst = require('../../tools/constValue');
var utils = require('../../tools/utils');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var msdkOauth = require("../../tools/openSdks/tencent/msdkOauth");
var wxOauth = require("../../tools/openSdks/tencent/wxOauth");
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var friendClient = require('./friendClient.js');
var redis = require("redis");
var Q = require('q');
var _ = require('underscore');
var util = require('util');
var stringValue = require('../../tools/stringValue');
var sFsString = stringValue.sFsString;
/////////////////////////////////////
var log_insLogSql = require('../../tools/mysql/insLogSql');
var log_utilSql = require('../../tools/mysql/utilSql');
var log_getGuid = require('../../tools/guid');
var log_eTableTypeInfo = gameConst.eTableTypeInfo;
var eAcrossApi = gameConst.eAcrossApi;
var TABLE_NAME_APPLY_FRIEND = 'friendapply';
////////////////////////////////////

var Handler = module.exports;

Handler.Init = function () {
    var self = this;

    this.playerFriendsMap = {};

    /** 好友申请列表 */
    this.playerFriendsApplyMap = {};

    /** 好友申请列表 */
    this.playerFriendsApplyMapNum = {};

    /**好友对象map 方便根据id 直接查找 <roleID, Friend>*/
    this.friendMap = {};

    var deferred = Q.defer();

    self.zsetName =
        config.redis.fs.zsetName + ':friend@' + pomelo.app.getMaster().host + ':' + pomelo.app.getMaster().port;
    self.zsetZhanli =
        config.redis.chart.zsetName + ':zhanli@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.redisRoleInfo =
        config.redis.chart.zsetName + ':roleInfo@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;
    self.eachLoadPlayer = 1000;
    self.scoreName = 'zhanli';

    self.client = redis.createClient(config.redis.fs.port, config.redis.fs.host, {
        auth_pass: config.redis.fs.password,
        no_ready_check: true
    });

    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    var doAction = function () {
        if (!!pomelo.app.cluster && !!pomelo.app.cluster.fs && !!pomelo.app.cluster.fs.fsCluster) {
            logger.warn('pomelo.app.cluster.fsCluster.Ping: sending...');
            pomelo.app.cluster.fs.fsCluster.Ping(null, 'QQ-Android-Center|fs-server-1', Date.now(),
                                                 function (err, result) {
                                                     logger.warn('pomelo.app.cluster.fsCluster.Ping: %j', result);
                                                 });
        }
    };

//    setInterval(doAction, 1000);
};

/**
 * @Brief:  加载玩家本地好友
 * -----------------------
 *
 * @param {Number} roleID 玩家id
 * */
Handler.LoadDataByDB = function (roleID) {
    var self = this;

    /**  从数据库加载好友数据*/
    fsSql.LoadFriendList(roleID, gameConst.eFriendType.Normal, function (err, res) {
        if (!!err) {
            logger.error('Load local friend data err: %s', utils.getErrorMessage(err));
        }

        /** 更新玩家数据*/
        self.UpdateLocalFriendList(roleID, res);
    });

    /**  从数据库加载好友申请数据*/
    fsSql.LoadInfo(TABLE_NAME_APPLY_FRIEND, roleID, function (err, res) {
        if (!!err) {
            logger.error('Load local friend data err: %s', utils.getErrorMessage(err));
        }

        /** 更新玩家数据*/
        self.UpdateLocalFriendApplyList(roleID, res);

        self.sendLocalFriendApplyListToClient(roleID);
    });

    /**  获取好友申请数量*/
    fsSql.selectFriendApplyNum(roleID, function (err, res) {
        if (!!err) {
            logger.error('Load local friend num data err: %s', utils.getErrorMessage(err));
        }

        /** 更新玩家好友数量数据*/
        self.playerFriendsApplyMapNum[roleID] = res;

    });
};

/**
 * load player friends on enter to scene.
 *   1. load friends from mysql and load qq relation the same time.
 *   2. compare local friends and qq friends.
 *   3. remove friends that removed qq friends.
 *   4. add friends that friends in qq but not in local.
 *   4.1 query accountIds by openIds in login server(friend center server).
 *   4.2 get roles info from login server(friend center server).
 *   4.3 login server(friend center server) retrieve role info from cache.
 *   4.4 if center cache don't have the role info then retrieve role from the specify server.
 *   5. add new friends from qq to local mysql db.
 *   6. send friends to client.
 */
Handler.RequireFriendList = function (roleID, callback) {
    var self = this;
    var friendInfo = playerManager.GetFriendList(roleID);

    if (null != friendInfo && new Date().getTime() < friendInfo.canGetFriendTime) { //使用缓存好友
        return callback(null, friendInfo.friendList);
    }

    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsMap[roleID] = {
            friendList: {}
        };
    }

    if (!!tempList.processing) {
        logger.info('RequireFriendList is processing %d, time: %d', roleID, Date.now() - tempList.lastProcessing);
        return callback(errorCodes.Fs_InProcessing);
    }

    tempList.processing = true;
    tempList.lastProcessing = Date.now();

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.warn('No such role %d:', roleID);
        return callback(errorCodes.NoRole);
    }

    var accountType = player.getAccountType();

    var localFriends = null;
    var qqFriends = null;
    var roleMap = null;
    var oldFriends = null;
    var accountToOpenID = null;

    var myData = null;


    // load friends from local db.
    var promises = [Q.nfcall(fsSql.LoadFriendList, roleID, gameConst.eFriendType.QQ)];

    // load friends from qq relations.

    if (!!player.openid && player.openid.length > 0) {
        if (accountType == gameConst.eLoginType.LT_WX) {
            promises.push(wxOauth.wxfriends_profile(player.openid, player.token));
        } else if (accountType == gameConst.eLoginType.LT_QQ) {
            promises.push(msdkOauth.qqfriends_detail(player.openid, player.token));
        }
    }

    Q.allSettled(promises)
        .then(function (results) {
                  localFriends = results[0].value;
                  oldFriends = results[0].value;
                  if (results.length === 1) {
                      return Q.reject();
                  }
                  qqFriends = results[1].value;
                  return _.some(results, function (result) {
                      return result.state !== "fulfilled"
                  }) ? Q.reject() : Q.resolve();
              })
        .then(function () {
//                  var openIds = ['84124C279AE8509A44D2A6329763DB07', 'tttt', 'ssss8'];
                  var openIds = _.pluck(qqFriends.lists, 'openid');
                  openIds = _.without(openIds, player.openid);

                  if (!pomelo.app.cluster || !pomelo.app.cluster.ls || !pomelo.app.cluster.ls.fsCluster) {
                      return Q.resolve();
                  }

                  return Q.ninvoke(pomelo.app.cluster.ls.fsCluster, 'GetFriendsByOpenIds', null, 0, openIds);
              })
        .then(function (roles) {
                  var my = _.chain(localFriends)
                      .filter(function (item) {
                                  return item[gameConst.eFriendInfo.FriendType] === gameConst.eFriendType.QQ;
                              })
                      .map(function (item) {
                               return item[gameConst.eFriendInfo.FriendID];
                           })
                      .value();
//            var result = {"is_lost": "0", "lists": [
//                {"figureurl_qq": "http://q.qlogo.cn/qqapp/1000001036/87FE6F42489F43C6BB1B336B707C236C/", "gender": "男", "nickName": "kazi", "openid": "87FE6F42489F43C6BB1B336B707C236C"},
//                {"figureurl_qq": "http://q.qlogo.cn/qqapp/1000001036/EC80B842F34B48A0386246FA4BA5B44D/", "gender": "男", "nickName": "李晓东", "openid": "EC80B842F34B48A0386246FA4BA5B44D"}
//            ], "msg": "success", "ret": 0};

                  roleMap = _.indexBy(roles, 'roleID');

                  // get role ids from qq friends.
                  var qq = _.map(roles, function (item) {
                      return item.roleID;
                  });

                  // remove friend if no qq relation.
                  var removes = _.difference(my, qq);

                  localFriends = _.reject(localFriends, function (item) {
                      return _.contains(removes, item[gameConst.eFriendInfo.FriendID]);
                  });

                  var removeFriendsByQQ = function (removes) {
                      return removes.length > 0 ? Q.nfcall(fsSql.FriendRemoveByOutside, roleID, removes) : Q.resolve();
                  };

                  // add friend if new qq relation.
                  var adds = _.difference(qq, my);
                  // retrieve the new friend info.
                  var newFriends = _.reduce(adds, function (memo, item) {
                      var temp = [];
                      temp[gameConst.eFriendInfo.RoleID] = roleID;
                      temp[gameConst.eFriendInfo.FriendID] = item;
                      temp[gameConst.eFriendInfo.FriendType] = gameConst.eFriendType.QQ;
                      memo.push(temp);
                      localFriends.push(temp);
                      return memo;
                  }, []);

                  var addFriendsByQQ = function (newFriends) {
                      return newFriends.length > 0 ? Q.nfcall(fsSql.FriendAddByOutside, roleID, newFriends) :
                             Q.resolve();
                  };

                  var getFriendCurrentInfo = function (qq) {

                      var hmGet = Q.nbind(self.client.hmget, self.client);
                      var zScore = Q.nbind(self.client.zscore, self.client);

                      var keys = _.map(qq, function (item) {
                          return item;
                      });

                      var zhanliMaps = {};

                      var getZhanli = function () {

                          var deferred = Q.defer();
                          var multi = self.client.multi();
                          _.each(qq, function (roleId) {
                              multi.zscore(self.getZSetNameZhanli(globalFunction.GetUseServerUId(roleMap[roleId].serverUid)), roleId,
                                           function (err, score) {
                                               zhanliMaps[roleId] = score;

                                               logger.debug('zhanli: %j:%j', roleId, score);
                                           });
                          });

                          // you can re-run the same transaction if you like
                          multi.exec(deferred.makeNodeResolver());

                          return deferred.promise;
                      };

                      var roleStrings = [];
                      var getRoleInfo = function () {

                          var deferred = Q.defer();
                          var multi = self.client.multi();
                          _.each(qq, function (roleId) {
                              multi.hget(self.getRoleZSetName(globalFunction.GetUseServerUId(roleMap[roleId].serverUid)), roleId, function (err, info) {
                                  roleStrings.push(info);

                                  logger.debug('roleInfo: %j:%j', roleId, info);
                              });
                          });

                          // you can re-run the same transaction if you like
                          multi.exec(deferred.makeNodeResolver());

                          return deferred.promise;
                      };
                      var jobs = [getRoleInfo(), getZhanli()];
                      /*             logger.error("%j", keys);
                       for (var i = 0; i < keys.length; ++i) {
                       logger.error("%s  %d", self.getRoleZSetName(roleMap[keys[i]].serverUid), keys[i]);
                       var func = hGet(self.getRoleZSetName(roleMap[keys[i]].serverUid), keys[i]);
                       jobs.push(func);
                       };
                       jobs.push(getZhanli);*/
                      /*             logger.error("%j", keys);
                       for (var i = 0; i < keys.length; ++i) {
                       logger.error("%s  %d", self.getRoleZSetName(roleMap[keys[i]].serverUid), keys[i]);
                       var func = hGet(self.getRoleZSetName(roleMap[keys[i]].serverUid), keys[i]);
                       jobs.push(func);
                       };
                       jobs.push(getZhanli);*/
                      /*                  var jobs = keys.length === 0 ? [
                       [],
                       getZhanli()
                       ] : [hmGet(self.redisRoleInfo, keys), getZhanli()];*/

                      return Q.all(jobs)
                          .spread(function () {
//                                      logger.debug("%j ---- %j", roleStrings, zhanliMaps);
                                      var roleInfo = _.map(roleStrings, function (role) {
                                          return JSON.parse(role);
                                      });
                                      roleInfo = _.filter(roleInfo, function (item) {
                                          return !!item;
                                      });
                                      var roleInfoMap = _.indexBy(roleInfo, 'roleID');
                                      var qqMap = _.indexBy(qqFriends.lists, 'openid');

                                      /** 添加自己相关数据 和微信默认判断*/
                                      myData = qqMap[player.openid] || {};
                                      if (accountType == gameConst.eLoginType.LT_WX) {
                                          myData.picture = !!myData ? (!!myData.picture ? myData.picture :
                                                                       'http://1251044271.cdn.myqcloud.com/1251044271/icon/WX.png?')
                                              : "http://1251044271.cdn.myqcloud.com/1251044271/icon/WX.png?";
                                      }

                                      localFriends = _.map(localFriends, function (item) {
                                          // get online time from redis.
                                          var updateTime = roleInfoMap[item[1]] ? +roleInfoMap[item[1]].updateTime : 0;
                                          // if not get online time from db
                                          updateTime = updateTime ? updateTime : roleMap[item[1]].updateTime;
                                          updateTime = new Date(updateTime);

                                          /** 添加微信 默认头像判断*/
                                          var picture = '';
                                          if (accountType == gameConst.eLoginType.LT_WX) {
                                              if (!!qqMap[roleMap[item[1]].openID]) {
                                                  picture = !!qqMap[roleMap[item[1]].openID].picture ?
                                                            '' + qqMap[roleMap[item[1]].openID].picture :
                                                            'http://1251044271.cdn.myqcloud.com/1251044271/icon/WX.png?';
                                              } else {
                                                  picture =
                                                      'http://1251044271.cdn.myqcloud.com/1251044271/icon/WX.png?';
                                              }
                                          }

                                          return {
                                              roleID: +item[0],
                                              friendID: +item[1],
                                              friendType: +item[2],
                                              name: roleInfoMap[item[1]] ? '' + roleInfoMap[item[1]].name : '',
                                              expLevel: roleInfoMap[item[1]] ? +roleInfoMap[item[1]].expLevel : 0,
                                              openID: roleMap[item[1]] ? '' + roleMap[item[1]].openID : '',
                                              nickName: qqMap[roleMap[item[1]].openID] ?
                                                        '' + qqMap[roleMap[item[1]].openID].nickName : '',
                                              picture: picture,
                                              serverUid: roleMap[item[1]].serverUid,
                                              isQQMember: roleInfoMap[item[1]].isQQMember,
                                              zhanli: +zhanliMaps[item[1]] || 0,
                                              loginTime: (Date.now() - updateTime) / 1000 || 0
                                          };
                                      });

                                      logger.debug('localFriends: %j', localFriends);
                                  });
                  };

                  return Q.all([removeFriendsByQQ(removes), addFriendsByQQ(newFriends), getFriendCurrentInfo(qq)]);
              })
        .finally(function () {
                     self.UpdateFriendList(roleID, localFriends, oldFriends, myData);
                     tempList.processing = false;

                     if (defaultValues.isNoLocalFriend) {
                         playerManager.SetFriendList(roleID, new Date().getTime() + defaultValues.friendGetInterval * 1000,
                                                     localFriends);    //更新缓存
                         return callback(null, localFriends);
                     } else {
                         /** 添加获取本地好友信息*/
                         self.getLocalFriendList(roleID, function (err, localFriendList) {
                             if (!!err) {
                                 return callback(errorCodes.toClientCode(err));
                             }

                             localFriends = localFriends.concat(localFriendList);

                             playerManager.SetFriendList(roleID,
                                                         new Date().getTime() + defaultValues.friendGetInterval * 1000,
                                                         localFriends);    //更新缓存

                             return callback(null, localFriends);
                         });
                     }
                 })
        .catch(function (error) {
                   if (!!error) {
                       logger.error('加载玩家好友出错: %s', error.stack);
                   }
               })
        .done();
};

/**
 * 添加oldFriends 是为了设置本服原来老朋友的祝福数据
 * */
Handler.UpdateFriendList = function (roleID, dataList, oldFriends, myData) {
    var self = this;
    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsMap[roleID] = {
            friendList: {}
        };
    }

    /** 添加玩家自身的一些信息*/
    tempList.picture = !!myData ? (!!myData.picture ? myData.picture : '') : '';
    tempList.nickName = !!myData ? (!!myData.nickName ? myData.nickName : '') : '';

    _.each(dataList, function (item) {
        // TODO: just add new.
        tempList.friendList[item.friendID] = new Friend(item);

        if (!!self.friendMap[item.friendID]) {
            self.friendMap[item.friendID][roleID] = tempList.friendList[item.friendID];
        } else {
            self.friendMap[item.friendID] = {};
            self.friendMap[item.friendID][roleID] = tempList.friendList[item.friendID];
        }
    });

    //不全原来服上的玩家信息
    _.each(oldFriends, function (old) {
        var friend = tempList.friendList[old[gameConst.eFriendInfo.FriendID]];
        if (friend) {
            for (var i = gameConst.eFriendInfo.BlessCount; i < gameConst.eFriendInfo.Max; i++) {
                friend.SetDataInfo(i, old[i]);
            }
        }
    });
//    logger.debug('test the old data: %j', this.playerFriendsMap);
};

/**
 * @Brief: 获取好友申请列表
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback 回调函数
 * */
Handler.getLocalFriendApplyList = function (roleID, callback) {
    var self = this;

    var tempList = this.playerFriendsApplyMap[roleID];

    if (!tempList || _.size(tempList) <= 0) {
        return callback(null, []);
    }

    var keys = _.map(tempList, function (item) {
        return item[gameConst.eFriendInfo.FriendID];
    });

    if (!keys || 0 == keys.length) {
        return callback(null, []);
    }

    var hmGet = Q.nbind(self.client.hmget, self.client);

    hmGet(self.redisRoleInfo, keys)
        .then(function (roles) {
                  var infoList = _.map(roles, function (role) {

                      // if not get online time from db
                      var roleInfo = JSON.parse(role);
                      var info = {
                          'roleID': !!roleInfo ? roleInfo.roleID : '',
                          'name': !!roleInfo ? roleInfo.name : '',
                          'expLevel': !!roleInfo ? roleInfo.expLevel : 0,
                          'openID': !!roleInfo ? roleInfo.openID : '',
                          'zhanli': !!roleInfo ? roleInfo.zhanli : 0,
                          'loginTime': (Date.now() - new Date(!!roleInfo ? roleInfo.updateTime : 0)) / 1000 || 0
                      };
                      return info;
                  });

                  return callback(null, infoList);
              })
        .done();


};

/**
 * @Brief: 主动发送好友申请消息
 * --------------------------
 *
 * @param {Number} roleID 玩家id
 * */
/**
 * @Brief: 获取好友申请列表
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * */
Handler.sendLocalFriendApplyListToClient = function (roleID) {

    var player = playerManager.GetPlayer(roleID);

    if (!player) {
        return;
    }

    this.getLocalFriendApplyList(roleID, function (err, friendApplyList) {

        if (!!err) {
            return;
        }

        var msg = {
            result: errorCodes.OK,
            friendApplyList: friendApplyList
        };
        var route = 'ServerFriendApplyInfo';

        player.SendMessage(route, msg);
    });


};

/**
 * @Brief: 添加好友
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Function} callback 回调函数
 * */
Handler.getLocalFriendList = function (roleID, callback) {
    var self = this;

    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        return callback(null, []);
    }

    var keys = [];

    for (var id in tempList.friendList) {
        var item = tempList.friendList[id];
        if (item.GetDataInfo(gameConst.eFriendInfo.FriendType) == gameConst.eFriendType.Normal) {
            keys.push(item.GetDataInfo(gameConst.eFriendInfo.FriendID));
        }
    }

    if (!keys || 0 == keys.length) {
        return callback(null, []);
    }

    var hmGet = Q.nbind(self.client.hmget, self.client);

    hmGet(self.redisRoleInfo, keys)
        .then(function (roles) {
                  var infoList = _.map(roles, function (role) {

                      // if not get online time from db
                      var roleInfo = JSON.parse(role);
                      var temp = !!roleInfo? tempList.friendList[roleInfo.roleID]: null;

                      if (!!temp) {
                          var info = temp.getShowInfo();

                          info['name'] = !!roleInfo ? roleInfo.name : '';
                          info['expLevel'] = !!roleInfo ? roleInfo.expLevel : 0;
                          info['openID'] = !!roleInfo ? roleInfo.openID : '';
                          info['zhanli'] = !!roleInfo ? roleInfo.zhanli : 0;
                          info['loginTime'] = (Date.now() - new Date(!!roleInfo ? roleInfo.updateTime : 0)) / 1000 || 0;
                          info['isQQMember'] = !!roleInfo ? roleInfo.isQQMember : 0;
                          return info;
                      }
                  });

                  return callback(null, infoList);
              })
        .done();


};

/**
 * @Brief: 添加本地好友信息
 * ----------------------
 *
 * @param {Number} roleID 玩家id
 * @param {Object} dataList 数据列表
 * */
Handler.UpdateLocalFriendList = function (roleID, dataList) {
    var self = this;
    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsMap[roleID] = {
            friendList: {}
        };
    }

    _.each(dataList, function (item) {
        // TODO: just add new.
        tempList.friendList[item[gameConst.eFriendInfo.FriendID]] = new Friend();

        tempList.friendList[item[gameConst.eFriendInfo.FriendID]].SetAllInfo(item);

        if (!!self.friendMap[item[gameConst.eFriendInfo.FriendID]]) {
            self.friendMap[item[gameConst.eFriendInfo.FriendID]][roleID] =
                tempList.friendList[item[gameConst.eFriendInfo.FriendID]];
        } else {
            self.friendMap[item[gameConst.eFriendInfo.FriendID]] = {};
            self.friendMap[item[gameConst.eFriendInfo.FriendID]][roleID] =
                tempList.friendList[item[gameConst.eFriendInfo.FriendID]];
        }
    });
};

/**
 * @Brief: 添加本地好友申请信息
 * ----------------------
 *
 * @param {Number} roleID 玩家id
 * @param {Object} dataList 数据列表
 * */
Handler.UpdateLocalFriendApplyList = function (roleID, dataList) {

    var tempList = this.playerFriendsApplyMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsApplyMap[roleID] = {};
    }

    _.each(dataList, function (item) {
        // TODO: just add new.
        tempList[item[gameConst.eFriendApplyInfo.ApplyFriendID]] = item;
    });
};

/**
 * @Brief: 添加好友
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * */
Handler.addLocalFriend = function (roleID, friendID) {

    var tempList = this.playerFriendsMap[roleID];

    var temp = [];
    temp[gameConst.eFriendInfo.RoleID] = roleID;
    temp[gameConst.eFriendInfo.FriendID] = friendID;
    temp[gameConst.eFriendInfo.FriendType] = gameConst.eFriendType.Normal;
    /** 数据库中添加 好友数据*/
    fsSql.FriendAddByOutside(roleID, [temp], utils.done);

    if (!!tempList) {
        temp[gameConst.eFriendInfo.BlessCount] = 0;
        temp[gameConst.eFriendInfo.BlessLastDay] = 0;
        temp[gameConst.eFriendInfo.BlessReceivedLastDay] = 0;
        temp[gameConst.eFriendInfo.ClimbCustomNum] = 0;
        temp[gameConst.eFriendInfo.ClimbWeekScore] = 0;
        temp[gameConst.eFriendInfo.ClimbScoreTime] = 0;

        tempList.friendList[friendID] = new Friend();
        tempList.friendList[friendID].SetAllInfo(temp);

        /** 重置好友 cd 时间*/
        playerManager.reSetFriendListTime(roleID);
    }
};

/**
 * @Brief: 添加好友
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * */
Handler.addLocalFriendApply = function (roleID, friendID) {

    var tempList = this.playerFriendsApplyMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsApplyMap[roleID] = {};
    }

    var temp = new Array(gameConst.eFriendApplyInfo.Max);
    temp[gameConst.eFriendApplyInfo.RoleID] = roleID;
    temp[gameConst.eFriendApplyInfo.ApplyFriendID] = friendID;
    temp[gameConst.eFriendApplyInfo.ApplyTime] = utils.getCurMinute();
    /** 数据库中添加 好友数据*/
    fsSql.addFriendApply(roleID, friendID, [temp], utils.done);

    tempList[friendID] = temp;

    this.playerFriendsApplyMapNum[roleID]++;

    this.sendLocalFriendApplyListToClient(roleID);
};

/**
 * @Brief: 添加好友 回复好友申请
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * @param {Number} agreeType 是否同意加为好友
 * @param {Function} callback 回调函数
 * */
Handler.replyApplyLocalFriend = function (roleID, friendID, agreeType, callback) {

    /*    var friend = playerManager.GetPlayer(friendID);

     */
    /** 判断好友在不在线*/
    /*
     if (!friend) {
     return callback(errorCodes.FRIEND_ROLE_OFFLINE);
     }*/

    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsMap[roleID] = {
            friendList: {}
        };
    }

    if (agreeType == 0) {
        /** 不同意好友添加 移除好友申请*/
        this.removeLocalFriendApply(roleID, friendID);
    } else if (agreeType == 1) {
        /** 单个同意好友情况*/

        if (!!tempList.friendList[friendID]) {
            /** 不同意好友添加 移除好友申请*/
            this.removeLocalFriendApply(roleID, friendID);
            return callback(errorCodes.FRIEND_IS_ALREADY);
        }

        /** 是否已经申请过好友*/
        if (!this.playerFriendsApplyMap[roleID][friendID]) {
            return callback(errorCodes.FRIEND_APPLY_NO_ALREADY);
        }

        /** 添加被添加人的好友关系*/
        this.addLocalFriend(friendID, roleID);
        /** 添加好友关系*/
        this.addLocalFriend(roleID, friendID);

        /** 不同意好友添加 移除好友申请*/
        this.removeLocalFriendApply(roleID, friendID);
    } else if (agreeType == 2) {
        /**一键同意好友申请*/
        var applyMap = this.playerFriendsApplyMap[roleID];

        for (var eachFriendID in applyMap) {

            var item = applyMap[eachFriendID];

            if (!!tempList.friendList[friendID]) {
                this.removeLocalFriendApply(roleID, friendID);
                continue;
            }

            /** 添加好友关系*/
            this.addLocalFriend(roleID, item[gameConst.eFriendApplyInfo.ApplyFriendID]);
            /** 添加被添加人的好友关系*/
            this.addLocalFriend(item[gameConst.eFriendApplyInfo.ApplyFriendID], roleID);

            /** 不同意好友添加 移除好友申请*/
            this.removeLocalFriendApply(roleID, item[gameConst.eFriendApplyInfo.ApplyFriendID]);
        }
    } else if (agreeType == 3) {
        /**一键拒绝好友申请*/
        var applyMap = this.playerFriendsApplyMap[roleID];

        for (var eachFriendID in applyMap) {

            var item = applyMap[eachFriendID];

            /** 不同意好友添加 移除好友申请*/
            this.removeLocalFriendApply(roleID, item[gameConst.eFriendApplyInfo.ApplyFriendID]);
        }
    }

    this.sendLocalFriendApplyListToClient(roleID);

    return callback(null);
};

/**
 * @Brief: 添加好友 申请
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * @param {Function} callback 回调函数
 * */
Handler.applyLocalFriend = function (roleID, friendID, callback) {

    /*    var friend = playerManager.GetPlayer(friendID);

     */
    /** 判断好友在不在线*/
    /*
     if (!friend) {
     return callback(errorCodes.FRIEND_ROLE_OFFLINE);
     }*/

    var tempList = this.playerFriendsMap[roleID];

    if (!tempList) {
        tempList = this.playerFriendsMap[roleID] = {
            friendList: {}
        };
    }

    if (!!tempList.friendList[friendID]) {
        return callback(errorCodes.FRIEND_IS_ALREADY);
    }

    /** 是否已经申请过好友*/
    if (!!this.playerFriendsApplyMap[friendID] && !!this.playerFriendsApplyMap[friendID][roleID]) {
        return callback(errorCodes.FRIEND_APPLY_IS_ALREADY);
    }

    /** 该玩家已经向你申请过好友了*/
    if (!!this.playerFriendsApplyMap[roleID] && !!this.playerFriendsApplyMap[roleID][friendID]) {
        return callback(errorCodes.FRIEND_APPLY_IS_ALREADY);
    }

    /** 好友申请上限*/
    if (_.size(this.playerFriendsApplyMap[friendID]) > defaultValues.FRIEND_APPLY_SIZE_LIMIT) {
        return callback(errorCodes.FRIEND_APPLY_SIZE_LIMIT);
    }

    if (!!this.playerFriendsApplyMapNum[roleID] && this.playerFriendsApplyMapNum[roleID]
                                                   > defaultValues.FRIEND_APPLY_SIZE_LIMIT) {
        return callback(errorCodes.FRIEND_APPLY_SIZE_LIMIT);
    }

    /** 添加好友关系 */
    this.addLocalFriendApply(friendID, roleID);

    /** 添加好友关系*/
//    this.addLocalFriend(roleID, friendID);
    /** 添加被添加人的好友关系*/
//    this.addLocalFriend(friendID, roleID);
    return callback(null);
};

/**
 * @Brief: 删除好友
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * @param {Function} callback 回调函数
 * */
Handler.requestRemoveLocalFriend = function (roleID, friendID, callback) {

    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsMap[roleID] = {
            friendList: {}
        };
    }

    if (!tempList.friendList[friendID]) {
        return callback(errorCodes.FRIEND_NO_ALREADY_TO_DEL);
    }

    if (tempList.friendList[friendID].GetDataInfo(gameConst.eFriendInfo.FriendType) != gameConst.eFriendType.Normal) {
        return callback(errorCodes.FRIEND_TYPE_CANNOT_TO_DEL);
    }

    delete tempList.friendList[friendID];

    /** 删除好友关系*/
    this.removeLocalFriend(roleID, friendID);
    /** 删除被添加人的好友关系*/
    this.removeLocalFriend(friendID, roleID);
    return callback(null);
};

/**
 * @Brief: 删除好友
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * */
Handler.removeLocalFriend = function (roleID, friendID) {

    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        tempList = this.playerFriendsMap[roleID] = {
            friendList: {}
        };
    }

    /** 数据库中添加 好友数据*/
    fsSql.FriendRemoveByOutside(roleID, [friendID], utils.done);

    delete tempList.friendList[friendID];

    /** 重置好友 cd 时间*/
    playerManager.reSetFriendListTime(roleID);
};

/**
 * @Brief: 删除好友
 * ---------------
 *
 * @param {Number} roleID 玩家id
 * @param {Number} friendID 玩家id
 * */
Handler.removeLocalFriendApply = function (roleID, friendID) {

    /** 数据库中添加 好友数据*/
    fsSql.removeFriendApply(roleID, friendID, utils.done);

    if (!!this.playerFriendsApplyMap[roleID]) {
        delete this.playerFriendsApplyMap[roleID][friendID];
    }

    this.playerFriendsApplyMapNum[roleID]--;
};

/**
 * @return {number}
 */
Handler.GetFriendNum = function (roleID, friendType) {
    var playerFriends = this.playerFriendsMap[roleID];
    if (!playerFriends) {
        return 0;
    }
    if (friendType === gameConst.eFriendType.All) {
        return _.size(playerFriends.friendList);
    }
    return _.countBy(playerFriends.friendList, function (item) {
        return item.friendType === friendType ? 'count' : 'none';
    }).count;
};

Handler.GetFriendRoleIDs = function (roleID, friendType) {
    this.GetFriendInfo(roleID, function (friListInfo) {
        return friListInfo;
    });
    /*var playerFriends = this.playerFriendsMap[roleID];
     if (!playerFriends) {
     return [];
     }

     if (friendType === gameConst.eFriendType.All) {
     return _.keys(playerFriends.friendList);
     }

     return _.reduce(playerFriends.friendList, function (memo, item, key) {
     item.friendType === friendType ? memo.push(key) : 'none';
     return memo;
     }, []);*/
};

Handler.DeletePlayer = function (roleID) {
    var fsNumber = this.GetFriendNum(roleID, gameConst.eFriendType.All);
    /**从好友列表中去除引用*/
    if (!!this.playerFriendsMap[roleID]) {
        var map = this.playerFriendsMap[roleID].friendList;
        for (var id in map) {
            if (!!this.friendMap[id]) {
                delete this.friendMap[id][roleID];
            }
        }
    }
    delete this.playerFriendsMap[roleID];
    return fsNumber;
};

Handler.UpdateFriendInfo = function (roleID, index, value) {
    var tempList = this.playerFriendsMap[roleID];
    if (null != tempList) {
        for (var index in tempList) {
            var friendList = this.playerFriendsMap[index];
            if (null != friendList) {
                var tempFriend = friendList.friendList[roleID];
                if (null != tempFriend) {
                    tempFriend.SetDataInfo(index, value);
                    this.SendFriendMsg([tempFriend], friendList.uid, friendList.sid, 1);
                }
            }
        }
    }
};

Handler.RequireBlessList = function (roleID, callback) {
    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        return callback(errorCodes.NoRole);
    }

    var dayOfYear = utils.getDayOfYear(new Date());
    var result = [];
    for (var i in tempList.friendList) {
        result.push({
            roleID: tempList.friendList[i].GetDataInfo(gameConst.eFriendInfo.FriendID),
            blessCount: tempList.friendList[i].GetDataInfo(gameConst.eFriendInfo.BlessCount) || 0,
            blessYou: tempList.friendList[i].GetDataInfo(gameConst.eFriendInfo.BlessLastDay) == dayOfYear,
            blessMe: tempList.friendList[i].GetDataInfo(gameConst.eFriendInfo.BlessReceivedLastDay)
                     == dayOfYear
        });
    }
    return callback(null, result);
};

/**
 * 送到重其他服务器发送过来的祝福消息
 * @param {number} roleID 本服收到祝福玩家ID
 * @param {number} friendID 发送祝福的跨服好友ID
 * @param callback
 * */
Handler.BlessFromOtherGame = function (roleID, friendID, callback) {
    /**
     * 这里有一个问题是 没办法确定跨服的玩家是否存在, 直接更新数据库可能会出现问题 TODO GAO
     * 两个游戏服务器是不同步的， 玩家删号， 刚加好友， 可能都会有这些问题
     * */
    fsSql.BlessReceived(roleID, friendID, function (err, result) {
        logger.info('across fsSql.BlessReceived:%j,%j', err, result);
    });
    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        //跨服好友不在线
        fsSql.AddPvPBlessReceived(roleID, function (err, result) {
            logger.info('across fsSql.AddPvPBlessReceived:%j,%j', err, result);
        });
        return callback(null, {result: 0});
    }

    var friend = tempList.friendList[friendID];

//    if (!friend) {
//        return callback(errorCodes.NoRole);
//    }

    var player = playerManager.GetPlayer(roleID);
    if (player == null) {
        //理论上是到不了这里的。
        fsSql.AddPvPBlessReceived(roleID, function (err, result) {
            logger.info('across fsSql2.AddPvPBlessReceived:%j,%j', err, result);
        });
        return callback(null, {result: 0});
    }

    var params = {
        friendID: roleID
    };

    if (player) {
        pomelo.app.rpc.cs.pvpRemote.BlessReceived(null, player.csID, roleID, params, function (err, result) {
            logger.info('across pomelo.app.rpc.cs.pvpRemote.BlessReceived from other game:%j,%j', err, result);
        });
    }
    return callback(null, {result: 0});
};

Handler.Bless = function (roleID, friendID, callback) {
    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        return callback(errorCodes.NoRole);
    }

    var friend = tempList.friendList[friendID];

    if (!friend) {
        return callback(errorCodes.NoRole);
    }

    var dayOfYear = utils.getDayOfYear(new Date());

    if (friend.GetDataInfo(gameConst.eFriendInfo.BlessLastDay) == dayOfYear) {
        return callback(errorCodes.Fs_BlessedToday);
    }

    var player = playerManager.GetPlayer(roleID);
    if (player == null) {
        return callback(errorCodes.NoRole);
    }

    friend.SetDataInfo(gameConst.eFriendInfo.BlessLastDay, dayOfYear);

    var params = {
        friendID: friendID
    };

    if (friend.isAcross()) {
        friendClient.sendMsgToOtherGame(friend.GetServerUid(), eAcrossApi.BLESSING,
            {roleID: roleID, friendID: friendID},
                                        function (err, result) {
                                            if (!!err) {
                                                logger.warn('%s send to %s(other game) blessing failed: %j', roleID,
                                                            friendID,
                                                            utils.getErrorMessage(err));
                                            }
                                        });
    } else {
        var otherPlayer = playerManager.GetPlayer(friendID);
        if (otherPlayer) {
            params.friendCsID = otherPlayer.csID;
            pomelo.app.rpc.cs.pvpRemote.BlessReceived(null, otherPlayer.csID, friendID, params, function (err, result) {
                logger.info('pomelo.app.rpc.cs.pvpRemote.BlessReceived:%j,%j', err, result);
            });
        }
        else {
            fsSql.AddPvPBlessReceived(friendID, function (err, result) {
                logger.info('fsSql.AddPvPBlessReceived:%j,%j', err, result);
            });
        }

        fsSql.BlessReceived(friendID, roleID, function (err, result) {
            logger.info('fsSql.BlessReceived:%j,%j', err, result);
        });
    }

    fsSql.Bless(roleID, friendID, function (err, result) {
        logger.info('fsSql.Bless:%j,%j', err, result);
    });

    pomelo.app.rpc.cs.pvpRemote.Bless(null, player.csID, roleID, params, function (err, data) {
                                          logger.info('pomelo.app.rpc.cs.pvpRemote.Bless:%j,%j', err, data);

                                          var result = {
                                              roleID: friendID,
                                              blessLeft: data
                                          };

                                          return callback(null, result);
                                      }
    );
};

Handler.RequireBlessing = function (roleID, callback) {
    var self = this;

    var tempList = this.playerFriendsMap[roleID];
    if (!tempList) {
        return callback(errorCodes.NoRole);
    }

    var player = playerManager.GetPlayer(roleID);
    if (player == null) {
        return callback(errorCodes.NoRole);
    }

    var count = 0;

    if (self.GetFriendNum(roleID, gameConst.eFriendType.All) === 0) {
        return callback(errorCodes.Fs_NoFriend);
    }

    var params = {};

    pomelo.app.rpc.cs.pvpRemote.RequireBlessing(null, player.csID, roleID, params, function (err, data) {
                                                    _.each(tempList.friendList, function (value, key, list) {
                                                        if (value.GetServerUid() == config.list.serverUid) {
                                                            // send mail
                                                            var mailDetail = {
                                                                recvID: +key,
                                                                subject: util.format(sFsString.subject_1, player.name),//player.name + '求祝福',
                                                                content: util.format(sFsString.content_1, player.name),//player.name + '已经弹尽粮绝，正在期盼着你的祝福',
                                                                mailType: gameConst.eMailType.System
                                                            };
                                                            pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail,
                                                                                                utils.done);
                                                            ++count;
                                                        } else if (value.isAcross()) {
                                                            // send mail
                                                            var mailDetail = {
                                                                recvID: +key,
                                                                subject: util.format(sFsString.subject_1, player.name),//player.name + '求祝福',
                                                                content: util.format(sFsString.content_1, player.name),//player.name + '已经弹尽粮绝，正在期盼着你的祝福',
                                                                mailType: gameConst.eMailType.System
                                                            };
                                                            self.sendRequireBlessingAcross(value,
                                                                                           mailDetail);
                                                            ++count;
                                                        }
                                                    });

                                                    var result = {
                                                        result: errorCodes.OK,
                                                        count: count,
                                                        blessLeft: data
                                                    };
                                                    return callback(null, result);
                                                }
    );
};

/***
 * 发送跨服请求祝福邮件
 * @param {number} friendID 要发送的好友ID
 * @param {object} mailDetail 邮件封装
 * */
Handler.sendRequireBlessingAcross = function (friend, mailDetail) {
    friendClient.sendMsgToOtherGame(friend.GetServerUid(), eAcrossApi.REQUIRE_BLESSING,
        {mailDetail: mailDetail},
                                    function (err, result) {
                                        if (!!err) {
                                            logger.warn('%s send to %s(other game) RequireBlessing failed: %j',
                                                        roleID,
                                                        k,
                                                        utils.getErrorMessage(err));
                                        }
                                    });
};

/**
 * 是否是跨服好友
 * @param {number} roleID 玩家ID
 * @param {friend} 好友ID
 * @param {boolean}
 */
Handler.IsAcrossFriend = function (roleID, friendID) {
    var playerFriends = this.playerFriendsMap[roleID];
    if (!playerFriends) {
        return false;
    }
    var friend = playerFriends.friendList[friendID];
    if (null == friend) {
        return false;
    }
    return friend.isAcross();
};

/**
 * 向跨服好友赠送友情点
 * @param {number} roleID 玩家ID
 * @param {friend} 好友ID
 */
Handler.sendFriendPhysicalAcross = function (roleID, friendID, callback) {
    var playerFriends = this.playerFriendsMap[roleID];
    if (!playerFriends) {
        return callback(errorCodes.Ms_NoFriend);
    }
    var friend = playerFriends.friendList[friendID];
    if (null == friend) {
        return callback(errorCodes.Ms_NoFriend);
    }
    friendClient.sendMsgToOtherGame(friend.GetServerUid(), eAcrossApi.FRIEND_PHYSICAL,
        {roleID: roleID, friendID: friendID},
                                    function (err) {
                                        if (!!err) {
                                            logger.warn('%s send to %s(other game) RequirsendRequireBlessingAcross failed: %j',
                                                        roleID,
                                                        friendID,
                                                        utils.getErrorMessage(err));
                                        }
                                    });
};

Handler.GetFriendInfo = function (roleID, callback) {
    var self = this;


    var friendIDsAndOpenIDs = {
        roleIDs: [],
        openIDs: [],
        serverUids: [],
        nickNames: [],
        pictures: [],
        isQQMember : []
    };

    Q(self.playerFriendsMap[roleID])
        .then(function (player) {
                  if (!player || !player.friendList) {
                      return Q.ninvoke(self, 'RequireFriendList', roleID)
                          .then(function () {
                                    return self.playerFriendsMap[roleID];
                                });
                  }

                  return player;
              })
        .then(function (player) {
                  if (!player) {
                      return Q.reject(errorCodes.Fs_NoFriend);
                  }
                  friendIDsAndOpenIDs.myPicture = player.picture;
                  friendIDsAndOpenIDs.myNickName = player.nickName;
                  _.each(player.friendList, function (item, key) {
                      friendIDsAndOpenIDs.roleIDs.push(key);
                      friendIDsAndOpenIDs.openIDs.push(item.GetOpenID());
                      friendIDsAndOpenIDs.serverUids.push(item.GetShowServerUid());
                      friendIDsAndOpenIDs.nickNames.push(item.getNickName());
                      friendIDsAndOpenIDs.pictures.push(item.getPicture());
                      friendIDsAndOpenIDs.isQQMember.push(item.getISQQMember());
                  });
              })
        .finally(function () {
                     return callback(null, friendIDsAndOpenIDs);
                 })
        .done();
};

/**
 * 是否是本服玩家的跨服好友
 * @param {number} friendID 好友id
 * @return {boolean}
 * */
Handler.isAcrossByID = function (friendID) {
    logger.info("%d, -- %j", friendID, this.friendMap[friendID]);
    if (!this.friendMap[friendID]) {
        return false;
    }
    for (var id in this.friendMap[friendID]) {
        if (this.friendMap[friendID][id].isAcross()) {
            return true;
        }
    }
    return false;
};

/**
 * 获取跨服好友的serverUid
 * @param {number} friendID 好友id
 * */
Handler.getServerUidByID = function (friendID) {
    if (!this.friendMap[friendID]) {
        return 0;
    }
    for (var id in this.friendMap[friendID]) {
        return this.friendMap[friendID][id].GetServerUid();
    }
    return 0;
};

/***
 * 发送跨服邮件
 * @param {string} serverUid 要发送的跨服ID
 * @param {object} mailDetail 邮件封装
 * @param {function} cb
 * */
Handler.sendAcrossMail = function (serverUid, mailDetail, cb) {
    friendClient.sendMsgToOtherGame(serverUid, eAcrossApi.SEND_ACROSS_MAIL, {mailDetail: mailDetail},
                                    function (err, res) {
                                        if (!!err || res.result != errorCodes.OK) {
                                            logger.warn('send to %s(other game) sendAcrossMail: %j failed: %j',
                                                        serverUid, mailDetail,
                                                        utils.getErrorMessage(err));
                                            cb(err, {result: res.result});
                                            return;
                                        }
                                        cb(null, {result: res.result})
                                    });
};

/**
 * 获取好友爬塔跨服好友SetName
 * @param {string} serverUid 服务器id
 * @return {string}
 * */
Handler.getZSetNameZhanli = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':zhanli@' + serverUid + ':' + pomelo.app.getMaster().port;
};

/**
 * 获取好玩家信息SetName
 * @param {string} serverUid 服务器id
 * @return {string}
 * */
Handler.getRoleZSetName = function (serverUid) {
    serverUid = globalFunction.GetUseServerUId(serverUid);
    return config.redis.chart.zsetName + ':roleInfo@' + serverUid + ':' + pomelo.app.getMaster().port;
};

/***
 * @Brief 合服后， roleDetail 没有玩家数据，跨服请求好友数据
 * @param {string} serverUid 要发送的跨服ID
 * @param {Number} roleID 需要回复的玩家ID
 * @param {function} cb
 * */
Handler.rebuildRoleDetail = function (serverUid, roleID, cb) {
    friendClient.sendMsgToOtherGame(serverUid, eAcrossApi.REBUILD_ROLE_DETAIL, {roleID: roleID},
                                    function (err, res) {
                                        if (!!err || !res.result || res.result != errorCodes.OK) {
                                            logger.warn('send to %s(other game) roleID: %j failed: %j',
                                                        serverUid, roleID,
                                                        utils.getErrorMessage(err));
                                            cb(err, {result: !res ? errorCodes.SystemWrong : res.result});
                                            return;
                                        }
                                        cb(null, {result: res.result})
                                    });
};