@echo off
REM Cyber Fortis Quiz - Desktop Shortcut Creator for Windows
REM This script creates a desktop shortcut with the logo icon

echo ========================================
echo   Cyber Fortis Quiz - Desktop Setup
echo ========================================
echo.

set SCRIPT_DIR=%~dp0
set SHORTCUT_NAME=Cyber Fortis Quiz

REM Create desktop shortcut using PowerShell
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\%SHORTCUT_NAME%.lnk'); $Shortcut.TargetPath = '%SCRIPT_DIR%launch-quiz.vbs'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.IconLocation = '%SCRIPT_DIR%public\Logo.png'; $Shortcut.Description = 'Quiz aplikacija za zapošljavanje'; $Shortcut.Save()"

if %errorlevel%==0 (
    echo Desktop shortcut created successfully!
    echo Location: %USERPROFILE%\Desktop\%SHORTCUT_NAME%.lnk
) else (
    echo Failed to create shortcut. Creating alternative shortcut...
    REM Alternative: Create a simple batch shortcut
    echo @echo off > "%USERPROFILE%\Desktop\%SHORTCUT_NAME%.bat"
    echo cd /d "%SCRIPT_DIR%" >> "%USERPROFILE%\Desktop\%SHORTCUT_NAME%.bat"
    echo start launch-quiz.vbs >> "%USERPROFILE%\Desktop\%SHORTCUT_NAME%.bat"
    echo Alternative shortcut created: %USERPROFILE%\Desktop\%SHORTCUT_NAME%.bat
)

echo.
echo Setup complete!
echo.
pause
