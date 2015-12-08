/**
 * Created by CL on 15-6-1.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./chartManager');
var chartSql = require('../tools/mysql/chartSql');
var config = require('../tools/config');
var utils = require('../tools/utils');
var defaultValues = require('../tools/defaultValues');
var errorCodes = require('../tools/errorCodes');
var Q = require('q');
var gameConst = require('../tools/constValue');
var redis = require("redis");
var _ = require('underscore');
var redisManager = require('../cs/chartRedis/redisManager');
var detailUtils = require('../tools/redis/detailUtils');
var templateManager = require('../tools/templateManager');
var events = require('events');
var offlinePlayer = require('../ps/player/offlinePlayer');

var eForbidChartType = gameConst.eForbidChartType;
var ePlayerInfo = gameConst.ePlayerInfo;
var eRedisClientType = gameConst.eRedisClientType;


var Handler = module.exports;
var event = new events.EventEmitter();

Handler.Init = function () {
    var self = this;
    var deferred = Q.defer();

    self.zsetName =
    config.redis.chart.zsetName + ':pet@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.redisRoleDetail =
    config.redis.chart.zsetName + ':roleDetail@' + config.list.serverUid + ':' + pomelo.app.getMaster().port;

    self.eachLoadPlayer = 300;
    /** 创建redis连接*/
    self.client = redis.createClient(config.redis.chart.port, config.redis.chart.host, {
        auth_pass: config.redis.chart.password,
        no_ready_check: true
    });
    self.client.on("error", function (err) {
        logger.error("REDIS Error %s", utils.getErrorMessage(err));
    });

    logger.info('Use redis %s:%d zsetname name:%s', config.redis.chart.host, config.redis.chart.port, self.zsetName);

    /**　删除redis 原有的数据*/
    var del = Q.nbind(self.client.del, self.client);

    if (!!defaultValues.RedisReloadAtStartup) {
        var jobs = [
            del(self.zsetName)
        ];
        Q.all(jobs)
            .then(function () {
                      var dbLoopCount = config.mysql.global.loopCount;
                      return Q.until(function () {
                          --dbLoopCount;
                          var lastRoleID = 0;
                          return Q.until(function () {
                              return Q.ninvoke(chartSql, 'ChartLoadPet', dbLoopCount, lastRoleID)
                                  .then(function (players) {
                                            self.AddPlayers(players);
                                            logger.info("ChartLoadPet load player: %s", players.length);

                                            if (players.length > 0) {
                                                lastRoleID = players[players.length - 1]['roleID'];
                                            }

                                            /** 判断该服玩家数据是否读取完毕*/
                                            return players.length < self.eachLoadPlayer;
                                        })
                                  .catch(function (err) {
                                             logger.error("ChartLoadPet failed: %s", utils.getErrorMessage(err));
                                             return true;
                                         });
                          }).then(function () {
                                      /** 所有数据库读取完毕结束条件*/
                                      return dbLoopCount === 0;
                                  });
                      })
                  })
            .finally(function () {
                         return deferred.resolve();
                     })
            .done();
    } else {
        return Q.resolve();
    }

    return deferred.promise;
};

Handler.AddPlayers = function (players, callback) {
    var self = this;
    logger.info("Soul Try to AddPlayers count: %d", players.length);

    var multi = self.client.multi();
    _.each(players, function (player) {
        var roleID = player['roleID'];
        var petID = player['petID'];
        var zhanli = player['zhanli'];
        var status = player['status'];

        if (!chartManager.IsInBlackList(roleID)
                && !chartManager.IsInForbidList(roleID, eForbidChartType.PET)
            && !chartManager.IsInForbidList(roleID, eForbidChartType.ALL)) {
            if (_.contains([1, 2, 3, 4, 5], status)) {
                var key = roleID + '+' + petID;
                multi.zadd(self.zsetName, zhanli, key, function (err, count) {
                });
            }
        }
    });

    multi.exec(function (err, replies) {
        return utils.invokeCallback(callback, err);
    });
};

Handler.RemovePlayerScore = function (roleID, callback) {
    var self = this;

    var zrem = Q.nbind(self.client.zrem, self.client);

    var jobs = [
        zrem(self.zsetName, roleID)
    ];

    Q.all(jobs)
        .spread(function (count) {
                    return callback(null, count);
                })
        .catch(function (err) {
                   logger.error("error when remove player %d, %s", roleID, utils.getErrorMessage(err));
                   return callback(err);
               })
        .done();
};

