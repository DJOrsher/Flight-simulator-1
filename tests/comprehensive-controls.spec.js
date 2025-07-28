const { test, expect } = require('@playwright/test');

test.describe('Flight Simulator - Comprehensive Controls and Mechanics', () => {
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

  test.describe('Walking Controls', () => {
    test('should respond to W key for forward movement', async ({ page }) => {
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // Press and hold W for forward movement
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(500);
      await page.keyboard.up('KeyW');
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // Z should decrease when moving forward (negative Z direction in Three.js)
      expect(newPosition.z).toBeLessThan(initialPosition.z);
    });

    test('should respond to S key for backward movement', async ({ page }) => {
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      await page.keyboard.down('KeyS');
      await page.waitForTimeout(500);
      await page.keyboard.up('KeyS');
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // Z should increase when moving backward
      expect(newPosition.z).toBeGreaterThan(initialPosition.z);
    });

    test('should respond to A key for left movement', async ({ page }) => {
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      await page.keyboard.down('KeyA');
      await page.waitForTimeout(500);
      await page.keyboard.up('KeyA');
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // X should decrease when moving left
      expect(newPosition.x).toBeLessThan(initialPosition.x);
    });

    test('should respond to D key for right movement', async ({ page }) => {
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(500);
      await page.keyboard.up('KeyD');
      
      const newPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      // X should increase when moving right
      expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    });

    test('should respond to Space key for jumping', async ({ page }) => {
      const initialHeight = await page.evaluate(() => window.game.player.position.y);
      
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
      
      const jumpHeight = await page.evaluate(() => window.game.player.position.y);
      
      // Player should be higher after jumping
      expect(jumpHeight).toBeGreaterThan(initialHeight);
    });

    test('should run faster with Shift key held', async ({ page }) => {
      // Test normal walking speed
      const initialPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyW');
      
      const normalDistance = await page.evaluate(() => {
        const current = window.game.player.position;
        return Math.sqrt(
          Math.pow(current.x - arguments[0].x, 2) + 
          Math.pow(current.z - arguments[0].z, 2)
        );
      }, initialPosition);
      
      // Reset position and test running
      await page.evaluate(() => {
        window.game.player.position.set(0, 2, 50);
        window.game.player.velocity.set(0, 0, 0);
      });
      
      const runStartPosition = await page.evaluate(() => ({
        x: window.game.player.position.x,
        z: window.game.player.position.z
      }));
      
      await page.keyboard.down('ShiftLeft');
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyW');
      await page.keyboard.up('ShiftLeft');
      
      const runDistance = await page.evaluate(() => {
        const current = window.game.player.position;
        return Math.sqrt(
          Math.pow(current.x - arguments[0].x, 2) + 
          Math.pow(current.z - arguments[0].z, 2)
        );
      }, runStartPosition);
      
      // Running should cover more distance
      expect(runDistance).toBeGreaterThan(normalDistance);
    });
  });

  test.describe('Aircraft Interaction', () => {
    test('should detect nearby aircraft with E key interaction', async ({ page }) => {
      // Move player near first aircraft
      await page.evaluate(() => {
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

    test('should enter aircraft successfully with E key', async ({ page }) => {
      // Position player near aircraft
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.position.set(
            aircraft.position.x + 3,
            aircraft.position.y,
            aircraft.position.z
          );
        }
      });
      
      await page.waitForTimeout(500);
      
      // Press E to enter aircraft
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(500);
      
      // Check if player is now flying
      const isFlying = await page.evaluate(() => window.game.player.isFlying);
      expect(isFlying).toBe(true);
      
      // Check mode display
      const modeText = await page.locator('#mode').textContent();
      expect(modeText).toContain('Flying');
    });

    test('should exit aircraft with E key', async ({ page }) => {
      // First enter an aircraft
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => window.game.player.isFlying)).toBe(true);
      
      // Press E to exit aircraft
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(500);
      
      // Check if player is walking again
      const isWalking = await page.evaluate(() => !window.game.player.isFlying);
      expect(isWalking).toBe(true);
      
      const modeText = await page.locator('#mode').textContent();
      expect(modeText).toContain('Walking');
    });
  });

  test.describe('Flight Controls', () => {
    test.beforeEach(async ({ page }) => {
      // Enter aircraft before each flight test
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      await page.waitForTimeout(500);
    });

    test('should respond to W key for pitch up (nose up)', async ({ page }) => {
      const initialPitch = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.x || 0
      );
      
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyW');
      
      const newPitch = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.x || 0
      );
      
      // Pitch should increase (nose up)
      expect(newPitch).toBeGreaterThan(initialPitch);
    });

    test('should respond to S key for pitch down (nose down)', async ({ page }) => {
      const initialPitch = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.x || 0
      );
      
      await page.keyboard.down('KeyS');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyS');
      
      const newPitch = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.x || 0
      );
      
      // Pitch should decrease (nose down)
      expect(newPitch).toBeLessThan(initialPitch);
    });

    test('should respond to A key for yaw left', async ({ page }) => {
      const initialYaw = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.y || 0
      );
      
      await page.keyboard.down('KeyA');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyA');
      
      const newYaw = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.y || 0
      );
      
      // Should turn left
      expect(newYaw).not.toBe(initialYaw);
    });

    test('should respond to D key for yaw right', async ({ page }) => {
      const initialYaw = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.y || 0
      );
      
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyD');
      
      const newYaw = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.y || 0
      );
      
      // Should turn right
      expect(newYaw).not.toBe(initialYaw);
    });

    test('should respond to Q key for roll left', async ({ page }) => {
      const initialRoll = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.z || 0
      );
      
      await page.keyboard.down('KeyQ');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyQ');
      
      const newRoll = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.z || 0
      );
      
      // Should roll left
      expect(newRoll).not.toBe(initialRoll);
    });

    test('should respond to Z key for roll right', async ({ page }) => {
      const initialRoll = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.z || 0
      );
      
      await page.keyboard.down('KeyZ');
      await page.waitForTimeout(300);
      await page.keyboard.up('KeyZ');
      
      const newRoll = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.z || 0
      );
      
      // Should roll right
      expect(newRoll).not.toBe(initialRoll);
    });

    test('should respond to Space key for throttle up', async ({ page }) => {
      const initialThrottle = await page.evaluate(() => 
        window.game.player.currentAircraft?.throttle || 0
      );
      
      await page.keyboard.down('Space');
      await page.waitForTimeout(300);
      await page.keyboard.up('Space');
      
      const newThrottle = await page.evaluate(() => 
        window.game.player.currentAircraft?.throttle || 0
      );
      
      // Throttle should increase
      expect(newThrottle).toBeGreaterThan(initialThrottle);
    });

    test('should respond to Shift key for throttle down', async ({ page }) => {
      // Set initial throttle
      await page.evaluate(() => {
        if (window.game.player.currentAircraft) {
          window.game.player.currentAircraft.throttle = 0.5;
        }
      });
      
      const initialThrottle = await page.evaluate(() => 
        window.game.player.currentAircraft?.throttle || 0
      );
      
      await page.keyboard.down('ShiftLeft');
      await page.waitForTimeout(300);
      await page.keyboard.up('ShiftLeft');
      
      const newThrottle = await page.evaluate(() => 
        window.game.player.currentAircraft?.throttle || 0
      );
      
      // Throttle should decrease
      expect(newThrottle).toBeLessThan(initialThrottle);
    });

    test('should update speed indicator during flight', async ({ page }) => {
      // Give aircraft some throttle
      await page.evaluate(() => {
        if (window.game.player.currentAircraft) {
          window.game.player.currentAircraft.throttle = 0.8;
          window.game.player.currentAircraft.speed = 150;
        }
      });
      
      await page.waitForTimeout(500);
      
      const speedText = await page.locator('#speed-indicator').textContent();
      expect(speedText).toMatch(/Speed: \d+ kt/);
      expect(speedText).toContain('150');
    });

    test('should update altitude indicator during flight', async ({ page }) => {
      // Set aircraft altitude
      await page.evaluate(() => {
        if (window.game.player.currentAircraft) {
          window.game.player.currentAircraft.position.y = 500;
          window.game.player.position.y = 500;
        }
      });
      
      await page.waitForTimeout(500);
      
      const altitudeText = await page.locator('#altitude-indicator').textContent();
      expect(altitudeText).toMatch(/Altitude: \d+ ft/);
    });
  });

  test.describe('Combined Flight Maneuvers', () => {
    test.beforeEach(async ({ page }) => {
      // Enter aircraft for maneuver tests
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.enterAircraft(aircraft);
        }
      });
      await page.waitForTimeout(500);
    });

    test('should perform takeoff sequence (throttle up + pitch up)', async ({ page }) => {
      const initialAltitude = await page.evaluate(() => 
        window.game.player.currentAircraft?.position.y || 0
      );
      
      // Throttle up
      await page.keyboard.down('Space');
      await page.waitForTimeout(200);
      
      // Pitch up for takeoff
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(500);
      
      await page.keyboard.up('Space');
      await page.keyboard.up('KeyW');
      
      const newAltitude = await page.evaluate(() => 
        window.game.player.currentAircraft?.position.y || 0
      );
      
      // Aircraft should have gained altitude
      expect(newAltitude).toBeGreaterThan(initialAltitude);
    });

    test('should perform coordinated turn (yaw + roll)', async ({ page }) => {
      const initialHeading = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.y || 0
      );
      
      // Coordinated right turn
      await page.keyboard.down('KeyD'); // Yaw right
      await page.keyboard.down('KeyZ'); // Roll right
      await page.waitForTimeout(400);
      await page.keyboard.up('KeyD');
      await page.keyboard.up('KeyZ');
      
      const newHeading = await page.evaluate(() => 
        window.game.player.currentAircraft?.rotation.y || 0
      );
      
      // Heading should have changed
      expect(newHeading).not.toBe(initialHeading);
    });

    test('should handle multiple simultaneous inputs', async ({ page }) => {
      // Test all flight controls at once
      await page.keyboard.down('Space'); // Throttle up
      await page.keyboard.down('KeyW');  // Pitch up
      await page.keyboard.down('KeyD');  // Yaw right
      await page.keyboard.down('KeyZ');  // Roll right
      
      await page.waitForTimeout(300);
      
      // Check that aircraft responds to all inputs
      const aircraftState = await page.evaluate(() => {
        const aircraft = window.game.player.currentAircraft;
        return {
          throttle: aircraft?.throttle || 0,
          hasRotationChanges: aircraft?.rotation.x !== 0 || aircraft?.rotation.y !== 0 || aircraft?.rotation.z !== 0
        };
      });
      
      expect(aircraftState.throttle).toBeGreaterThan(0);
      
      // Clean up
      await page.keyboard.up('Space');
      await page.keyboard.up('KeyW');
      await page.keyboard.up('KeyD');
      await page.keyboard.up('KeyZ');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle rapid key presses without errors', async ({ page }) => {
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('KeyW');
        await page.keyboard.press('KeyA');
        await page.keyboard.press('KeyS');
        await page.keyboard.press('KeyD');
        await page.waitForTimeout(10);
      }
      
      await page.waitForTimeout(500);
      
      // Filter out expected warnings
      const criticalErrors = errors.filter(error => 
        !error.includes('three.js') && 
        !error.includes('WEBGL') &&
        !error.includes('extension')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should handle entering non-existent aircraft gracefully', async ({ page }) => {
      const result = await page.evaluate(() => {
        try {
          // Try to enter a null aircraft
          window.game.player.enterAircraft(null);
          return { success: false, error: 'Should have thrown error' };
        } catch (error) {
          return { success: true, handled: true };
        }
      });
      
      // Should either handle gracefully or throw appropriate error
      expect(result.success || result.handled).toBe(true);
    });

    test('should maintain proper game state during rapid mode switches', async ({ page }) => {
      // Position near aircraft
      await page.evaluate(() => {
        if (window.game.aircraft.length > 0) {
          const aircraft = window.game.aircraft[0];
          window.game.player.position.set(
            aircraft.position.x + 3,
            aircraft.position.y,
            aircraft.position.z
          );
        }
      });
      
      // Rapid enter/exit
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('KeyE'); // Enter
        await page.waitForTimeout(200);
        await page.keyboard.press('KeyE'); // Exit
        await page.waitForTimeout(200);
      }
      
      // Check final state is consistent
      const finalState = await page.evaluate(() => ({
        isFlying: window.game.player.isFlying,
        currentAircraft: !!window.game.player.currentAircraft,
        position: {
          x: window.game.player.position.x,
          y: window.game.player.position.y,
          z: window.game.player.position.z
        }
      }));
      
      // Should be in walking mode
      expect(finalState.isFlying).toBe(false);
      expect(finalState.currentAircraft).toBe(false);
      expect(finalState.position.y).toBeGreaterThan(0);
    });
  });
});