/**
 * Created by Administrator on 14-9-28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var Q = require('q');
var unionManager = require('./union/unionManager');
var unionIOController = require('./union/unionIOController');
var defaultValues = require('../tools/defaultValues');
var redisManager = require('./chartRedis/redisManager');
var playerManager = require('./player/playerManager');
var Handler = module.exports;

Handler.InitServer = function () {
    var deferred = Q.defer();
    redisManager.Init().
        then(function () {
                 Q.all([ unionManager.Init(), playerManager.Init(), unionIOController.Init()])
                     .then(function () {
                               setInterval(UpdateServer, defaultValues.UnionSaveDBTime);
                               setInterval(UpdateState, 5*1000);
                               return deferred.resolve();
                           })
                     .catch(function () {
                                return deferred.reject();
                            })
                     .done();
             });
    return deferred.promise;
};

Handler.BeforeCloseServer = function (cb) {
    unionIOController.UpdateUnion(cb);
};

function UpdateServer() {
    unionManager.DeleteUnionLog();
    unionIOController.UpdateUnion(function (err) {
    });
}

function UpdateState(){
    unionManager.updateState();
    unionManager.updatePlayerUnionCD();
}
