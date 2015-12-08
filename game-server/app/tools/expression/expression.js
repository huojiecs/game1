/**
 * The file expression.js Create with WebStorm
 * @Author        gaosi
 * @Email         angus_gaosi@163.com
 * @Date          2014/10/14 20:17:00
 * To change this template use File | Setting |File Template
 */

module.exports = function (experssion) {
    return new Handler(experssion);
};

/**
 * 时间函数解析
 * [*,yyyy,yyyy-yyyy][*,mm,mm-mm][*,dd,dd-dd][1:40-2:50]
 * */
var Handler = function (experssion) {
    this.experssion = experssion.substring(1, experssion.length - 1);

    var t = this.experssion.split("][");
    if (t.length != 4) {
        throw('date formate error' + experssion);
    }
    this.years = t[0].split(",");
    this.months = t[1].split(",");
    this.days = t[2].split(",");
    this.hours = t[3].split(",");

    if (this.years.length == 0 || this.months.length == 0 || this.days.length == 0 || this.hours.length == 0) {
        throw('date formate error' + experssion);
    }
};

var handler = Handler.prototype;

/**
 * 初始化方法
 * @param {number} time 时间对比
 * @return {boolean}
 * */
handler.isValidateTime = function (time) {
    if (this.isValidateDate(time)) {
        var date = new Date(time);

        var hour = date.getHours();
        var minute = date.getMinutes();
        var secend = date.getSeconds();
        var millsecend = date.getMilliseconds();
        var hourtime = hour * 60 * 60 * 1000 + minute * 60 * 1000 + secend * 1000 + millsecend;
        if (!this.isinhours(this.hours, hourtime)) {
            return false;
        }
        return true;
    } else {
        return false;
    }
};

/**
 * 是否是所有年份
 * @return {boolean}
 * */
handler.isAllYear = function () {
    for (var year in this.years) {
        if ("*" === year) {
            return true;
        }
    }
    return false;
};

/**
 *
 * @param {number} time 时间
 * @return {boolean}
 * */
handler.isValidateDate = function (time) {
    var date = new Date(time);
    var year = date.getFullYear();
    if (!this.isinarray(this.years, year)) {
        return false;
    }
    var month = date.getMonth();
    if (!this.isinarray(this.months, month)) {
        return false;
    }
    if (this.days[0].indexOf("w") == 0 || this.days[0].indexOf("W") == 0) {
        var week = date.getDay();
        if (week == 0) {
            week = 7;
        }
        if (!this.isweek(this.days, week)) {
            return false;
        }
    } else {
        var day = date.getDate();
        if (!this.isinarray(this.days, day)) {
            return false;
        }
    }
    return true;
};

/**
 * 是否在数组内
 * @param {number} time 时间
 * @return {boolean}
 * */
handler.isinarray = function (array, value) {
    for (var i in array) {
        var item = array[i];

        if (item == "*") {
            return true;
        }
        if (item.indexOf("-") != -1) {//数字段的
            var seg = item.split("-");
            if (value >= parseInt(seg[0]) && value <= parseInt(seg[1])) {
                return true;
            }
        } else if (item == value + "") {
            return true;
        }
    }
    return false;
};

/**
 * 是否在星期内
 * @param {number} time 时间
 * @return {boolean}
 * */
handler.isweek = function (array, value) {

    for (var string in array) {
        if (string.indexOf("w") == 0 || string.indexOf("W") == 0) {
            string = string.substring(1, string.length);
        }
        if (string == "*") {
            return true;
        }
        if (string.indexOf("-") != -1) {//数字段的
            var seg = string.split("-");
            if (value >= parseInt(seg[0]) && value <= parseInt(seg[1])) {
                return true;
            }
        } else if (string == value + "") {
            return true;
        }
    }
    return false;
};


/**
 * 是否在星期内
 * @param {number} time 时间
 * @return {boolean}
 * */
handler.isinhours = function (array, checkhourtime) {
    for (var i in array) {
        var item = array[i];
        if (item == "*") {
            return true;
        }
        //float hourtime=hours+minutes/(float)60;
        if (item.indexOf("-") != -1) {//数字段的
            var seg = item.split("-");
            var start = seg[0].split(":");
            var end = seg[1].split(":");
            var starthour = parseInt(start[0]) * 60 * 60 * 1000;
            if (start.length > 1) {
                starthour = starthour + parseInt(start[1]) * 60 * 1000;
            }
            var endhour = parseInt(end[0]) * 60 * 60 * 1000;
            if (end.length > 1) {
                endhour = endhour + parseInt(end[1]) * 60 * 1000;
            }
            if (checkhourtime >= starthour && checkhourtime <= endhour) {
                return true;
            }
        }
    }
    return false;
};


/**
 * 获取当前日表达式执行的时间点
 * @param {number} time 时间
 * @return {Array}
 * */
handler.getHourExp = function (time) {
    var l = [];
    if (isValidateDate(time)) {
        var date = new Date(time);

        var hour = date.getHours();
        var minute = date.getMinutes();
        var secend = date.getSeconds();
        var millsecend = date.getMilliseconds();
        var hourtime = hour * 60 * 60 * 1000 + minute * 60 * 1000 + secend * 1000 + millsecend;

        for (var item in this.hours) {
            if (item == "*") {
                l.clear();
                l.add("*");
                return l;
            }
            if (item.indexOf("-") != -1) {//数字段的
                var seg = item.split("-");
                var start = seg[0].split(":");
                var end = seg[1].split(":");
                var exp = start[0];
                var starthour = parseInt(start[0]) * 60 * 60 * 1000;
                if (start.length > 1) {
                    starthour = starthour + parseInt(start[1]) * 60 * 1000;
                }
                var endhour = parseInt(end[0]) * 60 * 60 * 1000;
                if (end.length > 1) {
                    endhour = endhour + parseInt(end[1]) * 60 * 1000;
                }
                if (hourtime <= starthour) {
                    l.add(seg[0]);
                }
            }
        }
    }
    return l;
};

