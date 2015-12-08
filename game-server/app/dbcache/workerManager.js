/**
 * Created by kazi on 2014/6/13.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('../tools/config');
var MysqlWorker = require('../tools/mysql/mysqlWorker');
var _ = require('underscore');
var Q = require('q');
var util = require('util');
var utils = require('../tools/utils');
var errorCodes = require('../tools/errorCodes');
var defaultValues = require('../tools/defaultValues');
var Handler = module.exports;

Handler.Init = function (callback) {
    logger.fatal("*****dbcatch add version check !!!!! ");
    //throw new Error("*****Error: databases version error!!!!!!!!!");
    /**
     * 添加校验数据库版本号
     * **/
    //var accountVersion = config.mysql.account["versionNum"];
    //var gAccountVersion = config.mysql.account_global["versionNum"];
    // game = config.mysql.game["versionNum"];

    //logger.fatal("*****accountVersion : %j,gAccountVersion :%j , gameVersion:%j  ", accountVersion, gAccountVersion, game );
    //版本号
    var versionList = [];
    var jobs = [];
    var sqlStr = 'CALL sp_getDbVersion();';
    var args = [];
    var dbinfo = [];

    Handler.wokers = {};

    if (_.isArray(config.mysql.account)) {
        logger.fatal("*****dbcatch isArray !!!!! !!!!! ");
        _.each(config.mysql.account, function (eachAccount) {
            var tempCon = _.clone(eachAccount);
            if (!tempCon) {
                return;
            }

            if (tempCon.connectionLimit > 0) {
                _.each(tempCon.index, function (eachIndex) {
                    tempCon = _.clone(eachAccount);
                    var clientName = 'accountClient' + eachIndex;
                    tempCon.database = tempCon.database + eachIndex;
                    Handler.wokers[clientName] = new MysqlWorker(tempCon);
                    if("false" != defaultValues.account_versionNum){
                        versionList.push(defaultValues.account_versionNum);
                        jobs.push(Q.ninvoke(Handler.wokers[clientName], "query", 0, sqlStr, args));
                        dbinfo.push(Handler.wokers[clientName].config);
                    }

                });
            }
        });
    }
    else {  //对象
        if (config.mysql.account && config.mysql.account.connectionLimit > 0) {
            Handler.wokers.accountClient = new MysqlWorker(config.mysql.account);
            if("false" != defaultValues.account_versionNum){
                versionList.push(defaultValues.account_versionNum);
                jobs.push(Q.ninvoke(Handler.wokers.accountClient, "query", 0, sqlStr, args));
                dbinfo.push(Handler.wokers.accountClient.config);
//                var accountVersion = Handler.wokers.accountClient.query(0, sqlStr, args, function (err, res) {
//                    if(!err && !!res){
//                        logger.fatal("***** jobs 000 : , version: %j ",  res[0][0]["versionNum"]);
//                    }
//                });

            }
        }
    }

    if (_.isArray(config.mysql.game)) {
        for (var index in config.mysql.game) {
            var tempCon = _.clone(config.mysql.game[index]);
            if (!tempCon) {
                continue;
            }
            if (tempCon.connectionLimit > 0) {
                for (var i in tempCon.index) {
                    tempCon = _.clone(config.mysql.game[index]);
                    var clientName = 'gameClient' + tempCon.index[i];
                    tempCon.database = tempCon.database + tempCon.index[i];
                    Handler.wokers[clientName] = new MysqlWorker(tempCon);
                    if("false" != defaultValues.game_versionNum){
                        versionList.push(defaultValues.game_versionNum);
                        jobs.push(Q.ninvoke(Handler.wokers[clientName], "query", 0, sqlStr, args));
                        dbinfo.push(Handler.wokers[clientName].config);
                    }
                }
            }
        }
    }
    else {  //对象
        if (config.mysql.game && config.mysql.game.connectionLimit > 0) {
            Handler.wokers.gameClient = new MysqlWorker(config.mysql.game);
            if("false" != defaultValues.game_versionNum){
                versionList.push(defaultValues.game_versionNum);
                jobs.push(Q.ninvoke(Handler.wokers.gameClient, "query", 0, sqlStr, args));
                dbinfo.push(Handler.wokers.gameClient.config);
            }
        }
    }
    if (config.mysql.log && config.mysql.log.connectionLimit > 0) {
        Handler.wokers.logClient = new MysqlWorker(config.mysql.log);
        //logger.fatal("***** jobs 333 : , version: %j ", config.mysql.log["checkVersion"]);
        if("false" != defaultValues.log_versionNum){
            versionList.push(defaultValues.log_versionNum);
            jobs.push(Q.ninvoke(Handler.wokers.logClient, "query", 0, sqlStr, args));
            dbinfo.push(Handler.wokers.logClient.config);
        }
    }

    if (config.mysql.tbLog && config.mysql.tbLog.connectionLimit > 0) {
        Handler.wokers.tbLogClient = new MysqlWorker(config.mysql.tbLog);
        if("false" != defaultValues.tbLog_versionNum){
            versionList.push(config.mysql.tbLog.versionNum);
            jobs.push(Q.ninvoke(Handler.wokers.tbLogClient, "query", 0, sqlStr, args));
            dbinfo.push(Handler.wokers.tbLogClient.config);
        }
    }

    if (config.mysql.cmge_payment && config.mysql.cmge_payment.connectionLimit > 0) {
        Handler.wokers.cmge_paymentClient = new MysqlWorker(config.mysql.cmge_payment);
        if("false" != defaultValues.cmge_payment_versionNum){
            versionList.push(defaultValues.cmge_payment_versionNum);
            jobs.push(Q.ninvoke(Handler.wokers.cmge_paymentClient, "query", 0, sqlStr, args));
            dbinfo.push(Handler.wokers.cmge_paymentClient.config);
        }
    }

    if (config.mysql.account_global && config.mysql.account_global.connectionLimit > 0) {   //account_global库
        Handler.wokers.account_globalClient = new MysqlWorker(config.mysql.account_global);
        if("false" != defaultValues.account_global_versionNum) {
            versionList.push(defaultValues.account_global_versionNum);
            jobs.push(Q.ninvoke(Handler.wokers.account_globalClient, "query", 0, sqlStr, args));
            dbinfo.push(Handler.wokers.account_globalClient.config);
        }
    }

    /* if (config.mysql.game_global && config.mysql.game_global.connectionLimit > 0) {   //game_global库
     Handler.wokers.game_globalClient = new MysqlWorker(config.mysql.game_global);
     }
     */
    this.roleGameQueque = {};   //玩家执行sql的队�?
    var error = "";
    var checkOK = true;
    Q.all(jobs).then(function (versions) {
        for(var i in versions){
            //logger.fatal("***** versionList : %j , versions: %j , i : %j ",versionList[i], versions[i][0][0]["versionNum"], i );
            if(!!versions[i][0][0] && versionList[i] != versions[i][0][0]["versionNum"]){
                logger.fatal("***** versionList:%j  Dont equals !!!  versions : %j , dbinfo: %j ",versionList[i], versions[i][0][0]["versionNum"], dbinfo[i] );
                error = "***** DB version Dont equals !!! versionConfig : "+versionList[i]+", dbVersions : "+versions[i][0][0]["versionNum"]+", database : "+ dbinfo[i]["database"];
                //return callback(errorCodes.ParameterWrong);
                checkOK = false;
            }
        }
        if(checkOK){
            return callback();
        }else{
            var exec = require('child_process').exec;
            exec('pomelo kill -P 26090',
                function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                });
            logger.error(error);
            //return callback(new Error("dbVersion Dont equals Error! ! !"), null);
        }
    })
        .catch(function (err) {
            logger.error("error when CheckMysqlVersion  %s", utils.getErrorMessage(err));
            //return callback(errorCodes.ParameterWrong);
            var exec = require('child_process').exec;
            exec('pomelo kill -P 26090',
                function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log('exec error: ' + error);
                    }
                });
            logger.error(error);

        })
        .done();


};

