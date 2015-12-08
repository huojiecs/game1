/**
 * Created by xykong on 2014/7/30.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('./../tools/constValue');
var defaultValues = require('./../tools/defaultValues');
var utilSql = require('./../tools/mysql/utilSql');
var errorCodes = require('./../tools/errorCodes');
var utils = require('./../tools/utils');
var guid = require('./../tools/guid');
var gmSql = require('./../tools/mysql/gmSql');
var csSql = require('./../tools/mysql/csSql');
var util = require('util');
var crypto = require('crypto');
var Q = require('q');
var _ = require('underscore');
var urlencode = require('urlencode');
var serverManager = require('../ls/serverManager');
var config = require('../../app/tools/config');
var globalFunction = require('../tools/globalFunction');

var handler = module.exports = {

};

/* 查询玩家被封信息 */
// [cmd]: 10084003
//
// [request]: IDIP_QUERY_BAN_INFO_REQ
//
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "RoleId" :         /* 角色ID */
//
// [rsponse]: IDIP_QUERY_BAN_INFO_RSP
//
//     "BanTime" : ,        /* 封号时间点 */
//     "Time" : ,           /* 被封时长 */
//     "UnbanTime" : ,      /* 解封时间 */
//     "BanReason" : ""     /* 封号原因 */
handler.query_ban_info = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            BanTime: 0,
            Time: 0,
            UnbanTime: 0,
            BanReason: "BanReason"
        };
        var roleID = +req_value.RoleId;
        var openID = '' + req_value.OpenId;
        if (!roleID || openID.length === 0) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + utils.getFilenameLine();
            return callback(null, [rsp_result, rsp_value]);
        }
        var accountID = +req_value.AccountId;
        Q.nfcall(gmSql.GetAccountUnbanTime, accountID)
            .then(function (res) {
                      if (res == 'null') {
                          rsp_result.Result = errorCodes.ParameterWrong;
                          rsp_result.RetErrMsg = 'the account is not exist' + utils.getFilenameLine();
                          return callback(null, [rsp_result, rsp_value]);
                      }
                      res = JSON.parse(res);
                      rsp_value.BanTime = 'Unknown';
                      rsp_value.Time = 'Unknown';
                      rsp_value.UnbanTime = res.time;
                      rsp_value.BanReason = urlencode(res.reason.toString('utf8'));
                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       rsp_result.Result = errorCodes.SystemWrong;
                       rsp_result.RetErrMsg = utils.getErrorMessage(err);

                       return callback(null, [rsp_result, rsp_value]);
                   }).done();
    }
};

