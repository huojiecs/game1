-- MySQL dump 10.13  Distrib 5.6.11, for Win64 (x86_64)
--
-- Host: 188.188.0.162    Database: cmge_payment
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
-- Current Database: `cmge_payment`
--

--
-- Table structure for table `balances`
--

DROP TABLE IF EXISTS `balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `balances` (
  `serverId` varchar(63) NOT NULL DEFAULT '',
  `roleId` varchar(31) NOT NULL DEFAULT '',
  `amount` int(11) DEFAULT '0',
  `generate` int(11) DEFAULT '0',
  `balance` int(11) DEFAULT '0',
  PRIMARY KEY (`roleId`,`serverId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flows`
--

DROP TABLE IF EXISTS `flows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flows` (
  `flowId` int(11) NOT NULL AUTO_INCREMENT,
  `serverId` varchar(63) DEFAULT NULL,
  `roleId` varchar(31) DEFAULT NULL,
  `balance` int(11) DEFAULT NULL,
  `payTime` datetime DEFAULT NULL,
  PRIMARY KEY (`flowId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `generates`
--

DROP TABLE IF EXISTS `generates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `generates` (
  `generateId` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` varchar(63) DEFAULT NULL,
  `amount` int(11) DEFAULT '0',
  `generate` int(11) DEFAULT '0',
  `recordTime` datetime DEFAULT NULL,
  `serverId` varchar(63) DEFAULT NULL,
  `roleId` varchar(31) DEFAULT NULL,
  `flowId` int(11) DEFAULT NULL,
  `flowTime` datetime DEFAULT NULL,
  `activityId` int(11) DEFAULT NULL,
  PRIMARY KEY (`generateId`),
  KEY `idx_rsa` (`roleId`,`serverId`,`activityId`),
  KEY `idx_rsf` (`roleId`,`serverId`,`flowId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `openId` bigint(20) DEFAULT NULL,
  `serverId` varchar(63) DEFAULT NULL,
  `serverName` varchar(63) DEFAULT NULL,
  `roleId` varchar(31) DEFAULT NULL,
  `roleName` varchar(63) DEFAULT NULL,
  `orderId` varchar(63) NOT NULL,
  `orderStatus` varchar(31) DEFAULT NULL,
  `payType` int(11) DEFAULT NULL,
  `payId` int(11) DEFAULT NULL,
  `payName` varchar(31) DEFAULT NULL,
  `amount` int(11) DEFAULT NULL,
  `currency` varchar(15) DEFAULT NULL,
  `remark` varchar(63) DEFAULT NULL,
  `callBackInfo` varchar(255) DEFAULT NULL,
  `payTime` datetime DEFAULT NULL,
  `paySUTime` datetime DEFAULT NULL,
  `sign` varchar(63) DEFAULT NULL,
  `recvTime` datetime DEFAULT NULL,
  `flowId` int(11) DEFAULT NULL,
  `flowTime` datetime DEFAULT NULL,
  PRIMARY KEY (`orderId`),
  KEY `idx_pay` (`roleId`,`serverId`,`flowId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'cmge_payment'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_payBalance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_payBalance`(
	IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63),
	IN _balance		INT(1)
)
BEGIN
	DECLARE _result			INT(1);
	DECLARE _savedBalance	INT(1);
	DECLARE _amount			INT(1);
	DECLARE _generate		INT(1);

	DECLARE exit handler for sqlexception, sqlwarning
	BEGIN
			SELECT 1 as result, 0 as _balance;
			ROLLBACK;
			RESIGNAL;
	END;

	START TRANSACTION;

	SELECT balance, amount, generate INTO _savedBalance, _amount, _generate FROM `balances`
			WHERE serverId = _serverId AND roleId = _roleId;

	IF( _savedBalance >= _balance ) THEN
			INSERT INTO `flows` VALUES (0, _serverId, _roleId, -_balance, NOW());

			UPDATE `balances` SET balance = balance - _balance
					WHERE serverId = _serverId AND roleId = _roleId;
	END IF;

	COMMIT;

	SELECT 0 as result, _balance, balance, amount, generate FROM `balances`
		WHERE serverId = _serverId AND roleId = _roleId;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_queryActivity` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_queryActivity`(
	IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63),
	IN _activities	VARCHAR(255)
)
BEGIN

-- 	SELECT * FROM generates WHERE roleId = _roleID AND serverId = _serverId AND activityId in (_activityId);

	IF LENGTH(_activities) <> 0 THEN
	SET @sqlStr =CONCAT( 'SELECT * FROM generates WHERE roleId = ', _roleId,
			' AND serverId = ', _serverId, ' AND activityId in (', _activities,');');
	PREPARE s1 FROM @sqlStr;
	EXECUTE s1;
	END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_queryBalance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_queryBalance`(
	IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63)
)
BEGIN

	SELECT * FROM `balances` WHERE serverId = _serverId AND roleId = _roleId;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_recordBalance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_recordBalance`(
	IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63)
)
BEGIN
	DECLARE _amount         INT(1);
	DECLARE _generate       INT(1);
	DECLARE _result         INT(1);

	DECLARE exit handler for sqlexception, sqlwarning
	BEGIN
			SELECT 1 AS _result;
			ROLLBACK;
			RESIGNAL;
	END;

	START TRANSACTION;

	SELECT SUM(amount) INTO _amount FROM `orders`
			WHERE serverId = _serverId AND roleId = _roleId AND flowId = 0;

	IF( _amount > 0 ) THEN
			INSERT INTO `flows` VALUES (0, _serverId, _roleId, _amount, NOW());

			UPDATE `orders` SET flowId = LAST_INSERT_ID(), flowTime = NOW()
					WHERE serverId = _serverId AND roleId = _roleId AND flowId = 0;

			INSERT INTO `balances` VALUES(_serverId, _roleId, _amount, 0, _amount)
					ON DUPLICATE KEY UPDATE
							amount = amount + _amount, balance = balance + _amount;
	END IF;

	SELECT SUM(generate) INTO _generate FROM `generates`
			WHERE serverId = _serverId AND roleId = _roleId AND flowId = 0;

	IF( _generate > 0 ) THEN
			INSERT INTO `flows` VALUES (0, _serverId, _roleId, _generate, NOW());

			UPDATE `generates` SET flowId = LAST_INSERT_ID(), flowTime = NOW()
					WHERE serverId = _serverId AND roleId = _roleId AND flowId = 0;

			INSERT INTO `balances` VALUES(_serverId, _roleId, _amount, 0, _amount)
					ON DUPLICATE KEY UPDATE
							generate = generate + _generate, balance = balance + _generate;
	END IF;

	COMMIT;

	SELECT 0 AS _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveGenerate` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveGenerate`(
	IN _orderId		VARCHAR(63),
	IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63),
	IN _amount		INT,
	IN _generate	INT,
	IN _extra		INT,
	IN _activityId	INT
)
BEGIN
	DECLARE _count	INT(1);

	SET _count = 0;

	IF( _activityId != 0 ) THEN
	SELECT count(*) INTO _count FROM `generates`
		WHERE roleId = _roleID AND serverId = _serverId AND activityId = _activityId;

	IF( _count = 0 ) THEN
		INSERT INTO `generates` values (0, _orderId, _amount, _generate, NOW(),
			_serverId, _roleId, 0, NOW(), _activityId);
			SELECT LAST_INSERT_ID() AS generateId;
	ELSE
			INSERT INTO `generates` values (0, _orderId, _amount, _extra, NOW(),
				_serverId, _roleId, 0, NOW(), _activityId);
			SELECT LAST_INSERT_ID() AS generateId;
	END IF;
	ELSE
			INSERT INTO `generates` values (0, _orderId, _amount, _extra, NOW(),
				_serverId, _roleId, 0, NOW(), _activityId);
		SELECT LAST_INSERT_ID() AS generateId;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveOrders` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveOrders`(
	IN _orderId			VARCHAR(63),
	IN _serverId		VARCHAR(63),
	IN _roleId			VARCHAR(63),
	IN _amount			INT,
	IN _generate		INT,
	IN _extra			INT,
	IN _activityId		INT,
	IN _orderDetails	VARCHAR(4095)
)
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);

	DECLARE exit handler for sqlexception, sqlwarning
	BEGIN
		SELECT 1;
		ROLLBACK;
		RESIGNAL;
	END;

	SELECT count(*) INTO _count FROM `orders` WHERE orderId = _orderId;

	IF(_count > 0) THEN
		SET _result = 70003;
	ELSE

  	START TRANSACTION;
		SET @sqlStr =CONCAT( 'insert into `orders` values', _orderDetails,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;

		CALL sp_saveGenerate(_orderId, _serverId, _roleId, _amount, _generate, _extra, _activityId);
		CALL sp_recordBalance(_serverId, _roleId);
	COMMIT;

		SET _result = 0;
	END IF;

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

-- Dump completed on 2015-06-17 15:32:04
