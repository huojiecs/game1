/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-10-28
 * Time: 上午11:52
 * To change this template use File | Settings | File Templates.
 */

var gameConst = require('../../tools/constValue');

var MailInfo = gameConst.eMailInfo;

module.exports = function () {
    return new Handler();
};

var Handler = function () {
    this.dataInfo = new Array(MailInfo.Max);
};

var handler = Handler.prototype;

handler.SetDataInfo = function (index, value) {
    this.dataInfo[index] = value;
};

handler.GetDataInfo = function (index) {
    return this.dataInfo[index];
};

handler.SetAllInfo = function (info) {
    this.dataInfo = info;
};

handler.SetMailDetail = function (mailDetail) {
    this.dataInfo[MailInfo.MailID] = mailDetail.mailID;
    this.dataInfo[MailInfo.RoleID] = mailDetail.roleID;
    this.dataInfo[MailInfo.SendID] = mailDetail.sendID;
    this.dataInfo[MailInfo.SendName] = mailDetail.sendName;
    this.dataInfo[MailInfo.Subject] = mailDetail.subject;
    this.dataInfo[MailInfo.Content] = mailDetail.content;
    this.dataInfo[MailInfo.MailState] = mailDetail.mailState;
    this.dataInfo[MailInfo.MailType] = mailDetail.mailType;
    this.dataInfo[MailInfo.SendTime] = mailDetail.sendTime;
    this.dataInfo[MailInfo.ItemID_0] = mailDetail.items[0][0];
    this.dataInfo[MailInfo.ItemNum_0] = mailDetail.items[0][1];
    this.dataInfo[MailInfo.ItemID_1] = mailDetail.items[1][0];
    this.dataInfo[MailInfo.ItemNum_1] = mailDetail.items[1][1];
    this.dataInfo[MailInfo.ItemID_2] = mailDetail.items[2][0];
    this.dataInfo[MailInfo.ItemNum_2] = mailDetail.items[2][1];
    this.dataInfo[MailInfo.ItemID_3] = mailDetail.items[3][0];
    this.dataInfo[MailInfo.ItemNum_3] = mailDetail.items[3][1];
    this.dataInfo[MailInfo.ItemID_4] = mailDetail.items[4][0];
    this.dataInfo[MailInfo.ItemNum_4] = mailDetail.items[4][1];
    this.dataInfo[MailInfo.SendUid] = mailDetail.sendUid;
};

handler.SetItemZero = function () {
    for (var i = MailInfo.ItemID_0; i < MailInfo.Max; ++i) {
        this.dataInfo[i] = 0
    }
};
