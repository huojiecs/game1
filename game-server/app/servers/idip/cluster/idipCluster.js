/**
 * Created by xykong on 2014/7/28.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var idipCenter = require('./../../../idip/idipCenter');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.Register = function (id, msg, callback) {
    var result = idipCenter.Register(msg);

    logger.warn('Register new idip server msg: %j, id: %j, result: %j', msg, id, result);

    return callback(null, {result: result});
};

handler.UnRegister = function (id, msg, callback) {
    var serverUid = msg.serverUid;

    var result = idipCenter.UnRegister(serverUid);

    logger.warn('UnRegister idip server serverUid: %j, result: %j, msg: %j, id: %j', serverUid, result, msg, id);
    return callback(null, {result: result});
};

handler.idip_query_user_info_req = function (id, msg, callback) {

    return callback(null, msg);
};
