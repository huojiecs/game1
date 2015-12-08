/**
 * Created by eder on 2015/1/25.
 */

var logger = require('pomelo-logger').getLogger("climb", __filename);
var monitor = require('./../monitor');

var Handler = module.exports = function (client, interval) {
    this.client = client;
    this.pomelo = client.pomelo;
    this.interval = interval;
};

var handler = Handler.prototype;

handler.run = function () {
    var self = this;

    setInterval(
        function () {
            self.update();
        }, self.interval);
};

handler.update = function(){
  var randomNum = Math.floor(Math.random()*6) ;
    switch(randomNum){
        case 0:
        {
            this.OpenNewCrystal();  //开启一个洗练关卡
        }
            break;
        case 1:
        {
            this.ActivateAtt(); //激活
        }
            break;
        case 2:
        {
            this.OpenAtt();//开锁
        }
            break;
        case 3:
        {
            this.LockAtt();//锁定
        }
            break;
        case 4:
        {
            this.SuccinctAtt();
        }
            break;
        case 5:
        {
            this.ReplaceAtt();
        }
    }

};
var soulID = [1000,1001,1002,1003,1004];
var succinctID1 =[1000,1001,1002,1003,1004];
var succinctID2 =[2000,2001,2002,2003,2004];
var succinctID3 =[3000,3001,3002,3003,3004];
var succinctID4 =[4000,4001,4002,4003,4004];
var succinctID5 =[5000,5001,5002,5003,5004];


handler.OpenNewCrystal =function(){//开启一个洗练关卡
    var message ={};
    message["soulID"] = soulID[Math.floor(Math.random()*5)];

    monitor.begin('OpenNewCrystal',0);
    this.pomelo.request("cs.SoulSuccinctHandler.OpenNewCrystal", message, function (result) {
        logger.info("OpenNewCrystal result==" + result.result);
        monitor.end('openNewCrystal', 0);
    })
};

handler.ActivateAtt =function(){
var message = {};
    message['soulID']=1000;
    message['succinctID'] =1000;
    message['gridID'] = 1;
    monitor.begin('ActivateAtt',0);
    this.pomelo.request("cs.SoulSuccinctHandler.ActivateAtt", message, function(result){
        logger.info("ActivateAtt result=="+result.result);
        monitor.end('openNewCrystal',0);
    })
};

handler.OpenAtt = function(){
  var message={};
    message['soulID']=1000;
    message['succinctID'] = 1000;
    message['gridID'] = 1;
    monitor.begin('OpenAtt',0);
    this.pomelo.request("cs.SoulSuccinctHandler.OpenAtt",message, function(result){
       logger.info('OpenAtt result = '+result.result);
        monitor.end('OpenAtt',0);
    });
};

handler.LockAtt = function(){
    var message={};
    message['soulID']=1000;
    message['succinctID'] = 1000;
    message['gridID'] = 1;
    monitor.begin('LockAtt',0);
    this.pomelo.request("cs.SoulSuccinctHandler.LockAtt",message, function(result){
        logger.info('LockAtt result = '+result.result);
        monitor.end('LockAtt',0);
    });
};

handler.SuccinctAtt = function(){
    var message={};
    message['soulID']=1000;
    message['succinctID'] = 1000;
    monitor.begin('LockAtt',0);
    this.pomelo.request("cs.SoulSuccinctHandler.SuccinctAtt",message, function(result){
        logger.info('SuccinctAtt result = '+result.result);
        monitor.end('SuccinctAtt',0);
    });
};


handler.ReplaceAtt = function(){
    var message={};
    message['soulID']=1000;
    message['succinctID'] = 1000;
    monitor.begin('ReplaceAtt',0);
    this.pomelo.request("cs.SoulSuccinctHandler.ReplaceAtt",message, function(result){
        logger.info('ReplaceAtt result = '+result.result);
        monitor.end('ReplaceAtt',0);
    });
};



