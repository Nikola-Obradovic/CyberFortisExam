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

    # Convert PNG to ICNS for macOS with black background
    echo "Converting logo to macOS icon format..."

    ICON_DIR="$SCRIPT_DIR/CyberFortisQuiz.app/Contents/Resources/AppIcon.iconset"
    mkdir -p "$ICON_DIR"

    # Create a temporary logo with black background
    TEMP_LOGO="$SCRIPT_DIR/temp_logo_with_bg.png"
    LOGO_CREATED=false

    # Method 1: Try Python with PIL
    if command -v python3 &> /dev/null; then
        python3 -c "from PIL import Image" 2>/dev/null && {
            python3 << PYTHON_SCRIPT
from PIL import Image
logo = Image.open("$SCRIPT_DIR/public/Logo.png").convert("RGBA")
size = max(logo.width, logo.height)
background = Image.new("RGBA", (size, size), (0, 0, 0, 255))
x = (size - logo.width) // 2
y = (size - logo.height) // 2
background.paste(logo, (x, y), logo)
background.save("$TEMP_LOGO", "PNG")
PYTHON_SCRIPT
            [ -f "$TEMP_LOGO" ] && LOGO_CREATED=true && echo "Created icon with black background (using Python PIL)"
        }
    fi

    # Method 2: Try ImageMagick
    if [ "$LOGO_CREATED" = false ] && command -v convert &> /dev/null; then
        convert "$SCRIPT_DIR/public/Logo.png" -background black -gravity center -extent "%[fx:max(w,h)]x%[fx:max(w,h)]" "$TEMP_LOGO" 2>/dev/null
        [ -f "$TEMP_LOGO" ] && LOGO_CREATED=true && echo "Created icon with black background (using ImageMagick)"
    fi

    # Method 3: Try using the pre-made icon if it exists
    if [ "$LOGO_CREATED" = false ] && [ -f "$SCRIPT_DIR/public/LogoIcon.png" ]; then
        cp "$SCRIPT_DIR/public/LogoIcon.png" "$TEMP_LOGO"
        LOGO_CREATED=true
        echo "Using pre-made icon with black background"
    fi

    # Fallback: Use original logo
    if [ "$LOGO_CREATED" = false ]; then
        echo "Note: Could not add black background. Install PIL: pip3 install Pillow"
        echo "      Or install ImageMagick: brew install imagemagick"
        TEMP_LOGO="$SCRIPT_DIR/public/Logo.png"
    fi

    # Create various icon sizes
    sips -z 16 16     "$TEMP_LOGO" --out "$ICON_DIR/icon_16x16.png" 2>/dev/null
    sips -z 32 32     "$TEMP_LOGO" --out "$ICON_DIR/icon_16x16@2x.png" 2>/dev/null
    sips -z 32 32     "$TEMP_LOGO" --out "$ICON_DIR/icon_32x32.png" 2>/dev/null
    sips -z 64 64     "$TEMP_LOGO" --out "$ICON_DIR/icon_32x32@2x.png" 2>/dev/null
    sips -z 128 128   "$TEMP_LOGO" --out "$ICON_DIR/icon_128x128.png" 2>/dev/null
    sips -z 256 256   "$TEMP_LOGO" --out "$ICON_DIR/icon_128x128@2x.png" 2>/dev/null
    sips -z 256 256   "$TEMP_LOGO" --out "$ICON_DIR/icon_256x256.png" 2>/dev/null
    sips -z 512 512   "$TEMP_LOGO" --out "$ICON_DIR/icon_256x256@2x.png" 2>/dev/null
    sips -z 512 512   "$TEMP_LOGO" --out "$ICON_DIR/icon_512x512.png" 2>/dev/null
    sips -z 1024 1024 "$TEMP_LOGO" --out "$ICON_DIR/icon_512x512@2x.png" 2>/dev/null

    # Convert iconset to icns
    iconutil -c icns "$ICON_DIR" -o "$SCRIPT_DIR/CyberFortisQuiz.app/Contents/Resources/AppIcon.icns" 2>/dev/null

    # Clean up
    rm -rf "$ICON_DIR"
    [ -f "$SCRIPT_DIR/temp_logo_with_bg.png" ] && rm "$SCRIPT_DIR/temp_logo_with_bg.png"

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
