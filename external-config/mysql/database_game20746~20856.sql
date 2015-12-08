SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE `role` ADD COLUMN `refreshTime`  datetime NOT NULL DEFAULT '0000-00-00 00:00:00' AFTER `activeInsetSuitID`;

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
	IN rewardmisInfo	    VARCHAR(4095))
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

END;;

DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_refreshPhyList`;

DELIMITER ;;
CREATE PROCEDURE `sp_refreshPhyList`(IN _roleID INT)
BEGIN

  	UPDATE `friendphysical` SET givePhy = 0, receivePhy = 0 WHERE `roleID` = _roleID;

END;;

DELIMITER ;

SET FOREIGN_KEY_CHECKS=1;

