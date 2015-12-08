/**
 * Created by Administrator on 14-9-29.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var unionManager = require('../../../us/union/unionManager');
var async = require('async');
var _ = require('underscore');
var Q = require('q');

module.exports = function () {
    return new Handler();
};


var Handler = function () {
};

var handler = Handler.prototype;

handler.getUnionList = function (msg, session, next) { //1、获取随机公会列表
    var roleID = session.get('roleID');
    var unionID = msg.unionID;//公会查找ID  输入值 或者是0
    if (null == roleID || null == unionID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.getUnionList(roleID, unionID, function (result) {
        return next(null, result);
    });
};

handler.createUnion = function (msg, session, next) {//2、创建公会
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    var unionName = msg.unionName;//公会查找ID  输入值 或者是0
    if (null == roleID || null == unionName || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.createUnion(csID, roleID, unionName, next);
};

handler.addUnion = function (msg, session, next) {//3、申请加入公会
    var roleID = session.get('roleID');
    var unionID = msg.unionID;//公会查找ID  输入值 或者是0
    var csID = session.get('csServerID');
    if (null == roleID || null == unionID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if(unionManager.getFightState() == 1){
        return next(null, {
            'result': errorCodes.UnionFightNotAllow
        });
    }

    unionManager.playerApplyUnion(roleID, unionID, function (result) {
        return next(null, result);
    });
};
handler.joinUnion = function (msg, session, next) {//4、进入公会(
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.joinUnion(csID, roleID, function (result) {
        return next(null, result);
    });
};
handler.unionMemberListPaging = function (msg, session, next) {//5、公会成员列表分页
    var roleID = session.get('roleID');
    var begenID = msg.begenID;
    var csID = session.get('csServerID');
    if (null == roleID || null == begenID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.unionMemberListPaging(csID,roleID, begenID, function (result) {
        return next(null, result);
    });

};

handler.unionLoggerListPaging = function (msg, session, next) {//6、查看日志
    var roleID = session.get('roleID');
    var begenID = msg.begenID;//公会查找ID  输入值 或者是0
    if (null == roleID || null == begenID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var result = unionManager.GetUnionLoggerListPaging(roleID, begenID);
    return next(null, result);
};

handler.editAnnouncement = function (msg, session, next) {//7、编辑公告
    var roleID = session.get('roleID');
    var announcement = msg.announcement;//公会查找ID  输入值 或者是0
    if (null == roleID || null == announcement) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var result = unionManager.editAnnouncement(roleID, announcement);
    return next(null, result);
};

handler.signOutUnion = function (msg, session, next) {//8、退出公会
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if(unionManager.getFightState() == 1){
        return next(null, {
            'result': errorCodes.UnionFightNotAllow
        });
    }

    unionManager.playerSignOutUnion(roleID, csID, function (result) {
        return next(null, result);
    });
};

handler.upgradeUnion = function (msg, session, next) {//9、公会升级
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.upgradeUnionInfo(roleID, function (result) {
        return next(null, result);
    });
};

handler.getApplyList = function (msg, session, next) {//10、公会申请列表
    var roleID = session.get('roleID');
    var begenID = msg.begenID;//公会查找ID  输入值 或者是0
    if (null == roleID || null == begenID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.getUnionApplyInfo(roleID, begenID, function (result) {
        return next(null, result);
    });
};
handler.refuseApply = function (msg, session, next) {//11、公会申请全部拒绝
    var roleID = session.get('roleID');
    var applyList = msg.applylist;
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.refuseAllApply(roleID, applyList, function (result) {
        return next(null, result);
    });
};

handler.passUnionApply = function (msg, session, next) {//12、通过公会加入申请
    var roleID = session.get('roleID');
    var playerID = msg.roleID;
    var csID = session.get('csServerID');
    if (null == roleID || null == playerID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if(unionManager.getFightState() == 1){
        return next(null, {
            'result': errorCodes.UnionFightNotAllow
        });
    }


    unionManager.playerAddUnion(csID, roleID, playerID, function (result) {
        return next(null, result);
    });
};

handler.robBoos = function (msg, session, next) {//13、弹劾会长
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.playerRobBoos(roleID, function (result) {
        return next(null, result);
    });
};

handler.makeUnionBoos = function (msg, session, next) {//14、转让会长
    var roleID = session.get('roleID');
    var playerID = msg.roleID;
    var csID = session.get('csServerID');
    if (null == roleID || null == playerID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.playerMakeUnionBoos(roleID, playerID, true, function (result) {
        return next(null, result);
    });
};


handler.takeOfficeMember = function (msg, session, next) {//15、普通会员升值 副会长  副会长 变成普通会员
    var roleID = session.get('roleID');
    var playerID = msg.roleID;
    var type = msg.type;
    if (null == roleID || null == playerID || null == type) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.boosTakeOfficeMember(roleID, playerID, type, function (result) {
        return next(null, result);
    });
};

handler.clearMember = function (msg, session, next) {//16、踢出公会
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    var playerID = msg.roleID;
    if (null == roleID || null == playerID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if(unionManager.getFightState() == 1){
        return next(null, {
            'result': errorCodes.UnionFightNotAllow
        });
    }

    unionManager.clearUnionMember(roleID, csID, playerID, function (result) {
        return next(null, result);
    });
};

/**
 * 获取工会商城列表
 ***/
handler.GetUnionShopInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var result = unionManager.GetUnionShopList(roleID);
    return next(null, result);
};

