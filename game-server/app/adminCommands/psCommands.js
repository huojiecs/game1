 /**
 * Created by xykong on 2014/6/27.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var playerManager = require('./../psIdip/player/playerManager');
var errorCodes = require('./../tools/errorCodes');
var utils = require('./../tools/utils');
var utilSql = require('./../tools/mysql/utilSql');
var gmSql = require('./../tools/mysql/gmSql');
var gameConst = require('./../tools/constValue');
var Q = require('q');
var _ = require('underscore');
var globalFunction = require('./../tools/globalFunction');
var tlogUtil = require('../ps/tlogUtil');
var offlinePlayerManager = require('../ps/player/offlinePlayerManager');
var defaultValues = require('./../tools/defaultValues');
var config = require('../../app/tools/config');
var psSql = require('../tools/mysql/psSql');
var templateManager = require('../tools/templateManager');
var templateConst = require('../../template/templateConst');
var urlencode = require('urlencode');
var stringValue = require('./../tools/stringValue');
 var ps_playerManager = require('./../ps/player/playerManager');
var sAdminCommandsString = stringValue.sAdminCommandsString;

var eAssetsInfo = gameConst.eAssetsInfo;

var handler = module.exports = {

};

handler.Reload = function () {
    var module = './psCommands';
    delete require.cache[require.resolve(module)];
    var psCommands = require(module);
    pomelo.app.set('psCommands', psCommands);
    return errorCodes.OK;
};

handler.csCommand = function () {
    var args = Array.prototype.slice.call(arguments, 0);

    if (arguments.length < 2) {
        return errorCodes.ParameterWrong;
    }

    var cmd = '' + args.shift();
    if (cmd.length === 0) {
        return errorCodes.ParameterWrong;
    }

    var roleID = +args.shift();
    if (!roleID) {
        return errorCodes.NoRole;
    }

    var csID = playerManager.GetPlayerCs(roleID);
    if (!csID) {
        return errorCodes.NoRole;
    }

    return function (callback) {
        pomelo.app.rpc.cs.gmRemote.GMorder(null, csID, roleID, cmd, args, function (err, res) {
            if (!!err) {
                return callback(null, err);
            }

            return callback(null, res);
        });
    }
};

handler.SetApp = function (type, setting, val) {
    var args = Array.prototype.slice.call(arguments, 0);

    return function (callback) {

        var func = Q.nbind(pomelo.app.rpc[type][type + 'Remote'].SetApp, pomelo.app.rpc.connector.conRemote);

        var allTasks = _.map(pomelo.app.getServersByType(type), function (item) {
            return func(null, item.id, setting, val);
        });

        Q.all(allTasks)
            .then(function () {
                      logger.fatal('SetApp Ok! %j', args);
                  })
            .catch(function (err) {
                       logger.fatal('SetApp failed! %j %s', args, err.stack);
                   })
            .finally(function () {
                         utils.invokeCallback(callback, null, 'Done!');
                     })
            .done();
    };
};

handler.PrepareShutdown = function () {
    return function (callback) {

        var prepareShutdown = Q.nbind(pomelo.app.rpc.connector.conRemote.PrepareShutdown,
                                      pomelo.app.rpc.connector.conRemote);

        var allTasks = _.map(pomelo.app.getServersByType('connector'), function (item) {
            return prepareShutdown(null, item.id);
        });

        Q.all(allTasks)
            .then(function () {
                      logger.fatal('PrepareShutdown Ok!');
                  })
            .catch(function (err) {
                       logger.fatal('PrepareShutdown failed! %s', err.stack);
                   })
            .finally(function () {
                         utils.invokeCallback(callback, null, 'Done!');
                     })
            .done();
    };
};

/* 查询玩家角色列表 */
// [cmd]: 10084004
//
// [request]: IDIP_QUERY_ROLELIST_REQ
//
//     "RoleIDList" : []       /* RoleID list */
//
// [rsponse]: IDIP_QUERY_ROLELIST_RSP
//
//     "RoleList_count" : ,    /* 角色信息列表的最大数量 */
//     "RoleList" :            /* 角色信息列表 */
//     [
//          {
//              "RoleId" : ,             /* 角色ID */
//              "RoleName" : "",         /* 角色名 */
//              "Partition" : ,          /* 所在分区 */
//              "Level" : ,              /* 角色等级 */
//              "Title" : "",            /* 角色称号 */
//              "DevilNum" : ,           /* 邪神开启数量 */
//              "DevilLevel" : ,         /* 各邪神等级 */
//              "DevilSkillLevel" :      /* 邪神各技能等级 */
//          }
//     ]
handler.query_rolelist = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK"
        };

        var rsp_value = {
            RoleList_count: 0,
            RoleList: []
        };

        var online = {};
        var offline = [];

        _.each(req_value.RoleIDList, function (item) {
            var csId = playerManager.GetPlayerCs(item);
            !!csId ? (online[item] = csId) : offline.push(item);
        });

        var jobs = _.map(offline, function (item) {
            return Q.ninvoke(gmSql, 'GetRoleListInfo', item);
        });
        jobs = jobs.concat(_.map(online, function (csId, item) {
            return Q.ninvoke(pomelo.app.rpc.cs.gmRemote, 'idipGetRoleInfo', null, csId, item);
        }));

        Q.all(jobs)
            .then(function (roleInfoList) {
                      rsp_value.RoleList = roleInfoList;

                      rsp_value.RoleList = _.map(roleInfoList, function (item) {
                          return {
                              "Partition": config.list && config.list.serverUid || config.gameServerList.serverUid,
                              "RoleId": item['_roleId'],
                              "Level": item['_expLevel'], /* 角色等级 */
                              "RoleName": urlencode(item['_roleName'].toString('uft8')), /* 角色名 */
                              "Title": urlencode(item['_Title'].toString('utf8')), /* 角色称号 */
                              "DevilNum": item['_DevilNum'], /* 邪神开启数量 */
                              "DevilLevel": item['_DevilLevel'], /* 各邪神等级 */
                              "DevilSkillLevel": item['_DevilSkillLevel']     /* 邪神各技能等级 */
                          }
                      });

                      rsp_value.RoleList_count = rsp_value.RoleList.length;

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       rsp_result.Result = errorCodes.SystemWrong;
                       rsp_result.RetErrMsg = utils.getErrorMessage(err);

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 查询玩家角色列表(分区) */
// [cmd]: 10084026
//
// [request]: IDIP_QUERY_ROLELIST_PARTITION_REQ
//
//     "body" :
//      {
//          "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//          "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//          "OpenId" : "",     /* openid */
//          "Partition" :      /* 分区（0表示全区） */
//      }
//
// [rsponse]: IDIP_QUERY_ROLELIST_PARTITION_RSP
//
//     "PartitionRoleList_count" : ,    /* 角色信息列表的最大数量 */
//     "PartitionRoleList" :            /* 角色信息列表 */
//     [
//          {
//              "RoleId" : ,             /* 角色ID */
//              "RoleName" : "",         /* 角色名 */
//              "Partition" : ,          /* 所在分区 */
//              "Level" : ,              /* 角色等级 */
//              "Title" : "",            /* 角色称号 */
//              "DevilNum" : ,           /* 邪神开启数量 */
//              "DevilLevel" : ,         /* 各邪神等级 */
//              "DevilSkillLevel" :      /* 邪神各技能等级 */
//          }
//     ]
handler.query_rolelist_partition = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK"
        };

        var rsp_value = {
            PartitionRoleList_count: 0,
            PartitionRoleList: []
        };


        Q.ninvoke(gmSql, 'GetRoleListByServerUid', req_value.OpenId, req_value.Partition)
            .then(function (roleList) {
                              if(defaultValues.idipQueryRoleListByRedis == 1) {
                                  var jobs = _.map(roleList, function(item) {
                                      return Q.ninvoke(playerManager, 'GetRoleInfoOnRedis', item['roleID'])
                                  });
                              } else {
                                  var online = {};
                                  var offline = [];
                                  _.each(roleList, function (item) {
                                      var csId = playerManager.GetPlayerCs(item['roleID']);
                                      !!csId ? (online[item['roleID']] = csId) : offline.push(item['roleID']);
                                  });

                                  var jobs = _.map(offline, function (item) {
                                      return Q.ninvoke(gmSql, 'GetRoleListInfo', item);
                                  });
                                  jobs = jobs.concat(_.map(online, function (csId, item) {
                                      return Q.ninvoke(pomelo.app.rpc.cs.gmRemote, 'idipGetRoleInfo', null, csId, item);
                                  }));
                              }
                              return Q.all(jobs)
                          })
            .then(function (roleInfoList) {
                      rsp_value.PartitionRoleList = roleInfoList;

                      rsp_value.PartitionRoleList = _.map(roleInfoList, function (item) {
                          if(defaultValues.idipQueryRoleListByRedis) {
                              if(item == null) {
                                  return;
                              }

                              return {
                                  "RoleId": item['roleID'],
                                  "Level": item['expLevel'],
                                  "RoleName": urlencode(item['name'].toString('uft8')), /* 角色名 */
                                  "Title": urlencode('NoTitle'.toString('utf8')), /* 角色称号 */
                                  "DevilNum": 0, /* 邪神开启数量 */
                                  "DevilLevel": 0, /* 各邪神等级 */
                                  "DevilSkillLevel": 0     /* 邪神各技能等级 */
                              };
                          } else {

                              return {
                                  "RoleId": item['_roleId'],
                                  "Level": item['_expLevel'], //* 角色等级 *//*
                                  "RoleName": urlencode(item['_roleName'].toString('uft8')), /* 角色名 */
                                  "Title": urlencode(item['_Title'].toString('utf8')), /* 角色称号 */
                                  "DevilNum": item['_DevilNum'], /* 邪神开启数量 */
                                  "DevilLevel": item['_DevilLevel'], /* 各邪神等级 */
                                  "DevilSkillLevel": item['_DevilSkillLevel']     /* 邪神各技能等级 */
                              }
                          }
                      });

                      for(var i = 0; i < rsp_value.PartitionRoleList.length; i++) {
                          if(null == rsp_value.PartitionRoleList[i]) {
                              rsp_value.PartitionRoleList.splice(i, 1);
                              i = i - 1;
                          }
                      }

                      rsp_value.PartitionRoleList_count = rsp_value.PartitionRoleList.length;

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       rsp_result.Result = errorCodes.SystemWrong;
                       rsp_result.RetErrMsg = utils.getErrorMessage(err);

                       return callback(null, [rsp_result, rsp_value]);
                   })
            .done();
    }
};

