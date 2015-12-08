-- MySQL dump 10.13  Distrib 5.6.11, for Win64 (x86_64)
--
-- Host: 188.188.0.163    Database: database_account
-- ------------------------------------------------------
-- Server version	5.5.24-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `database_account`
--

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `account` (
  `accountID` int(11) NOT NULL,
  `account` varchar(63) NOT NULL DEFAULT '',
  `password` varchar(63) NOT NULL DEFAULT '',
  `emailStr` varchar(127) NOT NULL DEFAULT '',
  `checkID` varchar(63) NOT NULL DEFAULT '',
  `accountType` int(11) NOT NULL DEFAULT '0',
  `openID` varchar(63) NOT NULL DEFAULT '',
  `createTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updateTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `deleteTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `canLoginTime` varchar(255) NOT NULL DEFAULT '{}',
  PRIMARY KEY (`accountID`),
  KEY `idx_openID` (`openID`,`accountType`) USING BTREE,
  KEY `idx_checkID` (`checkID`,`accountType`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loginkey`
--

DROP TABLE IF EXISTS `loginkey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loginkey` (
  `accountID` int(11) NOT NULL,
  `accountType` int(11) NOT NULL DEFAULT '0',
  `loginKey` varchar(255) NOT NULL DEFAULT '',
  `isBind` int(11) NOT NULL DEFAULT '0',
  `checkID` varchar(63) NOT NULL DEFAULT '',
  `serverUid` varchar(63) NOT NULL DEFAULT '',
  `openToken` varchar(255) NOT NULL DEFAULT '',
  `createTime` datetime NOT NULL,
  `updateTime` datetime NOT NULL,
  PRIMARY KEY (`accountID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'database_account'
--
/*!50003 DROP PROCEDURE IF EXISTS `createAccount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `createAccount`()
BEGIN
 	DECLARE _accountID 					INT(0);
 	DECLARE _account 					VARCHAR(63);
 	SET _accountID = 1;
 	WHILE _accountID< 1000 DO
 		SET _account = CONCAT('user',_accountID);
 		INSERT INTO `account` (`accountID`, `account`, `password`, `createTime`) VALUES
  		(_accountID, _account, '6666', '2013-07-08 20:21:17');
 		SET _accountID = _accountID +1;
 	END WHILE; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_bindEmail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_bindEmail`(
	IN _accountID INT,
 	IN _emailStr VARCHAR(127)
)
BEGIN
 	UPDATE `account` SET `emailStr` = _emailStr WHERE `accountID` = _accountID; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_changePassword` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_changePassword`(
	IN _accountID 		INT,
  	IN _oldpassWord		VARCHAR(63),
  	IN _newpassWord		VARCHAR(63)
)
BEGIN
  	DECLARE _tempPassWord 		VARCHAR(63);
  	DECLARE _result 		INT(0);
  	SELECT `password` INTO _tempPassWord FROM `account` WHERE `accountID` = _accountID;
  	IF( _tempPassWord IS NULL )THEN
  		SET _result = 1013;
  	ELSE
  		IF( _tempPassWord != _oldpassWord ) THEN
  			SET _result = 1012;
  		ELSE
  			UPDATE `account` SET `password` = _newpassWord WHERE `accountID` = _accountID;
  			SET _result = 0;
  		END IF;
  	END IF;
  	SELECT _result;  
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_checkAccount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_checkAccount`(
	IN _account 	VARCHAR(63)
)
BEGIN
 	DECLARE _result INT(0);
 	SELECT `accountID` INTO _result FROM `account` WHERE `account` = _account;
 	IF _result IS NULL THEN
 		SET _result = 0;
 	ELSE
  		SET _result = 1001;
 	END IF;
 	SELECT _result; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_checkLoginKey` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_checkLoginKey`(
	IN _accountID	INT,
  	IN _checkID		VARCHAR(127),
  	IN _loginKey	VARCHAR(127),
  	IN _serverUid	VARCHAR(127)
)
BEGIN
  	DECLARE _isBind 			INT;
  	DECLARE _accountType 		INT;
  	DECLARE _result 			INT;
	DECLARE _openID             VARCHAR(127);
    DECLARE _openToken			VARCHAR(255);
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_createTable` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_createTable`(
	IN _SrcDBName		VARCHAR(127),
 	IN _SrcTableName	VARCHAR(127),
 	IN _NewTableName	VARCHAR(127),
 	IN _tableNum		INT
)
BEGIN
 	DECLARE _tableName	VARCHAR(127);
 	DECLARE _index 		INT DEFAULT 0;
       WHILE _index < _tableNum DO
   		IF (_index < 10) THEN
 			SELECT CONCAT(_NewTableName, '0', _index) INTO _tableName;
 		ELSE
 			SELECT CONCAT(_NewTableName, _index) INTO _tableName;
 		END IF;
         		SET @sqlStr =CONCAT('DROP TABLE IF EXISTS ', _tableName,';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
		 		SET @sqlStr =CONCAT('CREATE TABLE ', _tableName,' LIKE ', _SrcDBName, '.', _SrcTableName, ';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
         SET _index = _index + 1;
      END WHILE;   
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getAccountCanLoginTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getAccountCanLoginTime`(
	IN _accountID		INT
)
BEGIN
 	SELECT `canLoginTime` FROM `account` WHERE `accountID` = _accountID; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getAccountMail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getAccountMail`(
	IN _account VARCHAR(63)
)
BEGIN
 	SELECT emailStr FROM `account` WHERE `account` = _account; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getDbVersion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getDbVersion`()
BEGIN
	DECLARE versionNum VARCHAR(10);
 	SELECT "1.0.0" INTO versionNum;
	SELECT versionNum;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getDeleteTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getDeleteTime`(
	IN _accountID	INT
)
BEGIN
 	DECLARE _delTime 			DATETIME;
 	DECLARE _nowTime 			DATETIME;
 	SET _nowTime = CURRENT_TIMESTAMP();
 	SELECT `deleteTime` INTO _delTime FROM `account` WHERE `accountID` = _accountID;
 	UPDATE `account` SET `deleteTime` = _nowTime WHERE `accountID` = _accountID;
 	SELECT _delTime; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getMyOpenID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getMyOpenID`(
	IN _accountID INT
)
BEGIN
	SELECT accountID, openID FROM `account` WHERE accountID=_accountID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getAccountUnbanTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getAccountUnbanTime`(
	IN _accountID		INT
)
BEGIN
 	DECLARE _UnbanTime	VARCHAR(63);
 	SELECT `canLoginTime` INTO _UnbanTime FROM `account` WHERE `accountID` = _accountID;
 	IF (_UnbanTime IS NULL) THEN
 		SET _UnbanTime = 'null';
 	END IF;
 	SELECT _UnbanTime; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_listGetLastLoginServer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_listGetLastLoginServer`(
	IN _accountID INT
)
BEGIN
 	SELECT accountID, serverUid FROM loginkey WHERE accountID = _accountID; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_load` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_load`(
	IN _table 		VARCHAR(256),
  	IN _accountID 	INT
)
BEGIN
   	SET @sql = concat('SELECT * FROM ', _table, ' WHERE accountID = ', _accountID, ';');
  	PREPARE stmt1 FROM  @sql;
  	EXECUTE stmt1;
  	DEALLOCATE PREPARE stmt1; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loginByAccount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loginByAccount`(
	IN _accountID		INT,
 	IN _account 		VARCHAR(63),
 	IN _passWord		VARCHAR(63),
 	IN _checkID			VARCHAR(63),
 	IN _loginKey 		VARCHAR(127),
	IN _sign    		INT
)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loginByCheckID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loginByCheckID`(
	IN _accountID		INT,
 	IN _accountType		INT,
 	IN _checkID		 	VARCHAR(127),
 	IN _loginKey		VARCHAR(127),
  	IN  _sign   		INT
)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loginByOpenID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loginByOpenID`(
	IN _accountID	INT,
 	IN _accountType	INT,
 	IN _openID		VARCHAR(127),
 	IN _token		VARCHAR(255),
 	IN _checkID		VARCHAR(255),
 	IN _loginKey	VARCHAR(255),
 	IN _sign        INT
)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveList`(
	IN _table		VARCHAR(256),
  	IN _accountID 	INT,
  	IN _str  		VARCHAR(16383)
)
BEGIN
 	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE accountID = ', _accountID, ';');
  	PREPARE stmt0 FROM @sql0;
  	EXECUTE stmt0;
 	DEALLOCATE PREPARE stmt0;
 	IF(@_count > 0) THEN
 		SET @sql = concat('DELETE FROM `', _table,'` WHERE accountID = ', _accountID, ';');
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_setAccountCanLoginTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_setAccountCanLoginTime`(
	IN _accountID		INT,
 	IN _canLoginTime 	VARCHAR(255)
)
BEGIN
 	DECLARE _result		INT;
 	UPDATE `account` SET `canLoginTime` = _canLoginTime WHERE `accountID` = _accountID;
 	SET _result = 0;
 	SELECT _result; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-06-23 18:05:10
