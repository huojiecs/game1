var mysql = require('mysql');
var Q = require('q');
var fs = require('fs');
var util = require('util');
var exec = require('child_process').exec;
var _ = require('underscore');

var config = {
    db_host:  "188.188.0.163",
    db_port: "3306",
    db_user: "root",
    db_pw: "mysql6666",
    db_name: "android_next_game",
    sp_file_name: "sp_merge_data.sql"
};

var sqlTable = null;
var sqlColumn = null;
var connection = null;
var mergeSP = null;

var tableProcess = {
    "_ver:1": "ignore",
    areslog: "clear",
    notice: "ignore",
    occupant: "clear",
    servicetime: "ignore",
    soulpvp: "clear",
    soulpvplog: "clear",
    unionanimal: "clear",
    ares: "ares",
    role: ["role", true],
    unioninfo: "union",
    qqmembergift: "qqgift",
    friendphysical: ["merge", false, true]
};

var callProdedureList = [
    "sp_mergeOccupantGift",
    "sp_mergeAresGift",
    "sp_mergeSoulPvpGift",
    "sp_mergeUnionBattleGift"
];

var spHead = "\
DELIMITER ;;\n\
DROP PROCEDURE IF EXISTS `sp_merge_data` ;;\n\
CREATE PROCEDURE `sp_merge_data` (IN _srcServerUid INT, IN _targetServerUid INT, IN _srcDBName VARCHAR(64), IN _targetDBName VARCHAR(64))\n\
BEGIN\n\
\tDECLARE _result VARCHAR(64) DEFAULT 'Ok';\n\
\tDECLARE l_sql VARCHAR(1024);\n\
\tDECLARE EXIT HANDLER FOR SQLEXCEPTION\n\
\tBEGIN\n\
\t\tROLLBACK;\n\
\t\tSET _result = 'Failed';\n\
\t\tSELECT _result;\n\
\tEND;\n\
\tSTART TRANSACTION;\n\
\tIF EXISTS(SELECT * FROM `merge_history` WHERE serverUid=_srcServerUid) THEN\n\
\t\tSET _result = 'Already Merged, skip';\n\
\tELSE\n";

var spTail = "\
\t\tINSERT INTO merge_history(serverUid,targetUid) VALUES(_srcServerUid,_targetServerUid);\n\
\tEND IF;\n\
\tCOMMIT;\n\
\tSELECT _result;\n\
END ;;\n\
DELIMITER ;\n";

var sqlPrepare = "\
\t\tSET @sql=l_sql;\n\
\t\tPREPARE s1 FROM @sql;\n\
\t\tEXECUTE s1;\n\
\t\tDEALLOCATE PREPARE s1;\n";

var sqlPrepareArg = function (arg) {
    return util.format("\
\t\tSET @sql=l_sql;\n\
\t\tPREPARE s1 FROM @sql;\n\
\t\tSET @arg=%s;\n\
\t\tEXECUTE s1 USING @arg;\n\
\t\tDEALLOCATE PREPARE s1;\n", arg);
};

var SetConfig = function () {
    sqlTable = util.format("SELECT TABLE_NAME FROM `information_schema`.`TABLES` WHERE TABLE_SCHEMA LIKE '%s'", config.db_name);
    sqlColumn = util.format("SELECT COLUMN_NAME,EXTRA FROM `information_schema`.`COLUMNS` WHERE TABLE_SCHEMA LIKE '%s' AND TABLE_NAME LIKE ?", config.db_name);
    AddProcedureCalls();
};

var StartWork = function () {
    SetConfig();
    var deferred = Q.defer();
    console.log("--------------------------START--------------------------");
    connection = mysql.createConnection({
                                          host: config.db_host,
                                          user: config.db_user,
                                          password: config.db_pw,
                                          database: 'information_schema',
                                          port: config.db_port
                                      });
    var mysqlErr = false;
    Q.ninvoke(connection, "connect")
        .then (function () {
            console.log('connection ok');
            return MysqlOuput();
        })
        .then (function (){
            var ws = fs.createWriteStream(config.sp_file_name, { encoding: 'utf8' });
            ws.write(mergeSP);
            return Q.resolve();
        })
        .catch (function (err) {
            if (!!err) {
                console.log(err);
            }
            mysqlErr = true;
        })
        .finally (function () {
            connection.end();
            console.log("--------------------------FINISH--------------------------");
            if (mysqlErr) {
                return deferred.reject();
            }
            else {
                return deferred.resolve();
            }
        })
        .done();
    return deferred.promise;
};

