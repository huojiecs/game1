/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-26
 * Time: 下午1:55
 * To change this template use File | Settings | File Templates.
 */
/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-28
 * Time: 下午8:28
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var gameConst = require('../constValue');
var gameClient = require('./gameClient');
var accountClient = require('./accountClient');
var PLAYERINFO = gameConst.ePlayerInfo;

var Handler = module.exports;

Handler.LoadPlayerInfo = function (roleID, callback) {
    var sql = 'CALL sp_loadRoleInfo(?)';
    var args = [roleID];
    gameClient.query(roleID, sql, args, function (err, res) {
        if (err) {
            callback(err, []);
        }
        else {
            var playerIndex = 0;
            var playerInfo = new Array(PLAYERINFO.MAX);
            for (var aIndex in res[0][0]) {
                playerInfo[playerIndex] = res[0][0][aIndex];
                ++playerIndex;
                if (playerIndex >= PLAYERINFO.MAX) {
                    break;
                }
            }
            callback(null, playerInfo);
        }
    });
};
/*
 Handler.LoadCustomHold = function( callback ){
 var sql = 'CALL sp_loadCustomHold()';
 var args = [];
 gameClient.query(0, sql, args, function( err, res ){
 if( err ){
 callback( err, {} );
 }
 else{
 var customList = {};
 for( var aIndex in res[0] ) {
 var customID = res[0][aIndex]['customID'];
 var roleID = res[0][aIndex]['roleID'];
 var name = res[0][aIndex]['name'];
 var customSco = res[0][aIndex]['customSco'];
 var temp = {
 roleID : roleID,
 name: name,
 customSco: customSco
 };
 customList[ customID ] = temp;
 }
 callback( null, customList );
 }
 });
 };

 Handler.SaveCustomHold = function( customInfo, callback ){
 var sql = 'CALL sp_saveCustomHold( ? )';
 var args = [ customInfo ];
 gameClient.query(0, sql, args, function( err, res ){
 callback( err );
 });
 };
 */