/* 查询玩家角色列表 */
// [cmd]: 10084004
// 
// [request]: IDIP_QUERY_ROLELIST_REQ
// 
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : ""      /* openid */
// 
// [rsponse]: IDIP_QUERY_ROLELIST_RSP
// 
//     "RoleList_count" : ,    /* 角色信息列表的最大数量 */
//     "RoleList" :            /* 角色信息列表 */
//     [
//         {
//             "RoleId" : ,             /* 角色ID */
//             "Level" : ,              /* 角色等级 */
//             "RoleName" : "",         /* 角色名 */
//             "Title" : "",            /* 角色称号 */
//             "DevilNum" : ,           /* 邪神开启数量 */
//             "DevilLevel" : ,         /* 各邪神等级 */
//             "DevilSkillLevel" :      /* 邪神各技能等级 */
//         }
//     ]
handler.query_rolelist = function (req_value, data_packet) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            RoleList_count: 0,
            RoleList: []
        };
        Q.ninvoke(gmSql, 'GetRoleList', req_value.OpenId)
            .then(function (roleList) {

                      var roleGroup = _.groupBy(roleList, function (item) {
                          return item.serverUid;
                      });

                      var jobs = _.map(roleGroup, function (v, k) {

                          data_packet.body.RoleIDList = _.pluck(v, 'roleID');
                          data_packet.command.server = 'psIdip';

//                          var data_packet = {
//                              body: {
//                                  RoleIDList: _.pluck(v, 'roleID')
//                              },
//                              command: {
//                                  "path": "query_rolelist",
//                                  "server": "psIdip"
//                              }
//                          };

                          return Q.ninvoke(pomelo.app.rpc.idip.idipRemote, 'dispatchIdipCluster', null, k, data_packet);
                      });

                      return Q.all(jobs);
                  })
            .then(function (roleInfoList) {
                      rsp_value.RoleList = _.reduce(roleInfoList, function (memo, item) {
                          if (_.isArray(item)) {
                              return memo.concat(item[1].RoleList);
                          }
                          return memo;
                      }, []);
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


handler.query_rolelist_by_serveruid = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            RoleList_count: 0,
            RoleList: []
        };
        Q.ninvoke(gmSql, 'GetRoleListByServerUid', req_value.OpenId, req_value.Partition)
            .then(function (roleList) {

                      var roleGroup = _.groupBy(roleList, function (item) {
                          return item.serverUid;
                      });

                      var jobs = _.map(roleGroup, function (v, k) {
                          var data_packet = {
                              body: {
                                  RoleIDList: _.pluck(v, 'roleID')
                              },
                              command: {
                                  "path": "query_rolelist",
                                  "server": "psIdip"
                              }
                          };

                          return Q.ninvoke(pomelo.app.rpc.idip.idipRemote, 'dispatchIdipCluster', null, k, data_packet);
                      });

                      return Q.all(jobs);
                  })
            .then(function (roleInfoList) {
                      rsp_value.RoleList = _.reduce(roleInfoList, function (memo, item) {
                          if (_.isArray(item)) {
                              return memo.concat(item[1].RoleList);
                          }
                          return memo;
                      }, []);
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

/* 发送滚动公告 */
//[cmd]: 10084018
//
//[request]: IDIP_DO_SEND_ROLLNOTICE_REQ
//    "AreaId" : ,             /* 服务器：微信（1），手Q（2） */
//    "Partition" : ,          /* 分区：INT 服务器Id, 如果填0表示全区 */
//    "PlatId" : ,             /* 平台：IOS（0），安卓（1），全部（2） */
//    "NoticeContent" : "",    /* 公告内容 */
//    "BeginTime" : ,          /* 开始时间 */
//    "EndTime" : ,            /* 结束时间 */
//    "Freq" : ,               /* 滚动频率 */
//    "Speed" : ,              /* 滚动速度 */
//    "Times" : ,              /* 滚动次数限制：0表示不限制次数 */
//    "Source" : ,             /* 渠道号，由前端生成，不需要填写 */
//    "Serial" : ""            /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SEND_ROLLNOTICE_RSP
//    "NoticeId" : ,    /* 公告ID */
//    "Result" : ,      /* 结果 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_rollnotice = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK." + utils.getFilenameLine(),
            NoticeId: 0
        };

        var startTime = +req_value.BeginTime;
        var endTime = +req_value.EndTime;
        var freq = +req_value.Freq;
        var times = +req_value.Times;
        var chatContent = '' + req_value.NoticeContent;
        chatContent = urlencode.decode(chatContent, 'utf8');

        var serverUid = +req_value.Partition;
        var data_packet = {
            body: {
                BeginTime: startTime,
                EndTime: endTime,
                Freq: freq,
                Times: times,
                NoticeContent: chatContent,
                Partition: serverUid
            },
            command: {
                "path": "do_send_rollnotice",
                "server": "chat"
            }
        };

        if (serverUid != 0) {
            pomelo.app.rpc.idip.idipRemote.dispatchIdipCluster(null, serverUid, data_packet, function (err, res) {
                return callback(null, res);
            });
        } else {
            var jobs = _.map(config.gameServerList.list, function (item) {
                var serverUid = item.serverUid;
                return Q.ninvoke(pomelo.app.rpc.idip.idipRemote, 'dispatchIdipCluster', null, serverUid, data_packet);
            });

            Q.allSettled(jobs)
                .then(function (results) {
                          var isError = false;
                          var str = 'rollnotice failed, error list: [ ';
                          for (var item in results) {
                              var result = results[item];
                              if (result['state'] != 'fulfilled' || !(result['value'] && result['value'][0] && result['value'][0].Result == 0)) {
                                  if(result['value'] && result['value'][1]) {
                                      str += '{ Partition: ' + result['value'][1].Partition + ', ';
                                      str += 'ErrMsg: ' + result['value'][1].RetMsg + ' } ';
                                      isError = true;
                                  }
                              }
                              if(result['value'] && result['value'][1] && result['value'][1].NoticeId) {
                                  rsp_value.NoticeId = result['value'][1].NoticeId;
                              }
                          }
                          str += ']';

                          if (isError) {
                              rsp_value.RetMsg = str + utils.getFilenameLine();
                          }
                          return callback(null, [rsp_result, rsp_value]);
                      })
                .catch(function (err) {
                           rsp_result.Result = errorCodes.SystemWrong;
                           rsp_result.RetErrMsg = utils.getErrorMessage(err);

                           return callback(null, [rsp_result, rsp_value]);
                       })
                .done();
        }
    }
};

