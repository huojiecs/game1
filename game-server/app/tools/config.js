/**
 * Created by kazi on 13-12-18.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('anhei', __filename);
var _ = require('underscore');
var Q = require('q');
var request = require('request');
var path = require('path');
var watch = require('node-watch');
var util = require('util');
var utils = require('pomelo/lib/util/utils');
var Constants = require('pomelo/lib/util/constants');
var fs = require('fs');

var Handler = module.exports = {
//    ReloadSync: 11234
    defaultConfigPath: "./config",
    replaceTable: {
        defaultValues: require('./defaultValues')
    },
    watchTable: {},

    watchFileChanged: function (folder, app) {
        if (!!Handler.watchTable[folder]) {
            return;
        }

        Handler.watchTable[folder] = true;

        watch(folder, {recursive: true, followSymLinks: true}, function (filename) {

            if (!fs.existsSync(filename)) {
                return;
            }

            var stat = fs.lstatSync(filename);
            if (stat.isDirectory()) {
                return;
            }

            if (path.extname(filename).toLowerCase() == '.json') {

//                logger.info("config watch file changed: %s", filename);

                Handler.Reload(filename, app, function (err, data) {
                    var basename = path.basename(filename, '.json');
                    if (!!Handler.callbacks && !!Handler.callbacks[basename]) {
                        Handler.callbacks[basename](err, data);
                    }
                });
            }
        });
    },

    /**
     * @return {boolean}
     */
    ParseContent: function (pathname, content) {
        var ret = false;

        content = content.replace(/^\uFEFF/, '');
        try {
            var basename = path.basename(pathname, '.json');
            var values = JSON.parse(content);
            values.pathname = pathname;

            if (JSON.stringify(Handler[basename]) == JSON.stringify(values)) {
//                               logger.info("config no change file %s, values: %j", pathname, values);
                return;
            }

            if (!!Handler[basename] && Handler[basename].pathname.length > pathname.length) {
//                               logger.info("config replaced by sub config file %s, values: %j", pathname, values);
                return;
            }

            if (!Handler[basename]) {
                logger.warn('config loaded file: %j, values: %j', pathname, values);
            }
            else {
                logger.warn('config changed file: %j, source: %j, values: %j', pathname,
                            Handler[basename],
                            values);
            }

            Handler[basename] = values;

            // logger.warn("config values replaced basename: %s", basename);

            if (!!Handler.replaceTable[basename]) {

                _.each(Handler[basename], function (v, k) {
                    if (Handler.replaceTable[basename][k] !== v) {
                        logger.warn("config values replaced basename: %s key: %s value %j -> %j file: %j",
                                    basename, k, Handler.replaceTable[basename][k], v, pathname);
                        Handler.replaceTable[basename][k] = v;
                    }
                });
            }

            ret = true;
        }
        catch (err) {
            logger.error('config parse failed. file: %s, error: %s', pathname, err.stack);
        }

        return ret;
    },

    ReloadSync: function (configPath, app, reloadTimeSeconds) {
        var self = this;

//        logger.error(configPath);
        if (!!reloadTimeSeconds) {
            setTimeout(function () {
                self.ReloadSync(configPath, app, reloadTimeSeconds);
            }, reloadTimeSeconds * 1000);
        }

        var env = _.isObject(app) ? app.get(Constants.RESERVED.ENV) : app;
        var configs = _.sortBy(fs.readdirSync(configPath), function (pathname) {
            return pathname.indexOf('.');
        });

        Handler.watchFileChanged(configPath, app);

        _.each(configs, function (pathname) {
            pathname = configPath + '/' + pathname;

            if (!fs.existsSync(pathname)) {
                return;
            }

            var stat = fs.lstatSync(pathname);

            if (stat.isDirectory() && pathname.indexOf(env) !== -1) {
                self.ReloadSync(pathname, app, 0);      //第三个参数传0目的是防止多次调用setTimeOut
                Handler.watchFileChanged(pathname, app);
            } else if (path.extname(pathname).toLowerCase() == ".json") {

//                logger.info("config load file %s", pathname);

                var content = fs.readFileSync(pathname, {encoding: 'utf8'});

                Handler.ParseContent(pathname, content);
            }
        });
    },

    Watch: function (basename, callback) {
        if (!Handler.callbacks) {
            Handler.callbacks = {};
        }
        Handler.callbacks[basename] = callback;
        if (!!callback) {
            callback(null, Handler[basename]);
        }
    },

    Reload: function (filename, app, callback) {
        var self = this;

        if (!fs.existsSync(filename)) {
            return utils.invokeCallback(callback, null);
        }

        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            return utils.invokeCallback(callback, null);
        }

        if (path.extname(filename).toLowerCase() != '.json') {
            return utils.invokeCallback(callback, null);
        }

        if (filename.indexOf('config') == -1) {
            return utils.invokeCallback(callback, null);
        }

        var middle = filename.substr(filename.indexOf('config') + 'config'.length).replace(path.basename(filename), '');

        var env = _.isObject(app) ? app.get(Constants.RESERVED.ENV) : app;
        if (middle != '/' && middle != '\\' && middle.indexOf(env) == -1) {
            logger.warn("config suspend to reload not support file: %s", filename);
            return utils.invokeCallback(callback, null);
        }

        logger.info("config Reload file: %s", filename);

        fs.readFile(filename, 'utf8', function (err, data) {
            if (!!err) {
                logger.error('config Reload file failed: %s', err.stack);
                return utils.invokeCallback(callback, err);
            }

            Handler.ParseContent(filename, data);
            utils.invokeCallback(callback, null, data);
        });
    }

};

