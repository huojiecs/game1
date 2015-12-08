//require('longjohn');
require('autostrip-json-comments');
var config = require('./app/tools/config');
if (!config) {
    return;
}
var pomelo = require('pomelo');
var app = pomelo.createApp({
    base: process.cwd()
});

config.ReloadSync(config.defaultConfigPath, app, 180);

var routeUtil = require('./app/tools/routeUtil');
var logger = require('pomelo/node_modules/pomelo-logger').getLogger(pomelo.app.getServerId(), __filename);
var cs = require('./app/cs/main');
var ps = require('./app/ps/main');
var rs = require('./app/rs/main');
var fs = require('./app/fs/main');
var ms = require('./app/ms/main');
var pvp = require('./app/pvp/main');
var chat = require('./app/chat/main');
var ls = require('./app/ls/main');
var dbcache = require('./app/dbcache/main');
var us = require('./app/us/main');
var timeoutFilter = require('./app/tools/filters/timeout');
var connectionTimeout = require('./app/tools/filters/connectionTimeout');
var RpcTimeoutFilter = require('./app/tools/filters/rpcTimeout');
var tlog = require('tlog-client');
var Q = require('q');

Q.longStackSupport = true;

/**
 * Init app for client.
 */
app.set('name', 'gameServer');

var onlineUser = require('./app/adminModules/onlineUser');
app.registerAdmin(onlineUser, {app: app});

var dbCommands = require('./app/adminCommands/dbCommands');
app.set('dbCommands', dbCommands);

logger.fatal('app startup.' +
             '\n\t\t>>>>>>>>>>>>>>>HERE IS APPLICATION INFO<<<<<<<<<<<<<<<<<<',
             '\n\t\tProcess title: ' + process.title,
             '\n\t\tProcessor architecture: ' + process.arch,
             '\n\t\tPlatform: ' + process.platform,
             '\n\t\tProcess pid: ' + process.pid,
             '\n\t\tVersion: ' + process.version,
             '\n\t\tVersions: ' + JSON.stringify(process.versions),
             '\n\t\tConfig: ' + JSON.stringify(process.config),
             '\n\t\tArgv: ' + process.argv,
             '\n\t\tExecArgv: ' + process.execArgv,
             '\n\t\tExecPath: ' + process.execPath,
             '\n\t\tPomelo app getServerType: ' + pomelo.app.getServerType(),
             '\n\t\tPomelo app getServerId: ' + pomelo.app.getServerId(),
             '\n\t\t>>>>>>>>>>>>>>>HERE IS APPLICATION INFO<<<<<<<<<<<<<<<<<<');

var isWin = !!process.platform.match(/^win/);

app.configure(function () {
    // enable the system monitor modules
    if (!isWin) {
        app.enable('systemMonitor');
    }

    app.rpcFilter(RpcTimeoutFilter());

    app.set('proxyConfig',
        {
//                mailboxFactory: require('pomelo/node_modules/pomelo-rpc/lib/rpc-client/mailboxes/tcp-mailbox'),
            timeout: 1000 * 60,
            failMode: 'failfast'
        });

    app.set('remoteConfig',
        {
//                acceptorFactory: require('pomelo/node_modules/pomelo-rpc/lib/rpc-server/acceptors/tcp-acceptor'),
            //bufferMsg: true,
            debugBufferMsgInterval: 1000 * 30
        });

    app.load(require('./app/tools/components/remoteCluster'));
    app.load(require('./app/tools/components/proxyCluster'), {
            timeout: 1000 * 60,
            failMode: 'failfast'
        }
    );

    app.load(require('./app/tools/components/monitor/monitor'), {
            memoryMonitorTime: 1000 * 60 * 6,
            memwatch: 0,
            heapdump: false
        }
    );

    if (!!config.tlog) {
        config.Watch('tlog', function () {
            tlog.configure({
                hosts: config.tlog.hosts,
                sequence: config.tlog.sequence,
                GameSvrId: config.list && config.list.serverUid || config.gameServerList.serverUid,
                GameAppID: config.vendors.msdkOauth.appid,
                PlatID: config.vendors.tencent.platId
            });
        });
    }
});

