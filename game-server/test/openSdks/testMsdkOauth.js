/**
 * Created by kazi on 2014/6/4.
 */

var assert = require("assert");
var config = require("./../../app/tools/config");
config.ReloadSync(config.defaultConfigPath, 'development');
var msdkOauth = require("./../../app/tools/openSdks/tencent/msdkOauth");

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        })
    })
});
var openID = 'CBC62C23B70C899A2A29199515D9EF06';
var token = '5C6834A457CDCE931F8D80291BD6FE44';

var openIDGuest = 'G_8@p36T6pYgXV36LD2hI3S8bkpwoacviT';
var tokenGuest = 'QhemTq2kMwADRUbbTOX84O@odZ@Gb4D9LUIt8I5Vk3s=';


describe('verify_login', function () {
    describe('#verify_login()', function () {
        it('should return null and result.', function (done) {

            msdkOauth.verify_login(openID, token)
                .then(function (result) {
                    console.log(result);

                    assert.equal(result.ret, 0);

                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        })
    })
});
//
//describe('guest_check_token', function () {
//    describe('#guest_check_token()', function () {
//        it('should return null and result.', function (done) {
//
//            msdkOauth.guest_check_token(openIDGuest, tokenGuest)
//                .then(function (result) {
//                          console.log(result);
//
//                          assert.equal(result.ret, 0);
//
//                          done();
//                      })
//                .fail(function (error) {
//                          done(error);
//                      });
//        })
//    })
//});

//
//describe('qqfriends', function () {
//    describe('#qqfriends()', function () {
//        it('should return null and result.', function (done) {
//            msdkOauth.qqfriends(openID, token, function (error, result) {
//                assert.equal(null, error);
//                done();
//            });
//        })
//    })
//});
//
//describe('qqfriends_detail', function () {
//    describe('#qqfriends_detail()', function () {
//        it('should return null and result.', function (done) {
//            msdkOauth.qqfriends_detail(openID, token, function (error, result) {
//                assert.equal(null, error);
//                done();
//            });
//        })
//    })
//});
//
//describe('qqprofile', function () {
//    describe('#qqprofile()', function () {
//        it('should return null and result.', function (done) {
//            msdkOauth.qqprofile(openID, token, function (error, result) {
//                assert.equal(null, error);
//                done();
//            });
//        })
//    })
//});
//
//describe('load_vip', function () {
//    describe('#load_vip()', function () {
//        it('should return null and result.', function (done) {
//            msdkOauth.load_vip(openID, token, function (error, result) {
//                assert.equal(null, error);
//                done();
//            });
//        })
//    })
//});


describe('load_vip', function () {
    describe('#load_vip()', function () {
        it('should return null and result.', function (done) {
            msdkOauth.load_vip(openID, token)
                .then(function (result) {
                    console.log(result);

                    assert.equal(result.ret, 0);

                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        })
    })
});


describe('query_vip', function () {
    describe('#query_vip()', function () {
        it('should return null and result.', function (done) {
            msdkOauth.query_vip(openID, token)
                .then(function (result) {
                    console.log(result);

                    assert.equal(result.ret, 0);

                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        })
    })
});


describe('get_vip_rich_info', function () {
    describe('#get_vip_rich_info()', function () {
        it('should return null and result.', function (done) {
            msdkOauth.get_vip_rich_info(openID, token)
                .then(function (result) {
                    console.log(result);

                    assert.equal(result.ret, 0);

                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        })
    })
});

describe('qqscore', function () {
    describe('#qqscore()', function () {
        it('should return null and result.', function (done) {
            msdkOauth.qqscore(openID, token, 100, 3, 1)
                .then(function (result) {
                    console.log(result);

                    assert.equal(result.ret, 0);

                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        })
    })
});