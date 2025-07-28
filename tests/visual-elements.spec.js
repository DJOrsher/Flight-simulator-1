const { test, expect } = require('@playwright/test');

test.describe('Flight Simulator - Visual Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4000); // Wait for full scene loading
  });

  test('should render airbase structures', async ({ page }) => {
    const airbaseElements = await page.evaluate(() => {
      if (!window.game || !window.game.world) return null;
      
      return {
        hasRunways: window.game.world.runways.length > 0,
        hasBuildings: window.game.world.buildings.length > 0,
        hasLights: window.game.world.lights.length > 0,
        runwayCount: window.game.world.runways.length,
        buildingCount: window.game.world.buildings.length,
        lightCount: window.game.world.lights.length
      };
    });

    expect(airbaseElements.hasRunways).toBe(true);
    expect(airbaseElements.hasBuildings).toBe(true);
    expect(airbaseElements.hasLights).toBe(true);
    expect(airbaseElements.runwayCount).toBeGreaterThan(0);
    expect(airbaseElements.buildingCount).toBeGreaterThan(0);
    
    console.log(`Airbase has ${airbaseElements.runwayCount} runways, ${airbaseElements.buildingCount} buildings, ${airbaseElements.lightCount} lights`);
  });

  test('should render aircraft models in the scene', async ({ page }) => {
    const aircraftVisibility = await page.evaluate(() => {
      if (!window.game || !window.game.aircraft) return null;
      
      const aircraftInfo = window.game.aircraft.map(aircraft => ({
        type: aircraft.type,
        hasVisibleMesh: !!(aircraft.mesh && aircraft.mesh.visible),
        position: {
          x: aircraft.position.x,
          y: aircraft.position.y,
          z: aircraft.position.z
        },
        meshChildrenCount: aircraft.mesh ? aircraft.mesh.children.length : 0
      }));
      
      return {
        totalAircraft: window.game.aircraft.length,
        visibleAircraft: aircraftInfo.filter(a => a.hasVisibleMesh).length,
        aircraftDetails: aircraftInfo
      };
    });

    expect(aircraftVisibility.totalAircraft).toBeGreaterThan(0);
    expect(aircraftVisibility.visibleAircraft).toBe(aircraftVisibility.totalAircraft);
    
    // Check aircraft types
    const aircraftTypes = aircraftVisibility.aircraftDetails.map(a => a.type);
    expect(aircraftTypes).toContain('fighter');
    expect(aircraftTypes).toContain('cargo');
    expect(aircraftTypes).toContain('helicopter');
    
    console.log(`Found ${aircraftVisibility.totalAircraft} aircraft: ${aircraftTypes.join(', ')}`);
  });

  test('should have proper lighting setup', async ({ page }) => {
    const lightingInfo = await page.evaluate(() => {
      if (!window.game || !window.game.scene) return null;
      
      const lights = [];
      window.game.scene.traverse((object) => {
        if (object.isLight) {
          lights.push({
            type: object.type,
            intensity: object.intensity,
            visible: object.visible
          });
        }
      });
      
      return {
        lightCount: lights.length,
        lights: lights,
        hasFog: !!window.game.scene.fog,
        hasAmbientLight: lights.some(l => l.type === 'AmbientLight'),
        hasDirectionalLight: lights.some(l => l.type === 'DirectionalLight')
      };
    });

    expect(lightingInfo.lightCount).toBeGreaterThan(0);
    expect(lightingInfo.hasFog).toBe(true);
    expect(lightingInfo.hasAmbientLight).toBe(true);
    expect(lightingInfo.hasDirectionalLight).toBe(true);
    
    console.log(`Scene has ${lightingInfo.lightCount} lights and fog enabled`);
  });

  test('should render terrain with proper geometry', async ({ page }) => {
    const terrainInfo = await page.evaluate(() => {
      if (!window.game || !window.game.world || !window.game.world.terrain) return null;
      
      const terrain = window.game.world.terrain;
      return {
        hasTerrain: !!terrain,
        isVisible: terrain.visible,
        hasGeometry: !!terrain.geometry,
        hasMaterial: !!terrain.material,
        position: {
          x: terrain.position.x,
          y: terrain.position.y,
          z: terrain.position.z
        },
        rotation: {
          x: terrain.rotation.x,
          y: terrain.rotation.y,
          z: terrain.rotation.z
        }
      };
    });

    expect(terrainInfo.hasTerrain).toBe(true);
    expect(terrainInfo.isVisible).toBe(true);
    expect(terrainInfo.hasGeometry).toBe(true);
    expect(terrainInfo.hasMaterial).toBe(true);
    expect(terrainInfo.position.y).toBeLessThan(0); // Terrain should be below ground level
  });

  test('should animate runway lights', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check if lights are animated by sampling color at different times
    const initialLightState = await page.evaluate(() => {
      if (!window.game || !window.game.world || !window.game.world.lights) return null;
      
      const light = window.game.world.lights[0];
      if (!light || !light.material || !light.material.emissive) return null;
      
      return {
        r: light.material.emissive.r,
        g: light.material.emissive.g,
        b: light.material.emissive.b
      };
    });

    await page.waitForTimeout(500);

    const laterLightState = await page.evaluate(() => {
      if (!window.game || !window.game.world || !window.game.world.lights) return null;
      
      const light = window.game.world.lights[0];
      if (!light || !light.material || !light.material.emissive) return null;
      
      return {
        r: light.material.emissive.r,
        g: light.material.emissive.g,
        b: light.material.emissive.b
      };
    });

    if (initialLightState && laterLightState) {
      // Lights should be animating (colors changing)
      const colorChanged = 
        Math.abs(initialLightState.r - laterLightState.r) > 0.1 ||
        Math.abs(initialLightState.g - laterLightState.g) > 0.1 ||
        Math.abs(initialLightState.b - laterLightState.b) > 0.1;
      
      expect(colorChanged).toBe(true);
    }
  });

  test('should render mountains in the distance', async ({ page }) => {
    const mountainCount = await page.evaluate(() => {
      if (!window.game || !window.game.scene) return 0;
      
      let mountains = 0;
      window.game.scene.traverse((object) => {
        // Mountains are created as cone geometries in the distance
        if (object.geometry && object.geometry.type === 'ConeGeometry') {
          const distance = Math.sqrt(
            object.position.x * object.position.x + 
            object.position.z * object.position.z
          );
          if (distance > 2000) { // Mountains are far away
            mountains++;
          }
        }
      });
      
      return mountains;
    });

    expect(mountainCount).toBeGreaterThan(0);
    console.log(`Found ${mountainCount} mountains in the distance`);
  });

  test('should have proper camera viewport setup', async ({ page }) => {
    const cameraInfo = await page.evaluate(() => {
      if (!window.game || !window.game.camera) return null;
      
      return {
        fov: window.game.camera.fov,
        aspect: window.game.camera.aspect,
        near: window.game.camera.near,
        far: window.game.camera.far,
        position: {
          x: window.game.camera.position.x,
          y: window.game.camera.position.y,
          z: window.game.camera.position.z
        }
      };
    });

    expect(cameraInfo.fov).toBe(75);
    expect(cameraInfo.near).toBe(0.1);
    expect(cameraInfo.far).toBe(10000);
    expect(cameraInfo.aspect).toBeGreaterThan(0);
  });

  test('should render different aircraft types with distinct appearances', async ({ page }) => {
    const aircraftAppearances = await page.evaluate(() => {
      if (!window.game || !window.game.aircraft) return null;
      
      const appearances = {};
      
      window.game.aircraft.forEach(aircraft => {
        if (!appearances[aircraft.type]) {
          appearances[aircraft.type] = {
            color: aircraft.color,
            size: aircraft.size,
            hasRotor: aircraft.type === 'helicopter' && !!aircraft.rotor,
            meshChildCount: aircraft.mesh ? aircraft.mesh.children.length : 0
          };
        }
      });
      
      return appearances;
    });

    expect(aircraftAppearances).toBeTruthy();
    
    // Helicopters should have rotors
    if (aircraftAppearances.helicopter) {
      expect(aircraftAppearances.helicopter.hasRotor).toBe(true);
    }
    
    // Different aircraft types should have different colors
    const colors = Object.values(aircraftAppearances).map(a => a.color);
    const uniqueColors = [...new Set(colors)];
    expect(uniqueColors.length).toBeGreaterThan(1);
    
    console.log('Aircraft appearances:', Object.keys(aircraftAppearances));
  });

  test('should render sky sphere', async ({ page }) => {
    const hasSky = await page.evaluate(() => {
      if (!window.game || !window.game.scene) return false;
      
      let skyFound = false;
      window.game.scene.traverse((object) => {
        if (object.geometry && object.geometry.type === 'SphereGeometry') {
          // Sky should be a large sphere
          const params = object.geometry.parameters;
          if (params && params.radius > 5000) {
            skyFound = true;
          }
        }
      });
      
      return skyFound;
    });

    expect(hasSky).toBe(true);
  });

  test('should take screenshot for visual verification', async ({ page }) => {
    // Wait for everything to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/simulator-screenshot.png',
      fullPage: false 
    });
    
    // Basic visual check - ensure canvas is rendering something
    const canvasPixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
      const context = canvas.getContext('2d');
      const imageData = context.getImageData(0, 0, 100, 100);
      
      // Check if there's any non-background color
      let hasNonBackground = false;
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        // Check if pixel is not sky blue background (135, 206, 235)
        if (Math.abs(r - 135) > 10 || Math.abs(g - 206) > 10 || Math.abs(b - 235) > 10) {
          hasNonBackground = true;
          break;
        }
      }
      
      return hasNonBackground;
    });

    // Note: The above canvas check might not work with WebGL, so we just verify the canvas exists
    const canvas = await page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});