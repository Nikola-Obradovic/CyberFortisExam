#!/usr/bin/env node

/**
 * Creates a square icon with black background from Logo.png
 * Run once: node create-icon.js
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

async function createIcon() {
    try {
        // Try to use sharp (needs to be installed: npm install sharp)
        const sharp = require('sharp');

        const logoPath = path.join(__dirname, 'public', 'Logo.png');
        const outputPath = path.join(__dirname, 'public', 'LogoIcon.png');

        // Get logo dimensions
        const metadata = await sharp(logoPath).metadata();
        const size = Math.max(metadata.width, metadata.height);

        // Create black background and composite logo on top (centered)
        await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            }
        })
        .composite([{
            input: logoPath,
            gravity: 'center'
        }])
        .png()
        .toFile(outputPath);

        console.log(`Created icon with black background: ${outputPath}`);
        console.log(`Size: ${size}x${size} pixels`);

    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.log('Sharp module not found. Installing...');
            console.log('Run: npm install sharp');
            console.log('Then run: node create-icon.js');
        } else {
            console.error('Error creating icon:', err.message);
        }
        process.exit(1);
    }
}

createIcon();
