/**
 * The file detailUtils.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/21 12:44:00
 * To change this template use File | Setting |File Template
 */

var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var gameConst = require('../constValue');

var ePlayerInfo = gameConst.ePlayerInfo;
var eItemInfo = gameConst.eItemInfo;
var eSoulInfo = gameConst.eSoulInfo;
var eMagicSoulInfo = gameConst.eMagicSoulInfo;

/**
 * redis 详细信息，解压缩工具 第一版本没有实现， 数据的简化
 * */
var Handler = module.exports;

var ePlayerInfo = {
  /*  playerInfo: [1, [ePlayerInfo.ROLEID, ePlayerInfo.NAME, ePlayerInfo.TEMPID, ePlayerInfo.ExpLevel,
                    ePlayerInfo.ZHANLI, ePlayerInfo.VipLevel, ePlayerInfo.UnionID, ePlayerInfo.UnionName,
                    ePlayerInfo.ActiveEnhanceSuitID, ePlayerInfo.ActiveEnhanceSuitID, ePlayerInfo.ActiveFashionWeaponID,
                    ePlayerInfo.ActiveFashionEquipID, ePlayerInfo.IsNobility], ePlayerInfo.MAX],*/
    playerInfo: [1, [], ePlayerInfo.MAX],
    itemList: [2,[], 0],
    soulList: [3,[], eSoulInfo.Max],
    attList: [4,[], 0],
    magicSoulList: [5,[], 0],
    skillList: [6,[], 0],
    runeList: [7,[], 0],
    bianShenAttList: [8,[], 0],
    petList: [9,[], 0],
    jjcInfo: [10, [], 0],
    marryXuanYan: [11,[], 0]
};

/**
 * 对数据进行压缩
 *
 *      　　　　　　　　　　　　　{
                                    playerInfo: playerInfo,
                                    itemList: itemList,
                                    soulList: soulList,
                                    attList: attList,
                                    magicSoulList: magicSoulList
                                }
 @param {object} info
 * */
Handler.zip = function (info) {
    var zInfo = {};
    for (var key in ePlayerInfo) {
        if (isList(key)) {
            zInfo[ePlayerInfo[key][0]] = zipList(info[key], ePlayerInfo[key][2], ePlayerInfo[key][1]);
        } else {
            zInfo[ePlayerInfo[key][0]] = zipInfo(info[key], ePlayerInfo[key][2], ePlayerInfo[key][1]);
        }
    }
    return JSON.stringify(zInfo);
};

/**
 * 对数据进行解压缩
 *
 *      　　　　　　　　　　　　　{
                                    1: playerInfo,
                                    2: itemList,
                                    3: soulList,
                                    4: attList,
                                    5: magicSoulList
                                }
 * */
Handler.unzip = function (info) {
    var info = JSON.parse(info);
    var zInfo = {};
    for (var key in ePlayerInfo) {
        if (!info[ePlayerInfo[key][0]]) {
            continue;
        }
        if (isList(key)) {
            zInfo[key] = unzipList(info[ePlayerInfo[key][0]], ePlayerInfo[key][2], ePlayerInfo[key][1]);
        } else {
            zInfo[key] = unzipInfo(info[ePlayerInfo[key][0]], ePlayerInfo[key][2], ePlayerInfo[key][1]);
        }
    }
    return zInfo;
};

/**
 * @Brief: 检测是否有数据字段更新
 *
 * @param {Object} info 解压后的数据
 * */
Handler.checkRowUpdate = function (info) {

    for (var key in ePlayerInfo) {

        var max = ePlayerInfo[key][2];
        var items = info[key];
        if (!items || max == 0) {
            continue;
        }


        if (isList(key)) {
            for (var id in items)
            {
                var item = items[id];
                if (item.length != max) {
                    return true;
                }

            }
        } else {
            if (items.length !== max) {
                return true;
            }
        }
    }

    return false;
};

/**
 * 压缩信息
 * @param {object} info
 * @param {number} max
 * @param {Array} array 压缩数组
 * @return {object}
 * */
var zipInfo = function (info, max, array){
    if (array.length == 0) {
        return info;
    }
    var zInfo = {};
    for (var index in array) {
        zInfo[array[index]] = info[array[index]];
    }
    return zInfo;
};

/**
 * 压缩信息
 * @param {object} info
 * @param {number} max
 * @param {Array} array 压缩数组
 * @return {object}
 * */
var unzipInfo = function (info, max, array){
    if (array.length == 0) {
        return info;
    }
    var zInfo = new Array(max);
    for (var index in zInfo) {
        if (!!info[index]) {
            zInfo[index] = info[index];
        } else {
            zInfo[index] = 0;
        }
    }
    return zInfo;
};

/**
 * 压缩信息
 * @param {object} info
 * @param {number} max
 * @param {Array} array 压缩数组
 * @return {object}
 * */
var zipList = function (list, max, array) {
    if (array.length == 0) {
        return list;
    }
    var zList = [];
    for (var index in list) {
        zList.push(zipInfo(list[index], max, array));
    }
    return zList;
};

/**
 * 压缩信息
 * @param {object} info
 * @param {number} max
 * @param {Array} array 压缩数组
 * @return {object}
 * */
var unzipList = function (list, max, array) {
    if (array.length == 0) {
        return list;
    }
    var zList = [];
    for (var index in list) {
        zList.push(unzipInfo(list[index], max, array));
    }
    return zList;
};

/**
 * 是否是列表 list
 * @param {string} name
 * @return {boolean}
 * */
var isList = function(name) {
    return name.indexOf('List') !== -1 || name.indexOf('list') !== -1;
};