/**
 * Created by kazi on 14-3-13.
 */

var logger = require('pomelo-logger').getLogger("utilSql", __filename);
var util = require('util');
var _ = require('underscore');

var Handler = module.exports;

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

Handler.BuildSqlString = function (item) {

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
 * @return {string}
 */
Handler.BuildSqlValues = function (list) {
    var self = this;
    return _.chain(list)
        .compact()
        .map(function (item) {
                 return '(' +
                        _.map(item, self.BuildSqlString).join(',')
                        + ')';
             }).value().join(',');
};
