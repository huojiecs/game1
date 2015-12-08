/**
 * Created by xykong on 2014/9/12.
 */
var logger = require('pomelo-logger').getLogger("query", __filename);
var monitor = require('./../monitor');
var util = require('util');
var utils = require('./../utils');
var utilSql = require('./../../tools/utilSql');
var _ = require('underscore');
var mysql = require('mysql');
var envConfig = require('./../../../app/config/env.json');
var config = require('./../../../app/config/' + envConfig.env + '/config');

var Handler = module.exports = function (client, interval) {
    this.client = client;
    this.pomelo = client.pomelo;
    this.interval = interval;
};

var handler = Handler.prototype;

handler.run = function () {
    var self = this;

    self.connection = mysql.createConnection({
                                                 host: '188.188.0.162',
                                                 user: 'root',
                                                 password: 'mysql6666'
                                             });

    self.connection.connect();

    //self.connection.end();

    setInterval(
        function () {
            self.queryLogin();
            self.queryLogout();
            self.queryPay();
        }, self.interval);
};

handler.query = function (key, count, callback) {
    var self = this;
    utils.request(logger, self.pomelo, 'ps.playerHandler.QueryResult', {
        key: key,
        count: count
    }, function (data) {
        if (!data || data.result) {
            logger.error('QueryResult %s failed: %j', key, data);
            return utils.invokeCallback(callback, null, data);
        }

        if (!data.list) {
            return utils.invokeCallback(callback, null, data);
        }

        var values =
                _.map(data.list, function (item) {

                    var value = item.split(', ');
                    value.push(new Date(+value[0]));
                    value.push(config.gameServer.host);

                    logger.fatal('QueryResult %s: %j', key, value);

                    return value;
                });

        if (!values.length) {
            return utils.invokeCallback(callback, null, data);
        }

        values = utilSql.BuildSqlValues(values);

        var sql = util.format('INSERT INTO query_result.%s values %s', key, values);

        logger.info('QueryResult %s: sql: %j', key, sql);

        self.connection.query(sql, function (err, rows, fields) {
            logger.info('sql: %j, rows: %j, fields: %j, err: %j', sql, rows, fields, err);
        });

        return utils.invokeCallback(callback, null, data);
    });
};

handler.queryLogin = function () {
    var self = this;
    var key = 'login';
    var count = 2;
    self.query(key, count);
};

handler.queryLogout = function () {
    var self = this;
    var key = 'logout';
    var count = 2;
    self.query(key, count);
};

handler.queryPay = function () {
    var self = this;
    var key = 'pay';
    var count = 2;
    self.query(key, count);
};

