var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var mysql = require('mysql');
var Q = require('q');
require('q-flow'); // extends q

var configPath = "../config/merge.json";
var connection = null;
var config = null;
var targetDBName = null;

var ParseConfig = function (pathname) {
    if (!fs.existsSync(pathname)) {
        console.log(pathname + " does not exist!");
        return null;
    }

    var content = fs.readFileSync(pathname, {encoding: 'utf8'});
    content = content.replace(/^\uFEFF/, '');
    try {
        var config = JSON.parse(content);
        return config;
    }
    catch (err) {
        console.log('config parse failed. file: %s, error: %s', pathname, err.stack);
    }
    return null;
};

var StartMerge = function() {
    config = ParseConfig(configPath);
    if (!config) {
        return;
    }

    if (!config.targetServerUID) {
        console.log("targetServerUID is invalid");
        return;
    }

    if (!config.sourceServerUID || !_.isArray(config.sourceServerUID)) {
        console.log("sourceServerUID is invalid");
        return;
    }
    var sourceCount = config.sourceServerUID.length;
    if (sourceCount == 0) {
        console.log("sourceServerUID is empty");
        return;
    }

    targetDBName = util.format(config.dbNamePattern, config.targetServerUID);

    connection = mysql.createConnection({
                                            host: config.dbHost,
                                            user: config.dbUser,
                                            password: config.dbPw,
                                            database: targetDBName,
                                            port: config.dbPort
                                        });

    Q.ninvoke(connection, "connect")
        .then (function () {
            console.log("--------------------------connection ok--------------------------");
            var sourceIndex = 0;
            return Q.until(function () {
                var sourceServerUID = config.sourceServerUID[sourceIndex++];
                var srcDBName = util.format(config.dbNamePattern, sourceServerUID);
                return MergeOne(sourceServerUID, config.targetServerUID, srcDBName, targetDBName)
                    .then(function() {
                              return sourceIndex >= sourceCount;
                          })
                    .catch(function(){
                               return sourceIndex >= sourceCount;
                           });
            });
        })
        .catch (function (err) {
            if (!!err) {
                console.log(err);
            }
        })
        .finally (function () {
            connection.end();
            console.log("--------------------------all finished--------------------------");
        })
        .done();
};

var MergeOne = function(srcServerUid, targetServerUid, srcDBName, targetDBName) {
    var deferred = Q.defer();
    console.log(util.format("--------------------------%d TO %d START--------------------------"), srcServerUid, targetServerUid);
    var callSql = util.format("CALL `%s`.`sp_merge_data`(%d,%d,'%s','%s');", targetDBName, srcServerUid, targetServerUid, srcDBName, targetDBName);
    var spQuery = connection.query(callSql);
    spQuery
        .on('result', function(row){
                for (var f in row) {
                    if (_.isString(row[f])) {
                        console.log(row[f]);
                    }
                }
            })
        .on('end', function() {
                console.log(util.format("--------------------------%d TO %d END--------------------------"), srcServerUid, targetServerUid);
                return deferred.resolve();
            });
    return deferred.promise;
};

StartMerge();