/* 删除公告 */
//[cmd]: 10084020
//
//[request]: IDIP_DO_DEL_NOTICE_REQ
//    "AreaId" : ,      /* 服务器：微信（1），手Q（2） */
//    "PlatId" : ,      /* 平台：IOS（0），安卓（1），全部（2） */
//    "Type" : ,        /* 公告类型：1 弹窗公告，2滚动公告，3停服通知   */
//    "NoticeId" : ,    /* 公告ID */
//    "Source" : ,      /* 渠道号，由前端生成，不需填写 */
//    "Serial" : ""     /* 流水号，由前端生成，不需填写 */
//
//[rsponse]: IDIP_DO_DEL_NOTICE_RSP
//    "Result" : ,      /* 结果：0 成功，其它失败 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_del_notice = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK." + utils.getFilenameLine()
        };
        var noticeID = +req_value.NoticeId;
        var serverUid = +req_value.Partition;
        var data_packet = {
            body: {
                NoticeId: noticeID
            },
            command: {
                "path": "do_del_notice",
                "server": "chat"
            }
        };

        if (serverUid != 0) {
            pomelo.app.rpc.idip.idipRemote.dispatchIdipCluster(null, serverUid, data_packet, function (err, res) {
                return callback(null, res);
            });
        } else {
            var jobs = _.map(config.gameServerList.list, function (item) {
                var id = item.serverUid;
                return Q.ninvoke(pomelo.app.rpc.idip.idipRemote, 'dispatchIdipCluster', null, id, data_packet);
            });

            Q.allSettled(jobs)
                .then(function (results) {
                          var isError = false;
                          var str = 'delete notice failed, error list: [';
                          for (var item in results) {
                              var result = results[item];
                              if (result['state'] != 'fulfilled' || !(result['value'] && result['value'][0] && result['value'][0].Result == 0)) {
                                  if(result['value'] && result['value'][1]) {
                                      str += '{ Partition: ' + result['value'][1].Partition + ', ';
                                      str += 'ErrMsg: ' + result['value'][1].RetMsg + ' } ';
                                      isError = true;
                                  }
                              }
                          }
                          str += ']';

                          if (isError) {
                              rsp_value.RetMsg = str + utils.getFilenameLine();
                          }
                          return callback(null, [rsp_result, rsp_value]);
                      })
                .catch(function (err) {
                           rsp_result.Result = errorCodes.SystemWrong;
                           rsp_result.RetErrMsg = utils.getErrorMessage(err);

                           return callback(null, [rsp_result, rsp_value]);
                       })
                .done();
        }
    }
};


/* 激活帐号 */
// [cmd]: 10084005
// 
// [request]: IDIP_DO_ACTIVE_USR_REQ
// 
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//     "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
// 
// [rsponse]: IDIP_DO_ACTIVE_USR_RSP
// 
//     "Result" : ,      /* 结果: 0 激活成功；1 帐号曾经激活；其它失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.do_active_usr = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "Not implement." + utils.getFilenameLine()
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "Not implement." + utils.getFilenameLine()
        };

        return callback(null, [rsp_result, rsp_value]);
    }
};

