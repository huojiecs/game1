/**
 * Created by xykong on 2015/2/9.
 */
var logger = require('pomelo/node_modules/pomelo-logger').getLogger('cmge', __filename);
var crypto = require('crypto');
var md5 = require('md5');
var util = require('util');
var Q = require('q');
var _ = require('underscore');
var urlencode = require('urlencode');
var config = require('./../../config');
var apiWrapper = require('./../common/apiWrapper');

var Handler               = module.exports;


/**
 * 中国手游SDK 客户端接入文档 EN V1.0.1
 * 3.3 LoginResult -登录成功后返回数据的包装类中的数据项。
 关于sign的验签说明：
 SDK客户端在用户成功登录成功后，会将上面所述数据通过接口回调的形式传给游戏的客
 户端， 游戏客户端拿到这些数据后，需要进行数据验签。 验签需要的 appkey秘钥在集成
 SDK前应该已经由SDK开发人员给予了CP。CP方的验签工作应该由CP方的服务器进行
 （因为 appkey 秘钥应该存储在服务器端）。CP服务器验签分为三步：
 （1）. 将 SDK客户端返回的userID,timestamp,和其存储的 appkey 通过&连接组成字
 符串 ： userID&timestamp&appkey （顺序不能变），然后进行MD5处理得到摘要原
 生字节数组。
 （2）. 对( 1）中得到的字节数组进行 BASE64_ENCODE，得到结果字符串，这个字
 符串就是签名信息。
 ( 3 ). 将( 2 ) 中得到的sign签名信息 与 SDK客户端返回的sign 进行匹配， 如果相同
 则验签通过，否则失败。
 public int userId; //唯一CMGE用户账号ID， 一个ID 对应 一个 账号名
 public String userName; //用户登录成功使用的唯一CMGE账号
 public int isVIP; //1为VIP用户，0为非VIP用户
 public int isNewAccount; //1为新用户，0为旧用户
 public String supportSmsPrices; //快充话费支付通道金额数
 public long timestamp; //服务器验证登录成功时的时间戳
 服务器返回的md5签名，参与签名的参数为userID,timestamp,appkey(SDK服务器和CP服务器协商的签名密钥) 并用&连接后进行md5的签名
 public String sign;
 * @param params
 * @returns {*}
 */
Handler.verify            = function (params) {
    var self = this;

    var appKey = "c0a0a898e55b0e0099d8c24dfa33022e";

//    var checkString = util.format('%s&%s&%s', params.userId, params.timestamp, config.vendors.cmge.appKey);
    var checkString = util.format('%s&%s&%s', params.userId, params.timestamp, appKey);

    var cryptoMd5 = crypto.createHash('md5');
    cryptoMd5.update(checkString);
    var newDigest = cryptoMd5.digest();

    logger.info('newDigest: %j', newDigest);

    var singSource = newDigest.toString('base64');

    logger.info('singSource: %j', singSource);

    return singSource == params.sign;
};

