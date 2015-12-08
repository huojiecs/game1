/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-11-14
 * Time: 上午10:21
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var MajorCity = require('./majorCity');
var gameConst = require('../../tools/constValue');
var eWorldState = gameConst.eWorldState;
var ePosState = gameConst.ePosState;
var Handler = module.exports;
var _ = require('underscore');

Handler.Init = function () {
    this.cityList = [];
};

Handler.GetCity = function (cityID) {
    return this.cityList[cityID];
};

Handler.AddCity = function (cityID, majorCity) {
    this.cityList[cityID] = majorCity;
};

Handler.DelCity = function (cityID) {
    delete this.cityList[cityID];
};

Handler.GetFreeCity = function (frontendId) {

    var cityInfo = {
        city: null,
        cityID: 0
    };

    cityInfo.city = _.find(this.cityList, function (item, i) {
        if (!item || !item.IsFull(frontendId)) {
            cityInfo.cityID = i;
            return true;
        }
        return false;
    });

    if (!cityInfo.city) {
        cityInfo.city = new MajorCity(frontendId);
        cityInfo.cityID = this.cityList.length;
        this.cityList.push(cityInfo.city);
    }

    return cityInfo;
};

Handler.AddPlayer = function (player) {
    var cityInfo = this.GetFreeCity(player.serverId);
    cityInfo.city.AddPlayer(player);

//    var list = _.map(this.cityList, function (item, idx) {
//        return [idx, _.size(item.playerList)];
//    });

//    logger.fatal("City: %j", list);

    return cityInfo;
};

Handler.DelPlayer = function (player) {
    if (!player) {
        return;
    }
    var cityID = player.GetWorldState(eWorldState.CustomID);
    var oldCity = this.cityList[cityID];

    if (!!oldCity) {
        oldCity.DelPlayer(player);
        var pos = player.GetPosition();
        oldCity.RemoveAoi(player, pos);
    }
};

Handler.UpdateCity = function (nowTime) {
    _.each(this.cityList, function (city) {
        city.Update(nowTime);
    });
};

/**
 * 获取所有房间
 *
 * @return {Array}
 * @api
 * */
Handler.getAllCity = function() {
    return this.cityList;
};