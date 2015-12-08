-- MySQL dump 10.13  Distrib 5.6.11, for Win64 (x86_64)
--
-- Host: 188.188.0.163    Database: database_account_global
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
-- Current Database: `database_account_global`
--


--
-- Table structure for table `black_checkid`
--

DROP TABLE IF EXISTS `black_checkid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `black_checkid` (
  `checkID` varchar(63) NOT NULL DEFAULT '',
  `serverUid` varchar(45) NOT NULL,
  PRIMARY KEY (`checkID`,`serverUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `black_openid`
--

DROP TABLE IF EXISTS `black_openid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `black_openid` (
  `openID` varchar(63) NOT NULL DEFAULT '',
  `serverUid` varchar(45) NOT NULL,
  PRIMARY KEY (`openID`,`serverUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deviceinfo`
--

DROP TABLE IF EXISTS `deviceinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deviceinfo` (
  `checkID` varchar(63) NOT NULL DEFAULT '',
  `ipAddress` varchar(31) NOT NULL DEFAULT '',
  `deviceModel` varchar(127) NOT NULL DEFAULT '',
  `deviceName` varchar(127) NOT NULL DEFAULT '',
  `deviceType` int(11) NOT NULL DEFAULT '0',
  `deviceUniqueIdentifier` varchar(127) NOT NULL DEFAULT '',
  `graphicsDeviceID` int(11) NOT NULL DEFAULT '0',
  `graphicsDeviceName` varchar(127) NOT NULL DEFAULT '',
  `graphicsDeviceVendor` varchar(127) NOT NULL DEFAULT '',
  `graphicsDeviceVendorID` int(11) NOT NULL DEFAULT '0',
  `graphicsDeviceVersion` varchar(127) NOT NULL DEFAULT '',
  `graphicsMemorySize` int(11) NOT NULL DEFAULT '0',
  `graphicsPixelFillrate` int(11) NOT NULL DEFAULT '0',
  `graphicsShaderLevel` int(11) NOT NULL DEFAULT '0',
  `npotSupport` int(11) NOT NULL DEFAULT '0',
  `operatingSystem` varchar(127) NOT NULL DEFAULT '',
  `processorCount` int(11) NOT NULL DEFAULT '0',
  `processorType` varchar(127) NOT NULL DEFAULT '',
  `supportedRenderTargetCount` int(11) NOT NULL DEFAULT '0',
  `supports3DTextures` int(11) NOT NULL DEFAULT '0',
  `supportsAccelerometer` int(11) NOT NULL DEFAULT '0',
  `supportsComputeShaders` int(11) NOT NULL DEFAULT '0',
  `supportsGyroscope` int(11) NOT NULL DEFAULT '0',
  `supportsImageEffects` int(11) NOT NULL DEFAULT '0',
  `supportsInstancing` int(11) NOT NULL DEFAULT '0',
  `supportsLocationService` int(11) NOT NULL DEFAULT '0',
  `supportsRenderTextures` int(11) NOT NULL DEFAULT '0',
  `supportsRenderToCubemap` int(11) NOT NULL DEFAULT '0',
  `supportsShadows` int(11) NOT NULL DEFAULT '0',
  `supportsStencil` int(11) NOT NULL DEFAULT '0',
  `supportsVibration` int(11) NOT NULL DEFAULT '0',
  `systemMemorySize` int(11) NOT NULL DEFAULT '0',
  `loginTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `extravippoint`
--

DROP TABLE IF EXISTS `extravippoint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `extravippoint` (
  `accountID` int(11) NOT NULL,
  `serverUid` int(11) NOT NULL,
  `point` int(11) DEFAULT '0',
  PRIMARY KEY (`accountID`,`serverUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `giftcode`
--

