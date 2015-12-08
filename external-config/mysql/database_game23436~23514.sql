DROP PROCEDURE IF EXISTS `sp_asyncPvPBlessReceived`;
DELIMITER ;;
CREATE DEFINER=`root`@`%` PROCEDURE `sp_asyncPvPBlessReceived`(IN _roleID 		INT)
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
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_chartLoadSoul`;
DELIMITER $$

/*!50003 CREATE DEFINER=`root`@`%` PROCEDURE `sp_chartLoadSoul`(IN _START	INT,
	IN _LIMIT	INT)
BEGIN
		
   	PREPARE STMT FROM " SELECT a.roleID, GROUP_CONCAT(CAST(soulID as char)) soulID, GROUP_CONCAT(CAST(soulLevel as char)) soulLevel, SUM(a.zhanli) zhanli, b.name 
   				FROM soul a LEFT JOIN role b ON a.roleID = b.roleID GROUP BY roleID LIMIT ?, ? ; ";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END */$$
DELIMITER ;
