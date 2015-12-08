/**
 * Created by xykong on 2014/8/23.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('tencent-tss', __filename);
var utils = require('./../../utils');
var config = require('./../../config');
var ProtoBuf = require("protobufjs");
var net = require('net');
var util = require('util');
var Q = require('q');
var _ = require('underscore');

var builder = ProtoBuf.loadProtoFile(process.cwd() + "/config/tss.proto");

var TSS = builder.build('TSS');

var Handler = module.exports;

Handler.packageBuffer = new Buffer(1024 * 2);
Handler.packageOffset = 0;
/** buffer 最大长度 */
Handler.MAX_BUFFER_LENGTH = 1024 * 2;

/**
 * Ignore client error logs
 * @type {number}
 */
Handler.IGNORE_ERROR_MESSAGE_SECONDS = 1800;
Handler.lastErrorMessagePrintTime = 0;

Handler.printNoConfigErrorMessage = true;

var globalCallbacks = {};

Handler.getClient = function () {

    if (!!Handler.client) {
        return Q.resolve(Handler.client);
    }

    if (!config.tss || !!config.tss.disable) {
        if (!!Handler.printNoConfigErrorMessage) {
            Handler.printNoConfigErrorMessage = false;
            logger.warn('TSS client disabled: %j', config.tss);
        }
        return Q.reject();
    }

    var deferred = Q.defer();

    Handler.client = new net.Socket();
    Handler.client.connect(config.tss.port, config.tss.host, function () {

        logger.warn('TSS client connect to %s:%s OK!', config.tss.host, config.tss.port);

        return deferred.resolve(Handler.client);
    });

    Handler.client.on('data', Handler.onMessage);

    Handler.client.on('error', function (err) {

        if (Date.now() > Handler.lastErrorMessagePrintTime + Handler.IGNORE_ERROR_MESSAGE_SECONDS * 1000) {
            Handler.lastErrorMessagePrintTime = Date.now();
            logger.error('TSS client is error, remote server host: %s, port: %s, err: %s', config.tss.host,
                         config.tss.port, err.stack);
        }
        else {
            logger.info('TSS client is error, remote server host: %s, port: %s, err: %s', config.tss.host,
                        config.tss.port, err.stack);
        }

        return deferred.reject(err);
    });

    Handler.client.on('close', function () {
        logger.warn('TSS client Connection closed.');
        Handler.client = null;

        return deferred.reject('TSS client Connection closed.');
    });

    return deferred.promise;
};

Handler.onMessage = function (data) {

    logger.info('tss onMessage Handler.packageOffset: %s, data: %j', Handler.packageOffset, data);

    var offset = 0, end = data.length;

    if (end > Handler.MAX_BUFFER_LENGTH) {
        return;
    }

    data.copy(Handler.packageBuffer, Handler.packageOffset);
    Handler.packageOffset += data.length;

    var packageBuffer = null;

    while (Handler.packageOffset > 6 + offset) {

        var len = Handler.packageBuffer.readInt32LE(offset);
        var cmdId = Handler.packageBuffer.readInt16LE(offset + 4);

        if (!len || !cmdId) {
            logger.error('tss onMessage received invalid message len: %s, cmdId: %j, offset: %s, data: %j', len, cmdId,
                         offset, data);
            Handler.packageOffset = 0;
            return;
        }

        logger.info('tss onMessage len: %s, cmdId: %j, offset: %s', len, cmdId, offset);

        if (offset + len + 6 > Handler.packageOffset) {
            break;
        }

        packageBuffer = Handler.packageBuffer.slice(6 + offset, 6 + len + offset);
        offset += len + 6;

        Handler.dispatchMessage(cmdId, packageBuffer);
    }

    Handler.packageOffset -= offset;
    if (!!Handler.packageOffset) {
        Handler.packageBuffer.copy(Handler.packageBuffer, 0, offset, Handler.packageOffset + offset);
    }
};

Handler.dispatchMessage = function (cmdId, pkgBuffer) {

    logger.info('dispatchMessage message: %j, %j', cmdId, pkgBuffer);

    var pkg = null;

    try {
        switch (cmdId) {
            case TSS.GameCmdID.GAME_CMDID_ROLE_LIST:
                pkg = TSS.RoleList.decode(pkgBuffer);
                Handler.onRoleList(pkg);
                break;
            case TSS.GameCmdID.GAME_CMDID_TRANS_ANTI_DATA:
                pkg = TSS.TransAntiData.decode(pkgBuffer);
                Handler.onTransAntiData(pkg);
                break;
            case TSS.GameCmdID.GAME_CMDID_TRANS_ENCRYPT_DATA:
                pkg = TSS.TransEncryptData.decode(pkgBuffer);
                Handler.onTransEncryptData(pkg);
                break;
            default:
                new Error('Unsupported command:' + cmdId);
        }
    }
    catch (err) {
        logger.error('dispatchMessage failed: %s', utils.getErrorMessage(err));
    }

};

