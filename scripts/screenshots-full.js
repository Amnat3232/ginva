const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 1. Landing Page
  console.log('1. Landing page...');
  await page.goto('https://app-theta-gilt-82.vercel.app');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/01-landing.png', fullPage: true });
  
  // 2. Demo page - initial state
  console.log('2. Demo page - initial...');
  await page.goto('https://app-theta-gilt-82.vercel.app/pawn-demo');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/02-demo-initial.png', fullPage: true });
  
  // 3. Click "Connect Wallet" to show demo mode
  console.log('3. Demo with wallet connected...');
  const connectBtn = page.locator('button:has-text("Connect Wallet")').first();
  if (await connectBtn.isVisible()) {
    await connectBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/03-demo-wallet.png', fullPage: true });
  
  // 4. Fill deposit amount and deposit
  console.log('4. Making deposit...');
  await page.fill('input[placeholder="Amount to deposit"]', '10000');
  await page.click('button:has-text("Deposit")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/04-deposited.png', fullPage: true });
  
  // 5. Borrow USDC
  console.log('5. Borrowing USDC...');
  await page.fill('input[placeholder="USDC amount"]', '5000');
  await page.click('button:has-text("Borrow USDC")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/05-borrowed.png', fullPage: true });
  
  // 6. Simulate time passed and liquidate
  console.log('6. Time simulation...');
  await page.click('button:has-text("+7 Days")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/07-time-passed.png', fullPage: true });
  
  // 7. Repay loan
  console.log('7. Repaying loan...');
  await page.click('button:has-text("Repay")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/08-repaid.png', fullPage: true });
  
  await browser.close();
  console.log('All screenshots saved!');
}

takeScreenshots().catch(console.error);