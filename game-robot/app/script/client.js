/**
 * Created by kazi on 14-3-5.
 */
var logger = require('pomelo-logger').getLogger("client", __filename);
var utils = require('./utils');
var Pomelo = require('./pomelo');
var async = require('async');
var fs = require('fs');
var Player = require('./player');
var envConfig = require('./../../app/config/env.json');
var config = require('./../../app/config/' + envConfig.env + '/config');
var Q = require('q');
var _ = require('underscore');

var client = module.exports = function (id) {
    this.id = id;
    this.player = new Player(this);
    var seed = config.client.fixSeed ? id : new Date().getTime();
    this.player.myCheckID = utils.genCheckID(seed);

    if (config.client.fixCheckID && config.client.CheckID) {
        this.player.myCheckID = config.client.CheckID;
    }
    this.pomelo = new Pomelo();

    this.pomelo.on('io-error', function (error) {
        logger.error("Can not connect to server: %s:%s %j", config.gameServer.host, config.gameServer.port, error);
    });

    this.pomelo.on('close', function (error) {
        logger.error("Disconnect by server: %s:%s", config.gameServer.host, config.gameServer.port, error);
    });
};

var handler = client.prototype;

handler.sendGetRoleList = function (callback) {
    var self = this;
    logger.info('ps.loginHandler.GetRoleList');
    self.pomelo.request('ps.loginHandler.GetRoleList', {}, function (data) {
        logger.debug("ps.loginHandler.GetRoleList:%j", data);
        if (0 != data.result) {
            return callback({result: data.result});
        }

        callback(null, data);
    });
};

