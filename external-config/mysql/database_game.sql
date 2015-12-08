-- MySQL dump 10.13  Distrib 5.6.11, for Win64 (x86_64)
--
-- Host: 188.188.0.163    Database: database_game
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
-- Current Database: `database_game`
--
--
-- Table structure for table `_ver:1`
--

DROP TABLE IF EXISTS `_ver:1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_ver:1` (
  `id_version` int(11) NOT NULL,
  PRIMARY KEY (`id_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `achieve`
--

DROP TABLE IF EXISTS `achieve`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achieve` (
  `achiID` int(11) NOT NULL,
  `roleID` int(11) NOT NULL,
  `achiState` int(11) NOT NULL DEFAULT '0',
  `finishNum` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`achiID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity` (
  `activityID` int(11) NOT NULL DEFAULT '0',
  `roleID` int(11) NOT NULL,
  `instanceID` int(11) NOT NULL DEFAULT '0',
  `num` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`instanceID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activitycd`
--

DROP TABLE IF EXISTS `activitycd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activitycd` (
  `roleID` int(11) NOT NULL,
  `activityID` int(11) NOT NULL DEFAULT '0',
  `cd` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`roleID`,`activityID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `advance`
--

DROP TABLE IF EXISTS `advance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `advance` (
  `roleID` int(11) NOT NULL,
  `tempID` varchar(63) NOT NULL,
  `reachStep` int(11) NOT NULL,
  `rewardStep` int(11) NOT NULL,
  `advancePoint` int(11) NOT NULL,
  `conditionPoint` int(11) NOT NULL,
  `endTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`roleID`,`tempID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alchemy`
--

DROP TABLE IF EXISTS `alchemy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alchemy` (
  `roleID` int(11) NOT NULL,
  `time` int(11) NOT NULL DEFAULT '0',
  `isBaoJi` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `areasco`
--

DROP TABLE IF EXISTS `areasco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `areasco` (
  `roleID` int(11) NOT NULL,
  `areaID` int(11) NOT NULL,
  `areaSco` int(11) NOT NULL DEFAULT '0',
  `areaNum` int(11) NOT NULL DEFAULT '0',
  `areaWin` int(11) NOT NULL DEFAULT '0',
  `areaPrize` int(11) NOT NULL DEFAULT '0',
  `levelTarget` int(11) NOT NULL DEFAULT '0',
  `starNum` int(11) NOT NULL DEFAULT '0',
  `achieve` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`areaID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ares`
--

DROP TABLE IF EXISTS `ares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ares` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `rankKey` int(11) NOT NULL DEFAULT '0',
  `maxRank` int(11) NOT NULL DEFAULT '0',
  `type` int(11) NOT NULL DEFAULT '0',
  `battleTimes` int(11) NOT NULL DEFAULT '0',
  `lastBattleTime` int(11) NOT NULL DEFAULT '0',
  `medal` int(11) NOT NULL DEFAULT '0',
  `totalMedal` int(11) NOT NULL DEFAULT '0',
  `shopTimes` int(11) NOT NULL DEFAULT '0',
  `lastShopTime` int(11) NOT NULL DEFAULT '0',
  `occupyTime` int(11) NOT NULL DEFAULT '0',
  `roleName` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `areslog`
--

DROP TABLE IF EXISTS `areslog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `areslog` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `type` int(11) NOT NULL DEFAULT '0',
  `rivalID` int(11) NOT NULL DEFAULT '0',
  `rivalName` varchar(63) NOT NULL DEFAULT '',
  `context` varchar(512) NOT NULL DEFAULT '',
  `createTime` int(11) NOT NULL DEFAULT '0',
  `changeRank` int(11) NOT NULL DEFAULT '0',
  `zhanli` int(11) NOT NULL DEFAULT '0',
  KEY `roleID_index` (`roleID`)USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact`
--

DROP TABLE IF EXISTS `artifact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artifact` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `activation` varchar(1024) NOT NULL,
  `skillAtt_1` int(11) NOT NULL,
  `skillAtt_2` int(11) NOT NULL,
  `artifactPower` int(11) NOT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `askmagic`
--

DROP TABLE IF EXISTS `askmagic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `askmagic` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `curIndex` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assets` (
  `roleID` int(11) NOT NULL,
  `tempID` int(11) NOT NULL DEFAULT '0',
  `num` int(11) DEFAULT '0',
  PRIMARY KEY (`roleID`,`tempID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asyncpvp`
--

DROP TABLE IF EXISTS `asyncpvp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asyncpvp` (
  `roleID` int(11) NOT NULL,
  `attackNum` int(11) NOT NULL DEFAULT '0',
  `attackedNum` int(11) NOT NULL DEFAULT '0',
  `lostTimes` int(11) NOT NULL DEFAULT '0',
  `loseLingli` int(11) NOT NULL DEFAULT '0',
  `lingli` int(11) NOT NULL DEFAULT '0',
  `honor` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asyncpvpbless`
--

DROP TABLE IF EXISTS `asyncpvpbless`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asyncpvpbless` (
  `roleID` int(11) NOT NULL,
  `blessLeft` int(11) NOT NULL DEFAULT '0',
  `blessReceived` int(11) NOT NULL DEFAULT '0',
  `attackNumAddByBless` int(11) NOT NULL DEFAULT '0',
  `refreshLastTime` bigint(20) NOT NULL DEFAULT '0',
  `attackCost` int(11) NOT NULL DEFAULT '0',
  `requireBlessLeft` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asyncpvprival`
--

DROP TABLE IF EXISTS `asyncpvprival`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asyncpvprival` (
  `rivalID` int(11) NOT NULL AUTO_INCREMENT,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `otherID` int(11) NOT NULL DEFAULT '0',
  `otherType` int(11) NOT NULL DEFAULT '0',
  `lingliLost` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`rivalID`),
  KEY `idx_roleID` (`roleID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attribute`
--

DROP TABLE IF EXISTS `attribute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attribute` (
  `roleID` int(11) NOT NULL,
  `attack` int(11) NOT NULL DEFAULT '0',
  `defence` int(11) NOT NULL DEFAULT '0',
  `hp` int(11) NOT NULL DEFAULT '0',
  `mp` int(11) NOT NULL DEFAULT '0',
  `maxhp` int(11) NOT NULL DEFAULT '0',
  `maxmp` int(11) NOT NULL DEFAULT '0',
  `crit` int(11) NOT NULL DEFAULT '0',
  `critdamage` int(11) NOT NULL DEFAULT '0',
  `damageup` int(11) NOT NULL DEFAULT '0',
  `hunmireduce` int(11) NOT NULL DEFAULT '0',
  `houyangreduce` int(11) NOT NULL DEFAULT '0',
  `hprate` int(11) NOT NULL DEFAULT '0',
  `mprate` int(11) NOT NULL DEFAULT '0',
  `anticrit` int(11) NOT NULL DEFAULT '0',
  `critdamageduce` int(11) NOT NULL DEFAULT '0',
  `damagereduce` int(11) NOT NULL DEFAULT '0',
  `antihunmi` int(11) NOT NULL DEFAULT '0',
  `antihouyang` int(11) NOT NULL DEFAULT '0',
  `antifukong` int(11) NOT NULL DEFAULT '0',
  `antijitui` int(11) NOT NULL DEFAULT '0',
  `hunmirate` int(11) NOT NULL DEFAULT '0',
  `houyangrate` int(11) NOT NULL DEFAULT '0',
  `fukongrate` int(11) NOT NULL DEFAULT '0',
  `jituirate` int(11) NOT NULL DEFAULT '0',
  `freezeRate` int(10) NOT NULL DEFAULT '0',
  `stoneRate` int(10) NOT NULL DEFAULT '0',
  `antiFreeze` int(10) NOT NULL DEFAULT '0',
  `antiStone` int(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chart_black`
--

DROP TABLE IF EXISTS `chart_black`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chart_black` (
  `roleID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chartprize`
--

DROP TABLE IF EXISTS `chartprize`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chartprize` (
  `roleID` int(11) NOT NULL,
  `honorPrize` int(11) NOT NULL DEFAULT '0',
  `honorPrizeDay` date NOT NULL DEFAULT '1970-01-01',
  `honorLastDay` date NOT NULL DEFAULT '1970-01-01',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chartreward`
--

DROP TABLE IF EXISTS `chartreward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chartreward` (
  `roleID` int(11) NOT NULL,
  `chartType` int(11) NOT NULL,
  `ranking` int(11) NOT NULL DEFAULT '0',
  `refreshTime` date NOT NULL DEFAULT '1970-01-01',
  `isBoss` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`chartType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chartrewardgettime`
--

DROP TABLE IF EXISTS `chartrewardgettime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chartrewardgettime` (
  `roleID` int(11) NOT NULL,
  `chartType` int(11) NOT NULL,
  `acceptTime` date NOT NULL DEFAULT '1970-01-01',
  PRIMARY KEY (`roleID`,`chartType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `climb`
--

DROP TABLE IF EXISTS `climb`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `climb` (
  `roleID` int(10) NOT NULL,
  `climbData` varchar(5000) NOT NULL DEFAULT '[]',
  `todayData` varchar(15000) NOT NULL DEFAULT '[]',
  `customNum` int(10) NOT NULL DEFAULT '0',
  `historyData` varchar(1000) NOT NULL DEFAULT '[]',
  `weekScore` int(10) NOT NULL DEFAULT '0',
  `fastCarNum` int(10) NOT NULL DEFAULT '1',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coliseum`
--

DROP TABLE IF EXISTS `coliseum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coliseum` (
  `roleID` int(11) NOT NULL,
  `collect` varchar(2048) NOT NULL,
  `npcReward` varchar(1024) NOT NULL,
  `teamReward` varchar(1024) NOT NULL,
  `refreshTime` bigint(13) NOT NULL,
  `npcInfo` varchar(3072) NOT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exchange`
--

DROP TABLE IF EXISTS `exchange`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exchange` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `exchangeID` int(11) NOT NULL DEFAULT '0',
  `type` int(11) NOT NULL DEFAULT '0',
  `exchangeTimes` int(11) NOT NULL DEFAULT '0',
  `lastExchangeTime` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`exchangeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fashion`
--

DROP TABLE IF EXISTS `fashion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fashion` (
  `roleID` int(12) NOT NULL DEFAULT '0',
  `suitID` varchar(64) NOT NULL DEFAULT '0',
  `stats` int(12) NOT NULL DEFAULT '0',
  `openTime` datetime DEFAULT NULL,
  PRIMARY KEY (`roleID`,`suitID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forbid_list`
--

DROP TABLE IF EXISTS `forbid_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forbid_list` (
  `roleID` int(11) NOT NULL,
  `forbidProfit` datetime NOT NULL DEFAULT '1990-01-01 00:00:00',
  `forbidChat` varchar(255) NOT NULL DEFAULT '{}',
  `forbidChart` varchar(2047) NOT NULL DEFAULT '{}',
  `forbidPlay` datetime NOT NULL DEFAULT '1990-01-01 00:00:00',
  `forbidPlayList` varchar(2047) NOT NULL DEFAULT '{}',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `friend`
--

DROP TABLE IF EXISTS `friend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `friend` (
  `roleID` int(11) NOT NULL,
  `friendID` int(11) NOT NULL,
  `friendType` int(11) NOT NULL DEFAULT '0',
  `blessCount` int(11) NOT NULL DEFAULT '0',
  `blessLastDay` int(11) NOT NULL DEFAULT '0',
  `blessReceivedLastDay` int(11) NOT NULL DEFAULT '0',
  `climbCustomNum` int(11) NOT NULL DEFAULT '0',
  `climbWeekScore` int(11) NOT NULL DEFAULT '0',
  `climbScoreTime` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`friendID`,`friendType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `friendapply`
--

DROP TABLE IF EXISTS `friendapply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `friendapply` (
  `roleID` int(11) NOT NULL,
  `applyFriendID` int(11) NOT NULL,
  `applyTime` int(11) NOT NULL,
  PRIMARY KEY (`roleID`,`applyFriendID`),
  KEY `idx_friendapply_applyFriendID` (`applyFriendID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `friendphysical`
--

DROP TABLE IF EXISTS `friendphysical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `friendphysical` (
  `roleID` int(11) NOT NULL,
  `friendID` int(11) NOT NULL,
  `receivePhy` int(11) DEFAULT '0',
  `givePhy` int(11) DEFAULT '0',
  `receiveTime` datetime DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`roleID`,`friendID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gift`
--

DROP TABLE IF EXISTS `gift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gift` (
  `giftID` int(11) NOT NULL,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `giftType` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`giftID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `giftusenum`
--

DROP TABLE IF EXISTS `giftusenum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `giftusenum` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roleID` int(11) unsigned zerofill NOT NULL DEFAULT '00000000000',
  `giftID` int(11) unsigned zerofill NOT NULL DEFAULT '00000000000',
  `useNum` int(10) unsigned zerofill NOT NULL DEFAULT '0000000000',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `item` (
  `itemID` varchar(63) NOT NULL,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `itemTempID` int(11) NOT NULL DEFAULT '0',
  `bagType` int(11) NOT NULL DEFAULT '0',
  `strengthen` int(11) NOT NULL DEFAULT '0',
  `star0` int(11) NOT NULL DEFAULT '0',
  `star1` int(11) NOT NULL DEFAULT '0',
  `star2` int(11) NOT NULL DEFAULT '0',
  `itemNum` int(11) NOT NULL DEFAULT '0',
  `zhanli` int(11) NOT NULL DEFAULT '0',
  `baseZhanli` int(11) NOT NULL DEFAULT '0',
  `itemStar` int(11) NOT NULL DEFAULT '0',
  `attack` int(11) NOT NULL DEFAULT '0',
  `defense` int(11) NOT NULL DEFAULT '0',
  `hp` int(11) NOT NULL DEFAULT '0',
  `mp` int(11) NOT NULL DEFAULT '0',
  `maxHp` int(11) NOT NULL DEFAULT '0',
  `maxMp` int(11) NOT NULL DEFAULT '0',
  `crit` int(11) NOT NULL DEFAULT '0',
  `critdamage` int(11) NOT NULL DEFAULT '0',
  `damageup` int(11) NOT NULL DEFAULT '0',
  `hunmireduce` int(11) NOT NULL DEFAULT '0',
  `houyangreduce` int(11) NOT NULL DEFAULT '0',
  `hprate` int(11) NOT NULL DEFAULT '0',
  `mprate` int(11) NOT NULL DEFAULT '0',
  `anticrit` int(11) NOT NULL DEFAULT '0',
  `critdamagereduce` int(11) NOT NULL DEFAULT '0',
  `damagereduce` int(11) NOT NULL DEFAULT '0',
  `antihunmi` int(11) NOT NULL DEFAULT '0',
  `antihouyang` int(11) NOT NULL DEFAULT '0',
  `antifukong` int(11) NOT NULL DEFAULT '0',
  `antijitui` int(11) NOT NULL DEFAULT '0',
  `hunmirate` int(11) NOT NULL DEFAULT '0',
  `houyangrate` int(11) NOT NULL DEFAULT '0',
  `fukongrate` int(11) NOT NULL DEFAULT '0',
  `jituirate` int(11) NOT NULL DEFAULT '0',
  `freezeRate` int(10) NOT NULL DEFAULT '0',
  `stoneRate` int(10) NOT NULL DEFAULT '0',
  `antiFreeze` int(10) NOT NULL DEFAULT '0',
  `antiStone` int(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`itemID`),
  KEY `idx_roldID` (`roleID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `limitgoods`
--

DROP TABLE IF EXISTS `limitgoods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `limitgoods` (
  `goodsID` int(11) NOT NULL,
  `goodsNum` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`goodsID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logingift`
--

DROP TABLE IF EXISTS `logingift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logingift` (
  `roleID` int(11) NOT NULL,
  `one` int(11) NOT NULL DEFAULT '0',
  `two` int(11) NOT NULL DEFAULT '0',
  `three` int(11) NOT NULL DEFAULT '0',
  `four` int(11) NOT NULL DEFAULT '0',
  `five` int(11) NOT NULL DEFAULT '0',
  `six` int(11) NOT NULL DEFAULT '0',
  `seven` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magicoutput`
--

DROP TABLE IF EXISTS `magicoutput`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `magicoutput` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `itemID` int(11) NOT NULL DEFAULT '0',
  `num` int(11) NOT NULL DEFAULT '0',
  KEY `index_name` (`roleID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magicsoul`
--

DROP TABLE IF EXISTS `magicsoul`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `magicsoul` (
  `TEMPID` int(11) NOT NULL DEFAULT '0',
  `RoleID` int(11) NOT NULL DEFAULT '0',
  `Zhanli` int(11) NOT NULL DEFAULT '0',
  `InfoID` int(11) NOT NULL DEFAULT '0',
  `ExNum` int(11) NOT NULL DEFAULT '0',
  `SkillID_0` int(11) NOT NULL DEFAULT '0',
  `SkillID_1` int(11) NOT NULL DEFAULT '0',
  `SkillID_2` int(11) NOT NULL DEFAULT '0',
  `SkillID_3` int(11) NOT NULL DEFAULT '0',
  `SkillID_4` int(11) NOT NULL DEFAULT '0',
  `SkillID_5` int(11) NOT NULL DEFAULT '0',
  `SkillID_6` int(11) NOT NULL DEFAULT '0',
  `SkillID_7` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`RoleID`,`TEMPID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mail`
--

DROP TABLE IF EXISTS `mail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mail` (
  `mailID` int(11) NOT NULL AUTO_INCREMENT,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `sendID` int(11) NOT NULL DEFAULT '0',
  `sendName` varchar(63) NOT NULL DEFAULT '',
  `theme` varchar(63) NOT NULL DEFAULT '',
  `content` varchar(255) NOT NULL DEFAULT '',
  `mailState` int(11) NOT NULL DEFAULT '0',
  `sendType` int(11) NOT NULL DEFAULT '0',
  `sendTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `itemID_0` int(11) NOT NULL DEFAULT '0',
  `itemNum_0` int(11) NOT NULL DEFAULT '0',
  `itemID_1` int(11) NOT NULL DEFAULT '0',
  `itemNum_1` int(11) NOT NULL DEFAULT '0',
  `itemID_2` int(11) NOT NULL DEFAULT '0',
  `itemNum_2` int(11) NOT NULL DEFAULT '0',
  `itemID_3` int(11) NOT NULL DEFAULT '0',
  `itemNum_3` int(11) NOT NULL DEFAULT '0',
  `itemID_4` int(11) NOT NULL DEFAULT '0',
  `itemNum_4` int(11) NOT NULL DEFAULT '0',
  `sendUid` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`mailID`),
  KEY `idx_roleID` (`roleID`)USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `marrygift`
--

DROP TABLE IF EXISTS `marrygift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marrygift` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `spouseID` int(11) DEFAULT NULL,
  `flowers` bigint(20) DEFAULT NULL,
  `kiss` bigint(20) DEFAULT NULL,
  `gifts` bigint(20) DEFAULT NULL,
  `giveKissNum` int(1) DEFAULT NULL,
  `giveFlowerNum` int(1) DEFAULT NULL,
  `giveGiftNum` int(2) DEFAULT NULL,
  `yinYuanCount` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `marryinfo`
--

DROP TABLE IF EXISTS `marryinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marryinfo` (
  `roleID` int(11) DEFAULT NULL,
  `toMarryID` int(11) DEFAULT NULL,
  `marryTime` datetime DEFAULT NULL,
  `state` int(1) DEFAULT NULL,
  `marryLevel` int(11) DEFAULT NULL,
  `xinWuID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `marrylog`
--

DROP TABLE IF EXISTS `marrylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marrylog` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `toMarryID` int(11) DEFAULT NULL,
  `logType` int(1) DEFAULT NULL,
  `giftID` int(11) DEFAULT NULL,
  `giveTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `state` int(1) DEFAULT '0',
  `logID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `marrymsg`
--

DROP TABLE IF EXISTS `marrymsg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marrymsg` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `marryMsgNum` int(11) DEFAULT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `merge_history`
--

DROP TABLE IF EXISTS `merge_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `merge_history` (
  `serverUid` int(10) unsigned NOT NULL,
  `targetUid` int(10) unsigned NOT NULL,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`serverUid`,`targetUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `minesweep`
--

DROP TABLE IF EXISTS `minesweep`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `minesweep` (
  `roleID` int(11) NOT NULL,
  `mineSweepID` int(11) unsigned zerofill NOT NULL,
  `mineSweepLevelID` int(11) unsigned zerofill NOT NULL,
  `maxHp` int(11) unsigned zerofill NOT NULL,
  `currentHp` int(11) unsigned zerofill NOT NULL,
  `leftTimes` int(11) unsigned zerofill NOT NULL,
  `leftReviveTimes` int(4) NOT NULL,
  `cdTime` int(11) unsigned zerofill NOT NULL,
  `passCdTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `baoXiang_ClearLevel` int(1) NOT NULL,
  `baoXiang_KillAll` int(1) NOT NULL,
  `items` varchar(1023) NOT NULL,
  `times` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `misfinish`
--

DROP TABLE IF EXISTS `misfinish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `misfinish` (
  `roleID` int(11) NOT NULL,
  `misIDList` varchar(2047) NOT NULL DEFAULT '[]',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `misgroup`
--

DROP TABLE IF EXISTS `misgroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `misgroup` (
  `roleID` int(11) NOT NULL,
  `groupID` varchar(1023) NOT NULL DEFAULT '',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mission`
--

DROP TABLE IF EXISTS `mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mission` (
  `misID` int(11) NOT NULL,
  `roleID` int(11) NOT NULL,
  `misState` int(11) NOT NULL DEFAULT '0',
  `misNum_0` int(11) NOT NULL DEFAULT '0',
  `misNum_1` int(11) NOT NULL DEFAULT '0',
  `misNum_2` int(11) NOT NULL DEFAULT '0',
  `misNum_3` int(11) NOT NULL DEFAULT '0',
  `misNum_4` int(11) NOT NULL DEFAULT '0',
  `misNum_5` int(11) NOT NULL DEFAULT '0',
  `misNum_6` int(11) NOT NULL DEFAULT '0',
  `misNum_7` int(11) NOT NULL DEFAULT '0',
  `misNum_8` int(11) NOT NULL DEFAULT '0',
  `misNum_9` int(11) NOT NULL DEFAULT '0',
  `preOverNum` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`misID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `monthcardreceive`
--

DROP TABLE IF EXISTS `monthcardreceive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `monthcardreceive` (
  `roleID` int(11) NOT NULL,
  `receiveDate` date DEFAULT NULL,
  `beginTime` varchar(127) DEFAULT NULL,
  `mailTime` varchar(127) NOT NULL DEFAULT '1969-12-31T16:00:00.000Z',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `newplayer`
--

DROP TABLE IF EXISTS `newplayer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newplayer` (
  `roleID` int(11) NOT NULL,
  `newID` int(11) NOT NULL,
  PRIMARY KEY (`roleID`,`newID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `niudan`
--

DROP TABLE IF EXISTS `niudan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `niudan` (
  `niuDanID` int(11) NOT NULL,
  `roleID` int(11) NOT NULL,
  `starNum` int(11) NOT NULL DEFAULT '0',
  `freeNum` int(11) NOT NULL DEFAULT '0',
  `timeCd` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`niuDanID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notice`
--

DROP TABLE IF EXISTS `notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notice` (
  `typeID` int(11) NOT NULL DEFAULT '0',
  `npcID` int(11) NOT NULL DEFAULT '0',
  `flag` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`typeID`,`npcID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `noticeinfo`
--

DROP TABLE IF EXISTS `noticeinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `noticeinfo` (
  `roleID` int(11) NOT NULL,
  `broadcastZhanli` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `occupant`
--

DROP TABLE IF EXISTS `occupant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `occupant` (
  `customID` int(11) NOT NULL,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `roleName` varchar(63) NOT NULL DEFAULT '',
  `roleSco` int(11) NOT NULL DEFAULT '0',
  `leaveTime` bigint(20) NOT NULL DEFAULT '0',
  `unionID` int(11) NOT NULL DEFAULT '0',
  `unionName` varchar(63) NOT NULL DEFAULT '',
  `roleLevel` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`roleID`,`customID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `operateinfo`
--

DROP TABLE IF EXISTS `operateinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `operateinfo` (
  `roleID` int(11) NOT NULL,
  `tempID` int(11) NOT NULL,
  `dataInfo` varchar(4095) NOT NULL DEFAULT '',
  PRIMARY KEY (`roleID`,`tempID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `operatereward`
--

DROP TABLE IF EXISTS `operatereward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `operatereward` (
  `rewardList` varchar(4095) NOT NULL DEFAULT '[]'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pets`
--

DROP TABLE IF EXISTS `pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pets` (
  `roleID` int(11) NOT NULL,
  `petID` int(11) NOT NULL,
  `zhanli` int(11) NOT NULL DEFAULT '0',
  `level` int(10) NOT NULL DEFAULT '1',
  `exp` int(11) NOT NULL DEFAULT '0',
  `grade` int(11) NOT NULL DEFAULT '1',
  `skillList` varchar(512) NOT NULL DEFAULT '[]',
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`petID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `petsattribute`
--

DROP TABLE IF EXISTS `petsattribute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `petsattribute` (
  `roleID` int(11) NOT NULL,
  `petID` int(11) NOT NULL,
  `attack` int(11) NOT NULL DEFAULT '0',
  `defence` int(11) NOT NULL DEFAULT '0',
  `hp` int(11) NOT NULL DEFAULT '0',
  `mp` int(11) NOT NULL DEFAULT '0',
  `maxhp` int(11) NOT NULL DEFAULT '0',
  `maxmp` int(11) NOT NULL DEFAULT '0',
  `crit` int(11) NOT NULL DEFAULT '0',
  `critdamage` int(11) NOT NULL DEFAULT '0',
  `damageup` int(11) NOT NULL DEFAULT '0',
  `hunmireduce` int(11) NOT NULL DEFAULT '0',
  `houyangreduce` int(11) NOT NULL DEFAULT '0',
  `hprate` int(11) NOT NULL DEFAULT '0',
  `mprate` int(11) NOT NULL DEFAULT '0',
  `anticrit` int(11) NOT NULL DEFAULT '0',
  `critdamageduce` int(11) NOT NULL DEFAULT '0',
  `damagereduce` int(11) NOT NULL DEFAULT '0',
  `antihunmi` int(11) NOT NULL DEFAULT '0',
  `antihouyang` int(11) NOT NULL DEFAULT '0',
  `antifukong` int(11) NOT NULL DEFAULT '0',
  `antijitui` int(11) NOT NULL DEFAULT '0',
  `hunmirate` int(11) NOT NULL DEFAULT '0',
  `houyangrate` int(11) NOT NULL DEFAULT '0',
  `fukongrate` int(11) NOT NULL DEFAULT '0',
  `jituirate` int(11) NOT NULL DEFAULT '0',
  `freezeRate` int(10) NOT NULL DEFAULT '0',
  `stoneRate` int(10) NOT NULL DEFAULT '0',
  `antiFreeze` int(10) NOT NULL DEFAULT '0',
  `antiStone` int(10) NOT NULL,
  PRIMARY KEY (`roleID`,`petID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `physical`
--

DROP TABLE IF EXISTS `physical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `physical` (
  `roleID` int(11) NOT NULL,
  `purchaseNum` int(11) NOT NULL DEFAULT '0',
  `getPhysicalNum` int(11) NOT NULL DEFAULT '0',
  `givePhysicalNum` int(11) NOT NULL DEFAULT '0',
  `sentPhyTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `phyGiftRecord` varchar(2047) NOT NULL DEFAULT '',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playermagic`
--

DROP TABLE IF EXISTS `playermagic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playermagic` (
  `roleID` int(11) NOT NULL,
  `tempID` int(11) NOT NULL,
  `magicLevel` int(4) NOT NULL,
  PRIMARY KEY (`roleID`,`tempID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playeroffer`
--

DROP TABLE IF EXISTS `playeroffer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playeroffer` (
  `roleID` int(11) NOT NULL,
  `lady1Num` int(11) NOT NULL,
  `lady2Num` int(11) NOT NULL,
  `lady3Num` int(11) NOT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playersignout`
--

DROP TABLE IF EXISTS `playersignout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playersignout` (
  `roleID` int(11) NOT NULL,
  `leaveTime` datetime NOT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qqmembergift`
--

DROP TABLE IF EXISTS `qqmembergift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qqmembergift` (
  `accountID` int(11) NOT NULL,
  `giftID` int(11) NOT NULL,
  `serverID` varchar(45) NOT NULL DEFAULT '0',
  `status` int(4) DEFAULT '2',
  PRIMARY KEY (`accountID`,`giftID`,`serverID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recharge`
--

DROP TABLE IF EXISTS `recharge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recharge` (
  `rechargeID` int(11) NOT NULL AUTO_INCREMENT,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `rechargeType` int(11) NOT NULL DEFAULT '0',
  `validate` int(11) NOT NULL DEFAULT '0',
  `appCode` varchar(63) NOT NULL DEFAULT '',
  `buyID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`rechargeID`),
  KEY `idx_roleID` (`roleID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rewardmis`
--

DROP TABLE IF EXISTS `rewardmis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rewardmis` (
  `roleID` int(11) NOT NULL,
  `misState` varchar(63) NOT NULL DEFAULT '',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role` (
  `roleID` int(11) NOT NULL,
  `accountID` int(11) NOT NULL DEFAULT '0',
  `name` varchar(63) NOT NULL DEFAULT '',
  `tempID` int(11) NOT NULL DEFAULT '0',
  `expLevel` int(10) NOT NULL DEFAULT '1',
  `exp` int(11) NOT NULL DEFAULT '0',
  `zhanli` int(11) NOT NULL DEFAULT '0',
  `lifeNum` int(11) NOT NULL DEFAULT '0',
  `loginTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `vipPoint` int(11) NOT NULL DEFAULT '0',
  `LoginPrize` varchar(1023) NOT NULL DEFAULT '',
  `vipLevel` int(11) NOT NULL DEFAULT '0',
  `unionID` int(11) NOT NULL DEFAULT '0',
  `unionName` varchar(63) NOT NULL DEFAULT '',
  `Story` int(11) NOT NULL DEFAULT '0',
  `accountType` int(11) NOT NULL DEFAULT '0',
  `isBind` int(11) NOT NULL DEFAULT '0',
  `createTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `activeEnhanceSuitID` int(10) NOT NULL DEFAULT '0',
  `activeInsetSuitID` int(10) NOT NULL DEFAULT '0',
  `refreshTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `activeFashionWeaponID` int(10) NOT NULL DEFAULT '0',
  `activeFashionEquipID` int(10) NOT NULL DEFAULT '0',
  `isNobility` int(11) NOT NULL DEFAULT '0',
  `isQQMember` int(11) NOT NULL DEFAULT '0',
  `titleID` int(10) NOT NULL DEFAULT '0',
  `picture` varchar(512) NOT NULL DEFAULT '',
  `nickName` varchar(512) NOT NULL DEFAULT '',
  `openID` varchar(512) NOT NULL DEFAULT '',
  `serverUid` int(11) NOT NULL DEFAULT '0',
  `artifactSkill` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rolejjc`
--

DROP TABLE IF EXISTS `rolejjc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rolejjc` (
  `roleID` int(11) NOT NULL DEFAULT '0' ,
  `winNum` int(11) NOT NULL DEFAULT '0' ,
  `totalNum` int(11) NOT NULL DEFAULT '0' ,
  `credits` int(11) NOT NULL DEFAULT '0' ,
  `maxStreaking` int(11) NOT NULL DEFAULT '0' ,
  `streaking` int(11) NOT NULL DEFAULT '0' ,
  `jjcCoin` int(11) NOT NULL DEFAULT '0' ,
  `ranking` int(11) NOT NULL DEFAULT '0' ,
  `lastRanking` int(11) NOT NULL DEFAULT '0' ,
  `friendRanking` int(11) NOT NULL DEFAULT '0' ,
  `acrossRanking` int(11) NOT NULL DEFAULT '0' ,
  `lastAccrossRanking` int(11) NOT NULL DEFAULT '0' ,
  `dayChallengeTimes` int(11) NOT NULL DEFAULT '0' ,
  `refreshChallengeTime` int(11) NOT NULL DEFAULT '0' ,
  `lastRewardTime` int(11) NOT NULL DEFAULT '0' ,
  `lastAcrossRewardTime` int(11) NOT NULL DEFAULT '0' ,
  `lastDayRewardTime` int(11) NOT NULL DEFAULT '0' ,
  `vipBugTimes` int(11) NOT NULL DEFAULT '0' ,
  `lastvipBugTime` int(11) NOT NULL DEFAULT '0' ,
  `phase` int(11) NOT NULL DEFAULT '0' ,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rolestory`
--

DROP TABLE IF EXISTS `rolestory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rolestory` (
  `roleID` int(11) NOT NULL,
  `atkTimes` int(11) NOT NULL,
  `storyScore` int(11) NOT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roletemple`
--

DROP TABLE IF EXISTS `roletemple`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roletemple` (
  `roleID` int(11) NOT NULL,
  `freeTimes` int(11) NOT NULL,
  `buyTimes` int(11) NOT NULL,
  `cultureTimes` int(4) NOT NULL DEFAULT '0',
  `animalPrize` int(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rune`
--

DROP TABLE IF EXISTS `rune`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rune` (
  `roleID` int(11) NOT NULL,
  `runeID` int(11) NOT NULL,
  `SkillType` int(11) DEFAULT '0',
  PRIMARY KEY (`roleID`,`runeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicetime`
--

DROP TABLE IF EXISTS `servicetime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `servicetime` (
  `openTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`openTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop`
--

DROP TABLE IF EXISTS `shop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shop` (
  `shopID` int(11) NOT NULL,
  `roleID` int(11) NOT NULL,
  `buyNum` int(11) NOT NULL DEFAULT '0',
  `vipBuyTop` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`shopID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shoplingli`
--

DROP TABLE IF EXISTS `shoplingli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shoplingli` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `exchangeID` int(11) NOT NULL DEFAULT '0',
  `buyCount` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `idx_roleID` (`roleID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `skill`
--

DROP TABLE IF EXISTS `skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `skill` (
  `roleID` int(11) NOT NULL,
  `skillID` int(11) NOT NULL,
  `skillCD` int(11) NOT NULL DEFAULT '0',
  `RuneBranch` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`skillID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `soul`
--

DROP TABLE IF EXISTS `soul`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `soul` (
  `soulID` int(11) NOT NULL,
  `roleID` int(11) NOT NULL DEFAULT '0',
  `soulLevel` int(11) NOT NULL DEFAULT '0',
  `attTyp_0` int(11) NOT NULL DEFAULT '0',
  `attNum_0` int(11) NOT NULL DEFAULT '0',
  `attTyp_1` int(11) NOT NULL DEFAULT '0',
  `attNum_1` int(11) NOT NULL DEFAULT '0',
  `attTyp_2` int(11) NOT NULL DEFAULT '0',
  `attNum_2` int(11) NOT NULL DEFAULT '0',
  `probability` int(11) NOT NULL DEFAULT '0',
  `zhanli` int(11) NOT NULL DEFAULT '0',
  `skillNum` int(11) NOT NULL DEFAULT '0',
  `accomplish` int(11) NOT NULL DEFAULT '0',
  `evolveNum` int(11) NOT NULL DEFAULT '0',
  `wakeLevel` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`soulID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `soulpvp`
--

DROP TABLE IF EXISTS `soulpvp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `soulpvp` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `rankKey` int(11) NOT NULL DEFAULT '0',
  `maxRank` int(11) NOT NULL DEFAULT '0',
  `type` int(11) NOT NULL DEFAULT '0',
  `battleTimes` int(11) NOT NULL DEFAULT '0',
  `lastBattleTime` int(11) NOT NULL DEFAULT '0',
  `medal` int(11) NOT NULL DEFAULT '0',
  `totalMedal` int(11) NOT NULL DEFAULT '0',
  `shopTimes` int(11) NOT NULL DEFAULT '0',
  `lastShopTime` int(11) NOT NULL DEFAULT '0',
  `occupyTime` int(11) NOT NULL DEFAULT '0',
  `roleName` varchar(64) NOT NULL DEFAULT '',
  `defense1` int(11) NOT NULL DEFAULT '0',
  `defense2` int(11) NOT NULL DEFAULT '0',
  `defense3` int(11) NOT NULL DEFAULT '0',
  `battle1` int(11) NOT NULL DEFAULT '0',
  `battle2` int(11) NOT NULL DEFAULT '0',
  `battle3` int(11) NOT NULL DEFAULT '0',
  `cdTime` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `soulpvplog`
--

DROP TABLE IF EXISTS `soulpvplog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `soulpvplog` (
  `logID` int(11) NOT NULL DEFAULT '0',
  `roleID` int(11) NOT NULL DEFAULT '0',
  `type` int(11) NOT NULL DEFAULT '0',
  `rivalID` int(11) NOT NULL DEFAULT '0',
  `rivalName` varchar(63) NOT NULL DEFAULT '',
  `context` varchar(512) NOT NULL DEFAULT '',
  `createTime` varchar(128) NOT NULL DEFAULT '0',
  `changeRank` int(11) NOT NULL DEFAULT '0',
  `zhanli` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`logID`),
  KEY `idx_roleID` (`roleID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `soulsuccinct`
--

DROP TABLE IF EXISTS `soulsuccinct`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `soulsuccinct` (
  `soulID` int(11) NOT NULL DEFAULT '0',
  `succinctID` int(11) NOT NULL DEFAULT '0',
  `roleID` int(11) NOT NULL DEFAULT '0',
  `state` int(11) DEFAULT '0',
  `left_Att1` int(11) DEFAULT '0',
  `left_Att1Num` int(11) DEFAULT '0',
  `left_Att1State` int(11) DEFAULT '0',
  `left_Att2` int(11) DEFAULT '0',
  `left_Att2Num` int(11) DEFAULT '0',
  `left_Att2State` int(11) DEFAULT '0',
  `left_Att3` int(11) DEFAULT '0',
  `left_Att3Num` int(11) DEFAULT '0',
  `left_Att3State` int(11) DEFAULT '0',
  `right_Att1` int(11) DEFAULT '0',
  `right_Att1Num` int(11) DEFAULT '0',
  `right_Att2` int(11) DEFAULT '0',
  `right_Att2Num` int(11) DEFAULT '0',
  `right_Att3` int(11) DEFAULT '0',
  `right_Att3Num` int(11) DEFAULT '0',
  PRIMARY KEY (`roleID`,`soulID`,`succinctID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `succinctinfo`
--

DROP TABLE IF EXISTS `succinctinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `succinctinfo` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `succinctNum` int(11) DEFAULT '0',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `suit`
--

DROP TABLE IF EXISTS `suit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suit` (
  `roleID` int(12) NOT NULL DEFAULT '0',
  `strengthen` varchar(4095) DEFAULT '',
  `inlay` varchar(255) DEFAULT '',
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `title`
--

DROP TABLE IF EXISTS `title`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `title` (
  `roleID` int(12) NOT NULL DEFAULT '0',
  `titleID` varchar(64) NOT NULL DEFAULT '0',
  `stats` int(12) NOT NULL DEFAULT '0',
  PRIMARY KEY (`roleID`,`titleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tomarry`
--

DROP TABLE IF EXISTS `tomarry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tomarry` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `toMarryID` int(11) DEFAULT NULL,
  `toMarryTime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `state` int(1) DEFAULT NULL,
  `xinWuID` int(11) DEFAULT NULL,
  PRIMARY KEY (`roleID`,`toMarryTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionanimal`
--

DROP TABLE IF EXISTS `unionanimal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionanimal` (
  `unionID` int(11) NOT NULL,
  `unionName` varchar(63) NOT NULL,
  `fixTempID` int(11) NOT NULL,
  `currHPValue` int(11) NOT NULL,
  `attkTimes` int(11) NOT NULL,
  `defTimes` int(11) NOT NULL,
  `hpTimes` int(11) NOT NULL,
  `yuanbaoTimes` int(11) NOT NULL,
  `skillNum` int(3) NOT NULL,
  `isDefender` int(3) NOT NULL,
  `powerful` bigint(20) NOT NULL,
  PRIMARY KEY (`unionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionapply`
--

DROP TABLE IF EXISTS `unionapply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionapply` (
  `unionID` int(11) NOT NULL,
  `applyList` varchar(1023) NOT NULL,
  PRIMARY KEY (`unionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionculture`
--

DROP TABLE IF EXISTS `unionculture`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionculture` (
  `unionID` int(11) NOT NULL,
  `roleName` varchar(63) NOT NULL,
  `opType` int(2) NOT NULL,
  `opPara1` int(11) NOT NULL,
  `opPara2` int(11) NOT NULL,
  `createTime` datetime NOT NULL,
  KEY `unionID_index` (`unionID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniondata`
--

DROP TABLE IF EXISTS `uniondata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uniondata` (
  `unionID` int(11) NOT NULL DEFAULT '0',
  `lianYuCount` int(4) DEFAULT NULL,
  PRIMARY KEY (`unionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionfightdamage`
--

DROP TABLE IF EXISTS `unionfightdamage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionfightdamage` (
  `roleID` int(11) NOT NULL,
  `unionID` int(11) NOT NULL,
  `roleName` varchar(63) NOT NULL,
  `roleLevel` int(3) NOT NULL,
  `roleZhanli` int(11) NOT NULL,
  `fightDamage` bigint(20) NOT NULL,
  `attackTimes` int(3) NOT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniongiftreceive`
--

DROP TABLE IF EXISTS `uniongiftreceive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uniongiftreceive` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `fromID` int(11) NOT NULL DEFAULT '0',
  `createTime` datetime NOT NULL,
  PRIMARY KEY (`roleID`,`fromID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniongiftsend`
--

DROP TABLE IF EXISTS `uniongiftsend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uniongiftsend` (
  `unionID` int(11) NOT NULL DEFAULT '0',
  `roleID` int(11) NOT NULL DEFAULT '0',
  `giftID` int(11) NOT NULL DEFAULT '0',
  `createTime` datetime NOT NULL,
  `openID` varchar(512) DEFAULT NULL,
  `picture` varchar(512) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `viplevel` int(11) DEFAULT NULL,
  PRIMARY KEY (`unionID`,`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unioninfo`
--

DROP TABLE IF EXISTS `unioninfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unioninfo` (
  `unionID` int(11) NOT NULL,
  `unionName` varchar(63) NOT NULL,
  `unionLevel` int(10) NOT NULL,
  `unionZhanLi` int(11) NOT NULL,
  `unionWeiWang` int(11) NOT NULL,
  `memberNum` int(11) NOT NULL,
  `announcement` varchar(500) NOT NULL,
  `unionRanking` int(11) NOT NULL DEFAULT '0',
  `bossID` int(11) NOT NULL,
  `unionScore` int(11) NOT NULL DEFAULT '0',
  `scoreRank` int(11) NOT NULL DEFAULT '0',
  `ouccHel` int(11) NOT NULL DEFAULT '0',
  `isRegister` int(4) NOT NULL DEFAULT '0',
  `isDuke` int(4) NOT NULL DEFAULT '0',
  `fightDamage` bigint(20) NOT NULL DEFAULT '0',
  `animalPowerful` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`unionID`),
  UNIQUE KEY `unionName_UNIQUE` (`unionName`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionlog`
--

DROP TABLE IF EXISTS `unionlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionlog` (
  `unionID` int(11) NOT NULL,
  `type` int(2) NOT NULL,
  `roleID1` int(11) NOT NULL,
  `roleID2` int(11) NOT NULL DEFAULT '0',
  `roleName1` varchar(63) NOT NULL,
  `roleName2` varchar(63) NOT NULL DEFAULT '',
  `createTime` datetime NOT NULL,
  KEY `unionID_index` (`unionID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionmagic`
--

DROP TABLE IF EXISTS `unionmagic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionmagic` (
  `unionID` int(11) NOT NULL,
  `magicID` int(11) NOT NULL,
  `magicLevel` int(4) NOT NULL,
  PRIMARY KEY (`unionID`,`magicID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionmember`
--

DROP TABLE IF EXISTS `unionmember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionmember` (
  `roleID` int(11) NOT NULL,
  `unionID` int(11) NOT NULL,
  `unionRole` int(1) NOT NULL DEFAULT '0',
  `playerWeiWang` int(11) NOT NULL,
  `playerDevote` int(11) NOT NULL DEFAULT '0',
  `applyNum` int(3) NOT NULL,
  `devoteInit` int(1) NOT NULL DEFAULT '0',
  `createTime` datetime NOT NULL,
  `logTime` datetime NOT NULL DEFAULT '1970-01-01 00:00:00',
  PRIMARY KEY (`roleID`,`unionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionsDamage`
--

DROP TABLE IF EXISTS `unionsDamage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionsDamage` (
  `unionID` int(11) NOT NULL,
  `unionName` varchar(63) NOT NULL,
  `unionLevel` int(4) NOT NULL,
  `fightDamage` bigint(20) NOT NULL,
  `animalPowerful` bigint(20) NOT NULL,
  PRIMARY KEY (`unionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionsdamage`
--

DROP TABLE IF EXISTS `unionsdamage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionsdamage` (
  `unionID` int(11) NOT NULL,
  `unionName` varchar(63) NOT NULL,
  `unionLevel` int(4) NOT NULL,
  `fightDamage` bigint(20) NOT NULL,
  `animalPowerful` bigint(20) NOT NULL,
  PRIMARY KEY (`unionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unionshop`
--

DROP TABLE IF EXISTS `unionshop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unionshop` (
  `roleID` int(11) NOT NULL,
  `unionGoodsID` int(11) NOT NULL,
  `buyNum` int(4) NOT NULL,
  PRIMARY KEY (`roleID`,`unionGoodsID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniontemple`
--

DROP TABLE IF EXISTS `uniontemple`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `uniontemple` (
  `unionID` int(11) NOT NULL,
  `templeLevel` int(10) NOT NULL DEFAULT '1',
  `templeExp` int(11) NOT NULL,
  `lady1ItemID` int(11) NOT NULL,
  `lady1ItemNum` int(11) NOT NULL,
  `lady1PopNum` int(11) NOT NULL,
  `lady1PopDouble` int(11) NOT NULL,
  `lady1Offers` int(11) NOT NULL,
  `lady2ItemID` int(11) NOT NULL,
  `lady2ItemNum` int(11) NOT NULL,
  `lady2PopNum` int(11) NOT NULL,
  `lady2PopDouble` int(11) NOT NULL,
  `lady2Offers` int(11) NOT NULL,
  `lady3ItemID` int(11) NOT NULL,
  `lady3ItemNum` int(11) NOT NULL,
  `lady3PopNum` int(11) NOT NULL,
  `lady3PopDouble` int(11) NOT NULL,
  `lady3Offers` int(11) NOT NULL,
  PRIMARY KEY (`unionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vipinfo`
--

DROP TABLE IF EXISTS `vipinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vipinfo` (
  `roleID` int(11) NOT NULL,
  `buyPVPNum` int(10) NOT NULL DEFAULT '0',
  `freeSweepNum` int(10) NOT NULL DEFAULT '0',
  `physical` int(10) NOT NULL DEFAULT '0',
  `freeReliveNum` int(10) NOT NULL DEFAULT '0',
  `mineSweepNum` int(10) NOT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wedding`
--

DROP TABLE IF EXISTS `wedding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wedding` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `toMarryID` int(11) DEFAULT NULL,
  `weddingID` int(11) DEFAULT NULL,
  `marryLevel` int(1) DEFAULT NULL,
  `bless` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `worldboss`
--

DROP TABLE IF EXISTS `worldboss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `worldboss` (
  `bossId` int(11) NOT NULL,
  `npmId` int(11) NOT NULL DEFAULT '0',
  `hp` int(11) NOT NULL DEFAULT '0',
  `lastRoleID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`bossId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `xuanyan`
--

DROP TABLE IF EXISTS `xuanyan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `xuanyan` (
  `roleID` int(11) NOT NULL DEFAULT '0',
  `xuanYan` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`roleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'database_game'
--
/*!50003 DROP PROCEDURE IF EXISTS `debug_benchmark` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `debug_benchmark`(p_count int unsigned)
begin
  declare v_iter int unsigned;
  set v_iter = 0;
  while v_iter < p_count
  do
    CALL sp_saveRoleInfoDelete(30004409,1,0,1678,2,'2014-6-10 10:52:57',0,'',0,0);
    set v_iter = v_iter + 1;
  end while;
end ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `debug_repeat` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `debug_repeat`(IN TIMES INT)
BEGIN
	DECLARE v1 INT DEFAULT 1;
	SET v1 = TIMES;
	WHILE v1 > 0 DO
		SELECT * FROM role WHERE roleID = 30001001;
		SET v1 = v1 - 1;
	END WHILE;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_addFriendApply` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_addFriendApply`(IN _roleID INT, 
				IN _applyFriendID INT, 
				IN friendapplys VARCHAR(16383))
BEGIN	
	DECLARE _count					INT(1);
	SELECT count(*) INTO _count FROM `friendapply` WHERE `roleID`=_roleID AND applyFriendID = _applyFriendID;
		IF(_count < 1) THEN
			SET @sql = CONCAT('INSERT INTO `friendapply` 
			(`roleID`, `applyFriendID`, `applyTime`)
			VALUES', friendapplys,';');
			PREPARE stmt FROM @sql;
			EXECUTE stmt;
			DEALLOCATE PREPARE stmt;
		END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_asyncPvPAccomplishLose` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_asyncPvPAccomplishLose`(IN _rivalID				INT,
  	IN _rZhanli				INT,
  	IN _ownerID				INT,
  	IN _oZhanli				INT,
  	IN _areaWin				INT,
  	IN _rivalState			INT)
BEGIN
  	DECLARE _lost, _gain, _oLingli, _rLingli, cDay, vDay INT DEFAULT 0;
  	DECLARE A FLOAT DEFAULT 2.0;
  	DECLARE B INT DEFAULT 0;
  	DECLARE C INT DEFAULT 1000;
	START TRANSACTION;
		SELECT lingli FROM `role`WHERE roleID = _rivalID INTO _rLingli;
    	IF _areaWin > 0 THEN
    		IF _rLingli < 0 THEN
				SET _rLingli = 0;
			END IF;
    	  	IF _rZhanli > 0 THEN
				SET A = _oZhanli / _rZhanli;
			END IF;
			SET B = _rLingli;
			IF A >= 2.0 THEN
			SET _gain = B * 0.1 + C;
			ELSEIF A > 1.0 THEN
				SET _gain = B * 0.15 + C;
			ELSEIF A > 0.5 THEN
				SET _gain = B * 0.2 + C;
			ELSE
				SET _gain = B * 0.15 + C;
			END IF;
    	  	SET A = 2;
			IF _oZhanli > 0 THEN
				SET A = _rZhanli / _oZhanli;
			END IF;
    		SET B = _rLingli;
    		IF A >= 2 THEN
				SET _lost = B * 0.15;
			ELSEIF A > 1 THEN
				SET _lost = B * 0.20;
			ELSEIF A > 0.5 THEN
				SET _lost = B * 0.15;
			ELSE
				SET _lost = B * 0.10;
			END IF;
    		SET _rLingli = _rLingli - _lost;
    		IF _rLingli < 0 THEN
  			SET _rLingli = 0;
  		END IF;
   	END IF;
    	UPDATE `role` SET `lingli` = _rLingli WHERE `roleID` = _rivalID;
     	insert into `asyncpvprival` (roleID, otherID, otherType, lingliLost)
		value (_rivalID, _ownerID, _rivalState, _lost);
    	SELECT _gain, _lost, _rLingli, A;
  	COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_asyncPvPBlessReceived` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartAddBlackList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartAddBlackList`(IN _roleID INT)
BEGIN
	INSERT INTO chart_black VALUES (_roleID);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadAresInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadAresInfo`(IN _lastRoleID	INT)
BEGIN
  SELECT roleID, maxRank, `type`, rankKey, battleTimes, lastBattleTime, medal, totalMedal, shopTimes, occupyTime, lastShopTime, roleName
    FROM `ares` WHERE roleID>_lastRoleID ORDER BY roleID ASC LIMIT 300;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadAsset` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadAsset`(IN _AssetID INT,
	IN _START	INT,
  	IN _LIMIT	INT)
BEGIN
   	PREPARE STMT FROM "SELECT roleID, num FROM `assets` WHERE `tempID` = ? LIMIT ?, ?;";
  	SET @AssetID = _AssetID;
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @AssetID, @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadBlackList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadBlackList`(IN _roleID INT)
BEGIN
	SELECT roleID FROM chart_black LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadClimbScore` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadClimbScore`(IN _lastRoleID	INT)
BEGIN
  SELECT roleID, weekScore*1000+customNum as weekScore FROM `climb` WHERE roleID>_lastRoleID ORDER BY roleID ASC LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadHonor` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadHonor`(IN _lastRoleID INT)
BEGIN
  SELECT roleID, honor FROM `asyncpvp` WHERE roleID>_lastRoleID ORDER BY roleID ASC LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadMarryInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadMarryInfo`(IN _lastRoleID	INT)
BEGIN
   	SELECT a.roleID, a.toMarryID, a.marryTime, a.state, (b.yinYuanCount+c.yinYuanCount)AS yinYuan from
		marryinfo a LEFT JOIN marrygift b  ON a.state=1 and a.roleID = b.roleID  
		LEFT JOIN marrygift c ON a.toMarryID = c.roleID ;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadNiuDanScore` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadNiuDanScore`(IN _lastRoleID	INT,
	IN _TEMPID	INT)
BEGIN
  SELECT roleID, dataInfo AS awardScore FROM `operateinfo`  WHERE roleID>_lastRoleID AND tempID=_TEMPID ORDER BY roleID ASC LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadPet` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadPet`(IN _lastRoleID	INT)
BEGIN
	SELECT t1.`roleID`, `petID`, `status`, `zhanli`
	  FROM `pets` t1 ,
		   (SELECT DISTINCT `roleID` FROM `pets` WHERE `roleID` > _lastRoleID ORDER BY `roleID` ASC LIMIT 200) t2 
	 WHERE t1.`roleID` = t2.`roleID` 
	   AND `status` IN (1,2,3,4,5);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadRecharge` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadRecharge`(IN _lastRoleID	INT,
	IN _TEMPID	INT)
BEGIN
  SELECT roleID, dataInfo AS sevenRecharge FROM `operateinfo` WHERE roleID>_lastRoleID AND tempID=_TEMPID ORDER BY roleID ASC LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadRoleInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadRoleInfo`(IN _lastRoleID	INT)
BEGIN
  SELECT roleID, name, expLevel, zhanli, vipLevel, isNobility, isQQMember, picture wxPicture, nickName, openID, unionName, serverUid
    FROM `role` WHERE roleID>_lastRoleID ORDER BY roleID ASC LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadSoul` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadSoul`(IN _lastRoleID	INT)
BEGIN
   	SELECT a.roleID, GROUP_CONCAT(CAST(soulID as char)) soulID, GROUP_CONCAT(CAST(soulLevel as char)) soulLevel, SUM(a.zhanli) zhanli, b.name
   				FROM soul a LEFT JOIN role b ON a.roleID = b.roleID WHERE a.roleID>_lastRoleID GROUP BY roleID ORDER BY roleID ASC LIMIT 300;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadSoulPvpInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadSoulPvpInfo`(IN _lastRoleID	INT)
BEGIN
  SELECT roleID, maxRank, `type`, rankKey, battleTimes, lastBattleTime, medal, totalMedal, shopTimes, occupyTime, lastShopTime, roleName, defense1, defense2, defense3
    ,battle1, battle2, battle3, cdTime  FROM `soulpvp` WHERE roleID>_lastRoleID ORDER BY roleID ASC LIMIT 300;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadStory` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadStory`(IN _lastRoleID INT)
BEGIN
  SELECT roleID, storyScore FROM `rolestory` WHERE roleID>_lastRoleID ORDER BY roleID ASC LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_chartLoadUnion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadUnion`(IN _lastUnionID INT)
BEGIN
  SELECT * FROM `unioninfo` WHERE unionID>_lastUnionID ORDER BY unionID ASC LIMIT 1000;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_createRole` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_createRole`(IN _accountID 			INT,
	IN _roleID				INT,
	IN _roleTempID			INT,
  	IN _roleName			VARCHAR(63),
  	IN _expLevel			INT,
  	IN _zhanLi				INT,
	IN _lifeNum				INT,
	IN _serverUid			INT,
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
	INSERT INTO `role` (`roleID`, `accountID`, `name`, `tempID`,`expLevel`, `zhanli`, `lifeNum`, `loginTime`, `createTime`, `refreshTime`, `serverUid`)
 		VALUES (_roleID, _accountID, _roleName, _roleTempID, _expLevel, _zhanLi, _lifeNum, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), _serverUid);
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
CREATE PROCEDURE `sp_createTable`(IN _SrcDBName		VARCHAR(255),
	IN _SrcTableName	VARCHAR(255),
	IN _NewTableName	VARCHAR(255),
	IN _tableNum		INT)
BEGIN
	DECLARE _tableName	VARCHAR(255);
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
/*!50003 DROP PROCEDURE IF EXISTS `sp_createUnion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_createUnion`(IN _unionID 		INT, 
	IN _roleID 			INT,
	IN unionInfo	    VARCHAR(4095),
    IN unionMemberInfo  VARCHAR(4095))
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteAllMemFightDamage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteAllMemFightDamage`()
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	DELETE FROM `unionfightdamage`;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteAllUnionAnimal` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteAllUnionAnimal`()
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	DELETE FROM `unionanimal`;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteAllUnionInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteAllUnionInfo`(IN _unionID INT)
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	SELECT count(*) INTO _count FROM `unioninfo` WHERE `unionID`= _unionID;
		IF(_count>0) THEN
			DELETE FROM `unioninfo` WHERE `unionID`=_unionID;
		END IF;
	SELECT count(*) INTO _count FROM `unionmember` WHERE `unionID`= _unionID;
		IF(_count>0) THEN
			DELETE FROM `unionmember` WHERE `unionID`=_unionID;
		END IF;
	SELECT count(*) INTO _count FROM `unionmagic` WHERE `unionID`= _unionID;
		IF(_count>0) THEN
			DELETE FROM `unionmagic` WHERE `unionID`=_unionID;
		END IF;
	SELECT count(*) INTO _count FROM `uniontemple` WHERE `unionID`= _unionID;
		IF(_count>0) THEN
			DELETE FROM `uniontemple` WHERE `unionID`=_unionID;
		END IF;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteAllUnionsDamage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteAllUnionsDamage`()
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	DELETE FROM `unionsDamage`;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteCultureLog` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteCultureLog`()
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	DELETE FROM `unionculture`;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteMember` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deletePlayerOffer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deletePlayerOffer`()
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	DELETE FROM `playeroffer`;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteRole` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteRole`(IN _roleID INT)
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
	SELECT count(*) INTO _count FROM `achieve` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `achieve` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `activity` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `activity` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `alchemy` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `alchemy` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `areasco` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `areasco` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `assets` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `assets` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `asyncpvp` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `asyncpvp` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `asyncpvpbless` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `asyncpvpbless` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `asyncpvprival` WHERE `otherID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `asyncpvprival` WHERE `otherID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `asyncpvprival` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `asyncpvprival` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `attribute` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `attribute` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `chartprize` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `chartprize` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `climb` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `climb` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `friend` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `friend` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `friend` WHERE `friendID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `friend` WHERE `friendID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `friendphysical` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `friendphysical` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `friendphysical` WHERE `friendID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `friendphysical` WHERE `friendID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `gift` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `gift` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `giftusenum` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `giftusenum` WHERE `roleID`=_roleID;
		END IF;	
	SELECT count(*) INTO _count FROM `item` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `item` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `logingift` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `logingift` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `magicsoul` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `magicsoul` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `mail` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `mail` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `minesweep` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `minesweep` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `misfinish` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `misfinish` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `misgroup` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `misgroup` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `mission` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `mission` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `newplayer` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `newplayer` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `niudan` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `niudan` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `physical` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `physical` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `recharge` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `recharge` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `rewardmis` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `rewardmis` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `role` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `role` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `rune` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `rune` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `shop` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `shop` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `shoplingli` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `shoplingli` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `skill` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `skill` WHERE `roleID`=_roleID;
		END IF;
  	SELECT count(*) INTO _count FROM `soul` WHERE `roleID`=_roleID;
		IF(_count > 0) THEN
			DELETE FROM `soul` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `suit` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `suit` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `vipinfo` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `vipinfo` WHERE `roleID`=_roleID;
		END IF;  	
	SELECT count(*) INTO _count FROM `activitycd` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `activitycd` WHERE `roleID`=_roleID;
		END IF;  
	SELECT count(*) INTO _count FROM `operateinfo` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `operateinfo` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `title` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `title` WHERE `roleID`=_roleID;
		END IF;
    SELECT count(*) INTO _count FROM `chartreward` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `chartreward` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `chartrewardgettime` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `chartrewardgettime` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `exchange` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `exchange` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `monthcardreceive` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `monthcardreceive` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `areslog` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `areslog` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `fashion` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `fashion` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `soulpvp` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `soulpvp` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `soulpvplog` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `soulpvplog` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `soulsuccinct` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `soulsuccinct` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `succinctinfo` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `succinctinfo` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `askmagic` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `askmagic` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `magicoutput` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `magicoutput` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `soulsuccinct` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `soulsuccinct` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `succinctinfo` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `succinctinfo` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `noticeinfo` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `noticeinfo` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `playermagic` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `playermagic` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `roletemple` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `roletemple` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `friendapply` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `friendapply` WHERE `roleID`=_roleID;
		END IF;
	SELECT count(*) INTO _count FROM `pets` WHERE `roleID`=_roleID;
		IF(_count>0) THEN
			DELETE FROM `pets` WHERE `roleID`=_roleID;
		END IF;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteUnion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteUnionData` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteUnionData`()
BEGIN
 	DECLARE _result 				INT(0);
  	DELETE FROM `uniondata`;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteUnionGift` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteUnionGift`()
BEGIN
 	DECLARE _result 				INT(0);
  	DELETE FROM `uniongiftreceive`;
		DELETE FROM `uniongiftsend`;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteWorldBoss` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteWorldBoss`()
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	SELECT count(*) INTO _count FROM `worldboss`;
		IF(_count>0) THEN
			DELETE FROM `worldboss`;
		END IF;   
   SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deleteWorldBossByID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_deleteWorldBossByID`(IN _bossID VARCHAR(20))
BEGIN
	DECLARE _count					INT(1);
 	DECLARE _result 				INT(0);
  	SELECT count(*) INTO _count FROM `worldboss` WHERE `bossId`=_bossID;
		IF(_count>0) THEN
			DELETE FROM `worldboss` WHERE `bossId`=_bossID;
		END IF;   
   SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_enterUnion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_enterUnion`(IN _roleID 			INT,
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_friendAddByOutside` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_friendBless` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_friendBless`(IN _roleID INT,
 	IN _friendID INT)
BEGIN
 	DECLARE _result	INT(0);
  	UPDATE `friend`	SET blessLastDay = DAYOFYEAR(NOW())
		WHERE `roleID` = _roleID and `friendID` = _friendID;
 	SET _result = 0;
 	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_friendBlessCount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_friendBlessCount`(IN _roleID INT)
BEGIN
 	DECLARE _result		INT(0);
 	DECLARE _dayOfYear	INT(0);
 	SET _dayOfYear = DAYOFYEAR(NOW());
 	SELECT count(`friendID`) INTO _result FROM `friend`
		WHERE roleID = _roleID AND blessReceivedLastDay = _dayOfYear;
	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_friendBlessReceived` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_friendBlessReceived`(IN _roleID 		INT,
 	IN _friendID 	INT)
BEGIN
 	DECLARE _result	INT(0);
  	UPDATE `friend` SET blessReceivedLastDay = DAYOFYEAR(NOW()), blessCount = blessCount + 1
		WHERE `roleID` = _roleID and `friendID` = _friendID;
 	SET _result = 0;
	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_friendLoadList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_friendLoadList`(IN _roleID int, IN _friendType int)
BEGIN
 	SELECT * FROM `friend` WHERE roleID = _roleID AND friendType = _friendType;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_friendRemoveByOutside` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_friendRemoveByOutside`(IN _roleID 		INT,
	IN _friendIDs 	VARCHAR(16383))
BEGIN
 	SET @sql = CONCAT('DELETE FROM friend WHERE roleID = ', _roleID,' AND friendID IN (', _friendIDs, ')');
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
/*!50003 DROP PROCEDURE IF EXISTS `sp_getRoleInfoByID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getRoleInfoByID`(_roleID int)
BEGIN
  	SELECT * FROM `role` WHERE `roleID` = _roleID;
  	SELECT * FROM `item` WHERE `roleID` = _roleID AND bagType = 1;
  	SELECT * FROM `soul` WHERE `roleID` = _roleID;  	  
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getRoleInfoByName` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getRoleInfoByName`(_roleID INT)
BEGIN
	IF _roleID is not null THEN
		SELECT * FROM `role` WHERE `roleID` = _roleID;
		SELECT * FROM `item` WHERE `roleID` = _roleID AND bagType = 1;
		SELECT * FROM `soul` WHERE `roleID` = _roleID;
		SELECT * FROM `attribute` WHERE `roleID` = _roleID;
		SELECT * FROM `magicsoul` WHERE `roleID` = _roleID;
		SELECT * FROM `pets` LEFT JOIN `petsattribute` USING(`roleID`,`petID`) WHERE `status` IN (1,2,3,4,5) AND `roleID` = _roleID;
	ELSE
		SELECT null;
		SELECT null;
		SELECT null;
		SELECT null;
		SELECT null;
		SELECT null;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getServiceTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getServiceTime`(
	IN _dateStr	VARCHAR(63)
)
BEGIN
	DECLARE _openTime           DATETIME;
	SELECT `openTime` INTO _openTime FROM servicetime;
	IF (_openTime IS NULL) THEN
 		SET @sqlStr =CONCAT( 'INSERT INTO `servicetime` VALUES ', _dateStr,';');
 		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT `openTime` INTO _openTime FROM servicetime;
	END IF;
	SELECT _openTime;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_getVipInfoByRoleID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_getVipInfoByRoleID`(IN _roleID	 INT)
BEGIN
	SELECT vipPoint, vipLevel FROM role WHERE roleID = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_addItem` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_addItem`(IN roleId	INT,
	IN itemInfo	VARCHAR(16383))
BEGIN
	SET @sqlStr =CONCAT( 'insert into item values ', itemInfo,';');
	PREPARE s1 FROM @sqlStr;
	EXECUTE s1;
	DEALLOCATE PREPARE s1;
	SELECT 0 AS _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_addRoleAssetsInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_deleteAllItem` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_deleteAllItem`(IN _roleId			INT,
	IN _isClearProgress	INT,
	IN _isClearMoney	INT,
	IN _isClearLevel	INT,
	IN _isClearAsset	INT,
	IN _isClearItem		INT)
BEGIN
	IF (_isClearProgress = 1) THEN
		DELETE FROM `areasco` WHERE `roleID` = _roleId;
	END IF;
	IF (_isClearMoney = 1) THEN
		DELETE FROM `assets` WHERE `roleID` = _roleId AND `tempID` = 1001;
	END IF;
	IF (_isClearLevel = 1) THEN
		UPDATE `role` SET `expLevel` = 1, `exp` = 0 WHERE `roleID` = _roleId;
	END IF;
	IF (_isClearAsset = 1) THEN
		DELETE FROM `assets` WHERE `roleID` = _roleId;
	END IF;
	IF (_isClearItem = 1) THEN
		DELETE FROM `item` WHERE `roleID` = _roleId;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_deleteItem` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_deleteItem`(IN _roleId	INT,
	IN _itemId	INT,
	IN _itemNum	INT)
BEGIN
	IF _itemNum > 0 THEN
		DELETE FROM item WHERE roleID = _roleId AND itemTempID = _itemId ORDER BY zhanli LIMIT _itemNum;
	ELSE 
		DELETE FROM item WHERE roleID = _roleId AND itemTempID = _itemId;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getAllPlayerForbidInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getAllPlayerForbidInfo`()
BEGIN	
	SELECT roleID, forbidProfit, forbidChat, forbidChart, forbidPlay, forbidPlayList FROM forbid_list;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getAssetsInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getClimbScoreInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getExp` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getExp`(IN _roleId		INT)
BEGIN
	SELECT exp, expLevel FROM role WHERE roleID = _roleId;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getForbidChartTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getForbidChartTime`()
BEGIN
	SELECT roleID, forbidChart FROM forbid_list;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getForbidChatTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getForbidChatTime`()
BEGIN
	SELECT roleID, forbidChat FROM forbid_list;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getPlayerBasicInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getPlayerForbidInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getPlayerForbidInfo`(IN _roleID	INT)
BEGIN
	DECLARE _forbidProfit           VARCHAR(63);
	DECLARE _forbidChat		        VARCHAR(255);
	DECLARE _forbidChart            VARCHAR(2047);
	DECLARE _forbidPlay             VARCHAR(63);
	DECLARE _forbidPlayList         VARCHAR(2047);
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getPlayerInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
	DECLARE _createTime				VARCHAR(127);
	DECLARE _loginTime				VARCHAR(127);
	DECLARE	_zhanli					VARCHAR(127);	
	SELECT name, expLevel, createTime, loginTime, zhanli INTO _name, _expLevel, _createTime, _loginTime, _zhanli FROM role WHERE roleID = _roleID;

	IF _name is not null THEN
		SELECT num INTO _moneyNum FROM assets WHERE roleID = _roleID AND tempID=1001;
		SELECT num INTO _yuanbaoNum FROM assets WHERE roleID = _roleID AND tempID=1002;
		SELECT num INTO _physicalNum FROM assets WHERE roleID = _roleID AND tempID=15001;
		SELECT MAX(areaID) INTO _copyCount FROM areasco WHERE roleID = _roleID AND levelTarget=1;
		SELECT MAX(areaID) INTO _lyCount FROM areasco WHERE roleID = _roleID AND levelTarget=2;
		SELECT customNum INTO _climbNum FROM climb WHERE roleID = _roleID;
		SELECT TEMPID INTO _magicsoul FROM magicsoul WHERE roleID= _roleID;
		SELECT 0 as _result, _name, _expLevel, _moneyNum, _yuanbaoNum, _physicalNum, _copyCount, _lyCount, _climbNum, _magicsoul, _createTime, _loginTime, _zhanli;
	END IF;
	SELECT 5 as _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getPlayerInfoForOccupy` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getPlayerOccupyID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getRoleForbidChartTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleForbidChartTime`(IN _roleID		INT)
BEGIN
	SELECT forbidChart FROM forbid_list WHERE roleID = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getRoleJobType` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleJobType`(IN _roleId INT)
BEGIN
	SELECT tempID FROM role WHERE roleID = _roleId;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_getRoleListInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleListInfo`(IN _roleId		INT)
BEGIN
	DECLARE _expLevel			INT DEFAULT 0;
	DECLARE _roleName			VARCHAR(63) DEFAULT '';
	DECLARE _Title				VARCHAR(63) DEFAULT 'NoTitle';
	DECLARE _DevilNum			INT DEFAULT 0;
	DECLARE _DevilLevel			INT DEFAULT 0;
	DECLARE _DevilSkillLevel	INT DEFAULT 0;	
	SELECT expLevel, name INTO _expLevel, _roleName FROM role WHERE roleID = _roleId;
	SELECT COUNT(*) INTO _DevilNum FROM soul WHERE roleID = _roleId AND soulLevel != 0;
	SELECT _roleId, _expLevel, _roleName, _Title, _DevilNum, _DevilLevel, _DevilSkillLevel;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_removeForbid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_removeForbid`(IN _roleID		INT,
	IN _profitTime	DATETIME,
	IN _chatTime	VARCHAR(63),
	IN _chartTime	VARCHAR(63),
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setAssetsInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setAssetsInfo`(IN _roleID		INT,
	IN _tempID		INT,
	IN _setValue	INT)
BEGIN
	DECLARE _count	INT;
	DECLARE _tempCount INT;
	DECLARE _retCount INT;
	SELECT count(*), num INTO _count, _tempCount FROM `assets` WHERE `roleID` = _roleID AND `tempID` = _tempID;	
	IF(_count > 0) THEN
		UPDATE `assets` SET num = _setValue WHERE `roleID` = _roleID AND `tempID` = _tempID;
	ELSE
		INSERT INTO assets VALUES(_roleID, _tempID, _setValue);
		SET _tempCount = 0;
	END IF;
	SELECT num INTO _retCount FROM `assets` WHERE `roleID` = _roleID AND `tempID` = _tempID;
	SELECT 0 as _result, _tempCount, _retCount;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setClimbScoreInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setClimbZero` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setExp` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setExp`(IN _roleId		INT,
	IN _exp			INT,
	IN _expLevel	INT)
BEGIN
	UPDATE role SET expLevel = _expLevel, exp = _exp WHERE roleID = _roleId;
	SELECT 0 as _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setForbidChartTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidChartTime`(IN _roleID		INT,
	IN _dateTime	VARCHAR(2047))
BEGIN
	INSERT INTO forbid_list(roleID, forbidChart) values(_roleID, _dateTime)
		ON DUPLICATE KEY UPDATE forbidChart=_dateTime;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setForbidChatTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidChatTime`(IN _roleID		INT,
	IN _dateTime	VARCHAR(255))
BEGIN
	INSERT INTO forbid_list(roleID, forbidChat) values(_roleID, _dateTime)
		ON DUPLICATE KEY UPDATE forbidChat=_dateTime;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setForbidPlayInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidPlayInfo`(IN _roleID		INT,
	IN _dateTime	DATETIME,
	IN _dataList	VARCHAR(2047))
BEGIN
	INSERT INTO forbid_list(roleID, forbidPlay, forbidPlayList) values(_roleID, _dateTime, _dataList)
		ON DUPLICATE KEY UPDATE forbidPlay=_dateTime, forbidPlayList = _dataList;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_gm_setForbidProfitTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_gm_setForbidProfitTime`(IN _roleID		INT,
	IN _dateTime	DATETIME)
BEGIN
	INSERT INTO forbid_list(roleID, forbidProfit) values(_roleID, _dateTime)
		ON DUPLICATE KEY UPDATE forbidProfit=_dateTime;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_initRoleClimbInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_initRoleClimbInfo`()
BEGIN 	START TRANSACTION;
    SET SQL_SAFE_UPDATES =0;
	UPDATE `climb` SET climbData='[]',todayData='[]',customNum=0,time=0,weekScore=0,fastCarNum=1;
	COMMIT;
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
CREATE PROCEDURE `sp_load`(IN _table VARCHAR(255),
 	IN _roleID int)
BEGIN
  	SET @sql = concat('SELECT * FROM ', _table, ' WHERE roleID = ', _roleID, ';');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadArtifactInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadArtifactInfo`(IN `_roleID` int)
BEGIN
	SELECT * FROM `artifact` WHERE roleID = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadByAccountID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadByAccountID`(IN _table VARCHAR(255), IN _accountID int)
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
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadColiseumInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadColiseumInfo`(IN _roleID INT)
BEGIN
SELECT * FROM `coliseum` WHERE roleID = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadGiftNum` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadList`(IN _table VARCHAR(255))
BEGIN
  	SET @sql = concat('SELECT * FROM ', _table, ' ;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadMemFightDamage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadMemFightDamage`()
BEGIN
  	SET @sql = concat('SELECT * FROM unionfightdamage;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadPlayerApplyInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadPlayerApplyInfo`()
BEGIN
  	SET @sql = concat('SELECT * FROM playerapply;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadPlayerOffer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadPlayerOffer`()
BEGIN
  	SET @sql = concat('SELECT * FROM playeroffer;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadPvpInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadPvpInfo`(IN _lastRoleID	INT)
BEGIN
    SELECT * FROM `asyncpvp` WHERE roleID>_lastRoleID ORDER BY roleID ASC LIMIT 100;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadRoles` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadRoles`(IN _roleID	INT,
	IN _START	INT,
  	IN _LIMIT	INT)
BEGIN
   	PREPARE STMT FROM " SELECT ro.roleID, ro.zhanli, ass.num as honor FROM `role` ro, `assets` ass WHERE ro.roleID = ass.roleID and ass.tempID = 1101 LIMIT ?, ? ; ";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadToMarryInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadToMarryInfo`(IN _table VARCHAR(255), IN _roleID int)
BEGIN
  	SET @sql = concat('SELECT * FROM ', _table, ' WHERE roleID = ', _roleID, ' or toMarryID = ', _roleID, ';');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionAnimal` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionAnimal`()
BEGIN
  	SET @sql = concat('SELECT * FROM unionanimal;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionApplyInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionApplyInfo`()
BEGIN
  	SET @sql = concat('SELECT * FROM unionapply;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionData` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionData`(IN _table VARCHAR(255))
BEGIN
  	SET @sql = concat('SELECT * FROM ' , _table, ';');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionGiftInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionGiftInfo`(IN _table VARCHAR(255))
BEGIN
  	SET @sql = concat('SELECT * FROM ' , _table, ';');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionInfo`()
BEGIN
  	SET @sql = concat('SELECT * FROM unioninfo;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionMagicInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionMagicInfo`()
BEGIN
  	SET @sql = concat('SELECT unionID,magicID,magicLevel  FROM unionmagic;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionMemberInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionMemberInfo`()
BEGIN
  	SET @sql = concat('SELECT * FROM unionmember;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionRoleShopInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionRoleShopInfo`()
BEGIN
  	SET @sql = concat('SELECT roleID,unionGoodsID,buyNum  FROM unionshop;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionsDamage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionsDamage`()
BEGIN
  	SET @sql = concat('SELECT * FROM unionsDamage;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadUnionTemple` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadUnionTemple`()
BEGIN
  	SET @sql = concat('SELECT * FROM uniontemple;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_loadWorldBossById` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_loadWorldBossById`()
BEGIN
  	SELECT * FROM worldboss;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mailDel` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mailDel`(IN _roleID INT,
	IN _mailID INT)
BEGIN
	DECLARE _count	INT(1);
	SELECT count(*) INTO _count FROM `mail` WHERE `mailID` = _mailID;
		IF(_count > 0) THEN
			DELETE FROM `mail` WHERE `mailID` = _mailID;
		END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mailGetItem` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mailGetItem`(IN _roleID	INT,	
	IN _mailID 	INT)
BEGIN
 	UPDATE `mail` SET
  		mailState = 1,
 		itemID_0 = 0,
		itemNum_0 = 0,
		itemID_1 = 0,
		itemNum_1 = 0,
  		itemID_2 = 0,
 		itemNum_2 = 0,
  		itemID_3 = 0,
		itemNum_3 = 0,
  		itemID_4 = 0,
		itemNum_4 = 0
 	WHERE `mailID` = _mailID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mailLoadList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mailLoadList`(IN _roleID INT)
BEGIN
 	SELECT * FROM `mail` WHERE `roleID` = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mailSend` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mailSend`(IN _roleID 		INT,
	IN _sendID 		INT,
	IN _sendName 	VARCHAR(63),
 	IN _theme 		VARCHAR(63),
 	IN _content 	VARCHAR(255),
	IN _sendType 	INT,
	IN _sendUid 		VARCHAR(64),
	IN _itemID_0 	INT,
	IN _itemNum_0 	INT,
	IN _itemID_1 	INT,
	IN _itemNum_1 	INT,
	IN _itemID_2 	INT,
	IN _itemNum_2 	INT,
	IN _itemID_3 	INT,
	IN _itemNum_3 	INT,
	IN _itemID_4 	INT,
	IN _itemNum_4 	INT)
BEGIN
 	DECLARE _result		INT(0);
 	DECLARE _delMail	INT(0);
 	DECLARE _mailID		INT(0);
	SET _result = 0;
	SET _mailID = 0;
	INSERT INTO `mail` (`roleID`, `sendID`, `sendName`, `theme`, `content`,	`mailState`,
			`sendType`,	`sendTime`, `sendUid`, `itemID_0`, `itemNum_0`, `itemID_1`, `itemNum_1`, `itemID_2`, `itemNum_2`,
			`itemID_3`, `itemNum_3`, `itemID_4`, `itemNum_4`)
		VALUES (_roleID,_sendID, _sendName, _theme, _content, 0, _sendType, CURRENT_TIMESTAMP(), _sendUid, _itemID_0,
			_itemNum_0, _itemID_1, _itemNum_1, _itemID_2, _itemNum_2, _itemID_3, _itemNum_3, _itemID_4, _itemNum_4);
 		SET _mailID=LAST_INSERT_ID();	
 	SELECT _result, _mailID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mailSetState` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mailSetState`(IN _roleID	INT,
	IN _mailID	INT,
 	IN _State 	INT)
BEGIN
 	UPDATE `mail` SET `mailState` = _State WHERE `mailID` = _mailID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mergeAresGift` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mergeAresGift`()
BEGIN
  DECLARE _roleID INT;
  DECLARE _type INT;
  DECLARE _rankKey INT DEFAULT 0;
  DECLARE _lastRoleFetched INT;
  DECLARE _giftNum INT;
  DECLARE _mailContent VARCHAR(64);
	DECLARE c CURSOR FOR SELECT roleID,`type` FROM ares WHERE rankKey>0 ORDER BY rankKey ASC;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET _lastRoleFetched=1;

  SET _lastRoleFetched = 0;
  OPEN c;
  cursor_loop:LOOP
    FETCH c INTO _roleID,_type;
    IF _lastRoleFetched=1 THEN
      LEAVE cursor_loop;
    END IF;
    SET _rankKey = _rankKey + 1;
    IF _type=0 THEN
    	IF _rankKey=1 THEN
    		SET _giftNum = 300;
    	ELSEIF _rankKey=2 THEN
    		SET _giftNum = 250;
    	ELSEIF _rankKey=3 THEN
    		SET _giftNum = 200;
    	ELSEIF _rankKey>=4 AND _rankKey<=10 THEN
    		SET _giftNum = 170;
    	ELSEIF _rankKey>=11 AND _rankKey<=20 THEN
    		SET _giftNum = 140;
    	ELSEIF _rankKey>=21 AND _rankKey<=50 THEN
    		SET _giftNum = 120;
    	ELSEIF _rankKey>=51 AND _rankKey<=100 THEN
    		SET _giftNum = 100;
    	ELSEIF _rankKey>=101 AND _rankKey<=200 THEN
    		SET _giftNum = 90;
    	ELSEIF _rankKey>=201 AND _rankKey<=500 THEN
    		SET _giftNum = 80;
    	ELSEIF _rankKey>=501 AND _rankKey<=1000 THEN
    		SET _giftNum = 70;
    	ELSEIF _rankKey>=1001 AND _rankKey<=2000 THEN
    		SET _giftNum = 60;
    	ELSE
    		SET _giftNum = 50;
  		END IF;
  		
  		SET _mailContent = CONCAT('服务器数据互通，清除了您的竞技场排名信息，根据您之前的排名，补偿',CAST(_giftNum AS CHAR),'钻石。');
    	
    	INSERT INTO `mail` (`roleID`, `sendID`, `sendName`, `theme`, `content`,	`mailState`,
			  `sendType`,	`sendTime`, `sendUid`, `itemID_0`, `itemNum_0`, `itemID_1`, `itemNum_1`, `itemID_2`, `itemNum_2`,
			  `itemID_3`, `itemNum_3`, `itemID_4`, `itemNum_4`)
			VALUES (_roleID,0, '系统邮件', '数据互通补偿', _mailContent, 0, 0, CURRENT_TIMESTAMP(), '', 1002, _giftNum, 0, 0, 0, 0, 0, 0, 0, 0);
  	END IF;
  END LOOP cursor_loop;
  CLOSE c;
  SET _lastRoleFetched = 0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mergeOccupantGift` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mergeOccupantGift`()
BEGIN
  DECLARE _roleID INT;
  DECLARE _lastRoleFetched INT;
	DECLARE c CURSOR FOR SELECT roleID FROM occupant;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET _lastRoleFetched=1;

  SET _lastRoleFetched = 0;
  OPEN c;
  cursor_loop:LOOP
    FETCH c INTO _roleID;
    IF _lastRoleFetched=1 THEN
      LEAVE cursor_loop;
    END IF;

    INSERT INTO `mail` (`roleID`, `sendID`, `sendName`, `theme`, `content`,	`mailState`,
		  `sendType`,	`sendTime`, `sendUid`, `itemID_0`, `itemNum_0`, `itemID_1`, `itemNum_1`, `itemID_2`, `itemNum_2`,
		  `itemID_3`, `itemNum_3`, `itemID_4`, `itemNum_4`)
		VALUES (_roleID,0, '系统邮件', '数据互通补偿', '服务器数据互通，清除了您的炼狱占领信息，补偿您50钻石。', 0, 0, CURRENT_TIMESTAMP(), '', 1002, 50, 0, 0, 0, 0, 0, 0, 0, 0);
  END LOOP cursor_loop;
  CLOSE c;
  SET _lastRoleFetched = 0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mergeSoulPvpGift` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mergeSoulPvpGift`()
BEGIN
  DECLARE _roleID INT;
  DECLARE _rankKey INT DEFAULT 0;
  DECLARE _lastRoleFetched INT;
  DECLARE _giftNum INT;
  DECLARE _mailContent VARCHAR(64);
	DECLARE c CURSOR FOR SELECT roleID FROM soulpvp WHERE `type`=0 AND rankKey>0 ORDER BY rankKey ASC;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET _lastRoleFetched=1;

  SET _lastRoleFetched = 0;
  OPEN c;
  cursor_loop:LOOP
    FETCH c INTO _roleID;
    IF _lastRoleFetched=1 THEN
      LEAVE cursor_loop;
    END IF;

		SET _rankKey = _rankKey + 1;
    IF _rankKey=1 THEN
    	SET _giftNum = 300;
    ELSEIF _rankKey=2 THEN
    	SET _giftNum = 250;
    ELSEIF _rankKey=3 THEN
    	SET _giftNum = 200;
    ELSEIF _rankKey>=4 AND _rankKey<=10 THEN
    	SET _giftNum = 150;
    ELSEIF _rankKey>=11 AND _rankKey<=100 THEN
    	SET _giftNum = 100;
    ELSEIF _rankKey>=101 AND _rankKey<=500 THEN
    	SET _giftNum = 80;
    ELSEIF _rankKey>=501 AND _rankKey<=1000 THEN
    	SET _giftNum = 60;
    ELSE
    	SET _giftNum = 50;
  	END IF;
  	
  		SET _mailContent = CONCAT('服务器数据互通，清除了您的邪神竞技场排名信息，根据您之前的排名，补偿',CAST(_giftNum AS CHAR),'钻石。');

    INSERT INTO `mail` (`roleID`, `sendID`, `sendName`, `theme`, `content`,	`mailState`,
		  `sendType`,	`sendTime`, `sendUid`, `itemID_0`, `itemNum_0`, `itemID_1`, `itemNum_1`, `itemID_2`, `itemNum_2`,
		  `itemID_3`, `itemNum_3`, `itemID_4`, `itemNum_4`)
		VALUES (_roleID,0, '系统邮件', '数据互通补偿', _mailContent, 0, 0, CURRENT_TIMESTAMP(), '', 1002, _giftNum, 0, 0, 0, 0, 0, 0, 0, 0);

  END LOOP cursor_loop;
  CLOSE c;
  SET _lastRoleFetched = 0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_mergeUnionBattleGift` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_mergeUnionBattleGift`()
BEGIN
	DECLARE _dukeUnionID INT DEFAULT 0;
	DECLARE _giftNum INT;
  DECLARE _mailContent VARCHAR(64);
	
	SELECT unionID INTO _dukeUnionID FROM unioninfo WHERE isDuke>0 LIMIT 1;
	main_loop:LOOP
		IF _dukeUnionID=0 THEN
			LEAVE main_loop;
		END IF;
		
		SET _giftNum = 1000;
		SET _mailContent = CONCAT('服务器数据互通，清除了您的城主公会，下次活动重新夺取城主，补偿',CAST(_giftNum AS CHAR),'钻石。快去拿回属于你们的城主宝座吧！');
		INSERT INTO `mail` (`roleID`, `sendID`, `sendName`, `theme`, `content`,	`mailState`,
		  `sendType`,	`sendTime`, `sendUid`, `itemID_0`, `itemNum_0`, `itemID_1`, `itemNum_1`, `itemID_2`, `itemNum_2`,
		  `itemID_3`, `itemNum_3`, `itemID_4`, `itemNum_4`)
		SELECT roleID, 0, '系统邮件', '数据互通补偿', _mailContent, 0, 0, CURRENT_TIMESTAMP(), '', 1002, _giftNum, 0, 0, 0, 0, 0, 0, 0, 0
			FROM unionmember WHERE unionID=_dukeUnionID;
			
		SET _giftNum = 500;
		SET _mailContent = CONCAT('服务器数据互通，清除当前城主公会，下次活动重新夺取城主，补偿',CAST(_giftNum AS CHAR),'钻石。赶快来夺城主吧！');
		INSERT INTO `mail` (`roleID`, `sendID`, `sendName`, `theme`, `content`,	`mailState`,
		  `sendType`,	`sendTime`, `sendUid`, `itemID_0`, `itemNum_0`, `itemID_1`, `itemNum_1`, `itemID_2`, `itemNum_2`,
		  `itemID_3`, `itemNum_3`, `itemID_4`, `itemNum_4`)
		SELECT roleID, 0, '系统邮件', '数据互通补偿', _mailContent, 0, 0, CURRENT_TIMESTAMP(), '', 1002, _giftNum, 0, 0, 0, 0, 0, 0, 0, 0
			FROM unioninfo AS t1 INNER JOIN unionmember t2 USING(unionID) WHERE t1.unionID!=_dukeUnionID AND t1.isRegister>0;
			
			
		LEAVE main_loop;
	END LOOP main_loop;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_merge_data` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_merge_data`(IN _srcServerUid INT, IN _targetServerUid INT, IN _srcDBName VARCHAR(64), IN _targetDBName VARCHAR(64))
BEGIN
	DECLARE _result VARCHAR(64) DEFAULT 'Ok';
	DECLARE l_sql VARCHAR(1024);
	DECLARE EXIT HANDLER FOR SQLEXCEPTION
	BEGIN
		ROLLBACK;
		SET _result = 'Failed';
		SELECT _result;
	END;
	START TRANSACTION;
	IF EXISTS(SELECT * FROM `merge_history` WHERE serverUid=_srcServerUid) THEN
		SET _result = 'Already Merged, skip';
	ELSE
		SELECT 'BEGIN source sp_mergeOccupantGift';
		SET l_sql=CONCAT('CALL `', _srcDBName, '`.`sp_mergeOccupantGift`();');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END source sp_mergeOccupantGift';
		SELECT 'BEGIN target sp_mergeOccupantGift';
		CALL `sp_mergeOccupantGift`();
		SELECT 'END target sp_mergeOccupantGift';
		SELECT 'BEGIN source sp_mergeAresGift';
		SET l_sql=CONCAT('CALL `', _srcDBName, '`.`sp_mergeAresGift`();');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END source sp_mergeAresGift';
		SELECT 'BEGIN target sp_mergeAresGift';
		CALL `sp_mergeAresGift`();
		SELECT 'END target sp_mergeAresGift';
		SELECT 'BEGIN source sp_mergeSoulPvpGift';
		SET l_sql=CONCAT('CALL `', _srcDBName, '`.`sp_mergeSoulPvpGift`();');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END source sp_mergeSoulPvpGift';
		SELECT 'BEGIN target sp_mergeSoulPvpGift';
		CALL `sp_mergeSoulPvpGift`();
		SELECT 'END target sp_mergeSoulPvpGift';
		SELECT 'BEGIN source sp_mergeUnionBattleGift';
		SET l_sql=CONCAT('CALL `', _srcDBName, '`.`sp_mergeUnionBattleGift`();');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END source sp_mergeUnionBattleGift';
		SELECT 'BEGIN target sp_mergeUnionBattleGift';
		CALL `sp_mergeUnionBattleGift`();
		SELECT 'END target sp_mergeUnionBattleGift';
		SELECT 'BEGIN ares';
		SET l_sql=CONCAT('INSERT INTO `ares` SELECT * FROM `', _srcDBName, '`.`ares` WHERE `type`!=1;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		DELETE FROM `ares` WHERE `type`=1;
		UPDATE `ares` SET rankKey=0;
		SELECT 'END ares';
		SELECT 'BEGIN areslog';
		DELETE FROM `areslog`;
		SELECT 'END areslog';
		SELECT 'BEGIN occupant';
		DELETE FROM `occupant`;
		SELECT 'END occupant';
		SELECT 'BEGIN soulpvp';
		DELETE FROM `soulpvp`;
		SELECT 'END soulpvp';
		SELECT 'BEGIN soulpvplog';
		DELETE FROM `soulpvplog`;
		SELECT 'END soulpvplog';
		SELECT 'BEGIN unionanimal';
		DELETE FROM `unionanimal`;
		SELECT 'END unionanimal';
		SELECT 'BEGIN unionfightdamage';
		DELETE FROM `unionfightdamage`;
		SELECT 'END unionfightdamage';
		SELECT 'BEGIN unionsDamage';
		DELETE FROM `unionsDamage`;
		SELECT 'END unionsDamage';
		SELECT 'BEGIN achieve';
		SET l_sql=CONCAT('INSERT INTO `achieve` SELECT * FROM `', _srcDBName, '`.`achieve`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END achieve';
		SELECT 'BEGIN activity';
		SET l_sql=CONCAT('INSERT INTO `activity` SELECT * FROM `', _srcDBName, '`.`activity`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END activity';
		SELECT 'BEGIN activitycd';
		SET l_sql=CONCAT('INSERT INTO `activitycd` SELECT * FROM `', _srcDBName, '`.`activitycd`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END activitycd';
		SELECT 'BEGIN alchemy';
		SET l_sql=CONCAT('INSERT INTO `alchemy` SELECT * FROM `', _srcDBName, '`.`alchemy`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END alchemy';
		SELECT 'BEGIN areasco';
		SET l_sql=CONCAT('INSERT INTO `areasco` SELECT * FROM `', _srcDBName, '`.`areasco`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END areasco';
		SELECT 'BEGIN askmagic';
		SET l_sql=CONCAT('INSERT INTO `askmagic` SELECT * FROM `', _srcDBName, '`.`askmagic`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END askmagic';
		SELECT 'BEGIN assets';
		SET l_sql=CONCAT('INSERT INTO `assets` SELECT * FROM `', _srcDBName, '`.`assets`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END assets';
		SELECT 'BEGIN asyncpvp';
		SET l_sql=CONCAT('INSERT INTO `asyncpvp` SELECT * FROM `', _srcDBName, '`.`asyncpvp`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END asyncpvp';
		SELECT 'BEGIN asyncpvpbless';
		SET l_sql=CONCAT('INSERT INTO `asyncpvpbless` SELECT * FROM `', _srcDBName, '`.`asyncpvpbless`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END asyncpvpbless';
		SELECT 'BEGIN asyncpvprival';
		SET l_sql=CONCAT('INSERT INTO `asyncpvprival`(`roleID`,`otherID`,`otherType`,`lingliLost`) SELECT `roleID`,`otherID`,`otherType`,`lingliLost` FROM `', _srcDBName, '`.`asyncpvprival`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END asyncpvprival';
		SELECT 'BEGIN attribute';
		SET l_sql=CONCAT('INSERT INTO `attribute` SELECT * FROM `', _srcDBName, '`.`attribute`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END attribute';
		SELECT 'BEGIN chart_black';
		SET l_sql=CONCAT('INSERT INTO `chart_black` SELECT * FROM `', _srcDBName, '`.`chart_black`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END chart_black';
		SELECT 'BEGIN chartprize';
		SET l_sql=CONCAT('INSERT INTO `chartprize` SELECT * FROM `', _srcDBName, '`.`chartprize`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END chartprize';
		SELECT 'BEGIN chartreward';
		SET l_sql=CONCAT('INSERT INTO `chartreward` SELECT * FROM `', _srcDBName, '`.`chartreward`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END chartreward';
		SELECT 'BEGIN chartrewardgettime';
		SET l_sql=CONCAT('INSERT INTO `chartrewardgettime` SELECT * FROM `', _srcDBName, '`.`chartrewardgettime`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END chartrewardgettime';
		SELECT 'BEGIN climb';
		SET l_sql=CONCAT('INSERT INTO `climb` SELECT * FROM `', _srcDBName, '`.`climb`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END climb';
		SELECT 'BEGIN exchange';
		SET l_sql=CONCAT('INSERT INTO `exchange` SELECT * FROM `', _srcDBName, '`.`exchange`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END exchange';
		SELECT 'BEGIN fashion';
		SET l_sql=CONCAT('INSERT INTO `fashion` SELECT * FROM `', _srcDBName, '`.`fashion`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END fashion';
		SELECT 'BEGIN forbid_list';
		SET l_sql=CONCAT('INSERT INTO `forbid_list` SELECT * FROM `', _srcDBName, '`.`forbid_list`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END forbid_list';
		SELECT 'BEGIN friend';
		SET l_sql=CONCAT('INSERT INTO `friend` SELECT * FROM `', _srcDBName, '`.`friend`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END friend';
		SELECT 'BEGIN friendapply';
		SET l_sql=CONCAT('INSERT INTO `friendapply` SELECT * FROM `', _srcDBName, '`.`friendapply`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END friendapply';
		SELECT 'BEGIN friendphysical';
		SET l_sql=CONCAT('INSERT IGNORE INTO `friendphysical` SELECT * FROM `', _srcDBName, '`.`friendphysical`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END friendphysical';
		SELECT 'BEGIN gift';
		SET l_sql=CONCAT('INSERT INTO `gift` SELECT * FROM `', _srcDBName, '`.`gift`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END gift';
		SELECT 'BEGIN giftusenum';
		SET l_sql=CONCAT('INSERT INTO `giftusenum`(`roleID`,`giftID`,`useNum`) SELECT `roleID`,`giftID`,`useNum` FROM `', _srcDBName, '`.`giftusenum`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END giftusenum';
		SELECT 'BEGIN item';
		SET l_sql=CONCAT('INSERT INTO `item` SELECT * FROM `', _srcDBName, '`.`item`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END item';
		SELECT 'BEGIN limitgoods';
		SET l_sql=CONCAT('INSERT INTO `limitgoods` SELECT * FROM `', _srcDBName, '`.`limitgoods`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END limitgoods';
		SELECT 'BEGIN logingift';
		SET l_sql=CONCAT('INSERT INTO `logingift` SELECT * FROM `', _srcDBName, '`.`logingift`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END logingift';
		SELECT 'BEGIN magicoutput';
		SET l_sql=CONCAT('INSERT INTO `magicoutput` SELECT * FROM `', _srcDBName, '`.`magicoutput`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END magicoutput';
		SELECT 'BEGIN magicsoul';
		SET l_sql=CONCAT('INSERT INTO `magicsoul` SELECT * FROM `', _srcDBName, '`.`magicsoul`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END magicsoul';
		SELECT 'BEGIN mail';
		SET l_sql=CONCAT('INSERT INTO `mail`(`roleID`,`sendID`,`sendName`,`theme`,`content`,`mailState`,`sendType`,`sendTime`,`itemID_0`,`itemNum_0`,`itemID_1`,`itemNum_1`,`itemID_2`,`itemNum_2`,`itemID_3`,`itemNum_3`,`itemID_4`,`itemNum_4`,`sendUid`) SELECT `roleID`,`sendID`,`sendName`,`theme`,`content`,`mailState`,`sendType`,`sendTime`,`itemID_0`,`itemNum_0`,`itemID_1`,`itemNum_1`,`itemID_2`,`itemNum_2`,`itemID_3`,`itemNum_3`,`itemID_4`,`itemNum_4`,`sendUid` FROM `', _srcDBName, '`.`mail`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END mail';
		SELECT 'BEGIN merge_history';
		SET l_sql=CONCAT('INSERT INTO `merge_history` SELECT * FROM `', _srcDBName, '`.`merge_history`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END merge_history';
		SELECT 'BEGIN minesweep';
		SET l_sql=CONCAT('INSERT INTO `minesweep` SELECT * FROM `', _srcDBName, '`.`minesweep`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END minesweep';
		SELECT 'BEGIN misfinish';
		SET l_sql=CONCAT('INSERT INTO `misfinish` SELECT * FROM `', _srcDBName, '`.`misfinish`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END misfinish';
		SELECT 'BEGIN misgroup';
		SET l_sql=CONCAT('INSERT INTO `misgroup` SELECT * FROM `', _srcDBName, '`.`misgroup`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END misgroup';
		SELECT 'BEGIN mission';
		SET l_sql=CONCAT('INSERT INTO `mission` SELECT * FROM `', _srcDBName, '`.`mission`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END mission';
		SELECT 'BEGIN monthcardreceive';
		SET l_sql=CONCAT('INSERT INTO `monthcardreceive` SELECT * FROM `', _srcDBName, '`.`monthcardreceive`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END monthcardreceive';
		SELECT 'BEGIN newplayer';
		SET l_sql=CONCAT('INSERT INTO `newplayer` SELECT * FROM `', _srcDBName, '`.`newplayer`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END newplayer';
		SELECT 'BEGIN niudan';
		SET l_sql=CONCAT('INSERT INTO `niudan` SELECT * FROM `', _srcDBName, '`.`niudan`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END niudan';
		SELECT 'BEGIN noticeinfo';
		SET l_sql=CONCAT('INSERT INTO `noticeinfo` SELECT * FROM `', _srcDBName, '`.`noticeinfo`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END noticeinfo';
		SELECT 'BEGIN operateinfo';
		SET l_sql=CONCAT('INSERT INTO `operateinfo` SELECT * FROM `', _srcDBName, '`.`operateinfo`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END operateinfo';
		SELECT 'BEGIN operatereward';
		SET l_sql=CONCAT('INSERT INTO `operatereward` SELECT * FROM `', _srcDBName, '`.`operatereward`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END operatereward';
		SELECT 'BEGIN physical';
		SET l_sql=CONCAT('INSERT INTO `physical` SELECT * FROM `', _srcDBName, '`.`physical`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END physical';
		SELECT 'BEGIN playerapply';
		SET l_sql=CONCAT('INSERT INTO `playerapply` SELECT * FROM `', _srcDBName, '`.`playerapply`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END playerapply';
		SELECT 'BEGIN playermagic';
		SET l_sql=CONCAT('INSERT INTO `playermagic` SELECT * FROM `', _srcDBName, '`.`playermagic`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END playermagic';
		SELECT 'BEGIN playeroffer';
		SET l_sql=CONCAT('INSERT INTO `playeroffer` SELECT * FROM `', _srcDBName, '`.`playeroffer`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END playeroffer';
		SELECT 'BEGIN qqmembergift';
		UPDATE `qqmembergift` SET serverID=_targetServerUid WHERE serverID=0;
		SET l_sql=CONCAT('UPDATE `', _srcDBName, '`.`qqmembergift` SET serverID=? WHERE serverID=0;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		SET @arg=_srcServerUid;
		EXECUTE s1 USING @arg;
		DEALLOCATE PREPARE s1;
		SET l_sql=CONCAT('INSERT INTO `qqmembergift` SELECT * FROM `', _srcDBName, '`.`qqmembergift`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END qqmembergift';
		SELECT 'BEGIN recharge';
		SET l_sql=CONCAT('INSERT INTO `recharge`(`roleID`,`rechargeType`,`validate`,`appCode`,`buyID`) SELECT `roleID`,`rechargeType`,`validate`,`appCode`,`buyID` FROM `', _srcDBName, '`.`recharge`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END recharge';
		SELECT 'BEGIN rewardmis';
		SET l_sql=CONCAT('INSERT INTO `rewardmis` SELECT * FROM `', _srcDBName, '`.`rewardmis`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END rewardmis';
		SELECT 'BEGIN role';
		UPDATE `role` SET serverUid=_targetServerUid WHERE serverUid=0;
		SET l_sql=CONCAT('UPDATE `', _srcDBName, '`.`role` SET serverUid=? WHERE serverUid=0;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		SET @arg=_srcServerUid;
		EXECUTE s1 USING @arg;
		DEALLOCATE PREPARE s1;
		SET l_sql=CONCAT('INSERT INTO `role` SELECT * FROM `', _srcDBName, '`.`role`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END role';
		SELECT 'BEGIN roletemple';
		SET l_sql=CONCAT('INSERT INTO `roletemple` SELECT * FROM `', _srcDBName, '`.`roletemple`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END roletemple';
		SELECT 'BEGIN rune';
		SET l_sql=CONCAT('INSERT INTO `rune` SELECT * FROM `', _srcDBName, '`.`rune`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END rune';
		SELECT 'BEGIN shop';
		SET l_sql=CONCAT('INSERT INTO `shop` SELECT * FROM `', _srcDBName, '`.`shop`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END shop';
		SELECT 'BEGIN shoplingli';
		SET l_sql=CONCAT('INSERT INTO `shoplingli`(`roleID`,`exchangeID`,`buyCount`) SELECT `roleID`,`exchangeID`,`buyCount` FROM `', _srcDBName, '`.`shoplingli`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END shoplingli';
		SELECT 'BEGIN skill';
		SET l_sql=CONCAT('INSERT INTO `skill` SELECT * FROM `', _srcDBName, '`.`skill`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END skill';
		SELECT 'BEGIN soul';
		SET l_sql=CONCAT('INSERT INTO `soul` SELECT * FROM `', _srcDBName, '`.`soul`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END soul';
		SELECT 'BEGIN soulsuccinct';
		SET l_sql=CONCAT('INSERT INTO `soulsuccinct` SELECT * FROM `', _srcDBName, '`.`soulsuccinct`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END soulsuccinct';
		SELECT 'BEGIN succinctinfo';
		SET l_sql=CONCAT('INSERT INTO `succinctinfo` SELECT * FROM `', _srcDBName, '`.`succinctinfo`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END succinctinfo';
		SELECT 'BEGIN suit';
		SET l_sql=CONCAT('INSERT INTO `suit` SELECT * FROM `', _srcDBName, '`.`suit`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END suit';
		SELECT 'BEGIN title';
		SET l_sql=CONCAT('INSERT INTO `title` SELECT * FROM `', _srcDBName, '`.`title`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END title';
		SELECT 'BEGIN unionapply';
		SET l_sql=CONCAT('INSERT INTO `unionapply` SELECT * FROM `', _srcDBName, '`.`unionapply`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END unionapply';
		SELECT 'BEGIN uniondata';
		SET l_sql=CONCAT('INSERT INTO `uniondata` SELECT * FROM `', _srcDBName, '`.`uniondata`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END uniondata';
		SELECT 'BEGIN uniongiftreceive';
		SET l_sql=CONCAT('INSERT INTO `uniongiftreceive` SELECT * FROM `', _srcDBName, '`.`uniongiftreceive`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END uniongiftreceive';
		SELECT 'BEGIN uniongiftsend';
		SET l_sql=CONCAT('INSERT INTO `uniongiftsend` SELECT * FROM `', _srcDBName, '`.`uniongiftsend`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END uniongiftsend';
		SELECT 'BEGIN unioninfo';
		UPDATE `unioninfo` SET isRegister=1,isDuke=0 WHERE isDuke>0;
		SET l_sql=CONCAT('UPDATE `', _srcDBName, '`.`unioninfo` SET isRegister=1,isDuke=0 WHERE isDuke>0;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SET l_sql=CONCAT('INSERT INTO `unioninfo` SELECT * FROM `', _srcDBName, '`.`unioninfo`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END unioninfo';
		SELECT 'BEGIN unionlog';
		SET l_sql=CONCAT('INSERT INTO `unionlog` SELECT * FROM `', _srcDBName, '`.`unionlog`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END unionlog';
		SELECT 'BEGIN unionmagic';
		SET l_sql=CONCAT('INSERT INTO `unionmagic` SELECT * FROM `', _srcDBName, '`.`unionmagic`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END unionmagic';
		SELECT 'BEGIN unionmember';
		SET l_sql=CONCAT('INSERT INTO `unionmember` SELECT * FROM `', _srcDBName, '`.`unionmember`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END unionmember';
		SELECT 'BEGIN unionshop';
		SET l_sql=CONCAT('INSERT INTO `unionshop` SELECT * FROM `', _srcDBName, '`.`unionshop`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END unionshop';
		SELECT 'BEGIN uniontemple';
		SET l_sql=CONCAT('INSERT INTO `uniontemple` SELECT * FROM `', _srcDBName, '`.`uniontemple`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END uniontemple';
		SELECT 'BEGIN vipinfo';
		SET l_sql=CONCAT('INSERT INTO `vipinfo` SELECT * FROM `', _srcDBName, '`.`vipinfo`;');
		SET @sql=l_sql;
		PREPARE s1 FROM @sql;
		EXECUTE s1;
		DEALLOCATE PREPARE s1;
		SELECT 'END vipinfo';
		INSERT INTO merge_history(serverUid,targetUid) VALUES(_srcServerUid,_targetServerUid);
	END IF;
	COMMIT;
	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_noticeInfoAdd` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_noticeInfoAdd`(IN _typeID INT,
 	IN _npcID  INT,
 	IN _falg   INT)
BEGIN
 	INSERT INTO `notice` VALUES(_typeID, _npcID, _falg); 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_noticeInfoLoad` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_noticeInfoLoad`()
BEGIN
 	SELECT * FROM `notice`;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_OccupantInfoLoad` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_OccupantInfoLoad`()
BEGIN
	SELECT * FROM `occupant`;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_OccupantInfoSave` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_OccupantInfoSave`(IN	_str  		VARCHAR(16383))
BEGIN
	DECLARE _count	INT(1);
 	START TRANSACTION;
	SELECT count(*) INTO _count FROM `occupant`;
		IF(_count > 0) THEN
			DELETE FROM `occupant`;
		END IF;
 	IF( LENGTH( _str ) ) THEN
 		SET @sqlStr =CONCAT( 'insert into `occupant` value', _str,';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
 	END IF;
 	COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_rechargeGetID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_rechargeGetID`(IN _roleID INT,
 	IN _buyID  INT)
BEGIN
 	DECLARE _result		INT(0);
 	INSERT INTO `gift` (`roleID`, `buyID`) VALUES (_roleID,_buyID);
 	SET _result=LAST_INSERT_ID();
 	SELECT _result; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_rechargeGetList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_rechargeGetList`(IN _roleID INT)
BEGIN
 	SELECT * FROM `recharge` WHERE rechargeType != 2 AND roleID = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_refreshPhyList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_refreshPhyList`(IN _roleID INT)
BEGIN
  	UPDATE `friendphysical` SET givePhy = 0, receivePhy = 0 WHERE `roleID` = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_removeFriendApply` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_removeFriendApply`(IN _roleID 		INT,

	IN _friendID 	INT)
BEGIN
 	SET @sql = CONCAT('DELETE FROM friendapply WHERE roleID = ', _roleID,' AND applyFriendID = (', _friendID, ')');
 	PREPARE stmt FROM @sql;
 	EXECUTE stmt;
 	DEALLOCATE PREPARE stmt; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_resetOperateInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_resetOperateInfo`(IN _TEMPID	INT)
BEGIN
	DECLARE _count	INT(1);
   	SELECT count(*) INTO _count FROM `operateinfo` WHERE `tempID`=_TEMPID;
		IF(_count > 0) THEN
			DELETE FROM `operateinfo` WHERE `tempID`=_TEMPID;
		END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_save` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_save`(IN _table	VARCHAR(255),  IN _str VARCHAR(16383))
BEGIN
	IF( LENGTH( _str ) ) THEN
		SET @sqlStr =CONCAT( 'replace into `', _table, '` values ', _str,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveAgreeMarry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveAgreeMarry`(IN _marryID int, IN _roleID int, _xinWuID int)
BEGIN
	DECLARE _marry	INT(11);
	SELECT count(*) INTO _marry FROM `marryinfo` WHERE (`roleID` = _marryID or `toMarryID` = _marryID) and state=1 ;
		IF(0 = _marry) THEN
			INSERT INTO `marryinfo` VALUES (_marryID, _roleID, NOW(), 1, 0, _xinWuID);
			UPDATE tomarry SET state = 1 , toMarryTime = NOW() WHERE `roleID` = _marryID AND `toMarryID` = _roleID and `state` = 0;
		END IF;
	SET @sql = concat('SELECT toMarryID FROM marryinfo WHERE roleID = ', _marryID , ' and state = 1;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveAsyncPvPRival` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveAsyncPvPRival`(IN 	_roleID		INT,
 	IN	_str  		VARCHAR(16383))
BEGIN
	DECLARE _count	INT(1);
 	START TRANSACTION;
	SELECT count(*) INTO _count FROM `asyncpvprival` WHERE roleID = _roleID;
		IF(_count > 0) THEN
			DELETE FROM `asyncpvprival` WHERE roleID = _roleID;
		END IF;
 	IF( LENGTH( _str ) ) THEN
 		SET @sqlStr =CONCAT( 'insert into `asyncpvprival` (roleID, otherID, otherType, lingliLost) values', _str,';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
 	END IF;
 	COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveAsyncPvPRivalOffline` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveBoss` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveBoss`(IN _bossID 	INT,
	IN BossInfo	VARCHAR(4095))
BEGIN
	DECLARE _count	INT(1);
 	START TRANSACTION;
	SELECT count(*) INTO _count FROM `worldboss` WHERE bossId = _bossID ;
		IF(_count > 0) THEN
			DELETE FROM `worldboss` WHERE bossId = _bossID;
		END IF;
 	IF( LENGTH( BossInfo ) ) THEN
 		SET @sqlStr =CONCAT( 'insert into `worldboss` values', BossInfo,';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
 	END IF;
 	COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveChartRewardList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveChartRewardList`(IN _table		VARCHAR(255),
 	IN _roleID 		INT,
 	IN _chartType 		INT,
 	IN _str  		VARCHAR(16383))
BEGIN
	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE roleID = ', _roleID, ' 
														AND chartType = ', _chartType, ';');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
	IF(@_count > 0) THEN
		SET @sql = concat(
			'DELETE FROM `', _table,'` WHERE roleID = ', _roleID, ' AND chartType = ', _chartType, ';'
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveDivorceAgree` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveDivorceAgree`(IN _roleID int ,IN _marryID int)
BEGIN
	SET @sql = concat('INSERT INTO tomarry VALUES (', _roleID , ' , ', _marryID , ', NOW(), 3, 0)');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveDivorceMarry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveDivorceMarry`(IN _marryID int, IN _roleID int)
BEGIN

	DECLARE _divorce	INT(11);
	SELECT count(*) INTO _divorce FROM `tomarry` WHERE `roleID` = _marryID AND `toMarryID` = _roleID and state=3 ;
		IF(0 < _divorce) THEN
			UPDATE tomarry SET state = 4 , toMarryTime = NOW() WHERE `roleID` = _marryID AND `toMarryID` = _roleID and `state` = 3;
		END IF;
	
	
	replace into  marrymsg values (_marryID , 0);

	SET @sql = concat('UPDATE marryinfo SET state = 2 WHERE roleID = ', _marryID , ' or toMarryID = ', _marryID , ';');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;

	

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveFriPhyInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveFriPhyInfo`(IN 	_roleID		INT,
 	IN 	_friendID	INT,
 	IN	_str  		VARCHAR(16383))
BEGIN
	DECLARE _count	INT(1);
 	START TRANSACTION;
	SELECT count(*) INTO _count FROM `friendphysical` WHERE roleID = _roleID && friendID = _friendID;
		IF(_count > 0) THEN
			DELETE FROM `friendphysical` WHERE roleID = _roleID && friendID = _friendID;
		END IF;
 	IF( LENGTH( _str ) ) THEN
 		SET @sqlStr =CONCAT( 'insert into `friendphysical` values', _str,';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
 	END IF;
 	COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveGiftNum` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveGiftNum`(IN _table		VARCHAR(255),
 	IN _roleID 		int,
	IN _giftID 		int,
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
 		SET @sqlStr =CONCAT( 'replace into  `', _table, '` values ', _str,';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
 	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveMarryInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveMarryInfo`(IN _table		VARCHAR(255),
 	IN _roleID 		INT,
 	IN _str  		VARCHAR(16383))
BEGIN
	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE roleID = ', _roleID, ' or toMarryID = ', _roleID, ';');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
	IF(@_count > 0) THEN
		SET @sql = concat(
			'DELETE FROM `', _table,'` WHERE roleID = ', _roleID, ' or toMarryID = ', _roleID, ';'
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_SaveMemFightDamage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_SaveMemFightDamage`(IN _roleID 			INT,
    IN unionMemberInfo  VARCHAR(4096))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
  	START TRANSACTION;	
	SELECT count(*) INTO _count FROM `unionfightdamage` WHERE roleID = _roleID;
	IF(_count > 0) THEN
		DELETE FROM `unionfightdamage` WHERE roleID = _roleID;
	END IF;
	IF( LENGTH( unionMemberInfo ) ) THEN
		SET @sqlStr =CONCAT( 'insert into `unionfightdamage` values', unionMemberInfo,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;
	COMMIT;
  	SET _result = 0;
  	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_savePlayerApply` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_savePlayerApply`(IN _roleID 			INT,
	IN playerApplyInfo	VARCHAR(4095))
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_savePlayerInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_savePlayerInfo`(
  IN _str VARCHAR(16383)
)
BEGIN
  IF( LENGTH( _str ) ) THEN
    SET @sqlStr =CONCAT( 'REPLACE INTO `role` values ', _str,';');
    PREPARE s1 FROM @sqlStr;
    EXECUTE s1;
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_savePlayerOffer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_savePlayerOffer`(
	IN _unionID 	INT,
	IN unionInfo	VARCHAR(4095)
)
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
	SELECT count(*) INTO _count FROM `playeroffer` WHERE roleID = _unionID;
	IF(_count > 0) THEN
		DELETE FROM `playeroffer` WHERE roleID = _unionID;
	END IF;
	IF( LENGTH( unionInfo ) ) THEN
		SET @sqlStr =CONCAT( 'insert into `playeroffer` values', unionInfo,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;
	COMMIT;
  	SET _result = 0;
  	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveqqgift` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveqqgift`(IN _table VARCHAR(255) , IN _accountID  INT , IN _str  VARCHAR(16383))
BEGIN
	SET @sql0 = concat('SELECT count(*) INTO @_count FROM `', _table, '` WHERE accountID   = ', _accountID , ' and serverID = 0;');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
	IF(@_count > 0) THEN
		SET @sql = concat(
			'DELETE FROM `', _table,'` WHERE accountID  = ', _accountID  , '  and serverID = 0 ;'
		);
		PREPARE stmt1 FROM  @sql;
		EXECUTE stmt1;
		DEALLOCATE PREPARE stmt1;
	END IF;
  	IF( LENGTH( _str ) ) THEN
 		SET @sqlStr =CONCAT( 'replace into `', _table, '` values ', _str,';');
 		PREPARE s1 FROM @sqlStr;
 		EXECUTE s1;
 	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveRefuseDivorce` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveRefuseDivorce`(IN _marryID int, IN _roleID int)
BEGIN
	SET @sql = concat('UPDATE tomarry SET state = 5, toMarryTime = NOW() WHERE roleID = ', _marryID , ' AND toMarryID = ', _roleID , ' and state=3;');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveRefuseMarry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveRefuseMarry`(IN _marryID int, IN _roleID int)
BEGIN
	
	UPDATE tomarry SET state = 2 , toMarryTime = NOW() WHERE `roleID` = _marryID AND `toMarryID` = _roleID AND `state` = 0;

	SELECT SUM(marryMsgNum+1) INTO @_count FROM marryMsg WHERE roleID = _marryID;
	
	IF(@_count > 0) THEN
	replace into  marrymsg values (_marryID, @_count);
	END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveRoleInfoDelete` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveRoleInfoDelete`(IN _roleID			INT,
	IN _expLevel 		INT,
	IN _exp				INT,
	IN _zhanli			INT,
	IN _lifeNum			INT,
	IN _loginTime		VARCHAR(63),
	IN _VipPoint		INT,
	IN _LoginPrize		VARCHAR(1023),
	IN _VipLevel		INT,
	IN _Story			INT)
BEGIN
	DECLARE _count	INT(1);
 	START TRANSACTION;
		DELETE FROM `role` WHERE roleID = _roleID;
		insert into `role`
		(`roleID`, `expLevel`,`exp`, `zhanli`, `lifeNum`, `loginTime`, `vipPoint`, `loginPrize`, `vipLevel`, `story`)
	values
		(_roleID, _expLevel, _exp,_zhanli,_lifeNum,_loginTime,_VipPoint,_LoginPrize,_VipLevel,_Story);
	COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveUnion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnion`(IN _unionID 	INT,
	IN unionInfo	VARCHAR(4095))
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveUnionAnimal` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionAnimal`(IN _unionID 	INT,
	IN unionInfo	VARCHAR(4095))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
	SELECT count(*) INTO _count FROM `unionanimal` WHERE unionID = _unionID;
	IF(_count > 0) THEN
		DELETE FROM `unionanimal` WHERE unionID = _unionID;
	END IF;
	IF( LENGTH( unionInfo ) ) THEN
		SET @sqlStr =CONCAT( 'insert into `unionanimal` values', unionInfo,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;
	COMMIT;
  	SET _result = 0;
  	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveUnionApply` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionApply`(IN _unionID 		INT,
	IN unionApplyInfo	VARCHAR(4095))
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveUnionList` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionList`(IN _table		VARCHAR(255),
 	IN _unionID 	INT,
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveUnionMember` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionMember`(IN _roleID 			INT,
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveUnionsDamage` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionsDamage`(IN _unionID 	INT,
	IN unionInfo	VARCHAR(4095))
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
	SELECT count(*) INTO _count FROM `unionanimal` WHERE unionID = _unionID;
	IF(_count > 0) THEN
		DELETE FROM `unionsDamage` WHERE unionID = _unionID;
	END IF;
	IF( LENGTH( unionInfo ) ) THEN
		SET @sqlStr =CONCAT( 'insert into `unionsDamage` values', unionInfo,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;
	COMMIT;
  	SET _result = 0;
  	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_saveUnionTemple` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_saveUnionTemple`(
	IN _unionID 	INT,
	IN unionInfo	VARCHAR(4095)
)
BEGIN
	DECLARE _count	INT(1);
	DECLARE _result INT(1);
	SELECT count(*) INTO _count FROM `uniontemple` WHERE unionID = _unionID;
	IF(_count > 0) THEN
		DELETE FROM `uniontemple` WHERE unionID = _unionID;
	END IF;
	IF( LENGTH( unionInfo ) ) THEN
		SET @sqlStr =CONCAT( 'insert into `uniontemple` values', unionInfo,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;
	COMMIT;
  	SET _result = 0;
  	SELECT _result;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_setRoleInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_setRoleInfo`(IN _roleID		INT,
	IN _expLevel	INT,
	IN _vipLevel	INT)
BEGIN
	UPDATE `role` SET `expLevel` = _expLevel, `vipLevel` = _vipLevel 
		where `roleID` = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_setVipInfoByRoleID` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_setVipInfoByRoleID`(IN _roleID	 	INT,
	IN	_vipLevel	INT,
	IN	_vipPoint	INT)
BEGIN
	UPDATE role SET vipPoint = _vipPoint, vipLevel = _vipLevel WHERE roleID = _roleID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_unionLoad` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_unionLoad`(IN _table VARCHAR(255))
BEGIN
  	SET @sql = concat('SELECT * FROM ', _table,';');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateLimitGoodsInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateLimitGoodsInfo`(IN _table		VARCHAR(255),
 	IN _str  		VARCHAR(16383))
BEGIN
	SET @sql0 = concat('SELECT count(*) INTO @_count FROM ', _table,';');
 	PREPARE stmt0 FROM @sql0;
 	EXECUTE stmt0;
	DEALLOCATE PREPARE stmt0;
	IF(@_count > 0) THEN
		SET @sql = concat('DELETE FROM ', _table,';');
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
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateMarry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateMarry`(IN _table	VARCHAR(255),  IN _str VARCHAR(16383))
BEGIN
	SET @sql = concat(
			'DELETE FROM ', _table,';'
		);
		PREPARE stmt1 FROM  @sql;
		EXECUTE stmt1;
	IF( LENGTH( _str ) ) THEN
		SET @sqlStr =CONCAT( 'insert into `', _table, '` values ', _str,';');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateMarryLevel` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateMarryLevel`(IN _roleID int, _marryLevel int)
BEGIN
	SET @sql = concat('UPDATE marryinfo SET marryLevel = ' , _marryLevel  , ' where state = 1 and  (roleID = ' , _roleID   , ' or toMarryID = ' , _roleID   , ');');
 	PREPARE stmt1 FROM  @sql;
 	EXECUTE stmt1;
 	DEALLOCATE PREPARE stmt1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateMarryMsg` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateMarryMsg`(IN _roleID int)
BEGIN
	
	SELECT SUM(marryMsgNum+1) INTO @_count FROM marrymsg WHERE roleID = _roleID ;
	
	IF(@_count > 0) THEN
	replace into  marrymsg values (_roleID , @_count);
	END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_updateOpreateReward` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = '' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_updateOpreateReward`(IN	_str  		VARCHAR(2047))
BEGIN
 	START TRANSACTION;
		delete from operatereward;
		insert into operatereward values(_str);
 	COMMIT;
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

-- Dump completed on 2015-11-30 17:36:03
