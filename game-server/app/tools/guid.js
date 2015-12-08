/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-5-27
 * Time: 下午7:46
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var uuid = require('uuid');

var strList = ['!', '#', '$', '%', '&', '(', ')', '*', '+', ',', '-', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8',
               '9', ':', ';',
               '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
               'Q', 'R', 'S',
               'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', ']', '^', '_', '`', '{', '|', '}', '~'];

var Handler = module.exports = {};

Handler.Init = function () {
    this.zoneID = zoneID;
    this.groupID = groupID;
    this.logicID = logicID;
    this.newID = '' + zoneID + groupID + logicID;
    this.itemNum = 0;
    this.itemGet = 0;
    this.step = 0;
    this.roleID = 0;
};

Handler.SetDataFromDB = function (itemNum, roleID, step, soulNum) {
    this.itemNum = itemNum;
    this.itemGet = itemNum + step / 2;
    this.step = step;
    this.roleID = roleID;
};

/**
 * @return {string}
 */
Handler.GetBase90 = function (num) {
    var Base90 = num;
    var str = '';
    var strLen = strList.length;
    while (Base90 > 0) {
        var temp = Base90 % strLen;
        str += strList[temp];
        Base90 = Math.floor(Base90 / strLen);
    }
    return str;
};

Handler.GetUuid = function () {
    var buffer = new Array(32);
    uuid.v4(null, buffer, 0);
    var string = uuid.unparse(buffer);
    string = string.replace(/-/g, "");
    return string;
};