// app configure
app.configure('all', 'connector', function () {
//    if (pomelo.app.getServerId() == "connector-server-2") {
//        require('nodetime').profile({
//            accountKey: '7b097441ff270844161507823406cd625d842b67',
//            appName: 'Lord of Dark Application'
//        });
//    }
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
            heartbeat: 29,
            timeout: 61,
            disconnectOnTimeout: false,
            useProtobuf: true
        }
    );

    app.set('disableConnect', true);

    app.route('dbcache', routeUtil.all2dbcache);
    app.route('cs', routeUtil.con2cs);
    app.route('ls', routeUtil.selectRandomRpcExceptFirst);
    app.route('connector', routeUtil.selectFirstRpc);
    // filter configures
    var checkMultipleConnection = require('./app/tools/filters/checkMultipleConnection');
    var serial = require('./app/tools/filters/serial');
    var firewall = require('./app/tools/filters/firewall');
    var globalSerial = require('./app/tools/filters/globalSerial');
    var catchMsg = require('./app/tools/filters/catchMsg');

    app.filter(new checkMultipleConnection());
    app.filter(new timeoutFilter());
    app.globalFilter(new catchMsg());
    app.globalFilter(new connectionTimeout());
    app.globalFilter(new firewall());
    app.globalFilter(new globalSerial());
    app.globalFilter(new serial());


    app.set('schedulerConfig', {
        scheduler: [
            {
                id: 'direct',
                scheduler: pomelo.pushSchedulers.direct
            },
            {
                id: 'buffer5',
                scheduler: pomelo.pushSchedulers.direct
                /*    scheduler: pomelo.pushSchedulers.buffer,
                 options: {flushInterval: 1000}*/
            },
            {
                id: 'buffer10',
                scheduler: pomelo.pushSchedulers.buffer,
                options: {flushInterval: 2000}
            }
        ],

        selector: function (reqId, route, msg, recvs, opts, cb) {
            // opts.userOptions is passed by response/push/broadcast
            // console.log('user options is: ', opts.userOptions);
            if (opts.type === 'push') {
                cb('buffer5');
                return;
            }
            if (opts.type === 'response') {
                cb('direct');
                return;
            }
            if (opts.type === 'broadcast') {
                cb('buffer10');
                return;
            }
        }
    });
});

// app configure
app.configure('all', 'ps', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    // filter configures
    app.route('cs', routeUtil.selectByArg);
    app.route('fs', routeUtil.selectFirstRpc);
    app.route('rs', routeUtil.selectFirstRpc);
    app.route('ms', routeUtil.selectFirstRpc);
    app.route('us', routeUtil.selectFirstRpc);
    app.route('psIdip', routeUtil.selectByArg);
    app.route('connector', routeUtil.selectByArg);

    routeUtil.setRoute(app, '__routes_cluster__', 'ls', routeUtil.selectClusterFirst);

    var checkMultipleConnection = require('./app/tools/filters/checkMultipleConnection');
    app.filter(new checkMultipleConnection());
    app.filter(new timeoutFilter());

    var psCommands = require('./app/adminCommands/psCommands');
    app.set('psCommands', psCommands);
});

// app configure
app.configure('all', 'rs', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('cs', routeUtil.selectByArg);
    app.route('ms', routeUtil.selectFirstRpc);
    app.route('connector', routeUtil.selectByArg);
    app.filter(new timeoutFilter());

    var rsCommands = require('./app/adminCommands/rsCommands');
    app.set('rsCommands', rsCommands);
});

// app configure
app.configure('all', 'js', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('cs', routeUtil.selectByArg);
    app.route('ms', routeUtil.selectFirstRpc);
    app.route('connector', routeUtil.selectByArg);
    app.filter(new timeoutFilter());

    var jsCommands = require('./app/adminCommands/jsCommands');
    app.set('jsCommands', jsCommands);
});

// app configure
app.configure('all', 'fs', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('cs', routeUtil.selectByArg);
    app.route('ms', routeUtil.selectFirstRpc);
    app.route('connector', routeUtil.selectByArg);

    routeUtil.setRoute(app, '__routes_cluster__', 'ls', routeUtil.selectClusterFirst);

    app.filter(pomelo.timeout());
});

// app configure
app.configure('all', 'ms', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('cs', routeUtil.selectByArg);
    app.route('connector', routeUtil.selectByArg);
    app.filter(pomelo.timeout());

    var mailCommands = require('./app/adminCommands/mailCommands');
    app.set('mailCommands', mailCommands);
});

// app configure
app.configure('all', 'pvp', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('pvp', routeUtil.selectByArg);
    app.route('connector', routeUtil.selectByArg);
    app.route('cs', routeUtil.selectByArg);
    app.filter(new timeoutFilter());
});