var CopyDefaultConfigs = function (configPath, replaceHolder, force) {

    var configs = fs.readdirSync(configPath);
//    logger.info('configs: %j', configs);
    for (var i in configs) {
        var pathname = configPath + '/' + configs[i];

        if (!fs.existsSync(pathname)) {
            continue;
        }

        var stat = fs.lstatSync(pathname);

        if (stat.isDirectory()) {
            CopyDefaultConfigs(pathname, replaceHolder, force);
        } else {
            if (configs[i].toLowerCase().indexOf(".default") != -1 && configs[i].split('.').length == 2) {
                var newConfig = configPath + '/' + configs[i].replace(".default", ".json");
                if (!fs.existsSync(newConfig) || force) {
                    var content = fs.readFileSync(configPath + '/' + configs[i], 'utf-8');
                    _.each(replaceHolder, function (v, k) {
                        content = content.replace(new RegExp(k, 'g'), v);
//                    logger.info('generate config file: %s, %s, %s', content, k, v);
                    });
                    fs.writeFileSync(newConfig, content);
                    logger.info('Config file generated: %s', newConfig);
//                    logger.info('Config file generated: %s\n%s', newConfig, content);
                }
            }
        }
    }
};

var getPublicAddress = function () {
    var deferred = Q.defer();

//    var now = Date.now();
    request.get({url: 'http://115.182.49.69:1337/'}, function (error, response, body) {
        if (!!error) {
            return deferred.reject(error);
        }

        if (response.statusCode !== 200) {
            return deferred.reject(response);
        }

//            logger.info("recv %d response: %j", now, body);

        return deferred.resolve(body);
    });
    return deferred.promise;
};

function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];

        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }

    return '127.0.0.1';
}

var program = require('commander');

program
    .version('0.0.1')
    .option('-g, --generate [file]', 'Generate config by options')
    .option('-f, --force', 'Force regenerate config by options')
    .parse(process.argv);

//console.log('generate:', program.generate);