/* 解封 */
// [cmd]: 10084007
// 
// [request]: IDIP_DO_UNBAN_ROLE_REQ
// 
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "OpenId" : "",     /* openid */
//     "RoleId" : ,       /* 角色ID */
//     "Source" : ,       /* 渠道号，由前端生成，不需要填写 */
//     "Serial" : ""      /* 流水号，由前端生成，不需要填写 */
// 
// [rsponse]: IDIP_DO_UNBAN_ROLE_RSP
// 
//     "Result" : ,      /* 结果：（0）成功，（其他）失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.do_unban_role = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK." + utils.getFilenameLine()
        };

        var openID = '' + req_value.OpenId;
        var roleID = +req_value.RoleId;
        if (!openID || !roleID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }
        Q.ninvoke(gmSql, 'GetAccountIDByOpenID', openID)
            .then(function (res) {
                      var accountID = res;
                      if (accountID <= 0) {
                          return Q.reject();
                      }
                      var dateStr = utilSql.DateToString(new Date());
                      return Q.nfcall(gmSql.SetAccountCanLoginTime, accountID, dateStr);
                  })
            .then(function (res) {
                      rsp_result.Result = errorCodes.OK;
                      rsp_result.RetErrMsg = 'OK.' + utils.getFilenameLine();

                      rsp_value.Result = errorCodes.OK;
                      rsp_value.RetMsg = 'OK.' + utils.getFilenameLine();

                      return callback(null, [rsp_result, rsp_value]);
                  })
            .catch(function (err) {
                       if (_.isArray(err)) {
                           return callback(null, err);
                       }

                       rsp_result.Result = errorCodes.ParameterWrong;
                       rsp_result.RetErrMsg = 'ParameterWrong' + utils.getFilenameLine();

                       return callback(null, [rsp_result, rsp_value]);
                   }).done();
    }
};

/* 兑换码生成 */
//
// [request]: IDIP_DO_ACTIVE_USR_REQ
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "giftID" : ,       /* 兑奖码对应的礼包ID */
//     "codeNum" : ,      /* 兑奖码对应的条数*/
//     "endDay" : ,       /* 注册码过期天数 */
//     "frequency" : ,  /* 注册码使用次数 */
//
// [rsponse]: IDIP_DO_ACTIVE_USR_RSP
//
//     "Result" : ,      /* 结果: 0 成功；1 失败 */
//     "RetMsg" : ""     /* 返回消息 */
handler.add_gift_code = function (req_value) {
    var deferred = Q.defer();
    var GetCodeSqlStr = function (giftCodeInfo) {  //数据库保存sql
        var strInfo = '(';
        for (var t in giftCodeInfo) {
            if (t < giftCodeInfo.length - 1) {
                if (typeof (giftCodeInfo[t]) == 'string') {
                    strInfo += '\'' + giftCodeInfo[t] + '\',';
                } else {
                    strInfo += giftCodeInfo[t] + ',';
                }
            } else {
                strInfo += giftCodeInfo[t] + ')';
            }
        }
        var sqlString = utilSql.BuildSqlValues(new Array(giftCodeInfo));
        if (sqlString !== strInfo) {
            logger.error('sqlString not equal:\n%j\n%j', sqlString, strInfo);
        }
        return sqlString;
    };
    /**
     *生成12位随机兑奖码（不保证兑奖码重复）
     * */
    var GetGiftCodeID = function () {
        var cdkey = '';
        while (true) {
            cdkey = crypto.randomBytes(6).toString('hex');
            if (cdkey.search(/[150isol]/) != -1) {
                continue;
            }
            return cdkey;
        }
    };

    /**
     *每次存储100 个
     * */
    var GiftBalanceToDB = function (baoXiangID, codeNum, endDay, frequency, callback) {
        var self = this;
        var deferred = Q.defer();
        /** 每次存100个，返回来后 再进行第二次存储 减少数据库连接压力*/
        return Q.until(function () {
            var jobs = [];
            codeNum = codeNum - 100;
            for (var i = 0; i < 100; i++) {
                var codeID = GetGiftCodeID();
                var giftCodeInfo = {
                    giftCodeID: codeID,
                    giftID: baoXiangID,
                    createDate: utilSql.DateToString(new Date()),
                    endDate: utilSql.DateToString(utils.DateAddDays(new Date(), endDay)),
                    frequency: frequency
                };
                var giftCodeSql = GetCodeSqlStr(_.values(giftCodeInfo));
                var giftCodeID = '"' + giftCodeInfo.giftCodeID + '"';
                jobs.push(
                    Q.ninvoke(csSql, 'SaveGiftCode', giftCodeID, giftCodeSql)
                );
            }
            return Q.all(jobs)
                .then(function () {
                          var flag = codeNum <= 0;
                          if (flag) {
                              callback();
                              return true;
                          }
                          return flag;
                      })
                .catch(function (err) {
                           logger.error("GiftBalanceToDB failed: %s",
                                        utils.getErrorMessage(err));
                           callback(err);
                           return false;
                       });
        });

        return deferred.promise;
    };
    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK." + utils.getFilenameLine()
        };
        var giftID = req_value.giftID;
        var codeNum = req_value.codeNum || 100;
        var endDay = req_value.endDay || 30;
        var frequency = req_value.frequency || 1;
        if (!giftID) {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }
        if (codeNum > 200000) {
            codeNum = 200000;
        }
        if (codeNum < 100) {
            codeNum = 100;
        }
        try {
            GiftBalanceToDB(giftID, codeNum, endDay, frequency, function (err) {
                if (err) {
                    rsp_result.Result = errorCodes.SystemWrong;
                    rsp_result.RetErrMsg = 'SystemWrong' + utils.getFilenameLine();
                    rsp_value.Result = errorCodes.SystemWrong;
                    rsp_value.RetMsg = 'SystemWrong' + utils.getFilenameLine();
                    return callback(null, [rsp_result, rsp_value]);
                }
                return callback(null, [rsp_result, rsp_value]);
            });
        }
        catch (err) {
            logger.error(util.inspect(err));

            rsp_result.Result = errorCodes.SystemWrong;
            rsp_result.RetErrMsg = 'GiftBalanceToDB failed' + utils.getFilenameLine();
            rsp_value.Result = errorCodes.SystemWrong;
            rsp_value.RetMsg = 'GiftBalanceToDB failed' + utils.getFilenameLine();
            return callback(null, [rsp_result, rsp_value]);
        }
    }
};

