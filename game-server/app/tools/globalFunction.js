/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-22
 * Time: 上午11:36
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var _ = require('underscore');
var util = require('util');
var templateManager = require('./templateManager');
var config = require('./config');
var templateConst = require('./../../template/templateConst');
var constValue = require('./constValue');
var eLevelTarget = constValue.eLevelTarget;
var eSmallType = constValue.eCustomSmallType
var config = require('./../tools/config');
var defaultValues = require('./defaultValues');

var Handler = module.exports;

var ExpID = 1000;
var YuanBao = 1002;
var Money = 1001;
var HpID = 4001;
var MpID = 4051;
var MoJing = 7001;
var ShenGuo = 7002;
Handler.YuanBaoID = 1002;
var LingliID = 1101;
Handler.HonorID = 1401;
var Physical = 15001;
var FriendPoint = 6001; //友情点
var SkillPoint = 1003;
var LuckSign = 6021; //幸运符 充值得到，幸运转盘会消耗
var SoulPvp = 1301;
var DevoteID = 1501;        // 公会贡献
var UnionPoint = 1605;      // 公会积分
var Animate = 1606;         // 公会活跃度
var UnionTempleExp = 1607;  // 公会神殿经验
var UnionLadyPop = 1608;  // 女神人气
var ExtraVipPoint = 1010;   // 额外vip点数，仅限ios服idip使用
var animalCoin = 1609;    // 神兽币
var petGeneralFrag = 17000; // 宠物万能碎片


/** 关卡内复活钻石消耗次数上限*/
var RELIVE_MAX_TIMES = 181;

/** 关卡内复活钻石消耗公式乘数*/
var RELIVE_BASE_ZUANSHI = 182;




Handler.GetShopFragment = function(){
    return templateManager.GetAllTemplate('FashionFragReturn');
};

// 消耗语音财产的ID
Handler.GetVoiceID = function(){
    return 5401;
};

// 这是修复BUG的活动ID
Handler.GetFixLingshiGiftID = function(){
    return 101;
};

Handler.GetFixDailyID = function(){
    return 102;
};

Handler.GetRerurnLingshiID = function(){
    return 103;
};

// 是否系统礼包
Handler.IsSysGiftID = function(giftID){
    return giftID == this.GetFixLingshiGiftID() || giftID == this.GetFixDailyID() || giftID == this.GetRerurnLingshiID();
};

/**
 * @return {number}
 */
Handler.GetStarPercent = function (starLevel) {
    var percentList = [0, 10, 20, 30, 50, 80, 120, 170, 230, 300, 400];
    if (starLevel >= 0 && starLevel < percentList.length) {
        return percentList[starLevel];
    }
    return 0;
};

//金钱、等级不满足时，学习技能消耗的元宝：
//A=技能学习等级，B=人物等级，C=技能消耗金币
//（1+A/30）*（if(A-B<0,0,A-B))*3+C/400 + 1
Handler.GetLearnSkillMoney = function (needLevel, expLevel, needMoney) {
    var level = needLevel - expLevel;
    if (level < 0) {
        level = 0;
    }
    var needMoney = (1 + Math.floor(needLevel / 30) ) * level * 3 + Math.floor(needMoney / 400) + 1;
    return {moneyID: YuanBao, moneyNum: needMoney};
};

//获得关卡中复活所需要的元宝数
Handler.GetReliveMoney = function (reliveNum) {
    /*if (reliveNum < 5) {
        var needMoney = Math.pow(2, reliveNum) * 20;
    } else {
        var needMoney = 100;
    }*/
    var allTemplate = templateManager.GetTemplateByID('AllTemplate', RELIVE_MAX_TIMES);
    if (reliveNum >= allTemplate['attnum']) {
        reliveNum = allTemplate['attnum'];
    }
    allTemplate = templateManager.GetTemplateByID('AllTemplate', RELIVE_BASE_ZUANSHI);
    var needMoney = (reliveNum + 1) * allTemplate['attnum'];
    //var needMoney = reliveNum * reliveNum * reliveNum + 4;
    return {moneyID: YuanBao, moneyNum: needMoney};
};

//获得金钱的编码
/**
 * @return {number}
 */
Handler.GetMoneyTemp = function () {
    return Money;
};

//获得经验的编码
/**
 * @return {number}
 */
Handler.GetExpTemp = function () {
    return ExpID;
};

//获得元宝的编码
/**
 * @return {number}
 */
