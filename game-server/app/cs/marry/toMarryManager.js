/**
 * Created with JetBrains WebStorm.
 * User: chen_s
 * Date: 15-07-01
 * Time: 上午11:39
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var tlogger = require('tlog-client').getLogger(__filename);
var gameConst = require('../../tools/constValue');
var globalFunction = require('../../tools/globalFunction');
var templateManager = require('../../tools/templateManager');
var templateConst = require('../../../template/templateConst');
var utilSql = require('../../tools/mysql/utilSql');
var csSql = require('../../tools/mysql/csSql');
var utils = require('../../tools/utils');
var playerManager = require('../player/playerManager');
var defaultValues = require('../../tools/defaultValues');
var errorCodes = require('../../tools/errorCodes');
var stringValue = require('../../tools/stringValue');
var Marry = require('./marry');
var async = require('async');
var _ = require('underscore');
var util = require('util');
var cityManager = require('../majorCity/cityManager');
var ePlayerInfo = gameConst.ePlayerInfo;
var eToMarryInfo = gameConst.eToMarryInfo;
var eMarryInfo = gameConst.eMarryInfo;
var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;
var eXuanYan = gameConst.eXuanYan;
var eMarryMsg = gameConst.eMarryMsg;
var tToken = templateConst.tToken;
var tLocalize = templateConst.tLocalize;

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.toMarryList = {};
    this.marryInfo = {};
    this.playerMarryState = 0;  //0 单身  ，1 已婚 ， 2 离婚
    this.peiouName = '';//配偶姓名
    this.lookNum = {}; //未查看消息数
    this.marryLookNum = {}; //结婚后未查看消息数
    this.xuanYan = {}; //求爱宣言
    this.marry = new Marry();
    this.countNum = 0; //每天求婚次数为 5次
    this.qinMiDu = defaultValues.marry_yinyuan;
    this.divorceTime = null;
    this.marryDouble = 0;
};

var handler = Handler.prototype;

handler.LoadDataByDB = function (marryData) {
    var self = this;

    var dataList = marryData['toMarry'];
    for (var index in dataList) {
        dataList[index][eToMarryInfo.toMarryTime] = utilSql.DateToString(new Date(dataList[index][eToMarryInfo.toMarryTime]));
        var toMarryTime = new Date(dataList[index][eToMarryInfo.toMarryTime]);
        var today = new Date();
        if((today-toMarryTime)/3600000 < (24*defaultValues.delete_marry_day)){   //过滤掉大于7天的求婚请求
            self.toMarryList[index] = dataList[index];
        }
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        if(self.owner.id == dataList[index][eToMarryInfo.roleID] && toMarryTime > today && (0 == dataList[index][eToMarryInfo.state] || 2 == dataList[index][eToMarryInfo.state])){
            ++self.countNum;
        }

    }

    var marryList = marryData['marryInfo'];
    for (var index in marryList) {
        var marryState = marryList[index][eMarryInfo.state];
        marryList[index][eMarryInfo.marryTime] = utilSql.DateToString(new Date(marryList[index][eMarryInfo.marryTime]));
        if(1 == marryState){
            self.marryInfo[0] = marryList[index];
        }else if(2 == marryState){  //离婚记录
            self.marryInfo[1] = marryList[index];
            if(!self.divorceTime){
                self.divorceTime = new Date(marryList[index][eMarryInfo.marryTime]);
            }else{//比较离婚日期
                if(new Date(self.divorceTime) < new Date(marryList[index][eMarryInfo.marryTime])){
                    self.divorceTime = new Date(marryList[index][eMarryInfo.marryTime]);
                }
            }

        }
    }

    if(!!self.marryInfo[0]){
        self.playerMarryState = self.marryInfo[0][eMarryInfo.state];

        var toMarryID = self.owner.id == self.marryInfo[0][eMarryInfo.roleID] ? self.marryInfo[0][eMarryInfo.toMarryID]: self.marryInfo[0][eMarryInfo.roleID];
        //获取下配偶名字
        self.marry.GetPlayerInfo(toMarryID, function (err, details) {

            if (!!err) {
                logger.error('error when asyncGetPlayerInfo for GetPlayerInfo file, %s', details.roleID,
                    utils.getErrorMessage(err));
            }
            if (!details) {
                logger.warn('warn when SendMarryState for details is null ,roleID=%j,details=%j', self.owner.id,
                    details);
            }
           self.peiouName = details.name ? details.name : '';
        });
    }

    if(!!marryData['marryXuanYan'][0]){
        self.xuanYan[0] = marryData['marryXuanYan'][0];
    }

    if(!!marryData['marryMsg'][0]){
        self.lookNum[0] = marryData['marryMsg'][0];
    }
//
//    logger.fatal("##### marryLoad roleId: %j, this.toMarryList: %j ", self.owner.id, self.toMarryList);
//
//    logger.fatal("##### marryLoad roleId: %j, this.marryInfo: %j ", self.owner.id, self.marryInfo);
};


handler.LoadDataByDBByOffine = function (marryData) {
    var self = this;

    if(!!marryData['marryXuanYan'][0]){
        self.xuanYan[0] = marryData['marryXuanYan'][0];
    }
};

/** 修改求爱宣言 */
handler.UpdateXuanYan = function(xuanyan, callback){
    var self = this;
    //添加非法屏蔽字限制
//    var xuanyanText = _.clone(xuanyan);
//    xuanyan = self.ReplaceStr(xuanyan);
//    if(xuanyanText != xuanyan){
//        return callback(null, errorCodes.MARRY_BLESS_DONTUSE);
//    }
    if(globalFunction.IsValidAnyName(xuanyan, 99) ==  false){
        return callback(null, errorCodes.MARRY_BLESS_DONTUSE);
    }
    if(!!self.xuanYan[0]){
        self.xuanYan[0][eXuanYan.xuanYan] = xuanyan;
    }else{
        var xuanyanInfo = {
            0 : self.owner.id,
            1 : xuanyan
        };
        self.xuanYan[0] = xuanyanInfo;
    }
    pomelo.app.rpc.rs.rsRemote.UpdateXuanYan(null, self.xuanYan[0], function(err, res){
        if (!!err) {
            logger.error('error when RPC rs UpdateXuanYan for  , %s', self.owner.id,
                utils.getErrorMessage(err));
        }else{
            return callback(null, errorCodes.OK);
        }
    });

};


handler.ReplaceStr = function (str) {       //宣言屏蔽字
    str = str.toLowerCase();
    if(defaultValues.chatCheck) {   //只有腾讯版本去掉聊天中的空格
        str = str.replace(/\s+/g, "");
    }
    var strList = require('../../tools/templateManager').GetAllTemplate('NoTalk');
    for (var index in strList) {
        str = str.replace(strList[index], '*');
    }
    return str;
};

/** 获取好友可求婚对象列表 */
handler.GetToMarryFriendList = function(callback){
    var self = this;
    var player = self.owner;
    //从好友列表获取出当前在线的异性玩家
//    pomelo.app.rpc.fs.fsRemote.GetFriendRoleIDs(null, player.id, null,function(err, friendList){
//        if (!!err) {
//            logger.error('error when GetToMarryFriendList for GetFriendRoleIDs , %s',  player.id,
//                utils.getErrorMessage(err));
//            return null;
//        }
//        var fList = _.clone(friendList);
//        self.asyncGetPlayerInfo(fList.roleIDs, callback);
//
//    });
    self.asyncGetPlayerInfo([], callback);
};

/** 获取公会可求婚对象列表 */
handler.GetToMarryUnionList = function(callback){
    var self = this;
    var player = self.owner;
    //从好友列表获取出当前在线的异性玩家
    pomelo.app.rpc.us.usRemote.GetUnionMemberID(null, player.id, function(err, unionList){
        if (!!err) {
            logger.error('error when GetToMarryUnionList , %s', player.id,
                utils.getErrorMessage(err));
        }
        var toMarryList = _.clone(unionList);
        self.asyncGetPlayerInfo(toMarryList, callback);

    });
};




