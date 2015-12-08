/**
 * Created by kazi on 2014/6/4.
 *
 * 2.1 Oauth服务
 * 实现手机Oauth授权登录相关功能。
 * http://wiki.dev.4g.qq.com/v2/ZH_CN/router/index.html#!qq.md#2.4.profile
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('tencent-oauth', __filename);
var utils = require('./../../utils');
var config = require('./../../config');
var md5 = require('md5');
var request = require('request');
var util = require('util');
var Q = require('q');


//var openID = 'CBC62C23B70C899A2A29199515D9EF06';
//var token = '5C6834A457CDCE931F8D80291BD6FE44';

var Handler = module.exports;

var makeSig = function (time) {
    return md5.digest_s(config.vendors.msdkOauth.appKey + time);
};

Handler.requestWrapper = function (params, data, callback) {
    var deferred = Q.defer();

    var now = Date.now();
//    logger.info("send %d request: %s%s%s, data: %j", now, params.hostUrl, params.path, params.uri, data);

    var options = {
        url: params.hostUrl + params.path + params.uri,
        body: JSON.stringify(data)
    };

    if (!!config.vendors.proxy && !!config.vendors.proxy.url) {
        options.proxy = config.vendors.proxy.url;
    }

    var profiler = utils.profiler();
    request.post(options, function (error, response, body) {
        profiler.check(1.0, logger, 'requestWrapper request: %s%s', params.path, params.uri);

        if (!!error || response.statusCode !== 200) {
            logger.error("recv %d elapsed %s, request: %s%s%s, data: %j, failed response: %j, error: %s", now,
                         profiler.elapsed(), params.hostUrl, params.path, params.uri, data, response,
                         utils.getErrorMessage(error));
        }

        if (!!error) {
            return deferred.reject(error);
        }

        if (response.statusCode !== 200) {
            return deferred.reject(response);
        }

        try {
            var result = JSON.parse(body);
        }
        catch (error) {
            logger.error("recv %d elapsed %s, request: %s%s%s, data: %j, body: %j, failed parse body, error: %s", now,
                         profiler.elapsed(), params.hostUrl, params.path, params.uri, data, body, result);
            return deferred.reject(error);
        }

        logger.warn("recv %d elapsed %s, request: %s%s%s, data: %j, response result: %j", now, profiler.elapsed(),
                    params.hostUrl, params.path, params.uri, data, result);

//            if (result.ret !== 0) {
//                return deferred.reject(result);
//            }

        return deferred.resolve(result);
    });
    return deferred.promise.nodeify(callback);
};

/*
 * 2.1.1/auth/verify_login
 2.1.1.1接口说明
 验证用户的登录态，判断openkey是否过期，没有过期则对openkey有效期进行续期（一次调用续期2小时）。
 url中带上msdkExtInfo=xxx（请求序列号），可以在后回内容中，将msdkExtInfo原数据带回来，即可实现纯异常请求。msdkExtInfo为可选参数。
 2.1.1.2输入参数说明
 参数名称	类型	描述
 appid	Int	应用在QQ开放平台中的唯一id
 openid	String	普通用户唯一标识（QQ平台）
 openkey	String	授权凭证access_token
 userip	String	用户客户端ip
 （请注意输入参数的类型，参考1.5）

 2.1.1.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节

 2.1.1.4 接口调用说明
 url	http://msdktest.qq.com/ auth (兼容wxoauth)/verify_login/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.1.1.5 请求示例
 POST
 /auth/verify_login/?timestamp=*&appid=**&sig=***&openid=**&encode=1
 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "appid": 100703379,
 "openid": "A3284A812ECA15269F85AE1C2D94EB37",
 "openkey": "933FE8C9AB9C585D7EABD04373B7155F",
 "userip": "192.168.5.114"
 }
 2.1.1.6 返回格式示例
 {"ret":0,"msg":"user is logged in"}
 */
