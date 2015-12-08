/**
 * The file jsSql.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/13 21:16:00
 * To change this template use File | Setting |File Template
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var _ = require('underscore');
var gameClient = require('./gameClient');
var utilSql = require('../../tools/mysql/utilSql');

var Handler = module.exports;

/**
 * 加载玩家jjc 相关数据
 * @param {string} table 表名
 * @param {number} roleID 玩家id
 * @param {function} callback 回调函数
 * */
Handler.LoadInfo = function (table, roleID, callback) {
    utilSql.LoadList(table, roleID, function (err, dataList) {
        callback(err, dataList);
    });
};

/**
 * 保存数据到数据ku, 1, 其他很多方法都是 只有表名不同通过传table 可以实现统一接口
 *                  2, insert into 'table' values (), ()...; 方式
 * @param {string} table 表名
 * @param {string} roleID 玩家id, 主键或联合主键之一，
 * @param {string} info 存储字符串
 * @param {function} callback 回调函数
 * @api public
 * */
Handler.SaveInfo = function (table, roleID, Info, callback) {
    var sql = 'CALL sp_saveList(?,?,?)';
    var args = [table, roleID, Info];
    gameClient.query(roleID, sql, args, function (err, res) {
        callback(err, res);
    });
};