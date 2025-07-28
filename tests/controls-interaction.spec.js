const { test, expect } = require('@playwright/test');

test.describe('Flight Simulator - Controls and Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); // Wait for full initialization
  });

  test('should handle pointer lock for mouse controls', async ({ page }) => {
    // Click to request pointer lock
    await page.locator('canvas').click();
    
    // Check if pointer lock is working (controls should be created)
    const hasControls = await page.evaluate(() => {
      return window.game && window.game.controls && typeof window.game.controls.isPointerLocked !== 'undefined';
    });
    
    expect(hasControls).toBe(true);
  });

  test('should respond to keyboard input for movement', async ({ page }) => {
    await page.locator('canvas').click(); // Focus the canvas
    
    // Get initial player position
    const initialPosition = await page.evaluate(() => {
      return {
        x: window.game.player.position.x,
        z: window.game.player.position.z
      };
    });
    
    // Press W key for forward movement
    await page.keyboard.press('KeyW');
    await page.waitForTimeout(100);
    
    // Check if walking input is being processed
    const controlsWorking = await page.evaluate(() => {
      return window.game.controls.isKeyPressed('KeyW');
    });
    
    expect(controlsWorking).toBe(true);
  });

  test('should detect aircraft proximity', async ({ page }) => {
    await page.locator('canvas').click();
    
    // Move player near an aircraft
    await page.evaluate(() => {
      // Get first aircraft position and move player there
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.position.set(
          aircraft.position.x + 5, 
          aircraft.position.y, 
          aircraft.position.z
        );
      }
    });
    
    await page.waitForTimeout(500);
    
    // Check if interaction prompt appears
    const modeText = await page.locator('#mode').textContent();
    expect(modeText).toContain('Press E');
  });

  test('should show aircraft selection dialog when multiple aircraft are nearby', async ({ page }) => {
    await page.locator('canvas').click();
    
    // Position player near multiple aircraft and trigger selection
    await page.evaluate(() => {
      if (window.game.aircraft.length > 1) {
        // Move player to be near first aircraft
        const aircraft1 = window.game.aircraft[0];
        const aircraft2 = window.game.aircraft[1];
        
        // Position between aircraft
        window.game.player.position.set(
          (aircraft1.position.x + aircraft2.position.x) / 2,
          aircraft1.position.y,
          (aircraft1.position.z + aircraft2.position.z) / 2
        );
        
        // Force both aircraft to be considered nearby
        window.game.player.nearbyAircraftCache = [aircraft1, aircraft2];
        window.game.player.showAircraftSelection([aircraft1, aircraft2]);
      }
    });
    
    // Check if aircraft selection dialog appears
    await expect(page.locator('#aircraft-selection')).toBeVisible();
  });

  test('should enter flight mode when interacting with aircraft', async ({ page }) => {
    await page.locator('canvas').click();
    
    // Position player near aircraft and enter it
    const enteredAircraft = await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
        return window.game.player.isFlying;
      }
      return false;
    });
    
    expect(enteredAircraft).toBe(true);
    
    await page.waitForTimeout(500);
    
    // Check if mode changed to flying
    const modeText = await page.locator('#mode').textContent();
    expect(modeText).toContain('Flying');
  });

  test('should exit aircraft with Escape key', async ({ page }) => {
    await page.locator('canvas').click();
    
    // Enter aircraft first
    await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
      }
    });
    
    await page.waitForTimeout(500);
    
    // Press Escape to exit
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Check if back to walking mode
    const isWalking = await page.evaluate(() => {
      return !window.game.player.isFlying;
    });
    
    expect(isWalking).toBe(true);
    
    const modeText = await page.locator('#mode').textContent();
    expect(modeText).toContain('Walking');
  });

  test('should update speed and altitude indicators during flight', async ({ page }) => {
    await page.locator('canvas').click();
    
    // Enter aircraft
    await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
        // Give some throttle
        aircraft.throttle = 0.5;
        aircraft.velocity.set(0, 0, -50); // Some forward speed
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Check speed indicator shows aircraft speed
    const speedText = await page.locator('#speed-indicator').textContent();
    expect(speedText).toMatch(/Speed: \d+ kt/);
    
    // Check altitude indicator
    const altitudeText = await page.locator('#altitude-indicator').textContent();
    expect(altitudeText).toMatch(/Altitude: \d+ ft/);
  });

  test('should handle flight controls input', async ({ page }) => {
    await page.locator('canvas').click();
    
    // Enter aircraft
    await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
      }
    });
    
    await page.waitForTimeout(500);
    
    // Test throttle control with Space
    await page.keyboard.down('Space');
    await page.waitForTimeout(100);
    
    const throttleIncrease = await page.evaluate(() => {
      return window.game.player.currentAircraft && window.game.player.currentAircraft.throttle > 0.3;
    });
    
    expect(throttleIncrease).toBe(true);
    
    await page.keyboard.up('Space');
  });

  test('should close aircraft selection dialog with Cancel button', async ({ page }) => {
    // Show aircraft selection dialog
    await page.evaluate(() => {
      document.getElementById('aircraft-selection').style.display = 'block';
    });
    
    await expect(page.locator('#aircraft-selection')).toBeVisible();
    
    // Click Cancel button
    await page.locator('button:has-text("Cancel")').click();
    
    // Check dialog is hidden
    await expect(page.locator('#aircraft-selection')).toBeHidden();
  });

  test('should handle window resize correctly', async ({ page }) => {
    // Get initial canvas size
    const initialSize = await page.locator('canvas').boundingBox();
    
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(100);
    
    // Check canvas resized
    const newSize = await page.locator('canvas').boundingBox();
    expect(newSize.width).not.toBe(initialSize.width);
    expect(newSize.height).not.toBe(initialSize.height);
  });
});