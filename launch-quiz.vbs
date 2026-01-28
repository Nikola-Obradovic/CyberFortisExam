' Cyber Fortis Quiz Launcher
' This VBScript runs the batch file without showing a console window

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run chr(34) & "launch-quiz.bat" & chr(34), 0, False
Set WshShell = Nothing
