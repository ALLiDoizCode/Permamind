import playwright from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSkillGIF() {
    console.log('🎬 Starting skill unlock GIF creation...');

    const browser = await playwright.chromium.launch({
        headless: true
    });

    const context = await browser.newContext({
        viewport: { width: 800, height: 600 },
        recordVideo: {
            dir: path.join(__dirname, '.playwright-mcp'),
            size: { width: 800, height: 600 }
        }
    });

    const page = await context.newPage();
    const htmlPath = `file://${path.resolve(__dirname, 'skill-unlock-terminal.html')}`;

    console.log('📄 Loading terminal animation page...');
    await page.goto(htmlPath);

    // Wait for animation to complete (8 seconds total animation)
    console.log('⏱️  Recording animation (8 seconds)...');
    await page.waitForTimeout(8000);

    console.log('✅ Recording complete, saving video...');
    await context.close();
    await browser.close();

    // Get the video file path
    const videoDir = path.join(__dirname, '.playwright-mcp');
    const files = fs.readdirSync(videoDir);
    const videoFile = files.find(f => f.endsWith('.webm'));

    if (!videoFile) {
        console.error('❌ Video file not found!');
        return;
    }

    const videoPath = path.join(videoDir, videoFile);
    const gifPath = path.join(videoDir, 'skill-unlock.gif');

    console.log('🎨 Converting video to GIF...');

    try {
        // Convert video to GIF using ffmpeg with optimized settings
        execSync(
            `ffmpeg -i "${videoPath}" -vf "fps=20,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" -loop 0 "${gifPath}" -y`,
            { stdio: 'inherit' }
        );

        console.log('✨ GIF created successfully!');
        console.log(`📁 Output: ${gifPath}`);

        // Get file size
        const stats = fs.statSync(gifPath);
        console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // Clean up video file
        fs.unlinkSync(videoPath);
        console.log('🧹 Cleaned up temporary video file');

    } catch (error) {
        console.error('❌ Error converting to GIF:', error.message);
    }
}

createSkillGIF().catch(console.error);
