const { test, expect } = require('@playwright/test');

test.describe('Flight Simulator - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the simulator
    await page.goto('/');
  });

  test('should load the simulator page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Flight Simulator');
    
    // Check that the game container exists
    await expect(page.locator('#game-container')).toBeVisible();
  });

  test('should load Three.js and game scripts', async ({ page }) => {
    // Wait for Three.js to load
    await page.waitForFunction(() => typeof window.THREE !== 'undefined');
    
    // Check that the game is initialized (classes may not be globally accessible)
    await page.waitForFunction(() => window.game && typeof window.game === 'object');
    
    // Verify game components are created
    await page.waitForFunction(() => 
      window.game.controls &&
      window.game.world &&
      window.game.player &&
      window.game.aircraft
    );
  });

  test('should initialize the game and hide loading screen', async ({ page }) => {
    // Wait for loading screen to disappear
    await expect(page.locator('#loading')).toBeHidden({ timeout: 5000 });
    
    // Check that the game instance is created
    await page.waitForFunction(() => window.game && typeof window.game === 'object' && window.game.scene);
  });

  test('should render the 3D canvas', async ({ page }) => {
    // Wait for canvas element to be created
    await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
    
    // Check canvas has proper dimensions
    const canvas = await page.locator('canvas');
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox.width).toBeGreaterThan(0);
    expect(boundingBox.height).toBeGreaterThan(0);
  });

  test('should display UI overlay elements', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for initialization
    
    // Check HUD elements are visible
    await expect(page.locator('#hud')).toBeVisible();
    await expect(page.locator('#mode')).toBeVisible();
    await expect(page.locator('#position')).toBeVisible();
    await expect(page.locator('#speed-indicator')).toBeVisible();
    await expect(page.locator('#altitude-indicator')).toBeVisible();
    await expect(page.locator('#instructions')).toBeVisible();
    await expect(page.locator('#crosshair')).toBeVisible();
  });

  test('should show initial walking mode', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check initial mode is walking
    const modeText = await page.locator('#mode').textContent();
    expect(modeText).toContain('Walking');
  });

  test('should create game world with terrain and buildings', async ({ page }) => {
    await page.waitForTimeout(3000); // Wait for world creation
    
    // Check that world is created and has terrain
    const hasWorld = await page.evaluate(() => {
      return window.game && 
             window.game.world && 
             window.game.world.terrain &&
             window.game.world.buildings.length > 0 &&
             window.game.world.runways.length > 0;
    });
    
    expect(hasWorld).toBe(true);
  });

  test('should create aircraft in the scene', async ({ page }) => {
    await page.waitForTimeout(3000);
    
    // Check that aircraft are created
    const aircraftCount = await page.evaluate(() => {
      return window.game && window.game.aircraft ? window.game.aircraft.length : 0;
    });
    
    expect(aircraftCount).toBeGreaterThan(0);
    console.log(`Found ${aircraftCount} aircraft in the scene`);
  });

  test('should have working camera system', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check camera exists and has proper position
    const cameraInfo = await page.evaluate(() => {
      if (!window.game || !window.game.camera) return null;
      
      return {
        hasCamera: !!window.game.camera,
        position: {
          x: window.game.camera.position.x,
          y: window.game.camera.position.y,
          z: window.game.camera.position.z
        }
      };
    });
    
    expect(cameraInfo.hasCamera).toBe(true);
    expect(cameraInfo.position.y).toBeGreaterThan(0); // Camera should be above ground
  });

  test('should update position display', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check position display shows coordinates
    const positionText = await page.locator('#position').textContent();
    expect(positionText).toMatch(/Position: \(\d+, \d+, \d+\)/);
  });

  test('should not have any JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Filter out expected Three.js warnings
    const criticalErrors = errors.filter(error => 
      !error.includes('three.js') && 
      !error.includes('WEBGL') &&
      !error.includes('extension')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});