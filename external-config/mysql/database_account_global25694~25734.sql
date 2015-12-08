DROP PROCEDURE IF EXISTS `sp_checkUnionName`;
DELIMITER ;;
CREATE PROCEDURE `sp_checkUnionName`(IN _unionName		VARCHAR(63))
BEGIN
	DECLARE _resultID		INT(0);
	DECLARE _datetime		DATETIME;
	DECLARE _result			INT(0);
	DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET _result = 12006;
	SET _result = 0;
	SELECT CURRENT_TIMESTAMP() INTO _datetime;
 	START TRANSACTION;
		ALTER TABLE `union` AUTO_INCREMENT=10000;
		INSERT INTO `union`(`unionName`,`createTime`, `updateTime`) VALUES (_unionName, _datetime, _datetime);		
		SET _resultID = LAST_INSERT_ID();
		SELECT _result, _resultID;
	COMMIT;	
END ;;
DELIMITER ;