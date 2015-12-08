SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE `loginkey` ADD COLUMN `openToken`  varchar(63) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' AFTER `serverUid`;

ALTER TABLE `loginkey` MODIFY COLUMN `createTime`  datetime NOT NULL AFTER `openToken`;

ALTER TABLE `loginkey` MODIFY COLUMN `updateTime`  datetime NOT NULL AFTER `createTime`;

DROP PROCEDURE IF EXISTS `sp_checkAccountType`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_checkAccountType`(IN _openID		VARCHAR(127),

	IN _checkID		VARCHAR(127))
BEGIN

	DECLARE _result			INT;

	DECLARE _blackopenid 	VARCHAR(127);

	DECLARE _blackchenkid 	VARCHAR(127);

	DECLARE _whiteopenid 	VARCHAR(127);

	DECLARE _whitechenkid 	VARCHAR(127);

	SET _result = 0;

	SELECT `checkID` INTO _blackchenkid FROM `black_checkid` WHERE `checkID` = _checkID;

	IF (_openID IS NOT NULL) THEN

		SELECT `openID` INTO _blackopenid FROM `black_openid` WHERE `openID` = _openID;

	END IF;

	IF (_blackchenkid IS NOT NULL || _blackopenid IS NOT NULL) THEN



		SET _result = 43;

	END IF;

	

	SELECT `checkID` INTO _whitechenkid FROM `white_checkid` WHERE `checkID` = _checkID;

	IF (_openID IS NOT NULL) THEN

		SELECT `openID` INTO _whiteopenid FROM `white_openid` WHERE `openID` = _openID;

	END IF;

	IF (_whitechenkid IS NOT NULL || _whiteopenid IS NOT NULL) THEN



		SET _result = 54;

	END IF;

	SELECT _result;

END;

DROP PROCEDURE IF EXISTS `sp_checkLoginKey`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_checkLoginKey`(IN _accountID	INT,
 	IN _checkID		VARCHAR(127),
 	IN _loginKey	VARCHAR(127),
 	IN _serverUid	VARCHAR(127))
BEGIN

 	DECLARE _isBind 			INT;
 	DECLARE _accountType 		INT;
 	DECLARE _result 			INT;
    DECLARE _openID             VARCHAR(127);
    DECLARE _openToken			VARCHAR(127);
 	DECLARE _retServerUid       VARCHAR(127);
 	DECLARE _retCheckID         VARCHAR(127);

  	SELECT `isBind`, `accountType`, `serverUid`, `checkID`, `openToken`
		INTO _isBind, _accountType, _retServerUid, _retCheckID, _openToken
 		FROM `loginkey`
  		WHERE `accountID` = _accountID AND `loginKey` = _loginKey;

 	IF _isBind IS NULL THEN
  		SET _result = 1004;
  	ELSE

 		IF _serverUid != _retServerUid THEN
 			UPDATE `loginkey` SET `serverUid` = _serverUid
 				WHERE `accountID` = _accountID AND `loginKey` = _loginKey;
 		END IF;

 		IF _accountType >= 3 THEN
 			SELECT `openID` INTO _openID FROM `account`	WHERE `accountID` =_accountID;
 		END IF;

 		SET _result = 0;

 	END IF;

  	SELECT _result, _isBind, _accountType, _openID, _retServerUid, _retCheckID, _openToken;

END;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_friendGetRoleListByOpenIds`(IN _openIDs 	VARCHAR(16383))
BEGIN

 	SET @sql = CONCAT('select roleID, openid.accountID, roleName, openID, serverUid, updateTime
	from openid 
	left join rolename
	on openid.accountID = rolename.accountID
	where openID in (', _openIDs, ')');

 	PREPARE stmt FROM @sql;

 	EXECUTE stmt;

 	DEALLOCATE PREPARE stmt; 

END;

DROP PROCEDURE IF EXISTS `sp_loginByCheckID`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_loginByCheckID`(IN _accountID		INT,

	IN _accountType		INT,

	IN _checkID		 	VARCHAR(127),

	IN _loginKey		VARCHAR(127))
