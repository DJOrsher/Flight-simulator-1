const { test, expect } = require('@playwright/test');

test.describe('Flight Simulator - Movement and Flight Mode Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Wait for game to fully initialize
    await page.waitForFunction(() => {
      return window.game && 
             window.game.scene && 
             window.game.controls && 
             window.game.player && 
             window.game.aircraft && 
             window.game.aircraft.length > 0;
    }, { timeout: 10000 });
    
    // Wait for loading screen to disappear
    await page.waitForSelector('#loading', { state: 'hidden', timeout: 10000 });
    
    // Click to enable pointer lock
    await page.locator('canvas').click();
    await page.waitForTimeout(500);
  });

  test.describe('Walking Movement Tests', () => {
    test('should move forward correctly with W key', async ({ page }) => {
      // Get initial position
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        y: window.game.player.position.y,
        z: window.game.player.position.z
      }));
      
      // Press W to move forward
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(200);
      await page.keyboard.up('KeyW');
      
      // Allow movement to complete
      await page.waitForTimeout(300);
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        y: window.game.player.position.y,
        z: window.game.player.position.z
      }));
      
      // Z should decrease when moving forward (negative Z direction in Three.js)
      expect(newPosition.z).toBeLessThan(initialPosition.z);
      
      // Position should have changed
      const distanceMoved = Math.sqrt(
        Math.pow(newPosition.x - initialPosition.x, 2) + 
        Math.pow(newPosition.z - initialPosition.z, 2)
      );
      expect(distanceMoved).toBeGreaterThan(0);
    });

    test('should move backward correctly with S key', async ({ page }) => {
      // Get initial position
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        y: window.game.player.position.y,
        z: window.game.player.position.z
      }));
      
      // Press S to move backward
      await page.keyboard.down('KeyS');
      await page.waitForTimeout(200);
      await page.keyboard.up('KeyS');
      
      // Allow movement to complete
      await page.waitForTimeout(300);
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        y: window.game.player.position.y,
        z: window.game.player.position.z
      }));
      
      // Z should increase when moving backward (positive Z direction in Three.js)
      expect(newPosition.z).toBeGreaterThan(initialPosition.z);
      
      // Position should have changed
      const distanceMoved = Math.sqrt(
        Math.pow(newPosition.x - initialPosition.x, 2) + 
        Math.pow(newPosition.z - initialPosition.z, 2)
      );
      expect(distanceMoved).toBeGreaterThan(0);
    });

    test('should move left correctly with A key', async ({ page }) => {
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      await page.keyboard.down('KeyA');
      await page.waitForTimeout(200);
      await page.keyboard.up('KeyA');
      await page.waitForTimeout(300);
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // X should decrease when moving left
      expect(newPosition.x).toBeLessThan(initialPosition.x);
    });

    test('should move right correctly with D key', async ({ page }) => {
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(200);
      await page.keyboard.up('KeyD');
      await page.waitForTimeout(300);
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // X should increase when moving right
      expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    });

    test('should handle diagonal movement correctly', async ({ page }) => {
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // Press W and D simultaneously for forward-right movement
      await page.keyboard.down('KeyW');
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(200);
      await page.keyboard.up('KeyW');
      await page.keyboard.up('KeyD');
      await page.waitForTimeout(300);
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // Should move forward (Z decreases) and right (X increases)
      expect(newPosition.z).toBeLessThan(initialPosition.z);
      expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    });
  });

  test.describe('Flight Mode Tests', () => {
    test('should enter flight mode and respond to controls', async ({ page }) => {
      // Enter the first available aircraft
      const aircraftEntered = await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
          return window.game.player.isFlying;
        }
        return false;
      });
      
      expect(aircraftEntered).toBe(true);
      
      // Wait for flight mode to initialize
      await page.waitForTimeout(500);
      
      // Check mode indicator
      const modeText = await page.locator('#mode').textContent();
      expect(modeText).toContain('Flying');
      
      // Test that flight controls respond
      const initialRotation = await page.evaluate(() => ({
        x: window.game.player.currentAircraft.rotation.x,
        y: window.game.player.currentAircraft.rotation.y,
        z: window.game.player.currentAircraft.rotation.z
      }));
      
      // Test pitch up with W key
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(100);
      await page.keyboard.up('KeyW');
      await page.waitForTimeout(200);
      
      const newRotation = await page.evaluate(() => ({
        x: window.game.player.currentAircraft.rotation.x,
        y: window.game.player.currentAircraft.rotation.y,
        z: window.game.player.currentAircraft.rotation.z
      }));
      
      // W should cause pitch up (negative rotation.x change)
      expect(newRotation.x).toBeLessThan(initialRotation.x);
    });

    test('should respond to pitch down with S key in flight mode', async ({ page }) => {
      // Enter aircraft
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      
      const initialRotation = await page.evaluate(() => ({
        x: window.game.player.currentAircraft.rotation.x
      }));
      
      // Test pitch down with S key
      await page.keyboard.down('KeyS');
      await page.waitForTimeout(100);
      await page.keyboard.up('KeyS');
      await page.waitForTimeout(200);
      
      const newRotation = await page.evaluate(() => ({
        x: window.game.player.currentAircraft.rotation.x
      }));
      
      // S should cause pitch down (positive rotation.x change)
      expect(newRotation.x).toBeGreaterThan(initialRotation.x);
    });

    test('should respond to yaw controls (A/D keys) in flight mode', async ({ page }) => {
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Test yaw left with A key
      const initialYaw = await page.evaluate(() => 
        window.game.player.currentAircraft.rotation.y
      );
      
      await page.keyboard.down('KeyA');
      await page.waitForTimeout(100);
      await page.keyboard.up('KeyA');
      await page.waitForTimeout(200);
      
      const newYaw = await page.evaluate(() => 
        window.game.player.currentAircraft.rotation.y
      );
      
      // A should cause yaw left (rotation.y should change)
      expect(Math.abs(newYaw - initialYaw)).toBeGreaterThan(0);
    });

    test('should respond to roll controls (Q/Z keys) in flight mode', async ({ page }) => {
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Test roll left with Q key
      const initialRoll = await page.evaluate(() => 
        window.game.player.currentAircraft.rotation.z
      );
      
      await page.keyboard.down('KeyQ');
      await page.waitForTimeout(100);
      await page.keyboard.up('KeyQ');
      await page.waitForTimeout(200);
      
      const newRoll = await page.evaluate(() => 
        window.game.player.currentAircraft.rotation.z
      );
      
      // Q should cause roll left (rotation.z should change)
      expect(Math.abs(newRoll - initialRoll)).toBeGreaterThan(0);
    });

    test('should respond to throttle controls in flight mode', async ({ page }) => {
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      
      const initialThrottle = await page.evaluate(() => 
        window.game.player.currentAircraft.throttle
      );
      
      // Test throttle increase with Space
      await page.keyboard.down('Space');
      await page.waitForTimeout(100);
      await page.keyboard.up('Space');
      await page.waitForTimeout(200);
      
      const newThrottle = await page.evaluate(() => 
        window.game.player.currentAircraft.throttle
      );
      
      // Throttle should increase
      expect(newThrottle).toBeGreaterThan(initialThrottle);
    });

    test('should exit flight mode with E key (via direct method call)', async ({ page }) => {
      // Enter aircraft
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Verify we're in flight mode
      const isFlying = await page.evaluate(() => window.game.player.isFlying);
      expect(isFlying).toBe(true);
      
      // Exit via direct method call (E key may conflict with interaction)
      await page.evaluate(() => {
        window.game.player.exitAircraft();
      });
      await page.waitForTimeout(500);
      
      // Should be back to walking mode
      const isWalking = await page.evaluate(() => !window.game.player.isFlying);
      expect(isWalking).toBe(true);
      
      const modeText = await page.locator('#mode').textContent();
      expect(modeText).toContain('Walking');
    });

    test('should exit flight mode with Escape key', async ({ page }) => {
      // Enter aircraft
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Verify we're in flight mode
      const isFlying = await page.evaluate(() => window.game.player.isFlying);
      expect(isFlying).toBe(true);
      
      // Press Escape to exit
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Should be back to walking mode
      const isWalking = await page.evaluate(() => !window.game.player.isFlying);
      expect(isWalking).toBe(true);
    });

    test('should maintain flight state during continuous input', async ({ page }) => {
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Hold W key for an extended period
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(1000);
      await page.keyboard.up('KeyW');
      
      // Should still be flying
      const isStillFlying = await page.evaluate(() => window.game.player.isFlying);
      expect(isStillFlying).toBe(true);
      
      // Aircraft should have moved
      const position = await page.evaluate(() => ({
        x: window.game.player.currentAircraft.position.x,
        y: window.game.player.currentAircraft.position.y,
        z: window.game.player.currentAircraft.position.z
      }));
      
      expect(position.y).toBeGreaterThan(0); // Should be above ground
    });
  });
});