/** 获取周围主城玩家中可求婚对象列表 */
handler.GetToMarryRoundList = function(callback){
    var self = this;
    var player = self.owner;
    //从好友列表获取出当前在线的异性玩家
    var onlinePlayer = playerManager.GetAllPlayer();
    //在主城  等级大于34  职业性别符合
    var roundList = [];
    for(var p in onlinePlayer){
        var roundP = onlinePlayer[p];
        var jobMarry = self.marry.jobMarryCheck(player.GetPlayerInfo(ePlayerInfo.TEMPID), roundP.playerInfo[ePlayerInfo.TEMPID]);
        if (!!roundP.worldState && jobMarry) {
            if ((player.id != roundP.playerInfo[ePlayerInfo.ROLEID]) && (ePosState.Hull == roundP.worldState[eWorldState.PosState]) && (roundP.worldState[eWorldState.PosState] == player.worldState[eWorldState.PosState]) ) { //&& jobMarry

                var friend = {};
                //根据求婚列表标记已经求过的对象
                friend['state'] = 0;
                for(var index in self.toMarryList){
                    if(!!self.toMarryList[index]){
                        var roleID = self.toMarryList[index][eToMarryInfo.toMarryID];
                        var state = self.toMarryList[index][eToMarryInfo.state];
                        var toMarryTime = self.toMarryList[index][eToMarryInfo.toMarryTime];
                        if(roleID == roundP.playerInfo[ePlayerInfo.ROLEID]){
                            if(!!toMarryTime && new Date().setDate(new Date(toMarryTime).getDate()+1)> new Date()){
                                //上次请求未超过24小时
                                if(0 == state){
                                    //判断对方是否处理
                                    friend['state'] = 1;//24小时内已经请求过
                                    break
                                }else if(2 == state){
                                    friend['state'] = 2;//对方已拒绝
                                    break
                                }
                            }else{
                                friend['state'] = 0;//超过24小时 可求婚
                            }
                        }else{
                            friend['state'] = 0;
                        }
                    }
                }

                friend['roleID'] = roundP.playerInfo[ePlayerInfo.ROLEID];
                friend['roleName'] = roundP.playerInfo[ePlayerInfo.NAME];
                friend['openID'] = roundP.playerInfo[ePlayerInfo.openID];
                friend['picture'] = roundP.playerInfo[ePlayerInfo.Picture];
                friend['playerLevel'] = roundP.playerInfo[ePlayerInfo.ExpLevel];
                friend['vipLevel'] = roundP.playerInfo[ePlayerInfo.VipLevel];
                friend['playerZhanli'] = roundP.playerInfo[ePlayerInfo.ZHANLI];
                if(!!roundP.toMarryManager.xuanYan[0]){
                    friend['xuanYan'] = roundP.toMarryManager.xuanYan[0][eXuanYan.xuanYan];
                }else{
                    friend['xuanYan'] = '';
                }

                roundList.push(friend);
            }
        }
    }
    var retArray = {
        result: errorCodes.OK
    };
    retArray['marryMsg'] = roundList;
    callback(null, retArray);

};

/** 获取求婚信物列表 */
handler.GetXinWuList = function(callback){
    var tokenTemp = templateManager.GetAllTemplate('tokenTemplate');

    var resToken = [];
    for(var t in tokenTemp){
        var xinWuNameID = tokenTemp[t][tToken.xinWuNameID];
        var xinWuDescID = tokenTemp[t][tToken.xinWuDescID];
        var xinwuNameTemp = templateManager.GetTemplateByID('LocalizeTemplate', xinWuNameID);
        var xinwuDescTemp = templateManager.GetTemplateByID('LocalizeTemplate', xinWuDescID);
        if(!xinwuNameTemp || !xinwuDescTemp){
            logger.error('error when GetXinWuList file: toMarryManager  LocalizeTemplate not find xinWu %j  or %j ', xinWuNameID, xinWuDescID);
        }else{
            var xinWuName = xinwuNameTemp[tLocalize.description];
            var xinWuDesc = xinwuDescTemp[tLocalize.description];
        }
        var xinwu = {
            xinWuID: tokenTemp[t][tToken.xinWuID],
            xinWuName: xinWuName,
            xinWuDesc: xinWuDesc,
            priceTypeID: tokenTemp[t][tToken.priceTypeID],
            xinWuPrice: tokenTemp[t][tToken.xinWuPrice],
            xinWuColor: tokenTemp[t][tToken.xinWuColor],
            effectID: tokenTemp[t][tToken.effectID]

        };
        resToken.push(xinwu);
    }
    var retArray = {
        result: errorCodes.OK,
        tokenList: resToken
    };
    return callback(null, retArray);
};

/** 同意求婚 */
handler.Agree = function(fromMarryID, marryID, callback){
    var self = this;
    var player = self.owner;
    var nowDate = new Date();
    //查看求婚记录
    var hasToMarry = false;
    var MyToMarry;
    var xinWuID;
    //判断此时 求婚人的职业性别   （可能求婚后转职）
//    self.marry.GetPlayerInfo(fromMarryID, function (err, details) {
//        if (!!err) {
//            logger.error('error when asyncGetPlayerInfo for Agree marry file, %s', details.roleID,
//                utils.getErrorMessage(err));
//        }
//        if (!details) {
//            logger.warn('warn when asyncGetPlayerInfo for Agree marry details is null ,roleID=%j,details=%j', self.owner.id,
//                details);
//        }
    pomelo.app.rpc.ps.psRemote.GetOffPlayerInfoNew(null, fromMarryID, function(err, res) {
        var jobMarry = self.marry.jobMarryCheck(self.owner.GetPlayerInfo(ePlayerInfo.TEMPID), res[ePlayerInfo.TEMPID]);
        if(!jobMarry){
            return callback(null, errorCodes.MARRY_ITEMWRONGJOB);
        }

        for(var index in self.toMarryList){
            MyToMarry = self.toMarryList[index];
            if(!!MyToMarry){
                if(fromMarryID == MyToMarry[eToMarryInfo.roleID] && player.id == MyToMarry[eToMarryInfo.toMarryID] && 0==MyToMarry[eToMarryInfo.state] && marryID == MyToMarry[eToMarryInfo.marryID] ){
                    hasToMarry = true;
                    xinWuID = MyToMarry[eToMarryInfo.xinWuID];
//                MyToMarry[eToMarryInfo.readState] = 1;
//                if(self.lookNum[0][eMarryMsg.marryMsgNum]>0){
//                    --self.lookNum[0][eMarryMsg.marryMsgNum];   //自己处理了求婚信  求婚信消息数减一
//                }

                    break;
                }
            }

        }
        //判断离婚时间是否超过24小时
        if(!!self.divorceTime){
            var divorceTime = self.divorceTime;
            divorceTime =  new Date(divorceTime);
            if((nowDate-divorceTime)/3600000 < 24){
                return callback(null, errorCodes.MARRY_DIVORCE_NOT_24);
            }
        }

        if(!hasToMarry){
            return callback(null, errorCodes.MARRY_NOT_FIND_TOMARRY);
        }

        var myState = self.playerMarryState;
        if(1 == myState){
            return callback(null, errorCodes.MARRY_ALREADY_SELF);
        }
        var fromMarryPlayer = playerManager.GetPlayer(fromMarryID);

        if(!!fromMarryPlayer){
            //求婚玩家在线
            self.FromAgree(player.id, fromMarryPlayer, xinWuID, nowDate, marryID, function(err, res){
                if (!!err) {
                    logger.error('error when Agree file: toMarryManager , %s', player.id,
                        utils.getErrorMessage(err));
                }
                if(0 == res){
                    MyToMarry[eToMarryInfo.state] = 1;
                    //self.SelfAgree(fromMarryID, xinWuID, callback);
                    fromMarryPlayer.toMarryManager.SendMarryState(fromMarryPlayer.id);
                }
            });

        }else{
            //不在同一个cs下玩家处理
            pomelo.app.rpc.ps.psRemote.Agree(null, player.id, fromMarryID, xinWuID, nowDate, marryID, function(err, res){
                if(!!err){
                    logger.error(utils.getErrorMessage(err));
                    return;
                }

                if(0 == res){
                    MyToMarry[eToMarryInfo.state] = 1;
                    //self.SelfAgree(fromMarryID, xinWuID, callback);
                }
//                if(errorCodes.MARRY_OFFLINE != res){ //不在线
//                    return;
//                }

            });
        }
        //无论玩家在不在线 都要直接操作数据库
        csSql.SaveAgreeMarry(fromMarryID, player.id, xinWuID, function(err, res){
            if (!!err) {
                logger.error('error when Agree file: toMarryManager , %s', player.id,
                    utils.getErrorMessage(err));
            }
            var marryID = 0;
            if(!!res[0] && !!res[0][0]){
                marryID = res[0][0]["toMarryID"];
            }else{
                //对方已经结婚 清理掉对方的求婚数据
                for(var index in self.toMarryList) {
                    MyToMarry = self.toMarryList[index];
                    if(!!MyToMarry){
                        if (fromMarryID == MyToMarry[eToMarryInfo.roleID]  || fromMarryID == MyToMarry[eToMarryInfo.toMarryID]) {
                            self.toMarryList[index] = null;
                        }
                    }
                }
                return callback(null, errorCodes.MARRY_ALREADY);
            }
            if(marryID == player.id){
                MyToMarry[eToMarryInfo.state] = 1;
                self.SelfAgree(fromMarryID, xinWuID, callback);
                //结婚成功清除求婚数据
                for(var index in self.toMarryList) {
                    MyToMarry = self.toMarryList[index];
                    if(!!MyToMarry){
                        if (fromMarryID == MyToMarry[eToMarryInfo.roleID] || player.id == MyToMarry[eToMarryInfo.toMarryID] || player.id == MyToMarry[eToMarryInfo.roleID] || fromMarryID == MyToMarry[eToMarryInfo.toMarryID]) {
                            self.toMarryList[index] = null;
                        }
                    }
                }
                if(!self.lookNum[0]){
                    self.lookNum[0] = {
                        0: self.owner.id,
                        1: 0
                    };
                }
            }else{
                //对方已经结婚 清理掉对方的求婚数据
                for(var index in self.toMarryList) {
                    MyToMarry = self.toMarryList[index];
                    if(!!MyToMarry){
                        if (fromMarryID == MyToMarry[eToMarryInfo.roleID]  || fromMarryID == MyToMarry[eToMarryInfo.toMarryID]) {
                            self.toMarryList[index] = null;
                        }
                    }
                }
                return callback(null, errorCodes.MARRY_ALREADY);
            }
        });

    });
};