Handler.getQueryCount = function () {

    return _.reduce(Handler.wokers, function (memo, item) {
        return memo + item.getStatus().queryCount;
    }, 0);
};

Handler.accountQuery = function (accountID, sql, args, callback) {
    var clientName = 'accountClient';
    if (config.mysql.account instanceof Array) {    //数组
        var index = accountID % config.mysql.global.dbMod;
        clientName = 'accountClient' + index;
        //clientName = 'accountClient' + 0;
    }
    if (!Handler.wokers[clientName]) {
        return callback(new Error('Mysql Account DB ConnectionLimit is not set or zero!'));
    }
    Handler.wokers[clientName].query(0, sql, args, callback);
};

Handler.gameQuery = function (roleID, sql, args, callback) {
    var self = this;
    var clientName = 'gameClient';
    if (_.isArray(config.mysql.game)) {
        var index = roleID % config.mysql.global.dbMod;
        clientName = 'gameClient' + index;
        //clientName = 'gameClient' + 0;
    }
    if (!roleID) {
        Handler.wokers[clientName].query(roleID, sql, args, function (err, res) {
            return callback(err, res);
        });
        return;
    }


    if (!this.roleGameQueque[roleID]) {
        this.roleGameQueque[roleID] = [];
    }
    var argTemp = {
        'id': roleID,
        'sql': sql,
        'args': args,
        'cb': callback
    };
    this.roleGameQueque[roleID].push(argTemp);

    if (!Handler.wokers[clientName]) {
        return callback(new Error('Mysql Game DB ConnectionLimit is not set or zero!'));
    }

    if (1 == this.roleGameQueque[roleID].length) {
        var execSql = function () {
            if (self.roleGameQueque[roleID][0]['id'] != roleID) {
                return callback(null, new Error('gameQuery queue error: roleID is different: ' + roleID,
                                                +self.roleGameQueque[roleID][0]['id']));
            }

            if (self.roleGameQueque[roleID].length > 5) {
                logger.warn('gameQuery roleGameQueque roleID: %s, length: %s', roleID,
                            self.roleGameQueque[roleID].length);
            }

            var savedSql = self.roleGameQueque[roleID][0]['sql'];
            var savedArgs = self.roleGameQueque[roleID][0]['args'];
            var savedCallback = self.roleGameQueque[roleID][0]['cb'];
            Handler.wokers[clientName].query(roleID, savedSql, savedArgs, function (err, res) {
                if (!!err && err.errno == 1040) {
                    setTimeout(function () {
                        execSql();
                    }, 100);
                } else {
                    self.roleGameQueque[roleID].splice(0, 1);
                    if (!!self.roleGameQueque[roleID].length) {
                        process.nextTick(function () {
                            execSql();
                        });
                    }
                    return savedCallback(err, res);
                }
            });
        };
        execSql();
    }
};

