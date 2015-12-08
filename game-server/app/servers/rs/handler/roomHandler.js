/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-28
 * Time: 上午10:31
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var async = require('async');
var gameConst = require('../../../tools/constValue');
var utils = require('../../../tools/utils');
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var teamManager = require('../../../rs/team/teamManager');
var occupantManager = require('../../../rs/occupant/occupantManager');
var playerManager = require('../../../rs/player/playerManager');
var rsSql = require('../../../tools/mysql/rsSql');
var csSql = require('../../../tools/mysql/csSql');
var globalFunction = require('../../../tools/globalFunction');
var eTeamState = gameConst.eTeamState;
var eTeamInfo = gameConst.eTeamInfo;
var ePlayerTeamInfo = gameConst.ePlayerTeamInfo;
var ePlayerTeamState = gameConst.ePlayerTeamState;
var ePlayerInfo = gameConst.ePlayerInfo;

var eMarryInfo = gameConst.eMarryInfo;
var tCustomTemp = templateConst.tCustom;

var errorCodes = require('../../../tools/errorCodes');
var defaultValues = require('../../../tools/defaultValues');
var weddingManager = require('../../../rs/marry/weddingManager');
var _ = require('underscore');
var Q = require('q');


module.exports = function () {
    return new Handler();
};


var Handler = function () {
};

var handler = Handler.prototype;

handler.GetTeamList = function (msg, session, next) {
    var customID = msg.customID;
    var levelTarget = msg.levelTarget;
    var unionID = msg.unionID;
    if (null == customID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });

    }

    if(levelTarget != null && globalFunction.isLegalLevelTarget(levelTarget, customID) == false){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    var teamList = teamManager.GetTeamList(customID, levelTarget, unionID);
    return next(null, {
        result: 0,
        teamList: teamList
    });
};

handler.FindTeam = function (msg, session, next) {
    var customID = msg.customID;
    var teamID = msg.teamID;
    if (null == customID || null == teamID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });

    }
    var tempTeam = teamManager.GetTeam(customID, teamID);
    if (null == tempTeam || tempTeam.GetTeamState() != eTeamState.Room) {
        return next(null, {
            result: errorCodes.Rs_NoTeam
        });
    }
    else {
        return next(null, {
            result: 0,
            password: tempTeam.GetTeamInfo(eTeamInfo.IsPSW)
        });
    }
};

