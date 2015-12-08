/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-22
 * Time: 下午6:29
 * To change this template use File | Settings | File Templates.
 */
var mysql = require('mysql');

module.exports = function () {
    return new mysqlPool;
};

var mysqlPool = function () {

};

mysqlPool.prototype.createMysqlPool = function (config) {
    return mysql.createPool({
                                'connectionLimit': config.connectionLimit,
                                'user': config.user,
                                'password': config.password,
                                'host': config.host,
                                'database': config.database,
                                'port': config.port
                            });
};
