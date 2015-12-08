/**
 * Created by xykong on 2014/8/30.
 */
var assert = require("assert");
var config = require("./../../app/tools/config");
config.ReloadSync(config.defaultConfigPath, 'development');
var wxOauth = require("./../../app/tools/openSdks/tencent/wxOauth");

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        })
    })
});

var openID = 'oZ6DRtzkgzAU2OpfFVKhzTRosbyw';
var token = 'OezXcEiiBSKSxW0eoylIeMu1cgIgWww0XLd0XmsWF9bwjUL9AvBJ59FjyWX6N1ungaiClTBbRsv1D3z4CFCledfTTMRhoy1RnCn1lBUv2XUrlt0Ynt593ma5UVTwdztytW6X2BgrAme2bJ2Lz2UdFQ';
//var refreshToken = 'OezXcEiiBSKSxW0eoylIeMu1cgIgWww0XLd0XmsWF9bwjUL9AvBJ59FjyWX6N1unov7MsifMWc3bbvYFVW2pBIKNslQd6dDE5WevLwBPSqobIaMFYiwpYooRNE9szGVD_ecFU-yWdk-4WGQ-74fgKw';


//describe('#refresh_token()', function () {
//    it('should return null and result ret 0.', function (done) {
//        wxOauth.refresh_token(openID, refreshToken, function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});


describe('#check_token()', function () {
    it('should return null and result ret 0.', function (done) {
        wxOauth.check_token(openID, token, function (error, result) {
            assert.equal(null, error);

            assert.equal(result.ret, 0);

            done();
        });
    })
});


//describe('#upload_wx()', function () {
//    it('should return null and result ret 0.', function (done) {
//        wxOauth.upload_wx(openID, token, function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});
//
//for (var i = 0; i < 1; ++i) {
//describe('#wx()', function () {
//    it('should return null and result ret 0.', function (done) {
//
//        var fopenid = 'oZ6DRt8Mo6emIgXD-xq2H7L381J8';    // 大东
////        var fopenid = 'oZ6DRt3pzoHgmv2KEzH3vGJt1dZw';    // 孔祥一
////        var fopenid = 'oZ6DRt-4qOUajDa98-nf1eSfDQfA';    // 安永峰
//        var extinfo = 'wx share extinfo';
//        var title = 'wx share';
//        var description = 'message from: ' + openID;
//        var media_tag_name = 'thumb';
//        var thumb_media_id = 'uwL7QdmBIm3nwM1wcijLXwpP-Mx8aIsaGr3tGgKm2XALBwjclTpMaMBpyO2_uIRN';
//
//        wxOauth.wx(openID, token, fopenid, extinfo, title, description, media_tag_name, thumb_media_id,
//                   function (error, result) {
//                       assert.equal(null, error);
//
//                       assert.equal(result.ret, 0);
//
//                       done();
//                   });
//    })
//});
//}
//
//describe('#wxgame()', function () {
//    it('should return null and result ret 0.', function (done) {
////        var touser = 'oZ6DRt8Mo6emIgXD-xq2H7L381J8';    // 大东
//        var touser = 'oZ6DRt3pzoHgmv2KEzH3vGJt1dZw';    // 孔祥一
//        var title = 'title';
//        var content = 'content';
//
//        wxOauth.wxgame(openID, token, touser, title, content, function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});
//
//describe('#wxfriends_profile()', function () {
//    it('should return null and result ret 0.', function (done) {
//        wxOauth.wxfriends_profile(openID, token, function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});
//
//describe('#wxprofile()', function () {
//    it('should return null and result ret 0.', function (done) {
//        wxOauth.wxprofile(openID, token, [openID], function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});
//
//describe('#wxfriends()', function () {
//    it('should return null and result ret 0.', function (done) {
//        wxOauth.wxfriends(openID, token, function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});
//
//describe('#wxuserinfo()', function () {
//    it('should return null and result ret 0.', function (done) {
//        wxOauth.wxuserinfo(openID, token, function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});

describe('#wxscore()', function () {
    it('should return null and result ret 0.', function (done) {
        wxOauth.wxscore(openID, token, 1000, function (error, result) {
            assert.equal(null, error);

            assert.equal(result.ret, 0);

            done();
        });
    })
});


//describe('#upload_wx()', function () {
//    it('should return null and result ret 0.', function (done) {
//        wxOauth.upload_wx(openID, 'test/openSdks/Logo.jpg', function (error, result) {
//            assert.equal(null, error);
//
//            assert.equal(result.ret, 0);
//
//            done();
//        });
//    })
//});
//
