const { test, expect } = require('@playwright/test');

test.describe('Flight Simulator - Debug Console', () => {
  test('should capture console errors and script loading issues', async ({ page }) => {
    const errors = [];
    const logs = [];
    
    // Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(`${msg.type()}: ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });
    
    // Capture network errors
    page.on('requestfailed', (request) => {
      errors.push(`Network error: ${request.url()} - ${request.failure().errorText}`);
    });
    
    console.log('Loading page...');
    await page.goto('/');
    
    // Wait a bit to capture initial loading
    await page.waitForTimeout(5000);
    
    console.log('=== Console Logs ===');
    logs.forEach(log => console.log(log));
    
    console.log('=== Errors ===');
    errors.forEach(error => console.log(error));
    
    // Check script loading
    const scriptElements = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.map(script => ({
        src: script.src,
        loaded: script.src ? true : false,
        hasContent: script.innerHTML.length > 0
      }));
    });
    
    console.log('=== Script Elements ===');
    console.log(JSON.stringify(scriptElements, null, 2));
    
    // Check if Three.js loaded
    const threejsLoaded = await page.evaluate(() => typeof window.THREE !== 'undefined');
    console.log('Three.js loaded:', threejsLoaded);
    
    // Check global variables
    const globals = await page.evaluate(() => {
      return {
        THREE: typeof window.THREE,
        FlightSimulator: typeof window.FlightSimulator,
        Controls: typeof window.Controls,
        Aircraft: typeof window.Aircraft,
        World: typeof window.World,
        Player: typeof window.Player,
        game: typeof window.game
      };
    });
    
    console.log('=== Global Variables ===');
    console.log(JSON.stringify(globals, null, 2));
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-screenshot.png' });
    
    // The test should help us debug - let's not make it fail for now
    expect(true).toBe(true);
  });
});