handler.FromAgree = function(roleID, fromMarryPlayer, xinWuID, nowDate, marryID, callback){
    var fromState = fromMarryPlayer.toMarryManager.playerMarryState;
    if(1 == fromState){ //可能同意时 此求婚者已经结婚
        return callback(null, errorCodes.MARRY_ALREADY);
    }
    if(!!fromMarryPlayer.toMarryManager.divorceTime){
        var divorceTime = fromMarryPlayer.toMarryManager.divorceTime;
        divorceTime =  new Date(divorceTime);
        if((nowDate-divorceTime)/3600000 < 24){
            return callback(null, errorCodes.MARRY_DIVORCE_NOT_24);
        }
    }

    var marryInfo = {
        0 : fromMarryPlayer.id,
        1 : roleID,
        2 : utilSql.DateToString(new Date(nowDate)),
        3 : 1,
        4 : 0,
        5 : xinWuID
    };
    fromMarryPlayer.toMarryManager.marryInfo[0] = marryInfo;
    fromMarryPlayer.toMarryManager.divorceTime = new Date();
    fromMarryPlayer.toMarryManager.playerMarryState = fromMarryPlayer.toMarryManager.marryInfo[0][eMarryInfo.state];
    fromMarryPlayer.toMarryManager.UpdateToMarry(fromMarryPlayer.id, roleID, 0, 1, marryID);
    fromMarryPlayer.toMarryManager.lookNum[0] = {
        0: fromMarryPlayer.id,
        1: 0
    };
    for(var index in fromMarryPlayer.toMarryManager.toMarryList) {
        var MyToMarry = fromMarryPlayer.toMarryManager.toMarryList[index];
        if(!!MyToMarry){
            if (fromMarryPlayer.id == MyToMarry[eToMarryInfo.roleID] || roleID == MyToMarry[eToMarryInfo.toMarryID] || roleID == MyToMarry[eToMarryInfo.roleID] || fromMarryPlayer.id == MyToMarry[eToMarryInfo.toMarryID]) {
                fromMarryPlayer.toMarryManager.toMarryList[index] = null;
            }
        }
    }

    //fromMarryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum] = 0;
    return callback(null, errorCodes.OK);
};

/**同意求婚之后改变状态 发邮件通知 操作*/
handler.SelfAgree = function(fromMarryID, xinWuID, callback){
    var self = this;
    var player = self.owner;
    var nowDate = new Date();
        var marryInfo = {
            0 : fromMarryID,
            1 : player.id,
            2 : utilSql.DateToString(nowDate),
            3 : 1,
            4 : 0,
            5 : xinWuID
        };

    self.marryInfo[0] = marryInfo;
    self.playerMarryState = self.marryInfo[0][eMarryInfo.state];
    self.divorceTime = new Date();
    //添加入排行榜
    var roleInfo = {
        roleID: self.marryInfo[0][eMarryInfo.roleID]+"+"+self.marryInfo[0][eMarryInfo.toMarryID],
        score: defaultValues.marry_yinyuan
    };
    pomelo.app.rpc.chart.chartRemote.UpdateMarry(null, roleInfo, utils.done);

    //把结婚信息marryInfo同步到rs
    pomelo.app.rpc.rs.rsRemote.UpdateMarryInfo(null, marryInfo, function(err, res){
        if(!!err){
            logger.error(utils.getErrorMessage(err));
        }else{
            var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
            self.sendMail(player.id, playerName, fromMarryID, 1, callback); // 1 是同意邮件  2 是 拒绝邮件
            //主动请求客户端改变婚姻状态
            self.SendMarryState(player.id);
        }
    });


};

/**主动请求客户端 改变婚姻状态 同步婚姻信息   ps： 进入场景时 和 同意结婚 ，离婚 都会调用此方法 */
handler.SendMarryState = function(roleID){
    var self = this;
    var route = 'SendMarryState';
    var player = playerManager.GetPlayer(roleID);
    if (!player) {
        logger.fatal("****SendMarryState player  is null, roleID: %j     ", roleID);
        return ;
        //player.SendMessage(route, errorCodes.NoRole)
    }
    if(!self.marryInfo[0]){
        //没有结婚 或者离婚了
        var Msg = {
            result: errorCodes.OK,
            state: self.playerMarryState, //0 单身 1 已经结婚  2 离婚
            xuanYan: self.xuanYan[0] ? self.xuanYan[0][eXuanYan.xuanYan] : ''
        };
        return player.SendMessage(route, Msg)
    }

    var toMarryID = roleID==self.marryInfo[0][eMarryInfo.roleID] ? self.marryInfo[0][eMarryInfo.toMarryID]:self.marryInfo[0][eMarryInfo.roleID];
    self.marry.GetPlayerInfo(toMarryID, function (err, details) {

        if (!!err) {
            logger.error('error when asyncGetPlayerInfo for GetPlayerInfo file, %s', details.roleID,
                utils.getErrorMessage(err));
        }
        if (!details) {
            logger.warn('warn when SendMarryState for details is null ,roleID=%j,details=%j', self.owner.id,
                details);
        }

        var Msg = {
            result: errorCodes.OK,
            state: self.playerMarryState, //0 单身 1 已经结婚  2 离婚
            marryID: toMarryID,
            marryName:  details.name ? details.name : '',
            xinWuID: self.marryInfo[0][eMarryInfo.xinWuID],
            openID: details.openID ? details.openID : '',
            picture: details.picture ? details.picture : '',
            xuanYan: self.xuanYan[0] ? self.xuanYan[0][eXuanYan.xuanYan] : ''
        };
        var customID = player.GetWorldState(eWorldState.CustomID);
        var tempCustom = cityManager.GetCity(customID);
        tempCustom.SendMarryAoi(player);
        return player.SendMessage(route, Msg);
    });
};

/**主动请求客户端  同步未读取的消息数 */
handler.SendMarryMsgNum = function(roleID, notRead){
    var self = this;
    if(!!self.lookNum[0]){
        self.marry.SendToMarryMsg(roleID, self.lookNum[0][eMarryMsg.marryMsgNum], notRead);
    }

};

