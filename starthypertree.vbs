Dim shell

set shell=createobject("wscript.shell")

sub execute(cmd)
'shell.Run "cmd.exe /r "&cmd, 0, True
shell.Exec(cmd)
end sub


execute("Setlocal EnableDelayedExpansion & set qhome=%~dp0\q & echo %qhome%)
