SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE `climb` MODIFY COLUMN `time`  bigint(20) NOT NULL DEFAULT 0 AFTER `customNum`;

ALTER TABLE `friend` DROP COLUMN `name`;

ALTER TABLE `friend` DROP COLUMN `zhanli`;

ALTER TABLE `friend` DROP COLUMN `expLevel`;

ALTER TABLE `friend` DROP COLUMN `loginTime`;

ALTER TABLE `friend` DROP COLUMN `tempID`;

ALTER TABLE `friend` DROP COLUMN `openID`;

ALTER TABLE `friend` DROP COLUMN `nickName`;

ALTER TABLE `friend` DROP COLUMN `district`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_chartLoadClimbScore`(IN _START	INT,
  	IN _LIMIT	INT)
BEGIN
   	PREPARE STMT FROM "SELECT roleID, weekScore*1000 as weekScore FROM `climb` LIMIT ?, ?;";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END;

DROP PROCEDURE IF EXISTS `sp_friendAddByOutside`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_friendAddByOutside`(IN friends VARCHAR(16383))
BEGIN
 	SET @sql = CONCAT('INSERT INTO `friend` 
		(`roleID`, `friendID`, `friendType`)
		VALUES', friends,';');

	PREPARE stmt FROM @sql;
	EXECUTE stmt;
	DEALLOCATE PREPARE stmt;
END;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_friendRemoveByOutside`(IN _roleID 		INT,
	IN _friendIDs 	VARCHAR(16383))
BEGIN

 	SET @sql = CONCAT('
	DELETE FROM friend WHERE roleID = ', _roleID,' AND friendID IN (', _friendIDs, ')');
 	PREPARE stmt FROM @sql;
 	EXECUTE stmt;
 	DEALLOCATE PREPARE stmt; 

END;

DROP PROCEDURE IF EXISTS `sp_gm_addRoleAssetsInfo`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_gm_addRoleAssetsInfo`(IN _roleID		INT,
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
END;

DROP PROCEDURE IF EXISTS `sp_gm_getAssetsInfo`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_gm_getAssetsInfo`(IN _roleID		INT,

	IN _tempID		INT)
BEGIN

	DECLARE _roleCount	INT;

	DECLARE _result		INT;

	DECLARE num		INT;

	SET num = 0;

	SET _result = 0;

	SELECT count(*) INTO _roleCount FROM role WHERE roleID = _roleID;

	IF(_roleCount > 0) THEN

		SELECT `num` INTO num FROM `assets` WHERE `roleID` = _roleID AND `tempID` = _tempID;

	ELSE


		SET _result = 5;

	END IF;

	SELECT _result, num;

END;

DROP PROCEDURE IF EXISTS `sp_gm_getPlayerInfo`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_gm_getPlayerInfo`(IN _roleID	INT)
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

END;

DROP PROCEDURE IF EXISTS `sp_saveList`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_saveList`(IN _table		VARCHAR(255),

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



END;

DROP PROCEDURE `sp_friendAdd`;

DROP PROCEDURE `sp_friendAgree`;

DROP PROCEDURE `sp_friendDel`;

DROP PROCEDURE `sp_friendGetRolesByAccounts`;

SET FOREIGN_KEY_CHECKS=1;