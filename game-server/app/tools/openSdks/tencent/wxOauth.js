/**
 * Created by kazi on 2014/6/4.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('tencent-oauth', __filename);
var utils = require('./../../utils');
var config = require('./../../config');
var urlencode = require('urlencode');
var md5 = require('md5');
var request = require('request');
var util = require('util');
var Q = require('q');


//var openID = '87FE6F42489F43C6BB1B336B707C236C';
//var token = 'D324EE2F76A93EBEBEB0E5B47BD3CD50';

var Handler = module.exports;

var makeSig = function (time) {
    return md5.digest_s(config.vendors.wxOauth.appKey + time);
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
 * 3.1.1 /auth/refresh_token
 3.1.1.1接口说明
 由于access_token拥有较短的有效期(2小时)，当access_token超时后，可以使用refresh_token进行刷新，refresh_token拥有较长的有效期30天，refresh_token失效后，需要重新登录。
 url中带上msdkExtInfo=xxx（请求序列号），可以在后回内容中，将msdkExtInfo原数据带回来，即可实现纯异常请求。msdkExtInfo为可选参数。

 3.1.1.2输入参数说明
 参数名称	类型	描述
 appid	string	应用在微信平台中的唯一id
 refreshToken	string	填写通过前端登录获取到的refreshToken参数

 3.1.1.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 accessToken	接口调用凭证
 expiresIn	accessToken接口调用凭证过期时间，单位秒
 refreshToken	用户刷新accessToken用
 openid	普通用户唯一标识（微信平台）
 scope	用户授权的作用域，使用逗号（,）分隔，作用域详细信息见下表。
 作用域名称	作用	默认状态
 snsapi_friend	授权时默认不勾选	授权获取用户好友资料
 snsapi_message	授权时默认不勾选	授权获取用户发微信资格
 snsapi_userinfo	授权时默认勾选	授权获取用户个人资料


 3.1.1.4 接口调用说明
 url	http://msdktest.qq.com/auth (兼容wxoauth) /refresh_token/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.1.1.5 请求示例
 POST /auth/refresh_token/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "appid": "wxcde873f99466f74a",
 "refreshToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJPLafWudG-idTVMbKesBkhBO_ZxFWN4zlXCpCHpYcrXFXf2RE2ETF5F7lhiPkxA9ewAu90r3JLXpM1T4nfr9Iz184ZB0G7br72EfycDenriw"
 }
 3.1.1.6 返回格式示例
 {
 "ret": 0,
 "msg": "success",
 "accessToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2AnzoP_nZ6CrBdwZ3VEQcqDPNZ-wLIvK998t3s2ecEM4Q",
 "expiresIn": 7200,
 "refreshToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9D8IrNu9lm2w4XfMqS3j9OJgjv_8L1vvSkTjBt0q7X5foYiJOhVaNx6tDGzFkJw0vw",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "scope": "snsapi_friend,snsapi_message,snsapi_userinfo,"
 }
 */
Handler.refresh_token = function (openID, refreshToken, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/auth/refresh_token/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "appid": config.vendors.wxOauth.appid,
        "refreshToken": refreshToken
    };

    return this.requestWrapper(params, data, callback);
};

/*
 * 3.1.2 /auth/check_token
 3.1.2.1接口说明
 微信检验授权凭证(access_token)是否有效。
 url中带上msdkExtInfo=xxx（请求序列号），可以在后回内容中，将msdkExtInfo原数据带回来，即可实现纯异常请求。msdkExtInfo为可选参数。

 3.1.2.2输入参数说明
 参数名称	类型	描述
 accessToken	string	授权凭证
 openid	string	普通用户唯一标识（微信平台）

 3.1.2.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节

 3.1.2.4 接口调用说明
 url	http://msdktest.qq.com/ auth (兼容wxoauth)/check_token/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.1.2.5 请求示例
 POST
 /auth/check_token/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "accessToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJPLafWudG-idTVMbKesBkhBO_ZxFWN4zlXCpCHpYcrXNG6Vs-cocorhdT5Czj_23QF6D1qH8MCldg0BSMdEUnsaWcFH083zgWJcl_goeBUSQ",
 "openid": "oGRTijiaT-XrbyXKozckdNHFgPyc"
 }
 3.1.2.6 返回格式示例
 {"ret":0,"msg":"ok"}
 */