/** 拒绝求婚 */
handler.Refuse = function(fromMarryID, marryID, callback){
    var self = this;
    var player = self.owner;

    if(!self.lookNum[0]){
        self.lookNum[0] = {
            0: self.owner.id,
            1: 1
        };
    }
    for(var index in self.toMarryList){
        var toMarry = self.toMarryList[index];
        if(!!toMarry){
            if(fromMarryID==toMarry[eToMarryInfo.roleID] && player.id==toMarry[eToMarryInfo.toMarryID] && marryID==toMarry[eToMarryInfo.marryID] && 0==toMarry[eToMarryInfo.state]){
                //delete self.toMarryList[index];
                toMarry[eToMarryInfo.state] = 2;
                toMarry[eToMarryInfo.readState] = 1; //已读操作
                if(self.lookNum[0][eMarryMsg.marryMsgNum]>0){
                    --self.lookNum[0][eMarryMsg.marryMsgNum];   //自己处理了求婚信  求婚信消息数减一
                    if(self.lookNum[0][eMarryMsg.marryMsgNum] == 0){
                        //主动发送给客户端  求婚者消息数量
                        self.marry.SendToMarryMsg(player.id, self.lookNum[0][eMarryMsg.marryMsgNum]);
                    }
                }
                break;
            }
        }

    }
    var fromMarryPlayer = playerManager.GetPlayer(fromMarryID);
    //消息提示
//    if(!self.lookNum[0]){
//        self.lookNum[0] = {
//            0: self.owner.id,
//            1: 1
//        };
//    }else{
//        ++self.lookNum[0][eMarryMsg.marryMsgNum];
//    }

    if(!!fromMarryPlayer) {
        //求婚玩家在线
        for(var index in fromMarryPlayer.toMarryManager.toMarryList) {
            var fromToMarrry = fromMarryPlayer.toMarryManager.toMarryList[index];
            if(!!fromToMarrry){
                if (fromMarryID == fromToMarrry[eToMarryInfo.roleID] && player.id == fromToMarrry[eToMarryInfo.toMarryID] && marryID==fromToMarrry[eToMarryInfo.marryID]) {
                    fromToMarrry[eToMarryInfo.state] = 2;
                    break;
                }
            }
        }
        if(!fromMarryPlayer.toMarryManager.lookNum[0]){
            fromMarryPlayer.toMarryManager.lookNum[0] = {
                0: fromMarryPlayer.id,
                1: 1
            };
        }else{
            ++fromMarryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum];
        }
        var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
        //主动发送给客户端  求婚者消息数量
        fromMarryPlayer.toMarryManager.marry.SendToMarryMsg(fromMarryPlayer.id, fromMarryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum]);
        self.sendMail(player.id, playerName, fromMarryID, 2, callback);
    }else{
        //其他cs玩家
        pomelo.app.rpc.ps.psRemote.Refuse(null, player.id, fromMarryID, marryID, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
            }else{
                var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
                if(0 == res){
                    self.sendMail(player.id, playerName, fromMarryID, 2, callback);
                }
//                else if(errorCodes.MARRY_OFFLINE == res){
//                    //求婚玩家不在线 直接操作数据库
//                    csSql.SaveRefuseMarry(fromMarryID, player.id, marryID, function(err, res){
//                        if (!!err) {
//                            logger.error('error when Refuse file: toMarryManager , %s', player.id,
//                                utils.getErrorMessage(err));
//                        }
//                        self.sendMail(player.id, playerName, fromMarryID, 2, callback);
//                    });
//                }
            }
        });
    }
    //无论玩家在不在线 都要直接操作数据库
    csSql.SaveRefuseMarry(fromMarryID, player.id, marryID, function(err, res){
        if (!!err) {
            logger.error('error when Refuse file: toMarryManager , %s', player.id,
                utils.getErrorMessage(err));
        }
        //self.sendMail(player.id, playerName, fromMarryID, 2, callback);
    });
}

//发送通知邮件  type 1 通知结婚 2 拒绝求婚 3 通知离婚 4 拒绝离婚 5系统离婚
handler.sendMail = function(playerID, playerName, fromMarryID, type, callback){
    //邮件通知
    var mailDetail = {
        roleID: playerID,
        recvID: +fromMarryID,
        subject: stringValue.sPublicString.mailTitle_3,
        mailType: gameConst.eMailType.System, //gameConst.eMailType.User
        items:[]
    };
    if(1 == type){
        mailDetail['content'] =  util.format(stringValue.sMarryString.content_1, playerName);
    }else if(2 == type){
        mailDetail['content'] =  util.format(stringValue.sMarryString.content_2, playerName);
    }else if(3 == type){
        mailDetail['content'] =  util.format(stringValue.sMarryString.content_3, playerName);
    }else if(4 == type){
        mailDetail['content'] =  util.format(stringValue.sMarryString.content_4, playerName);
    }else if(5 == type){
        mailDetail['content'] =  util.format(stringValue.sMarryString.content_5, playerName);
    }else if(6 == type){
        mailDetail['content'] =  util.format(stringValue.sMarryString.content_6, playerName);
    }
    //mailDetail.items.push([1002, 100]);
    //发送邮件
    pomelo.app.rpc.ms.msRemote.SendMail(null, mailDetail, callback);
};

/** 获取求婚信 和 拒绝信*/
handler.GetMarryMassage = function(type , callback){
    var self = this;
    var tomarry = [];
//    self.lookNum[0] = {
//        0: self.owner.id,
//        1: 0
//    };
    for(var i in self.toMarryList){
        if(!!self.toMarryList[i]){
            //过滤超时的求婚信息
            if(new Date().setDate(new Date(self.toMarryList[i][eToMarryInfo.toMarryTime]).getDate()+defaultValues.delete_marry_day) > new Date()){
                tomarry.push(self.toMarryList[i]);
            }else{
                delete self.toMarryList[i]
            }
        }
    }
    var massageList = [];
    var refuseNum = 0;
    async.each(tomarry, function (toMarryInfo, eachCallback) {
            var friendID;

            if(self.owner.id==toMarryInfo[eToMarryInfo.roleID] && 2==toMarryInfo[eToMarryInfo.state] && type==1){ // 我发出的 被拒绝信
                friendID = toMarryInfo[eToMarryInfo.toMarryID];
                //获取拒绝信时 将未读取过的标记为已读取
                if(0 == toMarryInfo[eToMarryInfo.readState]){
                    toMarryInfo[eToMarryInfo.readState] = 1;
                    if(self.lookNum[0][eMarryMsg.marryMsgNum]>0){
                        --self.lookNum[0][eMarryMsg.marryMsgNum];   //自己处理了求婚信  求婚信消息数减一
                    }
                }

                self.toMarryAndRefuse(friendID, toMarryInfo, massageList, eachCallback);

            }
            else if(self.owner.id==toMarryInfo[eToMarryInfo.toMarryID] && 0==toMarryInfo[eToMarryInfo.state]  && type==2){// 我收到的 求婚信
                friendID = toMarryInfo[eToMarryInfo.roleID];  //我收到的信件 求婚信
                self.toMarryAndRefuse(friendID, toMarryInfo, massageList, eachCallback);

            }
            else if(self.owner.id==toMarryInfo[eToMarryInfo.roleID] && 2==toMarryInfo[eToMarryInfo.state]  && type==2){// 获取求婚信时候 就要计算未读取的 拒绝信数量
                if(0 == toMarryInfo[eToMarryInfo.readState]){
                    ++refuseNum;
                }
                return eachCallback();
            }
            else if(self.owner.id==toMarryInfo[eToMarryInfo.toMarryID] && 3==toMarryInfo[eToMarryInfo.state]  && type==3){// 我收到的 离婚协议
                friendID = toMarryInfo[eToMarryInfo.roleID];  //我收到的信件 求婚信
                self.toMarryAndRefuse(friendID, toMarryInfo, massageList, eachCallback);
            }
            else if(self.owner.id==toMarryInfo[eToMarryInfo.toMarryID] && 6==toMarryInfo[eToMarryInfo.state]  && type==4){// 我收到的 亲密互动
                friendID = toMarryInfo[eToMarryInfo.roleID]; //我收到的信件 求婚信
                self.toMarryAndRefuse(friendID, toMarryInfo, massageList, eachCallback);
            }
            else{
                return eachCallback();
            }
        },
        function (err) {
            if (!!err) {
                logger.error('error when GetMarryMassage for union file, %s',
                    utils.getErrorMessage(err));
            }
            var retArray = {
                result: errorCodes.OK
            };
            //self.SendMarryMsgNum(self.owner.id);
            retArray['marryMsg'] = massageList;
            retArray['refuseNum'] = refuseNum;
            if(2==type){

                retArray['countNum'] = defaultValues.marry_count_day - self.countNum;
            }
            return callback(null, retArray);
        });

};

