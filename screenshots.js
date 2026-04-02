const { chromium } = require('playwright');

async function takeScreenshot() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Take screenshot of Landing page
  console.log('Taking screenshot of Landing page...');
  await page.goto('https://app-theta-gilt-82.vercel.app');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/landing.png', fullPage: true });
  
  // Take screenshot of Demo page
  console.log('Taking screenshot of Demo page...');
  await page.goto('https://app-theta-gilt-82.vercel.app/pawn-demo');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/demo-page.png', fullPage: true });
  
  await browser.close();
  console.log('Screenshots saved!');
}

takeScreenshot().catch(console.error);