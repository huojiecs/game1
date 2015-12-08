DROP PROCEDURE IF EXISTS `sp_chartLoadClimbScore`;
CREATE DEFINER = `root`@`%` PROCEDURE `sp_chartLoadClimbScore`(
	IN _START	INT,
  	IN _LIMIT	INT)
BEGIN
   	PREPARE STMT FROM "SELECT roleID, weekScore*1000+customNum as weekScore FROM `climb` LIMIT ?, ?;";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END;

DROP PROCEDURE IF EXISTS `sp_initRoleClimbInfo`;

CREATE DEFINER = `root`@`%` PROCEDURE `sp_initRoleClimbInfo`()
BEGIN 	START TRANSACTION;
    SET SQL_SAFE_UPDATES =0;
	UPDATE `climb` SET climbData='[]',todayData='[]',customNum=0,time=0,weekScore=0,fastCarNum=1;
	COMMIT;
END;