Handler.GetYuanBaoTemp = function () {
    return YuanBao;
};

//获得竞技币的编码
/**
 * @return {number}
 */
Handler.GetSoulPvpTemp = function () {
    return SoulPvp;
};

//获得血瓶的编码
/**
 * @return {number}
 */
Handler.GetHpTemp = function () {
    return HpID;
};

//获得蓝瓶的编码
/**
 * @return {number}
 */
Handler.GetMpTemp = function () {
    return MpID;
};

//获得灵力的编码
/**
 * @return {number}
 */
Handler.GetLingliTemp = function () {
    return LingliID;
};

//获得体力的编码
/**
 * @return {number}
 */
Handler.GetPhysical = function () {
    return Physical;
};

//获得友情点的编码
/**
 * @return {number}
 */
Handler.GetFriend = function () {
    return FriendPoint;
};

//获得魔晶的编码
/**
 * @return {number}
 */
Handler.GetMoJingTemp = function () {
    return MoJing;
};

//获得神果的编码
/**
 * @return {number}
 */
Handler.GetShenGuoTemp = function () {
    return ShenGuo;
};

//获得技能点的编码
/**
 * @return {number}
 */
Handler.GetSkillPoint = function () {
    return SkillPoint;
};

//获得幸运符
Handler.GetLuckSign = function () {
    return LuckSign;
};

//获得公会贡献度
Handler.GetDevoteID = function () {
    return DevoteID;
};

//获得公会积分
Handler.GetUnionPoint = function () {
    return UnionPoint;
};

//获得公会活跃度
Handler.GetAnimation = function () {
    return Animate;
};

//获得公会神殿经验
Handler.GetUnionTempleExp = function () {
    return UnionTempleExp;
}

//获得公会女神人气
Handler.GetUnionLadyPop = function () {
    return UnionLadyPop;
}

Handler.GetExtraVipPoint = function() {
    return ExtraVipPoint;
};

//获得神兽币
Handler.GetAnimalCoin = function () {
    return animalCoin;
}

// 获得宠物万能碎片ID
Handler.GetPetGeneralFragID = function(){
    return petGeneralFrag;
};

//获取字符串Ascii码数量
/**
 * @return {number}
 */
Handler.GetStringAsciiNum = function (str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        len += str.charCodeAt(i) > 256 ? 2 : 1;
    }
    return len;
};

//获取合成灵石消耗的数量
Handler.GetSynthesizeStarMoney = function (starLevel) {
    var needMoney = starLevel * starLevel * starLevel + 4;
    return {moneyID: Money, moneyNum: needMoney};
};

//获得灵石合成的列表
/**
 * @return {number}
 */
Handler.GetSynthesizeStarNext = function (starID) {
    var starList = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010];
    var starIndex = -1;
    for (var index in starList) {
        if (starID == starList[index]) {
            starIndex = index + 1;
            break;
        }
    }
    return starList[starIndex];
};

//获得强化装备消耗的金币数量
Handler.GetIntensifyMoney = function (Level) {
    var needMoney = Level * Level * Level + 4;
    return {moneyID: Money, moneyNum: needMoney};
};

//////////////////////////////////获得账户可使用字符///////////////////////////////////////////////////////
/**
 * @return {boolean}
 */
Handler.IsValidAccount = function (str) {
    if (typeof str != 'string') {
        return false;
    }
    var pattern = /^([a-zA-Z0-9]|[_.\-@]){4,16}$/;
    return pattern.test(str);
};

/**
 * @return {boolean}
 */
