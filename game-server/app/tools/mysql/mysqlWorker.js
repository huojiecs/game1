/**
 * Created by kazi on 2014/6/13.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var mysqlPoolModule = require('./mysql-pool');
var utils = require('./../utils');
var defaultValues = require('./../defaultValues');
var _ = require('underscore');

var Handler = function (config) {
    var mysqlPool = mysqlPoolModule();
    this.config = config;
    this.pool = mysqlPool.createMysqlPool(config);
    this.status = {
        queryCount: 0
    };
};

module.exports = Handler;

var handler = Handler.prototype;

handler.getStatus = function () {
    return this.status;
};

handler.query = function (roleID, sql, args, callback) {

    var self = this;
    var err = null;

    if (!sql || !_.isString(sql)) {
        err = new Error('Error in sql' + sql);
        logger.error("Sql query error sql is null or not string. database: %s roleID: %s, sql: %j, args: %j, err: %s",
                     self.config.database, roleID, sql, args, utils.getErrorMessage(err));
        return callback(err);
    }

    if (!args || !_.isArray(args)) {
        err = new Error('Error in sql' + sql);
        logger.error("Sql query error args is null or not array. database: %s roleID: %s, sql: %j, args: %j, err: %s",
                     self.config.database, roleID, sql, args, utils.getErrorMessage(err));
        return callback(err);
    }

    self.pool.getConnection(function (err, client) {
        if (!!err) {
            logger.error("Sql query error database: %s roleID: %s, sql: %j, args: %j, err: %s", self.config.database,
                         roleID, sql, args, utils.getErrorMessage(err));
            return callback(err);
        }
        logger.debug('mysqlWorker: database: %s roleID: %s, sql: %j, args: %j, queryCount: %s', self.config.database,
                     roleID, sql, args, self.status.queryCount);

        if (!client) {
            logger.error("No available client get from pool: database: %s roleID: %s, sql: %j, args: %j, err: %s",
                         self.config.database, roleID, sql, args, utils.getErrorMessage(err));
            return callback(err);
        }

        ++self.status.queryCount;

        var profiler = utils.profiler();
        client.query(sql, args, function (err, res) {

            --self.status.queryCount;

            profiler.check(defaultValues.mysqlWorkerProfilerCheckSeconds, logger,
                           'mysqlWorker database profiler: %s roleID: %s, sql: %j, args: %j, queryCount: %s',
                           self.config.database, roleID, sql, args, self.status.queryCount);

            if (!!err) {
                logger.error("Sql query error database: %s roleID: %s, sql: %j, args: %j, err: %s",
                             self.config.database, roleID, sql, args, utils.getErrorMessage(err));
            }

            logger.debug('mysqlWorker query result database: %s roleID: %s, sql: %j, args: %j, res: %j',
                         self.config.database, roleID, sql, args, res);

            self.pool.releaseConnection(client);

            return callback(err, res);
        });
    });
};

handler.shutdown = function () {
    var self = this;
    if (self.pool) {
        self.pool.end();
    }
};