DROP PROCEDURE IF EXISTS `sp_gm_getPlayerInfo`;
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