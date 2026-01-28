#!/bin/bash

# Cyber Fortis Quiz - Desktop Shortcut Creator
# This script creates a desktop shortcut for the quiz application

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  Cyber Fortis Quiz - Desktop Setup"
echo "========================================"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected: macOS"
    echo ""

    # Convert PNG to ICNS for macOS
    echo "Converting logo to macOS icon format..."

    ICON_DIR="$SCRIPT_DIR/CyberFortisQuiz.app/Contents/Resources/AppIcon.iconset"
    mkdir -p "$ICON_DIR"

    # Create various icon sizes
    sips -z 16 16     "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_16x16.png" 2>/dev/null
    sips -z 32 32     "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_16x16@2x.png" 2>/dev/null
    sips -z 32 32     "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_32x32.png" 2>/dev/null
    sips -z 64 64     "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_32x32@2x.png" 2>/dev/null
    sips -z 128 128   "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_128x128.png" 2>/dev/null
    sips -z 256 256   "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_128x128@2x.png" 2>/dev/null
    sips -z 256 256   "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_256x256.png" 2>/dev/null
    sips -z 512 512   "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_256x256@2x.png" 2>/dev/null
    sips -z 512 512   "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_512x512.png" 2>/dev/null
    sips -z 1024 1024 "$SCRIPT_DIR/public/Logo.png" --out "$ICON_DIR/icon_512x512@2x.png" 2>/dev/null

    # Convert iconset to icns
    iconutil -c icns "$ICON_DIR" -o "$SCRIPT_DIR/CyberFortisQuiz.app/Contents/Resources/AppIcon.icns" 2>/dev/null

    # Clean up iconset folder
    rm -rf "$ICON_DIR"

    # Remove quarantine attribute to bypass Gatekeeper warning
    echo "Removing macOS quarantine attribute..."
    xattr -cr "$SCRIPT_DIR/CyberFortisQuiz.app"

    # Copy app to Applications folder
    echo "Installing application..."
    cp -R "$SCRIPT_DIR/CyberFortisQuiz.app" "/Applications/Cyber Fortis Quiz.app"

    # Remove quarantine from installed app as well
    xattr -cr "/Applications/Cyber Fortis Quiz.app"

    # Create alias on Desktop
    echo "Creating desktop shortcut..."
    osascript <<EOF
tell application "Finder"
    set appPath to POSIX file "/Applications/Cyber Fortis Quiz.app" as alias
    set desktopPath to path to desktop folder
    make new alias file at desktopPath to appPath with properties {name:"Cyber Fortis Quiz"}
end tell
EOF

    echo ""
    echo "Installation complete!"
    echo "You can find the app in:"
    echo "  - Applications folder"
    echo "  - Desktop (shortcut)"
    echo ""

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected: Linux"
    echo ""

    # Get the absolute path to the project
    PROJECT_PATH="$SCRIPT_DIR"

    # Create .desktop file with absolute paths
    DESKTOP_FILE="$HOME/.local/share/applications/cyberfortis-quiz.desktop"
    mkdir -p "$HOME/.local/share/applications"

    cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Cyber Fortis Quiz
Comment=Quiz aplikacija za zapošljavanje
Exec=bash -c "cd '$PROJECT_PATH' && ./launch-quiz.sh"
Icon=$PROJECT_PATH/public/Logo.png
Terminal=false
Categories=Education;
StartupNotify=true
EOF

    chmod +x "$DESKTOP_FILE"

    # Create desktop shortcut
    DESKTOP_SHORTCUT="$HOME/Desktop/Cyber Fortis Quiz.desktop"
    cp "$DESKTOP_FILE" "$DESKTOP_SHORTCUT"
    chmod +x "$DESKTOP_SHORTCUT"

    # Mark as trusted on GNOME
    if command -v gio &> /dev/null; then
        gio set "$DESKTOP_SHORTCUT" metadata::trusted true 2>/dev/null
    fi

    echo "Desktop shortcut created!"
    echo "Location: $DESKTOP_SHORTCUT"
    echo ""
    echo "Note: You may need to right-click the icon and select"
    echo "'Allow Launching' or 'Trust and Launch' on first use."
    echo ""

else
    echo "Detected: Unknown OS ($OSTYPE)"
    echo "Please use the appropriate launcher script manually:"
    echo "  - Windows: launch-quiz.bat or launch-quiz.vbs"
    echo "  - macOS/Linux: ./launch-quiz.sh"
fi
