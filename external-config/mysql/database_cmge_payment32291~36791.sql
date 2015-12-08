
DROP PROCEDURE IF EXISTS `sp_queryActivity`;
DELIMITER ;;
CREATE  PROCEDURE `sp_queryActivity`(IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63),
	IN _activities	VARCHAR(255))
BEGIN

-- 	SELECT * FROM generates WHERE roleId = _roleID AND serverId = _serverId AND activityId in (_activityId);

	SET @sqlStr =CONCAT( 'SELECT * FROM generates WHERE roleId = ', _roleId,
		' AND serverId = ', _serverId, ' AND activityId in ("', _activities,'");');
	PREPARE s1 FROM @sqlStr;
	EXECUTE s1;

END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_recordBalance`;
DELIMITER ;;
CREATE  PROCEDURE `sp_recordBalance`(IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63))
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
END;;
DELIMITER ;

DROP PROCEDURE IF EXISTS `sp_saveGenerate`;
DELIMITER ;;
CREATE  PROCEDURE `sp_saveGenerate`(IN _orderId		VARCHAR(63),
	IN _serverId	VARCHAR(63),
	IN _roleId		VARCHAR(63),
	IN _amount		INT,
	IN _generate	INT,
	IN _extra		INT,
	IN _activityId	INT)
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
END;;
DELIMITER ;