Handler.verify_login = function (openID, token, callback) {

    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/wxoauth/verify_login/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID,
        "openkey": token,
        "userip": "127.0.0.1"
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 4.1.1 /auth/guest_check_token
 4.1.1.1 接口说明
 游客模式下面，调用该接口鉴权。
 4.1.1.2输入参数说明
 参数名称	类型	描述
 guestid	string	游客的唯一标识
 accessToken	string	用户的登录凭证

 4.1.1.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节

 4.1.1.4 接口调用说明
 url	http://msdktest.qq.com/ auth/guest_check_token/
 URI	?timestamp=**&appid=G_**&sig=**&openid=G_**&encode=1
 格式	JSON
 http请求方式	POST

 4.1.1.5 请求示例
 POST
 /auth/guest_check_token/?timestamp=&appid=G_**&sig=***&openid=G_**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "accessToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJPLafWudG-idTVMbKesBkhBO_ZxFWN4zlXCpCHpYcrXNG6Vs-cocorhdT5Czj_23QF6D1qH8MCldg0BSMdEUnsaWcFH083zgWJcl_goeBUSQ",
 "guestid": "G_oGRTijiaT-XrbyXKozckdNHFgPyc"
 }
 4.1.1.6 返回格式示例
 {"ret":0,"msg":"ok"}
 */
Handler.guest_check_token = function (openID, token, callback) {

    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/auth/guest_check_token/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time,
                         'G_' + config.vendors.msdkOauth.appid, makeSig(time), openID)
    };

    var data = {
        "appid": 'G_' + config.vendors.msdkOauth.appid,
        "guestid": openID,
        "accessToken": token,
        "userip": "127.0.0.1"
    };

    return this.requestWrapper(params, data, callback);
};

Handler.qqfriends = function (openID, token, callback) {

    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/relation/qqfriends/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID,
        "accessToken": token
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 2.3.2/relation/qqfriends_detail
 2.3.2.1接口说明
 获取QQ同玩好友详细的个人信息接口
 2.3.2.2输入参数说明
 参数名称	类型	描述
 appid	string 	应用在QQ平台的唯一id
 accessToken	string	当前用户登录票据
 openid	string	用户在某个应用的唯一标识
 flag	int	flag=1时，返回不包含自己在内的好友关系链; flag=2时，返回包含自己在内的好友关系链。其它值无效，使用当前逻辑。
 （请注意输入参数的类型，参考1.5）

 2.3.2.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 lists	QQ同玩好友个人信息列表，类型vector<QQGameFriendsList>
 struct QQGameFriendsList {
 string          openid;      //好友的openid
 string          nickName;   //昵称(优先输出备注，无则输出昵称)
 string          gender;      //性别，用户未填则默认返回男
 string          figureurl_qq;  //好友QQ头像URL,必须在URL后追加以下参数/40，/100这样可以分别获得不同规格的图片：
 40*40(/40)、100*100(/100)
 };
 is_lost	is_lost为1的时候表示获取的数据做了降级处理：此时业务层有缓存数据时，可以先用缓存数据；如果没有的话，再使用当前的数据。并且该标志打上1时，不要对这个数据进行缓存。

 2.3.2.4 接口调用说明
 url	http://msdktest.qq.com/relation/qqfriends_detail/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.3.2.5 请求示例
 POST
 /relation/qqfriends_detail/?timestamp=1381288134&appid=100703379&sig=3f308f92212f75cd8d682215cb3fa852&openid=F4382318AFBBD94F856E8%2066043C3472E&encode=1
 POST data:
 {
 "appid": “100703379”,
 "openid": "A3284A812ECA15269F85AE1C2D94EB37",
 "accessToken": "933FE8C9AB9C585D7EABD04373B7155F",
 "flag": 1
 }
 2.3.2.6 返回格式示例
 {
 "ret": 0,
 "msg": "success",
 "lists": [
 {
 "openid": "69FF99F3B17436F2F6621FA158B30549",
 "nickName": "张鸿",
 "gender": "男",
 "figureurl_qq": "http://q.qlogo.cn/qqapp/100703379/69FF99F3B17436F2F6621FA158B30549/"
 }
 ],
 "is_lost": "0"
 }
 */
Handler.qqfriends_detail = function (openID, token, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/relation/qqfriends_detail/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID,
        "accessToken": token
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 2.3.1/relation/qqprofile
 2.3.1.1接口说明
 获取用户QQ帐号基本信息。

 2.3.1.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在平台的唯一id
 accessToken	string	登录态
 openid	string	用户在某个应用的唯一标识

 2.3.1.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 nickName	用户在QQ空间的昵称（和手机QQ昵称是同步的）
 gender	性别 如果获取不到则默认返回"男"
 picture40	大小为40×40像素的QQ头像URL
 picture100	大小为100×100像素的QQ头像URL，需要注意，不是所有的用户都拥有QQ的100x100的头像，但40x40像素则是一定会有
 yellow_vip	是否是黄钻用户，0表示没有黄钻
 yellow_vip_level	黄钻等级
 yellow_year_vip	是否是年费黄钻用户，0表示否
 is_lost	is_lost为1的时候表示获取的数据做了降级处理：此时业务层有缓存数据时，可以先用缓存数据；如果没有的话，再使用当前的数据。并且该标志打上1时，不要对这个数据进行缓存。

 2.3.1.4 接口调用说明
 url	http://msdktest.qq.com/relation/qqprofile/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.3.1.5 请求示例
 POST
 /relation/qqprofile/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "appid": 100703379,
 "accessToken": "FCCDE5C8CDAD70A9A0E229C367E03178",
 "openid": "69FF99F3B17436F2F6621FA158B30549"
 }
 2.3.1.6 返回格式示例
 {
 "ret": 0,
 "msg": "success",
 "nickName": "憨特",
 "gender": "男",
 "picture40": "http://q.qlogo.cn/qqapp/100703379/A3284A812ECA15269F85AE1C2D94EB37/40",
 "picture100": "http://q.qlogo.cn/qqapp/100703379/A3284A812ECA15269F85AE1C2D94EB37/100",
 "yellow_vip": 0,
 "yellow_vip_level": 0,
 "yellow_year_vip": 0,
 "is_lost": "0"
 }
 */
Handler.qqprofile = function (openID, token, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/relation/qqprofile/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID,
        "accessToken": token
    };

    return this.requestWrapper(params, data, callback);
};

