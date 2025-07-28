const { test, expect } = require('@playwright/test');

test.describe('Game Loading Debug', () => {
  test('should debug game loading issues', async ({ page }) => {
    const errors = [];
    const consoleMessages = [];
    
    // Capture all console messages and errors
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    // Navigate to the game
    await page.goto('http://localhost:8080');
    
    // Wait a reasonable time for scripts to load
    await page.waitForTimeout(5000);
    
    // Check if Three.js loaded
    const hasThreeJS = await page.evaluate(() => typeof window.THREE !== 'undefined');
    console.log('Three.js loaded:', hasThreeJS);
    
    // Check if game object exists
    const hasGame = await page.evaluate(() => typeof window.game !== 'undefined');
    console.log('Game object exists:', hasGame);
    
    // If game exists, check its components
    if (hasGame) {
      const gameComponents = await page.evaluate(() => {
        return {
          hasScene: !!window.game.scene,
          hasCamera: !!window.game.camera,
          hasRenderer: !!window.game.renderer,
          hasControls: !!window.game.controls,
          hasWorld: !!window.game.world,
          hasPlayer: !!window.game.player,
          hasAircraft: !!window.game.aircraft,
          aircraftCount: window.game.aircraft ? window.game.aircraft.length : 0,
          isRunning: window.game.isRunning
        };
      });
      console.log('Game components:', gameComponents);
    }
    
    // Check if canvas exists
    const canvasExists = await page.locator('canvas').count() > 0;
    console.log('Canvas exists:', canvasExists);
    
    // Check for loading screen
    const loadingVisible = await page.locator('#loading').isVisible();
    console.log('Loading screen visible:', loadingVisible);
    
    // Print all console messages
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Print errors
    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach(error => console.log(error));
    }
    
    // Basic assertions
    expect(hasThreeJS).toBe(true);
    expect(canvasExists).toBe(true);
    
    // If no errors, game should load
    if (errors.length === 0) {
      expect(hasGame).toBe(true);
    }
  });
});