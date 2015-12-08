var logger = require('pomelo-logger').getLogger("pomelo", __filename);
var WebSocket = require('ws');
var Protocol = require('pomelo-protocol');
var Package = Protocol.Package;
var Message = Protocol.Message;
var EventEmitter = require('events').EventEmitter;
var protocol = require('pomelo-protocol');
var protobuf = require('pomelo-protobuf');
var cwd = process.cwd();
var utils = require(cwd + '/app/script/utils');
var moveStat = require(cwd + '/app/script/statistic').moveStat;
var attackStat = require(cwd + '/app/script/statistic').attackStat;
var areaStat = require(cwd + '/app/script/statistic').areaStat;
var util = require('util');

var RES_OK = 200;
var RES_OLD_CLIENT = 501;

var pomelo = module.exports = function () {
//    Object.create(EventEmitter.prototype); // object extend from object

    this.socket = null;
    this.reqId = 0;
    this.callbacks = {};
    this.routeMap = {};

    this.handlers = {};
    this.handlers[Package.TYPE_HANDSHAKE] = this.handshake;
    this.handlers[Package.TYPE_HEARTBEAT] = this.heartbeat;
    this.handlers[Package.TYPE_DATA] = this.onData;
    this.handlers[Package.TYPE_KICK] = this.onKick;
};

util.inherits(pomelo, EventEmitter);

var handler = pomelo.prototype;

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

handler.init = function (params, cb) {
    this.params = params;
    this.params.debug = true;

    this.initCallback = cb;

    var url = 'ws://' + params.host;
    if (params.port) {
        url += ':' + params.port;
    }

    if (!params.type) {
        logger.info('init websocket: %s', url);
        pomelo.handshakeBuffer.user = params.user;
        handshakeCallback = params.handshakeCallback;
        this.initWebSocket(url, cb);
    }
};

handler.initWebSocket = function (url, cb) {
    var self = this;

    logger.info("initWebSocket: %s", url);
    var onopen = function (event) {
        logger.info('[pomeloclient.init] websocket connected!');
        var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(pomelo.handshakeBuffer)));
        self.send(obj);
    };
    var onmessage = function (event) {
        self.processPackage(Package.decode(event.data), cb);
        // new package arrived, update the heartbeat timeout
        if (heartbeatTimeout) {
            nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
        }
    };
    var onerror = function (event) {
        self.emit('io-error', event);
        logger.info('socket error %j ', event);
    };
    var onclose = function (event) {
        self.emit('close', event);
        logger.info('socket close %j ', event);
    };

    var socket = self.socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
};

handler.disconnect = function (callOnClose) {
    var self = this;
    if (self.socket) {

        if (!callOnClose) {
            self.socket.onclose = null;
        }

        if (self.socket.disconnect) self.socket.disconnect();
        if (self.socket.close) self.socket.close();
        logger.info('disconnect');
        self.socket = null;
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

handler.request = function (route, msg, cb) {
    var self = this;

    msg = msg || {};
    route = route || msg.route;
    if (!route) {
        logger.info('fail to send request without route.');
        return;
    }

    self.reqId++;
    self.sendMessage(self.reqId, route, msg);

    self.callbacks[self.reqId] = cb;
    self.routeMap[self.reqId] = route;
};

handler.notify = function (route, msg) {
    msg = msg || {};
    sendMessage(0, route, msg);
};

handler.sendMessage = function (reqId, route, msg) {
    var self = this;

    var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    //compress message by protobuf
    var protos = !!self.data.protos ? self.data.protos.client : {};
    if (!!protos[route]) {
        msg = protobuf.encode(route, msg);
    } else {
        msg = Protocol.strencode(JSON.stringify(msg));
    }

    var compressRoute = 0;
    if (self.dict && self.dict[route]) {
        route = self.dict[route];
        compressRoute = 1;
    }

    msg = Message.encode(reqId, type, compressRoute, route, msg);
    var packet = Package.encode(Package.TYPE_DATA, msg);
    self.send(packet);
};

handler.send = function (packet) {
    if (!this.socket) {
        logger.error("No socket used to send!");
        return;
    }
    if (this.socket.readyState !== 1) {
        logger.error("Socket is not opened!");
        return;
    }
    this.socket.send(packet.buffer || packet, {binary: true, mask: true});
};

handler.heartbeat = function (data) {
    var self = this;

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
        self.send(obj);

        nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
        heartbeatTimeoutId = setTimeout(self.heartbeatTimeoutCb, heartbeatTimeout);
    }, heartbeatInterval);
};