// 添加伤害
handler.AddUnionFightDamage = function(msg, session, next){
    var roleID = session.get('roleID');

    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    if(playerManager.IsInBlackList(roleID)){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    var teamState = player.GetTeamInfo(ePlayerTeamInfo.TeamState);

    if(teamState == ePlayerTeamState.TeamNull){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }


    var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
    var teamID = player.GetTeamInfo(ePlayerTeamInfo.TeamID);

    var teamInfo = teamManager.GetTeam(customID, teamID);
    if(teamInfo == null){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    var levelTarget = teamInfo.GetTeamInfo(eTeamInfo.LevelTarget);
    if(levelTarget == null || levelTarget != gameConst.eLevelTarget.unionFight){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    var atkValue = player.GetTeamInfo(ePlayerTeamInfo.AtkValue);

    var maxDamageTemplate = templateManager.GetAllTemplate('MaxDamageTemplate');
    var tempID = 0;
    for(var i in maxDamageTemplate){
        if(maxDamageTemplate[i]['minPower'] <= atkValue && maxDamageTemplate[i]['maxPower'] >= atkValue){
            tempID = i;
            break;
        }
    }

    var errCode = errorCodes.OK;
    do {
        if(maxDamageTemplate[tempID] == null){
            errCode = errorCodes.ParameterNull;
            break;
        }

        var hitDamage = msg.Damage;
        if(_.isNumber(hitDamage) == false){
            errCode = errorCodes.ParameterNull;
            break;
        }

        if(hitDamage <= 0){
            errCode = errorCodes.ParameterNull;
            break;
        }

        if(hitDamage > maxDamageTemplate[tempID]['maxDamage']){
            errCode = errorCodes.ParameterNull;
            break;
        }
    }while(false);

    // 参数错误，直接T出游戏
    if(errCode != errorCodes.OK){
        pomelo.app.rpc.cs.csRemote.playerCheat(null, player.GetPlayerCs(), roleID, 0, function(err){
            if(err!= null){
                return;
            }
            logger.error('player %s has cheat by damage is %j, and temp tempID is %j, and atk value is %j', roleID, hitDamage, tempID, atkValue);
        });

        return next(null, {
            result: errCode
        });
    }

    // 更加严格的校验开启
    if(defaultValues.cheatMaster){
        if(playerManager.checkDamageRate(roleID)){
            playerManager.addBlackList(roleID);
            if(defaultValues.cheatKick){
                pomelo.app.rpc.cs.csRemote.playerCheat(null, player.GetPlayerCs(), roleID, 0, function(err){
                    if(err!= null){
                        return;
                    }
                    logger.error('player %s has cheat by damage is %j, and temp tempID is %j, and atk value is %j', roleID, hitDamage, tempID, atkValue);
                });
            }

            return next(null, {
                result: errCode
            });
        }
    }

    var unionID = teamInfo.GetTeamInfo(eTeamInfo.UnionID);
    var animalOrder = teamInfo.GetTeamInfo(eTeamInfo.animalOrder);
    pomelo.app.rpc.us.usRemote.AddUnionFightDamage(null, unionID, roleID, animalOrder, hitDamage, function(err, result){
        if(err!= null){
            return;
        }

        if(result.result != errorCodes.OK){
            if(defaultValues.cheatMaster){
                playerManager.addBlackList(roleID);
                if(defaultValues.cheatKick){
                    pomelo.app.rpc.cs.csRemote.playerCheat(null, player.GetPlayerCs(), roleID, 0, function(err){
                        if(err!= null){
                            return;
                        }
                        logger.error('player %s has cheat by damage is %j, and temp tempID is %j, and atk value is %j', roleID, hitDamage, tempID, atkValue);
                    });
                }
            }
            return;
        }

        var damage = player.GetTeamInfo(ePlayerTeamInfo.fightDamage);
        player.SetTeamInfo(ePlayerTeamInfo.fightDamage, damage + hitDamage);
    });

    return next(null, {
        result: errCode
    });
};

// 获取本次战斗的伤害
handler.GetPlayerDamage = function(msg, session, next){
    var roleID = session.get('roleID');

    var player = playerManager.GetPlayer(roleID);
    if(player == null){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    var teamState = player.GetTeamInfo(ePlayerTeamInfo.TeamState);

    if(teamState == ePlayerTeamState.TeamNull){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }


    var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
    var teamID = player.GetTeamInfo(ePlayerTeamInfo.TeamID);

    var teamInfo = teamManager.GetTeam(customID, teamID);
    if(teamInfo == null){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    var levelTarget = teamInfo.GetTeamInfo(eTeamInfo.LevelTarget);
    if(levelTarget == null || levelTarget != gameConst.eLevelTarget.unionFight){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    pomelo.app.rpc.us.usRemote.getPlayerDamage(null, roleID, function(err, result){
        if(err!= null){
            return next(null, {
                result: errorCodes.SystemWrong
            });
        }

        if(result.result != errorCodes.OK){
            return next(null, {
                result: result.result
            });
        }

        var damage = player.GetTeamInfo(ePlayerTeamInfo.fightDamage);

        return next(null, {
            result: errorCodes.OK,
            thisDamage : damage.toString(),
            totalDamage : result.damage
        });
    });
};

handler.CreateTeam = function (msg, session, next) {

    logger.info('handler.CreateTeam: %j', msg);

    var roleID = session.get('roleID');
    var customID = msg.customID;
    var password = msg.password;
    var teamName = msg.teamName;
    var levelTarget = msg.levelTarget;
    var levelParam = msg.levelParam;

    if(globalFunction.isLegalLevelTarget(levelTarget, customID) == false){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

//    var maxTeamNameLength = 13;
//    if (defaultValues.operatorType == 1) {
//        // 北美
//        maxTeamNameLength = 20;
//    }
    var maxTeamNameLength = defaultValues.maxTeamNameLength;
    if (null == roleID || null == customID || null == levelTarget || null == levelParam || null == teamName
        || teamName.length > maxTeamNameLength) {
        return next(null, {
            result: errorCodes.ParameterNull
        });

    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            result: errorCodes.NoRole
        });

    }
    if (player.GetTeamInfo(ePlayerTeamInfo.TeamState) != ePlayerTeamState.TeamNull) {
        return next(null, {
            result: errorCodes.Rs_HaveTeam
        });
    }

    /** 对rs 最大房间数进行限制 防止 房间过多 压力过多， 重要应付 性能测试*/
    if (teamManager.getTeamNumber() > defaultValues.maxTeamRoomNum) {
        return next(null, {
            result: errorCodes.SystemBusy
        });
    }

    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return next(null, {
            'result': errorCodes.SystemWrong
        });

    }

    //如果是婚姻副本  甜蜜之旅  要求只能结婚后进行副本
    if(gameConst.eCustomSmallType.Marry == CustomTemplate[tCustomTemp.smallType]){
        if(!weddingManager.marryInfo[roleID]){
            return next(null, {
                'result': errorCodes.NOT_MARRY
            });
        }
        //判断姻缘值
        var yinyuan = weddingManager.YinYuanCount(roleID);
        if(yinyuan < CustomTemplate[tCustomTemp.yinYuanNum]){
            return next(null, {
                'result': errorCodes.MARRY_CUSTOM_YINYUAN
            });
        }
    }

    player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamYan);

    var csID = player.GetPlayerCs();
    pomelo.app.rpc.cs.csRemote.IsJoinTeam(null, csID, roleID, customID, levelTarget, 0,function (err, res) {
        if (!!err || !res) {
            logger.error('JoinTeam failed err: %s', utils.getErrorMessage(err));
            return next(null, {
                result: errorCodes.toClientCode(err)
            });
        }

        if (res.result > 0) {
            if (!player) {
                return next(null, {
                    'result': errorCodes.Rs_TeamNoRole
                });
            }
            player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamNull);

            return next(null, {
                'result': !!res ? res.result : errorCodes.SystemWrong
            });
        }

        teamManager.CreateTeam(teamName, res.vipLevel, player, customID, levelTarget, levelParam, password,
                               res.jobType);
        return next(null, {
            'result': 0
        });
    });
};

handler.JoinTeam = function (msg, session, next) {
    var roleID = session.get('roleID');
    var customID = msg.customID;
    var teamID = msg.teamID;
    var password = msg.password;
    if (null == roleID || null == customID || null == password || null == teamID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });

    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });

    }
    if (player.GetTeamInfo(ePlayerTeamInfo.TeamState) != ePlayerTeamState.TeamNull) {
        return next(null, {
            result: errorCodes.Rs_HaveTeam
        });

    }
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return next(null, {
            'result': errorCodes.SystemWrong
        });

    }
    var tempTeam = teamManager.GetTeam(customID, teamID);
    if (null == tempTeam) {
        return next(null, {
            'result': errorCodes.Rs_NoTeam
        });
    }

    //如果是婚姻副本  甜蜜之旅  要求只能是夫妻才能一起进行副本
    if(gameConst.eLevelTarget.marry == CustomTemplate[tCustomTemp.smallType]){
        if(!weddingManager.marryInfo[roleID]){
            return next(null, {
                'result': errorCodes.NOT_MARRY
            });
        }
        var spouseID = roleID==weddingManager.marryInfo[roleID][eMarryInfo.roleID] ? weddingManager.marryInfo[roleID][eMarryInfo.toMarryID] : weddingManager.marryInfo[roleID][eMarryInfo.roleID];
        var sPlayer = playerManager.GetPlayer(spouseID);
        if(!sPlayer){
            return next(null, {
                'result': errorCodes.MARRY_TEAM_NOT
            });
        }
        var sTeamID = sPlayer.GetTeamInfo(ePlayerTeamInfo.TeamID);
        if(sTeamID != teamID){
            return next(null, {
                'result': errorCodes.MARRY_TEAM_NOT
            });
        }
    }

    var result = tempTeam.IsJoin(password);
    if(result != errorCodes.OK){
        return next(null, {
            'result': result
        });
    }

    player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamYan);
    var csID = player.GetPlayerCs();
    var levelTarget = tempTeam.GetTeamInfo(eTeamInfo.LevelTarget);
    var unionID = tempTeam.GetTeamInfo(eTeamInfo.UnionID);

    pomelo.app.rpc.cs.csRemote.IsJoinTeam(null, csID, roleID, customID, levelTarget, unionID, function(err, res) {
        if (err || res.result > 0) {
            if (!player) {
                return next(null, {
                    'result': errorCodes.Rs_TeamNoRole
                });
            }
            player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamNull);
            if (!!res && res.result != errorCodes.Cs_ItemFull) {
                logger.error('玩家加入队伍不允许 res: %j, err: %s', res, utils.getErrorMessage(err));
            }
            return next(null, {
                'result': !!res ? res.result : errorCodes.SystemWrong
            });
        }
        teamManager.JoinTeam(tempTeam, customID, teamID, player, res.jobType);

        return next(null, {
            result: errorCodes.OK
        });
    });
};

