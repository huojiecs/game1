/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-9-13
 * Time: 下午3:07
 * To change this template use File | Settings | File Templates.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Handler(opts) {
    EventEmitter.call(this);

    this.id = opts.id;
    this.name = opts.name;
    this.type = opts.type;
    this.x = opts.x;
    this.y = opts.y;
    this.z = opts.z;

    this.GetID = function () {
        return this.id;
    };
    this.SetID = function (id) {
        this.id = id;
    };
    this.GetName = function () {
        return this.name;
    };
    this.SetName = function (name) {
        this.name = name;
    };
    this.GetType = function () {
        return this.type;
    };
    this.SetType = function (type) {
        this.name = type;
    };
    this.GetPosition = function () {
        return {x: this.x, y: this.y, z: this.z};
    };
    this.SetPosition = function (pos) {
        this.x = pos.x;
        this.y = pos.y;
        this.z = pos.z;
    };
};

util.inherits(Handler, EventEmitter);

module.exports = Handler;