/* 初始化账号（AQ） */
//[cmd]:
//
//[request]: IDIP_AQ_DO_INIT_ACCOUNT_REQ
//    "AreaId" : ,             /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,          /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,             /* 平台：IOS（0），安卓（1），全部（2） */
//    "OpenId" : "",          /* openid */
//    "RoleId" : "",           /* 角色ID */
//    "IsInit" : ,            /* 是否初始化（0 否  1 是） */
//    "Source" : ,            /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""           /* 流水号，由前端生成，不需要填写 */
//
//
//[rsponse]: IDIP_AQ_DO_INIT_ACCOUNT_RSP
//    "NoticeId" : ,    /* 公告ID */
//    "Result" : ,      /* 结果 */
//    "RetMsg" : ""     /* 返回消息 */
handler.aq_do_init_account = function(req_value) {
    return function(callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var openID = req_value.OpenId;
        var roleID = req_value.RoleId;
        var isInit = req_value.IsInit;

        if (isInit == 0) {
            return callback(null, [rsp_result, rsp_value]);
        }
        if (null == openID) {
            rsp_result.Result = errorCodes.ParameterNull;
            rsp_result.RetErrMsg = "parameter null";

            rsp_value.Result = errorCodes.ParameterNull;
            rsp_value.RetMsg = "parameter null";
            return callback(null, [rsp_result, rsp_value]);
        }
        Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
            .then(function (res) {
                              var accountID = res;
                              if (null == accountID || null == roleID) {
                                  rsp_result.Result = errorCodes.ParameterNull;
                                  rsp_result.RetErrMsg = "parameter null";

                                  rsp_value.Result = errorCodes.ParameterNull;
                                  rsp_value.RetMsg = "parameter null";
                                  return callback(null, [rsp_result, rsp_value]);
                              }
                              var csServerID = playerManager.GetPlayerCs(roleID);
                              if (!!csServerID) {
                                  var checkID = playerManager.GetAccountCheckID(accountID);
                                  var frontendID = playerManager.GetAccountFrontendID(accountID);
                                  pomelo.app.rpc.cs.csRemote.GetPlayerInfoForIdip(null, csServerID, roleID, globalFunction.GetYuanBaoTemp(), function (err, info) {
                                      if(err) {
                                          rsp_result.Result = err;
                                          rsp_result.RetErrMsg = "No such role";

                                          rsp_value.Result = err;
                                          rsp_value.RetMsg = "No such role";
                                          return callback(null, [rsp_result, rsp_value]);
                                      }
                                      pomelo.app.rpc.connector.conRemote.SetUserOut(null, frontendID, checkID, function() {
                                          tlogUtil.DeleteRole(accountID, roleID, info.name, function() {
                                              tlogUtil.CreateRole(info.tempID, info.name, info.yuanbao, accountID, function(err, res) {
                                                  return callback(null, [rsp_result, rsp_value]);
                                              });
                                          });
                                      });
                                  });
                              } else {
                                  offlinePlayerManager.GetPlayerDetailsEX(roleID, function (err, details) {
                                      if(err) {
                                          rsp_result.Result = err;
                                          rsp_result.RetErrMsg = "No such role";

                                          rsp_value.Result = err;
                                          rsp_value.RetMsg = "No such role";
                                          return callback(err, [rsp_result, rsp_value]);
                                      }
                                      var tempID = details.tempID;
                                      var name = details.name;
                                      var yuanbao = details.zuanshi;
                                      tlogUtil.DeleteRole(accountID, roleID, name, function() {
                                          tlogUtil.CreateRole(tempID, name, yuanbao, accountID, function(err, res) {
                                              return callback(null, [rsp_result, rsp_value]);
                                          });
                                      });
                                  });
                              }
                          })
            .catch(function(err) {
                               if (_.isArray(err)) {
                                   return callback(null, err);
                               }
                               rsp_result.Result = errorCodes.SystemWrong;
                               rsp_result.RetErrMsg = "SystemWrong";

                               rsp_value.Result = errorCodes.SystemWrong;
                               rsp_value.RetMsg = "SystemWrong";

                               return callback(null, [rsp_result, rsp_value]);
                           })
            .done();

    };
};

