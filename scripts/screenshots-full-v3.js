const { chromium } = require('playwright');

async function waitForEnabled(page, selector, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = page.locator(selector).first();
    if (await el.isVisible()) {
      const isDisabled = await el.getAttribute('disabled');
      if (!isDisabled) return true;
    }
    await page.waitForTimeout(500);
  }
  return false;
}

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
  
  // 2. PawnDemo page
  console.log('2. PawnDemo page...');
  await page.goto('https://app-theta-gilt-82.vercel.app/pawn-demo');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/02-pawndemo-before-connect.png', fullPage: true });
  
  // 3. Click Connect Wallet
  console.log('3. Connect Wallet...');
  await page.locator('button:has-text("Connect Wallet")').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/03-pawndemo-connected.png', fullPage: true });
  
  // 4. Enter collateral amount
  console.log('4. Enter collateral (10000 SOL)...');
  const collateralInput = page.locator('input[placeholder="Enter amount"]').first();
  await collateralInput.fill('10000');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/04-enter-collateral.png', fullPage: true });
  
  // 5. Click Deposit Collateral (wait for enabled)
  console.log('5. Deposit...');
  const depositBtn = page.locator('button:has-text("Deposit Collateral")');
  await waitForEnabled(page, 'button:has-text("Deposit Collateral")', 10000);
  await depositBtn.first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/05-after-deposit.png', fullPage: true });
  
  // 6. Enter borrow amount
  console.log('6. Enter borrow amount (5000 USDC)...');
  const borrowInput = page.locator('input[placeholder="USDC amount"]');
  if (await borrowInput.first().isVisible()) {
    await borrowInput.first().fill('5000');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/06-enter-borrow.png', fullPage: true });
    
    // 7. Click Borrow USDC
    console.log('7. Borrow USDC...');
    await waitForEnabled(page, 'button:has-text("Borrow USDC")', 10000);
    await page.locator('button:has-text("Borrow USDC")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/07-after-borrow.png', fullPage: true });
  }
  
  // 8. Simulate time (+7 days)
  console.log('8. Simulate time +7 days...');
  await page.locator('button:has-text("+7 Days")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/08-time-passed.png', fullPage: true });
  
  // 9. Try Repay
  console.log('9. Repay loan...');
  const repayBtn = page.locator('button:has-text("Repay")');
  if (await repayBtn.first().isVisible()) {
    await repayBtn.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/09-after-repay.png', fullPage: true });
  }
  
  await browser.close();
  console.log('✅ All screenshots saved!');
}

takeScreenshots().catch(console.error);