/**
 * 2.3.3/relation/qqstrange_profile
 2.3.3.1接口说明
 获取同玩陌生人（包括好友）个人信息。
 PS：1.此接口目前仅供开发了“附近的人”等功能的游戏使用
 2. 即需要先在客户端获取到同玩陌生人openid列表才能调用此接口
 2.3.3.2输入参数说明
 参数名称	类型	描述
 appid	string 	应用在QQ平台的唯一id
 accessToken	string	当前用户登录票据
 openid	string	用户在某个应用的唯一标识
 vcopenid	vector<string>	需要查询的同玩陌生人（包括好友）的openid列表，如：
 vcopenid:[“${openid}”,”${openid1}”]
 （请注意输入参数的类型，参考1.5）

 2.3.3.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 lists	QQ同玩陌生人（包括好友）个人信息信息列表，类型vector< QQStrangeList>
 struct QQStrangeList {
 string          openid;          //openid
 string          gender;          //性别 "1"
 string          nickName;        //昵称
 string          qzonepicture50;  //用户头像大小为50×50像素的好友QQ空间头像URL
 string          qqpicture40;     //用户头像大小为40×40像素的好友QQ头像URL
 string          qqpicture100;    //用户头像大小为100×100像素的好友QQ头像URL
 string          qqpicture;       //用户头像大小为自适应像素的好友QQ头像URL，必须在URL后追加以下参数/40，/100这样可以分别获得不同规格的图片：40*40(/40)、100*100(/100)
 };
 is_lost	is_lost为1的时候表示获取的数据做了降级处理：此时业务层有缓存数据时，可以先用缓存数据；如果没有的话，再使用当前的数据。并且该标志打上1时，不要对这个数据进行缓存。

 2.3.3.4 接口调用说明
 url	http://msdktest.qq.com/relation/qqstrange_profile/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.3.3.5 请求示例
 POST
 /relation/qqstrange_profile/?timestamp=1381288134&appid=100703379&sig=3f308f92212f75cd8d682215cb3fa852&openid=F4382318AFBBD94F856E8%2066043C3472E&encode=1
 POST data:
 {
 "appid": 100732256,
 "openid": "B9EEA5EE1E99694146AC2700BFE6B88B",
 "accessToken": "C9A1F622B7B4AAC48D0AF3F73B1A3D83",
 "vcopenid": [
 "B9EEA5EE1E99694146AC2700BFE6B88B"
 ]
 }
 2.3.3.6 返回格式示例
 {
 "ret": 0,
 "msg": "success",
 "lists": [
 {
 "openid": "B9EEA5EE1E99694146AC2700BFE6B88B",
 "gender": "1",
 "nickName": "/xu゛♥快到碗里来இ",
 "qzonepicture50": "http://thirdapp1.qlogo.cn/qzopenapp/aff242e95d20fb902bedd93bb1dcd4c01ed5dc2a14b37510a81685c74529ab1e/50",
 "qqpicture40": "http://q.qlogo.cn/qqapp/100732256/B9EEA5EE1E99694146AC2700BFE6B88B/40",
 "qqpicture100": "http://q.qlogo.cn/qqapp/100732256/B9EEA5EE1E99694146AC2700BFE6B88B/100",
 "qqpicture": "http://q.qlogo.cn/qqapp/100732256/B9EEA5EE1E99694146AC2700BFE6B88B"
 }
 ],
 "is_lost": "0"
 }
 */