Handler.logQuery = function (sql, args, callback) {
    if (!Handler.wokers.logClient) {
        return callback(new Error('Mysql Log DB ConnectionLimit is not set or zero!'));
    }
    Handler.wokers.logClient.query(0, sql, args, callback);
};


Handler.tbLogQuery = function (roleID, sql, args, callback) {
    if (!Handler.wokers.tbLogClient) {
        return callback(new Error('Mysql Log DB ConnectionLimit is not set or zero!'));
    }
    Handler.wokers.tbLogClient.query(0, sql, args, callback);
};


Handler.cmge_paymentQuery = function (roleID, sql, args, callback) {
    if (!Handler.wokers.cmge_paymentClient) {
        return callback(new Error('Mysql Log DB ConnectionLimit is not set or zero!'));
    }
    Handler.wokers.cmge_paymentClient.query(0, sql, args, callback);
};


Handler.account_globalQuery = function (accountID, sql, args, callback) {
    if (!Handler.wokers.account_globalClient) {
        return callback(new Error('Mysql Log DB ConnectionLimit is not set or zero!'));
    }
    Handler.wokers.account_globalClient.query(0, sql, args, callback);
};

/*
 Handler.game_globalQuery = function (roleID, sql, args, callback) {
 if (!Handler.wokers.game_globalClient) {
 return callback(new Error('Mysql Log DB ConnectionLimit is not set or zero!'));
 }
 Handler.wokers.game_globalClient.query(0, sql, args, callback);
 };
 */

