const { test, expect } = require('@playwright/test');

test.describe('Fixed Flight Controls Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the simulator
        await page.goto('http://localhost:8080');
        
        // Wait for the game to load
        await page.waitForTimeout(2000);
        
        // Click to enable pointer lock
        await page.click('canvas');
        await page.waitForTimeout(500);
    });

    test('aircraft should move forward with throttle input', async ({ page }) => {
        console.log('Testing forward movement with throttle...');
        
        // Enter flight mode by approaching an aircraft and pressing E
        await page.keyboard.press('KeyW'); // Move forward to aircraft
        await page.waitForTimeout(1000);
        await page.keyboard.press('KeyE'); // Enter aircraft
        await page.waitForTimeout(500);

        // Get initial position
        const initialPosition = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                {
                    x: window.game.player.currentAircraft.position.x,
                    z: window.game.player.currentAircraft.position.z
                } : null;
        });

        expect(initialPosition).not.toBeNull();
        console.log('Initial position:', initialPosition);

        // Apply throttle for forward movement
        await page.keyboard.down('Space');
        await page.waitForTimeout(3000); // Let aircraft accelerate
        await page.keyboard.up('Space');

        // Check that aircraft moved forward
        const finalPosition = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                {
                    x: window.game.player.currentAircraft.position.x,
                    z: window.game.player.currentAircraft.position.z
                } : null;
        });

        expect(finalPosition).not.toBeNull();
        console.log('Final position:', finalPosition);

        // Calculate distance moved
        const distanceMoved = Math.sqrt(
            Math.pow(finalPosition.x - initialPosition.x, 2) + 
            Math.pow(finalPosition.z - initialPosition.z, 2)
        );

        console.log('Distance moved:', distanceMoved);
        expect(distanceMoved).toBeGreaterThan(10); // Should move significant distance
    });

    test('pitch controls should affect aircraft nose up/down correctly', async ({ page }) => {
        console.log('Testing pitch controls...');
        
        // Enter aircraft
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(1000);
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(500);

        // Apply throttle and pitch up
        await page.keyboard.down('Space');
        await page.keyboard.down('KeyW'); // Pitch up
        await page.waitForTimeout(2000);

        // Check altitude increased (Y position)
        const altitude = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.position.y : null;
        });

        console.log('Aircraft altitude after pitch up:', altitude);
        expect(altitude).toBeGreaterThan(10); // Should climb with pitch up + throttle

        await page.keyboard.up('KeyW');
        await page.keyboard.up('Space');
    });

    test('yaw controls should turn aircraft left and right correctly', async ({ page }) => {
        console.log('Testing yaw controls...');
        
        // Enter aircraft
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(1000);
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(500);

        // Get initial rotation
        const initialRotation = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.rotation.y : null;
        });

        // Apply yaw left
        await page.keyboard.down('KeyA');
        await page.waitForTimeout(1500);
        await page.keyboard.up('KeyA');

        const leftRotation = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.rotation.y : null;
        });

        console.log('Rotation after yaw left:', leftRotation - initialRotation);
        expect(Math.abs(leftRotation - initialRotation)).toBeGreaterThan(0.1);

        // Apply yaw right
        await page.keyboard.down('KeyD');
        await page.waitForTimeout(1500);
        await page.keyboard.up('KeyD');

        const rightRotation = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.rotation.y : null;
        });

        console.log('Rotation after yaw right:', rightRotation - leftRotation);
        expect(Math.abs(rightRotation - leftRotation)).toBeGreaterThan(0.1);
    });

    test('roll controls should bank aircraft left and right correctly', async ({ page }) => {
        console.log('Testing roll controls...');
        
        // Enter aircraft
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(1000);
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(500);

        // Get initial roll
        const initialRoll = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.rotation.z : null;
        });

        // Apply roll left
        await page.keyboard.down('KeyQ');
        await page.waitForTimeout(1500);
        await page.keyboard.up('KeyQ');

        const leftRoll = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.rotation.z : null;
        });

        console.log('Roll after left input:', leftRoll - initialRoll);
        expect(Math.abs(leftRoll - initialRoll)).toBeGreaterThan(0.1);

        // Apply roll right
        await page.keyboard.down('KeyE');
        await page.waitForTimeout(1500);
        await page.keyboard.up('KeyE');

        const rightRoll = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.rotation.z : null;
        });

        console.log('Roll after right input:', rightRoll - leftRoll);
        expect(Math.abs(rightRoll - leftRoll)).toBeGreaterThan(0.1);
    });

    test('helicopter should hover with throttle input', async ({ page }) => {
        console.log('Testing helicopter hover capability...');
        
        // Navigate to helicopter position
        await page.evaluate(() => {
            // Find a helicopter
            const helicopter = window.game.aircraft.find(a => a.type === 'helicopter');
            if (helicopter) {
                window.game.player.position.copy(helicopter.position);
                window.game.player.position.add(new THREE.Vector3(0, 0, 15));
            }
        });

        await page.waitForTimeout(500);
        await page.keyboard.press('KeyE'); // Enter helicopter
        await page.waitForTimeout(500);

        // Apply hover throttle
        await page.keyboard.down('Space');
        await page.waitForTimeout(3000);

        // Check helicopter maintains altitude and doesn't fall
        const altitude = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.position.y : null;
        });

        console.log('Helicopter altitude during hover:', altitude);
        expect(altitude).toBeGreaterThan(8); // Should maintain altitude above ground

        await page.keyboard.up('Space');
    });

    test('different aircraft types should have distinct flight characteristics', async ({ page }) => {
        console.log('Testing different aircraft types...');
        
        // Test fighter jet
        await page.evaluate(() => {
            const fighter = window.game.aircraft.find(a => a.type === 'fighter');
            if (fighter) {
                window.game.player.position.copy(fighter.position);
                window.game.player.position.add(new THREE.Vector3(0, 0, 15));
            }
        });
        
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(500);

        const fighterMaxSpeed = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.maxSpeed : null;
        });

        await page.keyboard.press('Escape'); // Exit aircraft
        await page.waitForTimeout(500);

        // Test cargo plane
        await page.evaluate(() => {
            const cargo = window.game.aircraft.find(a => a.type === 'cargo');
            if (cargo) {
                window.game.player.position.copy(cargo.position);
                window.game.player.position.add(new THREE.Vector3(0, 0, 15));
            }
        });
        
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(500);

        const cargoMaxSpeed = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.maxSpeed : null;
        });

        console.log('Fighter max speed:', fighterMaxSpeed);
        console.log('Cargo max speed:', cargoMaxSpeed);
        
        expect(fighterMaxSpeed).toBeGreaterThan(cargoMaxSpeed); // Fighter should be faster
        expect(fighterMaxSpeed).toBe(600); // Verify specific values
        expect(cargoMaxSpeed).toBe(350);
    });

    test('aircraft should not climb uncontrollably without input', async ({ page }) => {
        console.log('Testing aircraft stability...');
        
        // Enter aircraft
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(1000);
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(500);

        // Apply throttle only (no pitch input)
        await page.keyboard.down('Space');
        await page.waitForTimeout(2000);
        
        const altitude1 = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.position.y : null;
        });

        await page.waitForTimeout(2000);
        
        const altitude2 = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.position.y : null;
        });

        await page.keyboard.up('Space');

        const altitudeChange = altitude2 - altitude1;
        console.log('Altitude change without pitch input:', altitudeChange);
        
        // Should not climb excessively without pitch input
        expect(Math.abs(altitudeChange)).toBeLessThan(50);
    });

    test('throttle reduction should decrease aircraft speed', async ({ page }) => {
        console.log('Testing throttle reduction...');
        
        // Enter aircraft
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(1000);
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(500);

        // Build up speed
        await page.keyboard.down('Space');
        await page.waitForTimeout(3000);
        
        const highThrottleSpeed = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.velocity.length() : null;
        });

        await page.keyboard.up('Space');

        // Reduce throttle
        await page.keyboard.down('ShiftLeft');
        await page.waitForTimeout(2000);
        await page.keyboard.up('ShiftLeft');

        const lowThrottleSpeed = await page.evaluate(() => {
            return window.game && window.game.player.currentAircraft ? 
                window.game.player.currentAircraft.velocity.length() : null;
        });

        console.log('High throttle speed:', highThrottleSpeed);
        console.log('Low throttle speed:', lowThrottleSpeed);
        
        expect(lowThrottleSpeed).toBeLessThan(highThrottleSpeed); // Speed should decrease
    });
});