/* 角色名查询帐号信息 */
// [cmd]: 10084024
//
// [request]: IDIP_QUERY_ACCINFO_BY_ROLENAME_REQ
//
//     "AreaId" : ,       /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,    /* 分区：INT 服务器Id, 如果填0表示全区 */
//     "PlatId" : ,       /* 平台：IOS（0），安卓（1），全部（2） */
//     "RoleName" : ""      /* 角色名 */
//
// [rsponse]: IDIP_QUERY_ACCINFO_BY_ROLENAME_RSP
//
//     "RoleName" : "",    /* 角色名 */
//     "AreaId" : ,        /* 服务器：微信（1），手Q（2） */
//     "Partition" : ,     /* 小区 */
//     "PlatId" : ,        /* 平台：IOS（0），安卓（1）,全部（2） */
//     "OpenId" : "",      /* openid */
//     "RoleId" : ""       /* 角色ID */
//
handler.query_accinfo_by_rolename = function (req_value) {

    return function (callback) {
        var roleName = urlencode.decode(req_value.RoleName, 'utf8');
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };
        var rsp_value = {
            RoleName: urlencode(roleName.toString('utf8')),
            RoleId: 0,
            Partition: 0,
            PlatId: +req_value.PlatId,
            AreaId: +req_value.AreaId,
            OpenId: ""
        };
        if (roleName == null || roleName == "") {
            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = "ParameterWrong" + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }
        gmSql.GetRoleInfoByName(roleName, function (err, res) {
            if (err) {
                rsp_result.Result = errorCodes.ParameterWrong;
                rsp_result.RetErrMsg = "ParameterWrong" + utils.getFilenameLine();

                return callback(null, [rsp_result, rsp_value]);
            }
            if (res == null) {
                rsp_result.Result = errorCodes.NoRole;
                rsp_result.RetErrMsg = "NoRole" + utils.getFilenameLine();

                return callback(null, [rsp_result, rsp_value]);
            }
            rsp_value.RoleId = res.roleID;
            rsp_value.Partition = res.serverUid;
            rsp_value.OpenId = res.openID;
            return callback(null, [rsp_result, rsp_value]);
        });
    }
};