handler.FastJoinTeam = function (msg, session, next) {
    var roleID = session.get('roleID');
    var teamName = msg.teamName;
    var customID = msg.customID;
    var levelTarget = msg.levelTarget;
    var levelParam = msg.levelParam;

    if(globalFunction.isLegalLevelTarget(levelTarget, customID) == false){
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

//    var maxTeamNameLength = 13;
//    if (defaultValues.operatorType == 1) {
//        // 北美
//        maxTeamNameLength = 20;
//    }
    var maxTeamNameLength = defaultValues.maxTeamNameLength;
    if (null == roleID || null == teamName || teamName.length > maxTeamNameLength || null == customID || null == levelTarget || null
        == levelParam) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });

    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });

    }
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == customTemplate) {
        return next(null, {
            'result': errorCodes.SystemWrong
        });

    }
    if (player.GetTeamInfo(ePlayerTeamInfo.TeamState) != ePlayerTeamState.TeamNull) {
        return next(null, {
            'result': errorCodes.Rs_HaveTeam
        });

    }

    //如果是婚姻副本  甜蜜之旅  要求只能是夫妻才能一起进行副本
    var spouseID = 0;
    if(levelTarget == gameConst.eLevelTarget.marry ){
        if(!weddingManager.marryInfo[roleID]){
            return next(null, {
                'result': errorCodes.NOT_MARRY
            });
        }
        spouseID = roleID==weddingManager.marryInfo[roleID][eMarryInfo.roleID] ? weddingManager.marryInfo[roleID][eMarryInfo.toMarryID] : weddingManager.marryInfo[roleID][eMarryInfo.roleID];
    }

    var unionID = null;
    if(levelTarget == gameConst.eLevelTarget.Train
        || levelTarget == gameConst.eLevelTarget.unionFight){
        unionID = player.GetPlayerInfo(ePlayerInfo.UnionID) != null ? player.GetPlayerInfo(ePlayerInfo.UnionID) : 0;
    }


    player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamYan);

    var csID = player.GetPlayerCs();
    pomelo.app.rpc.cs.csRemote.IsJoinTeam(null, csID, roleID, customID, levelTarget, 0, function (err, res) {
        if (err || res.result > 0) {
            if (!player) {
                return next(null, {
                    'result': errorCodes.Rs_TeamNoRole
                });
            }
            player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamNull);
            if (res.result != errorCodes.Cs_ItemFull) {
                logger.warn('玩家快速队伍不允许 res: %j, err: %s', res, utils.getErrorMessage(err));
            }
            return next(null, {
                'result': !!res ? res.result : errorCodes.SystemWrong
            });
        }
        else {

            var tempTeam = teamManager.GetJoinTeam(customID, unionID, spouseID);
            if (null == tempTeam) {
                teamManager.CreateTeam(teamName, res.vipLevel, player, customID, levelTarget, levelParam, '',
                                       res.jobType);
                return next(null, {
                    result: 0
                });
            }
            else {
                if(levelTarget == gameConst.eLevelTarget.marry ){
                    var OwnerID = tempTeam.GetTeamInfo(eTeamInfo.OwnerID);
                    var ownerPlayer = playerManager.GetPlayer(OwnerID);
                    pomelo.app.rpc.cs.csRemote.MarryDouble(null, csID, roleID, utils.done);
                    pomelo.app.rpc.cs.csRemote.MarryDouble(null, ownerPlayer.GetPlayerCs(), OwnerID, utils.done);
                    //tempTeam.SetTeamInfo(eTeamInfo.marryDouble, 1);//夫妻双人本 双倍奖励标志
                }
                var teamID = tempTeam.GetTeamInfo(eTeamInfo.TeamID);
                teamManager.JoinTeam(tempTeam, customID, teamID, player, res.jobType);
                return next(null, {
                    result: 0
                });
            }
        }
    });
};

