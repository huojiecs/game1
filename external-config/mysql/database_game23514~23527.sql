CREATE TABLE `limitgoods` (
`goodsID`  int(11) NOT NULL ,
`goodsNum`  int(11) NOT NULL DEFAULT 0 ,
PRIMARY KEY (`goodsID`)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8 COLLATE=utf8_general_ci;

DROP PROCEDURE IF EXISTS `sp_chartLoadUnion`;
DELIMITER ;;
CREATE PROCEDURE `sp_chartLoadUnion`(
	IN _START	INT,
	IN _LIMIT	INT)
BEGIN
   	PREPARE STMT FROM " SELECT * FROM `unioninfo` LIMIT ?, ? ; ";
  	SET @START = _START;
  	SET @LIMIT = _LIMIT;
  	EXECUTE STMT USING @START, @LIMIT;
 	DEALLOCATE PREPARE STMT;
END ;;
DELIMITER;

DROP PROCEDURE IF EXISTS `sp_updateLimitGoodsInfo`;

DELIMITER ;;
CREATE PROCEDURE `sp_updateLimitGoodsInfo`(
	IN _table		VARCHAR(255),
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
END;;
DELIMITER ;