Handler.check_token = function (openID, token, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/auth/check_token/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "accessToken": token,
        "openid": openID
    };

    return this.requestWrapper(params, data, callback);
};

function rawurlencode(str) {
    //       discuss at: http://phpjs.org/functions/rawurlencode/
    //      original by: Brett Zamir (http://brett-zamir.me)
    //         input by: travc
    //         input by: Brett Zamir (http://brett-zamir.me)
    //         input by: Michael Grier
    //         input by: Ratheous
    //      bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //      bugfixed by: Brett Zamir (http://brett-zamir.me)
    //      bugfixed by: Joris
    // reimplemented by: Brett Zamir (http://brett-zamir.me)
    // reimplemented by: Brett Zamir (http://brett-zamir.me)
    //             note: This reflects PHP 5.3/6.0+ behavior
    //             note: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
    //             note: pages served as UTF-8
    //        example 1: rawurlencode('Kevin van Zonneveld!');
    //        returns 1: 'Kevin%20van%20Zonneveld%21'
    //        example 2: rawurlencode('http://kevin.vanzonneveld.net/');
    //        returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
    //        example 3: rawurlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
    //        returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'

    str = (str + '')
        .toString();

    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .
        replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

/*
 * 3.2.1/share/upload_wx
 3.2.1.1 接口说明
 上传图片到微信换取media_id，给/share/wx接口的输入参数thumb_media_id使用。（该接口不是用于用户分享图片的时，先上传图片再分享的场景，而是用户游戏管理人员上传预定图片获取thumb_media_id，再将thumb_media_id填入到/share/wx接口做分享）

 3.2.1.2 输入参数说明
 参数名称		类型	描述
 flag	int	默认填1，使用secret登录,
 appid	string	应用唯一标识，appid
 secret	string	填写appkey
 access_token	string	默认为空,上传图片成功以后，返回值中的acess_token,下次上传图片的时候，可以使用access_token
 type	string	媒体文件类型，默认为缩略图（thumb）
 filename	string	文件名称
 filelength	int	文件二进制流长度，以字节为单位
 content_type	string	文件类型，如：image/jpeg
 binary	string	文件的二进制流，用urlencode转码，例：
 $filename = 'b.jpg';
 $image = './image/'.$filename;
 $handle = fopen($image,'r');
 $filelength = filesize($image);//字节数
 $contents=fread($handle,filesize($image));
 $binary = rawurlencode($contents);
 Java中注意编码为：“ISO-8859-1”， 如URLEncoder.encode(new String(bs, "ISO-8859-1"), "ISO-8859-1");

 3.2.1.3 输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 type	媒体文件类型，现有缩略图（thumb）
 media_id	媒体文件上传后获取的唯一标识，此ID用于微信分享接口的参数
 created_at	媒体文件上传时间
 access_token	调用接口凭证
 expire	忽略此参数

 3.2.1.4 接口调用说明
 url	http://msdktest.qq.com/share/upload_wx/?
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.2.1.5 请求示例
 POST
 /share/upload_wx/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {"flag":1,"appid":"wx6f15c6c03a84433d","secret":"bf159627552fa6bc8473d492c5b3e06d","access_token":"","type":"thumb","filename":"b.jpg","filelength":65050,"content_type":"image\/jpeg","binary":"%FF%D8%FF%E0%00%10JFIF%00%01%01%01%00%60%00%60%00%00%FF%DB%00C%00%03%02%02%03%02%02%03%03%03%03%04%03%03%04%05%08%05%05%04%04%05%0A%07%07%06%08%0C%0A%0C%0C%0B%0A%0B%0B%0D%0E%12%10%0D%0E%11%0E%0B%0B%10%16%10%11%13%14%15%15%15%0C%0F%17%18%16%14%18%12%14%15%14%FF%DB%00C%01%03%04%04%05%04%05%09%05%05%09%14%0D%0B%0D%14%14%14%...."}

 3.2.1.6 返回格式示例
 {
 "ret": 0,
 "msg": "success",
 "type": "thumb",
 "media_id": "CAUmtmwCq6jSGWaypYRzJRpErL-vUZj8UPeU8UupzyMFGGpmOnkeUDGLLI9RiTqN",
 "created_at": "1379579554",
 "access_token": "avl-4_K9aZ7MY88Tb-FKfCt3LNvsFkkCXGErRmX7tn19iqw0p45nGjB76tdRfhfi-7oWAQr8ZbvwC1EuWx_f8m5-A0kNNhEC7HAaePUokAtb6xGgRGyyAkoftjlk42sp4OSVJCgkuwWvithft4a00Q",
 "expire": ’’
 }
 */
Handler.upload_wx = function (openID, filename, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/share/upload_wx/',
//        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
//                         makeSig(time), openID)
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time))
    };

    var fs = require('fs');

    var stats = fs.statSync(filename);

    var content = fs.readFileSync(filename);