Handler.IsValidPassword = function (str) {
    if (typeof str != 'string') {
        return false;
    }
//    var pattern = /^([a-zA-Z0-9]|[_]){6,16}$/;
    var pattern = /^([a-zA-Z0-9 \`\~\!\@\#\$\%\^\&\*\(\)\-\_\=\+\{\[\}\]\|\\\:\;\"\'\<\,\>\.\?\/]){6,16}$/;
    return pattern.test(str);
};

/**
 * @return {boolean}
 */
Handler.IsValidEmail = function (str) {
    if (typeof str != 'string') {
        return false;
    }
//    var pattern = /^([a-zA-Z0-9]|[_]){6,16}$/;
    var pattern = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
    return pattern.test(str);
};

/**
 * @return {boolean}
 */
Handler.IsValidSupportUTF8Code = function (str) {
    if (typeof str != 'string') {
        return false;
    }

    var o = [], n = 0, q = str.length, r, m;
    while (n < q) {
        r = str.charCodeAt(n++);
        if (r >= 55296 && r <= 56319 && n < q) {
            m = str.charCodeAt(n++);
            if ((m & 64512) == 56320) {
//                            o.push(((r & 1023) << 10) + (m & 1023) + 65536)
//                o.push(str[n - 2] + str[n - 1]);
                if (Buffer.byteLength(str[n - 2] + str[n - 1], 'utf8') >= 4) {
                    return false;
                }
            } else {
//                            o.push(r);
//                o.push(str[n - 1]);
                if (Buffer.byteLength(str[n - 1], 'utf8') >= 4) {
                    return false;
                }
                n--
            }
        } else {
//                        o.push(r)
            if (Buffer.byteLength(str[n - 1], 'utf8') >= 4) {
                return false;
            }
//            o.push(str[n - 1]);
        }
    }

//    return o
    return true;
};

/**
 * @return {boolean}
 */
Handler.IsValidRoleName = function (str) {

    if (typeof str != 'string') {
        return false;
    }
    var strLen = this.GetStringAsciiNum(str);

//    if (defaultValues.operatorType == 1) {
//        // 北美
//        if (strLen > 20 || strLen < 4) {
//            return false;
//        }
//    }
//    else {
//        if (strLen > 10 || strLen < 4) {
//            return false;
//        }
//    }
    var roleNameLenMax =  defaultValues.roleNameLenMax;
    if (strLen > roleNameLenMax || strLen < 4) {
            return false;
        }

    var NoTalk = templateManager.GetAllTemplate('NoTalk');
    for (var index in NoTalk) {
        if (str.indexOf(NoTalk[index]) >= 0) {
            return false;
        }
    }

    if (!Handler.IsValidSupportUTF8Code(str)) {
        return false;
    }

//    if (defaultValues.operatorType == 1) {
//        // 北美 名字中可以含有空格，但是名字首尾不能用空格
//        if (str[0]==' ' || str[str.length-1]==' ') {
//            return false;
//        }
//        var tempStr = str.replace(/\x20/g, '');
//        return !tempStr.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
//    }
//    else {
//        //    排除非单词字符
//        return !str.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
//    }
    if(defaultValues.isCheckName){
        if (str[0]==' ' || str[str.length-1]==' ') {
            return false;
        }
        str = str.replace(/\x20/g, '');
    }
    return !str.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
};
Handler.IsValidUnionName = function (str) {

    if (typeof str != 'string') {
        return false;
    }
    var strLen = this.GetStringAsciiNum(str);
    if (strLen > 14 || strLen < 4) {
        return false;
    }
    var NoTalk = templateManager.GetAllTemplate('NoTalk');
    for (var index in NoTalk) {
        if (str.indexOf(NoTalk[index]) >= 0) {
            return false;
        }
    }

    if (!Handler.IsValidSupportUTF8Code(str)) {
        return false;
    }

//    if (defaultValues.operatorType == 1) {
//        // 北美 名字中可以含有空格，但是名字首尾不能用空格
//        if (str[0]==' ' || str[str.length-1]==' ') {
//            return false;
//        }
//        var tempStr = str.replace(/\x20/g, '');
//        return !tempStr.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
//    }
//    else {
//        //    排除非单词字符
//        return !str.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
//    }
    if(defaultValues.isCheckName){
        if (str[0]==' ' || str[str.length-1]==' ') {
            return false;
        }
        str = str.replace(/\x20/g, '');
    }
    return !str.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
};

Handler.IsValidAnyName = function (str, maxLen) {
    if (typeof str != 'string') {
        return false;
    }
    var strLen = this.GetStringAsciiNum(str);
    if (strLen > maxLen) {
        return false;
    }
    var NoTalk = templateManager.GetAllTemplate('NoTalk');
    for (var index in NoTalk) {
        if (str.indexOf(NoTalk[index]) >= 0) {
            return false;
        }
    }

    if (!Handler.IsValidSupportUTF8Code(str)) {
        return false;
    }

    return !str.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
};

Handler.IsValidUnionAnnouncement = function (str) {

    if (typeof str != 'string') {
        return false;
    }
    var strLen = this.GetStringAsciiNum(str);
//    if (defaultValues.operatorType == 1) {
//        // 北美
//        if (strLen > 80 || strLen < 1) {
//            return false;
//        }
//    }
//    else {
//        if (strLen > 60 || strLen < 1) {
//            return false;
//        }
//    }
    var announcement = defaultValues.announcement;
    if (strLen > announcement || strLen < 1) {
            return false;
        }
    var NoTalk = templateManager.GetAllTemplate('NoTalk');
    for (var index in NoTalk) {
        if (str.indexOf(NoTalk[index]) >= 0) {
            return false;
        }
    }

    if (!Handler.IsValidSupportUTF8Code(str)) {
        return false;
    }

//    排除非单词字符
//    return !str.match(/[`~!@#$%^&*()_+<>?:"{},.\\\/;'\s\t\]]/);
    return true; //采用 MysqlEncodeString 在存储时做处理
};
Handler.VersionCompare = function (ver1, ver2) {
    var strVer1 = ver1.split('.');
    var strVer2 = ver2.split('.');
    var maxLen = Math.max(strVer1.length, strVer2.length);
    var result, sa, sb;
    for (var i = 0; i < maxLen; i++) {
        sa = ~~strVer1[i];
        sb = ~~strVer2[i];
        if (sa > sb) {
            result = 1;
        }
        else if (sa < sb) {
            result = -1;
        }
        else {
            result = 0;
        }
        if (result !== 0) {
            return result;
        }
    }
    return result;
};

//////////////////////////////////获取关卡物品//////////////////////////////////////////////
Handler.GetCustomItemList = function (customID, customLevel) {
    var itemList = {
        winMoney: 0,
        winExp: 0,
        expNum: 0,
        item: {}
    };
    var CustomTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (null == CustomTemplate) {
        return itemList;
    }
    itemList.winMoney = CustomTemplate['winMoney'];
    itemList.winExp = CustomTemplate['winExp'];
    var npcListID = CustomTemplate['npcListID'];
    var LevelNpcListTemplate = templateManager.GetTemplateByID('LevelNpcListTemplate', npcListID);
    if (null == LevelNpcListTemplate) {
        return itemList;
    }
    var npcList = [];
    for (var trunkIndex = 0; trunkIndex < 20; ++trunkIndex) {
        var npcTrunkID = LevelNpcListTemplate['npcTrunk_' + trunkIndex];
        while (npcTrunkID > 0) {
            var LevelNpcTemplate = templateManager.GetTemplateByID('LevelNpcTemplate', npcTrunkID);
            if (null != LevelNpcTemplate) {
                for (var npcIndex = 0; npcIndex < 20; ++npcIndex) {
                    var npcID = LevelNpcTemplate['npcID_' + npcIndex];
                    if (npcID > 0) {
                        npcList.push(npcID);
                    }
                }
            }
            npcTrunkID = LevelNpcTemplate['nextID'];
        }
    }
    var dropList = [];
    for (var npcIndex in npcList) {
        var npcID = npcList[npcIndex];
        var NpcTemplate = templateManager.GetTemplateByID('NpcTemplate', npcID);
        if (null != NpcTemplate) {
            itemList.expNum += NpcTemplate['dropExp'];
            for (var dropIndex = 1; dropIndex <= 10; ++dropIndex) {
                var dropID = NpcTemplate['dropID_' + dropIndex];
                if (dropID > 0) {
                    dropList.push(dropID);
                }
            }
        }
    }
    for (var dropIndex in dropList) {
        var dropID = dropList[dropIndex];
        var DropTemplate = templateManager.GetTemplateByID('DropTemplate', dropID);
        if (null != DropTemplate) {
            var subType = DropTemplate['subType'];
            var dropType = DropTemplate['dropType'];
            if (subType == 0) {
                for (var itemIndex = 1; itemIndex <= 10; ++itemIndex) {
                    var itemID = DropTemplate['dropID_' + itemIndex];
                    if (itemID > 0) {
                        var randomNum = Math.floor(Math.random() * 100);
                        var dropPercent = DropTemplate['dropPercent_' + itemIndex];
                        var dropNum_Min = DropTemplate['dropNum_Min_' + itemIndex];
                        var dropNum_Max = DropTemplate['dropNum_Max_' + itemIndex];
                        if (randomNum < dropPercent) {
                            var cutNum = dropNum_Max - dropNum_Min;
                            if (cutNum >= 0) {
                                cutNum = Math.floor(Math.random() * cutNum) + dropNum_Min;
                                if (itemList.item[itemID] == null) {
                                    itemList.item[itemID] = cutNum;
                                }
                                else {
                                    itemList.item[itemID] += cutNum;
                                }
                            }
                        }
                    }
                }
            }
            else {
                var randomNum = Math.floor(Math.random() * 100);
                for (var itemIndex = 1; itemIndex <= 10; ++itemIndex) {
                    var itemID = DropTemplate['dropID_' + itemIndex];
                    var dropPercent = DropTemplate['dropPercent_' + itemIndex];
                    var dropNum_Min = DropTemplate['dropNum_Min_' + itemIndex];
                    var dropNum_Max = DropTemplate['dropNum_Max_' + itemIndex];
                    if (itemID > 0) {
                        if (randomNum < dropPercent) {
                            var cutNum = dropNum_Max - dropNum_Min;
                            if (cutNum >= 0) {
                                cutNum = Math.floor(Math.random() * cutNum) + dropNum_Min;
                                if (itemList.item[itemID] == null) {
                                    itemList.item[itemID] = cutNum;
                                }
                                else {
                                    itemList.item[itemID] += cutNum;
                                }
                            }
                            break;
                        }
                        else {
                            randomNum -= dropPercent;
                        }
                    }
                }
            }
        }
    }
    return itemList;
};

// 这里对LevelTarget和smallType进行枚举映射
Handler.isLegalLevelTarget = function (levelTarget, customID) {
    var customTemplate = templateManager.GetTemplateByID('CustomTemplate', customID);
    if (customTemplate == null) {
        logger.error('customID cant find %j',customID);
        return false;
    }

    var smallType = customTemplate['smallType'];
    if(levelTarget == null || smallType == null){
        logger.error('levelTarget or  smallType is null find %j, %j ',levelTarget,smallType );
        return false;
    }

    var matched = false;

    switch (levelTarget) {
        case eLevelTarget.Normal :
            matched = (smallType == eSmallType.Single || smallType == eSmallType.Hell || smallType == eSmallType.Team );
            break;
        case eLevelTarget.Activity:
            matched = (smallType == eSmallType.Activity);
            break;
        case eLevelTarget.TeamDrak:
            matched = (smallType == eSmallType.TeamDrak);
            break;
        case eLevelTarget.Climb:
            matched = (smallType == eSmallType.Climb);
            break;
        case eLevelTarget.ZhanHun:
            matched = (smallType == eSmallType.ZhanHun);
            break;
        case eLevelTarget.NewPlayer:
            matched = (smallType == eSmallType.NewCus);
            break;
        case eLevelTarget.FaBao:
            matched = (smallType == eSmallType.SoulCus);
            break;
        case eLevelTarget.Ares:
            matched = (smallType == eSmallType.Arena);
            break;
        case eLevelTarget.SoulPVP:
            matched = (smallType == eSmallType.SoulPVP);
            break;
        case eLevelTarget.Train:
            matched = (smallType == eSmallType.Train);
            break;
        case eLevelTarget.SoulEvolve:
            matched = (smallType == eSmallType.SoulEvolve);
            break;
        case eLevelTarget.unionFight:
            matched = (smallType == eSmallType.unionFight);
            break;
        case eLevelTarget.JJC:
            matched = (smallType == eSmallType.JJC);
            break;
        case eLevelTarget.worldBoss:
            matched = (smallType == eSmallType.WorldBoss);
            break;
        case eLevelTarget.Coliseum:
            matched = (smallType == eSmallType.Coliseum);
            break;
        case eLevelTarget.marry:
            matched = (smallType == eSmallType.Marry);
            break;
		case eLevelTarget.StoryDrak:
            matched = (smallType == eSmallType.StoryDrak);
            break;
        default :
            break;
    }

    if(matched == false){
        logger.error('levelTarget and smallType is not match %j, %j ',levelTarget, smallType );
    }
    return matched;
};

// 是否检测怪物是否全部杀死
Handler.isNeedCheckMonster = function(smallType){
    return smallType == eSmallType.Hell ||
        smallType == eSmallType.StoryDrak
        ;
};

Handler.GetUseServerUId = function (srcServerUid) {
    if (!srcServerUid) {
        return srcServerUid;
    }
    srcServerUid = +srcServerUid;
    var mList = config.mergeServerList;
    if (!mList) {
        logger.error('config.mergeServerList is null...');
        return srcServerUid;
    }
    for (var index in mList) {
        var serverUidList = _.map(mList[index], function(value, key){
            return value['serverUid'];
        });
        if (-1 != serverUidList.indexOf(srcServerUid)) {
            return +index;
        }
    }
    return srcServerUid;
};