if (!!program.generate) {
    module.exports = null;

    if (!fs.existsSync(program.generate)) {
        logger.error('options file not exists: %s', program.generate);
        return;
    }

    Q()
        .then(function () {
                  var options = JSON.parse(fs.readFileSync(program.generate, 'utf8').replace(/^\uFEFF/, ''));

                  return Q.resolve(options);
              })
        .then(function (options) {
                  if (options.outerHost == '@outerHost') {
                      options.outerHost = '';
                  }
                  if (!options.outerHost || !options.mapClientHost || !options.serverUid) {
                      return getPublicAddress()
                          .then(function (ip) {
                                    if (!options.outerHost) {
                                        options.outerHost = ip;
                                        logger.warn('options key %j set value %j.', 'outerHost', options.outerHost);
                                    }
                                    if (!options.mapClientHost) {
                                        options.mapClientHost = ip;
                                        logger.warn('options key %j set value %j.', 'mapClientHost',
                                                    options.mapClientHost);
                                    }
                                    if (!options.serverUid) {
                                        options.serverUid = +ip.split('.').slice(2, 4).join('');
                                        logger.warn('options key %j set value %j.', 'serverUid', options.serverUid);
                                    }
                                    return Q.resolve(options);
                                })
                  }

                  return Q.resolve(options);
              })
        .then(function (options) {
                  if (options.innerHost == '@innerHost') {
                      options.innerHost = '';
                  }
                  if (!options.innerHost) {
                      if (!options.innerHost) {
                          options.innerHost = getIPAddress();
                          logger.warn('options key %j set value %j.', 'innerHost', options.innerHost);
                      }
                      return Q.resolve(options);
                  }

                  return Q.resolve(options);
              })
        .then(function (options) {
                  for (var i = 0; i < 3; ++i) {
                      _.each(options, function (v, k) {
                          if (!_.contains(v, '@')) {
                              return;
                          }

                          if (!_.isUndefined(options[v.replace('@', '')])) {
                              options[k] = options[v.replace('@', '')];
                              return;
                          }

                          _.each(options, function (ov, ok) {
                              if (_.contains(ov, '@')) {
                                  return;
                              }

                              if (v.indexOf(ok) != -1) {
                                  options[k] = v.replace('@' + ok, ov);
                              }
                          });
                      });
                  }

                  _.each(options, function (v, k) {
                      if (_.contains(v, '@')) {
                          logger.error('options of key: %j no value %j.', k, v);
                      }
                  });

                  return Q.resolve(options);
              })
        .then(function (options) {

                  logger.warn('options: %j', options);

                  var generateConfig = function (configPath, options) {
                      var configs = fs.readdirSync(configPath);
                      for (var i in configs) {
                          var pathname = configPath + '/' + configs[i];

                          if (!fs.existsSync(pathname)) {
                              continue;
                          }

                          var stat = fs.lstatSync(pathname);
                          if (stat.isDirectory()) {
                              generateConfig(pathname, options);
                              continue;
                          }

                          if (path.extname(configs[i]).toLowerCase() == '.default') {

                              if (configs[i].indexOf('version') != -1) {
                                  configs[i] = configs[i];
                              }

                              // if not define channel ignore all channel default.
                              if (!options.channel && configs[i].split('.').length > 2) {
                                  continue;
                              }

                              // if define channel and not equal current file. ignore it.
                              if (!!options.channel && configs[i].split('.').length > 2
                                  && configs[i].indexOf(options.channel + '.default') === -1) {
                                  continue;
                              }

                              // if define channel ignore the simple default file if exist the channel default.
                              if (!!options.channel && configs[i].split('.').length == 2) {
                                  var channelDefaultPath = configPath + '/' + configs[i].replace('.default',
                                                           '.' + options.channel + '.default');

                                  if (fs.existsSync(channelDefaultPath)) {
                                      continue;
                                  }
                              }

                              var newConfig = configPath + '/' + configs[i].replace(".default", ".json");
                              if (!!options.channel && configs[i].indexOf(options.channel + '.default') != -1) {
                                  newConfig =
                                      configPath + '/' + configs[i].replace(options.channel + '.default', "json");
                              }

                              if (fs.existsSync(newConfig)) {
                                  fs.unlinkSync(newConfig);
                              }

                              var content = fs.readFileSync(configPath + '/' + configs[i], 'utf-8');
                              _.each(options, function (v, k) {
                                  content = content.replace(new RegExp('@' + k, 'g'), v);
                              });

                              var re = /@([a-zA-Z]+?)/g;

                              var res;
                              while (res = re.exec(content)) {
                                  logger.error(util.format('pathname: %s match: %j tag: %j res: %j', pathname, res[0],
                                                           res[1], res));
                              }

                              fs.writeFileSync(newConfig, content, 'utf-8');

                              logger.warn('Config file generated: %s', newConfig);
                          }
                      }
                  };

                  generateConfig(Handler.defaultConfigPath, options);
              })
        .catch(function (error) {
                   logger.error('generate config file error: %s', error.stack);
               })
        .finally(function () {
                     logger.warn('generated config files done. exit.');
                 })
        .done();

    return;
}

CopyDefaultConfigs(Handler.defaultConfigPath);