handler.kickUserOut = function (req_value) {
    return function (callback) {
        var rsp_result = {};
        var rsp_value = {};

        var accountID = req_value.accountID;
        var checkID = ps_playerManager.GetAccountCheckID(accountID);
        var frontendID = ps_playerManager.GetAccountFrontendID(accountID);
        if (checkID.length > 0) {
            pomelo.app.rpc.connector.conRemote.SetUserOut(null, frontendID, checkID, utils.done);
        }
        rsp_result.Result = errorCodes.OK;
        rsp_result.RetErrMsg = 'OK';

        rsp_value.Result = errorCodes.OK;
        rsp_value.RetMsg = 'OK';

        return callback(null, [rsp_result, rsp_value]);
    };
};

/*
 param:
 type:       公告类型  1.弹窗公告  2.滚动公告
 startTime:  开始时间（秒数）
 endTime:    结束时间（秒数）  0 表示不设结束时间
 freq:       频率（毫秒数） 每过多少毫秒刷一次
 count:      刷公告次数（整数）
 content:    公告内容（字符串）
 priority:   公告优先级  1.高优先级，放队列头  0.低优先级，放队列尾
 */
handler.sendChat = function () {
    if (arguments.length !== 7) {
        return errorCodes.ParameterWrong;
    }
    var type = arguments[0];
    var startTime = arguments[1];
    var endTime = arguments[2];
    var freq = arguments[3];
    var count = arguments[4];
    var chatContent = '' + arguments[5];
    var priority = arguments[6];
    pomelo.app.rpc.chat.chatRemote.SendGMChat(null, type, startTime, endTime, freq, count, chatContent, priority,
                                              utils.done);
    return errorCodes.OK;
};