var AddProcedureCalls = function()
{
    var procedureCount = callProdedureList.length;
    for (var i=0; i<procedureCount; i++) {
        var procedureName = callProdedureList[i];
        spHead += util.format("\t\tSELECT 'BEGIN source %s';\n", procedureName);
        spHead += util.format("\t\tSET l_sql=CONCAT('CALL `', _srcDBName, '`.`%s`();');\n", procedureName);
        spHead += sqlPrepare;
        spHead += util.format("\t\tSELECT 'END source %s';\n", procedureName);
        spHead += util.format("\t\tSELECT 'BEGIN target %s';\n", procedureName);
        spHead += util.format("\t\tCALL `%s`();\n", procedureName);
        spHead += util.format("\t\tSELECT 'END target %s';\n", procedureName);
    }
};

var MysqlOuput = function () {
    var deferred = Q.defer();

    connection.query (sqlTable,function(err, rows, fields) {
        if (!!err) {
            console.log('query 1 failed - :' + err);
            return deferred.reject();
        }
        mergeSP = spHead;
        var jobs = [];
        var rowCount = rows.length;
        for (var i=0; i<rowCount; i++) {
            var tableName = rows[i].TABLE_NAME;
            jobs.push(TableOutput(tableName));
        }
        Q.all(jobs)
            .then(function () {
                mergeSP += spTail;
                return deferred.resolve();
            })
            .catch(function(err){
                return deferred.reject(err);
            })
            .done();
    });

    return deferred.promise;
};

var TableOutput = function (tableName) {
    var deferred = Q.defer();
    var method = "merge";
    if (tableName in tableProcess) {
        var args = tableProcess[tableName];
        if (_.isArray(args)) {
            args = _.clone(args);
            method = args.shift();
        }
        else {
            method = args;
            args = null;
        }
    }
    if (method == "ignore") {
        deferred.resolve();
    }
    else {
        var processor = TableProcessRouter[method];
        if (processor) {
            Q.fcall(processor,tableName, "\t\t", args)
                .then ( function(stepSql){
                mergeSP += util.format("\t\tSELECT 'BEGIN %s';\n", tableName);
                mergeSP += stepSql;
                mergeSP += util.format("\t\tSELECT 'END %s';\n", tableName);
                return deferred.resolve();
            })
            .catch ( function(err) {
                return deferred.reject(err);
            })
            .done();
        }
        else {
            console.log("No processor for " + method);
            deferred.reject();
        }
    }
    return deferred.promise;
};

var MergeTable = function (tableName, indent, args) {
    var deferred = Q.defer();
    var ignoreAI = !!args && !!args[0];
    var dupKey = !!args && !!args[1];
    connection.query (sqlColumn, [tableName], function(err, rows, fields) {
        if (!!err) {
            console.log('MergeTable failed - :' + err);
            return deferred.reject;
        }

        var autoIncrement = null;
        var collumnList = [];
        var collumnCount = rows.length;
        for (var i=0; i<collumnCount; i++) {
            var collumnName = rows[i].COLUMN_NAME;
            var collumnExtra = rows[i].EXTRA;
            if (!ignoreAI && collumnExtra=="auto_increment") {
                autoIncrement = collumnName;
            }
            else {
                collumnList.push(collumnName);
            }
        }
        var sqlMerge = indent + "SET l_sql=CONCAT('INSERT ";
        if (!!dupKey) {
            sqlMerge += "IGNORE ";
        }
        sqlMerge = sqlMerge + "INTO `" + tableName;
        if (!!autoIncrement) {
            sqlMerge += "`(";
            for (var j=0; j<collumnList.length; j++) {
                if (j != 0) {
                    sqlMerge += ",";
                }
                sqlMerge += "`"
                sqlMerge += collumnList[j];
                sqlMerge += "`";
            }
            sqlMerge += ") SELECT ";
            for (var j=0; j<collumnList.length; j++) {
                if (j != 0) {
                    sqlMerge += ",";
                }
                sqlMerge += "`"
                sqlMerge += collumnList[j];
                sqlMerge += "`";
            }
            sqlMerge += " FROM `', _srcDBName, '`.`" + tableName + "`;');\n";
            sqlMerge += sqlPrepare;
            return deferred.resolve(sqlMerge);
        }
        else {
            sqlMerge = sqlMerge + "` SELECT * FROM `', _srcDBName, '`.`" + tableName + "`;');\n";
            sqlMerge += sqlPrepare;
            return deferred.resolve(sqlMerge);
        }
        return deferred.resolve();
    });

    return deferred.promise;
};