Handler.qqstrange_profile = function (openID, token, vcOpenIds, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/relation/qqstrange_profile/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "accessToken": token,
        "openid": openID,
        "vcopenid": vcOpenIds
    };

    return this.requestWrapper(params, data, callback);
};

/**
 * 2.3.8 /relation/get_vip_rich_info
 2.3.8.1接口说明
 　　　查询手Q会员详细信息（充值时间&到期时间）

 2.3.8.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在平台的唯一id
 openid	string	用户在某个应用的唯一标识
 accessToken	string	第三方调用凭证，通过获取凭证接口获得
 （请注意输入参数的类型，参考1.5）

 2.3.8.3输出参数说明
 参数名称	描述
 ret	返回码 0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 is_lost	判断是否有数据丢失。如果应用不使用cache，不需要关心此参数。0或者不返回：没有数据丢失，可以缓存。1：有部分数据丢失或错误，不要缓存。
 is_qq_vip	标识是否QQ会员（0：不是； 1：是）
 qq_vip_start	QQ会员最后一次充值时间，标准时间戳
 qq_vip_end	QQ会员期限，标准时间戳
 qq_year_vip_start	QQ年费会员最后一次充值时间，标准时间戳
 qq_year_vip_end	QQ SVIP最后一次充值时间，预留字段，当前信息无效，标准时间戳
 qq_svip_end	QQ SVIP期限，预留字段，当前信息无效，标准时间戳
 is_qq_year_vip	标识是否QQ年费会员（0：不是； 1：是）
 is_svip	标识是否QQ超级会员（0：不是； 1：是）
 2.3.8.4 接口调用说明
 参数名称	描述
 url	http://msdktest.qq.com/relation/get_vip_rich_info/
 URI	?timestamp=&appid=&sig=&openid=&encode=1
 格式	JSON
 请求方式	POST
 2.3.8.5 请求示例
 POST http://msdktest.qq.com/relation/get_vip_rich_info/?timestamp=1381288134&appid=100703379&sig=3f308f92212f75cd8d682215cb3fa8**&openid=F4382318AFBBD94F856E866043C3472E&encode=1

 {
     "appid": "100703379",
     "accessToken": "E16A9965C446956D89303747C632C27B",
     "openid": "F4382318AFBBD94F856E866043C3472E"
 }

 //返回结果
 {
     "is_lost": "0",
     "is_qq_vip": "0",
     "msg": "success",
     "qq_svip_end": "0",
     "qq_svip_start": "0",
     "qq_vip_end": "0",
     "qq_vip_start": "0",
     "qq_year_vip_end": "0",
     "qq_year_vip_start": "0",
     "ret": 0,
     "is_qq_year_vip":"1",
     "is_svip":"1"
 }

 *
 * @param openID
 * @param token
 * @param vcOpenIds
 * @param callback
 * @returns {*}
 */
