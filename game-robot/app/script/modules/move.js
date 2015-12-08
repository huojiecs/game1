/**
 * Created by kazi on 2014/6/12.
 */

var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
var async = require('async');
var utils = require('./../utils');
var _ = require('underscore');

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
    async.waterfall([
        self.move.bind(self)
    ], function (err, result) {
        // result now equals 'done'
        logger.info('friends.update: error:%j, result:%j', err, result);
    });
};

handler.move = function (next) {
    var self = this;
    var route = 'cs.roomHandler.Move';
    var message = _.extend(utils.genCityPosition(), utils.genRotation());

    self.pomelo.request(route, message, function (data) {
        logger.info('%s:%j', route, data);
        if (next) {
            next();
        }
    });
};
