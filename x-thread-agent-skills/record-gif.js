#!/usr/bin/env node

/**
 * Record animated HTML as video and convert to optimized GIF
 *
 * Requirements:
 * - npm install playwright
 * - ffmpeg installed (brew install ffmpeg on macOS)
 * - gifsicle installed (brew install gifsicle on macOS)
 *
 * Usage:
 *   node record-gif.js
 */

const playwright = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const RECORDING_DURATION = 24000; // 24 seconds (2 loops: 12s each)
const OUTPUT_DIR = path.join(__dirname, 'output');
const HTML_FILE = path.join(__dirname, 'images', '01-hero-animated.html');

// Check for required tools
function checkDependencies() {
    console.log('🔍 Checking dependencies...\n');

    const checks = {
        ffmpeg: false,
        gifsicle: false
    };

    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        checks.ffmpeg = true;
        console.log('✓ ffmpeg found');
    } catch (error) {
        console.warn('⚠️  ffmpeg not found. Install with: brew install ffmpeg');
    }

    try {
        execSync('gifsicle --version', { stdio: 'ignore' });
        checks.gifsicle = true;
        console.log('✓ gifsicle found');
    } catch (error) {
        console.warn('⚠️  gifsicle not found. Install with: brew install gifsicle');
    }

    console.log();
    return checks;
}

async function recordAnimation() {
    console.log('🎬 Starting Permamind GIF recording...\n');

    const checks = checkDependencies();

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await playwright.chromium.launch({
        headless: false // Show browser so you can see what's being recorded
    });

    console.log('✓ Browser launched');

    const context = await browser.newContext({
        viewport: { width: 1200, height: 675 },
        recordVideo: {
            dir: OUTPUT_DIR,
            size: { width: 1200, height: 675 }
        }
    });

    console.log('✓ Recording context created (1200×675)');

    const page = await context.newPage();

    // Navigate to the HTML file
    await page.goto(`file://${HTML_FILE}`);
    console.log('✓ Page loaded');

    // Wait for initial render
    await page.waitForTimeout(500);

    console.log(`\n⏱️  Recording for ${RECORDING_DURATION / 1000} seconds (2 animation loops)...`);
    console.log('   Watch the browser window to see what\'s being captured.\n');

    // Record for the specified duration
    await page.waitForTimeout(RECORDING_DURATION);

    console.log('✓ Recording complete');

    // Close context to save video
    await context.close();
    console.log('✓ Video saved');

    await browser.close();
    console.log('✓ Browser closed\n');

    // Find the video file
    const files = fs.readdirSync(OUTPUT_DIR);
    const videoFile = files.find(f => f.endsWith('.webm'));

    if (!videoFile) {
        console.error('❌ Video file not found!');
        process.exit(1);
    }

    const videoPath = path.join(OUTPUT_DIR, videoFile);
    const gifPath = path.join(OUTPUT_DIR, 'permamind-hero.gif');
    const gifOptimizedPath = path.join(OUTPUT_DIR, 'permamind-hero-optimized.gif');

    console.log('📹 Video file:', videoPath);

    if (!checks.ffmpeg) {
        console.log('\n⚠️  ffmpeg not found. Please install and run the conversion manually:\n');
        console.log(`   brew install ffmpeg`);
        console.log(`   ffmpeg -i "${videoPath}" \\`);
        console.log(`     -vf "fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \\`);
        console.log(`     -loop 0 \\`);
        console.log(`     "${gifPath}"\n`);
        return;
    }

    console.log('\n🎨 Converting video to GIF...\n');

    try {
        // Convert to GIF with optimized palette
        execSync(
            `ffmpeg -i "${videoPath}" ` +
            `-vf "fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" ` +
            `-loop 0 ` +
            `"${gifPath}"`,
            { stdio: 'inherit' }
        );

        console.log('\n✓ GIF created:', gifPath);

        // Check file size
        const stats = fs.statSync(gifPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  File size: ${sizeMB} MB`);

        if (!checks.gifsicle) {
            console.log('\n⚠️  gifsicle not found. Please install to optimize:\n');
            console.log(`   brew install gifsicle`);
            console.log(`   gifsicle -O3 --lossy=80 --colors=256 "${gifPath}" -o "${gifOptimizedPath}"\n`);
        } else {
            console.log('\n⚙️  Optimizing GIF...\n');

            execSync(
                `gifsicle -O3 --lossy=80 --colors=256 "${gifPath}" -o "${gifOptimizedPath}"`,
                { stdio: 'inherit' }
            );

            const optimizedStats = fs.statSync(gifOptimizedPath);
            const optimizedSizeMB = (optimizedStats.size / (1024 * 1024)).toFixed(2);
            const savings = ((1 - optimizedStats.size / stats.size) * 100).toFixed(1);

            console.log('\n✓ GIF optimized:', gifOptimizedPath);
            console.log(`  File size: ${optimizedSizeMB} MB (${savings}% smaller)`);

            if (optimizedStats.size > 5 * 1024 * 1024) {
                console.log('\n⚠️  Warning: File is larger than 5MB (Twitter limit: 15MB)');
                console.log('   Consider using higher lossy compression:');
                console.log(`   gifsicle -O3 --lossy=100 --colors=128 "${gifPath}" -o "${gifOptimizedPath}"`);
            } else {
                console.log('\n✅ File size is under 5MB - ready for Twitter!');
            }
        }

        // Clean up video file
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            console.log('\n🗑️  Cleaned up video file');
        }

        console.log('\n📁 Output location:');
        console.log(`   ${OUTPUT_DIR}`);

        console.log('\n🎉 Done! Next steps:');
        console.log('   1. Preview the GIF: open', checks.gifsicle ? gifOptimizedPath : gifPath);
        console.log('   2. Post to Twitter with content from content/SINGLE_POST.md');
        console.log('   3. Add alt text: "Animated terminal showing Permamind CLI commands"');

    } catch (error) {
        console.error('\n❌ Error during conversion:', error.message);
        console.log('\nManual conversion commands:');
        console.log(`\nCreate GIF:`);
        console.log(`  ffmpeg -i "${videoPath}" \\`);
        console.log(`    -vf "fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \\`);
        console.log(`    -loop 0 \\`);
        console.log(`    "${gifPath}"`);
        console.log(`\nOptimize:`);
        console.log(`  gifsicle -O3 --lossy=80 --colors=256 "${gifPath}" -o "${gifOptimizedPath}"`);
        process.exit(1);
    }
}

// Run the recording
recordAnimation().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
