/**
 * Created with JetBrains WebStorm.
 * User: kazi
 * Date: 13-10-12
 * Time: 下午2:45
 * To change this template use File | Settings | File Templates.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var utils = require('../../tools/utils');
var errorCodes = require('../../tools/errorCodes');
var playerManager = require('./../player/playerManager');
var globalFunction = require('../../tools/globalFunction');

module.exports = function () {
    return new Handler();
};

var Handler = function () {

    /**
     * rivalID : int
     * otherID : int
     * otherType : int
     */
    this.records = {};

};

var handler = Handler.prototype;

handler.GetRecord = function (key) {
    return this.records[key];
};

handler.SetRecord = function (key, value) {
//    this.records["rivalID"] = rivalID;
//    this.records["otherID"] = otherID;
//    this.records["otherType"] = otherType;
    this.records[key] = value;
};

handler.SetRecords = function (records) {
    this.records = records;
};

/**
 * @return {boolean}
 */
handler.IsValid = function () {

    var player = playerManager.GetPlayer(this.records["otherID"]);

    if (!player) {
        if (this.records["APvPAttackedNum"] >= defaultValues.aPvPAttackedNumMax) {
            return false;
        }
    }
    else {
        if (player.asyncPvPManager.attackedNum >= defaultValues.aPvPAttackedNumMax) {
            return false;
        }
    }

    return true;
};

handler.GetDetails = function (other, callback) {
    var self = this;

    pomelo.app.rpc.ps.psRemote.GetPvpDetails(null, self.records["otherID"], function (err, details) {
        if (!!err) {
            if (errorCodes.SystemBusy == err) {
                logger.warn('pomelo.app.rpc.ps.psRemote.GetDetails: otherID: %j, %s', self.records["otherID"],
                            utils.getErrorMessage(err));
            }
            else {
                logger.error('pomelo.app.rpc.ps.psRemote.GetDetails: otherID: %j, %s', self.records["otherID"],
                             utils.getErrorMessage(err));
            }
            return callback(err);
        }

        return callback(err, details);
    });
};