//封装 1 求婚信  和 2 拒绝信 和 3 离婚信 和 4 亲密信 拼装方法
handler.toMarryAndRefuse = function(friendID, toMarryInfo, massageList, eachCallback){
    var self= this;
    //self.marry.GetPlayerInfo(friendID, function (err, details) {
    pomelo.app.rpc.ps.psRemote.GetOffPlayerInfoNew(null, friendID, function(err, res) {
        var friend = {};
        if (!!err) {
            logger.error('error when asyncGetPlayerInfo for GetPlayerInfo file, %s', res[ePlayerInfo.ROLEID],
                utils.getErrorMessage(err));
            return eachCallback();
        }
        if (!res) {
            logger.warn('warn when asyncGetPlayerInfo for details is null ,roleID=%j,details=%j', self.owner.id,
                res);
            return eachCallback();
        }
        //根据求婚列表标记已经求过的对象
        friend['roleID'] = toMarryInfo[eToMarryInfo.roleID];
        friend['toMarryID'] = toMarryInfo[eToMarryInfo.toMarryID];
        friend['toMarryTime'] = utilSql.DateToString(new Date(toMarryInfo[eToMarryInfo.toMarryTime]));
        friend['state'] = toMarryInfo[eToMarryInfo.state];
        friend['xinWuID'] = toMarryInfo[eToMarryInfo.xinWuID];
        friend['marryName'] = res[ePlayerInfo.NAME] ? res[ePlayerInfo.NAME] : '';
        friend['tempID'] = res[ePlayerInfo.TEMPID] ? res[ePlayerInfo.TEMPID] : '';

        var xinWu = templateManager.GetTemplateByID("tokenTemplate", friend['xinWuID']);
        friend['effectID'] = xinWu[tToken.effectID];
        var xinWuNameID = xinWu[tToken.xinWuNameID];
        var xinwuNameTemp = templateManager.GetTemplateByID('LocalizeTemplate', xinWuNameID);
        friend['effectName'] = xinwuNameTemp[tLocalize.description];
        friend['readState'] = toMarryInfo[eToMarryInfo.readState];
        friend['marryID'] = toMarryInfo[eToMarryInfo.marryID];

        massageList.push(friend);
        //logger.fatal("##### toMarryAndRefuse massageList:  %j", massageList);
        return eachCallback();
    });
};

/** 好友求婚 公会求婚 列表 同步循环获取玩家信息   */
handler.asyncGetPlayerInfo = function(roleList, callback){
    var self = this;
    //logger.fatal("##### asyncGetPlayerInfo :%j ", roleList);
    var friendL = [];
    async.each(roleList, function (friendID, eachCallback) {
            self.marry.GetPlayerInfo(friendID, function (err, details) {
                var friend = {};
                if (!!err) {
                    logger.error('error when asyncGetPlayerInfo for GetPlayerInfo file, %s', friendID,
                        utils.getErrorMessage(err));
                    return eachCallback();
                }
                if (!details) {
                    logger.warn('warn when asyncGetPlayerInfo for details is null ,roleID=%j,details=%j', self.owner.id,
                        details);
                    return eachCallback();
                }
                //根据求婚列表标记已经求过的对象
                friend['state'] = 0;
                for(var index in self.toMarryList){
                    if(!!self.toMarryList[index]){
                        var roleID = self.toMarryList[index][eToMarryInfo.toMarryID];
                        var state = self.toMarryList[index][eToMarryInfo.state];
                        var toMarryTime = self.toMarryList[index][eToMarryInfo.toMarryTime];
                        if(roleID == friendID){
                            if(!!toMarryTime && new Date().setDate(new Date(toMarryTime).getDate()+1)> new Date()){
                                //上次请求未超过24小时
                                if(0 == state){
                                    //判断对方是否处理
                                    friend['state'] = 1;//24小时内已经请求过
                                    break
                                }else if(2 == state){
                                    friend['state'] = 2;//对方已拒绝
                                    break
                                }
                            }else{
                                friend['state'] = 0;//超过24小时 可求婚
                            }
                        }else{
                            friend['state'] = 0;
                        }
                    }
                }
                friend['roleID'] = +details.roleID;
                friend['roleName'] = details.name ? details.name : '';
                friend['openID'] = details.openID;
                friend['tempID'] = details.tempID;
                friend['picture'] = details.picture;
                friend['playerLevel'] = details.expLevel ? details.expLevel : 0;
                friend['vipLevel'] = details.VipLevel ? details.VipLevel : 0;
                friend['playerZhanli'] = details.zhanli ? details.zhanli : 0;
                friend['xuanYan'] = details.xuanYan;
                var jobMarry = self.marry.jobMarryCheck(self.owner.GetPlayerInfo(ePlayerInfo.TEMPID), details.tempID);
                if(defaultValues.marryExpLevel < friend['playerLevel'] && jobMarry){
                    friendL.push(friend);  //结婚条件要 大于 34级  职业性别相符
                }

                return eachCallback();
            });
        },
        function (err) {
            if (!!err) {
                logger.error('error when GetPlayerUnionInfo for union file, %s',
                    utils.getErrorMessage(err));
            }
            logger.fatal('#####  asyncGetPlayerInfo for union file,roleID=%j,friendL=%j', self.owner.id,
                friendL);
            var retArray = {
                result: errorCodes.OK
            };
            retArray['marryMsg'] = friendL;
            return callback(null, retArray);
        });
}

/**发起求婚*/
handler.ToMarry = function (toMarryID, xinWuID, callback) {

    var self = this;
    var player = self.owner;
    var nowDate = new Date();


    var csID = pomelo.app.getServerId();
    logger.fatal("###### ToMarry roleID: %j , csID: %j", player.id, csID );

    //***********求婚者的校验    开始
    //是否单身
    if(1 == self.playerMarryState){
        return callback(null, errorCodes.MARRY_ALREADY_SELF);
    }
    //判断离婚时间是否超过24小时
    if(!!self.divorceTime){
        var divorceTime = self.divorceTime;
        divorceTime =  new Date(divorceTime);
        var nowDate = new Date();
        if((nowDate-divorceTime)/3600000 < 24){
            return callback(null, errorCodes.MARRY_DIVORCE_NOT_24);
        }
    }

    //等级大于34级
    if(defaultValues.marryExpLevel > player.GetPlayerInfo(ePlayerInfo.ExpLevel)){
        return callback(null, errorCodes.MARRY_LEVEL);
    }

    var xinWu = templateManager.GetTemplateByID("tokenTemplate", xinWuID);
    if(!xinWu){
        return callback(null, errorCodes.MARRY_TOKEN_NOT_FIND);
    }
    //检查求婚 需要花费的财产
    //钻石资产
    var assets = {
        tempID : xinWu[tToken.priceTypeID],
        value : xinWu[tToken.xinWuPrice]
    };
    //判断财产
    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false) {
        return callback(null, errorCodes.NoAssets);
    }

    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    for(var index in self.toMarryList){
        if(!!self.toMarryList[index]){
            var toMarryTime = self.toMarryList[index][eToMarryInfo.toMarryTime];
            //一天只能向一位玩家求婚一次
            if(self.toMarryList[index][eToMarryInfo.toMarryID]==toMarryID && new Date(toMarryTime)>today && (0 == self.toMarryList[index][eToMarryInfo.state] || 2 == self.toMarryList[index][eToMarryInfo.state])){
                return callback(null, errorCodes.MARRY_COUNT_OUT_ONE);
            }
        }
    }

    if(self.countNum >= 5){
        return callback(null, errorCodes.MARRY_COUNT_OUT);  //超出每天求婚次数
    }
    //***********求婚者的校验   结束

    var toMarryPlayer = playerManager.GetPlayer(toMarryID);
    var roleTempId = player.GetPlayerInfo(ePlayerInfo.TEMPID);
    if(!toMarryPlayer){   //玩家可能在其他的cs中
        pomelo.app.rpc.ps.psRemote.ToMarry(null, player.id, roleTempId, toMarryID, xinWuID, nowDate, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
            }else{
                if(0 == res){
                    //添加自己的求婚记录
                    player.toMarryManager.FromMarry(player.id, toMarryID, 0, nowDate, xinWuID);
                    player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], gameConst.eAssetsChangeReason.Reduce.ToMarry);
                    ++self.countNum;
                }
                return callback(null, res);

            }
        });
        //return callback(null,errorCodes.MARRY_OFFLINE);
    }else{  //在线玩家直接处理
        self.ToMarryInfo(toMarryPlayer, player.id, roleTempId, xinWuID, nowDate, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
            }else{
                if(0 == res){
                    //添加自己的求婚记录
                    player.toMarryManager.FromMarry(player.id, toMarryID, 0, nowDate, xinWuID);
                    player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], gameConst.eAssetsChangeReason.Reduce.ToMarry);
                    ++self.countNum;
                }
                return callback(null, res);

            }
        });

    }
};

