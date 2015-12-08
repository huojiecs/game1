/**
 * Created with JetBrains WebStorm.
 * User: eder
 * Date: 13-6-9
 * Time: 上午10:43
 * To change this template use File | Settings | File Templates.
 */
var templateConst = require('../../../template/templateConst');
var gameConst = require('../../tools/constValue');
var eMisInfo = gameConst.eMisInfo;
module.exports = function (MissionTemplate) {
    return new Handler(MissionTemplate);
};

var Handler = function (MissionTemplate) {
    this.dataInfo = new Array(eMisInfo.Max);
    this.MissionTemplate = MissionTemplate;
};

var handler = Handler.prototype;
handler.SetMissionInfo = function (index, value) {
    this.dataInfo[index] = value;
};

handler.GetMissionInfo = function (index) {
    return this.dataInfo[index];
};

handler.SetAllInfo = function (dataInfo) {
    this.dataInfo = dataInfo;
};

handler.GetTemplate = function () {
    return this.MissionTemplate;
};

/*
 handler.IsMissionOver = function( misType, npcID, misNum ){
 if( this.dataInfo[ eMisInfo.MisState] != eMisState.Get ){
 return -1;
 }
 var tempType = this.MissionTemplate[ tMission.misType ];
 if( tempType != misType ){
 return -2;
 }
 var overNum = this.MissionTemplate[ tMission.overNum ];
 if( overNum == 0 ){
 this.dataInfo[ eMisInfo.MisState] = eMisState.Over;
 return 0;
 }
 if( this.MissionTemplate[ tMission.overType] = eMisOverType.Every ){
 for( var i = 0; i < overNum; ++i ){
 var needID = this.MissionTemplate['needID_'+i];
 if( npcID == needID ){
 this.dataInfo[ eMisInfo.MisNum_0 ] += misNum;
 if( this.dataInfo[ eMisInfo.MisNum_0 ] >= this.MissionTemplate[ tMission.needNum_0 ] ){
 this.dataInfo[ eMisInfo.MisNum_0 ] = this.MissionTemplate[ tMission.needNum_0 ];
 this.dataInfo[ eMisInfo.MisState] = eMisState.Over;
 return 0;
 }
 else{
 return 1;
 }
 }
 }
 }
 else{
 var endNum = 0;
 var isChange = false;
 for( var i = 0; i < overNum; ++i ){
 var needID = this.MissionTemplate['needID_'+i];
 var index = 'MisNum_' + i;
 if( npcID == needID ){
 this.dataInfo[ eMisInfo[ index ] ] += misNum;
 if( this.dataInfo[ eMisInfo[ index ] ] >= this.MissionTemplate[ 'needNum_' + i ] ){
 this.dataInfo[ eMisInfo[ index ] ] = this.MissionTemplate[ 'needNum_' + i ];
 ++endNum;
 }
 isChange = true;
 }
 else if( this.dataInfo[ eMisInfo[ index ] ] >= this.MissionTemplate[ 'needNum_' + i ] ){
 ++endNum;
 }
 }
 if( endNum >= overNum ){
 this.dataInfo[ eMisInfo.MisState] = eMisState.Over;
 return 0;
 }
 else if( isChange){
 return 1;
 }
 }
 return -3;
 };

 handler.UpdateMission12Info = function(){
 if( this.MissionTemplate[ tMission.bigType ] == eMisBigType.EveryDay ){
 if( this.dataInfo[ eMisInfo.MisState ] == eMisState.Prize ){
 this.dataInfo[ eMisInfo.MisNum_0 ] = 0;
 this.dataInfo[ eMisInfo.MisNum_1 ] = 0;
 this.dataInfo[ eMisInfo.MisNum_2 ] = 0;
 this.dataInfo[ eMisInfo.MisNum_3 ] = 0;
 this.dataInfo[ eMisInfo.MisNum_4 ] = 0;
 this.dataInfo[ eMisInfo.MisState ] = eMisState.Get;
 }
 }
 };
 */