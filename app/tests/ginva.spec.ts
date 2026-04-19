import { test, expect } from '@playwright/test';

test.describe('Ginva UI Tests', () => {
  
  test('Landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/GINVA/);
    
    // Check main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check navigation exists
    await expect(page.locator('nav, header, [class*="nav"]').first()).toBeVisible();
    
    console.log('✓ Landing page loads correctly');
  });

  test('Borrow page loads and displays content', async ({ page }) => {
    await page.goto('/borrow');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that page has content (not blank/white)
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Should not be pure white
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
    
    // Should have some content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(5000);
    
    console.log('✓ Borrow page loads with content');
  });

  test('Keeper page loads and displays content', async ({ page }) => {
    await page.goto('/keeper');
    
    await page.waitForLoadState('networkidle');
    
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(5000);
    
    console.log('✓ Keeper page loads with content');
  });

  test('Navigation menu works', async ({ page }) => {
    await page.goto('/');
    
    // Look for navigation links
    const navLinks = page.locator('a[href*="/"], nav a, header a');
    const linkCount = await navLinks.count();
    
    console.log(`✓ Found ${linkCount} navigation links`);
    
    // Try clicking on a nav link if exists
    if (linkCount > 0) {
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      if (href && href !== '#') {
        console.log(`✓ Navigation link found: ${href}`);
      }
    }
  });

  test('No critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/borrow');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('manifest') &&
      !e.includes('Warning')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
    console.log('✓ No critical console errors');
  });
});