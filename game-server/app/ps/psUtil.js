/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-7-29
 * Time: 上午10:42
 * To change this template use File | Settings | File Templates.
 */
var pomelo = require('pomelo');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var _ = require('underscore');
var defaultValues = require('../tools/defaultValues');
var playerManager = require('../ps/player/playerManager');

var Handler = module.exports;
Handler.Init = function () {
};

Handler.SetCsNum = function (csSeverID, isAdd) {

    if (!this.csNumList) {
        this.csNumList = {};
    }

    if (!this.csNumList[csSeverID]) {
        this.csNumList[csSeverID] = 0;
    }

    if (isAdd) {
        this.csNumList[csSeverID] += 1;
    } else {
        this.csNumList[csSeverID] -= 1;
    }
};

Handler.GetCsID = function () {
    var self = this;
    var csSever = null;
    if (!this.csNumList) {
        this.csNumList = {};
    }
    var list = pomelo.app.getServersByType('cs');
    if (!list || !list.length) {
        logger.error('can not find cs server 1.');
        return csSever;
    }

    var roleNum = Number.MAX_VALUE;
    var roleCount = 0;
    logger.info('csServerList infomation is : %j, csNumList is: %j ', JSON.stringify(list),
                JSON.stringify(self.csNumList));
    _.each(list, function (item) {

        var key = item.id;
        var val = self.csNumList[key] || 0;

        roleCount += val;

        /*if (val >= defaultValues.maxUserPerCs) {
         return;
         }*/

        if (roleNum >= val) {
            csSever = key;
            roleNum = val;
        }
    });

    var playerCount = playerManager.GetPlayerCount();
//    roleCount = playerCount || roleCount;
    if (playerCount >= defaultValues.maxUserPs) {
        logger.warn('Can not find cs server 2. reach maxUserPs: %j, csSever: %j, roleCount: %j',
                    defaultValues.maxUserPs, csSever, roleCount);
        csSever = null;
    } else if (!_.isString(csSever)) {
        logger.error('can not find cs server 3. %j', csSever);
        csSever = null;
    }

    return csSever;
};

/**
 * cs 分配方法
 * 1， 添加该方法 是为了尽量将同cs的玩家分配到相同的cs上
 * 2， 当
 *
 * @param {String} frontendId 前端id
 * */
Handler.GetCsID2 = function (frontendId) {
    var self = this;
    var csSever = null;
    if (!this.csNumList) {
        this.csNumList = {};
    }
    csSever = self.GetCsIDWithConID(frontendId);
    logger.info("allocation csID frontendId: %j --> csID: %j", frontendId, csSever);
    var roleNum = Number.MAX_VALUE;
    var roleCount = 0;
    if (null == csSever) {

        var list = self.GetCsIDArray();
        if (!list || !list.length) {
            return csSever;
        }
        _.each(list, function (item) {

            var key = item.id;
            var val = self.csNumList[key] || 0;

            roleCount += val;

            /*if (val >= defaultValues.maxUserPerCs) {
             return;
             }*/

            if (roleNum >= val) {
                csSever = key;
                roleNum = val;
            }
        });
    }

    var playerCount = playerManager.GetPlayerCount();

    if (playerCount >= defaultValues.maxUserPs) {
        logger.warn('Can not find cs server 2. reach maxUserPs: %j, csSever: %j, roleCount: %j',
                    defaultValues.maxUserPs, csSever, roleCount);
        csSever = null;
    } else if (!_.isString(csSever)) {
        logger.error('can not find cs server 3. %j', csSever);
        csSever = null;
    }

    return csSever;
};

/**
 * 获取cs list [cs-server-1, cs-server-2]
 * @return {Array}
 * */
Handler.GetCsIDArray = function () {

    if (!this.csRefreshTime || new Date().getTime() - this.csRefreshTime > defaultValues.USE_SERVER_ID_REFRESH_TIME) {
        var list = pomelo.app.getServersByType('cs');
        if (!list || !list.length) {
            logger.error('can not find cs server 1.');
            return [];
        }

        list.sort(function (a, b) {
            return a.id > b.id;
        });
        this.csList = list;
        this.csRefreshTime = new Date().getTime();
    }

    return this.csList;
};

/**
 * 获取connector list [connector-server-1, connector-server-2]
 * @return {Array}
 * */
Handler.GetConnectorIDArray = function () {

    if (!this.conRefreshTime || new Date().getTime() - this.conRefreshTime > defaultValues.USE_SERVER_ID_REFRESH_TIME) {
        var conList = pomelo.app.getServersByType('connector');

        if (!conList || !conList.length) {
            logger.error('can not find cs server 1.');
            return [];
        }

        conList = _.filter(conList, function (item) {
            return item.id.indexOf('ls') === -1 && item.dedicateDispatcher == "false";
        });

        conList.sort(function (a, b) {
            return a.id > b.id;
        });
        this.conList = conList;
        this.conRefreshTime = new Date().getTime()
    }
    return this.conList;
};