handler.deleteChat = function () {
    if (arguments.length !== 1) {
        return errorCodes.ParameterWrong;
    }
    var chatID = '' + arguments[0];
    pomelo.app.rpc.chat.chatRemote.DeleteGMChat(null, chatID, utils.done);
    return errorCodes.OK;
};

/* 封号 */
// [cmd]: 10084006
//
// [request]: IDIP_DO_BAN_ROLE_REQ
//
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "BanTime" : ,      /* 封号时长：*秒（*为大于0的完整数字），-1为永久 */
//     "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//     "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
// [rsponse]: IDIP_DO_BAN_ROLE_RSP
//
//     "Result" : ,      /* 结果：（0）成功，（其他）失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.do_ban_role = function (req_value) {
    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var openID = '' + req_value.OpenId;
        var roleID = +req_value.RoleId;
        var banTime = +req_value.BanTime;

        Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
            .then(function (res) {
                      var accountID = res;
                      if (!openID || !roleID) {
                          rsp_result.Result = errorCodes.ParameterWrong;
                          rsp_result.RetErrMsg = 'ParameterWrong';

                          rsp_value.Result = errorCodes.ParameterWrong;
                          rsp_value.RetMsg = 'ParameterWrong';
                          return callback(null, [rsp_result, rsp_value]);
                      }
                      var checkID = playerManager.GetAccountCheckID(accountID);
                      var frontendID = playerManager.GetAccountFrontendID(accountID);
                      if (checkID.length > 0) {
                          pomelo.app.rpc.connector.conRemote.SetUserOut(null, frontendID, checkID, utils.done);
                      }
                      var dateNum = Date.now() + banTime * 1000;
                      if (banTime === -1) {
                          dateNum = new Date('9999-12-31 00:00:00').getTime();
                      }
                      var data = {
                          'time': utilSql.DateToString(new Date(dateNum)),
                          'reason': sAdminCommandsString.reason
                      }
                      if(banTime != 0) {
                          return Q.nfcall(gmSql.SetAccountCanLoginTime, accountID, JSON.stringify(data));
                      } else {
                          return Q.resolve();
                      }
                  })
            .then(function (res) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';
                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.SystemWrong;
                       rsp_result.RetErrMsg = "SystemWrong";

                       rsp_value.Result = errorCodes.SystemWrong;
                       rsp_value.RetMsg = "SystemWrong";
                       return callback(null, [rsp_result, rsp_value]);
                   }).done();
    }
};