handler.LeaveTeam = function (msg, session, next) {
    var roleID = session.get('roleID');
    var leaveID = msg.roleID;
    if (null == leaveID || null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var player = playerManager.GetPlayer(roleID);
    var leavePlayer = playerManager.GetPlayer(leaveID);
    if (null == player || null == leavePlayer) {
        return next(null, {
            'result': errorCodes.NoRole
        });

    }
    var teamID = player.GetTeamInfo(ePlayerTeamInfo.TeamID);
    var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
    var tempTeam = teamManager.GetTeam(customID, teamID);
    if (null == tempTeam) {
        return next(null, {
            'result': errorCodes.Rs_NoTeam
        });

    }
    if (tempTeam.IsHavePlayer(leaveID) == false) {
        return next(null, {
            'result': errorCodes.Rs_TeamNoRole
        });

    }
    var result = teamManager.LeaveTeam(player, leavePlayer, tempTeam, customID, teamID);
    return next(null, {
        'result': result
    });
};

handler.ReadyTeam = function (msg, session, next) {
    logger.info('handler.ReadyTeam: %j', msg);

    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
    if (player.GetTeamInfo(ePlayerTeamInfo.TeamState) == ePlayerTeamState.TeamIn) {
        player.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamReady);
        var roleID = occupantManager.GetOccupantRoleID(customID);
        if (!!roleID) {
            return rsSql.GetRoleInfoByName(roleID,
                                           function (err, playerInfo, itemList, soulList, attList, magicSoulList) {
                                               return next(null, {
                                                   'result': 0,
                                                   'playerInfo': playerInfo,
                                                   'itemList': itemList,
                                                   'soulList': soulList,
                                                   'magicSoulList': magicSoulList
                                               });
                                           });

//            Q.nfcall(csSql.GetRoleIDByName, roleName)
//                .catch(function (err) {
//                    return next(null, {result: errorCodes.SystemWrong});
//                })
//                .then(function (res) {
//                    if (res <= 0) {
//                        return next(null, {result: errorCodes.NoRole});
//                    }
//                }).done();
        }
    }

    return next(null, {
        'result': 0,
        'playerInfo': [],
        'itemList': [],
        'soulList': [],
        'magicSoulList': []
    });
};