Handler.get_vip_rich_info = function (openID, token, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/relation/get_vip_rich_info/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
            makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "accessToken": token,
        "openid": openID
    };

    return this.requestWrapper(params, data, callback);
};

/**
 * 2.4.1 /profile/load_vip
 2.4.1.1接口说明
 获取QQ账号VIP信息。
 2.4.1.2输入参数说明
 参数名称	类型	描述
 appid	int	应用在QQ平台的唯一id
 login	int	登录类型，默认填2
 uin	int	用户标识,如使用openid帐号体系则默认填0
 openid	string	用户在某个应用的唯一标识
 vip	int	查询类型:(1会员；4蓝钻；8红钻；16超级会员;32游戏会员；以上可任意组合，如需同时查询会员和蓝钻则输入5，如需同时查询蓝钻和红钻则输入12，如果三种都要查询则输入13).
 （请注意输入参数的类型，参考1.5）

 2.4.1.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 lists	信息列表vector<VIP> 类型
 struct VIP {
 VIPFlag :flag; //什么类型VIP
 int isvip; //是否VIP(判断用户VIP状态的唯一标识，0否，1是)
 int year; //是否年费(0否，1是)
 int level; //VIP等级(0否，1是)
 int luxury; //是否豪华版(0否，1是)
 int ispay;//是否是游戏会员,仅当查询游戏会员的时候有效
 };
 enum VIPFlag
 {
 VIP_NORMAL(会员) = 1
 VIP_BLUE（蓝钻） = 4,
 VIP_RED （红钻）= 8,
 VIP_SUPER (超级会员)= 16,
 VIP_GAME(游戏会员)=32,
 VIP_XINYUE = 64,
 //心悦俱乐部特权会员，该标志位请求时只有isvip有效
 VIP_YELLOW = 128,
 //黄钻会员，level字段无效，其它有效
 };
 获取超级会员的时候，struct VIP中，只有isvip和flag参数有效.

 2.4.1.4 接口调用说明
 url	http://msdktest.qq.com/profile/load_vip/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.4.1.5 请求示例
 POST
 / profile/load_vip/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "appid": 100703379,
 "login": 2,
 "uin": 0,
 "openid": "A3284A812ECA15269F85AE1C2D94EB37",
 "vip": 13
 }
 2.4.1.6 返回格式示例
 {
 "ret": 0,
 "msg": "",
 "lists": [{
 "flag": 1,
 "year": 0,
 "level": 0,
 "luxury": 0,
 "ispay": 0,
 "isvip": 0
 },
 {
 "flag": 4,
 "year": 0,
 "level": 0,
 "luxury": 0,
 "ispay": 0,
 "isvip": 0
 },
 {
 "flag": 8,
 "year": 0,
 "level": 0,
 "luxury": 0,
 "ispay": 0,
 "isvip": 0
 }]
 }
 */
Handler.load_vip = function (openID, token, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/profile/load_vip/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "login": 2,
        "vip": 255,
        "openid": openID,
        "accessToken": token
    };

    return this.requestWrapper(params, data, callback);
};

