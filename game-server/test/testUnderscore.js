/**
 * Created by kazi on 2014/6/6.
 */

var assert = require("assert");
var _ = require('underscore');
//var globalFunction = require('./../app/tools/globalFunction');
var urlencode = require('urlencode');
//var utilSql = require('./../app/tools/mysql/utilSql');

describe('sample', function () {
    describe('#sample()', function () {
        it('should return -1 when the value is not present', function () {

            var serverTypeMaps = {
                "connector": [
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-3",
                        "host": "10.227.41.36",
                        "port": 26033,
                        "clientPort": 27003,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12868,
                        "serverType": "connector",
                        "pid": 29543
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-4",
                        "host": "10.227.41.36",
                        "port": 26034,
                        "clientPort": 27004,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12869,
                        "serverType": "connector",
                        "pid": 29545
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-2",
                        "host": "10.227.41.36",
                        "port": 26032,
                        "clientPort": 27002,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12867,
                        "serverType": "connector",
                        "pid": 29541
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-7",
                        "host": "10.227.41.36",
                        "port": 26037,
                        "clientPort": 27007,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12872,
                        "serverType": "connector",
                        "pid": 29551
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-9",
                        "host": "10.227.41.36",
                        "port": 26039,
                        "clientPort": 27009,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12874,
                        "serverType": "connector",
                        "pid": 29555
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-1",
                        "host": "10.227.41.36",
                        "port": 26031,
                        "clientPort": 27001,
                        "frontend": "true",
                        "dedicateDispatcher": "true",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12866,
                        "serverType": "connector",
                        "pid": 29540
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-8",
                        "host": "10.227.41.36",
                        "port": 26038,
                        "clientPort": 27008,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12873,
                        "serverType": "connector",
                        "pid": 29553
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-5",
                        "host": "10.227.41.36",
                        "port": 26035,
                        "clientPort": 27005,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12870,
                        "serverType": "connector",
                        "pid": 29547
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "connector-server-6",
                        "host": "10.227.41.36",
                        "port": 26036,
                        "clientPort": 27006,
                        "frontend": "true",
                        "dedicateDispatcher": "false",
                        "logicType": "game",
                        "mapClientHost": "games.qmphs.qq.com",
                        "mapClientPort": 12871,
                        "serverType": "connector",
                        "pid": 29549
                    }
                ],
                "cs": [
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "cs-server-1",
                        "host": "127.0.0.1",
                        "port": 26041,
                        "serverType": "cs",
                        "pid": 29584
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "cs-server-2",
                        "host": "127.0.0.1",
                        "port": 26042,
                        "serverType": "cs",
                        "pid": 29586
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "cs-server-3",
                        "host": "127.0.0.1",
                        "port": 26043,
                        "serverType": "cs",
                        "pid": 29588
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "cs-server-4",
                        "host": "127.0.0.1",
                        "port": 26044,
                        "serverType": "cs",
                        "pid": 29590
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "cs-server-5",
                        "host": "127.0.0.1",
                        "port": 26045,
                        "serverType": "cs",
                        "pid": 29592
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "cs-server-6",
                        "host": "127.0.0.1",
                        "port": 26046,
                        "serverType": "cs",
                        "pid": 29594
                    }
                ],
                "chart": [],
                "chat": [],
                "idip": [],
                "psIdip": [],
                "pvp": [
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "pvp-server-1",
                        "host": "127.0.0.1",
                        "port": 26053,
                        "serverType": "pvp",
                        "pid": 29571
                    }
                ],
                "ps": [
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "ps-server-1",
                        "host": "127.0.0.1",
                        "port": 26050,
                        "serverType": "ps",
                        "pid": 29557
                    }
                ],
                "us": [
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "args": "--debug=56082",
                        "id": "us-server-1",
                        "host": "127.0.0.1",
                        "port": 26060,
                        "serverType": "us",
                        "pid": 29579
                    }
                ],
                "fs": [],
                "dbcache": [
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "dbcache-server-2",
                        "host": "127.0.0.1",
                        "port": 26082,
                        "serverType": "dbcache",
                        "pid": 29598
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "dbcache-server-4",
                        "host": "127.0.0.1",
                        "port": 26084,
                        "serverType": "dbcache",
                        "pid": 29602
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "dbcache-server-1",
                        "host": "127.0.0.1",
                        "port": 26081,
                        "serverType": "dbcache",
                        "pid": 29596
                    },
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "dbcache-server-3",
                        "host": "127.0.0.1",
                        "port": 26083,
                        "serverType": "dbcache",
                        "pid": 29600
                    }
                ],
                "ms": [],
                "rs": [
                    {
                        "main": "/data/home/user00/qmphs/app",
                        "env": "games",
                        "id": "rs-server-1",
                        "host": "127.0.0.1",
                        "port": 26052,
                        "serverType": "rs",
                        "pid": 29569
                    }
                ]
            };

            var logs = _.mapObject(serverTypeMaps, function (value, key) {
                return _.map(value, function (item) {
                    return [item.id, item.port, item.pid];
                })
            });

            console.log('logs %j', logs);
        })
    })
});

var chatContent = '橙装分解不用愁，材料100%保留！快来打造神装，成就区服最强号！';
console.log(urlencode.encode(chatContent, 'utf8'));

