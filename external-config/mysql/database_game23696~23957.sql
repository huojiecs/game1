DROP TABLE IF EXISTS `limitgoods`;
CREATE TABLE `limitgoods` (
`goodsID`  int(11) NOT NULL ,
`goodsNum`  int(11) NOT NULL DEFAULT 0 ,
PRIMARY KEY (`goodsID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `operateinfo`;
CREATE TABLE `operateinfo` (
`roleID`  int(11) NOT NULL ,
`maxZhanli`  varchar(1023) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '[]' ,
`rechargeNum`  float NOT NULL DEFAULT 0 ,
`awardScore`  int(11) NOT NULL DEFAULT 0 ,
`sevenRecharge`  int(11) NOT NULL DEFAULT 0 ,
`expLevel`  int(11) NOT NULL DEFAULT 0 ,
`awardInfo`  varchar(2047) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '[]' ,
`costInfo`  varchar(1023) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '{}' ,
PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP PROCEDURE IF EXISTS `sp_asyncPvPBlessReceived`;
DELIMITER ;;
CREATE PROCEDURE `sp_asyncPvPBlessReceived`(IN _roleID 		INT)
BEGIN
 	DECLARE _result	INT(0);
	DECLARE _count INT(1);
	DECLARE _received INT(11);
	DECLARE _newreceived INT(11);
	SELECT count(*) INTO _count FROM `asyncpvpbless` WHERE `roleID` = _roleID;
	IF(_count > 0) THEN
		SELECT blessReceived INTO _received FROM `asyncpvpbless` WHERE `roleID` = _roleID;
		
		IF(_received DIV 100 <> DAYOFYEAR(NOW())) THEN
			SET _newreceived = DAYOFYEAR(NOW()) * 100 + 1;
		ELSE
			SET _newreceived = DAYOFYEAR(NOW()) * 100 + (_received % 100 + 1);
		END IF;

		UPDATE `asyncpvpbless` SET blessReceived = _newreceived
			WHERE `roleID` = _roleID;
		SET _result = 0;
		SELECT _result;
	END IF;
	IF(_count <= 0) THEN
		SET _result = -1;
		SELECT _result;
	END IF;
  	
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartAddBlackList`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartAddBlackList`(IN _roleID INT)
BEGIN
	INSERT INTO chart_black VALUES (_roleID);
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartLoadBlackList`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadBlackList`(IN _roleID INT)
BEGIN
	SELECT roleID FROM chart_black LIMIT 1000;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartLoadClimbScore`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadClimbScore`(IN _START	INT,
  	IN _LIMIT	INT)
BEGIN
   	PREPARE STMT FROM "SELECT roleID, weekScore*1000+customNum as weekScore FROM `climb` LIMIT ?, ?;";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartLoadHonor`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadHonor`(IN _START	INT,

	IN _LIMIT	INT)
BEGIN

   	PREPARE STMT FROM " SELECT roleID, honor FROM `asyncpvp` LIMIT ?, ? ; ";

  	SET @START = _START;

  	SET @LIMIT = _LIMIT;

  	EXECUTE STMT USING @START, @LIMIT;

 	DEALLOCATE PREPARE STMT;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartLoadNiuDanScore`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadNiuDanScore`(IN _START	INT,

	IN _LIMIT	INT)
BEGIN

   	PREPARE STMT FROM " SELECT roleID, awardScore FROM `operateinfo` LIMIT ?, ? ; ";

  	SET @START = _START;

  	SET @LIMIT = _LIMIT;

  	EXECUTE STMT USING @START, @LIMIT;

 	DEALLOCATE PREPARE STMT;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartLoadRecharge`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadRecharge`(IN _START	INT,

	IN _LIMIT	INT)
BEGIN

   	PREPARE STMT FROM " SELECT roleID, sevenRecharge FROM `operateinfo` LIMIT ?, ? ; ";

  	SET @START = _START;

  	SET @LIMIT = _LIMIT;

  	EXECUTE STMT USING @START, @LIMIT;

 	DEALLOCATE PREPARE STMT;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartLoadRoleInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadRoleInfo`(IN _START	INT,

  	IN _LIMIT	INT)
BEGIN

   	PREPARE STMT FROM "SELECT roleID, name, expLevel, zhanli, vipLevel, isNobility, isQQMember FROM `role` LIMIT ?, ?;";

  	SET @START = _START;

  	SET @LIMIT = _LIMIT;

  	EXECUTE STMT USING @START, @LIMIT;

 	DEALLOCATE PREPARE STMT;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadSoul`(IN _START	INT,
	IN _LIMIT	INT)
BEGIN
		
   	PREPARE STMT FROM " SELECT a.roleID, GROUP_CONCAT(CAST(soulID as char)) soulID, GROUP_CONCAT(CAST(soulLevel as char)) soulLevel, SUM(a.zhanli) zhanli, b.name 
   				FROM soul a LEFT JOIN role b ON a.roleID = b.roleID GROUP BY roleID LIMIT ?, ? ; ";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadUnion`(IN _START	INT,

	IN _LIMIT	INT)
BEGIN

   	PREPARE STMT FROM " SELECT * FROM `unioninfo` LIMIT ?, ? ; ";

  	SET @START = _START;

  	SET @LIMIT = _LIMIT;

  	EXECUTE STMT USING @START, @LIMIT;

 	DEALLOCATE PREPARE STMT;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_checkUnionName`;
DELIMITER ;;
CREATE PROCEDURE `sp_checkUnionName`(IN _unionName		VARCHAR(63))
BEGIN
	DECLARE _resultID		INT(0);
	DECLARE _datetime		DATETIME;
	DECLARE _result			INT(0);
	DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET _result = 12006;
	SET _result = 0;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
 	START TRANSACTION;
		INSERT INTO `union`(`unionName`,`createTime`, `updateTime`) VALUES (_unionName, _datetime, _datetime);		
		SET _resultID = LAST_INSERT_ID();
		SELECT _result, _resultID;
	COMMIT;	
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_createRole`;
DELIMITER ;;
CREATE PROCEDURE `sp_createRole`(IN _accountID 			INT,
	IN _roleID				INT,
	IN _roleTempID			INT,
  	IN _roleName			VARCHAR(63),
  	IN _expLevel			INT,
  	IN _zhanLi				INT,
	IN _lifeNum				INT,
  	IN itemInfo				VARCHAR(4095),
  	IN skillInfo			VARCHAR(4095),
  	IN soulInfo				VARCHAR(4095),
  	IN misInfo				VARCHAR(4095),
	IN groupInfo			VARCHAR(4095),
	IN misfinish			VARCHAR(4095),
 	IN assetsInfo			VARCHAR(4095),
  	IN mailInfo				VARCHAR(4095),
  	IN giftInfo				VARCHAR(4095),
  	IN magicSoulInfo	    VARCHAR(4095),
 	IN physicalInfo		    VARCHAR(4095),
	IN climbInfo		    VARCHAR(4095),
	IN alchemyInfo		    VARCHAR(4095),
	IN mineSweepInfo	    VARCHAR(4095),
	IN logingift		    VARCHAR(4095),
	IN rewardmisInfo	    VARCHAR(4095),
	IN operateInfo			VARCHAR(4095))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;
	INSERT INTO `role` (`roleID`, `accountID`, `name`, `tempID`,`expLevel`, `zhanli`, `lifeNum`, `loginTime`, `createTime`, `refreshTime`)
 		VALUES (_roleID, _accountID, _roleName, _roleTempID, _expLevel, _zhanLi, _lifeNum, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());
  	SELECT count(*) INTO _count FROM `skill` WHERE roleID = _roleID;
	IF(_count > 0) THEN
		DELETE FROM `skill` WHERE roleID = _roleID;
	END IF;
	IF( LENGTH( skillInfo ) ) THEN
  		SET @sqlStr =CONCAT( 'insert into `skill` values', skillInfo,';');
  		PREPARE s1 FROM @sqlStr;
  		EXECUTE s1;
  	END IF;

	SELECT count(*) INTO _count FROM `soul` WHERE roleID = _roleID;
	IF(_count > 0) THEN
		DELETE FROM `soul` WHERE roleID = _roleID;
	END IF;

  	IF( LENGTH( soulInfo ) ) THEN
  		SET @sqlStr =CONCAT( 'insert into `soul` values', soulInfo,';');
  		PREPARE s1 FROM @sqlStr;
  		EXECUTE s1;
  	END IF;

	SELECT count(*) INTO _count FROM `mission` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `mission` WHERE roleID = _roleID;

	END IF;

  	IF( LENGTH( misInfo ) ) THEN

  		SET @sqlStr =CONCAT( 'insert into `mission` values', misInfo,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

  	END IF;

	SELECT count(*) INTO _count FROM `misgroup` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `misgroup` WHERE roleID = _roleID;

	END IF;

  	IF( LENGTH( groupInfo ) ) THEN

  		SET @sqlStr =CONCAT( 'insert into `misgroup` values', groupInfo,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

  	END IF;

	SELECT count(*) INTO _count FROM `misfinish` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `misfinish` WHERE roleID = _roleID;

	END IF;

  	IF( LENGTH( misfinish ) ) THEN

  		SET @sqlStr =CONCAT( 'insert into `misfinish` values', misfinish,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

  	END IF;

	SELECT count(*) INTO _count FROM `item` WHERE `roleID` = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `item` WHERE `roleID` = _roleID;

	END IF;

  	IF( LENGTH( itemInfo ) ) THEN

  		SET @sqlStr =CONCAT( 'insert into `item` values', itemInfo,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

  	END IF;

	SELECT count(*) INTO _count FROM `assets` WHERE `roleID` = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `assets` WHERE `roleID` = _roleID;

	END IF;

  	IF( LENGTH( assetsInfo ) ) THEN

  		SET @sqlStr =CONCAT( 'insert into `assets` values', assetsInfo,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

  	END IF;

	SELECT count(*) INTO _count FROM `gift` WHERE `roleID` = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `gift` WHERE `roleID` = _roleID;

	END IF;

  	IF( LENGTH( giftInfo ) ) THEN

  		SET @sqlStr =CONCAT( 'insert into `gift` values', giftInfo,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

  	END IF;

	SELECT count(*) INTO _count FROM `magicsoul` WHERE `roleID` = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `magicsoul` WHERE `roleID` = _roleID;

	END IF;

  	IF( LENGTH( magicSoulInfo ) ) THEN

  		SET @sqlStr =CONCAT( 'insert into `magicsoul` values', magicSoulInfo,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

  	END IF;

	SELECT count(*) INTO _count FROM `physical` WHERE `roleID` = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `physical` WHERE `roleID` = _roleID;

	END IF;

 	IF( LENGTH( physicalInfo ) ) THEN

 		SET @sqlStr =CONCAT( 'insert into `physical` values', physicalInfo,';');

 		PREPARE s1 FROM @sqlStr;

 		EXECUTE s1;

 	END IF;

	SELECT count(*) INTO _count FROM `climb` WHERE `roleID` = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `climb` WHERE `roleID` = _roleID;

	END IF;

    IF( LENGTH( climbInfo ) ) THEN

		SET @sqlStr=CONCAT('insert into `climb` values',climbInfo, ';');

		PREPARE s1 FROM @sqlStr;

        EXECUTE s1;

	END IF;

	SELECT count(*) INTO _count FROM `alchemy` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `alchemy` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( alchemyInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `alchemy` values', alchemyInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	SELECT count(*) INTO _count FROM `minesweep` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `minesweep` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( mineSweepInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `minesweep` values', mineSweepInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	SELECT count(*) INTO _count FROM `logingift` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `logingift` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( logingift ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `logingift` values', logingift,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	SELECT count(*) INTO _count FROM `rewardmis` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `rewardmis` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( rewardmisInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `rewardmis` values', rewardmisInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	SELECT count(*) INTO _count FROM `operateinfo` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `operateinfo` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( operateInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `operateinfo` values', operateInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

   	IF( LENGTH(mailInfo) ) THEN

  		SET @sqlStr =CONCAT( 'INSERT INTO `mail` (`roleID`, `sendID`, `sendName`, `theme`, `content`,

			`mailState`, `sendType`, `sendTime`,`itemID_0`, `itemNum_0`, `itemID_1`, `itemNum_1`, `itemID_2`,

			`itemNum_2`, `itemID_3`, `itemNum_3`, `itemID_4`, `itemNum_4`) VALUES', mailInfo,';');

  		PREPARE s1 FROM @sqlStr;

  		EXECUTE s1;

	END IF;

	COMMIT;

  	SET _result = 0;

  	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_createUnion`;
DELIMITER ;;
CREATE PROCEDURE `sp_createUnion`(IN _unionID INT, IN _roleID INT,
	IN unionInfo	    VARCHAR(4095),
    IN unionMemberInfo  VARCHAR(4096))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;


	SELECT count(*) INTO _count FROM `unioninfo` WHERE unionID = _unionID;

	IF(_count > 0) THEN

		DELETE FROM `unionInfo` WHERE unionID = _unionID;

	END IF;

	IF( LENGTH( unionInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `unioninfo` values', unionInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	
	SELECT count(*) INTO _count FROM `unionmember` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `unionmember` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( unionMemberInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `unionmember` values', unionMemberInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	COMMIT;

  	SET _result = 0;

  	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_deleteMember`;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteMember`(IN _roleID INT)
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
    
    SELECT count(*) INTO _count FROM `unionmember` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `unionmember` WHERE `roleID`=_roleID;
		END IF; 

 	SET _result = 0;
 	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_deleteUnion`;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteUnion`(IN _roleID INT)
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);

  	SELECT count(*) INTO _count FROM `unioninfo` WHERE `bossID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `unioninfo` WHERE `bossID`=_roleID;
		END IF; 
    
    SELECT count(*) INTO _count FROM `unionmember` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `unionmember` WHERE `roleID`=_roleID;
		END IF; 

 	SET _result = 0;
 	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_deleteUnionName`;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteUnionName`(IN _unionName		VARCHAR(63))
BEGIN
	DECLARE _count					INT(1);
 	START TRANSACTION;
		SELECT count(*) INTO _count FROM `union` WHERE `unionName`=_unionName;
		IF(_count > 0) THEN
			DELETE FROM `union` WHERE `unionName`=_unionName;
		END IF;
COMMIT;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_enterUnion`;
DELIMITER ;;
CREATE PROCEDURE `sp_enterUnion`(IN _roleID INT,
    IN unionMemberInfo  VARCHAR(4096))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;	
	SELECT count(*) INTO _count FROM `unionmember` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `unionmember` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( unionMemberInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `unionmember` values', unionMemberInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	COMMIT;

  	SET _result = 0;

  	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_friendAddByOutside`;
DELIMITER ;;
CREATE PROCEDURE `sp_friendAddByOutside`(IN friends VARCHAR(16383))
BEGIN
 	SET @sql = CONCAT('INSERT INTO `friend` 
		(`roleID`, `friendID`, `friendType`)
		VALUES', friends,';');

	PREPARE stmt FROM @sql;
	EXECUTE stmt;
	DEALLOCATE PREPARE stmt;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_friendRemoveByOutside`;
DELIMITER ;;
CREATE PROCEDURE `sp_friendRemoveByOutside`(IN _roleID 		INT,
	IN _friendIDs 	VARCHAR(16383))
BEGIN

 	SET @sql = CONCAT('
	DELETE FROM friend WHERE roleID = ', _roleID,' AND friendID IN (', _friendIDs, ')');
 	PREPARE stmt FROM @sql;
 	EXECUTE stmt;
 	DEALLOCATE PREPARE stmt; 

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_addRoleAssetsInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_addRoleAssetsInfo`(IN _roleID		INT,
	IN _tempID		INT,
	IN _addNum		INT)
BEGIN

	DECLARE _roleCount	INT;
	DECLARE _count	INT;
	DECLARE _tempCount INT;
	DECLARE _retCount INT;

	SELECT count(*) INTO _roleCount FROM role WHERE roleID = _roleID;
	IF(_roleCount > 0) THEN

		SELECT count(*), num INTO _count, _tempCount FROM `assets` WHERE `roleID` = _roleID AND `tempID` = _tempID;
		
		IF(_count > 0) THEN
			UPDATE `assets` SET num = num + _addNum  WHERE `roleID` = _roleID AND `tempID` = _tempID;
		ELSE
			INSERT INTO assets VALUES(_roleID, _tempID, _addNum);
			SET _tempCount = 0;
		END IF;

		SELECT num INTO _retCount FROM `assets` WHERE `roleID` = _roleID AND `tempID` = _tempID;

		SELECT 0 as _result, _tempCount, _retCount;
	ELSE

		SELECT 5 as _result;
	END IF;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getAllPlayerForbidInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getAllPlayerForbidInfo`()
BEGIN	
	SELECT roleID, forbidProfit, forbidChat, forbidChart, forbidPlay, forbidPlayList FROM forbid_list;
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getAssetsInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getAssetsInfo`(IN _roleID		INT,
	IN _tempID		INT)
BEGIN

	DECLARE _roleCount	INT;
	DECLARE _result		INT;
	DECLARE _retNum		INT;
	SET _retNum = 0;
	SET _result = 0;

	SELECT count(*) INTO _roleCount FROM role WHERE roleID = _roleID;

	IF(_roleCount > 0) THEN
		SELECT `num` INTO _retNum FROM `assets` WHERE `roleID` = _roleID AND `tempID` = _tempID;
	ELSE
		SET _result = 5;
	END IF;

	SELECT _result, _retNum as num;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getClimbScoreInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getClimbScoreInfo`(IN _roleID	INT)
BEGIN

	DECLARE _climbData			    VARCHAR(5000);
 	DECLARE _historyData			VARCHAR(1000);
	DECLARE _name                   VARCHAR(63);

	SELECT name INTO _name FROM role WHERE roleID = _roleID;
	IF _name is not null THEN
		SELECT climbData, historyData INTO _climbData, _historyData FROM climb WHERE roleID = _roleID;
		SELECT 0 as _result, _climbData, _historyData;
	ELSE
		SELECT 5 as _result;	
	END IF;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getForbidChartTime`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getForbidChartTime`()
BEGIN
	SELECT roleID, forbidChart FROM forbid_list;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getPlayerBasicInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getPlayerBasicInfo`(IN _roleID	INT)
BEGIN
	DECLARE _name                   VARCHAR(63);
	DECLARE _zhanLi		            INT(0);
	DECLARE _moneyNum               INT(0);
	DECLARE _climbStr				VARCHAR(5000);

	SELECT name, zhanli INTO _name, _zhanLi FROM role WHERE roleID = _roleID;
	IF _name is not null THEN
		SELECT num INTO _moneyNum FROM assets WHERE roleID = _roleID AND tempID=1001;
		SELECT climbData INTO _climbStr FROM climb WHERE roleID = _roleID;
		SELECT 0 as _result, _name, _zhanLi, _moneyNum, _climbStr;
	ELSE
		SELECT 5 as _result;	
	END IF;	
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getPlayerForbidInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getPlayerForbidInfo`(IN _roleID	INT)
BEGIN
	DECLARE _forbidProfit           VARCHAR(63);
	DECLARE _forbidChat		        VARCHAR(63);
	DECLARE _forbidChart            VARCHAR(63);
	DECLARE _forbidPlay             VARCHAR(63);
	DECLARE _forbidPlayList         VARCHAR(63);
	
	SELECT forbidProfit INTO _forbidProfit FROM forbid_list WHERE roleID = _roleID;
	IF _forbidProfit is not null THEN
		SELECT forbidChat, forbidChart, forbidPlay, forbidPlayList  
			INTO _forbidChat, _forbidChart, _forbidPlay, _forbidPlayList FROM forbid_list WHERE roleID = _roleID;
		SELECT 0 as _result, _forbidProfit, _forbidChat, _forbidChart, _forbidPlay, _forbidPlayList;
	ELSE
		SELECT 5 as _result;
	END IF;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getPlayerInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getPlayerInfo`(IN _roleID	INT)
BEGIN

	DECLARE _copyCount			    INT(1);
 	DECLARE _lyCount 				INT(0);
	DECLARE _climbNum               INT(0);
	DECLARE _name                   VARCHAR(63);
	DECLARE _expLevel               INT(0);
	DECLARE _moneyNum               INT(0);
	DECLARE _yuanbaoNum             INT(0);
	DECLARE _physicalNum            INT(0);
	DECLARE _magicsoul              INT(0);

	SELECT name, expLevel INTO _name, _expLevel FROM role WHERE roleID = _roleID;
	IF _name is not null THEN
		SELECT num INTO _moneyNum FROM assets WHERE roleID = _roleID AND tempID=1001;
		SELECT num INTO _yuanbaoNum FROM assets WHERE roleID = _roleID AND tempID=1002;
		SELECT num INTO _physicalNum FROM assets WHERE roleID = _roleID AND tempID=15001;
		SELECT MAX(areaID) INTO _copyCount FROM areasco WHERE roleID = _roleID AND levelTarget=1;
		SELECT MAX(areaID) INTO _lyCount FROM areasco WHERE roleID = _roleID AND levelTarget=2;
		SELECT customNum INTO _climbNum FROM climb WHERE roleID = _roleID;
		SELECT TEMPID INTO _magicsoul FROM magicsoul WHERE roleID= _roleID;
		SELECT 0 as _result, _name, _expLevel, _moneyNum, _yuanbaoNum, _physicalNum, _copyCount, _lyCount, _climbNum, _magicsoul;
	END IF;


	SELECT 5 as _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getPlayerInfoForOccupy`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getPlayerInfoForOccupy`(IN _roleID	INT)
BEGIN
	DECLARE _name                   VARCHAR(63);
	DECLARE _unionID	            INT(0);
	DECLARE _unionName              VARCHAR(63);

	SELECT name, unionID, unionName INTO _name, _unionID, _unionName FROM role WHERE roleID = _roleID;
	IF _name is not null THEN
		SELECT 0 as _result, _name, _unionID, _unionName;
	ELSE
		SELECT 5 as _result;
	END IF;	
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_getPlayerOccupyID`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getPlayerOccupyID`(IN _roleID	INT)
BEGIN
	DECLARE _occupyID		            INT(0);
	SELECT customID INTO _occupyID FROM occupant WHERE roleID = _roleID;
	IF _occupyID is null THEN
		SET _occupyID = 0;
	END IF;	
	SELECT _occupyID;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_removeForbid`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_removeForbid`(IN _roleID		INT,
	IN _profitTime	DATETIME,
	IN _chatTime	DATETIME,
	IN _chartTime	DATETIME,
	IN _playTime	DATETIME,
	IN _playList	VARCHAR(63))
BEGIN
	UPDATE forbid_list SET forbidProfit = _profitTime,
						   forbidChat = _chatTime,
						   forbidChart = _chartTime,
						   forbidPlay = _playTime,
						   forbidPlayList = _playList
	WHERE roleID = _roleID;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_setClimbScoreInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setClimbScoreInfo`(IN _roleID		INT,
	IN _climbData 	VARCHAR(5000),
	IN _historyData VARCHAR(1000))
BEGIN
	DECLARE _name         VARCHAR(63);
	SELECT name INTO _name FROM role WHERE roleID = _roleID;
	IF _name is not null THEN
		UPDATE climb SET climbData = _climbData, historyData = _historyData WHERE roleID = _roleID;
		SELECT 0 as _result;
	ELSE
		SELECT 5 as _result;
	END IF;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_setClimbZero`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setClimbZero`(IN _roleID	INT)
BEGIN
	DECLARE _name                   VARCHAR(63);

	SELECT name INTO _name FROM role WHERE roleID = _roleID;
	IF _name is not null THEN
		UPDATE climb SET climbData = '[]', todayData = '[]', customNum = 0, historyData = '[]', weekScore = 0 
			WHERE roleID = _roleID;
		SELECT 0 as _result;
	ELSE
		SELECT 5 as _result;
	END IF;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_setForbidChartTime`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidChartTime`(IN _roleID		INT,
	IN _dateTime	DATETIME)
BEGIN
	INSERT INTO forbid_list(roleID, forbidChart) values(_roleID, _dateTime)
		ON DUPLICATE KEY UPDATE forbidChart=_dateTime;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_setForbidChatTime`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidChatTime`(IN _roleID		INT,
	IN _dateTime	DATETIME)
BEGIN
	INSERT INTO forbid_list(roleID, forbidChat) values(_roleID, _dateTime)
		ON DUPLICATE KEY UPDATE forbidChat=_dateTime;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_setForbidPlayInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidPlayInfo`(IN _roleID		INT,
	IN _dateTime	DATETIME,
	IN _dataList	VARCHAR(63))
BEGIN
	INSERT INTO forbid_list(roleID, forbidPlay, forbidPlayList) values(_roleID, _dateTime, _dataList)
		ON DUPLICATE KEY UPDATE forbidPlay=_dateTime, forbidPlayList = _dataList;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_gm_setForbidProfitTime`;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidProfitTime`(IN _roleID		INT,
	IN _dateTime	DATETIME)
BEGIN
	INSERT INTO forbid_list(roleID, forbidProfit) values(_roleID, _dateTime)
		ON DUPLICATE KEY UPDATE forbidProfit=_dateTime;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loadGiftNum`;
DELIMITER ;;
CREATE PROCEDURE `sp_loadGiftNum`(IN _table VARCHAR(255),

 	IN _roleID int,
	IN _giftID int)
BEGIN

  	SET @sql = concat('SELECT * FROM ', _table, ' WHERE giftID = ', _giftID,' AND roleID=',_roleID,';');

 	PREPARE stmt1 FROM  @sql;

 	EXECUTE stmt1;

 	DEALLOCATE PREPARE stmt1;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loadPlayerApplyInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_loadPlayerApplyInfo`()
BEGIN

  	SET @sql = concat('SELECT * FROM playerapply;');

 	PREPARE stmt1 FROM  @sql;

 	EXECUTE stmt1;

 	DEALLOCATE PREPARE stmt1;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loadPvpInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_loadPvpInfo`(IN _roleID	INT,

	IN _START	INT,

  	IN _LIMIT	INT)
BEGIN

   	PREPARE STMT FROM " SELECT * FROM `asyncpvp` LIMIT ?, ? ; ";

  	SET @START = _START;

  	SET @LIMIT = _LIMIT;

  	EXECUTE STMT USING @START, @LIMIT;

 	DEALLOCATE PREPARE STMT;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loadUnionApplyInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionApplyInfo`()
BEGIN

  	SET @sql = concat('SELECT * FROM unionapply;');

 	PREPARE stmt1 FROM  @sql;

 	EXECUTE stmt1;

 	DEALLOCATE PREPARE stmt1;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loadUnionInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionInfo`()
BEGIN
	ALTER TABLE `union` AUTO_INCREMENT = 10000;
  	SET @sql = concat('SELECT * FROM unioninfo;');

 	PREPARE stmt1 FROM  @sql;

 	EXECUTE stmt1;

 	DEALLOCATE PREPARE stmt1;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loadUnionMemberInfo`;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionMemberInfo`()
BEGIN

  	SET @sql = concat('SELECT * FROM unionmember;');

 	PREPARE stmt1 FROM  @sql;

 	EXECUTE stmt1;

 	DEALLOCATE PREPARE stmt1;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE PROCEDURE `sp_resetAwardScore`()
BEGIN
 	START TRANSACTION;
		UPDATE operateinfo SET awardScore = 0;
 	COMMIT;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE PROCEDURE `sp_resetCostInfo`()
BEGIN
 	START TRANSACTION;
		UPDATE operateinfo SET costInfo = '{}';
 	COMMIT;
END;;

CREATE PROCEDURE `sp_resetRechargeInfo`()
BEGIN
 	START TRANSACTION;
		UPDATE operateinfo SET rechargeNum = 0, awardInfo = '[]';
 	COMMIT;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE PROCEDURE `sp_resetSevenRecharge`()
BEGIN
 	START TRANSACTION;
		UPDATE operateinfo SET sevenRecharge = 0;
 	COMMIT;
END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveAsyncPvPRivalOffline`;
DELIMITER ;;
CREATE PROCEDURE `sp_saveAsyncPvPRivalOffline`(IN	_str  		VARCHAR(16383))
BEGIN

 	START TRANSACTION;

	SET @sqlStr =CONCAT( 'insert into `asyncpvprival` (roleID, otherID, otherType, lingliLost) values', _str,';');

	PREPARE s1 FROM @sqlStr;

	EXECUTE s1;


 	COMMIT;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveGiftNum`;
DELIMITER ;;
CREATE PROCEDURE `sp_saveGiftNum`(IN _table		VARCHAR(255),

 	IN _roleID int,
	IN _giftID int,
 	IN _str  		VARCHAR(16383))
BEGIN



	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE roleID = ', _roleID, ' AND giftID=',_giftID,';');

 	PREPARE stmt0 FROM @sql0;

 	EXECUTE stmt0;

	DEALLOCATE PREPARE stmt0;

	IF(@_count > 0) THEN

		SET @sql = concat(

			'DELETE FROM `', _table,'` WHERE roleID = ', _roleID, ' AND giftID=', _giftID,';'

		);

		PREPARE stmt1 FROM  @sql;

		EXECUTE stmt1;

		DEALLOCATE PREPARE stmt1;

	END IF;

  	IF( LENGTH( _str ) ) THEN

 		SET @sqlStr =CONCAT( 'insert into `', _table, '` values ', _str,';');

 		PREPARE s1 FROM @sqlStr;

 		EXECUTE s1;

 	END IF;



END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveList`;
DELIMITER ;;
CREATE PROCEDURE `sp_saveList`(IN _table		VARCHAR(255),

 	IN _roleID 		INT,

 	IN _str  		VARCHAR(16383))
BEGIN



	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE roleID = ', _roleID, ';');

 	PREPARE stmt0 FROM @sql0;

 	EXECUTE stmt0;

	DEALLOCATE PREPARE stmt0;

	IF(@_count > 0) THEN

		SET @sql = concat(

			'DELETE FROM `', _table,'` WHERE roleID = ', _roleID, ';'

		);

		PREPARE stmt1 FROM  @sql;

		EXECUTE stmt1;

		DEALLOCATE PREPARE stmt1;

	END IF;

  	IF( LENGTH( _str ) ) THEN

 		SET @sqlStr =CONCAT( 'insert into `', _table, '` values ', _str,';');

 		PREPARE s1 FROM @sqlStr;

 		EXECUTE s1;

 	END IF;



END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_savePlayerApply`;
DELIMITER ;;
CREATE PROCEDURE `sp_savePlayerApply`(IN _roleID INT,
	IN playerApplyInfo	    VARCHAR(4095))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;


	SELECT count(*) INTO _count FROM `playerapply` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `playerapply` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( playerApplyInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `playerapply` values', playerApplyInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	COMMIT;

  	SET _result = 0;

  	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveUnion`;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnion`(IN _unionID INT,
	IN unionInfo	    VARCHAR(4095))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;


	SELECT count(*) INTO _count FROM `unioninfo` WHERE unionID = _unionID;

	IF(_count > 0) THEN

		DELETE FROM `unioninfo` WHERE unionID = _unionID;

	END IF;

	IF( LENGTH( unionInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `unioninfo` values', unionInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	COMMIT;

  	SET _result = 0;

  	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveUnionApply`;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionApply`(IN _unionID INT,
	IN unionApplyInfo	    VARCHAR(4095))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;


	SELECT count(*) INTO _count FROM `unionapply` WHERE unionID = _unionID;

	IF(_count > 0) THEN

		DELETE FROM `unionapply` WHERE unionID = _unionID;

	END IF;

	IF( LENGTH( unionApplyInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `unionapply` values', unionApplyInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	COMMIT;

  	SET _result = 0;

  	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveUnionList`;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionList`(IN _table		VARCHAR(255),

 	IN _unionID 		INT,

 	IN _str  		VARCHAR(16383))
BEGIN



	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE unionID = ', _unionID, ';');

 	PREPARE stmt0 FROM @sql0;

 	EXECUTE stmt0;

	DEALLOCATE PREPARE stmt0;

	IF(@_count > 0) THEN

		SET @sql = concat(

			'DELETE FROM `', _table,'` WHERE unionID = ', _unionID, ';'

		);

		PREPARE stmt1 FROM  @sql;

		EXECUTE stmt1;

		DEALLOCATE PREPARE stmt1;

	END IF;

  	IF( LENGTH( _str ) ) THEN

 		SET @sqlStr =CONCAT( 'insert into `', _table, '` values ', _str,';');

 		PREPARE s1 FROM @sqlStr;

 		EXECUTE s1;

 	END IF;



END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveUnionMember`;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionMember`(IN _roleID INT,
    IN unionMemberInfo  VARCHAR(4096))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;	
	SELECT count(*) INTO _count FROM `unionmember` WHERE roleID = _roleID;

	IF(_count > 0) THEN

		DELETE FROM `unionmember` WHERE roleID = _roleID;

	END IF;

	IF( LENGTH( unionMemberInfo ) ) THEN

		SET @sqlStr =CONCAT( 'insert into `unionmember` values', unionMemberInfo,';');

		PREPARE s1 FROM @sqlStr;

		EXECUTE s1;

	END IF;

	COMMIT;

  	SET _result = 0;

  	SELECT _result;

END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_unionLoad`;
DELIMITER ;;
CREATE PROCEDURE `sp_unionLoad`(IN _table VARCHAR(255))
BEGIN

  	SET @sql = concat('SELECT * FROM ', _table,';');

 	PREPARE stmt1 FROM  @sql;

 	EXECUTE stmt1;

 	DEALLOCATE PREPARE stmt1;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE PROCEDURE `sp_updateLimitGoodsInfo`(IN _table		VARCHAR(255),

 	IN _str  		VARCHAR(16383))
BEGIN



	SET @sql0 = concat('SELECT count(*) INTO @_count FROM ', _table,';');

 	PREPARE stmt0 FROM @sql0;

 	EXECUTE stmt0;

	DEALLOCATE PREPARE stmt0;

	IF(@_count > 0) THEN

		SET @sql = concat(

			'DELETE FROM ', _table,';'

		);

		PREPARE stmt1 FROM  @sql;

		EXECUTE stmt1;

		DEALLOCATE PREPARE stmt1;

	END IF;

  	IF( LENGTH( _str ) ) THEN

 		SET @sqlStr =CONCAT( 'insert into `', _table, '` values ', _str,';');

 		PREPARE s1 FROM @sqlStr;

 		EXECUTE s1;

 	END IF;



END ;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_updateOpreateReward`;
DELIMITER ;;
CREATE PROCEDURE `sp_updateOpreateReward`(IN	_str  		VARCHAR(2047))
BEGIN
 	START TRANSACTION;
		delete from operatereward;
		insert into operatereward values(_str);
 	COMMIT;
END ;;
DELIMITER ;

ALTER TABLE role ADD COLUMN picture VARCHAR(512) NOT NULL DEFAULT '' AFTER titleID;
ALTER TABLE role ADD COLUMN nickName VARCHAR(512) NOT NULL DEFAULT '' AFTER picture;
ALTER TABLE role ADD COLUMN openID VARCHAR(512) NOT NULL DEFAULT '' AFTER nickName;

DROP PROCEDURE IF EXISTS `sp_chartLoadRoleInfo`;

DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadRoleInfo`(IN _START	INT,
  	IN _LIMIT	INT)
BEGIN
   	PREPARE STMT FROM "SELECT roleID, name, expLevel, zhanli, vipLevel, isNobility, isQQMember, picture wxPicture, nickName, openID FROM `role` LIMIT ?, ?;";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END ;;
DELIMITER ;
