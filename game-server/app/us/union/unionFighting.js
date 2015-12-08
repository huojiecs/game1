/**
 * Created by bj on 2015/3/26.
 * 公会夺城战
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../tools/errorCodes');
var utils = require('../../tools/utils');
var Q = require('q');
var _ = require('underscore');
var async = require('async');
var constValue = require('../../tools/constValue');
var defaultValues = require('../../tools/defaultValues');
var config = require('../../tools/config');
var utilSql = require('../../tools/mysql/utilSql');
var gameConst = require('../../tools/constValue');
var redisManager = require('../../us/chartRedis/redisManager');
var playerManager = require('../../us/player/playerManager');
var templateManager = require('../../tools/templateManager');
var stringValue = require('../../tools/stringValue');
var unionIOController = require('./unionIOController');
var unionAnimal = require('./unionAnimal');
var unionManager = require('./unionManager');
var eUnionAnimal = gameConst.eUnionAnimal;
var sUsString = stringValue.sUsString;
var FightTimer = 30 * 60 * 1000;        // 战斗持续的时间  毫秒数

module.exports = function () {
    return new Handler();
};

// 构造
var Handler = function () {
    this.InitFight();
};


var handler = Handler.prototype;


//初始化
handler.InitFight = function(){
    this.fightState = 0;                           // 0未开始，1，进行中
    this.definderAnimal = new unionAnimal();       // 守城的世界BOSS或者公会神兽 守城神兽一定存在
    this.attackerAnimals = [];                     // 攻城的世界BOSS
    this.LiftTime = 0;                             // 剩余战斗结束时间  毫秒数
    this.intervalID = 0;                           // 战场结束定时器时间
};

handler.getFightState = function(){
    return this.fightState;
};

handler.getLeftTimer = function(){
    return this.LiftTime;
};

// 创建NPC神兽
handler.createNpcAnimal = function(fixID){
    var unionFixTemplate = templateManager.GetTemplateByID('UnionFixTemplate', fixID);
    if(unionFixTemplate == null){
        return false;
    }

    var animal = this.definderAnimal;

    animal.SetAnimalInfo(eUnionAnimal.unionID, 0);
    animal.SetAnimalInfo(eUnionAnimal.unionName, '');
    animal.SetAnimalInfo(eUnionAnimal.fixTempID, parseInt(fixID));
    animal.SetAnimalInfo(eUnionAnimal.isDefender, 1);

    animal.refreshPowerful();
    return true;
};

// 设置防守神兽
handler.setDefAnimal = function(defAnimal){
    this.definderAnimal = defAnimal;
};

// 设置进攻神兽组
handler.setAtkAnimal = function(atkAnimals){
    for(var i = 0; i < atkAnimals.length && i < 5; ++i){
        this.attackerAnimals.push(atkAnimals[i]);
    }
};

// 发给客户端的消息
handler.toMessage = function(attackTimes){
    var info = {
        fightState : this.fightState,
        LiftTime :this.LiftTime,
        attackTimes : attackTimes != null ? attackTimes : 0,
        definderAnimal : this.definderAnimal.toMessage()
    };

    var atkAnimal = [];
    for(var i = 0; i < this.attackerAnimals.length; ++i){
        atkAnimal.push(this.attackerAnimals[i].toMessage());
    }

    if(atkAnimal.length > 0){
        info.attackerAnimals = atkAnimal;
    }

    return info;
};

// 时间到战斗结束
handler.fightTimer = function(){
    this.LiftTime -= 1000;
    if(this.LiftTime <= 0){
        this.fightEnd(true);
    }
};

// 创建成功
handler.created = function(){
    this.fightState = 1;
    this.LiftTime = FightTimer;
    var self = this;
    this.intervalID = setInterval(function(){
        self.fightTimer();
    }, 1000);


    this.definderAnimal.refreshPowerful();
    for(var i = 0; i < this.attackerAnimals.length; ++i){
        this.attackerAnimals[i].refreshPowerful();
    }

    pomelo.app.rpc.rs.rsRemote.SetDukeUnionID(null, this.definderAnimal.GetAnimalInfo(eUnionAnimal.unionID), function(err, result){

    });

    this.printStartLogger();
};

// 夺城战结束
handler.fightEnd = function(isTimeout){
    this.fightState = 0;
    clearInterval(this.intervalID);
    // 计算排名和城主
    var retArray = unionManager.CalFightFinal();
    // 非超时结束的，设置新城主
    if(isTimeout == false){
        if(this.definderAnimal.IsAlive() == false){
            if(retArray[1] != null){
                unionManager.setDukeUnion(retArray[1]);
            }
        }
        for(var playerID in playerManager.GetAllPlayer()){
            unionManager.SendFightEnd(playerID);
        }
    }

    // 获得占领奖励
    var dukeID = 0;
    if(unionManager.dukeUnion != null){
        dukeID = unionManager.dukeUnion['unionID'];
        this.onGetDukeAward(dukeID);
    }

    logger.fatal('union duke fight is end by %j ,and new duke is %j', isTimeout, dukeID);

    this.printEndLogger();

    unionManager.deleteAllUnionAnimal();
    unionManager.makeSortMemDamage();
    unionIOController.SaveUnionMemFightDamage();
    unionIOController.SaveUnionsDamage();
    this.saveMemberDamageRank();

    pomelo.app.rpc.rs.rsRemote.dukeFightEnd(null, dukeID, function(err, result){

    });
};

// 造成伤害 造成者公会ID，打的哪个神兽，造成多少伤害
handler.onDamaged = function(unionID, animalOrder, damage){
    if(this.fightState != 1){
        return;
    }

    if(unionID == null || unionID <= 0 || damage == null || damage <= 0){
        return;
    }

    if(unionID != this.definderAnimal.GetAnimalInfo(eUnionAnimal.unionID)){
        var currHp = this.definderAnimal.GetAnimalInfo(eUnionAnimal.currHPValue) - damage;
        if(currHp <= 0){
            this.definderAnimal.SetAnimalInfo(eUnionAnimal.currHPValue, 0);
            this.fightEnd(false);
        }else{
            this.definderAnimal.SetAnimalInfo(eUnionAnimal.currHPValue, currHp);
        }
    }else{
        if(animalOrder >= this.attackerAnimals.length){
            return;
        }

        var thisAnimal = this.attackerAnimals[animalOrder];
        if(thisAnimal.IsAlive() == false){
            return;
        }

        var currHp = thisAnimal.GetAnimalInfo(eUnionAnimal.currHPValue) - damage;
        if(currHp <= 0){
            thisAnimal.SetAnimalInfo(eUnionAnimal.currHPValue, 0);
            this.onGetKillAward(unionID);
            if(animalOrder == this.attackerAnimals.length - 1){
                this.fightEnd(false);
            }else{
                this.onAnimalKilled(unionID, animalOrder);
            }
        }else{
            thisAnimal.SetAnimalInfo(eUnionAnimal.currHPValue, currHp);
        }
    }
};

// 创建邮件副本
function createMail(mailTemplate){
    if(mailTemplate == null){
        return;
    }

    var mailDetail = {
        subject: mailTemplate.subject,
        mailType: mailTemplate.mailType,
        content: mailTemplate.content
    };

    mailDetail.items = mailTemplate.items;

    return mailDetail;
}

handler.onAnimalKilled = function(unionID, animalOrder){
    var unionMembers = unionManager.getMemberList(unionID);
    var unionInfo = unionManager.GetUnion(unionID);
    if(unionInfo == null){
        return;
    }

    var route = 'SendAnimalKilled';
    var Msg = {
        animalOrder : animalOrder
    };

    for(var roleID in unionMembers){
        if(unionMembers[roleID] <= 0){
            continue;
        }

        var player = playerManager.GetPlayer(roleID)
        if(player != null){
            player.SendMessage(route, Msg);
        }
    }
};


// 获得击杀奖励
handler.onGetKillAward = function(unionID){
    var UnionAwardTemplate = templateManager.GetTemplateByID('UnionAwardTemplate', 1003);
    if(UnionAwardTemplate == null){
        return;
    }

    var mailDetail = {
        subject: sUsString.subject3,
        mailType: gameConst.eMailType.System,
        content: sUsString.content_7,
        items: []
    };
    var leaderMail = {
        subject: sUsString.subject3,
        mailType: gameConst.eMailType.System,
        content: sUsString.content_7,
        items: []
    };

    for(var i = 1; i < 5; ++i){
        var itemID = UnionAwardTemplate['itemID' + i];
        var itemNum = UnionAwardTemplate['itemNum' + i];
        if(itemID <= 0 || itemNum <= 0){
            break;
        }
        mailDetail.items.push([itemID, itemNum]);
        leaderMail.items.push([itemID, itemNum]);
    }

    for(var i = 1; i < 3; ++i){
        var itemID = UnionAwardTemplate['leaderItemID' + i];
        var itemNum = UnionAwardTemplate['leaderItemNum' + i];
        if(itemID <= 0 || itemNum <= 0){
            break;
        }
        leaderMail.items.push([itemID, itemNum]);
    }

    var sendMemberMail = function(mail){
        unionManager.SendUnionMail(mail, function(err){

        });
    };

    var unionMembers = unionManager.getMemberList(unionID);
    var unionInfo = unionManager.GetUnion(unionID);
    if(unionInfo == null){
        return;
    }
    for(var roleID in unionMembers){
        if(unionMembers[roleID] <= 0){
            continue;
        }


        if(roleID == unionInfo['bossID']){
            var mail = createMail(leaderMail);
            mail.recvID = parseInt(roleID);
            sendMemberMail(mail);

        }else{
            var mail = createMail(mailDetail);
            mail.recvID = parseInt(roleID);
            sendMemberMail(mail);
        }
    }
};

// 获得占领奖励
handler.onGetDukeAward = function(unionID){
    var UnionAwardTemplate = templateManager.GetTemplateByID('UnionAwardTemplate', 1001);
    if(UnionAwardTemplate == null){
        return;
    }

    var mailDetail = {
        subject: sUsString.subject4,
        mailType: gameConst.eMailType.System,
        content: sUsString.content_8,
        items: []
    };
    var leaderMail = {
        subject: sUsString.subject4,
        mailType: gameConst.eMailType.System,
        content: sUsString.content_8,
        items: []
    };

    for(var i = 1; i < 5; ++i){
        var itemID = UnionAwardTemplate['itemID' + i];
        var itemNum = UnionAwardTemplate['itemNum' + i];
        if(itemID <= 0 || itemNum <= 0){
            break;
        }
        mailDetail.items.push([itemID, itemNum]);
        leaderMail.items.push([itemID, itemNum]);
    }

    for(var i = 1; i < 3; ++i){
        var itemID = UnionAwardTemplate['leaderItemID' + i];
        var itemNum = UnionAwardTemplate['leaderItemNum' + i];
        if(itemID <= 0 || itemNum <= 0){
            break;
        }
        leaderMail.items.push([itemID, itemNum]);
    }

    var unionMembers = unionManager.getMemberList(unionID);
    var unionInfo = unionManager.GetUnion(unionID);
    if(unionInfo == null){
        return;
    }
    logger.fatal('duke union member is %j', unionMembers);

    var sendMemberMail = function(mail){
        unionManager.SendUnionMail(mail, function(err){

        });
    };

    //var bossID = unionInfo['bossID'];
    var bossID = unionManager.getBossID(unionID);

    for(var roleID in unionMembers){
        if(unionMembers[roleID] == null){
            continue;
        }

        //if(roleID == unionInfo['bossID']){
        if(_.contains(bossID, roleID)){
            var mail = createMail(leaderMail);
            mail.recvID = parseInt(roleID);
            sendMemberMail(mail);

        }else{
            var mail = createMail(mailDetail);
            mail.recvID = parseInt(roleID);
            sendMemberMail(mail);
        }
    }
};

// 发送报名公会战邮件
handler.SendRegisterMail = function(unionID) {
    var unionMembers = unionManager.getMemberList(unionID);
    var unionInfo = unionManager.GetUnion(unionID);
    if (unionInfo == null) {
        return;
    }
    var mailDetail = {
        subject: sUsString.subject,
        mailType: gameConst.eMailType.System,
        content: sUsString.content_9,
        items: []
    };
    var sendMemberMail = function(mail){
        unionManager.SendUnionMail(mail, function(err){

        });
    };

    for (var roleID in unionMembers) {
        if (unionMembers[roleID] == null) {
            continue;
        }

        var mail = createMail(mailDetail);
        mail.recvID = parseInt(roleID);
        sendMemberMail(mail);
    }
};

// 得到需要打的神兽
handler.getNextFightAnimal = function(unionID){
    var animalRet =  { animalOrder : 0};
    if(unionID != this.definderAnimal.GetAnimalInfo(eUnionAnimal.unionID)){
        animalRet.animal = this.definderAnimal.toMessage();
    }else{
       for(var i = 0; i < this.attackerAnimals.length; ++i){
           var animal = this.attackerAnimals[i];
           if(animal!= null && animal.IsAlive() ){
               animalRet.animal = animal.toMessage();
               animalRet.animalOrder = i;
               break;
           }
       }
    }

    return animalRet;
};


// 得到神兽信息
handler.getAnimalInfo = function(unionID, animalOrder){
    if(this.fightState != 1){
        return null;
    }

    if(unionID == null || unionID <= 0 ){
        return null;
    }

    if(unionID != this.definderAnimal.GetAnimalInfo(eUnionAnimal.unionID)){
        return this.definderAnimal;
    }

    if(animalOrder >= this.attackerAnimals.length){
        return null;
    }
    return this.attackerAnimals[animalOrder];
};

// 得到所有攻击次数
handler.getAllFightTimes = function(unionID){
    var rank = 0;
    if(unionID == this.definderAnimal.GetAnimalInfo(eUnionAnimal.unionID)){
        return 9999;
    }else{
        for(var i = 0; i < this.attackerAnimals.length; ++i){
            var animal = this.attackerAnimals[i];
            if(animal!= null && animal.GetAnimalInfo(eUnionAnimal.unionID) == unionID ){
                rank = i + 1;
                break;
            }
        }
    }

    if(rank <= 0){
        rank = 100;
    }

    var UnionFixTemplate = templateManager.GetAllTemplate('UnionFixTemplate');
    if(UnionFixTemplate == null){
        logger.error('fix temple is null');
        return 0;
    }

    var index = 0;
    for (var i in UnionFixTemplate) {
        if(UnionFixTemplate[i]['attType'] != 1){
            continue;
        }
        if (rank >= UnionFixTemplate[i]['rankLow'] && rank <= UnionFixTemplate[i]['rankHigh']) {
            index = i;
            break;
        }
    }

    if(UnionFixTemplate[index] == null){
        logger.error('not find the attTimes temple %j', index);
        return 0;
    }

    return parseInt(UnionFixTemplate[index]['attackTimes']);
};


// 存盘 公会间的伤害排行
handler.saveUnionDamageRank = function (unionInfo, ranks){
    if(unionInfo == null || ranks == null){
        return;
    }

    var unionID = unionInfo['unionID'];

    var unionMembers = unionManager.getMemberList(unionID);
    if(unionMembers.length <= 0){
        return;
    }

    //var bossID = unionInfo['bossID'];
    var bossID = unionManager.getBossID(unionID);
    var saveDate = utilSql.DateToString(new Date());

    for(var roleID in unionMembers){
        if(unionMembers[roleID] == null){
            continue;
        }

        var args = [roleID, gameConst.eChartType.UnionAnimal, ranks, saveDate,  _.contains(bossID, roleID) ? 1 : 0];
        utilSql.SaveChartRewardList('chartreward', roleID, gameConst.eChartType.UnionAnimal, [args], function(err){

        });
    }
};

// 存盘，公会内的伤害排行
handler.saveMemberDamageRank = function(){
    var saveDate = utilSql.DateToString(new Date());
    for(var unionID in unionManager.memberDamageRank){
        var damageArray = unionManager.memberDamageRank[unionID];
        if(damageArray == null){
            continue;
        }
        for(var i = 0; i < damageArray.length; ++i){
            var roleInfo = damageArray[i];
            var args = [roleInfo['roleID'], gameConst.eChartType.UnionDamage, i + 1, saveDate, 0];
            utilSql.SaveChartRewardList('chartreward', roleInfo['roleID'], gameConst.eChartType.UnionDamage, [args], function(err){

            });
        }
    }
};

// 打印出需要的日志
handler.printStartLogger = function(){
    logger.fatal('union duke fight definderAnimal is %j', this.definderAnimal);
    logger.fatal('union duke fight attackerAnimal is %j', this.attackerAnimals);
};

// 打印出需要的日志
handler.printEndLogger = function(){
    logger.fatal('duke fight def animal hHP per is %j', this.definderAnimal.HPPercent());
    for(var i = 0; i < this.attackerAnimals.length; ++i){
        var animal = this.attackerAnimals[i];
        if(animal!= null && animal.IsAlive()){
            logger.fatal('duke fight atk animal lefts number is %j, and HP per is', i, animal.HPPercent());
            break;
        }
    }
};