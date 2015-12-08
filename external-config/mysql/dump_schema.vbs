
'dbname = "database_account"
dbhost = "188.188.0.163"
dbport = 3306
dbuser = "root"
dbpassword = "mysql6666"

set objShell = wscript.createObject("WScript.Shell")
iReturnCode = objShell.Run("%comspec% /c where mysqldump", 0, TRUE)
if( iReturnCode <> 0 ) then
    MsgBox "�Ҳ�����ִ�е� mysqldump.exe, ��Ҫ������·�����õ�ϵͳPATH������."
    WScript.Quit()
end if


'connect mysql
set objShell = wscript.createObject("WScript.Shell")
iReturnCode = objShell.Run("%comspec% /c mysql -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" -e help", 0, TRUE)
if( iReturnCode <> 0 ) then
    MsgBox "��ݿ��޷����ӻ������벻��ȷ."
    WScript.Quit()
end if

' read in database prefix
dbprefix = "android_head"
dbprefix = ReadInput("Enter database prefix, default android_head", dbprefix)

function ReadInput( message, default)
    ReadInput = InputBox(message & "(Default:" & default & "):")
    if( Len(ReadInput) = 0 ) then
        ReadInput = default
    end if
end function

set objShell = wscript.createObject("WScript.Shell")

call dumpSql(dbprefix & "_account", "database_acount")
call dumpSql(dbprefix & "_gaccount", "database_acount_global")
call dumpSql(dbprefix & "_game", "database_game")


' define dumpSql function
sub dumpSql(dbname, dbFilename)
	'dump to db.mysql
	output = objShell.CurrentDirectory & "\"&dbFilename&".sql"
	command = "%comspec% /c mysqldump -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" -d -R --database "&dbname&" --set-gtid-purged=OFF > " & output
	rem MsgBox(command)
	iReturnCode=objShell.Run(command, 1, TRUE)

	'edit db.mysql
	Set fso = Wscript.CreateObject("Scripting.FileSystemObject")
	set f=fso.opentextfile(output)
	s=replace(f.readall,"DEFINER=`root`@`%` ","")
	s=replace(s,"DEFINER=`root`@`localhost` ","")
	f.close

	' edit db.mysql
	Dim re
	Set re = New RegExp
	re.Pattern = " AUTO_INCREMENT=[0-9]*\b| ROW_FORMAT=COMPACT"
	re.Global = True
	re.IgnoreCase = True
	s = re.Replace(s, "")

	'write out
	set r=fso.opentextfile(output,2,true)
	r.write s
end sub