handler.heartbeatTimeoutCb = function () {
    var gap = nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
        heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
    } else {
        logger.error('server heartbeat timeout');
        self.emit('heartbeat timeout');
        self.disconnect();
    }
};

handler.handshake = function (data) {
    var self = this;

    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
        self.emit('error', 'client version not fullfill');
        return;
    }

    if (data.code !== RES_OK) {
        self.emit('error', 'handshake fail');
        return;
    }

    self.handshakeInit(data);

    var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    self.send(obj);
    if (self.initCallback) {
        self.initCallback(self.socket);
        self.initCallback = null;
    }
};

handler.onData = function (data) {
    var self = this;
    //probuff decode
    var msg = Message.decode(data);

    if (msg.id > 0) {
        msg.route = self.routeMap[msg.id];
        delete self.routeMap[msg.id];
        if (!msg.route) {
            return;
        }
    }

    msg.body = self.deCompose(msg);

    self.processMessage(pomelo, msg);
};

handler.onKick = function (data) {
    this.emit('onKick');
};


handler.processPackage = function (msg) {
    this.handlers[msg.type].call(this, msg.body);
};

handler.processMessage = function (pomelo, msg) {
    var self = this;
    if (!msg || !msg.id) {
        // server push message
        // logger.error('processMessage error!!!');
        self.emit(msg.route, msg.body);
        return;
    }

    //if have a id then find the callback function with the request
    var cb = self.callbacks[msg.id];

    delete self.callbacks[msg.id];
    if (typeof cb !== 'function') {
        return;
    }

    cb(msg.body);
};

handler.processMessageBatch = function (pomelo, msgs) {
    for (var i = 0, l = msgs.length; i < l; i++) {
        this.processMessage(pomelo, msgs[i]);
    }
};

handler.deCompose = function (msg) {
    var self = this;
    var protos = !!self.data.protos ? self.data.protos.server : {};
    var abbrs = self.data.abbrs;
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

handler.handshakeInit = function (data) {
    if (data.sys && data.sys.heartbeat) {
        heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
        heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
    } else {
        heartbeatInterval = 0;
        heartbeatTimeout = 0;
    }

    this.initData(data);

    if (typeof handshakeCallback === 'function') {
        handshakeCallback(data.user);
    }
};

//Initilize data used in pomelo client
handler.initData = function (data) {
    var self = this;
    if (!data || !data.sys) {
        return;
    }
    self.data = self.data || {};
    var dict = data.sys.dict;
    var protos = data.sys.protos;

    //Init compress dict
    if (!!dict) {
        self.data.dict = dict;
        self.data.abbrs = {};

        for (var route in dict) {
            self.data.abbrs[dict[route]] = route;
        }
    }

    //Init protobuf protos
    if (!!protos) {
        self.data.protos = {
            server: protos.server || {},
            client: protos.client || {}
        };
        if (!!protobuf) {
            protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
        }
    }
};

handler.monitor = function (type, name, reqId) {
    if (typeof actor !== 'undefined') {
        actor.emit(type, name, reqId);
    } else {
        logger.error(Array.prototype.slice.call(arguments, 0));
    }
};

pomelo.connected = false;

pomelo.offset = (typeof actor !== 'undefined') ? actor.id : 1;

