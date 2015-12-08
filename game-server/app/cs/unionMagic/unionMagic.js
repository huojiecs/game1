/**
 公会技能
 */
var gameConst = require('../../tools/constValue');
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var eMagicInfo = gameConst.ePlayerMagicInfo;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.magicInfo = new Array(eMagicInfo.Max);
    for (var i = 0; i < eMagicInfo.Max; ++i) {
        this.magicInfo[i] = 0;
    }
};

var handler = Handler.prototype;

/**
 * @return {null}
 */
handler.GetMagicInfo = function (Index) {
    if(Index >= 0 && Index < eMagicInfo.Max ){
        return this.magicInfo[Index];
    }
    logger.error('GetMagicInfo index not match %j', Index);

    return null;
};

handler.SetMagicAllInfo = function (magicInfo) {
    this.magicInfo = magicInfo;
};

handler.SetMagicInfo = function (Index, Value) {
    if(Index >= 0 && Index < eMagicInfo.Max ){
        this.magicInfo[Index] = Value;
    }
    else{
        logger.error('SetMagicInfo index not match %j', Index);
    }
};
