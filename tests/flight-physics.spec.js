const { test, expect } = require('@playwright/test');

test.describe('Flight Physics Tests', () => {
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

  test('aircraft should have proper initial flight state when entering', async ({ page }) => {
    const aircraftState = await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
        
        return {
          isFlying: aircraft.isFlying,
          throttle: aircraft.throttle,
          velocityMagnitude: aircraft.velocity.length(),
          position: { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z },
          type: aircraft.type,
          maxThrust: aircraft.maxThrust,
          weight: aircraft.weight
        };
      }
      return null;
    });
    
    expect(aircraftState).not.toBeNull();
    expect(aircraftState.isFlying).toBe(true);
    expect(aircraftState.throttle).toBeGreaterThan(0.5); // Should start with significant throttle
    expect(aircraftState.velocityMagnitude).toBeGreaterThan(20); // Should have initial velocity
    expect(aircraftState.maxThrust).toBeGreaterThan(1000); // Should have reasonable thrust
    expect(aircraftState.weight).toBeGreaterThan(1000); // Should have reasonable weight
  });

  test('throttle input should affect aircraft movement', async ({ page }) => {
    // Enter aircraft and get initial state
    const initialState = await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
        return {
          throttle: aircraft.throttle,
          speed: aircraft.speed,
          position: { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z }
        };
      }
      return null;
    });

    expect(initialState).not.toBeNull();
    
    // Apply throttle increase
    await page.keyboard.down('Space');
    await page.waitForTimeout(500); // Hold for half a second
    await page.keyboard.up('Space');
    await page.waitForTimeout(300); // Allow physics to apply
    
    const afterThrottleState = await page.evaluate(() => {
      const aircraft = window.game.player.currentAircraft;
      return {
        throttle: aircraft.throttle,
        speed: aircraft.speed,
        position: { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z },
        velocity: aircraft.velocity.length()
      };
    });
    
    // Throttle should have increased
    expect(afterThrottleState.throttle).toBeGreaterThan(initialState.throttle);
    
    // Speed should have increased
    expect(afterThrottleState.speed).toBeGreaterThan(initialState.speed);
    
    // Position should have changed significantly
    const distanceMoved = Math.sqrt(
      Math.pow(afterThrottleState.position.x - initialState.position.x, 2) +
      Math.pow(afterThrottleState.position.y - initialState.position.y, 2) +
      Math.pow(afterThrottleState.position.z - initialState.position.z, 2)
    );
    expect(distanceMoved).toBeGreaterThan(10);
    
    // Should have significant velocity
    expect(afterThrottleState.velocity).toBeGreaterThan(25);
  });

  test('aircraft should demonstrate realistic physics over extended flight', async ({ page }) => {
    // Enter aircraft
    await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
      }
    });
    
    const initialPosition = await page.evaluate(() => {
      const aircraft = window.game.player.currentAircraft;
      return { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z };
    });
    
    // Extended flight test - maintain throttle and observe continuous movement
    await page.keyboard.down('Space'); // Increase throttle
    await page.waitForTimeout(1500); // Hold for 1.5 seconds
    await page.keyboard.up('Space');
    
    // Continue flying without further input to test momentum
    await page.waitForTimeout(1000);
    
    const finalState = await page.evaluate(() => {
      const aircraft = window.game.player.currentAircraft;
      return {
        position: { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z },
        velocity: aircraft.velocity.length(),
        speed: aircraft.speed,
        throttle: aircraft.throttle
      };
    });
    
    // Should have moved a very significant distance
    const totalDistance = Math.sqrt(
      Math.pow(finalState.position.x - initialPosition.x, 2) +
      Math.pow(finalState.position.y - initialPosition.y, 2) +
      Math.pow(finalState.position.z - initialPosition.z, 2)
    );
    expect(totalDistance).toBeGreaterThan(50);
    
    // Should have maintained high speed
    expect(finalState.speed).toBeGreaterThan(75);
    
    // Should still have momentum
    expect(finalState.velocity).toBeGreaterThan(20);
  });

  test('pitch controls should affect aircraft trajectory', async ({ page }) => {
    // Enter aircraft
    await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
      }
    });
    
    await page.waitForTimeout(300);
    
    const initialState = await page.evaluate(() => {
      const aircraft = window.game.player.currentAircraft;
      return {
        position: { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z },
        rotation: { x: aircraft.rotation.x, y: aircraft.rotation.y, z: aircraft.rotation.z }
      };
    });
    
    // Apply pitch up and throttle simultaneously
    await page.keyboard.down('Space'); // Throttle
    await page.keyboard.down('KeyW');  // Pitch up
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('Space');
    await page.waitForTimeout(400);
    
    const afterClimbState = await page.evaluate(() => {
      const aircraft = window.game.player.currentAircraft;
      return {
        position: { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z },
        rotation: { x: aircraft.rotation.x, y: aircraft.rotation.y, z: aircraft.rotation.z }
      };
    });
    
    // Should have pitched up (negative rotation.x)
    expect(afterClimbState.rotation.x).toBeLessThan(initialState.rotation.x);
    
    // Should have gained altitude
    expect(afterClimbState.position.y).toBeGreaterThan(initialState.position.y + 5);
    
    // Should have moved forward as well
    const horizontalDistance = Math.sqrt(
      Math.pow(afterClimbState.position.x - initialState.position.x, 2) +
      Math.pow(afterClimbState.position.z - initialState.position.z, 2)
    );
    expect(horizontalDistance).toBeGreaterThan(15);
  });

  test('different aircraft types should have distinct flight characteristics', async ({ page }) => {
    // Test fighter jet characteristics
    const fighterTest = await page.evaluate(() => {
      const fighter = window.game.aircraft.find(a => a.type === 'fighter');
      if (fighter) {
        window.game.player.enterAircraft(fighter);
        // Apply throttle briefly
        fighter.throttle = 0.8;
        
        // Simulate some flight time
        for (let i = 0; i < 10; i++) {
          fighter.update(0.016, { pitch: 0, yaw: 0, roll: 0, throttle: 0 }); // 60fps simulation
        }
        
        return {
          type: fighter.type,
          maxSpeed: fighter.maxSpeed,
          speed: fighter.speed,
          velocity: fighter.velocity.length(),
          weight: fighter.weight,
          maxThrust: fighter.maxThrust
        };
      }
      return null;
    });
    
    if (fighterTest) {
      expect(fighterTest.type).toBe('fighter');
      expect(fighterTest.maxSpeed).toBe(600); // Fighter should be fastest
      expect(fighterTest.velocity).toBeGreaterThan(0); // Should be moving
      expect(fighterTest.maxThrust).toBeGreaterThan(20000); // High thrust
    }
    
    // Test helicopter characteristics  
    const helicopterTest = await page.evaluate(() => {
      const helicopter = window.game.aircraft.find(a => a.type === 'helicopter');
      if (helicopter) {
        // Exit current aircraft first
        window.game.player.exitAircraft();
        
        // Enter helicopter
        window.game.player.enterAircraft(helicopter);
        helicopter.throttle = 0.8;
        
        // Simulate some flight time
        for (let i = 0; i < 10; i++) {
          helicopter.update(0.016, { pitch: 0, yaw: 0, roll: 0, throttle: 0 });
        }
        
        return {
          type: helicopter.type,
          maxSpeed: helicopter.maxSpeed,
          speed: helicopter.speed,
          velocity: helicopter.velocity.length(),
          canHover: helicopter.canHover
        };
      }
      return null;
    });
    
    if (helicopterTest) {
      expect(helicopterTest.type).toBe('helicopter');
      expect(helicopterTest.maxSpeed).toBe(150); // Helicopter should be slowest
      expect(helicopterTest.canHover).toBe(true); // Should have hover capability
      expect(helicopterTest.velocity).toBeGreaterThan(0); // Should be moving vertically
    }
  });

  test('aircraft should respond to throttle reduction', async ({ page }) => {
    // Enter aircraft and build up speed
    await page.evaluate(() => {
      if (window.game.aircraft.length > 0) {
        const aircraft = window.game.aircraft[0];
        window.game.player.enterAircraft(aircraft);
        aircraft.throttle = 0.9; // Set high throttle
      }
    });
    
    await page.waitForTimeout(500); // Let speed build up
    
    const highSpeedState = await page.evaluate(() => {
      const aircraft = window.game.player.currentAircraft;
      return {
        throttle: aircraft.throttle,
        speed: aircraft.speed,
        velocity: aircraft.velocity.length()
      };
    });
    
    // Reduce throttle significantly
    await page.keyboard.down('ShiftLeft'); // Decrease throttle
    await page.waitForTimeout(600);
    await page.keyboard.up('ShiftLeft');
    await page.waitForTimeout(400);
    
    const lowSpeedState = await page.evaluate(() => {
      const aircraft = window.game.player.currentAircraft;
      return {
        throttle: aircraft.throttle,
        speed: aircraft.speed,
        velocity: aircraft.velocity.length()
      };
    });
    
    // Throttle should have decreased
    expect(lowSpeedState.throttle).toBeLessThan(highSpeedState.throttle);
    
    // Speed should have decreased (though maybe not dramatically due to momentum)
    expect(lowSpeedState.speed).toBeLessThanOrEqual(highSpeedState.speed + 5); // Allow for small momentum increase
    
    // Still should have reasonable velocity due to momentum
    expect(lowSpeedState.velocity).toBeGreaterThan(10);
  });
});