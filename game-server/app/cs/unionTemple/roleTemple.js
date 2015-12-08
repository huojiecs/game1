
/**
 * 公会神殿管理
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var utilSql = require('../../tools/mysql/utilSql');
var templateManager = require('../../tools/templateManager');
var defaultValues = require('../../tools/defaultValues');
var templateConst = require('../../../template/templateConst');
var csSql = require('../../tools/mysql/csSql');
var errorCodes = require('../../tools/errorCodes');
var ePlayerInfo = gameConst.ePlayerInfo;
var eAssetsReduce = gameConst.eAssetsChangeReason.Reduce;
var eAttInfo = gameConst.eAttInfo;
var eRoleTempleInfo = gameConst.eRoleTempleInfo;
var _ = require('underscore');


var log_getGuid = require('../../tools/guid');
var log_insLogSql = require('../../tools/mysql/insLogSql');
var eMoneyChangeType = gameConst.eMoneyChangeType;
var eTableTypeInfo = gameConst.eTableTypeInfo;
var log_utilSql = require('../../tools/mysql/utilSql');

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.freeTimes = 0;     // 免费敬供次数
    this.buyTimes = 0;      // 购买次数
    this.cultureTimes = 0;  // 神兽钻石培养次数
    this.animalPrize = 0;  // 是否领取了每日奖励
};

var handler = Handler.prototype;


handler.LoadDataByDB = function (dataList) {
    var self = this;
    if (null != dataList && dataList.length > 0) {
        self.freeTimes = dataList[eRoleTempleInfo.freeTimes];
        self.buyTimes = dataList[eRoleTempleInfo.buyTimes];
        self.cultureTimes = dataList[eRoleTempleInfo.cultureTimes];
        self.animalPrize = dataList[eRoleTempleInfo.animalPrize];
    }
};

handler.GetSqlStr = function (roleID) {
    var info = '';
    info += '(';
    info += roleID
        + ',' + this.freeTimes
        + ',' + this.buyTimes
        + ',' + this.cultureTimes
        + ',' + this.animalPrize
    ;
    info += ')';
    return info;
};

// 是否还有免费次数
handler.CanOffer = function (ladyOrder) {
    var ret = {
        ret : false
    };
    var times = 0;
    var unionTemplate = templateManager.GetTemplateByID('UnionLevelTemplate', 1001);
    if(unionTemplate == null){
        return ret;
    }

    if(ladyOrder == 1){
        times = this.freeTimes % 10;
    }
    else if(ladyOrder == 2){
        times = (this.freeTimes / 10) % 10;
    }
    else if(ladyOrder == 3){
        times = this.freeTimes / 100;
    }
    var ladyID1 = unionTemplate['ladyID1'] * 100 + 1;

    var ladyTemplate = templateManager.GetTemplateByID('UnionLadyTemplate', ladyID1);;

    if(ladyTemplate == null){
        return ret;
    }

    ret.ret = times < ladyTemplate['freeTimes'];

    return ret;
}

// 是否可以消费
handler.CanConsume = function(ladyOrder){

    var ret = {
        ret : false
    };

    var vipLevel = this.owner.GetPlayerInfo(ePlayerInfo.VipLevel);
    var vipTemplate = null;
    if (null == vipLevel || vipLevel == 0) {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', 1);
    } else {
        vipTemplate = templateManager.GetTemplateByID('VipTemplate', vipLevel + 1);
    }
    if (null == vipTemplate) {
        return ret;
    }

    var maxTimes = vipTemplate['buyLadyOffer'];
    var times = 0;
    if(ladyOrder == 1){
        times = this.buyTimes % 100;
    }
    else if(ladyOrder == 2){
        times = (this.buyTimes / 100) % 100;
    }
    else if(ladyOrder == 3){
        times = this.buyTimes / 10000;
    }
    else{
        return ret;
    }

    ret.ret = times < maxTimes;

    return ret ;

}

// 增加免费次数
handler.OnOffer = function(ladyOrder){
    if(ladyOrder == 1){
        ++this.freeTimes;
    }
    else if(ladyOrder == 2){
        this.freeTimes += 10;
    }
    else if(ladyOrder == 3){
        this.freeTimes += 100;
    }
}

// 增加付费次数
handler.OnAddConsume = function(ladyOrder){
    if(ladyOrder == 1){
        ++this.buyTimes;
    }
    else if(ladyOrder == 2){
        this.buyTimes += 100
    }
    else if(ladyOrder == 3){
        this.buyTimes += 10000;
    }
}

handler.GetCultureTimes = function(){
    return this.cultureTimes;
}


handler.AddCultureTimes = function(){
    ++this.cultureTimes;
}

handler.GetAnimalPrizeTimes = function(){
    return this.animalPrize;
}


handler.AddAnimalPrizeTimes = function(){
    ++this.animalPrize;
}


// 12点定时更新
handler.Update12Info = function () {

    this.freeTimes = 0;         // 神殿免费敬供次数
    this.buyTimes = 0;          // 神殿购买次数
    this.cultureTimes = 0;      // 神兽培养次数
    this.animalPrize = 0;       // 夺城战每日奖励

    // 周日默认已经领取
    var day = new Date().getDay();
    if(day == 0){
        this.animalPrize = 1;
        this.SendTempleMsg();
    }else{
        var self =this;
        pomelo.app.rpc.us.usRemote.CanGetDailyAward(null, this.owner.GetPlayerInfo(ePlayerInfo.ROLEID), function(err, result){
            if(err != null){
                return;
            }
            self.animalPrize = result.result;
            self.SendTempleMsg();
        })
    }

};

// 发送消息给玩家
handler.SendTempleMsg = function () {
    var player = this.owner;
    if (null == player) {
        logger.error('SendTempleMsg');
        return;
    }
    var route = 'SendTempleMsg';
    var self = this;

    var retMsg = {
        'freeTimes' : self.freeTimes,
        'buyTimes' : self.buyTimes,
        'cultureTimes' : self.cultureTimes,
        'animalPrize' : self.animalPrize
    };

    player.SendMessage(route, retMsg);
};