DROP TABLE IF EXISTS `giftcode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `giftcode` (
  `giftcodeID` varchar(64) NOT NULL,
  `giftID` int(11) NOT NULL DEFAULT '0',
  `createDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `frequency` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`giftcodeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `openid`
--

DROP TABLE IF EXISTS `openid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `openid` (
  `accountID` int(11) NOT NULL AUTO_INCREMENT,
  `openID` varchar(63) NOT NULL,
  PRIMARY KEY (`accountID`),
  KEY `index_openID` (`openID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rolename`
--

DROP TABLE IF EXISTS `rolename`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rolename` (
  `roleID` int(11) NOT NULL AUTO_INCREMENT,
  `roleName` varchar(63) NOT NULL,
  `accountID` int(11) NOT NULL,
  `serverUid` varchar(63) DEFAULT NULL,
  `createTime` datetime NOT NULL,
  `updateTime` datetime NOT NULL,
  PRIMARY KEY (`roleID`),
  UNIQUE KEY `roleName_UNIQUE` (`roleName`) USING BTREE,
  KEY `idx_accountID_serverUid` (`accountID`,`serverUid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `statisticalinfo`
--

DROP TABLE IF EXISTS `statisticalinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `statisticalinfo` (
  `accountID` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `checkID` varchar(255) NOT NULL,
  PRIMARY KEY (`accountID`,`token`,`checkID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `union`
--

DROP TABLE IF EXISTS `union`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `union` (
  `unionID` int(11) NOT NULL AUTO_INCREMENT,
  `unionName` varchar(63) NOT NULL,
  `createTime` datetime NOT NULL,
  `updateTime` datetime NOT NULL,
  PRIMARY KEY (`unionID`),
  UNIQUE KEY `unionID_UNIQUE` (`unionID`) USING BTREE,
  UNIQUE KEY `unionName_UNIQUE` (`unionName`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `white_checkid`
--

DROP TABLE IF EXISTS `white_checkid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `white_checkid` (
  `checkID` varchar(63) NOT NULL DEFAULT '',
  `serverUid` varchar(45) NOT NULL,
  PRIMARY KEY (`checkID`,`serverUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `white_openid`
--

DROP TABLE IF EXISTS `white_openid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `white_openid` (
  `openID` varchar(63) NOT NULL DEFAULT '',
  `serverUid` varchar(45) NOT NULL,
  PRIMARY KEY (`openID`,`serverUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'database_account_global'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_checkAccountType` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_checkAccountType`(IN _openID		VARCHAR(127),
	IN _checkID		VARCHAR(127), 
	IN _serverUid 	INT)
BEGIN
	DECLARE _result			INT;
	DECLARE _blackopenid 	VARCHAR(127);
	DECLARE _blackchenkid 	VARCHAR(127);
	DECLARE _whiteopenid 	VARCHAR(127);
	DECLARE _whitechenkid 	VARCHAR(127);
    DECLARE _checkUid 	VARCHAR(127);
    DECLARE _openUid 	VARCHAR(127);
    DECLARE _blackcheckUid 	VARCHAR(127);
    DECLARE _blackopenUid 	VARCHAR(127);

      
	SET _result = 0;
     
	SELECT count(*) INTO _blackchenkid FROM `black_checkid` WHERE `checkID` = _checkID AND `serverUid` = _serverUid;
	IF (_openID IS NOT NULL) THEN
		SELECT count(*)  INTO _blackopenid FROM `black_openid` WHERE `openID` = _openID AND `serverUid` = _serverUid;
	END IF;
	IF (_blackchenkid >0 || _blackopenid >0) THEN
		SET _result = 43;
	END IF;

    
    SELECT count(*) INTO _blackchenkid FROM `black_checkid` WHERE `checkID` = _checkID;
	IF (_openID IS NOT NULL) THEN
		SELECT count(*)  INTO _blackopenid FROM `black_openid` WHERE `openID` = _openID;
	END IF;
    
    IF (_blackchenkid >0 OR _blackopenid >0) THEN
         SELECT `serverUid` INTO _blackcheckUid FROM `black_checkid` WHERE `checkID` = _checkID;
		 IF(_openID IS NOT NULL) THEN
           SELECT `serverUid`  INTO _blackopenUid FROM `black_openid` WHERE `openID` = _openID ;
         END IF;
		 
	END IF;

    IF(_blackcheckUid = 1 OR _blackopenUid = 1) THEN 
        SET _result = 43;
	  END IF;

      IF(_blackcheckUid = _serverUid OR _blackopenUid = _serverUid) THEN 
        SET _result = 43;
	  END IF;

     SELECT count(*)  INTO _whitechenkid FROM `white_checkid` WHERE `checkID` = _checkID;

     IF (_openID IS NOT NULL) THEN
		SELECT count(*)  INTO _whiteopenid FROM `white_openid` WHERE `openID` = _openID ;
	 END IF;

     IF(_whitechenkid > 0 OR _whiteopenid > 0 ) THEN 
	    SELECT `serverUid`  INTO _checkUid FROM `white_checkid` WHERE `checkID` = _checkID;
	    IF (_openID IS NOT NULL) THEN
		   SELECT `serverUid`  INTO _openUid FROM `white_openid` WHERE `openID` = _openID ;
	    END IF;
	 END IF;
	
      IF(_checkUid = 1 OR _openUid = 1) THEN 
        SET _result = 54;
	  END IF;

      IF(_checkUid = _serverUid OR _openUid = _serverUid) THEN 
        SET _result = 54;
	  END IF;

      IF((_checkUid <> _serverUid AND _result <> 54) OR (_openUid <> _serverUid AND _result <> 54)) THEN 
	    SET _result = 0;
	  END IF;
 
	  SELECT _result;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_checkRoleName` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_checkRoleName`(IN _roleName		VARCHAR(63),
	IN _accountID		INT)
BEGIN
	DECLARE _resultID		INT(0);
	DECLARE _datetime		DATETIME;
	DECLARE _result			INT(0);
	DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET _result = 1006;
	SET _result = 0;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
 	START TRANSACTION;
		INSERT INTO `rolename`(`roleName`,`accountID`, `createTime`, `updateTime`) VALUES (_roleName,_accountID, _datetime, _datetime);		
		SET _resultID = LAST_INSERT_ID();
		SELECT _result, _resultID;
	COMMIT;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_checkUnionName` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_checkUnionName`(IN _unionName		VARCHAR(63))
BEGIN
	DECLARE _resultID		INT(0);
	DECLARE _datetime		DATETIME;
	DECLARE _result			INT(0);
	DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET _result = 12006;
	SET _result = 0;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
 	START TRANSACTION;		ALTER TABLE `union` AUTO_INCREMENT=10000;
		INSERT INTO `union`(`unionName`,`createTime`, `updateTime`) VALUES (_unionName, _datetime, _datetime);		
		SET _resultID = LAST_INSERT_ID();
		SELECT _result, _resultID;
	COMMIT;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteRoleName` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteRoleName`(IN _roleName		VARCHAR(63))
BEGIN
	DECLARE _count					INT(1);
 	START TRANSACTION;
		SELECT count(*) INTO _count FROM `rolename` WHERE `roleName`=_roleName;
		IF(_count > 0) THEN
			DELETE FROM `rolename` WHERE `roleName`=_roleName;
		END IF;
COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteUnionName` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deviceAddInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deviceAddInfo`(IN _checkID 					VARCHAR(63),
	IN _ipAddress 					VARCHAR(31),
	IN _deviceModel 				VARCHAR(127),
	IN _deviceName 					VARCHAR(127),
	IN _deviceType 					INT,
	IN _deviceUniqueIdentifier 		VARCHAR(127),
	IN _graphicsDeviceID 			INT,
	IN _graphicsDeviceName 			VARCHAR(127),
	IN _graphicsDeviceVendor 		VARCHAR(127),
	IN _graphicsDeviceVendorID 		INT,
	IN _graphicsDeviceVersion 		VARCHAR(127),
	IN _graphicsMemorySize			INT,
	IN _graphicsPixelFillrate		INT,
	IN _graphicsShaderLevel 		INT,
	IN _npotSupport 				INT,
	IN _operatingSystem 			VARCHAR(127),
	IN _processorCount 				INT,
	IN _processorType 				VARCHAR(127),
	IN _supportedRenderTargetCount	INT,
	IN _supports3DTextures			INT,
	IN _supportsAccelerometer		INT,
	IN _supportsComputeShaders		INT,
	IN _supportsGyroscope 			INT,
	IN _supportsImageEffects 		INT,
	IN _supportsInstancing 			INT,
	IN _supportsLocationService		INT,
	IN _supportsRenderTextures		INT,
	IN _supportsRenderToCubemap 	INT,
	IN _supportsShadows				INT,
	IN _supportsStencil 			INT,
	IN _supportsVibration 			INT,
	IN _systemMemorySize 			INT)
BEGIN
	INSERT INTO deviceinfo(`checkID`,`ipAddress`,`deviceModel`,`deviceName`,`deviceType`,`deviceUniqueIdentifier`,
		`graphicsDeviceID`,`graphicsDeviceName`,`graphicsDeviceVendor`,`graphicsDeviceVendorID`,`graphicsDeviceVersion`,
		`graphicsMemorySize`,`graphicsPixelFillrate`,`graphicsShaderLevel`,`npotSupport`,`operatingSystem`,`processorCount`,
		`processorType`,`supportedRenderTargetCount`,`supports3DTextures`,`supportsAccelerometer`,`supportsComputeShaders`,
		`supportsGyroscope`,`supportsImageEffects`,`supportsInstancing`,`supportsLocationService`,`supportsRenderTextures`,
		`supportsRenderToCubemap`,`supportsShadows`,`supportsStencil`,`supportsVibration`,`systemMemorySize`, `loginTime`)
	VALUES (_checkID,_ipAddress,_deviceModel,_deviceName,_deviceType,_deviceUniqueIdentifier,
		_graphicsDeviceID,_graphicsDeviceName,_graphicsDeviceVendor,_graphicsDeviceVendorID,_graphicsDeviceVersion,
		_graphicsMemorySize,_graphicsPixelFillrate,_graphicsShaderLevel,_npotSupport,_operatingSystem,_processorCount,
		_processorType,_supportedRenderTargetCount,_supports3DTextures,_supportsAccelerometer,_supportsComputeShaders,
		_supportsGyroscope,_supportsImageEffects,_supportsInstancing,_supportsLocationService,_supportsRenderTextures,
		_supportsRenderToCubemap,_supportsShadows,_supportsStencil,_supportsVibration,_systemMemorySize,CURRENT_TIMESTAMP());
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_friendGetRoleListByOpenIds` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_friendGetRoleListByOpenIds`(IN _openIDs 	VARCHAR(16383))
BEGIN
 	SET @sql = CONCAT('select roleID, openid.accountID, roleName, openID, serverUid, updateTime
	from rolename 
	left join openid
	on openid.accountID = rolename.accountID
	where openID in (', _openIDs, ')');
 	PREPARE stmt FROM @sql;
 	EXECUTE stmt;
 	DEALLOCATE PREPARE stmt; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getAccountID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getAccountID`(IN _openID		 	VARCHAR(63))
BEGIN
	DECLARE _accountID 				INT;
	SELECT `accountID` INTO _accountID FROM `openid` WHERE `openID` = _openID;
	IF( _accountID IS NULL ) THEN
		INSERT INTO `openid`(`openID`) VALUES (_openID);
		SET _accountID = LAST_INSERT_ID();
	END IF;
	SELECT _accountID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getAccountIDByOpenID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getAccountIDByOpenID`(IN _openID 	VARCHAR(127))
BEGIN
	DECLARE _accountID		INT;
	SELECT `accountID` INTO _accountID FROM `openid` WHERE `openID` = _openID;
	IF (_accountID IS NULL) THEN
		SET _accountID = 0;
	END IF;
	SELECT _accountID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getAccountsByOpenID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getAccountsByOpenID`(IN type 	INT, 
	IN OpenIDs 	VARCHAR(16383))
BEGIN
 	SET @sql = CONCAT('SELECT accountID, openID	FROM `openid` WHERE  openID IN (', OpenIDs, ')');
 	PREPARE stmt FROM @sql;
 	EXECUTE stmt;
 	DEALLOCATE PREPARE stmt; 
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
/*!50003 DROP PROCEDURE IF EXISTS `sp_getGiftCode` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getGiftCode`(IN _table		VARCHAR(256), 	IN _giftcodeID 	VARCHAR(64))
BEGIN
-- 	START TRANSACTION;
	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE giftcodeID=', _giftcodeID,' AND frequency>0;');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
	IF(@_count > 0) THEN
		SET @sql = concat(
			'UPDATE `', _table,'` SET frequency=frequency-1 WHERE giftcodeID = ', _giftcodeID, ';'
		);
		PREPARE stmt1 FROM  @sql;
		EXECUTE stmt1;
		DEALLOCATE PREPARE stmt1;
	END IF;
  	IF( @_count > 0 ) THEN
 		SET @sqlStr =CONCAT( 'SELECT *  FROM `', _table, '` WHERE giftcodeID = ', _giftcodeID, ';');
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
/*!50003 DROP PROCEDURE IF EXISTS `sp_getRoleIDByName` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getRoleIDByName`(_name VARCHAR(63))
BEGIN
	DECLARE _roleID	INT(0);
   	SELECT `roleID` INTO _roleID FROM `rolename` WHERE `roleName` = _name;
	IF _roleID IS NULL THEN
		SET _roleID = 0;
	END IF;
	SELECT _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getRoleIDList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getRoleIDList`(IN _accountID		INT,
	IN _serverUid		VARCHAR(63))
BEGIN
 	SELECT roleID FROM `rolename` WHERE `accountID` = _accountID AND `serverUid` = _serverUid;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getRoleIdsByServerUid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleIdsByServerUid`(IN _serverUid INT)
BEGIN
	SELECT roleID FROM rolename WHERE serverUid = _serverUid;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getRoleInfoByName` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleInfoByName`(IN _roleName VARCHAR(127))
BEGIN
	SELECT roleID, serverUid, openID FROM openid
		LEFT JOIN rolename
		ON openid.accountID = rolename.accountID
		WHERE roleName = _roleName;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getRoleList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleList`(IN _openID VARCHAR(127))
BEGIN
	SELECT roleID, serverUid FROM openid
		LEFT JOIN rolename
		ON openid.accountID = rolename.accountID
		WHERE openID = _openID;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getRoleListByServerUid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleListByServerUid`(
	IN `_openid` 	VARCHAR(127),	
	IN `_serveruid` int
)
BEGIN
	SELECT roleID FROM openid LEFT JOIN rolename ON openid.accountID = rolename.accountID
		WHERE openID = _openID AND serverUid = _serveruid;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_idip_getInfoByRoleID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_idip_getInfoByRoleID`(IN _roleID 		INT,
	IN _openID 		VARCHAR(127),
	IN _serverUid 	VARCHAR(127))
BEGIN
	IF _roleID > 0 THEN 
		SELECT roleID, openid.accountID FROM openid
			LEFT JOIN rolename
			ON openid.accountID = rolename.accountID
			WHERE openID = _openID AND rolename.roleID = _roleID AND rolename.serverUid = _serverUid;
	ELSE 
		SELECT roleID, openid.accountID FROM openid
			LEFT JOIN rolename
			ON openid.accountID = rolename.accountID
			WHERE openID = _openID;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_listGetRoleList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_listGetRoleList`(IN _accountID INT)
BEGIN
	SELECT accountID, roleID, serverUid, updateTime FROM rolename WHERE accountID = _accountID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_queryAccountIDAndOpenID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_queryAccountIDAndOpenID`(IN acountIDs VARCHAR(16383))
BEGIN    	
	SET @sql = CONCAT('SELECT accountID, openID FROM `openid` WHERE  accountID IN (', acountIDs, ')');
	PREPARE stmt FROM @sql;
	EXECUTE stmt;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_queryAccountIDAndRoleID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_queryAccountIDAndRoleID`(IN _roleIDArr VARCHAR(16383))
BEGIN
	SET @sql=CONCAT('SELECT roleID, accountID FROM `rolename` WHERE roleID IN (',_roleIDArr,')');
    PREPARE stmt FROM @sql;
	EXECUTE stmt;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_registerAccount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_registerAccount`(IN _account 	VARCHAR(63),
	IN _password 	VARCHAR(63),
	IN _checkID 	VARCHAR(63),
	IN _rType	 	INT)
BEGIN
	DECLARE _accountID  INT(0);
	DECLARE _result  	INT(0);
	SET _result = 0;
	SELECT `accountID` INTO _accountID FROM `openid` WHERE `openid` = _account;
	IF _accountID IS NOT NULL THEN 
		SET _result = 1001;
	END IF;
	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveCodeList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveCodeList`(IN _table		VARCHAR(256),
 	IN _giftcodeID 	VARCHAR(64),
 	IN _str  		VARCHAR(20000))
BEGIN
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_setRoleIDandSvrUid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_setRoleIDandSvrUid`(IN _roleID			INT,
	IN _serverUid		VARCHAR(63),
	IN _roleName		VARCHAR(63))
BEGIN
	DECLARE _datetime		DATETIME;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
 	START TRANSACTION;
		UPDATE `rolename` SET `roleID` = _roleID, `serverUid` = _serverUid, `updateTime` =  _datetime
			WHERE `roleName` = _roleName;
	COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_statisticalAddInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_statisticalAddInfo`(IN _accountID	INT,
	IN _token 		VARCHAR(255),
	IN _checkID 	VARCHAR(255))
BEGIN
	INSERT INTO statisticalinfo(`accountID`,`token`,`checkID`)
	VALUES (_accountID, _token, _checkID) ON DUPLICATE KEY UPDATE
	`accountID` = _accountID, `token` = _token, `checkID` = _checkID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateGiftNum` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateGiftNum`(IN _table		VARCHAR(256),
 	IN _giftcodeID 	VARCHAR(64))
BEGIN
	SET @sql0 = concat('UPDATE ', _table,' SET frequency = frequency+1  WHERE giftcodeID = ', _giftcodeID, ';');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
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

-- Dump completed on 2015-06-10 10:16:01
