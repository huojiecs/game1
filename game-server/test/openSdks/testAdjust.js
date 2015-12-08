/**
 * Created by xykong on 2015/5/13.
 */
var assert = require("assert");
var gameConst = require("./../../app/tools/constValue");
var config = require("./../../app/tools/config");
config.ReloadSync(config.defaultConfigPath, 'development');
var apiWrapper = require("./../../app/tools/openSdks/common/apiWrapper");
var adjust = require("./../../app/tools/openSdks/adjust/adjust");
var urlencode = require('urlencode');


describe('revenue', function () {
    describe('#revenue()', function () {
        it('should return null and result.', function (done) {

            //var params = {
            //    revenue: 3000,
            //    gps_adid: "845e926722b8bcb5f2d5c73207cd20ee",
            //    android_id: "221922c1101a7650"
            //};
            var params = {
                revenue: 9.99,
                gps_adid: "845e926722b8bcb5f2d5c73207cd20ee",
                idfa: "D2CADB5F-410F-4963-AC0C-2A78534BDF1E"
            };

            //var params = {
            //    revenue: 9.99,
            //    idfa: "D2CADB5F-410F-4963-AC0C-2A78534BDF1E"
            //};

            adjust.revenue(params)
                .then(function (result) {
                          console.log(result);
                          assert.equal(result.status, 'OK');

                          done();
                      })
                .fail(function (error) {
                          done(error);
                      });
        })
    })
});