/** 发起求婚 逻辑校验操作 */
handler.ToMarryInfo = function(toMarryPlayer, roleId, roleTempId, xinWuID, nowDate, callback){
    var self = this;

    if(!toMarryPlayer){
        return callback(null, errorCodes.NoRole);
    }
    if(!!toMarryPlayer.toMarryManager){
        var toMarryState = toMarryPlayer.toMarryManager.playerMarryState;
        if(1 == toMarryState){
            return callback(null, errorCodes.MARRY_ALREADY);
        }
        var marryNum = 0;
        var marryList = toMarryPlayer.toMarryManager.toMarryList;
        for(var index in marryList){
            if(!!marryList[index]){
                if(toMarryPlayer.id == marryList[index][eToMarryInfo.toMarryID]){
                    marryNum++;
                }
            }
        }
        if(marryNum >= 30){
            return callback(null, errorCodes.MARRY_NOT_MORE);
        }
    }

    var toMarryTempId = toMarryPlayer.GetPlayerInfo(ePlayerInfo.TEMPID);
    var toMarryId = toMarryPlayer.GetPlayerInfo(ePlayerInfo.ROLEID);
    var toMarryLevel = toMarryPlayer.GetPlayerInfo(ePlayerInfo.ExpLevel);


    var jobmarry = self.marry.jobMarryCheck(roleTempId, toMarryTempId);

    if(defaultValues.marryExpLevel > toMarryLevel){
        return callback(null, errorCodes.MARRY_LEVEL_TO);
    }

    if(!jobmarry){
        return callback(null, errorCodes.MARRY_ITEMWRONGJOB);
    }


    //添加被求婚记录
    toMarryPlayer.toMarryManager.FromMarry(roleId, toMarryId, 0, nowDate, xinWuID);

    //根据信物id 获取相应信物

    //给被求婚者消息提示
    if(!toMarryPlayer.toMarryManager.lookNum[0]){
        toMarryPlayer.toMarryManager.lookNum[0] = {
            0: toMarryPlayer.id,
            1: 1
        };
    }else{
        ++toMarryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum];
    }

    //主动发送给客户端  被求婚者消息数量
    toMarryPlayer.toMarryManager.marry.SendToMarryMsg(toMarryId, toMarryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum]);
    return callback(null, errorCodes.OK);
}


/**发起离婚*/
handler.Divorce = function (divorceID, type, callback) {
    var self = this;
    var player = self.owner;
    if(!!self.marryInfo[0] && self.marryInfo[0][eMarryInfo.state]==1 && (divorceID!=player.id||4 == type)){
        if(divorceID==self.marryInfo[0][eMarryInfo.roleID] || divorceID==self.marryInfo[0][eMarryInfo.toMarryID]){
            if(1 == type){ // 1 强制离婚
                self.QiangZhi(divorceID, callback);
            }else if(2 == type){ // 2 协议离婚
                self.XieYi(divorceID,  callback);
            }else if(3 == type){ // 3 系统离婚（由于姻缘值减为0）
                self.SysDivorce(divorceID,  callback);
            }else if(4 == type){ // 4 删除角色时候 自动离婚
                self.DelRoleDivorce(divorceID,  callback);
            }
        }
    }else{
        return callback(null,errorCodes.NOT_MARRY);
    }
};


//协议方式离婚
handler.XieYi = function(divorceID, callback){
    var self = this;
    var player = self.owner;
    var nowDate = new Date();

    for(var t in self.toMarryList){
        if(!!self.toMarryList[t]){
            if(3 == self.toMarryList[t][eToMarryInfo.state] && player.id == self.toMarryList[t][eToMarryInfo.roleID]){
                var toXieYiTime = new Date(self.toMarryList[t][eToMarryInfo.toMarryTime]);
                if((nowDate-toXieYiTime)/3600000 < 24){
                    return callback(null, errorCodes.MARRY_DIVORCEXIEYI_NOT_24);
                }
            }
        }
    }

    //添加离婚信记录
    player.toMarryManager.FromMarry(player.id, divorceID, 3, nowDate, 0);

    var marryPlayer = playerManager.GetPlayer(divorceID);
    if(!!marryPlayer){
        //添加被离婚记录
        marryPlayer.toMarryManager.FromMarry(player.id, divorceID, 3, nowDate, 0);
//        //给被求婚者消息提示
//        if(!marryPlayer.toMarryManager.lookNum[0]){
//            marryPlayer.toMarryManager.lookNum[0] = {
//                0: self.owner.id,
//                1: 1
//            };
//        }else{
//            ++marryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum];
//        }
        //主动发送给客户端  被求婚者消息数量
        marryPlayer.toMarryManager.marry.SendToMarryMsg(divorceID, marryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum],1);
        pomelo.app.rpc.rs.rsRemote.AddDivorceLog(null, player.id, divorceID, 1, utils.done);
        return callback(null, errorCodes.OK);
    }else{
        //查看其它cs
        pomelo.app.rpc.ps.psRemote.ToDivorce(null, player.id, divorceID, 2, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
                return callback(err);
            }

            if(errorCodes.MARRY_OFFLINE == res){
                //离线直接修改数据库
                csSql.SaveDivorceAgree(player.id, divorceID, function(err, res){
                    if (!!err) {
                        logger.error('error when Divorce xieyi file: toMarryManager , %s', player.id,
                            utils.getErrorMessage(err));
                    }
                });
            }
            pomelo.app.rpc.rs.rsRemote.AddDivorceLog(null, player.id, divorceID, 1, utils.done);
            return callback(null, errorCodes.OK);

        });
    }
}

//强制方式离婚
handler.QiangZhi = function(divorceID,  callback){
    var self = this;
    var player = self.owner;
    var roleID = self.marryInfo[0][eMarryInfo.roleID];
    var toMarryID = self.marryInfo[0][eMarryInfo.toMarryID];
    //钻石资产
    var assets = {
        tempID : globalFunction.GetYuanBaoTemp(),
        value : defaultValues.divorce_yuanbao //获取强制离婚话费钻石数
    };
    //判断财产
    if (player.assetsManager.CanConsumeAssets(assets['tempID'], assets['value']) == false) {
        return callback(null, errorCodes.NoAssets);
    }
    player.assetsManager.AlterAssetsValue(assets['tempID'], -assets['value'], gameConst.eAssetsChangeReason.Reduce.Divorce);
    self.marryInfo[0][eMarryInfo.state] = 2;
    self.playerMarryState = 2;
    self.divorceTime = new Date();
    //获取离婚对象
    var marryPlayer = playerManager.GetPlayer(divorceID);
    if(!!marryPlayer){
        //离婚对象在线
        marryPlayer.toMarryManager.marryInfo[0][eMarryInfo.state] = 2;
        marryPlayer.toMarryManager.playerMarryState = 2;
        marryPlayer.toMarryManager.divorceTime = self.divorceTime;
        //清空消息数
        marryPlayer.toMarryManager.lookNum[0] = {
            0: self.owner.id,
            1: 0
        };
        self.SendMarryState(divorceID);
        marryPlayer.toMarryManager.marry.SendToMarryMsg(divorceID, marryPlayer.toMarryManager.lookNum[0][eMarryMsg.marryMsgNum]);
    }else{
        //查看其它cs
        pomelo.app.rpc.ps.psRemote.ToDivorce(null, player.id, divorceID, 1, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
                return callback(err);
            }
          if(errorCodes.MARRY_OFFLINE == res){
            //离线直接修改数据库
            csSql.SaveDivorceMarry(divorceID, player.id, function(err, res){
                if (!!err) {
                    logger.error('error when Divorce qiangzhi file: toMarryManager , %s', player.id,
                        utils.getErrorMessage(err));
                }
            });
          }
        });
    }
    pomelo.app.rpc.rs.rsRemote.UpdateMarryInfo(null, self.marryInfo[0], function(err, res){
        if(!!err){
            logger.error(utils.getErrorMessage(err));
            return callback(err);
        }
        self.lookNum[0] = {
            0: self.owner.id,
            1: 0
        };
        self.SendMarryMsgNum(player.id);
        self.SendMarryState(player.id);
        var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
        //给被强制离婚人发送邮件  3是离婚邮件
        self.sendMail(player.id, playerName, divorceID, 3, utils.done);
        //删除排行榜中数据
        pomelo.app.rpc.chart.chartRemote.deleteMarryChart(null, roleID+"+"+toMarryID, utils.done);
        return callback(null, errorCodes.OK);


    });

};

