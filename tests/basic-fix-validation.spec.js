const { test, expect } = require('@playwright/test');

test.describe('Basic Flight Fix Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the simulator
        await page.goto('http://localhost:8080');
        
        // Wait for the game to load
        await page.waitForTimeout(3000);
        
        // Click to enable pointer lock
        await page.click('canvas');
        await page.waitForTimeout(1000);
    });

    test('game should load and create aircraft objects', async ({ page }) => {
        console.log('Testing game initialization...');
        
        // Check that the game object exists
        const gameExists = await page.evaluate(() => {
            return typeof window.game !== 'undefined' && window.game !== null;
        });
        
        expect(gameExists).toBe(true);
        console.log('Game object exists:', gameExists);

        // Check that aircraft array exists and has aircraft
        const aircraftInfo = await page.evaluate(() => {
            if (!window.game || !window.game.aircraft) return null;
            return {
                count: window.game.aircraft.length,
                types: window.game.aircraft.map(a => a.type),
                positions: window.game.aircraft.map(a => ({x: a.position.x, y: a.position.y, z: a.position.z}))
            };
        });

        expect(aircraftInfo).not.toBeNull();
        expect(aircraftInfo.count).toBeGreaterThan(0);
        console.log('Aircraft info:', aircraftInfo);
    });

    test('aircraft physics should be working when directly controlled', async ({ page }) => {
        console.log('Testing direct aircraft physics...');
        
        // Get the first aircraft and test it directly
        const result = await page.evaluate(() => {
            if (!window.game || !window.game.aircraft || window.game.aircraft.length === 0) {
                return { error: 'No aircraft found' };
            }
            
            const aircraft = window.game.aircraft[0];
            const initialPosition = {
                x: aircraft.position.x,
                y: aircraft.position.y,
                z: aircraft.position.z
            };
            
            // Start flying
            aircraft.startFlying();
            
            // Apply some physics updates manually
            for (let i = 0; i < 60; i++) { // Simulate 1 second at 60fps
                aircraft.update(1/60, { pitch: 0, yaw: 0, roll: 0, throttle: 1 });
            }
            
            const finalPosition = {
                x: aircraft.position.x,
                y: aircraft.position.y,
                z: aircraft.position.z
            };
            
            const distance = Math.sqrt(
                Math.pow(finalPosition.x - initialPosition.x, 2) + 
                Math.pow(finalPosition.y - initialPosition.y, 2) + 
                Math.pow(finalPosition.z - initialPosition.z, 2)
            );
            
            return {
                initialPosition,
                finalPosition,
                distance,
                velocity: aircraft.velocity.length(),
                throttle: aircraft.throttle,
                type: aircraft.type
            };
        });

        console.log('Physics test result:', result);
        
        expect(result.error).toBeUndefined();
        expect(result.distance).toBeGreaterThan(5); // Aircraft should move
        expect(result.velocity).toBeGreaterThan(0); // Should have velocity
        expect(result.throttle).toBeGreaterThan(0); // Should have throttle
    });

    test('control input mapping should work correctly', async ({ page }) => {
        console.log('Testing control input mapping...');
        
        const controlTest = await page.evaluate(() => {
            if (!window.game || !window.game.controls) {
                return { error: 'No controls found' };
            }
            
            const controls = window.game.controls;
            
            // Simulate key presses
            controls.keys['KeyW'] = true;
            controls.keys['KeyA'] = true;
            controls.keys['Space'] = true;
            
            const flightInput = controls.getFlightInput();
            
            controls.keys['KeyW'] = false;
            controls.keys['KeyA'] = false;
            controls.keys['Space'] = false;
            
            return {
                flightInput,
                hasCorrectPitch: flightInput.pitch === -1,
                hasCorrectYaw: flightInput.yaw === -1,
                hasCorrectThrottle: flightInput.throttle === 1
            };
        });

        console.log('Control test result:', controlTest);
        
        expect(controlTest.error).toBeUndefined();
        expect(controlTest.hasCorrectPitch).toBe(true);
        expect(controlTest.hasCorrectYaw).toBe(true);
        expect(controlTest.hasCorrectThrottle).toBe(true);
    });

    test('coordinate system should use negative Z as forward', async ({ page }) => {
        console.log('Testing coordinate system consistency...');
        
        const coordTest = await page.evaluate(() => {
            if (!window.game || !window.game.aircraft || window.game.aircraft.length === 0) {
                return { error: 'No aircraft found' };
            }
            
            const aircraft = window.game.aircraft[0];
            aircraft.startFlying();
            
            // Reset position and rotation for clean test
            aircraft.position.set(0, 10, 0);
            aircraft.rotation.set(0, 0, 0); // Facing negative Z
            aircraft.velocity.set(0, 0, 0);
            
            // Apply forward thrust
            for (let i = 0; i < 30; i++) {
                aircraft.update(1/60, { pitch: 0, yaw: 0, roll: 0, throttle: 1 });
            }
            
            return {
                position: { x: aircraft.position.x, y: aircraft.position.y, z: aircraft.position.z },
                velocity: { x: aircraft.velocity.x, y: aircraft.velocity.y, z: aircraft.velocity.z },
                movedInNegativeZ: aircraft.position.z < 0,
                velocityInNegativeZ: aircraft.velocity.z < 0
            };
        });

        console.log('Coordinate test result:', coordTest);
        
        expect(coordTest.error).toBeUndefined();
        expect(coordTest.movedInNegativeZ).toBe(true); // Should move in negative Z
        expect(coordTest.velocityInNegativeZ).toBe(true); // Velocity should be in negative Z
    });
});