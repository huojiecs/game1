/**
 * Created by CUILIN on 15-1-21.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var errorCodes = require('../../../tools/errorCodes');
var playerManager = require('../../../cs/player/playerManager');

module.exports = function() {
    return new Handler();
};

var Handler = function() {
};

var handler = Handler.prototype;

handler.CreatePet = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var petID = +msg.petID;
    var type = +msg.type;     // 召唤类型，0：普通召唤 1：万能碎片召唤
    var result = player.GetPetManager().CreatePet(petID, type);
    return next(null, {
        result: result
    });
};

handler.PetAddExp = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var petID = +msg.petID;
    var type = +msg.type;
    var num = +msg.num
    var result = player.GetPetManager().PetAddExp(petID, type, num);

    return next(null, {
        result: result
    });
};

handler.GradeLevelUp = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var petID = +msg.petID;
    var grade = +msg.grade;
    var type = +msg.type;
    var result = player.GetPetManager().GradeLevelUp(petID, grade, type);

    return next(null, {
        result: result
    });
};

handler.UnlockSkill = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var petID = +msg.petID;
    var skillGrade = +msg.skillGrade;
    var result = player.GetPetManager().UnlockSkill(petID, skillGrade);

    return next(null, {
        result: result
    });
};

handler.SkillLevelUp = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var petID = +msg.petID;
    var skillGrade = +msg.skillGrade;
    var skillID = +msg.skillID;
    var result = player.GetPetManager().SkillLevelUp(petID, skillGrade, skillID);

    return next(null, {
        result: result
    });
};

handler.ToFight = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var petID = +msg.petID;
    var result = player.GetPetManager().ToFight(petID);

    return next(null, {
        result: result
    });
};

handler.CancelFight = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var result = player.GetPetManager().CancelFight();

    return next(null, {
        result: result
    });
};

handler.ToSpirit = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var petID = +msg.petID;
    var field = +msg.field;
    var result = player.GetPetManager().ToSpirit(petID, field);

    return next(null, {
        result: result
    });
};

handler.CancelSpirit = function(msg, session, next) {
    var roleID = session.get('roleID');
    if (typeof roleID !== 'number') {
        return next(null, {'result': errorCodes.ParameterNull});
    }
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    var field = +msg.field;
    var result = player.GetPetManager().CancelSpirit(field);

    return next(null, {
        result: result
    });
};

// 宠物分解
handler.ResolvePet = function(msg, session, next){
    var roleID = session.get('roleID');
    var petID = +msg.petID;
    if(roleID == null || petID == null){
        return next(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    player.GetPetManager().ResolvePet(petID, next);
};

// 宠物碎片兑换万能碎片
handler.PetFragExchange = function(msg, session, next){
    var roleID = session.get('roleID');
    var petID = +msg.petID;             // 宠物ID
    var fragNum = +msg.fragNum;         // 要兑换的万能碎片数量
    if(roleID == null || petID == null || fragNum == null || fragNum <= 0){
        return next(null, {'result': errorCodes.ParameterNull});
    }

    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        return next(null, {'result': errorCodes.NoRole});
    }

    player.GetPetManager().PetFragExchange(petID, fragNum,  next);
};