//系统离婚  由于姻缘值递减为 0
handler.SysDivorce = function(divorceID,  callback){
    var self = this;
    var player = self.owner;
    var roleID = self.marryInfo[0][eMarryInfo.roleID];
    var toMarryID = self.marryInfo[0][eMarryInfo.toMarryID];

    self.marryInfo[0][eMarryInfo.state] = 2;
    self.playerMarryState = 2;
    self.divorceTime = new Date();

    //获取离婚对象
    var marryPlayer = playerManager.GetPlayer(divorceID);
    if(!!marryPlayer){
        //离婚对象在线
        marryPlayer.toMarryManager.marryInfo[0][eMarryInfo.state] = 2;
        marryPlayer.toMarryManager.playerMarryState = 2;
        self.SendMarryState(divorceID);
    }else{
        //查看其它cs
        pomelo.app.rpc.ps.psRemote.ToDivorce(null, player.id, divorceID, 1, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
                return callback(err);
            }
            if(errorCodes.MARRY_OFFLINE == res){
                //离线直接修改数据库
                csSql.SaveDivorceMarry(divorceID, player.id, function(err, res){
                    if (!!err) {
                        logger.error('error when Divorce qiangzhi file: toMarryManager , %s', player.id,
                            utils.getErrorMessage(err));
                    }
                });
            }
        });
    }

    self.lookNum[0] = {
        0: self.owner.id,
        1: 0
    };
    self.SendMarryMsgNum(player.id);
    self.SendMarryState(player.id);
    var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
    //给被系统离婚人发送邮件  3是离婚邮件
    self.sendMail(player.id, playerName, divorceID, 5, utils.done);

    self.sendMail(divorceID, self.peiouName, player.id, 5, utils.done);
    //删除排行榜中数据
    pomelo.app.rpc.chart.chartRemote.deleteMarryChart(null, roleID+"+"+toMarryID, utils.done);
    return callback(null, errorCodes.OK);

};

//删除角色时 离婚
handler.DelRoleDivorce = function(divorceID,  callback){
    var self = this;
    var player = self.owner;
    var roleID = self.marryInfo[0][eMarryInfo.roleID];
    var toMarryID = self.marryInfo[0][eMarryInfo.toMarryID];

    self.marryInfo[0][eMarryInfo.state] = 2;
    self.playerMarryState = 2;
    self.divorceTime = new Date();

    //获取离婚对象
    var marryPlayer = playerManager.GetPlayer(divorceID);
    if(!!marryPlayer){
        //离婚对象在线
        marryPlayer.toMarryManager.marryInfo[0][eMarryInfo.state] = 2;
        marryPlayer.toMarryManager.playerMarryState = 2;
        self.SendMarryState(divorceID);
    }else{
        //查看其它cs
        pomelo.app.rpc.ps.psRemote.ToDivorce(null, player.id, divorceID, 1, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
                return callback(err);
            }
            if(errorCodes.MARRY_OFFLINE == res){
                //离线直接修改数据库
                csSql.SaveDivorceMarry(divorceID, player.id, function(err, res){
                    if (!!err) {
                        logger.error('error when Divorce qiangzhi file: toMarryManager , %s', player.id,
                            utils.getErrorMessage(err));
                    }
                });
            }
        });
    }
//    self.lookNum[0] = {
//        0: self.owner.id,
//        1: 0
//    };
//    self.SendMarryMsgNum(player.id);
//    self.SendMarryState(player.id);
    var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
    //给被系统离婚人发送邮件  3是离婚邮件
    self.sendMail(player.id, playerName, divorceID, 6, utils.done);

    //self.sendMail(divorceID, self.peiouName, player.id, 5, utils.done);
    //删除排行榜中数据
    pomelo.app.rpc.chart.chartRemote.deleteMarryChart(null, roleID+"+"+toMarryID, utils.done);
    return callback(null, errorCodes.OK);

};


/** 同意离婚 */
handler.AgreeDivorce = function(fromDivorceID, callback){
    var self = this;
    var player = self.owner;
    //检查离婚协议是否存在
    var MyToMarry;
    var hisDivorce = false;
    for(var index in self.toMarryList){
        if(!!self.toMarryList[index]){
            if(fromDivorceID == self.toMarryList[index][eToMarryInfo.roleID] && player.id == self.toMarryList[index][eToMarryInfo.toMarryID] && 3==self.toMarryList[index][eToMarryInfo.state]){
                MyToMarry = self.toMarryList[index];
                hisDivorce = true;
                break;
            }
        }
    }
    if(!hisDivorce){
        return callback(null, {'result': errorCodes.MARRY_NOT_FIND_DIVORCE});
    }

    //修改自身状态
    MyToMarry[eToMarryInfo.state] = 4; //4同意离婚
    self.marryInfo[0][eMarryInfo.state] = 2;
    self.playerMarryState = 2;
    self.divorceTime = new Date();

    var roleID = self.marryInfo[0][eMarryInfo.roleID];
    var toMarryID = self.marryInfo[0][eMarryInfo.toMarryID];

    //获取离婚对象
    var divorcePlayer = playerManager.GetPlayer(fromDivorceID);
    if(!!divorcePlayer){
        //离婚对象在线
        divorcePlayer.toMarryManager.marryInfo[0][eMarryInfo.state] = 2;
        divorcePlayer.toMarryManager.playerMarryState = 2;
        divorcePlayer.toMarryManager.UpdateToMarry(fromDivorceID, player.id, 3, 4);
        divorcePlayer.toMarryManager.divorceTime = self.divorceTime;
        //清空消息数
        divorcePlayer.toMarryManager.lookNum[0] = {
            0: fromDivorceID,
            1: 0
        };
        self.SendMarryState(fromDivorceID); //人物状态
        self.SendMarryMsgNum(fromDivorceID); //清空消息数
    }else{
        //查看其它cs
        pomelo.app.rpc.ps.psRemote.ToAgreeDivorce(null, player.id, fromDivorceID, function(err, res){
            if(!!err){
                logger.error(utils.getErrorMessage(err));
                return callback(err);
            }else{
                if(errorCodes.MARRY_OFFLINE == res){
                    //离线直接修改数据库
                    csSql.SaveDivorceMarry(fromDivorceID, player.id, function(err, res){
                        if (!!err) {
                            logger.error('error when Divorce qiangzhi file: toMarryManager , %s', player.id,
                                utils.getErrorMessage(err));
                        }
                    });
                }
            }
        });
    }
    pomelo.app.rpc.rs.rsRemote.UpdateMarryInfo(null, self.marryInfo[0], function(err, res){
        if(!!err){
            logger.error(utils.getErrorMessage(err));
        }
        var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
        self.SendMarryState(player.id);
        self.sendMail(player.id, playerName, toMarryID, 3, utils.done);
        //删除排行榜中数据
        pomelo.app.rpc.chart.chartRemote.deleteMarryChart(null, roleID+"+"+toMarryID, utils.done);
        self.lookNum[0] = {
            0: self.owner.id,
            1: 0
        };
        self.SendMarryMsgNum(player.id);
        return callback(null, {'result': errorCodes.OK});

    });
};

/** 拒绝离婚 */
handler.RefuseDivorce = function(fromDivorceID, callback){
    var self = this;
    var player = self.owner;
    //检查离婚协议是否存在
    var MyToMarry;
    var hisDivorce = false;
    for(var index in self.toMarryList){
        if(!!self.toMarryList[index]){
            if(fromDivorceID == self.toMarryList[index][eToMarryInfo.roleID] && player.id == self.toMarryList[index][eToMarryInfo.toMarryID] && 3==self.toMarryList[index][eToMarryInfo.state]){
                MyToMarry = self.toMarryList[index];
                hisDivorce = true;
                break;
            }
        }
    }
    if(!hisDivorce){
        return callback(null, {'result': errorCodes.MARRY_NOT_FIND_DIVORCE});
    }

    //修改自身状态
    MyToMarry[eToMarryInfo.state] = 5; //5不同意离婚

    //获取离婚对象
    var divorcePlayer = playerManager.GetPlayer(fromDivorceID);
    if(!!divorcePlayer){
        //离婚对象在线
        divorcePlayer.toMarryManager.UpdateToMarry(fromDivorceID, player.id, 3, 5);
    }else{
        //离线直接修改数据库
        csSql.sp_saveRefuseDivorce(fromDivorceID, player.id, function(err, res){
            if (!!err) {
                logger.error('error when Divorce qiangzhi file: toMarryManager , %s', player.id,
                    utils.getErrorMessage(err));
            }
            //return callback(null, {'result': errorCodes.OK});
        });
    }
    pomelo.app.rpc.rs.rsRemote.RefuseDivorce(null, player.id, fromDivorceID, 2, utils.done);
    //pomelo.app.rpc.rs.rsRemote.AddDivorceLog(null, player.id, fromDivorceID, 2, utils.done);
    var playerName = player.GetPlayerInfo(ePlayerInfo.NAME);
    self.sendMail(player.id, playerName, fromDivorceID, 4, utils.done);
    return callback(null, {'result': errorCodes.OK});

};