handler.StartGame = function (msg, session, next) {
    var self = this;
    var roleID = session.get('roleID');

    var customID = msg.customID;
    var levelParam = msg.levelParam;
    var levelTarget = msg.levelTarget;

    logger.info('handler.StartGame: %d, %j', roleID, msg);

    if (!roleID) {
        return next(null, {
            result: errorCodes.ParameterNull
        });
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {
            result: errorCodes.NoRole
        });
    }

    var customID = player.GetTeamInfo(ePlayerTeamInfo.CustomID);
    var teamID = player.GetTeamInfo(ePlayerTeamInfo.TeamID);
    var tempTeam = teamManager.GetTeam(customID, teamID);
    if (!tempTeam) {
        return next(null, {
            result: errorCodes.Rs_NoTeam
        });
    }

    var result = tempTeam.StarGame(roleID);
    if (result != 0) {
        return next(null, {result: result});
    }

    var csID = player.GetPlayerCs();
    var teamInfo = tempTeam.GetClientInfo();
    var teamNum = tempTeam.GetPlayerNum();

    var atkAddPer = 0;
    var defAddPer = 0;
    var hpAddPer = 0;

    var attrAdd = {};
    if(tempTeam.GetTeamInfo(eTeamInfo.LevelTarget) == gameConst.eLevelTarget.unionFight ){
        if(tempTeam.GetTeamInfo(eTeamInfo.UnionID) == playerManager.GetDukeUnionID()) {
            var UnionDataTemplate = templateManager.GetTemplateByID('UnionDataTemplate', 1001);
            if(UnionDataTemplate == null){
                return next(null, {
                    result: errorCodes.NoTemplate
                });
            }
            atkAddPer += UnionDataTemplate['defFixDamage'];       // 城主公会提升伤害
        }

        var UnionFixTemplate = templateManager.GetAllTemplate('UnionFixTemplate');
        if(UnionFixTemplate == null){
            logger.error('fix temple is null');
            return next(null, {
                result: errorCodes.NoTemplate
            });
        }

        var index = 0;
        for (var i in UnionFixTemplate) {
            if(UnionFixTemplate[i]['attType'] != 2){
                continue;
            }
            if (teamNum >= UnionFixTemplate[i]['rankLow'] && teamNum <= UnionFixTemplate[i]['rankHigh']) {
                index = i;
                break;
            }
        }

        if(UnionFixTemplate[index] == null){
            logger.error('not find the teamFix temple %j', teamNum);
        }else{
            atkAddPer += UnionFixTemplate[index]['attkAdd'];
            defAddPer += UnionFixTemplate[index]['defAdd'];
            hpAddPer += UnionFixTemplate[index]['hpAdd'];
        }

        attrAdd.atkAddPer = atkAddPer;
        attrAdd.defAddPer = defAddPer;
        attrAdd.hpAddPer = hpAddPer;

        attrAdd.attLevel = gameConst.eAttLevel.ATTLEVEL_UNION_FIGHT;
    }
    else if(tempTeam.GetTeamInfo(eTeamInfo.LevelTarget) == gameConst.eLevelTarget.Ares){
        var ArenaPowerTemplate = templateManager.GetAllTemplate('ArenaPowerTemplate');
        if(ArenaPowerTemplate == null){
            logger.error('ArenaPowerTemplate is null');
            return next(null, {
                result: errorCodes.NoTemplate
            });
        }


        var zhanli = player.GetPlayerInfo(ePlayerInfo.ZHANLI);
        var tempID = player.GetPlayerInfo(ePlayerInfo.TEMPID);
        --tempID;
        var index = 0;
        for (var i in ArenaPowerTemplate) {
            if (tempID == ArenaPowerTemplate[i]['profession'] && zhanli >= ArenaPowerTemplate[i]['minPower'] && zhanli <= ArenaPowerTemplate[i]['maxPower']) {
                index = i;
                break;
            }
        }

        if(ArenaPowerTemplate[index] == null){
            logger.error('not find the ArenaPowerTemplate temple %j', zhanli);
        }else{
            atkAddPer += ArenaPowerTemplate[index]['incAtk'];
            defAddPer += 0;
            hpAddPer += ArenaPowerTemplate[index]['incHP'];
        }

        attrAdd.atkAddPer = atkAddPer;
        attrAdd.defAddPer = defAddPer;
        attrAdd.hpAddPer = hpAddPer;

        attrAdd.attLevel = gameConst.eAttLevel.ATTLEVEL_ARES;
    }

    //结婚关卡  甜蜜之旅 只有夫妻可以一起进行副本
    var spouseID = 0;
    if(gameConst.eLevelTarget.marry == tempTeam.GetTeamInfo(eTeamInfo.LevelTarget)) {
        if (!weddingManager.marryInfo[roleID]) {
            return next(null, {
                'result': errorCodes.NOT_MARRY
            });
        }
        spouseID = roleID;
    }

    pomelo.app.rpc.cs.csRemote.CreateRoom(null, csID, teamInfo, function (err, res) {
        if (!!err || res.result > 0) {
            logger.error('创建房间出现问题 csID: %j, teamInfo: %j, res: %j, err: %s', csID, teamInfo, res,
                         utils.getErrorMessage(err));
            return next(null, {
                'result': !!res ? res.result : errorCodes.SystemWrong
            });
        }

        async.each(teamInfo.playerList, function (player, eachCallback) {
                var conRoleID = player.roleID;

                var tempPlayer = playerManager.GetPlayer(conRoleID);
                if (!tempPlayer) {
                    return next(null, {
                        'result': errorCodes.Rs_TeamNoRole
                    });
                }
                //验证队友信息是否是夫妻关系
                if(0 != spouseID){
                    if(conRoleID!=weddingManager.marryInfo[roleID][eMarryInfo.roleID] && conRoleID!=weddingManager.marryInfo[roleID][eMarryInfo.toMarryID]){
                        return next(null, {
                            'result': errorCodes.NOT_MARRY
                        });
                    }
                }
                tempPlayer.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamIn);
                var tempCs = tempPlayer.GetPlayerCs();

                logger.info('csID是tempCs=%j，csID=%j', tempCs, csID);
                if (tempCs == csID) {
                    return eachCallback();
                }

                pomelo.app.rpc.cs.csRemote.ConveyPlayer(null, tempCs, csID, conRoleID, customID, teamID,
                    function (err, res) {
                        if (err || res.result > 0) {
                            logger.error('传送出现错误 res: %j, err: %s', res,
                                utils.getErrorMessage(err));
                            return next(null, {
                                'result': !!res ? res.result :
                                    errorCodes.SystemWrong
                            });
                        }

                        var tempPlayer = playerManager.GetPlayer(res.roleID);
                        if (tempPlayer) {
                            tempPlayer.SetPlayerCs(csID);
                        }
                        return eachCallback();
                    });
            },
            function (err) {
                if (!!err) {
                    return next(null, {result: errorCodes.Rs_TeamState});
                }
                pomelo.app.rpc.cs.csRemote.getItemDropList(null, csID, customID, roleID, teamInfo, attrAdd, function (err, result) {
                    if(err != null || result.result != errorCodes.OK){
                        logger.error('start team fail by result %j', result.result);
                        return next(null, {result: result.result});
                    }
                    if(result.animalOrder != null){
                        tempTeam.SetTeamInfo(eTeamInfo.animalOrder, result.animalOrder);
                    }
                    for(var atkID in result.atkList){
                        var atkPlayer = playerManager.GetPlayer(atkID);
                        if(atkPlayer != null){
                            atkPlayer.SetTeamInfo(ePlayerTeamInfo.AtkValue, result.atkList[atkID]);
                        }
                    }
                    //婚姻关卡双倍掉落显示
                    if(gameConst.eLevelTarget.marry == tempTeam.GetTeamInfo(eTeamInfo.LevelTarget)) {
                        if(2 == teamInfo.playerList.length){
                            for(var npcDropList in result.itemDropList.npcDropList){
                                //经验双倍
                                result.itemDropList.npcDropList[npcDropList].dropExp = result.itemDropList.npcDropList[npcDropList].dropExp*2;
                                var dorpList = result.itemDropList.npcDropList[npcDropList].dropList[0];
                                //logger.fatal("############## dorpList: %j",dorpList);
                                //其他掉落物品全部双倍
                                if(!!dorpList){
                                    var drop = dorpList.dropID;
                                    for(var dropID in drop){
                                        drop[dropID] = drop[dropID]*2;
                                    }
                                }
                            }
                        }
                    }
                    tempTeam.SendStartGame(result.itemDropList, customID, levelParam, levelTarget);
                    var checkFlag = self.IsOpenCheck();

                    logger.warn('getItemDropList roleID: %s, teamInfo: %j, customID: %j',
                                roleID, teamInfo, customID);

                    return next(null,
                        {result: 0, isCheck: checkFlag});
                });
            });
    });
};

/**
 * @return {boolean}
 */
handler.IsOpenCheck = function () {     //是否开启战斗校验
    var rate = defaultValues.OpenCheckRate;
    var random = Math.floor(Math.random() * 100);
    return random < rate;
};
