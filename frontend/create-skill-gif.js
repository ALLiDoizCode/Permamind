import puppeteer from 'puppeteer';
import GIFEncoder from 'gifencoder';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createGIF() {
    console.log('Starting GIF creation...');

    // Get HTML filename from command line args
    const htmlFilename = process.argv[2] || 'skill-unlock-animation.html';
    const skillName = htmlFilename.replace('skill-unlock-', '').replace('.html', '');

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 800,
            height: 600
        }
    });

    const page = await browser.newPage();
    const htmlPath = `file://${path.resolve(__dirname, htmlFilename)}`;

    console.log(`Loading page: ${htmlPath}`);
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });

    // Settings
    const fps = 20; // frames per second
    const duration = 4; // seconds
    const totalFrames = fps * duration;
    const frameDelay = 1000 / fps; // ms per frame

    console.log(`Capturing ${totalFrames} frames at ${fps} FPS...`);

    // Create encoder
    const encoder = new GIFEncoder(800, 600);
    const outputPath = path.join(__dirname, `skill-${skillName}.gif`);
    const stream = fs.createWriteStream(outputPath);

    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0); // 0 = loop forever
    encoder.setDelay(frameDelay);
    encoder.setQuality(10); // 1-20, lower is better

    // Capture frames
    for (let i = 0; i < totalFrames; i++) {
        console.log(`Capturing frame ${i + 1}/${totalFrames}`);

        const screenshot = await page.screenshot({
            type: 'png',
            encoding: 'binary'
        });

        // Load image and add to encoder
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        const img = await loadImage(screenshot);
        ctx.drawImage(img, 0, 0);

        encoder.addFrame(ctx);

        // Wait for next frame
        await page.waitForTimeout(frameDelay);
    }

    encoder.finish();
    await browser.close();

    console.log(`GIF created successfully: ${outputPath}`);
    console.log('File size:', fs.statSync(outputPath).size, 'bytes');
}

createGIF().catch(console.error);
