const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    recordVideo: {
      dir: '.playwright-mcp/',
      size: { width: 800, height: 600 }
    }
  });

  const page = await context.newPage();

  // Navigate to the HTML file
  await page.goto('file:///Users/jonathangreen/Documents/Permamind/.playwright-mcp/skill-ario-terminal.html');

  // Wait for black background to fully load
  await page.waitForTimeout(500);

  // Record for 11 seconds (animation cycle)
  await page.waitForTimeout(11000);

  // Close and save video
  await context.close();
  await browser.close();
})();
