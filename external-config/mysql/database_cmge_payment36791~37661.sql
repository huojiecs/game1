
DROP PROCEDURE IF EXISTS `sp_queryActivity`;
DELIMITER ;;
CREATE  PROCEDURE `sp_queryActivity`(IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63),
	IN _activities	VARCHAR(255))
BEGIN

-- 	SELECT * FROM generates WHERE roleId = _roleID AND serverId = _serverId AND activityId in (_activityId);

	IF LENGTH(_activities) <> 0 THEN
		SET @sqlStr =CONCAT( 'SELECT * FROM generates WHERE roleId = ', _roleId,
			' AND serverId = ', _serverId, ' AND activityId in (', _activities,');');
		PREPARE s1 FROM @sqlStr;
		EXECUTE s1;
	END IF;

END;;
DELIMITER ;

