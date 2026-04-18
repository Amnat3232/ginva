const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  // 1. Landing Page
  console.log('1. Landing page...');
  await page.goto('https://app-theta-gilt-82.vercel.app');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/01-landing.png', fullPage: true });
  
  // 2. PawnDemo page - initial
  console.log('2. PawnDemo page...');
  await page.goto('https://app-theta-gilt-82.vercel.app/pawn-demo');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/02-pawndemo.png', fullPage: true });
  
  await browser.close();
  console.log('Screenshots saved!');
}

takeScreenshots().catch(console.error);