Handler.setCallback = function (id, callback) {

    logger.info('tssClient setCallback: %j, %j, %s', globalCallbacks, id, _.isFunction(callback));

    globalCallbacks[id] = callback;
};

Handler.onRoleList = function (pkg) {

    logger.info('onRoleList pkg: %j', pkg);

    if (_.isFunction(globalCallbacks['RoleList'])) {
        globalCallbacks['RoleList'](pkg);
    }
};

Handler.onTransAntiData = function (pkg) {

    logger.info('onTransAntiData pkg: %j', pkg);

    if (_.isFunction(globalCallbacks['TransAntiData'])) {
        globalCallbacks['TransAntiData'](pkg);
    }
};

Handler.onTransEncryptData = function (pkg) {

    logger.info('onTransEncryptData pkg: %j', pkg);

//    if (!pkg) {
//        return;
//    }

    //var cmdId = pkg.cmdid;
    //
    //Handler.dispatchMessage(cmdId, pkg.anti_data);
};

Handler.sendMessage = function (cmdId, pkg) {

    var self = this;
    logger.info('sendMessage cmdId: %s, pkg: %j', cmdId, pkg);

    return Handler.getClient()
        .then(function (client) {

                  var arrayBuffer = pkg.toArrayBuffer();

                  var bufHead = new Buffer(6);
                  bufHead.writeInt32LE(arrayBuffer.byteLength, 0);
                  bufHead.writeInt16LE(cmdId, 4);
                  //client.write(Buffer.concat([buf, new Buffer(new Uint8Array(arrayBuffer))]));

                  var bufBody = new Buffer(new Uint8Array(arrayBuffer));

                  //logger.warn('tss Client try write message: %j', self.arguments);
                  return Q.ninvoke(client, 'write', Buffer.concat([bufHead, bufBody]));
              });
};

Handler.sendLoginChannel = function (openid, roleid, message) {

    logger.info('sendLoginChannel openid: %s, roleid: %s, message: %j', openid, roleid, message);

    var pkg = new TSS.LoginChannel({
        head: {
            roleid: roleid,
            platid: config.vendors.tencent.platId,
            openid: openid
        },
        auth_signature: message.auth_signature,
        client_version: message.client_version
    });

    return Handler.sendMessage(TSS.GameCmdID.GAME_CMDID_LOGIN_CHANNEL, pkg);
};

Handler.sendLogoutChannel = function (openid, roleid, message) {

    logger.info('sendLoginChannel openid: %s, roleid: %s, message: %j', openid, roleid, message);

    var pkg = new TSS.LogoutChannel({
        head: {
            roleid: roleid,
            platid: config.vendors.tencent.platId,
            openid: openid
        },
        flag: message.flag
    });

    return Handler.sendMessage(TSS.GameCmdID.GAME_CMDID_LOGOUT_CHANNEL, pkg);
};

Handler.sendTransAntiData = function (openid, roleid, message) {

    logger.info('sendTransAntiData openid: %s, roleid: %s, message: %j', openid, roleid, message);

    var pkg = new TSS.TransAntiData({
        head: {
            roleid: roleid,
            platid: config.vendors.tencent.platId,
            openid: openid
        },
        anti_data_len: message.anti_data_len,
        anti_data: message.anti_data
    });

    return Handler.sendMessage(TSS.GameCmdID.GAME_CMDID_TRANS_ANTI_DATA, pkg);
};

Handler.sendTransEncryptData = function (openid, roleid, message) {

    logger.info('sendTransEncryptData openid: %s, roleid: %s, message: %j', openid, roleid, message);

    var pkg = new TSS.TransEncryptData({
        head: {
            roleid: roleid,
            platid: config.vendors.tencent.platId,
            openid: openid
        },
        anti_data_len: message.anti_data_len,
        anti_data: message.anti_data
    });

    return Handler.sendMessage(TSS.GameCmdID.GAME_CMDID_TRANS_ENCRYPT_DATA, pkg);
};