/** 添加被求婚记录 和 被离婚记录   0 求婚  3 离婚  5 亲密信 */
handler.FromMarry = function(roid, toMarryID, state, nowDate, xinWuID){
    var fromMarry = {
        0 : roid,
        1 : toMarryID,
        2 : utilSql.DateToString(new Date(nowDate)),
        3 : state,
        4 : xinWuID,
        5 : 0,  //读取状态  未读取
        6 : 0   //marryID 每人的信件ID

    }
    var indexNum = 0;
    //设置marryID
    var marryID = 0;
    for(var index in this.toMarryList){
        if(!!this.toMarryList[index]){
            if((roid == this.toMarryList[index][eToMarryInfo.roleID] && toMarryID == this.toMarryList[index][eToMarryInfo.toMarryID]) || (toMarryID == this.toMarryList[index][eToMarryInfo.roleID] && roid == this.toMarryList[index][eToMarryInfo.toMarryID])){
                if(marryID <= this.toMarryList[index][eToMarryInfo.marryID]){
                    marryID = _.clone(this.toMarryList[index][eToMarryInfo.marryID]);
                    marryID = ++marryID;
                }
            }
        }
        indexNum = ++index;
    }
    fromMarry[6] = marryID;
    this.toMarryList[indexNum] = fromMarry;

};

/** 修改求婚记录 */
handler.UpdateToMarry = function(roleID, toMarryID, oldState, newState, marryID){
    if(oldState == 0){  //求婚记录
        for(var index in this.toMarryList){
            if(!!this.toMarryList[index]){
                if(roleID==this.toMarryList[index][eToMarryInfo.roleID] && toMarryID==this.toMarryList[index][eToMarryInfo.toMarryID] && oldState==this.toMarryList[index][eToMarryInfo.state] && marryID==this.toMarryList[index][eToMarryInfo.marryID]){
                    this.toMarryList[index][eToMarryInfo.state] = newState;
                    this.toMarryList[index][eToMarryInfo.toMarryTime] = utilSql.DateToString(new Date());
                    break;
                }
            }
        }
    }else{          //离婚
        for(var index in this.toMarryList){
            if(!!this.toMarryList[index]){
                if(roleID==this.toMarryList[index][eToMarryInfo.roleID] && toMarryID==this.toMarryList[index][eToMarryInfo.toMarryID] && oldState==this.toMarryList[index][eToMarryInfo.state]){
                    this.toMarryList[index][eToMarryInfo.state] = newState;
                    this.toMarryList[index][eToMarryInfo.toMarryTime] = utilSql.DateToString(new Date());
                    break;
                }
            }
        }
    }

};

/**
 * 获取姻缘值排行榜
 * */
handler.GetMarryChart = function(callback){
    var self = this;
    var roleID = '';
    var toMarryID = '';
    if(!!self.marryInfo[0]){
        roleID = self.marryInfo[0][eMarryInfo.roleID];
        toMarryID = self.marryInfo[0][eMarryInfo.toMarryID];
    }

    pomelo.app.rpc.chart.chartRemote.GetChart(null, roleID+"+"+toMarryID, gameConst.eChartType.Marry,
        function (err, res) {
            if (!!err) {
                logger.error('##### GetMarryChart GetChart callback res: %j', res);
            }
            res['result'] = errorCodes.OK;
            return callback(null, res);

        });
}


handler.GetToMarrySqlStr = function () {
    var self = this;
    var dataStr = '';
    var myToMarryList = {};
    //保存求婚数据时 只保存自己发出求婚请求的数据 否则会插入重复的被求婚数据
    for (var index in this.toMarryList) {
        var tempToMarry = this.toMarryList[index];
        if(!!tempToMarry){
            if(self.owner.id == tempToMarry[eToMarryInfo.roleID] || 2 != tempToMarry[eToMarryInfo.state]){  //防止拒绝信插入重复数据
                dataStr += '(';
                for (var i = 0; i < eToMarryInfo.Max; ++i) {
                    var value = tempToMarry[i];
                    if (typeof  value == 'string') {
                        dataStr += '\'' + value + '\'' + ',';
                    }
                    else {
                        dataStr += value + ',';
                    }
                }
                dataStr = dataStr.substring(0, dataStr.length - 1);
                dataStr += '),';

                myToMarryList[index] = tempToMarry;
            }
        }
    }
    dataStr = dataStr.substring(0, dataStr.length - 1);

    var sqlString = utilSql.BuildSqlValues(myToMarryList);

    if (sqlString !== dataStr) {
        logger.error('toMarryList sqlString not equal:\n%j\n%j', sqlString, dataStr);
    }

    return sqlString;
};

handler.GetMarryInfoSqlStr = function () {
    var dataStr = '';
    for (var index in this.marryInfo) {
        var tempToMarry = this.marryInfo[index];
        dataStr += '(';
        for (var i = 0; i < eMarryInfo.Max; ++i) {
            var value = tempToMarry[i];
            if (typeof  value == 'string') {
                dataStr += '\'' + value + '\'' + ',';
            }
            else {
                dataStr += value + ',';
            }
        }
        dataStr = dataStr.substring(0, dataStr.length - 1);
        dataStr += '),';
    }
    dataStr = dataStr.substring(0, dataStr.length - 1);

    var sqlString = utilSql.BuildSqlValues(this.marryInfo);

    if (sqlString !== dataStr) {
        logger.error(' marryInfo sqlString not equal:\n%j\n%j', sqlString, dataStr);
    }

    return sqlString;
};

handler.GetMarryXuanyanSqlStr = function () {
    var dataStr = '';
    for (var index in this.xuanYan) {
        var tempToMarry = this.xuanYan[index];
        dataStr += '(';
        for (var i = 0; i < eXuanYan.Max; ++i) {
            var value = tempToMarry[i];
            if (typeof  value == 'string') {
                dataStr += '\'' + value + '\'' + ',';
            }
            else {
                dataStr += value + ',';
            }
        }
        dataStr = dataStr.substring(0, dataStr.length - 1);
        dataStr += '),';
    }
    dataStr = dataStr.substring(0, dataStr.length - 1);

    var sqlString = utilSql.BuildSqlValues(this.xuanYan);

    if (sqlString !== dataStr) {
        logger.error(' marryXuanYan sqlString not equal:\n%j\n%j', sqlString, dataStr);
    }

    return sqlString;
};

handler.GetMarryMsgSqlStr = function () {
    var dataStr = '';
    for (var index in this.lookNum) {
        var tempToMarry = this.lookNum[index];
        dataStr += '(';
        for (var i = 0; i < eMarryMsg.Max; ++i) {
            var value = tempToMarry[i];
            if (typeof  value == 'string') {
                dataStr += '\'' + value + '\'' + ',';
            }
            else {
                dataStr += value + ',';
            }
        }
        dataStr = dataStr.substring(0, dataStr.length - 1);
        dataStr += '),';
    }
    dataStr = dataStr.substring(0, dataStr.length - 1);

    var sqlString = utilSql.BuildSqlValues(this.lookNum);

    if (sqlString !== dataStr) {
        logger.error(' marryMsg sqlString not equal:\n%j\n%j', sqlString, dataStr);
    }

    return sqlString;
};




/***
 * 获取自己的 结婚 信息
 *
 * */
handler.GetMarryInfo = function () {
    var runeList = [];
    for (var id in this.marryInfo) {
        var tempMarry = this.marryInfo[id];
        var tempMsg = {};
        for (var i in tempMarry) {
            if (tempMarry[i] != eMarryInfo.Max) {
                tempMsg[i] = tempMarry[i];
            }
        }
        runeList.push(tempMsg);
    }
    return runeList;
};

//获取宣言
handler.GetXuanYan = function () {
    if(!!this.xuanYan[0]){
        return this.xuanYan[0][eXuanYan.xuanYan];
    }else{
        return "";
    }

}
