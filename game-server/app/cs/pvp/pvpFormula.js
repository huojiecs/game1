/**
 * Created by kazi on 14-3-10.
 */

var gameConst = require('../../tools/constValue');

var formula = module.exports = {};
var maxHonor = 8;
formula.HonorWin = function (ownerHonor, otherHonor) {
    if (otherHonor < maxHonor) {
        return [maxHonor, -otherHonor];
    }
    return [maxHonor, -maxHonor];
};

formula.HonorLose = function (ownerHonor, otherHonor) {
    if (ownerHonor < maxHonor) {
        return [-ownerHonor, maxHonor];
    }
    return [-maxHonor, maxHonor];
};

formula.ZhanHunLingliWin = function (ownerLingli, ownerLevel, otherLingli, otherLevel, vipAdd) {
    var maxA = otherLevel * 1000;
    var A = Math.floor(otherLingli * 0.2);
    if (A > maxA) {
        A = maxA;
    }

    var C = ownerLevel * 30;

    var B = Math.floor(A * (1 + (vipAdd / 100)));

    return [B + C, -A];
};

formula.ZhanHunLingliLose = function (type) {
    /*if (type === gameConst.eRivalState.ZhanHun2) {
        return [20, 0];
    }*/

    return [0, 0];
};

formula.FuChouLingliWin = function (otherLingli, otherLevel) {
    var maxA = otherLevel * 1000;
    var A = Math.floor(otherLingli * 0.2);
    if (A > maxA) {
        A = maxA;
    }

    return [A, -A];
};

formula.FuChouLingliLose = function (type) {
    return [0, 0];
};

/**
 * @return {number}
 */
formula.RivalCount = function (type) {
    if (isNaN(type)) {
        return 0;
    }
    return type * 2 + 1;
};
