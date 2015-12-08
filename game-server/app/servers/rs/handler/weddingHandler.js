/**
 * Created by chen on 15-7-1.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var playerManager = require('../../../rs/player/playerManager');
var weddingManager = require('../../../rs/marry/weddingManager');
var defaultValues = require('../../../tools/defaultValues');

module.exports = function() {
    return new Handler();
};

var Handler = function() {
};

var handler = Handler.prototype;

/** 搜索玩家姓名求婚 */
handler.FindNameToMarry = function(msg, session, next) {
    var roleID = session.get('roleID');
    var name = msg.name;
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.FindNameToMarry(roleID, name, next);

};

/** 结婚 基础信息界面*/
handler.GetMarryInfo = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.GetMarryInfo(roleID, next);
}

/** 预约婚礼 返回婚礼档次列表  和 当前预约情况 */
handler.GetWedding = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.GetWedding(roleID, next);
}


/** 预约婚礼 返回婚礼档次列表  和 当前预约情况 */
handler.YuYueWedding = function(msg, session, next) {
    var roleID = session.get('roleID');
    var wedID = +msg.wedID;
    var marryLevel = +msg.marryLevel;
    var bless = msg.bless;
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    if(!wedID || !marryLevel || !bless){
        return next(null, {'result': errorCodes.WEDDING_PARAMETER_NULL});
    }
    if(bless.length > defaultValues.wedding_jiyu || bless.length<1){
        return next(null, {'result': errorCodes.WEDDING_BLESS_BEYOND_LENGTH});
    }
    weddingManager.YuYueWedding(roleID, wedID, marryLevel, bless, next);
}

/** 获取爱的礼物 */
handler.GetMarryGiftInfo = function(msg, session, next) {
    var roleID = session.get('roleID');

    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.GetMarryGiftInfo(roleID, next);
}

/** 赠送爱的礼物 */
handler.GiveMarryGift = function(msg, session, next) {
    var roleID = session.get('roleID');
    var giftID = +msg.giftID;
    var giveType = +msg.giveType;

    if (typeof roleID !== 'number' || !giftID || !giveType) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.GiveMarryGift(roleID, giftID, giveType, next);
}

/** 进入婚礼 返回当前时段在结婚的所有信息 */
handler.BeginWedding = function(msg, session, next) {
    var roleID = session.get('roleID');

    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.BeginWedding(roleID, next);
}

/** 进入某一个婚礼 */
handler.ComingWedding = function(msg, session, next) {
    var roleID = session.get('roleID');
    var marryID = +msg.marryID;
    if (typeof roleID !== 'number' || !marryID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.ComingWedding(roleID, marryID, next);
}

/** 祝福某一个婚礼 */
handler.BlessWedding = function(msg, session, next) {
    var roleID = session.get('roleID');
    var marryID = +msg.marryID;
    if (typeof roleID !== 'number' || !marryID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.BlessWedding(roleID, marryID, next);
}

/** 领取某一个婚礼红包 */
handler.GetHongBao = function(msg, session, next) {
    var roleID = session.get('roleID');
    var marryID = +msg.marryID;
    if (typeof roleID !== 'number' || !marryID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.GetHongBao(roleID, marryID, next);
}


/** 获取夫妻日志 */
handler.GetMarryLog = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.GetMarryLog(roleID, next);
};

/** 标记已读取的夫妻日志 */
handler.ReadMarryLog = function(msg, session, next) {
    var roleID = session.get('roleID');
    var logID = +msg.logID;
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.ReadMarryLog(roleID, logID, next);
};

/** 排行榜操作 获取夫妻赠送礼物信息 */
handler.GetChartMarryGift = function(msg, session, next) {
    var roleID = session.get('roleID');
    var marryID = +msg.marryID;
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.GetChartMarryGift(marryID, next);
};


/** 购买特效 */
handler.BuyEffectWedding = function(msg, session, next) {
    var roleID = session.get('roleID');
    var effactID = +msg.effactID;
    if (typeof roleID !== 'number' || !effactID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.BuyEffectWedding(roleID, effactID, next);
}

/** 查看其他玩家結婚信息 */
handler.OtherMarryInfo= function(msg, session, next) {
    var roleID = session.get('roleID');
    var otherID = +msg.otherID;
    if (typeof roleID !== 'number' || !otherID) {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    weddingManager.OtherMarryInfo(otherID, next);
}