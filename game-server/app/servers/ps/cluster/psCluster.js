/**
 * Created by xykong on 2014/7/24.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var serverManager = require('./../../../ls/serverManager');
var utils = require('../../../tools/utils');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 *
 * @param id
 * @param accountID
 * @param checkID
 * @param callback
 * @constructor
 */
handler.NotifyLogin = function (id, accountID, checkID, callback) {

    logger.info('Receive NotifyLogin: %j.', arguments);

    pomelo.app.rpc.connector.conRemote.SetUserOut(null, 'frontendId', checkID, utils.done);
};