app.configure('all', 'cs', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('cs', routeUtil.selectByArg);
    app.route('rs', routeUtil.selectFirstRpc);
    app.route('ps', routeUtil.selectFirstRpc);
    app.route('fs', routeUtil.selectFirstRpc);
    app.route('pvp', routeUtil.selectFirstRpc);
    app.route('chat', routeUtil.selectFirstRpc);
    app.route('connector', routeUtil.selectByArg);
    app.route('us', routeUtil.selectFirstRpc);
    // filter configures

    /**设置玩家保存数据错误 多少次踢玩家下线*/
    app.set('saveDataErrorConfig',
        {
            isKick: true,
            times: 1
        });

    var checkMultipleConnection = require('./app/tools/filters/checkMultipleConnection');
    app.filter(new checkMultipleConnection());
    app.filter(new timeoutFilter());


    var csCommands = require('./app/adminCommands/csCommands');
    app.set('csCommands', csCommands);
});

app.configure('all', 'chat', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('connector', routeUtil.selectByArg);
    app.route('ps', routeUtil.selectFirstRpc);
    // filter configures
    app.filter(new timeoutFilter());

    var chatCommands = require('./app/adminCommands/chatCommands');
    app.set('chatCommands', chatCommands);
});

app.configure('all', 'chart', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('connector', routeUtil.selectByArg);
    app.route('ps', routeUtil.selectFirstRpc);
    app.route('cs', routeUtil.selectByArg);
    // filter configures
    app.filter(new timeoutFilter());

    var chartCommands = require('./app/adminCommands/chartCommands');
    app.set('chartCommands', chartCommands);
});

// app configure
app.configure('all', 'idip', function () {
    app.route('dbcache', routeUtil.all2dbcache);

    // filter configures
    app.route('cs', routeUtil.selectByArg);
    app.route('fs', routeUtil.selectFirstRpc);
    app.route('rs', routeUtil.selectFirstRpc);
    app.route('ms', routeUtil.selectFirstRpc);
    app.route('lsIdip', routeUtil.selectRandomRpc);
    app.route('psIdip', routeUtil.selectRandomRpc);
    app.route('connector', routeUtil.selectByArg);

//    routeUtil.setRoute(app, '__routes_cluster__', 'idip', routeUtil.selectClusterFirst);
    routeUtil.setRoute(app, '__routes_cluster__', 'idip', routeUtil.selectClusterByArgHeadMatch);

    app.filter(new timeoutFilter());
});

// app configure
app.configure('all', 'api', function () {
    app.route('dbcache', routeUtil.all2dbcache);
//
//    // filter configures
//    app.route('cs', routeUtil.selectByArg);
//    app.route('fs', routeUtil.selectFirstRpc);
//    app.route('rs', routeUtil.selectFirstRpc);
//    app.route('ms', routeUtil.selectFirstRpc);
//    app.route('lsIdip', routeUtil.selectRandomRpc);
//    app.route('psIdip', routeUtil.selectRandomRpc);
//    app.route('connector', routeUtil.selectByArg);

    routeUtil.setRoute(app, '__routes_cluster__', 'api', routeUtil.selectClusterByArgHeadMatch);

    app.filter(new timeoutFilter());
});

// app configure
app.configure('all', 'lsIdip', function () {
    app.route('dbcache', routeUtil.all2dbcache);

    // filter configures
    app.route('idip', routeUtil.selectRandomByMatch.bind('idip-ls-server.*'));

    app.filter(new timeoutFilter());
});

// app configure
app.configure('all', 'psIdip', function () {
    app.route('dbcache', routeUtil.all2dbcache);

    // filter configures
    app.route('idip', routeUtil.selectRandomByMatch.bind('idip-game-server.*'));
    app.route('connector', routeUtil.selectByArg);

    app.filter(new timeoutFilter());
});

// app configure
app.configure('all', 'ls', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('connector', routeUtil.selectByArg);
    app.route('ls', routeUtil.selectByArg);
    app.route('ps', routeUtil.selectFirstRpc);
    routeUtil.setRoute(app, '__routes_cluster__', 'fs', routeUtil.selectByArg);
    app.filter(new timeoutFilter());

    var lsCommands = require('./app/adminCommands/lsCommands');
    app.set('lsCommands', lsCommands);
});

// app configure
app.configure('all', 'dbcache', function () {
    app.filter(new timeoutFilter());
});
// app configure
app.configure('all', 'us', function () {
    app.route('dbcache', routeUtil.all2dbcache);
    app.route('cs', routeUtil.selectByArg);
    app.route('ms', routeUtil.selectFirstRpc);
    app.route('connector', routeUtil.selectByArg);
    app.filter(new timeoutFilter());
});
process.on('uncaughtException', function (err) {
    if (typeof err === 'object' && 'stack' in err) {
        logger.error('%s Caught exception: %s', app.serverId, err.stack);
        return;
    }

    logger.error('%s Caught exception: %j', app.serverId, err);
});

// app configure
app.configure('all', 'master', function () {
    var masterMain = require('./app/master/main');
    masterMain.InitServer();
});

// start app
app.start();