/* 封号（AQ） */
// [cmd]: 10084820
//
// [request]: IDIP_AQ_DO_BAN_ROLE_REQ
//
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "RoleId" : ,       /* 角色ID */
//     "Time" : ,      /* 封号时长：*秒（*为大于0的完整数字），-1为永久 */
//     "Reason" : "",     /* 封号提示原因 */
//     "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//     "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
// [rsponse]: IDIP_AQ_DO_BAN_ROLE_RSP
//
//     "Result" : ,      /* 结果：（0）成功，（其他）失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.aq_do_ban_role = function (req_value) {
    return function (callback) {

        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var openID = '' + req_value.OpenId;
        var roleID = +req_value.RoleId;
        var banTime = +req_value.Time;
        var reason = req_value.Reason;
        reason = urlencode.decode(reason, 'utf8');

        Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
            .then(function (res) {
                      var accountID = res;
                      if (!openID || !roleID) {
                          rsp_result.Result = errorCodes.ParameterWrong;
                          rsp_result.RetErrMsg = 'ParameterWrong';

                          rsp_value.Result = errorCodes.ParameterWrong;
                          rsp_value.RetMsg = 'ParameterWrong';
                          return callback(null, [rsp_result, rsp_value]);
                      }
                      var checkID = ps_playerManager.GetAccountCheckID(accountID);
                      var frontendID = ps_playerManager.GetAccountFrontendID(accountID);
                      if (checkID.length > 0) {
                          pomelo.app.rpc.connector.conRemote.SetUserOut(null, frontendID, checkID, utils.done);
                      }
                      var dateNum = Date.now() + banTime * 1000;
                      if (banTime === -1) {
                          dateNum = new Date('9999-12-31 00:00:00').getTime();
                      }
                      var data = {
                          'time': utilSql.DateToString(new Date(dateNum)),
                          'reason': reason
                      }
                      if(banTime != 0) {
                          return Q.nfcall(gmSql.SetAccountCanLoginTime, accountID, JSON.stringify(data));
                      } else {
                          return Q.resolve();
                      }
                  })
            .then(function (res) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK';

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK';
                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.SystemWrong;
                       rsp_result.RetErrMsg = "SystemWrong";

                       rsp_value.Result = errorCodes.SystemWrong;
                       rsp_value.RetMsg = "SystemWrong";
                       return callback(null, [rsp_result, rsp_value]);
                   }).done();
    }
};


