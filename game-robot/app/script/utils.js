var logger = require('pomelo-logger').getLogger("utils", __filename);
var md5 = require('md5');
var utils = module.exports;


// control variable of func "myPrint"
var isPrintFlag = false;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * clone an object
 */
utils.clone = function (origin) {
    if (!origin) {
        return;
    }

    var obj = {};
    for (var f in origin) {
        if (origin.hasOwnProperty(f)) {
            obj[f] = origin[f];
        }
    }
    return obj;
};

utils.size = function (obj) {
    if (!obj) {
        return 0;
    }

    var size = 0;
    for (var f in obj) {
        if (obj.hasOwnProperty(f)) {
            size++;
        }
    }

    return size;
};

// print the file name and the line number ~ begin
function getStack() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function getFileName(stack) {
    return stack[1].getFileName();
}

function getLineNumber(stack) {
    return stack[1].getLineNumber();
}

utils.myPrint = function () {
    if (isPrintFlag) {
        var len = arguments.length;
        if (len <= 0) {
            return;
        }
        var stack = getStack();
        var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
        for (var i = 0; i < len; ++i) {
            aimStr += arguments[i] + ' ';
        }
        logger.info('\n' + aimStr);
    }
};
// print the file name and the line number ~ end


utils.genCheckID = function (seed) {              //产生checkID
//    seed = 0;
//    if (!seed) {
//        logger.info('set seed...............');
//        seed = Math.random().toString();
//    }

    return md5.digest_s('' + seed);
};


utils.genRoleName = function () {              // 产生checkID
    var roleName = "R";
    for (var i = 1; i <= 8; ++i) {
        var tempValue = Math.floor(Math.random() * 16.0).toString(16);
        roleName += tempValue;
    }
    return roleName;
};

utils.request = function (logger, pomelo, route, message, callback) {
    logger.info('send %s: %j', route, message);
    pomelo.request(route, message, function (result) {
        logger.info('recv %s: %j', route, result);
        callback(result);
    });
};

utils.genCityPosition = function () {              // 产生checkID
    var posX = [800, 990];
    var posZ = [710, 960];

    return {"posX": Math.random() * (posX[1] - posX[0]) + posX[0],
        "posY": 260.525,
        "posZ": Math.random() * (posZ[1] - posZ[0]) + posX[0]};
};

utils.genRotation = function () {              // 产生checkID
    var posX = [-1, 1];
    var posZ = [-1, 1];
    return {"moveX": Math.random() * (posX[1] - posX[0]) + posX[0],
        "moveY": 0,
        "moveZ": Math.random() * (posZ[1] - posZ[0]) + posX[0]};
};

