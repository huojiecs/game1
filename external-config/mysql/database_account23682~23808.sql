SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `black_checkid` ADD COLUMN `serverUid`  varchar(45) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `checkID`;

ALTER TABLE `black_checkid` DROP PRIMARY KEY;

ALTER TABLE `black_checkid` ADD PRIMARY KEY (`checkID`, `serverUid`);

ALTER TABLE `black_openid` ADD COLUMN `serverUid`  varchar(45) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `openID`;

ALTER TABLE `black_openid` DROP PRIMARY KEY;

ALTER TABLE `black_openid` ADD PRIMARY KEY (`openID`, `serverUid`);

ALTER TABLE `white_checkid` ADD COLUMN `serverUid`  varchar(45) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `checkID`;

ALTER TABLE `white_checkid` DROP PRIMARY KEY;

ALTER TABLE `white_checkid` ADD PRIMARY KEY (`checkID`, `serverUid`);

ALTER TABLE `white_openid` ADD COLUMN `serverUid`  varchar(45) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER `openID`;

ALTER TABLE `white_openid` DROP PRIMARY KEY;

ALTER TABLE `white_openid` ADD PRIMARY KEY (`openID`, `serverUid`);


DROP PROCEDURE IF EXISTS `sp_checkAccountType`;
DELIMITER ;;
CREATE PROCEDURE `sp_checkAccountType`(
	IN _openID		VARCHAR(127),
	IN _checkID		VARCHAR(127), 
	IN _serverUid 	INT)
BEGIN
	DECLARE _result			INT;
	DECLARE _blackopenid 	VARCHAR(127);
	DECLARE _blackchenkid 	VARCHAR(127);
	DECLARE _whiteopenid 	VARCHAR(127);
	DECLARE _whitechenkid 	VARCHAR(127);
	SET _result = 0;
	SELECT count(*) INTO _blackchenkid FROM `black_checkid` WHERE `checkID` = _checkID AND `serverUid` = _serverUid;
	IF (_openID IS NOT NULL) THEN
		SELECT count(*)  INTO _blackopenid FROM `black_openid` WHERE `openID` = _openID AND `serverUid` = _serverUid;
	END IF;
	IF (_blackchenkid >0 || _blackopenid >0) THEN
		SET _result = 43;
	END IF;
	SELECT count(*)  INTO _whitechenkid FROM `white_checkid` WHERE `checkID` = _checkID AND `serverUid` = _serverUid;
	IF (_openID IS NOT NULL) THEN
		SELECT count(*)  INTO _whiteopenid FROM `white_openid` WHERE `openID` = _openID AND `serverUid` = _serverUid;
	END IF;
	IF (_whitechenkid >0 || _whiteopenid >0) THEN
		SET _result = 54;
	END IF;
	SELECT _result;
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loginByAccount`;
DELIMITER ;;
CREATE PROCEDURE `sp_loginByAccount`(
	IN _accountID		INT,
	IN _account 		VARCHAR(63),
	IN _passWord		VARCHAR(63),
	IN _checkID			VARCHAR(63),
	IN _loginKey 		VARCHAR(127),
    IN _sign    		INT)
BEGIN
	DECLARE _oldactID 		INT(0);
	DECLARE _result 		INT(0);
	DECLARE _isRegister		INT;
	DECLARE _datetime		DATETIME;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
	SET _isRegister = 0;
	SELECT `accountID` INTO _oldactID FROM `account` WHERE `account` = _account AND `passWord` = _passWord;
	SET _result = 42;
	IF( _oldactID IS NULL AND _sign = 1)THEN
		INSERT INTO `account`(`accountID`, `account`, `password`, `accountType`,`createTime`, `updateTime`)
			VALUES (_accountID,  _account, _passWord, 2, _datetime, _datetime);
		SET _result = 0;
	END IF; 
	IF(_sign = 1) THEN
		INSERT INTO loginkey(`accountID`, `loginKey`, `isBind`, `accountType`, `checkID`, `createTime`, `updateTime`)
			VALUES( _accountID, _loginKey, 0, 2, _checkID, _datetime, _datetime)
 		ON DUPLICATE KEY UPDATE `loginKey` = _loginKey,	`checkID` = _checkID, `updateTime` = _datetime; 
	SET _result = 0;
	END IF;
	SELECT _result, _loginKey, _isRegister;
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loginByCheckID`;
DELIMITER ;;
CREATE PROCEDURE `sp_loginByCheckID`(
	IN _accountID		INT,
	IN _accountType		INT,
	IN _checkID		 	VARCHAR(127),
	IN _loginKey		VARCHAR(127), 
	IN  _sign   		INT)