/**
* 购买工会商城物品
***/
handler.BuyUnionShopItems = function (msg, session, next) {
    var roleID = session.get('roleID');
    var goodsID = msg.attID;
    var csID = session.get('csServerID');
    if (null == roleID || null == goodsID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.BuyUnionShopGoods(roleID, goodsID, csID, next);
};

/**
 * 升级公会的公会技能
 ***/
handler.UpUnionMagicLevel = function (msg, session, next) {
    var roleID = session.get('roleID');
    var magicID = msg.attID;
    var csID = session.get('csServerID');
    if (null == roleID || null == magicID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.UpUnionMagicLevel(roleID, magicID, next);
};

/**
 * 升级自己的公会技能
 ***/
handler.UpPlayerMagicLevel = function (msg, session, next) {
    var roleID = session.get('roleID');
    var magicID = msg.attID;
    var csID = session.get('csServerID');
    if (null == roleID || null == magicID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.UpPlayerMagicLevel(roleID, magicID, next);
};


/**
 * 获取公会技能列表
 ***/
handler.GetUnionMagicInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    var result = unionManager.GetUnionMagicList(roleID);

    return next(null, result);
};

/**
 * 获取公会神殿信息
 ***/
handler.GetUnionTempleInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    /*

    var templeLevel = 1;                // 神殿等级
    var templeExp = 0;                  // 当前经验
    var lady1ItemID = 0;                // 1当前物品ID
    var lady1ItemNum = 0;               // 1当前物品等级
    var lady1PopNum = 0;                // 1人气值
    var lady1PopDouble = 0;             // 1人气倍率
    var lady1Offers = 0;                // 1祭拜人数
    var lady2ItemID = 0;                // 2当前物品ID
    var lady2ItemNum = 0;               // 2当前物品等级
    var lady2PopNum = 0;                // 2人气值
    var lady2PopDouble = 0;             // 2人气倍率
    var lady2Offers = 0;                // 2祭拜人数
    var lady3ItemID = 0;                // 3当前物品ID
    var lady3ItemNum = 0;               // 3当前物品等级
    var lady3PopNum = 0;                // 3人气值
    var lady3PopDouble = 0;             // 3人气倍率
    var lady3Offers = 0;                // 3祭拜人数

*/
    var result = unionManager.GetUnionTempleInfo(roleID);

    return next(null, result);
};

/**
 * 升级公会神殿
 ***/
handler.UpUnionTempleLevel = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.UpUnionTempleLevel(roleID, next);
};

/**
 * 敬供女神
 ***/
handler.OnLadyOffer = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    var ladyOrder = msg.attID;
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if(ladyOrder <= 0 || ladyOrder > 3){
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.OnLadyOffer(roleID, csID, ladyOrder, next);
};

/*
=====================================================================
        公会夺城战
=====================================================================
 */

/**
 * 获取公会神兽信息
 ***/
handler.GetUnionAnimalInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var result = unionManager.GetUnionAnimalInfo(csID, roleID);

    return next(null, result);
};

/**
 * 报名夺城战
 ***/
handler.OnRegisterFight = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var result = unionManager.OnRegisterFight(roleID);

    return next(null, result);
};

/**
 * 培养公会神兽
 ***/
handler.OnCultureAnimal = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    var opType = msg.attID;     // 0,1,2 攻防血，3，钻石培养，4升级技能
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    if(opType == null || opType < 0 || opType > 4){
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.CultureAnimal(csID, roleID, opType, next);
};

/**
 * 得到公会夺城正在进行的战斗数据
 ***/
handler.GetUnionFightInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.getUnionFightInfo(roleID, next);
};

/**
 * 得到成员伤害排行榜
 ***/
handler.GetMemberDamageRank = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.getMemberDamageRank(roleID, next);
};

/**
 * 得到公会伤害排行榜
 ***/
handler.GetUnionsDamageRank = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.getUnionsDamageRank(roleID, next);
};

/**
 * 领取每日占领奖励
 ***/
handler.GetDukeDailyAward = function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.getDukeDailyAward(roleID, csID, next);
};

/*
// GM指令，创建所有神兽
handler.onCreateAllAnimal = function(msg, session, next){
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.onCreateAllAnimal(roleID, next);
};


// GM指令，开启战斗
handler.onCreateDukeFight = function(msg, session, next){
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.createFight();

    return next(null, {
        'result': errorCodes.OK
    });
};

*/
/**
 * 公会可领红包列表
 ***/
handler.GetUnionGiftSendInfo = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.GetUnionGiftSendList(roleID, next);


};











/**
 *  领取其他玩家发送的公会红包
 ***/
handler.GetUnionGiftForPlayer = function (msg, session, next) {
    var roleID = session.get('roleID');
    var fromID = msg.fromID;
    if (null == roleID || null == fromID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.GetUnionGiftForPlayer(roleID,fromID,next);

};

/**
 *  土豪发放公会红包
 * */
handler.SendUnionGift = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.SendUnionGift(roleID,next);
};

/**
 * 获取是否可以获得炼狱积分
 * */
handler.getUnionLianYu = function (msg, session, next) {
    var roleID = session.get('roleID');
    if (null == roleID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }
    unionManager.GetUnionLianYu(roleID,next);
};

/**
 * 获取神兽培养日志
 ***/
handler.GetCultureLog= function (msg, session, next) {
    var roleID = session.get('roleID');
    var csID = session.get('csServerID');
    if (null == roleID || null == csID) {
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    var logPage = msg.attID;
    if(logPage == null || logPage < 0){
        return next(null, {
            'result': errorCodes.ParameterNull
        });
    }

    unionManager.getAnimalCultureLog(roleID, logPage, next);
};