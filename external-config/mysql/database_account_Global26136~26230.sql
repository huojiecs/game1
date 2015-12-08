DROP PROCEDURE IF EXISTS `sp_gm_getRoleListByServerUid`;

DELIMITER ;;
CREATE PROCEDURE `sp_gm_getRoleListByServerUid`(
	IN `_openid` 	VARCHAR(127),	
	IN `_serveruid` int
)
BEGIN
	SELECT roleID FROM openid LEFT JOIN rolename ON openid.accountID = rolename.accountID
		WHERE openID = _openID AND serverUid = _serveruid;	
END ;;
DELIMITER ;