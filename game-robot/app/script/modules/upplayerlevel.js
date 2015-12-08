/**
 * Created by yqWang on 2014-06-12.
 */

var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
var roleData = require('./../../data/json/role');
var roomData = require('./../../data/json/room');
var fs = require('fs');


var Handler = module.exports = function (client, interval) {
    this.client = client;
    this.pomelo = client.pomelo;
    this.interval = interval;
};

var handler = Handler.prototype;

handler.run = function () {
    var self = this;

    setInterval(
        function () {
            self.update();
        }, self.interval);
};

handler.update = function () {
    var self = this;
    self.AddPlayerExp();
};

handler.AddPlayerExp = function () {
    var expNum = 1234567890;
    var message = {};
    message['cmd'] = "addexp";
    message['params'] = [expNum];
    this.pomelo.request('ps.playerHandler.GmControl', message, function (result) {
        logger.info('GetTeamList result = ' + result.result);
    });
};
