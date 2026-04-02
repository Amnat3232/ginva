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
  await page.goto('http://localhost:3004');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/01-landing.png', fullPage: true });
  
  // 2. PawnDemo page
  console.log('2. PawnDemo page...');
  await page.goto('http://localhost:3004/pawn-demo');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/02-pawndemo-initial.png', fullPage: true });
  
  // 3. Enter collateral amount
  console.log('3. Enter collateral (10000 SOL)...');
  const collateralInput = page.locator('input[placeholder="Enter amount"]').first();
  await collateralInput.fill('10000');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/03-enter-collateral.png', fullPage: true });
  
  // 4. Click Deposit Collateral
  console.log('4. Deposit...');
  await page.locator('button:has-text("Deposit Collateral")').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/04-after-deposit.png', fullPage: true });
  
  // 5. Enter borrow amount
  console.log('5. Enter borrow amount (5000 USDC)...');
  const borrowInput = page.locator('input[placeholder="USDC amount"]');
  if (await borrowInput.first().isVisible()) {
    await borrowInput.first().fill('5000');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/05-enter-borrow.png', fullPage: true });
    
    // 6. Click Borrow USDC
    console.log('6. Borrow USDC...');
    await page.locator('button:has-text("Borrow USDC")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/06-after-borrow.png', fullPage: true });
  }
  
  // 7. Simulate time (+7 days)
  console.log('7. Simulate time +7 days...');
  await page.locator('button:has-text("+7 Days")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/07-time-passed.png', fullPage: true });
  
  // 8. Repay
  console.log('8. Repay loan...');
  const repayBtn = page.locator('button:has-text("Repay")');
  if (await repayBtn.first().isVisible()) {
    await repayBtn.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/08-after-repay.png', fullPage: true });
  }
  
  await browser.close();
  console.log('✅ All screenshots saved!');
}

takeScreenshots().catch(console.error);