/**
 * The file timeExpression.js Create with WebStorm
 * @Author        henry gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/14 21:44:00
 * To change this template use File | Setting |File Template
 */
var Expression = require('./expression');

module.exports = function (experssions) {
    return new Handler(experssions);
};

/**
 * 时间函数解析
 *   //[*][*][*][1:40-2:50]
 //new Expression("[*,yyyy,yyyy-yyyy][*,mm,mm-mm][*,dd,dd-dd][*,h1-h2]");
 //时间表达式格式   [年][月][日][时间段];[年][月][日][时间段];....
 //用";"隔开并列的表达式, 每个"[]"里都可以用"*"表示不对该日期段进行限制,用","表示并列,用"-"表示从哪儿到哪儿
 //例[*][5,6,8-9][1,3,5,7][1-2:30,3:00-5:00]
 //表示5月6月,8月至9月,每月的1号3号5号,7号,在这些限定日期内的每日的1:00-2:30,3:00-5:00
 //例[*][*][1,3,5,7][*];[*][*][2,4,6,8][10-20:30]表示
 * */
var Handler = function (experssions) {
    this.experssions = experssions.trim();
    if (experssions.indexOf(";") == 0) {
        experssions = experssions.substring(0, experssions.length - 1);
    }
    var exarray = experssions.split(";");
    var expressionArray = new Array(exarray.length);
    for (var i = 0; i < exarray.length; i++) {
        expressionArray[i] = new Expression(exarray[i]);
    }
    this.expressions = expressionArray;
};

var handler = Handler.prototype;

/**
 * 帮助方法
 *
 * @return {string}
 * */
handler.getHelp = function () {
    var t = "时间表达式格式 为  [年][月][日][时间段];[年][月][日][时间段];....\r\n";
    t = t + "用\";\"隔开并列的表达式, 每个\"[]\"里都可以用\"*\"表示不对该日期段进行限制,用\",\"表示并列,用\"-\"表示从哪儿到哪儿\r\n";
    t = t + "例 [*][5,6,8-11][1,3,5,7][1-2:30,3:00-5:00]\r\n";
    t = t + "表示每5月,6月,8月至11月,每月的1号3号5号,7号,在这些限定日期内的每日的1:00-2:30,3:00-5:00\r\n";
    t = t + "例[*][*][1,3,5,7][*];[*][*][2,4,6,8][10-20:30]\r\n";
    t = t + "表示1号3号5号7号的任意时间和2号4号6号8号的10:00-20:30\r\n";
    return t;
};

/**
 * 验证是否是当前时间
 *
 * @return {boolean}
 * */
handler.isExpressionTime = function (time) {
    for (var i in this.expressions) {
        if (this.expressions[i].isValidateTime(time)) {
            return true;
        }
    }
    return false;
};

/**
 * 验证是否是当前时间
 *
 * @return {boolean}
 * */
handler.isExpressionDate = function (time) {
    for (var i in this.expressions) {
        if (this.expressions[i].isValidateDate(time)) {
            return true;
        }
    }
    return false;
};

/**
 * 验证是否是全年
 *
 * @return {boolean}
 * */
handler.isAllYear = function () {
    for (var i in this.expressions) {
        if (this.expressions[i].isAllYear()) {
            return true;
        }
    }
    return false;
};

/**
 * 获取所有的时间对象
 *
 * @return {Array}
 * */
handler.getExpressions = function () {
    return this.expressions;
};

var main = function() {
    var currentTimeMillis = new Date().getTime();
//    var timeExpression = new Handler("[*][*][w1,2,3,4,5,6,7][10:00-20:00]");
    //		Long l=Timer.getNowTime()-currentTimeMillis;
//    var nextDay = getNextDay(timeExpression, currentTimeMillis);
      var timeExpression= new Handler("[*][*][14-32][*]");
     console.log(timeExpression.isExpressionTime(new Date().getTime()));
};

var getNextDay = function(expression, time) {
    if (!expression.isAllYear()) {
        return null;
    }
    var date = new Date(time);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setDate(date.getDate() +1);
    var i = 0;
    while (i <= 365) {
        if (expression.isExpressionDate(date.getTime())) {
            return date.getTime();
        } else {
            date.add(Calendar.DATE, 1);
            i++;
        }
    }
    return null;
};

main();

