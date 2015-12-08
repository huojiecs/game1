/**
 * Created by Administrator on 14-10-8.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');
var Q = require('q');
var _ = require('underscore');
var async = require('async');
var constValue = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var config = require('../../tools/config');
var utilSql = require('../../tools/mysql/utilSql');
var gameConst = require('../../tools/constValue');
var unionManager = require('./unionManager');
var redisManager = require('../../us/chartRedis/redisManager');
var playerManager = require('../../us/player/playerManager');
module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.players = [];
    this.loginTime = Date.now();
};
var handler = Handler.prototype;

// 得到公会列表
handler.GetUnionList = function (refurbishUnions, playerApplyInfo, callback) {
    var self = this;
    if (null == refurbishUnions || 0 == refurbishUnions.length) {
        return  callback({result: errorCodes.NoUnion});
    }
    var appNum = playerApplyInfo ? playerApplyInfo.length : 0;

    var msg = {
        result: 0,
        applyNum: appNum == 0 ? 10 : 10 - appNum
    };
    var bossIDs = self.GetBossIDList(refurbishUnions);
    if (null == bossIDs || 0 == bossIDs.length) {
        return  callback({result: errorCodes.RoleNoUnion});
    }
    async.each(refurbishUnions, function (refurbishUnion, eachCallback) {
            var roleID = refurbishUnion['bossID'];
            self.GetPlayerInfo(roleID, function (err, details, csID) {
                if (!!err) {
                    logger.error('error when GetUnionList for union file, %j', details,
                        utils.getErrorMessage(err));
                    return eachCallback();
                }
                if (!details) {
                    logger.warn('warn when GetUnionList for union file,roleID=%j,details=%j', roleID,
                        details);
                    return eachCallback();
                }
                if (!details) {
                    logger.warn('us get player info failed, refurbishUnion: %j, roleID: %j', refurbishUnion,
                        roleID);
                    return eachCallback();
                }
                refurbishUnion['bossName'] = details.name ? details.name : '';
                refurbishUnion['bossLevel'] = details.expLevel ? details.expLevel : 0;
                refurbishUnion['bossVipLevel'] = details.VipLevel ? details.VipLevel : 0;
                var unionID = refurbishUnion['unionID'];
                if (!playerApplyInfo) {
                    refurbishUnion['state'] = 0;
                } else {
                    refurbishUnion['state'] = _.contains(playerApplyInfo, unionID) ? 1 : 0;
                }
                return eachCallback();
            });
        },
        function (err) {
            if (!!err) {
                logger.error('error when GetUnionList for union file, %s',
                    utils.getErrorMessage(err));
            }
//                   msg['unionList'] = refurbishUnions;
            msg['unionList'] = _.sample(refurbishUnions, 5);
            return callback(msg);
        });
}

handler.convertArrayToJson = function(arrayInfo, eInfo){
    var jsonInfo = {};
    if (null == arrayInfo) {
        return errorCodes.ParameterNull;
    }
    for (var i in eInfo) {
        if (i != 'MAX') {
            jsonInfo[i] = arrayInfo[eInfo[i]];
        }
    }
    return jsonInfo;
};

handler.convertJsonToArray = function(jsonInfo, eInfo){
    var arrayInfo = new Array(eInfo.MAX);
    for(var info in eInfo){
        if(eInfo[info] != eInfo.MAX){
            arrayInfo[eInfo[info]] = 0;
        }
    }
    for (var i in eInfo) {
        if (i != 'MAX') {
            arrayInfo[eInfo[i]] = jsonInfo[i];
        }
    }
    return arrayInfo;
}

handler.GetPlayerUnionInfo = function (roleID, unionList, unionMemberList, unionApplyNum, callback) {
    var self = this;
    if (!roleID || !unionList || !unionMemberList) {
        return   callback({result: errorCodes.ParameterWrong});
    }
    var msg = {
        result: errorCodes.OK
    };
    var unionID = self.GetPlayerUnionID(roleID, unionMemberList);
    if (0 == unionID) {
        return  callback({result: errorCodes.NoUnion});
    } else if (errorCodes.ParameterWrong == unionID) {
        return callback({result: errorCodes.ParameterWrong});
    }
    var unionInfo = self.GetUnionInfo(unionID, unionList);
    if (!unionInfo) {
        return callback({result: errorCodes.NoUnion});
    }
    var unionMembers = self.GetUnionMemberList(unionID, unionMemberList);
//    var shortMembers = self.GetMemberFristArray(unionMembers);
    var thisMember = unionMemberList[roleID];
    self.GetUnionRanking(unionID, function (ranking) {
        msg['unionID'] = unionID;
        msg['unionLevel'] = unionInfo.unionLevel;
        msg['unionName'] = unionInfo.unionName;
        msg['unionWeiWang'] = unionInfo.unionWeiWang;
        if (null != ranking) {
            unionInfo.unionRanking = ranking + 1;
        }
        msg['unionRanking'] = unionInfo.unionRanking;
        msg['unionZhanLi'] = 0;
        msg['unionScore'] = unionInfo.unionScore;
        msg['scoreRank'] = unionInfo.scoreRank;
        msg['ouccHel'] = unionInfo.ouccHel;
        msg['isRegister'] = unionInfo.isRegister;
        msg['isDuke'] = unionInfo.isDuke;
        msg['unionApplyNum'] = unionApplyNum;
        msg['announcement'] = unionInfo.announcement;
        msg['memberNum'] = unionMembers.length;
        msg['unionRole'] = thisMember ? thisMember.unionRole : 0;
        msg['robBoos'] = 0;
        msg['isLog'] = unionManager.HasNewLog(roleID);
        var bossID = unionInfo.bossID;
        self.GetPlayerInfo(bossID, function (err, details, csID) {
            if (!!err) {
                logger.error('error when GetPlayerUnionInfo for union file, %s',
                             utils.getErrorMessage(err));
            }
            if (!details) {
                logger.warn('warn when GetPlayerUnionInfo for union file,roleID=%j,details=%j', roleID,
                            details);
            }
            if (!csID && !!details) {
                var date = self.GetOnlineTime(details.LoginTime);
                if (date > 7 && date <= 14) {
                    if (2 == msg['unionRole']) {
                        msg['robBoos'] = 1;
                    }
                } else if (date > 14) {
                    msg['robBoos'] = 1;
                }
            }
//        var memberListPage = _.first(shortMembers, 9);
            var memberListPage = unionMembers;
            async.each(memberListPage, function (unionMember, eachCallback) {
                    if(unionMember == null){
                        logger.warn('unionMember is null why ?');
                        return eachCallback();
                    }
                    var roleID = unionMember['roleID'];
                    self.GetPlayerInfo(roleID, function (err, details, csID) {
                        if (!!err) {
                            logger.error('error when GetPlayerUnionInfo for union file, %s',
                                utils.getErrorMessage(err));
                            return eachCallback();
                        }
                        if (!details) {
                            logger.warn('warn when GetPlayerUnionInfo for union file,roleID=%j,details=%j',
                                roleID,
                                details);
                            return eachCallback();
                        }
                        unionMember['roleName'] = details.name ? details.name : '';
                        unionMember['openID'] = details.openID;
                        unionMember['picture'] = details.picture;
                        unionMember['playerLevel'] = details.expLevel ? details.expLevel : 0;
                        unionMember['vipLevel'] = details.VipLevel ? details.VipLevel : 0;
                        unionMember['playerZhanli'] = details.zhanli ? details.zhanli : 0;
                        if (!!csID) {
                            unionMember['onlineTime'] = 0;
                        } else {
                            unionMember['onlineTime'] = self.GetOnlineTimeDetails(details.LoginTime);
                        }
                        msg['unionZhanLi'] += unionMember['playerZhanli'];
                        return eachCallback();
                    });
                },
                function (err) {
                    if (!!err) {
                        logger.error('error when GetPlayerUnionInfo for union file, %s',
                            utils.getErrorMessage(err));
                    }
                    var memberListPageSort = self.GetMemberSortArray(memberListPage);
                    msg['memberList'] = _.first(memberListPageSort, 6);
                    unionInfo.unionZhanLi =
                            msg['unionZhanLi'] < defaultValues.UnionMaxZhanLi ? msg['unionZhanLi'] :
                        defaultValues.UnionMaxZhanLi;
                    self.UpdateUnionRedisInfo(unionID, unionInfo);
                    self.UpdateUnionScoreRedisInfo(unionID, unionInfo);
                    return callback(msg);
                });
        });
    });
};

handler.GetPlayerUnionID = function (roleID, unionMemberList) {
    var unionID = null;
    var member = unionMemberList[roleID];
    if (!!member) {
        unionID = member.unionID;
    }
    return unionID;
};


handler.GetUnionMemberList = function (unionID, unionMemberList) {
    var memberList = [];
    if (!unionID || !unionMemberList) {
        return errorCodes.ParameterWrong;
    }
    for (var u in unionMemberList) {
        var member = unionMemberList[u];
        member['openID'] = "default-openid";
        member['playerLevel'] = 0;
        member['roleName'] = '';
        member['playerZhanli'] = 0;
        member['onlineTime'] = 0;
        member['vipLevel'] = 0;
        if (unionID == member.unionID) {
            memberList.push(member);
        }
    }
    return memberList;
};

handler.GetUnionInfo = function (unionID, unionList) {
    var union = null;
    if (!unionID || !unionList) {
        return errorCodes.ParameterWrong;
    }
    var uTop = unionList[unionID];
    if (!!uTop) {
        union = uTop
    }
    return union;
};
handler.GetPlayerInfo = function (roleID, callback) {
    var self = this;
    var client = redisManager.getClient(gameConst.eRedisClientType.Chart);
    client.hGet(redisManager.getRoleInfoOpenIDByServerUid(config.list.serverUid), roleID, function (err, info) {
        var roleInfo = JSON.parse(info) || {};
        client.hGet(redisManager.getRoleDetailSetNameByServerUid(config.list.serverUid), roleID,  function (err, data) {
            if (!!err || null == data || null == roleInfo) {
//                        logger.error("get across player detail: %d, %s, %j", roleID,
//                                     utils.getErrorMessage(err), data);
                pomelo.app.rpc.ps.psRemote.GetPlayerDetails(null, roleID, function (rpcErr, details, csID) {
                    if (!!rpcErr) {
                        logger.error("get across player detail: %d, %s, %j", roleID,
                            utils.getErrorMessage(rpcErr), details);
                        return callback(rpcErr);
                    }
                    var openID = roleInfo.openID ? roleInfo.openID : "default-openid";
                    var picture = !!roleInfo.wxPicture ? roleInfo.wxPicture : '';
                    details['openID'] = openID;
                    details['picture'] = picture;
                    return  callback(null, details, csID);
                });
            } else {
                data = JSON.parse(data);
                var playerInfo = data[1];
//                    var roleID = playerInfo[gameConst.ePlayerInfo.ROLEID];
                var tempID = playerInfo[gameConst.ePlayerInfo.TEMPID];
                var roleName = roleInfo.name ? roleInfo.name : playerInfo[gameConst.ePlayerInfo.NAME];
                var expLevel = roleInfo.expLevel ? roleInfo.expLevel :
                    playerInfo[gameConst.ePlayerInfo.ExpLevel];
                var zhanLi = roleInfo.zhanli ? roleInfo.zhanli : playerInfo[gameConst.ePlayerInfo.ZHANLI];
                var vipLevel = roleInfo.vipLevel ? roleInfo.vipLevel :
                    playerInfo[gameConst.ePlayerInfo.VipLevel];
                var loginTime = playerInfo[gameConst.ePlayerInfo.LoginTime];
                var openID = roleInfo.openID ? roleInfo.openID : "default-openid";
                var picture = !!roleInfo.wxPicture ? roleInfo.wxPicture : '';
                var details = {
                    roleID: roleID,
                    name: roleName,
                    tempID: tempID,
                    expLevel: expLevel,
                    zhanli: zhanLi,
                    VipLevel: vipLevel,
                    LoginTime: loginTime,
                    openID: openID,
                    picture: picture
                };
                var player = playerManager.GetPlayer(roleID);
                var csID = null;
                if (null != player) {
                    csID = player.GetPlayerCs();
                }
                return  callback(null, details, csID);
            }
        });
    });
};


handler.GetBossIDList = function (refurbishUnions) {
    var bossIDList = [];
    for (var i in refurbishUnions) {
        bossIDList.push(refurbishUnions[i]['bossID']);
    }
    return bossIDList;
};

// 同步接口
handler.SetPlayerUnionInfo = function (csID, roleID, unionID, unionName, unionLevel, callback) {
    if (null == unionID || null == unionName) {
        return errorCodes.ParameterNull;
    }

    pomelo.app.rpc.cs.csRemote.SetPlayerUnionInfo(null, csID, roleID, unionID, unionName, unionLevel, function (err) {
        pomelo.app.rpc.rs.rsRemote.ChangePlayerUnionID(null, roleID, unionID, unionName, function(err){
            return callback(null, unionID);
        });
    });
};


handler.unionMemberPaging = function (roleID, begenID, unionMemberList, callback) {
    var self = this;
    if (!roleID || !unionMemberList) {
        return  callback({result: errorCodes.ParameterWrong});
    }
    var msg = {
        result: errorCodes.OK
    };
    var unionID = self.GetPlayerUnionID(roleID, unionMemberList);
    if (0 == unionID) {
        return  callback({result: errorCodes.NoUnion});
    } else if (errorCodes.ParameterWrong == unionID) {
        return callback({result: errorCodes.ParameterWrong});
    }
    var unionMembers = self.GetUnionMemberList(unionID, unionMemberList);
//    var shortMembers = self.GetMemberFristArray(unionMembers);
//    var memberListPage = begenID >= 0 ? unionMembers.slice(begenID, begenID + 9) :
//                         unionMembers.slice(0, 9);
    var memberListPage = unionMembers;

    msg['begenID'] = begenID;
    msg['memberNum'] = unionMembers.length;
    async.each(memberListPage, function (unionMember, eachCallback) {
            if(unionMember == null){
                logger.warn('unionMember is null why ?');
                return eachCallback();
            }
            var roleID = unionMember['roleID'];
            self.GetPlayerInfo(roleID, function (err, details, csID) {
                if (!!err) {
                    logger.error('error when unionMemberPaging for union file, %s',
                        utils.getErrorMessage(err));
                    return eachCallback();
                }
                if (!details) {
                    logger.warn('warn when unionMemberPaging for union file,roleID=%j,details=%j', roleID,
                        details);
                    return eachCallback();
                }
                unionMember['roleName'] = details.name ? details.name : '';
                unionMember['openID'] = details.openID;
                unionMember['picture'] = details.picture;
                unionMember['playerLevel'] = details.expLevel ? details.expLevel : 0;
                unionMember['vipLevel'] = details.VipLevel ? details.VipLevel : 0;
                unionMember['playerZhanli'] = details.zhanli ? details.zhanli : 0;
                if (!!csID) {
                    unionMember['onlineTime'] = 0;
                } else {
                    unionMember['onlineTime'] = self.GetOnlineTimeDetails(details.LoginTime);
                }
                return eachCallback();
            });
        },
        function (err) {
            if (!!err) {
                logger.error('error when GetPlayerUnionInfo for union file, %s',
                    utils.getErrorMessage(err));
            }
            var memberListPageSort = self.GetMemberSortArray(memberListPage);
            var memberPageSort = begenID >= 0 ? memberListPageSort.slice(begenID, begenID + 6) :
                memberListPageSort.slice(0, 6);
//                   msg['memberList'] = _.first(memberListPageSort, 6);
            msg['memberList'] = memberPageSort;
            return  callback(msg);
        });
};

handler.getUnionApplyInfoList = function (begenID, applyInfoList, callback) {
    var self = this;
    var msg = {
        result: 0,
        applylist: [],
        begenID: begenID,
        applyListNum: applyInfoList.length
    }
    var applyInfoListPage = begenID >= 0 ? applyInfoList.slice(begenID, begenID + 5) :
                            applyInfoList.slice(0, 5);
    async.each(applyInfoListPage, function (roleID, eachCallback) {
            self.GetPlayerInfo(roleID, function (err, details, csID) {
                if (!!err) {
                    logger.error('error when GetPlayerUnionInfo for union file, %s', details.roleID,
                        utils.getErrorMessage(err));
                    return eachCallback();
                }
                if (!details) {
                    logger.warn('warn when getUnionApplyInfoList for union file,roleID=%j,details=%j', roleID,
                        details);
                    return eachCallback();
                }
                var applyMember = {};
                applyMember['openID'] = details.openID;
                applyMember['picture'] = details.picture;
                applyMember['roleID'] = roleID;
                applyMember['roleName'] = details.name ? details.name : '';
                applyMember['roleLevel'] = details.expLevel ? details.expLevel : 0;
                applyMember['roleVIP'] = details.VipLevel ? details.VipLevel : 0;
                applyMember['roleZhanli'] = details.zhanli ? details.zhanli : 0;
                msg.applylist.push(applyMember);
                return eachCallback();
            });
        },
        function (err) {
            if (!!err) {
                logger.error('error when GetPlayerUnionInfo for union file, %s',
                    utils.getErrorMessage(err));
            }
            return callback(msg);
        });
};
handler.GetOnlineTime = function (loginTime) {
    var day = 24 * 60 * 60 * 1000;
    var time = new Date() - new Date(loginTime);
    var onLineTime = Math.floor(time / day) + 1;
    return onLineTime;
};
handler.GetOnlineTimeDetails = function (loginTime) {
    /*   5分钟前在线：0-60分钟内登陆过 0
     1小时前在线：60-120分钟内登陆过 1
     2小时前在线：2-10小时内登陆过  2
     10小时前在线：10-24小时内登陆过 3
     24小时前在线：24-72小时内登陆过 4
     3天前在线：3-7天内登陆过  5
     7天前在线：7天前登陆过  6*/
    var timeState = 0;
    var min = 60 * 1000;
    var time = new Date() - new Date(loginTime);
    var onLineTime = Math.floor(time / min);
    if (onLineTime <= 60 && onLineTime > 0) {
        timeState = 1;
    } else if (onLineTime <= 120) {
        timeState = 2;
    } else if (onLineTime <= 600) {
        timeState = 3;
    } else if (onLineTime <= 1440) {
        timeState = 4;
    } else if (onLineTime <= 4320) {
        timeState = 5;
    } else if (onLineTime <= 10080) {
        timeState = 6;
    } else {
        timeState = 7;
    }
    return timeState;
};
handler.GetMemberFristArray = function (unionMembers) {
    for (var i in unionMembers) {
        var member = unionMembers[i];
        if (2 == member.unionRole) {
            unionMembers.splice(+i, 1);
            unionMembers.unshift(member);
        }
    }
    for (var j in unionMembers) {
        var member = unionMembers[j];
        if (1 == member.unionRole) {
            unionMembers.splice(+j, 1);
            unionMembers.unshift(member);
        }
    }
    return unionMembers;
};
handler.GetMemberSortArray = function (members) {
    var temp = null;
    for (var si = members.length - 1; si > 0; --si) {
        for (var sj = 0; sj < si; ++sj) {
            var nsj = sj + 1;
            var sj_unionTop = members[nsj];
            var sj_unionEnd = members[sj];
            var TopNum = sj_unionTop['playerLevel'] * 10000000 + sj_unionTop['playerZhanli'];
            var EndNum = sj_unionEnd['playerLevel'] * 10000000 + sj_unionEnd['playerZhanli'];
            if (TopNum > EndNum) {
                temp = members[sj];
                members[sj] = members[sj + 1];
                members[sj + 1] = temp;
            }
        }
    }
    for (var i in members) {
        var member = members[i];
        if (2 == member.unionRole) {
            members.splice(+i, 1);
            members.unshift(member);
        }
    }
    for (var j in members) {
        var member = members[j];
        if (1 == member.unionRole) {
            members.splice(+j, 1);
            members.unshift(member);
        }
    }
    return members;
};
/**
 * 更改 工会redis 信息
 */