/**
 *2.4.2 /profile/query_vip（可联调，未发布）
 获取QQ账号VIP信息(带登录态)。

 2.4.2.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在平台的唯一id
 openid	string	用户在某个应用的唯一标识
 accessToken	string	用户登录态（新增参数）
 vip	int	查询类型:
 会员:vip&0x01 !=0；
 QQ等级:vip&0x02 !=0；
 蓝钻:vip&0x04 != 0；
 红钻:vip&0x08 != 0；
 超级会员:vip&0x10 != 0;
 心悦:vip&0x40 != 0；
 黄钻::vip&0x80 != 0；
 以上可任意组合(逻辑与)，如需同时查询会员和蓝钻则(vip&0x01 !=0) && (vip&0x04 != 0) 为真,(备注：请求时请只填相关的标识位)
 （请注意输入参数的类型，参考1.5）

 2.4.2.3输出参数说明
 参数名称	描述
 ret	返回码 0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 list	信息列表vector 类型（见下文），获取超级会员的时候，struct VIP中，只有isvip和flag参数有效.
 struct VIP {
　　VIPFlag :flag; //什么类型VIP
　　int isvip; //是否VIP(判断用户VIP状态的唯一标识，0否，1是)
　　int year; //是否年费(0否，1是)
　　int level; //VIP等级
　　int luxury; //是否豪华版(0否，1是)
};
 enum VIPFlag
 {
 　　VIP_NORMAL(会员) = 1,
   VIP_QQ_LEVEL(QQ等级) = 2,  //QQ等级，只需要关注level参数，其它无效
 　　VIP_BLUE（蓝钻） = 4,
 　　VIP_RED （红钻）= 8, //红钻没有年费会员标识返回
 　　VIP_SUPER (超级会员)= 16,
 　　VIP_XINYUE = 64,  //心悦俱乐部特权会员，该标志位请求时只有isvip及level有效
 　　VIP_YELLOW = 128,
 };
 2.4.2.4 接口调用说明
 参数名称	描述
 url	http://msdktest.qq.com/profile/query_vip/
 URI	?timestamp=&appid=&sig=&openid=&encode=1
 格式	JSON
 请求方式	POST
 2.4.2.5 请求示例
 POST /profile/query_vip/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
     "appid": "100703379",
     "openid": "A3284A812ECA15269F85AE1C2D94EB37",
     "vip": 15,
     "accessToken":"A3284A812ECA15A3284A812ECA15269F85AE1C2D94EB37269F85AE1C2D94EB37"
 }
 //返回格式
 {
     "ret": 0,
     "msg": "",
     "lists": [{
         "flag": 1,
         "year": 0,
         "level": 0,
         "luxury": 0,
         "isvip": 0
     },{
         "flag": 2,
         "year": 0,
         "level": 10,
         "luxury": 0,
         "isvip": 1
     },
     {
         "flag": 4,
         "year": 0,
         "level": 0,
         "luxury": 0,
         "isvip": 0
     },
     {
         "flag": 8,
         "year": 0,
         "level": 0,
         "luxury": 0,
         "isvip": 0
     }]
 }
 *
 * @param openID
 * @param token
 * @param callback
 * @returns {*}
 */
Handler.query_vip = function (openID, token, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/profile/query_vip/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
            makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID,
        "accessToken": token,
        "vip": 255
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *2.4.2 /relation/qqfriends_vip
 2.4.2.1接口说明
 批量查询QQ会员信息。

 2.4.2.2输入参数说明
 参数名称	类型	描述
 appid	string	用户在应用的唯一标识
 openid	string	玩家在当前应用的唯一标识
 accessToken	string	用户在应用中的登录凭据
 fopenids	vector<string>	好友openid列表，每次最多可输入50个
 flags	string	VIP业务查询标识。目前只支持查询QQ会员信息：qq_vip。后期会支持更多业务的用户VIP信息查询。如果要查询多种VIP业务，通过“,”分隔。如果不输入该值，默认为全部查询。
 userip	string	调用方ip信息
 pf	string	玩家登录平台，默认openmobile，有openmobile_android/openmobile_ios/openmobile_wp等，该值来自客户端手Q登录返回
 （请注意输入参数的类型，参考1.5）

 2.4.2.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 lists	类型：vector<QQFriendsVipInfo>,QQ游戏好友vip信息列表
 struct QQFriendsVipInfo {
 1   optional     string          openid;          //好友openid
 2   optional     int             is_qq_vip;       //是否为QQ会员（0：不是； 1：是）
 3   optional     int             qq_vip_level;    //QQ会员等级（如果是QQ会员才返回此字段）
 4   optional     int             is_qq_year_vip;  //是否为年费QQ会员（0：不是； 1：是）
 };
 is_lost	is_lost为1时表示oidb获取数据超时，建议游戏业务检测到is_lost为1时做降级处理，直接读取缓存数据或默认数据

 2.4.2.4 接口调用说明
 url	http://msdktest.qq.com/relation/qqfriends_vip/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.4.2.5 请求示例
 POST
 /relation/qqfriends_vip/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "appid": "100703379",
 "openid": "A3284A812ECA15269F85AE1C2D94EB37",
 "accessToken": "964EE8FACFA24AE88AEEEEBD84028E19",
 "fopenids": [
 "69FF99F3B17436F2F6621FA158B30549"
 ],
 "flags": "qq_vip",
 "pf": "openmobile",
 "userip": "127.0.0.1"
 }
 2.4.2.6 返回格式示例
 {
 "is_lost": "0",
 "lists": [
 {
 "is_qq_vip": 1,
 "is_qq_year_vip": 1,
 "openid": "69FF99F3B17436F2F6621FA158B30549",
 "qq_vip_level": 6
 }
 ],
 "msg": "success",
 "ret": 0
 }
 */