describe('sample', function () {
    describe('#sample()', function () {
        it('should return -1 when the value is not present', function () {

            var data = {
                "1": {"attID": 1, "name": "豪雨"},
                "2": {"attID": 2, "name": "处刑者炼狱"},
                "3": {"attID": 3, "name": "弑神者绝海"},
                "4": {"attID": 4, "name": "之影炽火"},
                "5": {"attID": 5, "name": "先知幻影"},
                "6": {"attID": 6, "name": "浸染者狱火"}
            };

            var num = 2;

            var sample = _.sample(data, num);
            console.log(sample);

//            var pick = _.map(sample, function (id) {
//                return data[id];
//            });
//            console.log(pick);

            var pluck = _.pluck(_.sample(data, num), 'name');
            console.log(pluck);
        })
    })
});
//
//
//describe('contains', function () {
//    describe('#contains()', function () {
//        it('should return -1 when the value is not present', function () {
//
//            var data = {a: 1, b: 2};
//
//            console.log(_.contains(_.keys(data), 'a'));
//        })
//    })
//});


//describe('random', function () {
//    describe('#random()', function () {
//        it('should return -1 when the value is not present', function () {
//
//            for (var i = 0; i < 100; ++i) {
//                console.log(_.random(100));
//            }
//
//        })
//    })
//});

describe('indexBy', function () {
    describe('#indexBy()', function () {
        it('should return -1 when the value is not present', function () {


            var listRoles = [
                {serverUid: 1},
                {serverUid: 2},
                {serverUid: 3}
            ];

            var listRolesMap = _._.indexBy(listRoles, 'serverUid');

            console.log('listRolesMap: %j', listRolesMap);

        })
    })
});

//describe('filter', function () {
//    describe('#filter()', function () {
//        it('should return -1 when the value is not present', function () {
//
//            var array = [
//                [1, 2, 3, 4],
//                [5, 6, 7, 8]
//            ];
//
//            var stooges = [
//                {name: 'moe', age: 40},
//                {name: 'larry', age: 50},
//                {name: 'curly', age: 60}
//            ];
//
//
//            console.log(_.filter(array, function (num) {
//                console.log(num);
//                return num[1] == 6;
//            }));
//
//            console.log(_.filter(stooges, function (num) {
//                console.log(num);
//                return num['name'] === 'moe';
//            }));
//
//            assert.equal(-1, [1, 2, 3].indexOf(5));
//            assert.equal(-1, [1, 2, 3].indexOf(0));
//        })
//    })
//});
//
//describe('map', function () {
//    describe('#map()', function () {
//        it('should return -1 when the value is not present', function () {
//
//            var array = [
//                [1, 2, 3, 4],
//                [5, 6, 7, 8]
//            ];
//
//            var stooges = [
//                {name: 'moe', age: 40},
//                {name: 'larry', age: 50},
//                {name: 'curly', age: 60}
//            ];
//
//
//            console.log(_.map(array, function (num) {
//                console.log(num);
//                return num[1] == 6;
//            }));
//
//            console.log(_.filter(stooges, function (num) {
//                console.log(num);
//                return num['name'] === 'moe';
//            }));
//
//            assert.equal(-1, [1, 2, 3].indexOf(5));
//            assert.equal(-1, [1, 2, 3].indexOf(0));
//        })
//    })
//});
//
//describe('map', function () {
//    describe('#map()', function () {
//        it('should return -1 when the value is not present', function () {
//
//            var stooges = [
//                {name: 'curly', age: 25},
//                {name: 'moe', age: 21},
//                {name: 'larry', age: 23}
//            ];
//
//            var youngest = _.chain(stooges)
//                .sortBy(function (stooge) {
//                            return stooge.age;
//                        })
//                .map(function (stooge) {
//                         return stooge.name + ' is ' + stooge.age;
//                     })
//                .first()
//                .value();
//
//            console.log(youngest);
//
//            var array = [
//                [1, '2', 3, 4, new Date],
//                [5, '6', 7, 8, new Date]
//            ];
//
//            var sql = _.chain(array)
//                .map(function (item) {
//                         return '(' + item.join(',') + ')';
//                     })
//                .value()
//                .join(',');
//
//            console.log(sql);
//
//            console.log(utilSql.BuildSqlValues(array));
//            console.log(utilSql.BuildSqlValues([array[0]]));
//
//            assert.equal(-1, [1, 2, 3].indexOf(5));
//            assert.equal(-1, [1, 2, 3].indexOf(0));
//        })
//    })
//});
//
//
//describe('map with undefined array', function () {
//    describe('#map()', function () {
//        it('should return -1 when the value is not present', function () {
//
//            console.log('--map with undefined array--');
//
//            var stooges = new Array(10);
//
//            console.log(stooges.length);
//
//            var youngest = _.map(stooges, function (stooge) {
//                console.log(stooge);
//                return stooge;
//            });
//
//            console.log(youngest);
//
//            console.log('--map with undefined array--');
////            assert.equal(-1, [1, 2, 3].indexOf(0));
//        })
//    })
//});
//
//
//describe('reduce', function () {
//    describe('#reduce()', function () {
//        it('should return -1 when the value is not present', function () {
//
//            var stooges = [
//                {name: 'curly', age: 25},
//                {name: 'moe', age: 21},
//                {name: 'larry', age: 23}
//            ];
//
//            var youngest = _.reduce(stooges, function (memo, item) {
//                console.log(memo, item);
//                memo[item] = 0;
//                return memo;
//            }, {});
//
//            assert.equal(-1, [1, 2, 3].indexOf(5));
//            assert.equal(-1, [1, 2, 3].indexOf(0));
//        })
//    })
//});