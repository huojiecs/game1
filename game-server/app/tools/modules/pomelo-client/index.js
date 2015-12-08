/////////////////////////////////////////////////////////////
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('pomelo-client', __filename);
var WebSocket = require('ws');
var Protocol = require('pomelo-protocol');
var Package = Protocol.Package;
var Message = Protocol.Message;
var EventEmitter = require('events').EventEmitter;
var protobuf = require('pomelo-protobuf');
var cwd = process.cwd();
var util = require('util');

var pomelo = module.exports = Object.create(EventEmitter.prototype);  // object extend from object

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {
        }

        F.prototype = o;
        return new F();
    };
}

var JS_WS_CLIENT_TYPE = 'js-websocket';
var JS_WS_CLIENT_VERSION = '0.0.1';

var RES_OK = pomelo.RES_OK = 200;
var RES_OLD_CLIENT = pomelo.RES_OLD_CLIENT = 501;

var socket = pomelo.socket = null;
var reqId = pomelo.reqId = 0;
var callbacks = pomelo.callbacks = {};
var handlers = pomelo.handlers = {};
var routeMap = pomelo.routeMap = {};

pomelo.heartbeatInterval = 5000;
pomelo.heartbeatTimeout = pomelo.heartbeatInterval * 2;
pomelo.nextHeartbeatTimeout = 0;
pomelo.gapThreshold = 100; // heartbeat gap threshold
var heartbeatId = pomelo.heartbeatId = null;
var heartbeatTimeoutId = pomelo.heartbeatTimeoutId = null;

var handshakeCallback = pomelo.handshakeCallback = null;

var handshakeBuffer = pomelo.handshakeBuffer = {
    'sys': {
        type: JS_WS_CLIENT_TYPE,
        version: JS_WS_CLIENT_VERSION
    },
    'user': {
    }
};

pomelo.initCallback = null;

pomelo.init = function (params, cb) {
    pomelo.params = params;
    params.debug = true;
    initCallback = cb;
    var host = params.host;
    var port = params.port;

    var url = 'mergeSP://' + host;
    if (port) {
        url += ':' + port;
    }

    if (!params.type) {
        logger.info('init websocket: %s', url);
        pomelo.handshakeBuffer.user = params.user;
        handshakeCallback = params.handshakeCallback;
        this.initWebSocket(url, cb);
    }
};

pomelo.initWebSocket = function (url, cb) {
    logger.info(url);
    var onopen = function (event) {
        logger.info('[pomeloclient.init] websocket connected!');
        var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(pomelo.handshakeBuffer)));
        send(obj);
    };
    var onmessage = function (event) {
        pomelo.processPackage(Package.decode(event.data), cb);
        // new package arrived, update the heartbeat timeout
        if (heartbeatTimeout) {
            nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
        }
    };
    var onerror = function (event) {
        pomelo.emit('io-error', event);
        logger.info('socket error: %s, %s', event.errorno, event.target.url);
    };
    var onclose = function (event) {
        pomelo.emit('close', event);
        logger.info('socket close!');
    };

    var socket = pomelo.socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
};

pomelo.disconnect = function () {
    if (socket) {
        if (socket.disconnect) {
            socket.disconnect();
        }
        if (socket.close) {
            socket.close();
        }
        logger.info('disconnect');
        socket = null;
    }

    if (heartbeatId) {
        clearTimeout(heartbeatId);
        heartbeatId = null;
    }
    if (heartbeatTimeoutId) {
        clearTimeout(heartbeatTimeoutId);
        heartbeatTimeoutId = null;
    }
};

pomelo.request = function (route, msg, cb) {
    msg = msg || {};
    route = route || msg.route;
    if (!route) {
        logger.info('fail to send request without route.');
        return;
    }

    reqId++;
    sendMessage(reqId, route, msg);

    callbacks[reqId] = cb;
    routeMap[reqId] = route;
};

pomelo.notify = function (route, msg) {
    msg = msg || {};
    sendMessage(0, route, msg);
};

var sendMessage = pomelo.sendMessage = function (reqId, route, msg) {
    var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    //compress message by protobuf
    var protos = !!pomelo.data.protos ? pomelo.data.protos.client : {};
    if (!!protos[route]) {
        msg = protobuf.encode(route, msg);
    } else {
        msg = Protocol.strencode(JSON.stringify(msg));
    }

    var compressRoute = 0;
    if (pomelo.dict && pomelo.dict[route]) {
        route = pomelo.dict[route];
        compressRoute = 1;
    }

    msg = Message.encode(reqId, type, compressRoute, route, msg);
    var packet = Package.encode(Package.TYPE_DATA, msg);
    send(packet);
};


pomelo._host = "";
pomelo._port = "";
pomelo._token = "";

