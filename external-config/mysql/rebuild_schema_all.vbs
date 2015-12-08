
dbname = "database_game"
dbhost = "188.188.0.162"
dbport = 3306
dbuser = "root"
dbpassword = "mysql6666"

set objShell = wscript.createObject("WScript.Shell")

iReturnCode = objShell.Run("%comspec% /c where mysql", 0, TRUE)
if( iReturnCode <> 0 ) then
    MsgBox "找不到可执行的 mysql.exe, 需要将所在路径配置到系统PATH变量中."
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
    MsgBox "数据库无法链接或者密码不正确."
    WScript.Quit()
end if

Set fso = Wscript.CreateObject("Scripting.FileSystemObject")

output = objShell.CurrentDirectory & "\database_game.sql"
if not fso.FileExists(output) then
    MsgBox "找不到数据库脚本:" & output
end if

output = objShell.CurrentDirectory & "\database_account.sql"
if not fso.FileExists(output) then
    MsgBox "找不到数据库脚本:" & output
end if

output = objShell.CurrentDirectory & "\database_log.sql"
if not fso.FileExists(output) then
    MsgBox "找不到数据库脚本:" & output
end if

output = objShell.CurrentDirectory & "\database_game.sql"
command = "%comspec% /c mysql -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" < " & output
iReturnCode = objShell.Run(command, 1, TRUE)

output = objShell.CurrentDirectory & "\database_account.sql"
command = "%comspec% /c mysql -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" < " & output
iReturnCode = objShell.Run(command, 1, TRUE)

output = objShell.CurrentDirectory & "\database_log.sql"
command = "%comspec% /c mysql -h"&dbhost&" -P"&dbport&" -u"&dbuser&" -p"&dbpassword&" < " & output
iReturnCode = objShell.Run(command, 1, TRUE)

MsgBox "All Done!"