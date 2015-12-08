/**
 * The file Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2015/7/2
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var teamManager = require('../../../rs/team/teamManager');
var OccupantManager = require('../../../rs/occupant/occupantManager');
var playerManager = require('../../../rs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var idipUtils = require('../../../tools/idipUtils');
var globalFunction = require('../../../tools/globalFunction');
var defaultValues = require('../../../tools/defaultValues');
var utils = require('../../../tools/utils');
var async = require('async');

var ePlayerTeamInfo = gameConst.ePlayerTeamInfo;
var ePlayerInfo = gameConst.ePlayerInfo;
var ePlayerTeamState = gameConst.ePlayerTeamState;
var eTeamInfo = gameConst.eTeamInfo;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;
handler.AddPlayer = function (playerInfo, csID, uid, sid, callback) {
    playerManager.AddPlayer(playerInfo, csID, uid, sid);
    OccupantManager.SendOccupant(uid, sid);
    return callback();
};

/**
 * @创建队伍， 竞技场
 *
 * @param {Number} redID 红方玩家id
 * @param {Number} blueID 蓝方玩家ID
 * @param {Number} customID 关卡id
 * @param {Number} levelTarget 关卡类型
 * @param {Number} otherMsg 其他参数
 * @param {Function} next
 * */
handler.CreateTeam = function (redID, blueID, customID, levelTarget, otherMsg, next) {

    /** 初始化默认消息*/
    var password = otherMsg['password'] || 123456;
    var teamName = otherMsg['teamName'] || '';
    var levelParam = otherMsg['levelParam'] | 0;

    /** 验证参数*/
    var maxTeamNameLength = defaultValues.maxTeamNameLength;
    if (null == redID || null == blueID || null == customID || null == levelTarget || null == levelParam || null
        == teamName || teamName.length > maxTeamNameLength) {

        return next(null, {result: errorCodes.ParameterNull});
    }

    /** 验证关卡类型*/
    if (globalFunction.isLegalLevelTarget(levelTarget, customID) == false) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    /**  判断挑战双方是否存在*/
    var red = playerManager.GetPlayer(redID);
    var blue = playerManager.GetPlayer(blueID);
    if (null == blue || null == red) {
        return next(null, {result: errorCodes.NoRole});
    }

    /** 检查玩家的队伍状态 */
    if (red.GetTeamInfo(ePlayerTeamInfo.TeamState) != ePlayerTeamState.TeamNull) {
        if (red.GetTeamInfo(ePlayerTeamInfo.CustomID) == customID) {
//TODO
        } else {
            return next(null, {result: errorCodes.Rs_HaveTeam});
        }
    }

    /** 检查玩家的队伍状态 */
    if (blue.GetTeamInfo(ePlayerTeamInfo.TeamState) != ePlayerTeamState.TeamNull) {
        if (blue.GetTeamInfo(ePlayerTeamInfo.CustomID) == customID) {
            //TODO
        } else {
            return next(null, {result: errorCodes.Rs_HaveTeam});
        }
    }

    /** 设置玩家状态*/
    red.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamYan);
    blue.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamYan);

    /** 创建队伍*/
    teamManager.CreateTeam(teamName, red.GetVipLevel(), red, customID, levelTarget, levelParam, password,
                           red.GetJobType());

    /** 蓝方加入队伍*/
    var teamID = red.GetTeamInfo(ePlayerTeamInfo.TeamID);
    var tempTeam = teamManager.GetTeam(customID, teamID);
    teamManager.JoinTeam(tempTeam, customID, teamID, blue, blue.GetJobType());

    red.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamReady);
    blue.SetTeamInfo(ePlayerTeamInfo.TeamState, ePlayerTeamState.TeamReady);

    return next(null, {result: errorCodes.OK});
};

/**
 * @brief: 开始游戏
 *
 * @param {Number} roleID 玩家id
 * @param {Function} next
 * */
handler.StartGame = function (roleID, next) {
    var self = this;

    /** 验证参数*/
    if (null == roleID) {
        return next(null, {result: errorCodes.ParameterNull});
    }

    /** 判断玩家是否存在*/
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {result: errorCodes.NoRole});
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
    var attrAdd = {};
    pomelo.app.rpc.cs.csRemote.CreateRoom(null, csID, teamInfo, function (err, res) {
        if (!!err || res.result > 0) {
            logger.error('JJC创建房间出现问题 csID: %j, teamInfo: %j, res: %j, err: %s', csID, teamInfo, res,
                         utils.getErrorMessage(err));
            return next(null, {'result': !!res ? res.result : errorCodes.SystemWrong});
        }

        var roles = res.roles;

        async.each(teamInfo.playerList, function (player, eachCallback) {
                       var conRoleID = player.roleID;
                       var tempPlayer = playerManager.GetPlayer(conRoleID);
                       if (!tempPlayer) {
                           return next(null, {'result': errorCodes.Rs_TeamNoRole});
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
                       pomelo.app.rpc.cs.csRemote.getItemDropList(null, csID, customID, roleID, teamInfo, attrAdd,
                                                                  function (err, result) {
                                                                      if (err != null || result.result
                                                                          != errorCodes.OK) {
                                                                          logger.error('start team fail by result %j',
                                                                                       result.result);
                                                                          return next(null, {result: result.result});
                                                                      }
                                                                      if (result.animalOrder != null) {
                                                                          tempTeam.SetTeamInfo(eTeamInfo.animalOrder,
                                                                                               result.animalOrder);
                                                                      }
                                                                      for (var atkID in result.atkList) {
                                                                          var atkPlayer = playerManager.GetPlayer(atkID);
                                                                          if (atkPlayer != null) {
                                                                              atkPlayer.SetTeamInfo(ePlayerTeamInfo.AtkValue,
                                                                                                    result.atkList[atkID]);
                                                                          }
                                                                      }

                                                                      tempTeam.SendStartGameForJJC(result.itemDropList,
                                                                                                   customID,
                                                                                                   tempTeam.GetTeamInfo(eTeamInfo.LevelParam),
                                                                                                   tempTeam.GetTeamInfo(eTeamInfo.LevelTarget),
                                                                                                   roles);
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