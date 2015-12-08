/**
 * Created by xykong on 2014/8/2.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('lifecycle', __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var config = require('./../tools/config');


var Handler = module.exports;

Handler.InitServer = function () {

    function sendGameSvrState() {
        tlogger.logFormat('GameSvrState', new Date(), config.master.host);
    }

    sendGameSvrState();

    setInterval(sendGameSvrState, 1000 * 60);
};
