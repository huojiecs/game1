-- MySQL dump 10.13  Distrib 5.6.11, for Win64 (x86_64)
--
-- Host: 188.188.0.163    Database: database_tbLog
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
-- Current Database: `database_tbLog`
--

--
-- Table structure for table `tb_qmphs_onlinecnt`
--

DROP TABLE IF EXISTS `tb_qmphs_onlinecnt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_qmphs_onlinecnt` (
  `gameappid` varchar(31) NOT NULL DEFAULT '',
  `timekey` int(11) NOT NULL,
  `gsid` varchar(31) NOT NULL DEFAULT '',
  `onlinecntios` int(11) NOT NULL DEFAULT '0',
  `onlinecntandroid` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`timekey`,`gsid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_qmphs_roleinfo`
--

DROP TABLE IF EXISTS `tb_qmphs_roleinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tb_qmphs_roleinfo` (
  `gameappid` varchar(31) NOT NULL DEFAULT '',
  `openid` varchar(63) NOT NULL DEFAULT '',
  `regtime` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  `level` int(11) NOT NULL DEFAULT '0',
  `iFriends` int(11) NOT NULL DEFAULT '0',
  `moneyios` int(11) NOT NULL DEFAULT '0',
  `moneyandroid` int(11) NOT NULL DEFAULT '0',
  `diamondios` int(11) NOT NULL DEFAULT '0',
  `diamondandroid` int(11) NOT NULL DEFAULT '0',
  `roleID` int(11) NOT NULL,
  `gsid` varchar(31) NOT NULL,
  PRIMARY KEY (`roleID`,`gsid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'database_tbLog'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveOnlineInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveOnlineInfo`(IN	_str  		VARCHAR(255))
BEGIN
	SET @sql0 = concat('INSERT INTO `tb_qmphs_onlinecnt` VALUES ', _str, ';');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveRoleInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveRoleInfo`(IN _level			INT,
	IN _iFriends		INT,
	IN _moneyios		INT,
	IN _moneyandroid	INT,
	IN _diamondios		INT,
	IN _diamondandroid	INT,
	IN _roleID			INT)
BEGIN
	UPDATE tb_qmphs_roleinfo SET 
		`level` = _level , `iFriends` = _iFriends,
		`moneyios` = _moneyios, `moneyandroid` = _moneyandroid,
		`diamondios` = _diamondios, `diamondandroid` = _diamondandroid 
	WHERE `roleID` = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateRoleDiamond` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateRoleDiamond`(IN _diamondios		INT,
	IN _diamondandroid	INT,
	IN _roleID			INT)
BEGIN
	UPDATE tb_qmphs_roleinfo SET `diamondios` = _diamondios, `diamondandroid` = _diamondandroid WHERE `roleID` = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateRoleExpLevel` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateRoleExpLevel`(IN _level			INT,
	IN _roleID			INT)
BEGIN
	UPDATE tb_qmphs_roleinfo SET `level` = _level WHERE `roleID` = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateRoleFriNum` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateRoleFriNum`(IN _iFriends		INT,
	IN _roleID			INT)
BEGIN
	UPDATE tb_qmphs_roleinfo SET `iFriends` = _iFriends WHERE `roleID` = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateRoleInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateRoleInfo`(IN _gameappid		VARCHAR(31),
	IN _openid			VARCHAR(63),
	IN _regtime			DATETIME,
	IN _level			INT,
	IN _iFriends		INT,
	IN _moneyios		INT,
	IN _moneyandroid	INT,
	IN _diamondios		INT,
	IN _diamondandroid	INT,
	IN _roleID			INT,
	IN _gsid  			VARCHAR(255))
BEGIN
	INSERT INTO tb_qmphs_roleinfo VALUES (_gameappid, _openid, _regtime, _level, _iFriends, _moneyios, _moneyandroid, 
		_diamondios, _diamondandroid, _roleID, _gsid) ON DUPLICATE KEY UPDATE 
		`gameappid` = _gameappid, `openid` = _openid, `regtime` = _regtime, `level` = _level, `iFriends` = _iFriends, 
		`moneyios` = _moneyios, `moneyandroid` = _moneyandroid,	`diamondios` = _diamondios, `diamondandroid` = _diamondandroid;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateRoleMoney` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateRoleMoney`(IN _moneyios		INT,
	IN _moneyandroid	INT,
	IN _roleID			INT)
BEGIN
	UPDATE tb_qmphs_roleinfo SET `moneyios` = _moneyios, `moneyandroid` = _moneyandroid WHERE `roleID` = _roleID;
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

-- Dump completed on 2014-12-01 10:20:45