var ClearTable = function (tableName, indent) {
    var deferred = Q.defer();
    var sqlClear = indent + "DELETE FROM `" + tableName + "`;\n";
    deferred.resolve(sqlClear);
    return deferred.promise;
};

var AresTable = function (tableName, indent) {
    var deferred = Q.defer();
    var insertSql = indent + "SET l_sql=CONCAT('INSERT INTO `ares` SELECT * FROM `', _srcDBName, '`.`ares` WHERE `type`!=1;');\n" + sqlPrepare;
    var deleteSql = indent + "DELETE FROM `ares` WHERE `type`=1;\n";
    var updateSql = indent + "UPDATE `ares` SET rankKey=0;\n";
    deferred.resolve(insertSql + deleteSql + updateSql);
    return deferred.promise;
};

var RoleTable = function (tableName, indent, args) {
    var deferred = Q.defer();
    var updateDestSql = indent + "UPDATE `role` SET serverUid=_targetServerUid WHERE serverUid=0;\n";
    var updateSrcSql = indent + "SET l_sql=CONCAT('UPDATE `', _srcDBName, '`.`role` SET serverUid=? WHERE serverUid=0;');\n" + sqlPrepareArg('_srcServerUid');

    MergeTable(tableName, indent, args)
        .then (function(insertSql) {
            deferred.resolve(updateDestSql + updateSrcSql + insertSql);
        })
        .catch ( function(err) {
            return deferred.reject(err);
        })
        .done();
    return deferred.promise;
};

var QQGiftTable = function (tableName, indent, args) {
    var deferred = Q.defer();
    var updateDestSql = indent + "UPDATE `qqmembergift` SET serverID=_targetServerUid WHERE serverID=0;\n";
    var updateSrcSql = indent + "SET l_sql=CONCAT('UPDATE `', _srcDBName, '`.`qqmembergift` SET serverID=? WHERE serverID=0;');\n" + sqlPrepareArg('_srcServerUid');
    MergeTable(tableName, indent, args)
        .then (function(insertSql) {
        deferred.resolve(updateDestSql + updateSrcSql + insertSql);
    })
        .catch ( function(err) {
        return deferred.reject(err);
    })
        .done();
    return deferred.promise;
};

var UnionTable = function (tableName, indent, args) {
    var deferred = Q.defer();
    var updateDestSql = indent + "UPDATE `unioninfo` SET isRegister=1,isDuke=0 WHERE isDuke>0;\n";
    var updateSrcSql = indent + "SET l_sql=CONCAT('UPDATE `', _srcDBName, '`.`unioninfo` SET isRegister=1,isDuke=0 WHERE isDuke>0;');\n" + sqlPrepare;
    MergeTable(tableName, indent, args)
        .then (function(insertSql) {
        deferred.resolve(updateDestSql + updateSrcSql + insertSql);
    })
        .catch ( function(err) {
        return deferred.reject(err);
    })
        .done();
    return deferred.promise;
};

var TableProcessRouter = {
    "merge": MergeTable,
    "clear": ClearTable,
    "ares": AresTable,
    "role": RoleTable,
    "qqgift": QQGiftTable,
    "union": UnionTable
};

StartWork();





