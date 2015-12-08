/**
 * Created by xykong on 2014/7/29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var accountClient = require('./accountClient');
var account_globalClient = require('./account_globalClient');
var errorCodes = require('../errorCodes');

var Handler = module.exports;

Handler.GetInfoByRoleID = function (roleID, openId, serverUid, callback) {
    var sql = 'CALL sp_idip_getInfoByRoleID(?, ?, ?)';
    var args = [roleID, openId, serverUid];

    account_globalClient.query(0, sql, args, function (err, res) {
        if (!!err) {
            return callback(err, errorCodes.SystemWrong);
        }

        return callback(null, res[0][0]);
    });
};