/**
 * CMGE-SDK-CP服务器数据说明V1.0.0
 修订记录：
 版本号    修订人    修订日期    修订描述
 1、
 1、
 1、
 1、



 规范概述
 本规范适用于CMGE-SDK 服务器与CP服务器通讯协议。
 规范技术要点
 本规范采用HTTP-POST的方式实现CMGE-SDK服务器与CP服务器之间的信息交互。
 规范数据协议

 同步订单结果
 SDK服务器在确认订单支付结果(包括订单支付成功或订单支付失败)时，向CP服务器发起HTTP请求。请求按标准和HTTP POST方式发起，并且会加上签名参数。CP在收到数据后，需要按要求验证签名是否正确，正确才能接收并进行后续的逻辑处理。

 请求地址
 由CP提供。
 请求方式
 POST
 请求参数说明
 参数名称    必填    数据类型    说明
 openId    是    Long    SDK的用户ID
 serverId    回传    String    回传CP的服务器ID
 serverName    回传    String    回传CP的服务器名称
 roleId    回传    String    回传CP的角色ID
 roleName    回传    String    回传CP的角色名称
 orderId    是    String    订单号
 orderStatus    是    String    订单状态. SUCCESS 表示成功
 payType    是    int    支付渠道类型，含义参考《支付渠道列表》
 payId    是    int    支付渠道ID，含义参考《支付渠道列表》
 payName    是    String    支付渠道名称，含义参考《支付渠道列表》
 amount    是    int    充值金额，单位：分，如要转换为对应币种的主单位，请除以100。
 currency    是    String    币种。RMB 人民币 NTD 新台币 USD 美元
 remark    否    String    备注
 callBackInfo    回传    String    回传CP的自定义参数
 payTime    是    Long    生成订单时间，格式yyyyMMddHHmmss
 paySUTime    是    Long    支付成功时间，格式yyyyMMddHHmmss
 sign    是    String    签名

 说明：
 1、    回传的字段是CP在调用SDK客户端时传入的参数，SDK服务器会把这些参数在回传给CP。
 2、获取请求参数可以直接使用request。例如Jsp代码中可以使用 request.getParameter("参数名称")来获取。
 响应内容
 成功收到数据，请响应字符串success。
 如果SDK服务器未收到success的响应，将会按一定的规则进行重试请求。


 支付渠道列表

 支付渠道ID    支付渠道类型    支付渠道名称
 3    1    移动充值卡
 6    1    联通充值卡
 13    2    支付宝
 14    3    财付通
 15    4    银联卡
 17    6    话费支付
 21    9    快捷支付
 22    11    微信支付



 数字签名
 为了保证数据传输过程中的数据真实性和完整性，我们需要对数据进行数字签名，在接收签名数据之后进行签名校验。
 数字签名有两个步骤，先按一定规则拼接要签名的原始串，再选择具体的算法和密钥计算出签名结果。

 签名原始串
 1、除sign字段外，所有参数(注意：可能包含协议中未列出参数)按照字段名的ascii码从小到大排序后使用QueryString的格式（即key1=value1&key2=value2…）拼接而成，空值不参与拼接，不参与签名组串。
 2、所有参数是指通信过程中实际出现的所有非空参数，即使是接口中无描述的字段，也需要参与签名组串。如同步订单结果接口中无test字段，如果SDK服务器请求时，test有值，test字段也得参与参与签名组串。
 3、签名原始串中，字段名和字段值都采用原始值，不进行URL Encode。
 4、请求参数可能会由于升级增加参数，请验证签名时注意允许这种情况。
 5、推荐拼接原始签名串时，不要代码写死有哪些字段，而是动态去读取所有request中的参数，然后按规则进行拼接。

 举例：
 签名原始串为：
 amount=100&callBackInfo=自定义参数。。。。&openId=495&orderId=1408290919239993242&orderStatus=SUCCESS&payId=13&payName=支付宝&paySUTime=20140829092124&payTime=20140829091923&payType=2&roleId=1010&roleName=cmge01&serverId=1010&serverName=cmge&key=1234567890
 签名后的串为
 sign:d9c6c7debcd633c35bb96025f3c15d22
 在计算出签名后，与SDK服务器传过来的签名进行比较，一至才认为是签名校验成功。

 签名算法
 目前暂只支持MD5签名
 MD5签名
 MD5 是一种摘要生成算法，通过在签名原始串后加上商户通信密钥的内容，进行MD5运算，形成的摘要字符串即为签名结果。为了方便比较，签名结果统一转换为大写字符。
 注意：签名时将字符串转化成字节流时指定的编码字符集应与参数input_charset一致。
 MD5签名计算公式：
 sign = Md5(原字符串&key=分配的密钥). toLowerCase
 如：
 签名原始串是：input_charset=GBK&partner=1900000109&total_fee=1
 密钥是：8934e7d15453e97507ef794cf7b0519d
 签名的结果为：
 sign=md5(input_charset=GBK&partner=1900000109&total_fee=1&key=8934e7d15453e97507ef794cf7b0519d)= 4c513cb879523ca9d717eea7819deb0c
 补单机制
 如果SDK服务器收到CP服务器的应答不是success或超时，SDK服务器认为通知失败，SDK服务器会通过一定的策略（如5分钟共6次）定期重新发起通知，尽可能提高通知的成功率，但SDK服务器不保证通知最终能成功。
 由于存在重新发送后台通知的情况，因此同样的通知可能会多次发送给CP服务器。CP服务器必须能够正确处理重复的通知。
 SDK服务器推荐的做法是，当收到通知进行处理时，首先检查对应业务数据的状态，判断该通知是否已经处理过，如果没有处理过再进行处理，如果处理过直接返回success。在对业务数据进行状态检查和处理之前，要采用数据锁进行并发控制，以避免函数重入造成的数据混乱。

 * @param params
 */
Handler.verifyPaymentSign = function (params) {
    var self = this;

    var appKey = "c0a0a898e55b0e0099d8c24dfa33022e";
    //var appKey = config.vendors.cmge.appKey;

    var sign = params.sign;
    delete params.sign;

    params = _.mapObject(params, function (value, key) {
        return urlencode.decode(value.replace(/\+/g, ' '));
    });

    var sortParams = apiWrapper.sortObjectByKey(params, false);

    var checkString = util.format('%s&key=%s', sortParams, appKey);

    logger.info('checkString: %j', checkString);

    var cryptoMd5 = crypto.createHash('md5');
    cryptoMd5.update(checkString, 'utf8');
    var newDigest = cryptoMd5.digest();

    var signSource = newDigest.toString('hex');

    logger.info('signSource: %j', signSource);
    logger.info('sign: %j', sign);

    return signSource == sign;
};