handler.processLogin = function (callback) {

    logger.info("handler.processLogin");

    var self = this;
    async.waterfall([
                        function (callback) {
//                // connect to list gate.
//                if (!!self.pomelo.socket) {
//                    return callback("No socket!");
//                }

                            logger.info('connecting to %s:%d with id:%s', config.gameServer.host,
                                        config.gameServer.port, self.player.myCheckID);
                            self.pomelo.init({host: config.gameServer.host, port: config.gameServer.port, log: true},
                                             function () {
                                                 callback(null);
                                             });

                        },
                        function (callback) {
                            // list gate enter.
                            logger.info('connector.entryHandler.Enter');
                            self.pomelo.request('connector.entryHandler.Enter', {checkID: self.player.myCheckID},
                                                function (data) {
                                                    logger.debug("%j", data);
                                                    if (1014 == data.result) {
                                                        self.pomelo.disconnect();        //断开连接

                                                        logger.info('reconnect to connector because:%d', data.result);

                                                        return callback(null, data);
                                                    }
                                                    else if (0 != data.result) {
                                                        return callback({result: data.result});
                                                    }
                                                    else {
                                                        logger.info('连接成功...');
                                                        return callback(null, data);
                                                    }
                                                });
                        },
                        function (params, callback) {
                            if (params.result == 1014) {
                                self.pomelo.init({
                                                     host: params.host,
                                                     port: params.port,
                                                     log: true
                                                 },
                                                 function () {
                                                     callback(null);
                                                 });
                            }
                            else {
                                return callback(null);
                            }
                        },
                        function (callback) {
                            // list login.
                            logger.info('ls.loginHandler.Login');
                            var data = {
                                accountType: 1, checkID: self.player.myCheckID, account: '', password: ''
                            };

                            //var data = {
                            //    accountType: 3,
                            //    checkID: self.player.myCheckID,
                            //    account: '',
                            //    password: '',
                            //    openID: '87FE6F42489F43C6BB1B336B707C236C',
                            //    token: 'D324EE2F76A93EBEBEB0E5B47BD3CD50'
                            //};

//                var data = {
//                    accountType: 4,
//                    checkID: self.player.myCheckID,
//                    account: '',
//                    password: '',
//                    openID: '1269321',
//                    token: 'sqdttr5a30qe6gnstsbnp2'
//                };
                            self.pomelo.request('ls.loginHandler.Login', data, function (data) {
                                logger.debug("ls.loginHandler.Login:%j", data);
                                if (0 != data.result) {
                                    logger.error('登录失败');
                                    return callback({result: data.result});
                                }

                                logger.info('登录成功...%j', data);
                                self.pomelo.disconnect();        //断开连接

                                if (data.serverList.length == 0) {
                                    return callback('List server return no serverList!');
                                }

                                callback(null, data);
                            });
                        },
                        function (params, callback) {
                            // game connect
                            params.checkID = self.player.myCheckID;

                            var selected = Math.floor(Math.random() * params.serverList.length);
                            logger.fatal('connecting to %s:%d with id:%s', params.serverList[selected].host,
                                         params.serverList[selected].port, params.checkID);
                            self.pomelo.init({
                                                 host: params.serverList[selected].host,
                                                 port: params.serverList[selected].port,
                                                 log: true
                                             }, function () {
                                callback(null, params);
                            });

                        },
//        function (params, callback) {
//            // game queryEntry
//            logger.info('gate.gateHandler.QueryEntry');
//            self.pomelo.request('gate.gateHandler.QueryEntry', {checkID: params.checkID}, function (data) {
//                self.pomelo.disconnect();
//
//                if (data.result != 0) {
//                    logger.info('gate.gateHandler.QueryEntry error:%j', data);
//                    return callback({result: data.result});
//                }
//
//                //logger.info('queryEnter ' + data.host + ' ' + data.port);
//
//                data.checkID = params.checkID;
//                data.accountID = params.accountID;
//                data.key = params.key;
//
//                callback(null, data);
//            });
//        },
//        function (params, callback) {
//            // game connect to connector
//            logger.info('connecting to game server connector');
//            self.pomelo.init({host: params.host, port: params.port, log: true}, function () {
//                callback(null, params);
//            });
//        },
                        function (params, callback) {
                            // game enter
                            logger.info('connector.entryHandler.Enter');
                            self.pomelo.request('connector.entryHandler.Enter',
                                                {checkID: params.checkID, versionID: '1.0.0.16790'}, function (data) {
                                    logger.debug("connector.entryHandler.Enter:%j", data);
                                    if (1014 == data.result) {
                                        self.pomelo.disconnect();        //断开连接

                                        logger.info('reconnect to connector because:%d', data.result);

                                        params.reconnect = true;
                                        params.host = data.host;
                                        params.port = data.port;
                                    }
                                    else if (0 != data.result) {
                                        return callback({result: data.result});
                                    }

                                    callback(null, params);
                                });
                        },
                        function (params, callback) {
                            if (params.reconnect) {
                                // game connect to connector
                                logger.fatal('connecting to game server %s:%d with id:%s', params.host, params.port);
                                self.pomelo.init({host: params.host, port: params.port, log: true}, function () {
                                    callback(null, params);
                                });
                            }
                            else {
                                callback(null, params);
                            }
                        },
                        function (params, callback) {
                            // game enter
                            logger.info('connector.entryHandler.Enter');
                            self.pomelo.request('connector.entryHandler.Enter', {checkID: params.checkID},
                                                function (data) {
                                                    logger.debug("connector.entryHandler.Enter:%j", data);

                                                    if (0 != data.result) {
                                                        return callback({result: data.result});
                                                    }

                                                    callback(null, params);
                                                });
                        },
                        function (params, callback) {
                            logger.info('ps.loginHandler.InitAccount');
                            self.pomelo.request('ps.loginHandler.InitAccount',
                                                {accountID: params.accountID, key: params.key}, function (data) {
                                    logger.debug("ps.loginHandler.InitAccount:%j", data);

                                    if (0 != data.result) {
                                        return callback({result: data.result});
                                    }

                                    self.player.accountID = params.accountID;

                                    callback(null);
                                });
                        },
                        function (callback) {
                            self.sendGetRoleList(callback);
                        },
                        function (params, callback) {
                            // create new player
                            // There is already one, so skip.
                            if (params.playerList.length != 0) {
                                return callback(null, params);
                            }

                            var roleName = utils.genRoleName();
                            logger.info('ps.loginHandler.CreateRole');
                            self.pomelo.request('ps.loginHandler.CreateRole', {tempID: 1, roleName: roleName},
                                                function (data) {
                                                    logger.debug("ps.loginHandler.CreateRole:%j", data);

                                                    if (0 != data.result) {
                                                        return callback({result: data.result});
                                                    }
                                                    self.sendGetRoleList(callback);
                                                });
                        },
                        function (params, callback) {
                            // check if there is some roles.
                            if (params.playerList.length == 0) {
                                return callback("Can't create roles.");
                            }

                            self.player = params.playerList[0];

                            logger.info('ps.playerHandler.InitGame');
                            self.pomelo.request('ps.playerHandler.InitGame', {"roleID": params.playerList[0][0]},
                                                function (data) {
                                                    logger.debug("ps.loginHandler.InitGame:%j", data);

                                                    if (0 != data.result) {
                                                        return callback({result: data.result});
                                                    }

                                                    self.player.roleID = params.playerList[0][0];
                                                    self.player.roleInfo = params.playerList[0];

                                                    logger.info('ps.playerHandler.InitGame: Ok!');
                                                    callback(null);
                                                });
                        },
                        function (callback) {
                            var message = utils.genCityPosition();
                            self.pomelo.request("cs.roomHandler.EnterScene", message, function (data) {
                                logger.info('cs.roomHandler.EnterScene:%j', data);
                                callback(null);
                            });
                        },
                        function (callback) {
                            callback(null);
                        },
                        function (callback) {
                            callback(null);
                        }],
                    function (err, result) {
                        // result now equals 'done'
                        if (!!err) {
                            logger.error("%j,%j", err, result);
                            return callback(err);
                        }

                        logger.info("Enter game done!");
                        callback();
                    }
    );
};

handler.run = function () {
    var self = this;

    logger.info("Run client with seed:%s", this.seed);

    self.processLogin(function (err) {
        if (!!err) {
            return logger.error("%j", err);
        }

        var dirName = process.cwd() + '/app/script/modules';
        var files = fs.readdirSync(dirName);

        files.forEach(function (file) {
            var filePath = dirName + '/' + file;
            if (!fs.statSync(filePath).isDirectory()) {
                var match = file.match('.*\.js$');
                if (match) {
                    var module = require(filePath);
                    var baseFilename = file.split('.')[0];
                    var interval = config.modulesInterval[baseFilename];
                    if (interval > 0) {
                        var runner = new module(self, interval);
                        runner.run();
                    }
                }
            }
        });

    });
};

