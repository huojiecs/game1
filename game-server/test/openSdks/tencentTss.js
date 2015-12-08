/**
 * Created by kazi on 2014/6/4.
 */

var assert = require("assert");
var config = require("./../../app/tools/config");
config.ReloadSync(config.defaultConfigPath, 'development');
var tssClient = require("./../../app/tools/openSdks/tencent/tssClient");

var testOpenId = 'AABBCCDD';
var testRoleId = 1;

describe('#sendLoginChannel()', function () {
    it('should return null and result.', function (done) {

        tssClient.sendLoginChannel(testOpenId, testRoleId, {
            auth_signature: 123,
            client_version: 456
        }).finally(function () {
            done();
        });

    })
});

describe('#sendTransAntiData()', function () {
    it('should return null and result.', function (done) {

        var anti_data = 'message.anti_data';

        tssClient.sendTransAntiData(testOpenId, testRoleId, {
            anti_data_len: anti_data.length,
            anti_data: anti_data
        }).finally(function () {
            done();
        });
    })
});

describe('#sendTransAntiData()', function () {
    it('should return null and result.', function (done) {

        var anti_data = 'message.anti_data';

        tssClient.sendTransAntiData(testOpenId, testRoleId, {
            anti_data_len: anti_data.length,
            anti_data: anti_data
        }).finally(function () {
            done();
        });
    })
});

describe('#sendTransAntiData()', function () {
    it('should return null and result.', function (done) {

        var anti_data = 'message.anti_data';

        tssClient.sendTransAntiData(testOpenId, testRoleId, {
            anti_data_len: anti_data.length,
            anti_data: anti_data
        }).finally(function () {
            done();
        });
    })
});

describe('#sendTransAntiData()', function () {
    it('should return null and result.', function (done) {

        var anti_data = 'message.anti_data';

        tssClient.sendTransAntiData(testOpenId, testRoleId, {
            anti_data_len: anti_data.length,
            anti_data: anti_data
        }).finally(function () {
            done();
        });
    })
});

describe('#sendLogoutChannel()', function () {
    it('should return null and result.', function (done) {

        tssClient.sendLogoutChannel(testOpenId, testRoleId, {
            flag: 0
        }).finally(function () {
            done();
        });
    })
});