handler.GetUnionRanking = function (unionID, callback) {
    var self = this;
    if (null == unionID) {
        callback(null);
    }
    var client = redisManager.getClient(gameConst.eRedisClientType.Chart);
    var key = unionID;
    client.zRevRank(redisManager.getUnionChartServerUid(config.list.serverUid), key, function (err, info) {
        if (!!err) {
            logger.warn("update union redis info: %d, %s, %j", key, utils.getErrorMessage(err), info);
            callback(null);
        }
        callback(info);
    });

};


handler.UpdateUnionRedisInfo = function (unionID, union) {
    var self = this;
    if (null == unionID || null == union) {
        return;
    }
    var client = redisManager.getClient(gameConst.eRedisClientType.Chart);
    var key = unionID;
    var value = JSON.stringify(union);
    client.hSet(redisManager.getUnionInfoServerUid(config.list.serverUid), key, value, function (err, info) {
        if (!!err) {
            logger.warn("update union redis info: %d, %s, %j", key, utils.getErrorMessage(err), info);
            return;
        }
        var unionLeve = union['unionLevel'];
        var unionZhanLi = union['unionZhanLi'];
        var Score = unionLeve * 100000000 + unionZhanLi;
        client.zUAdd(redisManager.getUnionChartServerUid(config.list.serverUid), key, Score,function (chartErr, chartInfo) {
            if (!!chartErr) {
                logger.warn("update union redis info: %d, %s, %j", key, utils.getErrorMessage(chartErr),
                    chartInfo);
                return;
            }
        });
    });

};

