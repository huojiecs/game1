/**
 * Created by yqWang on 2014-04-08.
 */

var logger = require('pomelo-logger').getLogger("module", __filename);
var monitor = require('./../monitor');
var roleData = require('./../../data/json/role');
var roomData = require('./../../data/json/room');
var fs = require('fs');


var Handler = module.exports = function (client, interval) {
    this.client = client;
    this.pomelo = client.pomelo;
    this.interval = interval;
};

var handler = Handler.prototype;

handler.run = function () {
    var self = this;
    this.AddPlayerExp();    //首先提升玩家等级
    setInterval(
        function () {
            self.update();
        }, self.interval);
};


var cusIDList = [1001, 1002, 1003, 1004];


handler.update = function () {
    var self = this;
    var cusID = cusIDList[Math.floor(Math.random() * cusIDList.length)];
    var roleList = roleData[Math.floor(Math.random() * (roleData.length - 2)) + 2];
    var teamName = roleList[1];
    self.GetTeamList(cusID);
    self.CreateTeam(cusID, teamName);
};

handler.AddPlayerExp = function () {
    var expNum = 1234567890;
    var message = {};
    message['cmd'] = "addexp";
    message['params'] = [expNum];
    this.pomelo.request('ps.playerHandler.GmControl', message, function (result) {
        logger.fatal('Addexp result = ' + result.result);
    });
};

handler.GetTeamList = function (customID) {
    var self = this;
    if (null == customID) {
        logger.info('关卡ID为空');
        return;
    }
    var message = {};
    message['customID'] = customID;
    monitor.begin('GetTeamList', 0);
    this.pomelo.request('rs.roomHandler.GetTeamList', message, function (result) {
        logger.fatal('GetTeamList result = ' + result.result);
        monitor.end('GetTeamList', 0);
    });
};

handler.CreateTeam = function (customID, teamName) {
    var self = this;
    if (null == customID) {
        logger.info('关卡ID为空');
        return;
    }
    var message = {};
    message['customID'] = customID;
    message['password'] = '';
    message['teamName'] = teamName;
    message['levelTarget'] = 1;
    message['levelParam'] = 0;
    monitor.begin('CreateTeam', 0);
    this.pomelo.request('rs.roomHandler.CreateTeam', message, function (result) {
        logger.fatal('CreateTeam result = ' + result.result);
        monitor.end('CreateTeam', 0);
        if (0 === result.result) {
            self.ReadyTeam();
        }
    });
};

handler.ReadyTeam = function () {
    var self = this;
    var message = {};
    monitor.begin('ReadyTeam', 0);
    this.pomelo.request('rs.roomHandler.ReadyTeam', message, function (result) {
        logger.fatal('ReadyTeam result = ' + result.result);
        monitor.end('ReadyTeam', 0);
        if (0 === result.result) {
            self.StartGame();
        }
    });
};

handler.StartGame = function () {
    var self = this;
    var message = {};
    monitor.begin('StartGame', 0);
    this.pomelo.request('rs.roomHandler.StartGame', message, function (result) {
        logger.fatal('StartGame result = ' + result.result);
        monitor.end('StartGame', 0);
        if (0 === result.result) {
            //self.SendMsg();
            var roleID = self.client.player.roleID;
            self.LeaveTeam(roleID);
        }
    });
};

handler.PlayerAtt = function (roomList) {
    var self = this;
    var message = {};
    message['attType'] = roomList[1];
    message['attNum'] = roomList[2];
    message['playerState'] = roomList[3];
    self.pomelo.request('cs.roomHandler.PlayerAtt', message, function (result) {
    });
};

handler.UseSkill = function (roomList) {
    var self = this;
    var message = {};
    message['skillID'] = roomList[1];
    message['skillType'] = roomList[2];
    message['animName'] = roomList[3];
    message['posX'] = roomList[4];
    message['posY'] = roomList[5];
    message['posZ'] = roomList[6];
    this.pomelo.request('cs.roomHandler.UseSkill', message, function (result) {
    });
};

handler.NpcDropHp = function (roomList) {
    var self = this;
    var message = {};
    message['npcID'] = roomList[1];
    message['HpNum'] = roomList[2];
    message['npcState'] = roomList[3];
    message['attType'] = roomList[4];
    message['playerIndex'] = roomList[5];
    self.pomelo.request('cs.roomHandler.NpcDropHp', message, function (result) {
    });
};

handler.BianShen = function () {    //变身
    var self = this;
    var message = {};
    message['soulLu'] = 'Prefabs/AM_CH_ZS_BianShen_00';
    message['soulType'] = 1;
    message['soulID'] = 1000;
    message['soulIndex'] = 0;
    self.pomelo.request('cs.roomHandler.BianShen', message, function (result) {
    });
};

handler.RoleDie = function () {    //死亡
    var self = this;
    var message = {};

    self.pomelo.request('cs.roomHandler.RoleDie', message, function (result) {
    });
};

handler.Relive = function () {    //复活
    var self = this;
    var message = {};

    self.pomelo.request('cs.roomHandler.Relive', message, function (result) {
        logger.fatal('Relive result = ' + result.result);
    });
};

handler.SendMsg = function () {
    var self = this;
    self.BianShen();
    self.RoleDie();
    self.Relive();
    var index = 0;
    var OperInCus = function () {
        var roomList = roomData[index + 2];
        var type = roomList[0];
        switch (type) {
            case 0:
                self.PlayerAtt(roomList);
                break;
            case 1:
                self.UseSkill(roomList);
                break;
            case 2:
                self.NpcDropHp(roomList);
                break;
            default :
                logger.error('房间内发送消息类型错误');
        }
        index++
        if (index < (roomData.length - 2)) {
            setTimeout(OperInCus, 1000);
        }
        else {
            var roleID = self.client.player.roleID;
            self.LeaveTeam(roleID);
        }
    };
    OperInCus();
};

handler.LeaveTeam = function (roleID) {
    var self = this;
    var message = {};
    message['roleID'] = roleID;
    monitor.begin('LeaveTeam', 0);
    this.pomelo.request('rs.roomHandler.LeaveTeam', message, function (result) {
        logger.fatal('LeaveTeam result = ' + result.result);
        monitor.end('LeaveTeam', 0);
    });
};