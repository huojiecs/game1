/**
 * Created by kazi on 14-3-13.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('anhei', __filename);
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var utils = require('./../utils');
var util = require('util');
var urlencode = require('urlencode');
var _ = require('underscore');

var ePlayerInfo = gameConst.ePlayerInfo;
var eItemInfo = gameConst.eItemInfo;
var eAttInfo = gameConst.eAttInfo;

var Handler = module.exports;

Handler.LoadList      = function (table, roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = [table, roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err);
        }

        var list = _.map(res[0], function (item) {
            return utils.values(item)
        });

        return callback(null, list);
    });
};

/***
 * 数据 加载 可以指定数据库
 *
 *  @param {String} table 表名
 *  @param {Number} roleID 玩家ID
 *  @param {Number} index  数据库下标
 *  @param {Function} callback
 * */
Handler.LoadListIndex = function (table, roleID, index, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = [table, roleID];
    gameClient.query(index, sql, args, function (err, res) {
        if (err) {
            return callback(err);
        }

        var list = _.map(res[0], function (item) {
            return utils.values(item)
        });

        return callback(null, list);
    });
};

Handler.SaveList            = function (table, roleID, data, callback) {
    var sql = 'CALL sp_saveList(?, ?, ?)';
    var sqlStr = Handler.BuildSqlValues(data);

    var args = [table, roleID, sqlStr];
    gameClient.query(roleID, sql, args, function (err) {
        if (!!err) {
            return callback(err);
        }

        return callback(null);
    });
};

/**
 *
 * */
Handler.SaveChartRewardList = function (table, roleID, chartType, data, callback) {
    var sql = 'CALL sp_saveChartRewardList(?, ?, ?, ?)';
    var sqlStr = Handler.BuildSqlValues(data);

    var args = [table, roleID, chartType, sqlStr];
    gameClient.query(roleID, sql, args, function (err) {
        if (!!err) {
            return callback(err);
        }

        return callback(null);
    });
};

Handler.LoadOne      = function (table, roleID, callback) {
    var sql = 'CALL sp_load(?,?)';
    var args = [table, roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            return callback(err);
        }

        var list = utils.values(res[0][0]);
        return callback(null, list);
    });
};

//把时间变成字符串
/**
 * @return {string}
 */
Handler.DateToString = function (dateTime) {
    var year = dateTime.getFullYear();
    var mouth = dateTime.getMonth() + 1;
    var day = dateTime.getDate();
    var hour = dateTime.getHours();
    var minute = dateTime.getMinutes();
    var second = dateTime.getSeconds();

    return util.format("%d-%d-%d %d:%d:%d", year, mouth, day, hour, minute, second);
};

Handler.StringToDate = function (dateTimeString) {
    var date = new Date(dateTimeString);

    if (isNaN(date.getTime())) {
        date = new Date();
    }

    return date;
};

Handler.BuildSqlStringFromObjects = function (objects, getItem, enums) {
    var self = this;
    return _.chain(objects)
        .compact()
        .map(function (item) {
                 var sql = [];
                 for (var i = 0; i < enums.Max; ++i) {
                     var func = null;
                     if (_.isFunction(getItem)) {
                         func = getItem;
                     }
                     else if (_.isString(getItem)) {
                         func = item[getItem];
                     }
                     if (func) {
                         var value = func.call(item, i);
                         sql.push(self.BuildSqlString(value));
                     }
                 }

                 return '(' + sql.join(',') + ')';
             })
        .value().join(',');
};

Handler.BuildSqlString           = function (item, lineSchema) {

    if (_.isArray(lineSchema)) {
        item = Handler.BuildValueToType(item, lineSchema);
    }

    if (_.isString(item)) {
        return util.format("'%s'", item);
    }

    if (_.isDate(item)) {
        if (isNaN(item.getTime())) {
            logger.warn('Invalid Date detected in BuildSqlValues, use current date instead: %j', item);
            return util.format("'%s'", Handler.DateToString(new Date()));
        }
        return util.format("'%s'", Handler.DateToString(item));
    }

    return item;
};

/**
 *
 * @param lineSchema
 * @returns {string}
 * @constructor
 */
Handler.BuildDefaultValue        = function (lineSchema) {

    if (!_.isArray(lineSchema)) {
        return '';
    }

    switch (lineSchema[1]) {
        case 'int':
        {
            return lineSchema[3] || 0;
        }
        case 'bigint':
        {
            return lineSchema[3] || 0;
        }
        case 'tinyint':
        {
            return lineSchema[3] || 0;
        }
        case 'varchar':
        {
            return lineSchema[3] || '';
        }
        case 'datetime':
        {
            if (lineSchema[3] == 'NOW') {
                return new Date();
            }
            return lineSchema[3] || '';
        }
        default:
            return '';
    }
};


/**
 *
 * @param item
 * @param lineSchema
 * @returns {*}
 * @constructor
 */
Handler.BuildValueToType         = function (item, lineSchema) {

    if (!_.isArray(lineSchema)) {
        return item;
    }

    switch (lineSchema[1]) {
        case 'int':
        {
            return +item || 0;
        }
        case 'bigint':
        {
            return +item || 0;
        }
        case 'tinyint':
        {
            return +item || 0;
        }
        case 'varchar':
        {
            return '' + item || '';
        }
        case 'datetime':
        {
            if (_.isDate(item)) {
                return item;
            }

            return Handler.StringToDate(item);
        }
        default:
            return '';
    }
};

/**
 *
 * @param items
 * @param schema
 * @returns {string}
 * @constructor
 */
Handler.BuildSqlValuesWithSchema = function (items, schema) {
    return _.map(items, function (item) {

        var eachLine = _.map(schema, function (lineSchema) {
            var key = lineSchema[0];

            if (key in item) {
                return Handler.BuildSqlString(item[key], lineSchema);
            }

            return Handler.BuildSqlString(Handler.BuildDefaultValue(lineSchema));
        });

        return '(' +
               eachLine.join(',')
               + ')';

    }).join(',');
};

/**
 * @return {string}
 */
Handler.BuildSqlValues           = function (list) {
    var self = this;
    return _.chain(list)
        .compact()
        .map(function (item) {
                 return '(' +
                        _.map(item, self.BuildSqlString).join(',')
                        + ')';
             }).value().join(',');
};

Handler.MysqlEscapeString = function (val) {
    val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function (s) {
        switch (s) {
            case "\0":
                return "\\0";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\b":
                return "\\b";
            case "\t":
                return "\\t";
            case "\x1a":
                return "\\Z";
            case "'":
                return "''";
            case '"':
                return '""';
            default:
                return "\\" + s;
        }
    });

    return val.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
};


/**
 * @return {string}
 */
Handler.MysqlEncodeString = function (val) {

    var returnString = '';

    try {
        returnString = urlencode.encode(val, 'utf8');
        returnString = Handler.MysqlEscapeString(returnString);
    }
    catch (e) {
        returnString = Handler.MysqlEscapeString(val);
    }

    return returnString;
};

/**
 * @return {string}
 */
Handler.MysqlDecodeString = function (val) {

    var returnString = '';

    try {
        returnString = urlencode.decode(val, 'utf8');
    }
    catch (e) {
        returnString = val;
    }

    return returnString;
};