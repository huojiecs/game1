/**
 * Created by kazi on 2014/4/9.
 */

module.exports = function (owner) {
    return new Handler(owner);
};

var Handler = function (owner) {
    this.owner = owner;
    this.roleID = 0;
    this.myCheckID = 0;
    this.accountID = 0;
    this.roleInfo = 0;
};

var handler = Handler.prototype;

