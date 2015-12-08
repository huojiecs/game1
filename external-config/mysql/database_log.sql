-- MySQL dump 10.13  Distrib 5.6.11, for Win64 (x86_64)
--
-- Host: 188.188.0.163    Database: database_log
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
-- Current Database: `database_log`
--

--
-- Table structure for table `enter`
--

DROP TABLE IF EXISTS `enter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enter` (
  `time` datetime DEFAULT NULL,
  `checkid` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_exp`
--

DROP TABLE IF EXISTS `log_exp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log_exp` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `getType` int(11) DEFAULT '0',
  `npcID` int(11) DEFAULT '0',
  `expNum` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logbuyevent`
--

DROP TABLE IF EXISTS `logbuyevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logbuyevent` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `moneyType` int(11) DEFAULT '0',
  `moneyCount` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logchat`
--

DROP TABLE IF EXISTS `logchat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logchat` (
  `logID` varchar(50) DEFAULT '',
  `chatType` int(11) DEFAULT '0',
  `sendID` int(11) DEFAULT '0',
  `recvID` int(11) DEFAULT '0',
  `chatContent` varchar(110) DEFAULT '',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logfriend`
--

DROP TABLE IF EXISTS `logfriend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logfriend` (
  `logID` varchar(50) DEFAULT '',
  `operateType` int(11) DEFAULT '0',
  `roleID` int(11) DEFAULT '0',
  `friendID` int(11) DEFAULT '0',
  `friendType` int(2) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loggameover`
--

DROP TABLE IF EXISTS `loggameover`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loggameover` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `customID` int(11) DEFAULT '0',
  `itemListGuid` varchar(50) DEFAULT '',
  `areaWin` int(11) DEFAULT '0',
  `customSco` int(11) DEFAULT '0',
  `winExp` int(11) DEFAULT '0',
  `winMoney` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logitemchange`
--

DROP TABLE IF EXISTS `logitemchange`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logitemchange` (
  `logID` varchar(50) DEFAULT '',
  `itemID` varchar(32) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `itemTempID` int(11) DEFAULT '0',
  `bagType` int(11) DEFAULT '0',
  `strengthen` int(11) DEFAULT '0',
  `star0` int(11) DEFAULT '0',
  `star1` int(11) DEFAULT '0',
  `star2` int(11) DEFAULT '0',
  `itemNum` int(11) DEFAULT '0',
  `zhanli` int(11) DEFAULT '0',
  `baseZhanli` int(11) DEFAULT '0',
  `itemStar` int(11) DEFAULT '0',
  `attack` int(11) DEFAULT '0',
  `defense` int(11) DEFAULT '0',
  `hp` int(11) DEFAULT '0',
  `mp` int(11) DEFAULT '0',
  `maxHp` int(11) DEFAULT '0',
  `maxMp` int(11) DEFAULT '0',
  `crit` int(11) DEFAULT '0',
  `critdamage` int(11) DEFAULT '0',
  `damageup` int(11) DEFAULT '0',
  `hunmireduce` int(11) DEFAULT '0',
  `houyangreduce` int(11) DEFAULT '0',
  `hprate` int(11) DEFAULT '0',
  `mprate` int(11) DEFAULT '0',
  `anticrit` int(11) DEFAULT '0',
  `critdamagereduce` int(11) DEFAULT '0',
  `damagereduce` int(11) DEFAULT '0',
  `antihunmi` int(11) DEFAULT '0',
  `antihouyang` int(11) DEFAULT '0',
  `antifukong` int(11) DEFAULT '0',
  `antijitui` int(11) DEFAULT '0',
  `hunmirate` int(11) DEFAULT '0',
  `houyangrate` int(11) DEFAULT '0',
  `fukongrate` int(11) DEFAULT '0',
  `jituirate` int(11) DEFAULT '0',
  `changeType` int(11) DEFAULT '0',
  `emandationType` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logmail`
--

DROP TABLE IF EXISTS `logmail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logmail` (
  `logID` varchar(50) DEFAULT '',
  `operatorType` int(11) DEFAULT '0',
  `roleID` int(11) DEFAULT '0',
  `mailID` int(11) DEFAULT '0',
  `recvID` int(11) DEFAULT '0',
  `theme` varchar(50) DEFAULT '',
  `content` varchar(100) DEFAULT '',
  `sendType` int(11) DEFAULT '0',
  `sendTime` datetime DEFAULT '0000-00-00 00:00:00',
  `itemID_0` int(11) DEFAULT '0',
  `itemNum_0` int(11) DEFAULT '0',
  `itemID_1` int(11) DEFAULT '0',
  `itemNum_1` int(11) DEFAULT '0',
  `itemID_2` int(11) DEFAULT '0',
  `itemNum_2` int(11) DEFAULT '0',
  `itemID_3` int(11) DEFAULT '0',
  `itemNum_3` int(11) DEFAULT '0',
  `itemID_4` int(11) DEFAULT '0',
  `itemNum_4` int(11) DEFAULT '0',
  `afterItemID_0` int(11) DEFAULT '0',
  `afterItemNum_0` int(11) DEFAULT '0',
  `afterItemID_1` int(11) DEFAULT '0',
  `afterItemNum_1` int(11) DEFAULT '0',
  `afterItemID_2` int(11) DEFAULT '0',
  `afterItemNum_2` int(11) DEFAULT '0',
  `afterItemID_3` int(11) DEFAULT '0',
  `afterItemNum_3` int(11) DEFAULT '0',
  `afterItemID_4` int(11) DEFAULT '0',
  `afterItemNum_4` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logmission`
--

DROP TABLE IF EXISTS `logmission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logmission` (
  `logID` varchar(50) DEFAULT '',
  `operType` int(11) DEFAULT '0',
  `misID` int(11) DEFAULT '0',
  `roleID` int(11) DEFAULT '0',
  `misState` int(11) DEFAULT '0',
  `misNum_0` int(11) DEFAULT '0',
  `misNum_1` int(11) DEFAULT '0',
  `misNum_2` int(11) DEFAULT '0',
  `misNum_3` int(11) DEFAULT '0',
  `misNum_4` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logmoneychange`
--

DROP TABLE IF EXISTS `logmoneychange`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logmoneychange` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `changeType` int(11) DEFAULT '0',
  `changeTypeGuid` varchar(50) DEFAULT '',
  `moneyType` int(11) DEFAULT '0',
  `beforeChange` int(11) DEFAULT '0',
  `afterChange` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logniudan`
--

DROP TABLE IF EXISTS `logniudan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logniudan` (
  `logID` varchar(50) DEFAULT '',
  `niuDanID` int(11) DEFAULT '0',
  `roleID` int(11) DEFAULT '0',
  `starNum` int(11) DEFAULT '0',
  `freeNum` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logrelive`
--

DROP TABLE IF EXISTS `logrelive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logrelive` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `customID` int(11) DEFAULT '0',
  `roomLife` int(11) DEFAULT '0',
  `playerLife` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logskill`
--

DROP TABLE IF EXISTS `logskill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logskill` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `addType` int(11) DEFAULT '0',
  `tempID` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logsmeltsoul`
--

DROP TABLE IF EXISTS `logsmeltsoul`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logsmeltsoul` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `operType` int(11) DEFAULT '0',
  `level` int(11) DEFAULT '0',
  `beforeAttack` int(11) DEFAULT '0',
  `beforeDefence` int(11) DEFAULT '0',
  `beforeLifeValue` int(11) DEFAULT '0',
  `afterAttack` int(11) DEFAULT '0',
  `afterDefence` int(11) DEFAULT '0',
  `afterLifeValue` int(11) DEFAULT '0',
  `smeltSoulType` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logsoullevelchange`
--

DROP TABLE IF EXISTS `logsoullevelchange`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logsoullevelchange` (
  `logID` varchar(50) DEFAULT '',
  `roleID` int(11) DEFAULT '0',
  `oldLevel` int(11) DEFAULT '0',
  `oldAttack` int(11) DEFAULT '0',
  `oldDefence` int(11) DEFAULT '0',
  `oldLifeValue` int(11) DEFAULT '0',
  `newLevel` int(11) DEFAULT '0',
  `newAttack` int(11) DEFAULT '0',
  `newDefence` int(11) DEFAULT '0',
  `newLifeValue` int(11) DEFAULT '0',
  `addTime` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'database_log'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2014-12-01 10:20:42
