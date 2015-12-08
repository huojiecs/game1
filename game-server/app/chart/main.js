/**
 * Created by xykong on 2014/7/12.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var chartManager = require('./../chart/chartManager');
var chartZhanli = require('./chartZhanli');
var chartAcrossZhanli = require('./chartAcrossZhanli');
var chartHonor = require('./chartHonor');
var chartClimb = require('./chartClimb');
var chartJJC = require('./chartJJC');
var chartAres = require('./chartAres');
var chartSoulPvp = require('./chartSoulPvp');
var chartUnion = require('./chartUnion');
var chartAwardScore = require('./chartAwardScore');
var chartRecharge = require('./chartRecharge');
var chartSoul = require('./chartSoul');
var chartPet = require('./chartPet');
var redisManager = require('./redisManager');
var chartRewardManager = require('./chartRewardManager');
var chartUnionScore = require('./chartUnionScore');
var chartChestPoint = require('./chartChestPoint');
var worldBossScore = require('./chartWorldBoss');
var marryScore = require('./chartMarry');
var chartStoryScore = require('./chartStoryScore');
var Q = require('q');

var Handler = module.exports;

Handler.InitServer = function () {
    var deferred = Q.defer();

    logger.info("chart server initializing...");

    redisManager.Init();
    chartRewardManager.Init();
    chartManager.Init().
        then(function () {
                 Q.all([chartZhanli.Init(), chartHonor.Init(), chartClimb.Init(), chartAwardScore.Init(),
                        chartRecharge.Init(), chartSoul.Init(), chartUnion.Init(), chartAres.Init(),
                        chartSoulPvp.Init(), chartUnionScore.Init(), chartAcrossZhanli.Init(), chartPet.Init(),chartJJC.Init(),chartChestPoint.Init(),worldBossScore.Init(), marryScore.Init(),chartStoryScore.Init()])
                     .then(function () {
                               return deferred.resolve();
                           })
                     .catch(function () {
                                return deferred.reject();
                            })
                     .done();
             });

    return deferred.promise;
};
