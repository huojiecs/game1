/**
 * Created by Administrator on 13-12-3.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var config = require('./../config');
var logClient = require('./logClient');
var constValue = require('../constValue');
var eTableTypeInfo = constValue.eTableTypeInfo;


var Handler = module.exports;

/*
 * 函数功能：构造sql语句并执行
 * @tableType：数据表的类型
 * @paramList：参数列表的数组
 * 返回值：NULL
 * */
Handler.InsertSql = function (tableType, paramList) {

    if (!config.mysql.log || !config.mysql.global.enableLog) {
        return;
    }

    if (tableType < eTableTypeInfo.Chat || tableType >= eTableTypeInfo.Max) {  //检测下标索引的合法性
        return;
    }
    var tableName = ['logchat', 'logfriend', 'logmail', 'logitemchange', 'logmoneychange',
                     'logbuyevent', 'loggameover', 'logrelive', 'logskill', 'log_exp',
                     'logsmeltsoul', 'logsoullevelchange', 'logmission', 'logniudan'];   //数据表名列表
    var sql = 'INSERT INTO ' + tableName[tableType] + ' VALUES(';
    var args = [];
    for (var index in paramList) {   //构造sql语句和参数
        sql += '?,';
        args.push(paramList[index]);
    }
    sql = sql.substring(0, sql.length - 1);  //去掉参数中的最后一个逗号
    sql += ');';
    logClient.query(sql, args, function (err, res) {
        if (err) {
            logger.error('insLogSql.js InserSql sql:%j, args:%j, error:%s, stack:%s', sql, args, err.message,
                         err.stack);
        }
    });
};