/* 全服邮件 */
//[cmd]: 10084022
//
//[request]: IDIP_DO_SEND_MAIL_ALL_REQ
//   "AreaId" : ,                   /* 服务器：微信（1），手Q（2） */
//   "Partition" : ,                /* 小区 */
//   "PlatId" : ,                   /* 平台：IOS（0），安卓（1）,全部（2） */
//   "MailTitle" : "",              /* 邮件标题 */
//   "MailContent" : "",            /* 邮件内容 */
//   "AllMailItemList_count" : ,    /* 道具列表的最大数量 */
//   "AllMailItemList" :            /* 道具列表 */
//   [
//       {
//          "ItemId" : ,     /* 物品ID */
//          "ItemNum" :      /* 物品数量 */
//       }
//   ],
//   "Star" : ,                     /* 装备星级：0表示随机 */
//   "Source" : ,                   /* 渠道号，由前端生成，不需要填写 */
//   "Serial" : ""                  /* 流水号，由前端生成，不需要填写 */
//
//[rsponse]: IDIP_DO_SEND_MAIL_ALL_RSP
//    "Result" : ,      /* 结果（0）成功 */
//    "RetMsg" : ""     /* 返回消息 */
handler.do_send_mail_all = function (req_value) {

    return function (callback) {
        var rsp_result = {
            Result: errorCodes.OK,
            RetErrMsg: "OK." + utils.getFilenameLine()
        };

        var rsp_value = {
            Result: errorCodes.OK,
            RetMsg: "OK." + utils.getFilenameLine()
        };

        var mailTitle = urlencode.decode('' + req_value.MailTitle, 'utf8');
        var mailContent = urlencode.decode('' + req_value.MailContent, 'utf8');
        var mailItemCount = +req_value.AllMailItemList_count;
        var mailItemList = req_value.AllMailItemList;
        var serverUid = +req_value.Partition;

        var errorString;

        if (_.isString(mailItemList)) {
            mailItemList = utils.strToArray(mailItemList, ['ItemId', 'ItemNum']);
        }

        if (mailTitle.length === 0 || mailContent.length === 0) {

            errorString = util.format(' MailItemList_count: %j, mailItemList: %j, mailTitle.length: %j, roleID: %j',
                !_.isNumber(req_value.MailItemList_count), !mailItemList, !mailTitle.length,
                !mailContent.length);

            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }

        if (!!mailItemCount && (!_.isArray(mailItemList) || mailItemList.length != mailItemCount)) {

            errorString = util.format(' AllMailItemList_count: %j, mailItemList: %j', !mailItemCount, mailItemList);

            rsp_result.Result = errorCodes.ParameterWrong;
            rsp_result.RetErrMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            rsp_value.Result = errorCodes.ParameterWrong;
            rsp_value.RetMsg = 'ParameterWrong' + errorString + utils.getFilenameLine();

            return callback(null, [rsp_result, rsp_value]);
        }



        var data_packet = {
            body: {
                MailTitle: mailTitle,
                MailContent: mailContent,
                AllMailItemList_count: mailItemCount,
                AllMailItemList: mailItemList,
                Partition: serverUid
            },
            command: {
                "path": "do_send_mail_all",
                "server": "ms"
            }
        };

        if (serverUid != 0) {
            var sid = globalFunction.GetUseServerUId(data_packet.body.Partition);      //做合服后的serverUid兼容
            pomelo.app.rpc.idip.idipRemote.dispatchIdipCluster(null, sid, data_packet, function (err, res) {
                return callback(null, res);
            });
        } else {
            var jobs = _.map(config.gameServerList.list, function (item) {
                var serverUid = item.serverUid;
                var sid = globalFunction.GetUseServerUId(item.serverUid);
                data_packet.body.Partition = serverUid;
                var data_packet_ex = JSON.parse(JSON.stringify(data_packet));
                return Q.ninvoke(pomelo.app.rpc.idip.idipRemote, 'dispatchIdipCluster', null, sid, data_packet_ex);
            });

            Q.allSettled(jobs)
                .then(function (results) {
                    var isError = false;
                    var str = 'a part failed, error list: [ ';
                    for (var item in results) {
                        var result = results[item];
                        if (result['state'] != 'fulfilled' || !(result['value'] && result['value'][0] && result['value'][0].Result == 0)) {
                            if(result['value'] && result['value'][1]) {
                                str += '{ Partition: ' + result['value'][1].Partition + ', ';
                                str += 'ErrMsg: ' + result['value'][1].RetMsg + ' } ';
                                isError = true;
                            }
                        }
                    }
                    str += ']';

                    if (isError) {
                        rsp_value.RetMsg = str + utils.getFilenameLine();
                    }
                    return callback(null, [rsp_result, rsp_value]);
                })
                .catch(function (err) {
                    rsp_result.Result = errorCodes.SystemWrong;
                    rsp_result.RetErrMsg = utils.getErrorMessage(err);

                    return callback(null, [rsp_result, rsp_value]);
                })
                .done();
        }
    }
};