BEGIN
	DECLARE _oldactID 		INT;
	DECLARE _result 		INT;
	DECLARE _isRegister		INT;
	DECLARE _datetime		DATETIME;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
	SET _isRegister = 0;	
	SELECT `accountID` INTO _oldactID FROM `account`WHERE accountType = _accountType and `checkID` = _checkID;
	IF( _oldactID IS NULL AND _sign = 1) THEN
		INSERT INTO `account`(`accountID`, `checkID`, `accountType`, `createTime`, `updateTime`) 
			VALUES (_accountID, _checkID, _accountType, _datetime, _datetime);
		SET _isRegister = 1;
	END IF;
	SET _result = 42;
	IF(_sign = 1) THEN
	INSERT INTO loginkey(`accountID`, `loginKey`, `accountType`, `checkID`, `createTime`, `updateTime`) 
		VALUES ( _accountID, _loginKey, _accountType, _checkID, _datetime, _datetime)
		ON DUPLICATE KEY UPDATE `loginKey` = _loginKey,	`accountType` = _accountType, `checkID` = _checkID, `updateTime` = _datetime;
       SET _result = 0;
	END IF;
	SELECT  _result, _loginKey, _isRegister;
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_loginByOpenID`;
DELIMITER ;;
CREATE PROCEDURE `sp_loginByOpenID`(
	IN _accountID	INT,
	IN _accountType	INT,
	IN _openID		VARCHAR(127),
	IN _token		VARCHAR(255),
	IN _checkID		VARCHAR(255),
	IN _loginKey	VARCHAR(255),
	IN _sign        INT)
BEGIN
	DECLARE _oldactID		INT;
	DECLARE _result			INT;
	DECLARE _isRegister		INT;
	DECLARE _datetime		DATETIME;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
	SET _isRegister = 0;
	SELECT `accountID` INTO _oldactID FROM `account` WHERE `openID` = _openID AND accountType = _accountType;
	IF( _oldactID IS NULL AND _sign = 1 ) THEN
		INSERT INTO `account`(`accountID`, `checkID`, `accountType`, `openID`, `createTime`, `updateTime`)
			VALUES (_accountID, _checkID, _accountType, _openID, _datetime, _datetime);
		SET _isRegister = 1;
	END IF;
	SET _result = 42; 
	IF(_sign = 1) THEN
		INSERT INTO loginkey(`accountID`, `loginKey`, `accountType`, `checkID`, `openToken`, `createTime`, `updateTime`)
			VALUES( _accountID, _loginKey, _accountType, _checkID, _token, _datetime, _datetime)
			ON DUPLICATE KEY UPDATE `loginKey` = _loginKey, `accountType` = _accountType,
				`checkID` = _checkID, `openToken` = _token, `updateTime` = _datetime;
		SET _result = 0;
END IF;
	SELECT _result, _loginKey, _isRegister;
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveCodeList`;
DELIMITER ;;
CREATE DEFINER = `root`@`%` PROCEDURE `sp_saveCodeList`(IN _table		VARCHAR(256),
 	IN _giftcodeID 	VARCHAR(64),
 	IN _str  		VARCHAR(20000))
BEGIN
-- 	START TRANSACTION;
	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE giftcodeID = ', _giftcodeID, ';');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
	IF(@_count > 0) THEN
		SET @sql = concat(
			'DELETE FROM `', _table,'` WHERE giftcodeID = ', _giftcodeID, ';'
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
-- 	COMMIT;
END;;
DELIMITER ;
SET FOREIGN_KEY_CHECKS=1;