/* 全服修改财产(非装备类) */

//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "tempId" : "",     /* 财产编号, AssetsID */
//     "addNum" : "",     /* 增加数量 */
//
//
//     "Result" : ,      /* 结果：（0）成功，（其他）失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.add_all_player_assets = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var list = pomelo.app.getServersByType('cs');
        if (!list || !list.length) {
            rsp_result.Result = errorCodes.SystemWrong;
            rsp_result.RetErrMsg = 'SystemWrong';

            rsp_value.Result = errorCodes.SystemWrong;
            rsp_value.RetMsg = 'SystemWrong';
            return callback(null, [rsp_result, rsp_value]);
        }
        var paramObj = {
            tempID: req_value.tempId,
            addNum: req_value.addNum
        };
        for (var index in list) {
            var csSeverID = list[index].id;
            pomelo.app.rpc.cs.gmRemote.gmCommands(null, csSeverID, 'addallmoney', paramObj, utils.done);
        }

        return callback(null, [rsp_result, rsp_value]);
    };
};

/* 全服添加装备 */

//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "tempId" : "",     /* 物品编号, itemID */
//     "addNum" : "",     /* 增加数量 */
//
//
//     "Result" : ,      /* 结果：（0）成功，（其他）失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.add_all_player_item = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var list = pomelo.app.getServersByType('cs');
        if (!list || !list.length) {
            rsp_result.Result = errorCodes.SystemWrong;
            rsp_result.RetErrMsg = 'SystemWrong';

            rsp_value.Result = errorCodes.SystemWrong;
            rsp_value.RetMsg = 'SystemWrong';
            return callback(null, [rsp_result, rsp_value]);
        }
        if (req_value.addNum <= 0 || req_value.addNum > defaultValues.equipBagNum) {
            req_value.addNum = 1;
        }
        var paramObj = {
            tempID: req_value.tempId,
            addNum: req_value.addNum
        };
        for (var index in list) {
            var csSeverID = list[index].id;
            pomelo.app.rpc.cs.gmRemote.gmCommands(null, csSeverID, 'allitemdrop', paramObj, utils.done);
        }

        return callback(null, [rsp_result, rsp_value]);
    };
};

