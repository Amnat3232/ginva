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
  
  // 2. PawnDemo page - initial state
  console.log('2. Demo page - initial...');
  await page.goto('https://app-theta-gilt-82.vercel.app/pawn-demo');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/02-demo-initial.png', fullPage: true });
  
  // 3. Click first Connect Wallet button
  console.log('3. Demo with wallet...');
  const connectBtns = page.locator('button:has-text("Connect Wallet")');
  if (await connectBtns.first().isVisible()) {
    await connectBtns.first().click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/03-demo-wallet.png', fullPage: true });
  
  // 4. Find deposit input - look for "Enter amount" placeholder
  console.log('4. Making deposit...');
  const depositInput = page.locator('input[placeholder="Enter amount"]').first();
  if (await depositInput.isVisible({ timeout: 3000 })) {
    await depositInput.fill('10000');
    // Click first Deposit button
    const depositBtns = page.locator('button:has-text("Deposit")');
    if (await depositBtns.first().isVisible({ timeout: 3000 })) {
      await depositBtns.first().click();
      await page.waitForTimeout(2000);
    }
  }
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/04-deposited.png', fullPage: true });
  
  // 5. Look for borrow input and borrow
  console.log('5. Borrowing USDC...');
  const borrowInputs = page.locator('input[placeholder="USDC amount"]');
  if (await borrowInputs.first().isVisible({ timeout: 3000 })) {
    await borrowInputs.first().fill('5000');
    const borrowBtns = page.locator('button:has-text("Borrow USDC")');
    if (await borrowBtns.first().isVisible({ timeout: 3000 })) {
      await borrowBtns.first().click();
      await page.waitForTimeout(2000);
    }
  }
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/05-borrowed.png', fullPage: true });
  
  // 6. Simulate time and liquidate
  console.log('6. Time simulation & liquidation...');
  const timeBtns = page.locator('button:has-text("+7 Days")');
  if (await timeBtns.first().isVisible({ timeout: 3000 })) {
    await timeBtns.first().click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/06-time-passed.png', fullPage: true });
  
  // 7. Try repay
  console.log('7. Repaying loan...');
  const repayBtns = page.locator('button:has-text("Repay")');
  if (await repayBtns.first().isVisible({ timeout: 3000 })) {
    await repayBtns.first().click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/07-repaid.png', fullPage: true });
  
  await browser.close();
  console.log('All screenshots saved!');
}

takeScreenshots().catch(console.error);