/***
 * 根据 connector id 获取对应的cs id
 *
 * @param {String} frontendId 前端id
 * */
Handler.GetCsIDWithConID = function (frontendId) {
    var self = this;
    var csSever = null;

    var list = self.GetCsIDArray();
    if (!list || !list.length) {
        return csSever;
    }

    /** 重不同的服获取 该列表时顺序是否一致 ？？？*/
    var conList = self.GetConnectorIDArray();
    if (!conList || !conList.length) {
        return csSever;
    }

    var frontendIdParse = frontendId.split("-");
    var curIndex = parseInt(frontendIdParse[frontendIdParse.length - 1]) - 1 || 0;
    /** 当前端服大于后端服的时候 */
    if (list.length > conList.length) {
        /** 当cs 大于 connector 长度的时候*/
        return allocationMin(curIndex, list, conList, this);
    } else if (list.length == conList.length) {
        /** connector length 等于 cs length*/
        csSever = list[curIndex - 1].id;
    } else {
        /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
        return allocationMax(curIndex, list);
    }

    return csSever;
};

/**
 * 当connector 大于cs 分配迭代函数
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * return {String}
 * */
var allocationMax = function (curIndex, list) {
    /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex > list.length) {
        var last = curIndex - list.length;
        if (last > list.length) {
            return allocationMax(last, list);
        } else {
            /** 获取随机*/
            return null; // 丢给外层随机
        }
    } else {
        return list[curIndex - 1].id;
    }
};

/**
 * 当connector 小于cs 分配迭代函数
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * return {String}
 * */
var allocationMin = function (curIndex, list, conList, psUtil) {
    /** 当cs 大于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex <= list.length) {
        if (isHappen(conList.length / list.length)) {
            return list[curIndex - 1].id;
        }
        var add = curIndex + conList.length;
        if (add < list.length) {
            return allocationMin(add, list, conList, psUtil);
        } else {
            return allocationLast(curIndex, list, psUtil); // 丢给外层随机
        }
    } else {
        return allocationLast(curIndex, list, psUtil); // 丢给外层随机
    }
};

/**
 * 是否 发生
 * 概率事件
 *
 * @param {Number} rate
 * */
var isHappen = function (rate) {
    return Math.random() < rate;
};

/**
 * cs 大于 connector 随机分配
 * */
var allocationLast = function (curIndex, list, psUtil) {
    var csSever = null;
    var roleNum = Number.MAX_VALUE;
    for (var i = curIndex; i < list.length; i++) {
        var item = list[i];
        var key = item.id;
        var val = psUtil.csNumList[key] || 0;
        if (roleNum >= val) {
            csSever = key;
            roleNum = val;
        }
    }
    return csSever;
};

/**
 * 是否是定向分配 cs
 *
 * @param {String} frontendID 前端服id
 * @param {String} csID csID
 * @return {Boolean}
 * **/
Handler.isOrient = function (frontendID, csID) {
    var self = this;
    var list = self.GetCsIDArray();
    if (!list || !list.length) {
        return false;
    }

    var conList = self.GetConnectorIDArray();
    if (!conList || !conList.length) {
        return false;
    }

    var curIndex = parseInt(frontendID.split("-")[2]) - 1;
    if (list.length > conList.length) {
        /** 当cs 大于 connector 长度的时候*/
        return isAllocationMin(curIndex, list, conList, csID);
    } else if (list.length == conList.length) {
        /** connector length 等于 cs length*/
        return csID == list[curIndex - 1].id;
    } else {
        /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
        return isAllocationMax(curIndex, list, csID);
    }
};

/**
 * 是否 通过 connector 小于cs 分配 的 csID
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * @param {Array} conList conList
 * @param {String} csID csID
 * return {String}
 * */
var isAllocationMin = function (curIndex, list, conList, csID) {
    /** 当cs 大于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex <= list.length) {
        var add = curIndex + conList.length;
        if (add < list.length) {
            if (csID == list[curIndex - 1].id) {
                return true;
            } else {
                return isAllocationMin(add, list, conList, csID);
            }
        } else {
            return csID == list[curIndex - 1].id; // 丢给外层随机
        }
    } else {
        return csID == list[curIndex - 1].id; // 丢给外层随机
    }
};

/**
 * 是否connector 大于cs 分配的csID
 *
 * @param {Number} curIndex 当前connector id index
 * @param {Array} list csList
 * return {String}
 * */
var isAllocationMax = function (curIndex, list, csID) {
    /** 当cs 小于 connector 时 暂时 第一版 这里需要用迭代 防止 connector 是cs 的2倍以上*/
    if (curIndex > list.length) {
        var last = curIndex - list.length;
        if (last > list.length) {
            return isAllocationMax(last, list, csID);
        } else {
            /** 获取随机*/
            return false; // 丢给外层随机
        }
    } else {
        return csID == list[curIndex - 1].id;
    }
};