Handler.qqfriends_vip = function (openID, token, fOpenIds, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/relation/qqfriends_vip/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID,
        "accessToken": token,
        "fopenids": fOpenIds,
        "flags": flags,
        "userip": userip,
        "pf": pf
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 2.4.3 /profile/get_gift
 2.4.3.1接口说明
 领取蓝钻礼包，调用一次过后就清空了礼包。

 2.4.3.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在QQ平台的唯一id
 openid	string	用户在某个应用的唯一标识

 2.4.3.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 GiftPackList	vector<GiftPackInfo> 类型
 struct GiftPackInfo
 {
 string     giftId;                 //礼包id
 string     giftCount;              //对应礼包个数
 };

 2.4.3.4 接口调用说明
 url	http://msdktest.qq.com/profile/get_gift/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.4.3.5 请求示例
 POST http://msdktest.qq.com/profile/get_gift/?timestamp=1381288134&appid=100703379&sig=3f308f92212f75cd8d682215cb3fa852&openid=F4382318AFBBD94F856E866043C3472E&encode=1

 POST data:
 {
 "appid": "100703379",
 "openid": "A3284A812ECA15269F85AE1C2D94EB37"
 }
 2.4.3.6 返回格式示例
 {
 "GiftPackList": [
 {
 "giftCount": "1",
 "giftId": "1001"
 }
 ],
 "msdkExtInfo": "testhunter",
 "msg": "success",
 "ret": 0
 }
 */
Handler.get_gift = function (openID, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/profile/get_gift/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 2.4.4 /profile/qqscore
 2.4.4.1接口说明
 上报玩家成就到QQ平台，在QQ游戏中心显示好友分数排行。（实时生效）
 2.4.4.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在QQ平台的唯一id
 accessToken	string	第三方调用凭证，通过获取凭证接口获得
 openid	string	用户在某个应用的唯一标识
 data	string	成就值,与type对应
 type	int	1:LEVEL（等级）
 3:SCORE（得分）
 bcover	int	1：表示覆盖上报，本次上报会覆盖以前的数据。
 0：表示增量上报，只会记录比上一次更高的数据。
 expires	string	超时时间，unix时间戳，单位s，表示哪个时间点数据过期，0时标识永不超时，不传递则默认为0
 （请注意输入参数的类型，参考1.5）
 2.4.4.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 type	上报类型,与输入参数的type值对应

 2.4.4.4 接口调用说明
 url	http://msdktest.qq.com/profile/qqscore/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.4.4.5 请求示例
 POST http://msdktest.qq.com/profile/qqscore/?timestamp=1381288134&appid=100703379&sig=3f308f92212f75cd8d682215cb3fa852&openid=F4382318AFBBD94F856E866043C3472E&encode=1

 POST data:
 {"appid":"100703379","accessToken":"964EE8FACFA24AE88AEEEEBD84028E19","openid":"A3284A812ECA15269F85AE1C2D94EB37","data":"100000","type":3,"bcover":1,"expires":"12345975"}

 2.4.4.6 返回格式示例
 {"msg":"success","ret":0,"type":0}
 */
Handler.qqscore = function (openID, token, score, type, bcover, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/profile/qqscore/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "accessToken": token,
        "openid": openID,
        "data": '' + score,
        "type": type,
        "bcover": bcover,
        "expires": 0
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 2.4.5 /profile/get_wifi
 2.4.5.1接口说明
 获取随身wifi的资格。
 2.4.5.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在QQ平台的唯一id
 openid	string	用户在某个应用的唯一标识

 2.4.5.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 wifiVip	1:表示是wifivip资格，0:表示非wifivip资格

 2.4.5.4 接口调用说明
 url	http://msdktest.qq.com/profile/get_wifi/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.4.5.5 请求示例
 POST http://msdktest.qq.com/profile/get_wifi/?timestamp=1381288134&appid=100703379&sig=3f308f92212f75cd8d682215cb3fa852&openid=F4382318AFBBD94F856E866043C3472E&encode=1

 POST data:
 {
 "appid": "100703379",
 "openid": "A3284A812ECA15269F85AE1C2D94EB37"
 }

 2.4.5.6 返回格式示例
 {
 "msg": "success",
 "ret": 0,
 "wifiVip": 1
 }
 */
Handler.get_wifi = function (openID, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/profile/get_wifi/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 2.4.6 /profile/qqscore_batch
 2.4.6.1接口说明
 上报玩家成就到QQ平台，在QQ游戏中心显示好友分数排行。（实时生效）
 2.4.6.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在QQ平台的唯一id
 accessToken	string	第三方调用凭证，通过获取凭证接口获得
 openid	string	用户在某个应用的唯一标识
 param	Vector<ReportParam>	struct ReportParam
 {
 0   optional     int             type;
 1   optional     string          data;
 2   optional     string          expires;
 3   optional     int             bcover;
 };
 type:1:LEVEL（等级），2:MONEY（金钱）, 3:SCORE（得分）, 4:EXP（经验）, 5:HST_SCORE(历史最高分)，6:PRE_WEEK_FINAL_RANK(上周数据结算排名,注意结算数据应该在下次结算前过期，否则拉取到过期数据)， 7：CHALLENGE_SCORE（pk流水数据，登录时不报，每一局都报） 传对应数字,一一对应，千万不要传错
 data:成就值
 expireds:超时时间，unix时间戳，单位s，表示哪个时间点数据过期，0时标识永不超时，不传递则默认为0
 bcover:1表示覆盖上报，本次上报会覆盖以前的数据，不传递或者传递其它值表示增量上报，只会记录比上一次更高的数据
 （请注意输入参数的类型，参考1.5）
 2.4.6.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节

 2.4.6.4 接口调用说明
 url	http://msdktest.qq.com/profile/qqscore_batch/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 2.4.6.5 请求示例
 POST http://msdktest.qq.com/profile/qqscore_batch/?timestamp=1381288134&appid=100703379&sig=3f308f92212f75cd8d682215cb3fa852&openid=F4382318AFBBD94F856E866043C3472E&encode=1

 POST data:
 {
 "appid": "100703379",
 "accessToken": "E16A9965C446956D89303747C632C27B",
 "openid": "A3284A812ECA15269F85AE1C2D94EB37",
 "param": [
 {
 "type": 3,
 "bcover": 1,
 "data": "999",
 "expires": "123459751"
 },
 {
 "type": 2,
 "bcover": 1,
 "data": "1999",
 "expires": "123459751"
 }
 ]
 }

 2.4.6.6 返回格式示例
 {"msg":"success","ret":0,"type":0}
 */
Handler.qqscore_batch = function (openID, callback) {
    var time = Math.floor((new Date()).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.msdkOauth.hostUrl,
        path: '/profile/qqscore_batch/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.msdkOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.msdkOauth.appid,
        "openid": openID
    };

    return this.requestWrapper(params, data, callback);
};