/*
 var send = function(packet){
 if (!!socket) {
 socket.send(packet.buffer || packet,{binary: true, mask: true});
 } else {
 setTimeout(function() {
 entry(_host, _port, _token, function() {logger.info('Socket is null. ReEntry!')});
 }, 3000);
 }
 };
 */

var send = pomelo.send = function (packet) {
    if (!!pomelo.socket) {
        pomelo.socket.send(packet.buffer || packet, {binary: true, mask: true});
    }
};


pomelo.handler = {};

var heartbeat = pomelo.heartbeat = function (data) {
    var obj = Package.encode(Package.TYPE_HEARTBEAT);
    if (heartbeatTimeoutId) {
        clearTimeout(heartbeatTimeoutId);
        heartbeatTimeoutId = null;
    }

    if (heartbeatId) {
        // already in a heartbeat interval
        return;
    }

    heartbeatId = setTimeout(function () {
        heartbeatId = null;
        send(obj);

        nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
        heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
    }, heartbeatInterval);
};

var heartbeatTimeoutCb = pomelo.heartbeatTimeoutCb = function () {
    var gap = nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
        heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
    } else {
        logger.error('server heartbeat timeout');
        pomelo.emit('heartbeat timeout');
        pomelo.disconnect();
    }
};

var handshake = pomelo.handshake = function (data) {
    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
        pomelo.emit('error', 'client version not fullfill');
        return;
    }

    if (data.code !== RES_OK) {
        pomelo.emit('error', 'handshake fail');
        return;
    }

    handshakeInit(data);

    var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    send(obj);
    if (initCallback) {
        initCallback(null, socket);
        initCallback = null;
    }
};

var onData = pomelo.onData = function (data) {
    //probuff decode
    var msg = Message.decode(data);

    if (msg.id > 0) {
        msg.route = routeMap[msg.id];
        delete routeMap[msg.id];
        if (!msg.route) {
            return;
        }
    }

    msg.body = deCompose(msg);

    processMessage(pomelo, msg);
};

var onKick = pomelo.onKick = function (data) {
    pomelo.emit('onKick');
};

handlers[Package.TYPE_HANDSHAKE] = handshake;
handlers[Package.TYPE_HEARTBEAT] = heartbeat;
handlers[Package.TYPE_DATA] = onData;
handlers[Package.TYPE_KICK] = onKick;

var processPackage = pomelo.processPackage = function (msg) {
    handlers[msg.type](msg.body);
};

var processMessage = pomelo.processMessage = function (pomelo, msg) {
    if (!msg || !msg.id) {
        // server push message
        // logger.error('processMessage error!!!');
        pomelo.emit(msg.route, msg.body);
        return;
    }

    //if have a id then find the callback function with the request
    var cb = callbacks[msg.id];

    delete callbacks[msg.id];
    if (typeof cb !== 'function') {
        return;
    }

    cb(null, msg.body);
    return;
};

var processMessageBatch = pomelo.processMessageBatch = function (pomelo, msgs) {
    for (var i = 0, l = msgs.length; i < l; i++) {
        processMessage(pomelo, msgs[i]);
    }
};

var deCompose = pomelo.deCompose = function (msg) {
    var protos = !!pomelo.data.protos ? pomelo.data.protos.server : {};
    var abbrs = pomelo.data.abbrs;
    var route = msg.route;

    try {
        //Decompose route from dict
        if (msg.compressRoute) {
            if (!abbrs[route]) {
                logger.error('illegal msg!');
                return {};
            }

            route = msg.route = abbrs[route];
        }
        if (!!protos[route]) {
            return protobuf.decode(route, msg.body);
        } else {
            return JSON.parse(Protocol.strdecode(msg.body));
        }
    } catch (ex) {
        logger.error('route, body = ' + route + ", " + msg.body);
    }

    return msg;
};

var handshakeInit = pomelo.handshakeInit = function (data) {
    if (data.sys && data.sys.heartbeat) {
        heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
        heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
    } else {
        heartbeatInterval = 0;
        heartbeatTimeout = 0;
    }

    initData(data);

    if (typeof handshakeCallback === 'function') {
        handshakeCallback(data.user);
    }
};

//Initilize data used in pomelo client
var initData = pomelo.initData = function (data) {
    if (!data || !data.sys) {
        return;
    }
    pomelo.data = pomelo.data || {};
    var dict = data.sys.dict;
    var protos = data.sys.protos;

    //Init compress dict
    if (!!dict) {
        pomelo.data.dict = dict;
        pomelo.data.abbrs = {};

        for (var route in dict) {
            pomelo.data.abbrs[dict[route]] = route;
        }
    }

    //Init protobuf protos
    if (!!protos) {
        pomelo.data.protos = {
            server: protos.server || {},
            client: protos.client || {}
        };
        if (!!protobuf) {
            protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
        }
    }
};

pomelo.connected = false;

pomelo.offset = (typeof actor !== 'undefined') ? actor.id : 1;