BEGIN

	DECLARE _oldactID 		INT;

	DECLARE _result 		INT;

	DECLARE _isRegister		INT;

	DECLARE _datetime		DATETIME;



	SELECT CURRENT_TIMESTAMP() INTO _datetime;

	SET _isRegister = 0;

	

	SELECT `accountID` INTO _oldactID FROM `account`

		WHERE accountType = _accountType and `checkID` = _checkID;



	IF( _oldactID IS NULL ) THEN

		INSERT INTO `account`(`accountID`, `checkID`, `accountType`,

							  `createTime`, `updateTime`) VALUES

			(_accountID, _checkID, _accountType, _datetime, _datetime);

		SET _isRegister = 1;

	END IF;



	SET _result = 0;





	INSERT INTO loginkey(`accountID`, `loginKey`, `accountType`, 

		`checkID`, `createTime`, `updateTime`) VALUES ( _accountID, 

		_loginKey, _accountType, _checkID, _datetime, _datetime)

		ON DUPLICATE KEY UPDATE `loginKey` = _loginKey,

		`accountType` = _accountType, `checkID` = _checkID, `updateTime` = _datetime;



	SELECT _result, _loginKey, _isRegister;

END;

DROP PROCEDURE IF EXISTS `sp_loginByOpenID`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_loginByOpenID`(IN _accountID	INT,
	IN _accountType	INT,
	IN _openID		VARCHAR(127),
	IN _token		VARCHAR(127),
	IN _checkID		VARCHAR(127),
	IN _loginKey	VARCHAR(127))
BEGIN

	DECLARE _oldactID		INT;
	DECLARE _result			INT;
	DECLARE _isRegister		INT;
	DECLARE _datetime		DATETIME;

	SELECT CURRENT_TIMESTAMP() INTO _datetime;

	SET _isRegister = 0;

	SELECT `accountID` INTO _oldactID FROM `account`
		WHERE `openID` = _openID AND accountType = _accountType;

	IF( _oldactID IS NULL ) THEN

		INSERT INTO `account`(`accountID`, `checkID`, `accountType`, 
			`openID`, `createTime`, `updateTime`)
			VALUES (_accountID, _checkID, _accountType, _openID, _datetime, _datetime);

		SET _isRegister = 1;

	END IF;

	SET _result = 0;

	INSERT INTO loginkey(`accountID`, `loginKey`, `accountType`, 

						`checkID`, `openToken`, `createTime`, `updateTime`)

		VALUES( _accountID, _loginKey, _accountType, 

				_checkID, _token, _datetime, _datetime)

		ON DUPLICATE KEY UPDATE `loginKey` = _loginKey, `accountType` = _accountType,

				`checkID` = _checkID, `openToken` = _token, `updateTime` = _datetime;

	SELECT _result, _loginKey, _isRegister;

END;

DROP PROCEDURE IF EXISTS `sp_saveList`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_saveList`(IN _table		VARCHAR(256),

 	IN _accountID 	INT,

 	IN _str  		VARCHAR(16383))
BEGIN



	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE accountID = ', _accountID, ';');

 	PREPARE stmt0 FROM @sql0;

 	EXECUTE stmt0;

	DEALLOCATE PREPARE stmt0;

	IF(@_count > 0) THEN

		SET @sql = concat(

			'DELETE FROM `', _table,'` WHERE accountID = ', _accountID, ';'

		);

		PREPARE stmt1 FROM  @sql;

		EXECUTE stmt1;

		DEALLOCATE PREPARE stmt1;

	END IF;

  	IF( LENGTH( _str ) ) THEN

 		SET @sqlStr =CONCAT( 'insert into `', _table, '` values ', _str,';');

 		PREPARE s1 FROM @sqlStr;

 		EXECUTE s1;

		DEALLOCATE PREPARE s1;

 	END IF;



END;

SET FOREIGN_KEY_CHECKS=1;