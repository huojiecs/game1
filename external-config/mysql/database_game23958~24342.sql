CREATE TABLE `chartreward` (
`roleID`  int(11) NOT NULL ,
`chartType`  int(11) NOT NULL ,
`ranking`  int(11) NOT NULL DEFAULT 0 ,
`refreshTime`  date NOT NULL DEFAULT '1970-01-01' ,
PRIMARY KEY (`roleID`, `chartType`)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE `chartrewardgettime` (
`roleID`  int(11) NOT NULL ,
`chartType`  int(11) NOT NULL ,
`acceptTime`  date NOT NULL DEFAULT '1970-01-01' ,
PRIMARY KEY (`roleID`, `chartType`)
)
ENGINE=InnoDB
DEFAULT CHARACTER SET=utf8 COLLATE=utf8_general_ci;

DELIMITER ;;
CREATE PROCEDURE `sp_saveChartRewardList`(
	IN _table		VARCHAR(255),
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
