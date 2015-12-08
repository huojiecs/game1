var envConfig = require('./app/config/env.json');
var config = require('./app/config/' + envConfig.env + '/config');
var Robot = require('pomelo-robot-plus').Robot;
var fs = require('fs');
var pomeloLogger = require('pomelo-logger');
var logger = require('pomelo-logger').getLogger("client", __filename);

var robot = new Robot(config);
var mode = 'master';

pomeloLogger.configure('./app/config/log4js.json');

if (process.argv.length > 2) {
    mode = process.argv[2];
}

if (mode !== 'master' && mode !== 'client') {
    throw new Error(' mode must be master or client');
}

if (mode === 'master') {
    robot.runMaster(__filename);
} else {
    var script = (process.cwd() + envConfig.script);
    robot.runAgent(script);
}

process.on('uncaughtException', function (err) {
    /* temporary code */
    logger.error(' Caught exception: ' + err.stack);
    if (!!robot && !!robot.agent) {
        // robot.agent.socket.emit('crash', err.stack);
    }
    fs.appendFile('./log/.log', err.stack, function (err) {
    });
    /* temporary code */
});
