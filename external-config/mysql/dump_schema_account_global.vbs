
dbname = "database_account_global"
dbhost = "188.188.0.162"
dbport = 3306
dbuser = "root"
dbpassword = "mysql6666"

set objShell = wscript.createObject("WScript.Shell")
iReturnCode = objShell.Run("%comspec% /c where mysqldump", 0, TRUE)
if( iReturnCode <> 0 ) then
    MsgBox "�Ҳ�����ִ�е� mysqldump.exe, ��Ҫ������·�����õ�ϵͳPATH������."
    WScript.Quit()
end if

dbhost = ReadInput("Enter mysql host", dbhost)
dbport = ReadInput("Enter mysql port", dbport)
dbuser = ReadInput("Enter mysql user", dbuser)
dbpassword = ReadInput("Enter mysql password", dbpassword)

function ReadInput( message, default)
    ReadInput = InputBox(message & "(Default:" & default & "):")
    if( Len(ReadInput) = 0 ) then
        ReadInput = default
    end if
end function

set objShell = wscript.createObject("WScript.Shell")

iReturnCode = objShell.Run("%comspec% /c mysql -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" -e help", 0, TRUE)
if( iReturnCode <> 0 ) then
    MsgBox "��ݿ��޷����ӻ������벻��ȷ."
    WScript.Quit()
end if

output = objShell.CurrentDirectory & "\"&dbname&".sql"
command = "%comspec% /c mysqldump -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" -d -R --database "&dbname&" --set-gtid-purged=OFF > " & output

rem MsgBox(command)

iReturnCode=objShell.Run(command, 1, TRUE)

Set fso = Wscript.CreateObject("Scripting.FileSystemObject")
set f=fso.opentextfile(output)
s=replace(f.readall,"DEFINER=`root`@`%` ","")
s=replace(s,"DEFINER=`root`@`localhost` ","")
f.close

Dim re
Set re = New RegExp
re.Pattern = " AUTO_INCREMENT=[0-9]*\b"
re.Global = True
re.IgnoreCase = True

s = re.Replace(s, "")

set r=fso.opentextfile(output,2,true)
r.write s
