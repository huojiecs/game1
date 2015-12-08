/**
 * Created by kazi on 14-3-24.
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tssManager = require('../../../cs/tencentSecuritySystem/tssManager');
var wxOauth = require("../../../tools/openSdks/tencent/wxOauth");
var assert = require("assert");
var templateManager = require('../../../tools/templateManager');
var templateConst = require('../../../../template/templateConst');
var defaultValues = require('../../../tools/defaultValues');
var playerManager = require('../../../cs/player/playerManager');
var gameConst = require('../../../tools/constValue');
var errorCodes = require('../../../tools/errorCodes');
var utils = require('../../../tools/utils');
var eMisType = gameConst.eMisType;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
};

var handler = Handler.prototype;

handler.Ping = function (msg, session, next) {
    return next(null, msg);
};

handler.TssAntiData = function (msg, session, next) {

//    logger.fatal('TssAntiData receive: %j', msg);

    var roleID = session.get('roleID');
    if (!roleID) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }

    var antiData = msg.antiData;
    var antiDataLen = +msg.antiDataLen;

    tssManager.recvTssAntiData(roleID, antiData, antiDataLen)
        .catch(function (err) {
                   logger.info('TssAntiData recvTssAntiData failed: %s', utils.getErrorMessage(err));
               })
        .done();

    return next(null, {
        result: errorCodes.OK
    });
};

handler.WxShare = function (msg, session, next) {       //微信分享
    var roleID = session.get('roleID');
    var attID = msg.attID;
    var fopenID = msg.fopenID;
    if (null == attID || null == fopenID) {
        return next(null, {result: errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (null == player) {
        return next(null, {
            'result': errorCodes.NoRole
        });
    }
    var wxShareTemplate = templateManager.GetTemplateByID('WxShareTemplate', attID);
    if (null == wxShareTemplate) {
        return next(null, {result: errorCodes.NoTemplate});
    }
    var token = player.token;
    var openID = player.openID;
    var extinfo = wxShareTemplate[templateConst.tWxShare.extinfo];
    var title = wxShareTemplate[templateConst.tWxShare.title];
    var description = wxShareTemplate[templateConst.tWxShare.description];
    var thumb_media_id = wxShareTemplate[templateConst.tWxShare.thumb_media_id];
    var media_tag_name = thumb_media_id == '' ? 'thumb' : '';
    wxOauth.wx(openID, token, fopenID, extinfo, title, description, media_tag_name, thumb_media_id,
               function (error, result) {
                   if (!!error || result.ret != 0) {
                       return next(null, {result: errorCodes.WxShareField});
                   }
                   player.GetMissionManager().IsMissionOver(eMisType.ShareSuccess, 0, 1);
                   return next(null, {result: 0});
               });


};




















