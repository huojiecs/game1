
dbname = "database_account"
dbhost = "188.188.0.162"
dbport = 3306
dbuser = "root"
dbpassword = "mysql6666"

set objShell = wscript.createObject("WScript.Shell")

iReturnCode = objShell.Run("%comspec% /c where mysql", 0, TRUE)
if( iReturnCode <> 0 ) then
    MsgBox "�Ҳ�����ִ�е� mysql.exe, ��Ҫ������·�����õ�ϵͳPATH������."
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

iReturnCode = objShell.Run("%comspec% /c mysql -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" -e help", 0, TRUE)
if( iReturnCode <> 0 ) then
    MsgBox "��ݿ��޷����ӻ������벻��ȷ."
    WScript.Quit()
end if

Set fso = Wscript.CreateObject("Scripting.FileSystemObject")

output = objShell.CurrentDirectory & "\"&dbname&".sql"
if not fso.FileExists(output) then
    MsgBox "�Ҳ�����ݿ�ű�:" & output
end if

command = "%comspec% /c mysql -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" < " & output
iReturnCode = objShell.Run(command, 1, TRUE)

MsgBox "All Done!"