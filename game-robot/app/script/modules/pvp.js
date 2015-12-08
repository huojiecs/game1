/**
 * Created by kazi on 14-3-7.
 */
var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
var pvpStat = require('./../statistic').pvpStat;
var async = require('async');
var utils = require('./../utils');

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

var typeFix = 0;

handler.update = function () {
    var self = this;
    async.waterfall([
        self.RequirePrice.bind(self)
//        , self.LingliExchange
//        , self.RequireExchangeList
        , self.RequireRival.bind(self)
//        , self.RefreshRival
        , self.BeginMatchRival.bind(self)
    ], function (err, result) {
        // result now equals 'done'
        logger.info('pvp.update: error:%j, result:%j', err, result);
    });

};

handler.RequirePrice = function (next) {
    var self = this;
    self.pomelo.request('cs.pvpHandler.RequirePrice', {}, function (data) {
        logger.info('cs.pvpHandler.RequirePrice:%j', data);
        if (next) {
            next();
        }
    });
};

handler.RequireExchangeList = function (next) {
    var self = this;
    utils.request(logger, self.pomelo, 'cs.pvpHandler.RequirePrice', {}, function (data) {
        if (next) {
            next();
        }
    });
};

handler.LingliExchange = function (next) {
    var self = this;
    utils.request(logger, self.pomelo, 'cs.pvpHandler.LingliExchange', {exchangeID: 1}, function (data) {
        if (next) {
            next();
        }
    });
};

handler.RequireRival = function (next) {
    var self = this;
    var type = typeFix || Math.floor(Math.random() * 3);
    utils.request(logger, self.pomelo, 'cs.pvpHandler.RequireRival', {'type': type}, function (data) {
        if (data.result != 0) {
            return next(data);
        }
        var num = type * 2 + 1;
        if (num !== data.rivals.length) {
            logger.error('cs.pvpHandler.RequireRival: receive rivals not equal desired. %d != %d', num, data.rivals.length);
        }
        if (next) {
            next();
        }
    });
};

handler.RefreshRival = function (next) {
    var self = this;
    var type = Math.floor(Math.random() * 3);
    utils.request(logger, self.pomelo, 'cs.pvpHandler.RefreshRival', {'type': type}, function (data) {
        if (data.result != 0) {
            return next(data);
        }

        if (next) {
            next();
        }
    });
};

handler.BeginMatchRival = function () {
    var self = this;

    logger.info('self.BeginMatchRival');

    var type = typeFix || Math.floor(Math.random() * 3);

    var customID = 900006;
    var password = "";

    async.waterfall([
            function (callback) {
                var message = {'type': type};
                self.pomelo.request('cs.pvpHandler.BeginMatchRival', message, function (data) {
                    logger.info('cs.pvpHandler.BeginMatchRival:%j', data);
                    if (data.result != 0) {
                        return callback(data);
                    }
                    callback(null);
                });
            },
            function (callback) {
                var message = {
                    teamName: "pvp room",
                    customID: customID,
                    levelType: 0,
                    password: password,
                    levelTarget: 3,
                    levelParam: 0
                };
                self.pomelo.request("rs.roomHandler.CreateTeam", message, function (data) {
                    logger.info('rs.roomHandler.CreateTeam:%j', data);
                    if (data.result != 0) {
                        return callback(data);
                    }
                    callback(null, data);
                });
            },
            function (params, callback) {
                self.pomelo.request("rs.roomHandler.ReadyTeam", {}, function (data) {
                    logger.info('rs.roomHandler.ReadyTeam:%j', data);
                    if (data.result != 0) {
                        return callback(data);
                    }
                    callback(null, data);
                });
            },
            function (params, callback) {
                self.pomelo.request("rs.roomHandler.StartGame", {}, function (data) {
                    logger.info('rs.roomHandler.StartGame:%j', data);
                    if (data.result != 0) {
                        return callback(data);
                    }
                    callback(null, data);
                });
            },
            function (params, callback) {
                var message = {};
                message["posX"] = 0;
                message["posY"] = 0;
                message["posZ"] = 0;
                self.pomelo.request("cs.roomHandler.EnterScene", message, function (data) {
                    logger.info('cs.roomHandler.EnterScene:%j', data);
                    if (data.result != 0) {
                        return callback(data);
                    }
                    callback(null, data);
                });
            },
            function (params, callback) {
                var message = {};
                message["winExp"] = 1000;
                message["winMoney"] = 2000;
                message["customSco"] = 0;
                message["customWin"] = 0;
                message["item"] = [];
                message["starNum"] = 3;

                self.pomelo.request("cs.roomHandler.CustomOver", message, function (data) {
                    logger.info('cs.roomHandler.CustomOver:%j', data);
                    if (data.result != 0) {
                        return callback(data);
                    }
                    callback(null, data);
                });
            }
        ],
        function (err, result) {
            logger.info('BeginMatchRival: error:%j, result:%j', err, result);
        }
    );
};

handler.BeginMatchRevenge = function () {
    var self = this;
    var type = Math.floor(Math.random() * 3);
    self.pomelo.request('cs.pvpHandler.BeginMatchRevenge', {'type': type}, function (data) {
        logger.info('cs.pvpHandler.BeginMatchRevenge:%j', data);
    });
};

handler.CustomOver = function () {
    var self = this;
    self.pomelo.request('cs.roomHandler.CustomOver', {'type': type}, function (data) {
        logger.info('cs.roomHandler.CustomOver:%j', data);
    });
};

handler.RequireBlessList = function () {
    var self = this;
    self.pomelo.request('cs.pvpHandler.RequireBlessList', {}, function (data) {
        logger.info('cs.pvpHandler.RequireBlessList:%j', data);
        var data = {
            blessLeft: 6,
            players: [
                {
                    roleId: 1111,
                    blessYou: false,
                    blessMe: true,
                    blessCount: 123
                },
                {
                    roleId: 2222,
                    blessYou: false,
                    blessMe: true,
                    blessCount: 123
                }
            ]
        };
    });
};

handler.Bless = function () {
    var self = this;
    var item = {'roleId': 132456};
    self.pomelo.request('cs.pvpHandler.Bless', item, function (data) {
        logger.info('cs.pvpHandler.Bless:%j', data);
    });
};

handler.RequireExchangeList = function () {
    var self = this;
    self.pomelo.request('cs.pvpHandler.RequireExchangeList', {}, function (data) {
        logger.info('cs.pvpHandler.RequireExchangeList:%j', data);
        var data = {
            items: [
                {
                    exchangeId: 1,
                    itemId: 1111,
                    itemCount: 10,
                    honor: 1324,
                    buyLeft: 3,
                    buyMax: 5,
                    lingli: 300
                },
                {
                    exchangeId: 1,
                    itemId: 1111,
                    itemCount: 1111,
                    honor: 1324,
                    buyLeft: 3,
                    buyMax: 5,
                    lingli: 300
                }
            ]
        };
    });
};