// 公会积分排行
handler.UpdateUnionScoreRedisInfo = function (unionID, union) {
    var self = this;
    if (null == unionID || null == union) {
        return;
    }
    var client = redisManager.getClient(gameConst.eRedisClientType.Chart);
    var key = unionID;
    var value = JSON.stringify(union);
    client.hSet(redisManager.getUnionInfoServerUid(config.list.serverUid), key, value, function (err, info) {
        if (!!err) {
            logger.warn("update union redis info: %d, %s, %j", key, utils.getErrorMessage(err), info);
            return;
        }
        var unionLeve = union['unionLevel'];
        var unionScore = union['unionScore'];
        var Score =  unionScore * 100 + unionLeve;

        client.zUAdd(redisManager.getUnionScoreServerUid(config.list.serverUid), key, Score,function (chartErr, chartInfo) {
            if (!!chartErr) {
                logger.warn("update union redis info: %d, %s, %j", key, utils.getErrorMessage(chartErr),
                    chartInfo);
                return;
            }
        });
    });

};

handler.DeleteUnionRedisInfo = function (unionID) {
    var self = this;
    if (null == unionID) {
        return;
    }
    var client = redisManager.getClient(gameConst.eRedisClientType.Chart);
    client.zRem(redisManager.getUnionChartServerUid(config.list.serverUid), unionID, function (err, info) {
        if (!!err) {
            logger.warn("update union redis info: %d, %s, %j", unionID, utils.getErrorMessage(err), info);
            return;
        }
        client.hDel(redisManager.getUnionInfoServerUid(config.list.serverUid), unionID, function (chartErr, chartInfo) {
            if (!!chartErr) {
                logger.warn("update union redis info: %d, %s, %j", key, utils.getErrorMessage(chartErr),
                    chartInfo);
                return;
            }
        });
    });
};

