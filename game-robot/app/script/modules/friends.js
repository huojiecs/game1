/**
 * Created by kazi on 14-3-13.
 */
var logger = require('pomelo-logger').getLogger('friend', __filename);
var monitor = require('./../monitor');
var async = require('async');


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
        self.RequireBlessList.bind(self)
        , self.RequireFriendList.bind(self)
        , self.Bless.bind(self)
    ], function (err, result) {
        // result now equals 'done'
        logger.info('friends.update: error:%j, result:%j', err, result);
    });
};

handler.RequireFriendList = function (next) {
    var self = this;
    var route = 'fs.friendHandler.RequireFriendList';
    self.pomelo.request(route, {}, function (data) {
        logger.info('%s:%j', route, data);
        if (next) {
            next();
        }
    });
};

handler.RequireBlessList = function (next) {
    var self = this;
    var route = 'fs.friendHandler.RequireBlessList';
    self.pomelo.request(route, {}, function (data) {
        logger.info('%s:%j', route, data);
        if (next) {
            next();
        }
    });
};

handler.Bless = function (next) {
    var self = this;
    var route = 'fs.friendHandler.Bless';
    var message = {
        friendID: 30000136
    };
    self.pomelo.request(route, message, function (data) {
        logger.info('%s:%j', route, data);
        if (next) {
            next();
        }
    });
};