//    logger.warn('content : %j', urlencode([255,216,255,225,0,24,69,120,105,102]));

//    content = content.join('');
//
//    logger.warn('stats : %j', stats);
//    logger.warn('content : %j', content);
//    logger.warn('content : %j', content.toString());
//    logger.warn('content : %j', urlencode(content));
//    logger.warn('content : %j', rawurlencode(content));

    var data = {
        "flag": 1,
        "appid": config.vendors.wxOauth.appid,
        "secret": config.vendors.wxOauth.appKey,
        "access_token": "",
        "type": "thumb",
        "filename": "Logo.jpg",
        "filelength": stats.size,
//        "filelength": 60,
        "content_type": "image/jpeg",
//        "binary": "%FF%D8%FF%E0%00%10JFIF%00%01%01%01%00%60%00%60%00%00%FF%DB%00C%00%03%02%02%03%02%02%03%03%03%03%04%03%03%04%05%08%05%05%04%04%05%0A%07%07%06%08%0C%0A%0C%0C%0B%0A%0B%0B%0D%0E%12%10%0D%0E%11%0E%0B%0B%10%16%10%11%13%14%15%15%15%0C%0F%17%18%16%14%18%12%14%15%14%FF%DB%00C%01%03%04%04%05%04%05%09%05%05%09%14%0D%0B%0D%14%14%14%"
//        "binary": content
        "binary": rawurlencode(content)
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *3.2.2/share/wx
 3.2.2.1接口说明
 将分享消息发送给微信好友（只能发送给安装了相同游戏的好友）。

 3.2.2.2输入参数说明
 参数名称	类型	描述
 openid	string	用户在微信平台的标识
 fopenid	string	分享到的好友openid
 access_token	string	调用接口凭证
 extinfo	string	第三方程序自定义简单数据，微信会回传给第三方程序处理，长度限制2k, 客户端点击的时候可以获取到这个字段。
 title	string	应用消息标题
 description	string	应用消息描述
 media_tag_name	string	区分游戏消息类型，用于数据统计
 thumb_media_id	string	media_id 通过/share/upload_wx接口获取

 3.2.2.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节

 3.2.2.4 接口调用说明
 url	http://msdktest.qq.com/share/wx/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.2.2.5 请求示例
 POST
 /share/wx/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "fopenid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "access_token": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2BZMgzJc8KWgXT8uGw242GeNigmf9VQCouPmZ9ciBE4MA",
 "extinfo": "extinfo",
 "title": "to myself",
 "description": "test by hunter",
 "media_tag_name": "media_tag_name",
 "thumb_media_id": ""
 }
 3.2.2.6 返回格式示例
 {"ret":0,"msg":"success"}
 */
