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
  
  console.log('=== GINVA Demo Screenshots ===\n');
  
  // 1. Landing Page
  console.log('1. Landing page...');
  await page.goto('http://localhost:3004');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/01-landing.png', fullPage: true });
  
  // 2. PawnDemo - Initial State
  console.log('2. PawnDemo - Initial...');
  await page.goto('http://localhost:3004/pawn-demo');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/02-pawndemo-initial.png', fullPage: true });
  
  // 3. Select LTV Option (click Standard 40%)
  console.log('3. Select LTV Option...');
  const ltvCards = page.locator('.cursor-pointer');
  await ltvCards.nth(1).click(); // Standard (40%)
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/03-select-ltv.png', fullPage: true });
  
  // 4. Enter Collateral Amount
  console.log('4. Enter collateral (10000 SOL)...');
  const collateralInput = page.locator('input[placeholder="Enter amount"]').first();
  await collateralInput.fill('10000');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/04-enter-collateral.png', fullPage: true });
  
  // 5. Click Deposit
  console.log('5. Deposit Collateral...');
  await page.locator('button:has-text("Deposit Collateral")').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/05-after-deposit.png', fullPage: true });
  
  // 6. Show Calculator (after deposit shows how much can borrow)
  console.log('6. Calculator Display...');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/06-calculator.png', fullPage: true });
  
  // 7. Enter Borrow Amount
  console.log('7. Enter borrow (5000 USDC)...');
  const borrowInput = page.locator('input[placeholder="USDC amount"]');
  if (await borrowInput.isVisible()) {
    await borrowInput.fill('5000');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/07-enter-borrow.png', fullPage: true });
  }
  
  // 8. Click Borrow
  console.log('8. Borrow USDC...');
  const borrowBtn = page.locator('button:has-text("Borrow USDC")');
  if (await borrowBtn.isVisible()) {
    await borrowBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/08-after-borrow.png', fullPage: true });
  }
  
  // 9. Show Loan in "Your Loans" section
  console.log('9. Active Loan Display...');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/09-active-loan.png', fullPage: true });
  
  // 10. Simulate time +7 days
  console.log('10. Time Simulation (+7 days)...');
  await page.locator('button:has-text("+7 Days")').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/10-time-passed.png', fullPage: true });
  
  // 11. Show liquidatable (after extended time)
  console.log('11. Loan Status...');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/11-loan-status.png', fullPage: true });
  
  // 12. Repay Loan
  console.log('12. Repay Loan...');
  const repayBtn = page.locator('button:has-text("Repay")');
  if (await repayBtn.isVisible()) {
    await repayBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/12-after-repay.png', fullPage: true });
  }
  
  // 13. Final State (loan repaid)
  console.log('13. Final State...');
  await page.screenshot({ path: '/home/mkx-t/ginva/screenshots/13-final-state.png', fullPage: true });
  
  await browser.close();
  console.log('\n✅ All 13 screenshots saved to /home/mkx-t/ginva/screenshots/');
}

takeScreenshots().catch(console.error);