Handler.GetChart = function (roleID, chartType, callback) {
    var self = this;

    /** 绑定相关方法 用于流程控制*/
    var zRevRank = Q.nbind(self.client.zrevrank, self.client);
    var zRevRange = Q.nbind(self.client.zrevrange, self.client);
    var hmGet = Q.nbind(self.client.hmget, self.client);
    var hGet = Q.nbind(self.client.hget, self.client);

    var chartInfo = [];
    var petChartList = [];
    var roleIDs = [];
    var emptyValues = [];

    var chartJobs = [zRevRange(self.zsetName, 0, defaultValues.chartPetTopListCount - 1, 'WITHSCORES')];
    var selfJobs = [hGet(self.redisRoleDetail, roleID)];
    var rankJobs = [];

    Q.all(chartJobs)
        .then(function (datas) {
                  var data = datas[0];
                  var rank = 0;
                  for (var i = 0; i < data.length; i += 2) {
                      var param = data[i].split('+'); //param[0]: roleID, param[1]: petID
                      roleIDs.push(+param[0]);
                      var petInfo = {
                          rank: ++rank,
                          roleID: +param[0],
                          petID: +param[1],
                          zhanli: +data[i + 1]
                      };
                      petChartList.push(petInfo);
                  }

                  if (petChartList.length === 0) {
                      return Q.resolve([]);
                  }
                  roleIDs = _.uniq(roleIDs);

                  return hmGet(self.redisRoleDetail, roleIDs);
              })
        .then(function (details) {
                  //构造一个details map
                  var detailMap = {};
                  for (var i = 0; i < roleIDs.length; i++) {
                      if (null == details[i]) {
                          emptyValues.push(roleIDs[i]);
                          continue;
                      }
                      detailMap[roleIDs[i]] = detailUtils.unzip(details[i]);
                  }
                  if (!_.isEmpty(emptyValues)) {
                      return Q.reject(errorCodes.Pet_Chart_No_Value);
                  }
                  for (var index in petChartList) {
                      var detail = detailMap[petChartList[index].roleID];
                      petChartList[index].roleName = detail.playerInfo[ePlayerInfo.NAME];

                      if (_.isEmpty(detail.petList)) {
                          var petTemplate = templateManager.GetTemplateByID('PetTemplate', petChartList[index].petID);
                          if (petTemplate == null) {
                              logger.error('PetTemplate is null!');
                              petChartList[index].grade = 4;
                          } else {
                              petChartList[index].grade = petTemplate['maxColor'];
                          }
                          petChartList[index].level = detail.playerInfo[ePlayerInfo.ExpLevel];
                      } else {
                          for (var aIndex in detail.petList) {
                              if (petChartList[index].petID == detail.petList[aIndex].petID) {
                                  petChartList[index].grade = detail.petList[aIndex].grade;
                                  petChartList[index].level = detail.petList[aIndex].level;
                                  break;
                              }
                          }
                      }
                  }
                  return Q.all(selfJobs);
              })
        .then(function (data) {
                  var roleDetail;
                  if (null != data || !_.isEmpty(data)) {
                      roleDetail = detailUtils.unzip(data);
                      var petList = roleDetail.petList; // [{},{}]
                      for (var i in petList) {
                          var pet = petList[i];
                          var key = roleID + '+' + pet.petID;
                          var tempPet = {
                              roleID: roleID,
                              petID: pet.petID,
                              zhanli: pet.zhanli,
                              grade: pet.grade,
                              level: pet.level,
                              roleName: roleDetail.playerInfo[ePlayerInfo.NAME]
                          };
                          chartInfo.push(tempPet);
                          rankJobs.push(zRevRank(self.zsetName, key));
                      }
                      return Q.all(rankJobs);
                  }
                  Q.resolve([]);
              })
        .then(function (datas) {
                  if (_.isEmpty(datas)) {
                      var nullPet = {
                          rank: 0,
                          petID: 0,
                          roleID: 0,
                          zhanli: 0,
                          grade: 0,
                          level: 0,
                          roleName: ''
                      };
                      return callback(null, 0, {self: [nullPet], chart: petChartList});
                  }
                  for (var i = 0; i < chartInfo.length; i++) {
                      var pet = chartInfo[i];
                      pet.rank = datas[i] + 1;
                  }
                  return callback(null, 0, {self: chartInfo, chart: petChartList});
              })
        .catch(function (err) {
                   if (utils.getErrorMessage(err) == errorCodes.Pet_Chart_No_Value) {
                       for (var i in emptyValues) {
                           event.emit("LoadDBtoRedis", self.client, self.redisRoleDetail, emptyValues[i]);
                       }
                   } else {
                       logger.error("error when GetChartPet %s", utils.getErrorMessage(err));
                   }

                   return callback(err);
               })
        .done();
};

event.on("LoadDBtoRedis", function (client, roleDetailMapName, roleID) {
    client.hget(roleDetailMapName, roleID, function (err, data) {
        if (!!err || null == data) {
            logger.warn("get player detail from redis: %d, %s, %j", roleID,
                        utils.getErrorMessage(err), data);

            var op = new offlinePlayer();

            var refreshDetailToRedis = function () {
                var playerList = {
                    playerInfo: op.playerInfo,
                    itemList: op.itemManager.GetEquipInfo(),
                    soulList: op.soulManager.GetAllSoulInfo(),
                    attList: op.attManager.GetAllAtt(),
                    magicSoulList: op.magicSoulManager.GetMagicSoulAllInfo(),
                    skillList: op.skillManager.GetAllSkillInfo(),
                    runeList: op.runeManager.getAllRuneInfo(),
                    bianShenAttList: op.soulManager.GetBianShenAttr(),
                    petList: defaultValues.IsPetOpening ? op.petManager.GetCarryPetInfo() : []
                };
                var roleID = op.playerInfo[ePlayerInfo.ROLEID];

                /**数据添加到redis */
                var zipped = detailUtils.zip(playerList);
                client.hset(roleDetailMapName, roleID, zipped, function (err, data) {
                    if (!!err) {
                        logger.error('refreshDetailToRedis error: %s', utils.getErrorMessage(err));
                    }
                });
                return zipped;
            };

            op.LoadDetailToRedisDataByDB(roleID, refreshDetailToRedis, function (err, zippedInfo) {
                if (!!err) {
                    logger.error("get player detail by LoadDetailToRedisDataByDB: %d, %s",
                                 roleID, utils.getErrorMessage(err));
                }
            });
        }
    });
});