Handler.wx = function (openID, token, fopenid, extinfo, title, description, media_tag_name, thumb_media_id, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/share/wx/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "access_token": token,
        "openid": openID,
        "fopenid": fopenid,
        "extinfo": extinfo,
        "title": title,
        "description": description,
        "media_tag_name": media_tag_name,
        "thumb_media_id": thumb_media_id
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *3.2.3/share/wxgame
 3.2.3.1接口说明
 将消息发送给授权同一开发者账号的好友，消息将在游戏中心呈现。
 消息分为展示模块（支持文本、图片、视频和链接）和按钮模块（支持拉起游戏、打开
 排名版和打开链接）。通过接口请求即可构造消息请求。

 3.2.3.2输入参数说明
 参数名称	类型	描述
 openid	string	用户在微信平台的标识
 appid	string	应用id
 access_token	string	调用接口凭证
 touser	string	接收方openid
 msgtype	string	消息类型，目前支持text（文本）、image（图片）、video（视频）和link（链接）
 title	string	应用消息标题
 content	string	消息内容，对应text,image,video,link的内容
 type_info	struct	类型参数
 button	struct	按钮效果
 请求示例中的参数说明：


 3.2.3.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节

 3.2.3.4 接口调用说明
 url	http://msdktest.qq.com/share/wxgame/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.2.3.5 请求示例
 POST
 /share/wxgame/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 //发送文本类型消息，按钮为跳转排行版
 {
 "access_token": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2B9F0OYlWIOzWjd_GdcKvIZX4PQn0Qs651yNntCvTeIUg",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "appid": "wxd477edab60670232",
 "touser": "OPENID",
 "msgtype": "text",
 "title": "TITLE",
 "content": "CONTENT",
 "button": {
 "type": "rank",
 "name": "BUTTON_NAME",
 "rankview": {
 "title": "RANK_TITLE",
 "button_name": "LAUNCH_GAME",
 "message_ext": "MESSAGE_EXT"
 }
 }
 }
 //发送图片类型消息，按钮为跳转排行版
 {
 "access_token": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2B9F0OYlWIOzWjd_GdcKvIZX4PQn0Qs651yNntCvTeIUg",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "appid": "wxd477edab60670232",
 "touser": "OPENID",
 "msgtype": "image",
 "title": "TITLE",
 "content": "CONTENT",
 "type_info": {
 "picurl": "PICURL",
 "width": 180,
 "height": 180
 },
 "button": {
 "type": "rank",
 "name": "BUTTON_NAME",
 "rankview": {
 "title": "RANK_TITLE",
 "button_name": "LAUNCH_GAME",
 "message_ext": "MESSAGE_EXT"
 }
 }
 }
 //发送视频类型消息，按钮为打开链接
 {
 "access_token": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2B9F0OYlWIOzWjd_GdcKvIZX4PQn0Qs651yNntCvTeIUg",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "appid": "wxd477edab60670232",
 "touser": "OPENID",
 "msgtype": "video",
 "title": "TITLE",
 "content": "CONTENT",
 "type_info": {
 "picurl": "PICURL",
 "width": 300,
 "height": 300,
 "mediaurl": "http://v.youku.com/v_show/id_XNjc0NTA4MzM2.html?f=21949327&ev=2"
 },
 "button": {
 "type": "web",
 "name": "BUTTON_NAME",
 "webview": {
 "url": "http://www.qq.com/"
 }
 }
 }
 //发送链接类型消息，按钮为打开游戏
 {
 "access_token": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2B9F0OYlWIOzWjd_GdcKvIZX4PQn0Qs651yNntCvTeIUg",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "appid": "wxd477edab60670232",
 "touser": "ocfbNjkN8WfPRFlTx4cLU-jNiXKU",
 "msgtype": "link",
 "title": "优酷的一条链接",
 "content": "这是一个屌炸天的链接",
 "type_info": {
 "url": "http://www.youku.com/",
 "iconurl": "http://tp4.sinaimg.cn/1949746771/180/5635873654/1"
 },
 "button": {
 "type": "app",
 "name": "启动",
 "app": {
 "message_ext": "ext"
 }
 }
 }
 3.2.3.6 返回格式示例
 {"ret":0,"msg":"success"}
 */
Handler.wxgame = function (openID, token, touser, title, content, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/share/wxgame/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "access_token": token,
        "openid": openID,
        "appid": config.vendors.wxOauth.appid,
        "touser": touser,
        "msgtype": 'text',
        "title": title,
        "content": content,
        "type_info": 'type_info',
        "button": {
            "type": "rank",
            "name": "BUTTON_NAME",
            "rankview": {
                "title": "RANK_TITLE",
                "button_name": "LAUNCH_GAME",
                "message_ext": "MESSAGE_EXT"
            }
        }
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *3.3.1 /relation/wxfriends_profile
 3.3.1.1接口说明
 获取微信个人及同玩好友基本信息。
 PS：此接口是将/relation/wxprofile&/relation/wxfriends两个接口合并后的新接口，即只需请求一次即可拿到同玩好友的基本信息，不需要先获取到好友列表再去请求好友的个人信息。与合并前的接口共存，推荐使用此接口来获取同玩好友信息。

 3.3.1.2输入参数说明
 参数名称	类型	描述
 accessToken	string	当前用户登录票据
 openid	string	用户在某个应用的唯一标识

 3.3.1.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 lists	微信同玩好友个人信息列表，类型vector<WXInfo>
 struct WXInfo {
 string          nickName;       //昵称
 int             sex;            //性别1男2女
 string          picture;        //用户头像,规格有原始图片(/0)、132*132(/132)、96*96(/96)、64*64(/64)、46*46(/46)
 string          provice;        //省份
 string          city;           //城市
 string          openid;        //用户标识
 };
 privilege	用户特权信息，json 数组，如微信沃卡用户为（chinaunicom）只返回首位openid对应的沃卡信息，其后的openid无法获取到沃卡信息。
 country	国家
 language	语言

 3.3.1.4 接口调用说明
 url	http://msdktest.qq.com/relation/wxfriends_profile/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.3.1.5 请求示例
 POST
 /relation/wxfriends_profile/?timestamp=1380018062&appid=wxcde873f99466f74a&sig=dc5a6330d54682c88846b1294fbd5fde&openid=A3284A812E%20CA15269F85AE1C2D94EB37&encode=1
 POST data:
 {
 "accessToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2DJrEqoT5SW76pqG7N3Mh6ZI79VLoFSM7wdVpS4bz61Vg",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0"
 }
 3.3.1.6 返回格式示例
 {
 "country": "CN",
 "language": "zh_CN",
 "ret": 0,
 "msg": "success",
 "lists": [{
 "nickName": "ufo",
 "sex": 1,
 "picture": "http:\/\/wx.qlogo.cn\/mmhead\/LwcbhAmMnZBAqZyUkv1z3qJibczZRdrZRkTgcNnqKqovicmDxLmyffdQ",
 "provice": "",
 "city": "Shenzhen",
 "openid": "oy6-ljl-aYH1tl3L2clpVhhVXHtY"
 },
 {
 "nickName": "\u8054\u901atest",
 "sex": 2,
 "picture": "",
 "provice": "",
 "city": "",
 "openid": "oy6-ljtb1PKnNtRKlouJAj952hlg"
 },
 {
 "nickName": "ila",
 "sex": 2,
 "picture": "http:\/\/wx.qlogo.cn\/mmhead\/Q3auHgzwzM5wrVe0CbkibUDWDvJpgzt1W4QicbXF09SPo1rLO8Glff5Q",
 "provice": "",
 "city": "",
 "openid": "oy6-ljqJeurpVex1kyRAZl5blq3U"
 },
 {
 "nickName": "KDS\u9648\u5c0f\u4eae\u5f88\u5c4c\u4e1d",
 "sex": 1,
 "picture": "http:\/\/wx.qlogo.cn\/mmhead\/HS9jXWzBezdQrNojlmPvvQlwhGJcrN923nrJCSmv2rk",
 "provice": "",
 "city": "Yangpu",
 "openid": "oy6-ljrzoW6jjxS2jI2LHZvGdsqA"
 },
 {
 "nickName": "Lewis",
 "sex": 1,
 "picture": "http:\/\/wx.qlogo.cn\/mmhead\/zreQPiaCicYfReYeU0sicsc92cfBdMejRFsicXK1fZibP7aM",
 "provice": "",
 "city": "Po",
 "openid": "oy6-ljoHSdnupQFMgHNTWoqSXXVg"
 }],
 "privilege": []
 }
 */
Handler.wxfriends_profile = function (openID, token, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/relation/wxfriends_profile/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "accessToken": token,
        "openid": openID
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *3.3.2/relation/wxprofile
 3.3.2.1接口说明
 获取微信帐号个人基本资料。

 3.3.2.2输入参数说明
 参数名称	类型	描述
 accessToken	string	登录态
 openids	vector<string>	 vector<string>类型，需要拉取的openid账号列表(如果想获取当前登录用户的沃卡信息，请将用户openid放在首位，因为只有首位的openid才能获取到沃卡信息，其后的openid无法获取到沃卡信息。)

 3.3.2.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 lists	信息列表vector<WXInfo>类型
 struct WXInfo {
 string          nickName;       //昵称
 int             sex;           //性别1男2女,用户未填则默认1男
 string          picture;        //用户头像URL,必须在URL后追加以下参数/0，/132，/96，/64，这样可以分别获得不同规格的图片：
 原始图片(/0)、132*132(/132)、96*96(/96)、64*64(/64)、46*46(/46)
 string          provice;        //省份
 string          city;           //城市
 string          openid;        //用户标识
 string          country        //国家
 string          language      //语言
 };
 privilege	用户特权信息，json 数组，如微信沃卡用户为（chinaunicom）只返回首位openid对应的沃卡信息，其后的openid无法获取到沃卡信息。

 3.3.2.4 接口调用说明
 url	http://msdktest.qq.com/relation/wxprofile/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.3.2.5 请求示例
 POST
 /relation/wxprofile/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "accessToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2Ccq_dcbciAvC8frI3gYk5d2p6pDFy-bOqyPTNysUxOQg",
 "openids": ["oGRTijrV0l67hDGN7dstOl8CphN0", "oGRTijlTxQPrvr-H5-pgoZMhZgog"]
 }
 3.3.2.6 返回格式示例
 {
 "country": "CN",
 "language": "zh_CN",
 "lists": [
 {
 "city": "Shenzhen",
 "nickName": "憨特",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "picture": "http://wx.qlogo.cn/mmhead/RpIhxf6qwjeF1QA6YxVvE8El3ySJHWCJia63TePjLSIc",
 "provice": "",
 "sex": 1
 },
 {
 "city": "Zhongshan",
 "nickName": "WeGame测试",
 "openid": "oGRTijlTxQPrvr-H5-pgoZMhZgog",
 "picture": "",
 "provice": "",
 "sex": 2
 }
 ],
 "msg": "success",
 "privilege": [],
 "ret": 0
 }
 */
Handler.wxprofile = function (openID, token, openIds, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/relation/wxprofile/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "accessToken": token,
        "openids": openIds
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *3.3.3/relation/wxfriends
 3.3.3.1接口说明
 获取微信同玩好友的openid列表，获取列表后可用/relation/wxprofile接口批量查询好友基本信息。

 3.3.3.2输入参数说明
 参数名称	类型	描述
 openid	string	用户在应用的唯一标识
 accessToken	string	登录态

 3.3.3.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 openids	好友列表 vector<string>类型

 3.3.3.4 接口调用说明
 url	http://msdktest.qq.com/relation/wxfriends/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.3.3.5 请求示例
 POST
 /relation/wxfriends/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "openid": "oGRTijiaT-XrbyXKozckdNHFgPyc",
 "accessToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJPLafWudG-idTVMbKesBkhaKJhRmjhioMlDM_zBq_SxfYO2jdJKzAR6DSHL5-02O6oATRKHf57K-teO6bPsB1RHjH5Z0I1TzMn4DllSYrf3Q"
 }
 3.3.3.6 返回格式示例
 {
 "ret": 0,
 "msg": "success",
 "openids": ["oy6-ljtb1PKnNtRKlouJAj952hlg", "oy6-ljrzoW6jjxS2jI2LHZvGdsqA", "oy6-ljqJeurpVex1kyRAZl5blq3U", "oy6-ljoHSdnupQFMgHNTWoqSXXVg", "oy6-ljl-aYH1tl3L2clpVhhVXHtY"]
 }
 */
Handler.wxfriends = function (openID, token, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/relation/wxfriends/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "accessToken": token,
        "openid": openID
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *3.3.4/relation/wxuserinfo
 3.3.4.1接口说明
 获取微信的个人信息
 3.3.4.2输入参数说明
 参数名称	类型	描述
 openid	string	用户在应用的唯一标识
 accessToken	string	登录态
 appid	string	应用在微信平台的唯一ID

 3.3.4.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节
 nickname	昵称
 picture	用户头像URL,必须在URL后追加以下参数/0，/132，/96，/64，这样可以分别获得不同规格的图片：
 原始图片(/0)、132*132(/132)、96*96(/96)、64*64(/64)、46*46(/46)

 province	省份
 city	城市
 country	用户标识
 sex	性别1男2女,用户未填则默认1男,0表示未知
 unionid	用户统一标识。针对一个微信开放平台帐号下的应用，同一用户的unionid是唯一的。
 privilege	用户特权信息，json 数组，如微信沃卡用户为（chinaunicom）只返回首位openid对应的沃卡信息，其后的openid无法获取到沃卡信息。

 3.3.4.4 接口调用说明
 url	http://msdktest.qq.com/relation/wxuserinfo/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.3.4.5 请求示例
 POST
 /relation/wxuserinfo/?timestamp=*&appid=**&sig=***&openid=**&encode=1 HTTP/1.0
 Host:$domain
 Content-Type: application/x-www-form-urlencoded
 Content-Length: 198
 {
 "appid": "wxcde873f99466f74a",
 "openid": "oGRTijrV0l67hDGN7dstOl8CphN0",
 "accessToken": "OezXcEiiBSKSxW0eoylIeLl3C6OgXeyrDnhDI73sCBJYyBcXKXYWTlxU_BAMfu7Rzsr51Nu-CarhcPT6zYlD9FrWRzuA0ccQMgrTGqpao2C-TqXCXdT-DZ44iKkidglb5Q9jQbXnMPrSTck_DUdGMg"
 }
 3.3.4.6 返回格式示例
 {
 "city": "Shenzhen",
 "country": "CN",
 "msg": "success",
 "nickname": "憨特",
 "picture": "http://wx.qlogo.cn/mmopen/uQDECzzFUic3xMCxSqQwsgXZqgCB2MtscmicF20OGZiaKia6fMlqOLuGjlibiaUnVPk0GoGwkKWv2MIa8e4BSwXRHn7ia7zRn1bVz9E/0",
 "privilege": [],
 "province": "Guangdong",
 "ret": 0,
 "sex": "1",
 "unionid": "o1A_BjhwQHB2BUyasZ_Lb2rkkOpE"
 }
 */
Handler.wxuserinfo = function (openID, token, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/relation/wxuserinfo/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "accessToken": token,
        "openid": openID,
        "appid": config.vendors.wxOauth.appid
    };

    return this.requestWrapper(params, data, callback);
};

/*
 *3.4.1/profile/wxscore
 3.4.1.1接口说明
 上报玩家成就到微信平台，在微信游戏中心显示好友排行（立即生效）。

 3.4.1.2输入参数说明
 参数名称	类型	描述
 appid	string	所属业务appid
 grantType	string	授权类型，默认使用：“client_credential”
 openid	string	用户在应用的唯一标识
 score	string 	分数值
 expires	string	超时时间，unix时间戳，0时标识永不超时
 （请注意输入参数的类型，参考1.5）

 3.4.1.3输出参数说明
 参数名称	描述
 ret	返回码  0：正确，其它：失败
 msg	ret非0，则表示“错误码，错误提示”，详细注释参见第5节

 3.4.1.4 接口调用说明
 url	http://msdktest.qq.com/profile/wxscore/
 URI	?timestamp=**&appid=**&sig=**&openid=**&encode=1
 格式	JSON
 http请求方式	POST

 3.4.1.5 请求示例
 POST http://msdktest.qq.com/profile/wxscore/?timestamp=1380018062&appid=wxcde873f99466f74a&sig=dc5a6330d54682c88846b1294fbd5fde&openid=A3284A812E%20CA15269F85AE1C2D94EB37&encode=1

 POST data:
 {"appid":"wxcde873f99466f74a","grantType":"client_credential","openid":"oGRTijrV0l67hDGN7dstOl8CphN0","score":"1000000","expires":"12345612312"}
 3.4.1.6 返回格式示例
 {"msg":"success","ret":0}
 */
Handler.wxscore = function (openID, token, score, callback) {

    var time = Math.floor((new Date).getTime() / 1000);
    var params = {
        hostUrl: config.vendors.wxOauth.hostUrl,
        path: '/profile/wxscore/',
        uri: util.format('?timestamp=%s&appid=%s&sig=%s&openid=%s&encode=1', time, config.vendors.wxOauth.appid,
                         makeSig(time), openID)
    };

    var data = {
        "openid": openID,
        "appid": config.vendors.wxOauth.appid,
        "grantType": "client_credential",
        "score": '' + score,
        "expires": '' + 0
    };

    return this.requestWrapper(params, data, callback);
};