/* 修改VIP等级 */
//[cmd]: 10084023
//
//[request]: IDIP_DO_UPDATE_VIP_LEVEL_REQ
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : ,       /* openid */
//     "RoleId" : ,       /* 角色ID */
//     "Value" : ,        /* 修改值：+加-减 */
//     "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//     "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_UPDATE_VIP_LEVEL_RSP
//     "Result" : ,      /* 结果：（0）成功，（其他）失败 */
//     "RetMsg" : ""     /* 返回消息 */
//     "BeginValue" : ,    /* 修改前等级值 */
//     "EndValue" :        /* 当前等级值 */
handler.do_update_vip_level = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK.",
            BeginValue: 0,
            EndValue: 0
        };

        function errorCallback(errorCode, cb) {
            rsp_result.Result = errorCodes[errorCode];
            rsp_result.RetErrMsg = errorCode;

            rsp_value.Result = errorCodes[errorCode];
            rsp_value.RetMsg = errorCode;
            return cb(null, [rsp_result, rsp_value]);
        }

        var openID = req_value.OpenId;
        var roleID = req_value.RoleId;
        var addPointNum = +req_value.Value;
        var serverUid = +req_value.Partition;

        if(roleID == null || openID == null || addPointNum == null) {
            return errorCallback('ParameterNull', callback);
        }

        if(defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_PLAYER) { // ios
            var csServerID = playerManager.GetPlayerCs(roleID);
            if(csServerID) {
                pomelo.app.rpc.cs.csRemote.AddExtraVipPoint(null, csServerID, roleID, addPointNum, function (err, res) {
                    if(res.result != errorCodes.OK) {
                        return errorCallback('ParameterNull', callback);
                    }
                    return callback(null, [rsp_result, rsp_value]);
                });
            } else {
                var roleIDs = [roleID];
                gmSql.SetExtraVipPointIOS(roleIDs, addPointNum, function(err, res) {
                    if(err) {
                        return errorCallback('SystemWrong', callback);
                    }
                    if(res != errorCodes.SystemWrong) {
                        return callback(null, [rsp_result, rsp_value]);
                    } else {
                        return errorCallback('SystemWrong', callback);
                    }
                });
            }
        } else if (defaultValues.paymentZone == gameConst.ePaymentZoneType.PZ_SERVER_UID) { // android
            Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
                .then(function (res) {
                          var accountID = res;
                          if (null == accountID) {
                              return errorCallback('ParameterNull', callback);
                          }
                          var accountIDs = [accountID];
                          return Q.nfcall(gmSql.SetExtraVipPointAndroid, accountIDs, serverUid, addPointNum);
                      })
                .then(function(res) {
                          if(res != errorCodes.SystemWrong) {
                              return callback(null, [rsp_result, rsp_value]);
                          } else {
                              return errorCallback('SystemWrong', callback);
                          }
                      })
                .catch(function(err) {
                           return errorCallback('SystemWrong', callback);
                       });
        } else {
            return errorCallback('SystemWrong', callback);
        }

        /*if(openID != '-1') {
            Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
                .then(function (res) {
                          var accountID = res;
                          if (null == accountID) {
                              rsp_result.Result = errorCodes.ParameterNull;
                              rsp_result.RetErrMsg = "parameter null";

                              rsp_value.Result = errorCodes.ParameterNull;
                              rsp_value.RetMsg = "parameter null";
                              return callback(null, [rsp_result, rsp_value]);
                          }
                          var accountIDs = [accountID];
                          return Q.nfcall(gmSql.SetExtraVipPoint, accountIDs, serverUid, addPointNum);
                })
                .then(function(res) {
                          if(res != errorCodes.SystemWrong) {
                              return callback(null, [rsp_result, rsp_value]);
                          } else {
                              return errorCallback('SystemWrong', callback);
                          }
                })
                .catch(function(err) {
                           return errorCallback('SystemWrong', callback);
                       });
        } else {
            Q.ninvoke(gmSql, 'GetAccountIDsByServerUid', serverUid)
                .then(function (res) {
                          var IDs = res;
                          if (null == IDs || IDs.length == 0) {
                              rsp_result.Result = errorCodes.ParameterNull;
                              rsp_result.RetErrMsg = "parameter null";

                              rsp_value.Result = errorCodes.ParameterNull;
                              rsp_value.RetMsg = "parameter null";
                              return callback(null, [rsp_result, rsp_value]);
                          }
                          var accountIDs = [];
                          for(var index in IDs) {
                              accountIDs.push(IDs[index]['accountID']);
                          }
                          return Q.nfcall(gmSql.SetExtraVipPoint, accountIDs, serverUid, addPointNum);
                      })
                .then(function(res) {
                          if(res != errorCodes.SystemWrong) {
                              return callback(null, [rsp_result, rsp_value]);
                          } else {
                              return errorCallback('SystemWrong', callback);
                          }
                      })
                .catch(function(err) {
                              return errorCallback('SystemWrong', callback);
                      });
        }*/
    };
};

/* 批量修改VIP等级 */

//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "level" : "",      /* 要设置的等级 */
//
//
//     "Result" : ,      /* 结果：（0）成功，（其他）失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.set_all_vip_level = function (req_value) {
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK."
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK."
        };

        var list = pomelo.app.getServersByType('cs');
        if (!list || !list.length) {
            rsp_result.Result = errorCodes.SystemWrong;
            rsp_result.RetErrMsg = 'SystemWrong';

            rsp_value.Result = errorCodes.SystemWrong;
            rsp_value.RetMsg = 'SystemWrong';
            return callback(null, [rsp_result, rsp_value]);
        }
        var paramObj = {
            setVipLv: req_value.level
        };
        for (var index in list) {
            var csSeverID = list[index].id;
            pomelo.app.rpc.cs.gmRemote.gmCommands(null, csSeverID, 'setallviplevel', paramObj, utils.done);
        }

        return callback(null, [rsp_result, rsp_value]);
    };
};
