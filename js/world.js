class World {
    constructor(scene) {
        this.scene = scene;
        this.terrain = null;
        this.buildings = [];
        this.runways = [];
        this.lights = [];
        
        this.createWorld();
    }
    
    createWorld() {
        // Create terrain
        this.createTerrain();
        
        // Create airbase
        this.createAirbase();
        
        // Create lighting
        this.createLighting();
        
        // Create sky
        this.createSky();
        
        // Create distant mountains
        this.createMountains();
    }
    
    createTerrain() {
        // Large ground plane
        const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
        
        // Create height variation
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            // Simple noise for terrain height
            vertices[i + 1] = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 20 + 
                             Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5;
        }
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a5d23,
            wireframe: false
        });
        
        this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.position.y = -5;
        this.scene.add(this.terrain);
    }
    
    createAirbase() {
        // Create main runway
        this.createRunway(0, 0, 0, 200, 20, 0x333333);
        
        // Create crosswind runway
        this.createRunway(0, 0, Math.PI/2, 150, 15, 0x333333);
        
        // Create taxiways
        this.createRunway(-50, 0, 0, 100, 10, 0x444444);
        this.createRunway(50, 0, 0, 100, 10, 0x444444);
        
        // Create hangars
        this.createHangar(-80, 0, -40, 0x666666);
        this.createHangar(-80, 0, 0, 0x666666);
        this.createHangar(-80, 0, 40, 0x666666);
        
        // Create control tower
        this.createControlTower(60, 0, -60);
        
        // Create terminal building
        this.createTerminal(100, 0, 0);
        
        // Create fuel tanks
        this.createFuelTank(-120, 0, -80, 0xcccccc);
        this.createFuelTank(-120, 0, -60, 0xcccccc);
        this.createFuelTank(-120, 0, -40, 0xcccccc);
        
        // Create runway lights
        this.createRunwayLights();
    }
    
    createRunway(x, y, rotation, length, width, color) {
        const runwayGeometry = new THREE.BoxGeometry(length, 0.5, width);
        const runwayMaterial = new THREE.MeshLambertMaterial({ color: color });
        const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
        
        runway.position.set(x, y, 0);
        runway.rotation.y = rotation;
        
        this.scene.add(runway);
        this.runways.push(runway);
        
        // Add runway markings
        if (color === 0x333333) { // Main runways get markings
            this.addRunwayMarkings(runway, length, width);
        }
    }
    
    addRunwayMarkings(runway, length, width) {
        // Center line
        const lineGeometry = new THREE.BoxGeometry(length * 0.8, 0.1, 0.5);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
        centerLine.position.copy(runway.position);
        centerLine.position.y += 0.3;
        centerLine.rotation.copy(runway.rotation);
        this.scene.add(centerLine);
        
        // Threshold markings
        for (let i = 0; i < 8; i++) {
            const markingGeometry = new THREE.BoxGeometry(8, 0.1, 1);
            const marking = new THREE.Mesh(markingGeometry, lineMaterial);
            const offset = (i - 3.5) * 2;
            marking.position.copy(runway.position);
            marking.position.x += Math.cos(runway.rotation.y) * (length * 0.35);
            marking.position.z += Math.sin(runway.rotation.y) * (length * 0.35) + 
                                  Math.cos(runway.rotation.y) * offset;
            marking.position.y += 0.3;
            marking.rotation.copy(runway.rotation);
            this.scene.add(marking);
            
            // Other end
            const marking2 = marking.clone();
            marking2.position.copy(runway.position);
            marking2.position.x -= Math.cos(runway.rotation.y) * (length * 0.35);
            marking2.position.z -= Math.sin(runway.rotation.y) * (length * 0.35) + 
                                   Math.cos(runway.rotation.y) * offset;
            this.scene.add(marking2);
        }
    }
    
    createHangar(x, y, z, color) {
        const hangarGroup = new THREE.Group();
        
        // Main structure
        const hangarGeometry = new THREE.BoxGeometry(40, 15, 30);
        const hangarMaterial = new THREE.MeshLambertMaterial({ color: color });
        const hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
        hangar.position.y = 7.5;
        hangarGroup.add(hangar);
        
        // Roof
        const roofGeometry = new THREE.ConeGeometry(25, 5, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 17.5;
        roof.rotation.y = Math.PI / 4;
        hangarGroup.add(roof);
        
        // Doors
        const doorGeometry = new THREE.BoxGeometry(35, 12, 1);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 6, 15.5);
        hangarGroup.add(door);
        
        hangarGroup.position.set(x, y, z);
        this.scene.add(hangarGroup);
        this.buildings.push(hangarGroup);
    }
    
    createControlTower(x, y, z) {
        const towerGroup = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(15, 20, 15);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 10;
        towerGroup.add(base);
        
        // Tower
        const towerGeometry = new THREE.BoxGeometry(8, 25, 8);
        const tower = new THREE.Mesh(towerGeometry, baseMaterial);
        tower.position.y = 32.5;
        towerGroup.add(tower);
        
        // Control room
        const controlGeometry = new THREE.BoxGeometry(12, 6, 12);
        const controlMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const controlRoom = new THREE.Mesh(controlGeometry, controlMaterial);
        controlRoom.position.y = 48;
        towerGroup.add(controlRoom);
        
        // Windows
        const windowGeometry = new THREE.BoxGeometry(10, 4, 0.2);
        const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.7 });
        
        for (let i = 0; i < 4; i++) {
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.y = 48;
            window.position.x = i < 2 ? (i === 0 ? 6 : -6) : 0;
            window.position.z = i >= 2 ? (i === 2 ? 6 : -6) : 0;
            if (i >= 2) window.rotation.y = Math.PI / 2;
            towerGroup.add(window);
        }
        
        towerGroup.position.set(x, y, z);
        this.scene.add(towerGroup);
        this.buildings.push(towerGroup);
    }
    
    createTerminal(x, y, z) {
        const terminalGroup = new THREE.Group();
        
        const terminalGeometry = new THREE.BoxGeometry(80, 8, 25);
        const terminalMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
        terminal.position.y = 4;
        terminalGroup.add(terminal);
        
        // Glass front
        const glassGeometry = new THREE.BoxGeometry(75, 6, 0.5);
        const glassMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4488ff, 
            transparent: true, 
            opacity: 0.6 
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.set(0, 4, 12.75);
        terminalGroup.add(glass);
        
        terminalGroup.position.set(x, y, z);
        this.scene.add(terminalGroup);
        this.buildings.push(terminalGroup);
    }
    
    createFuelTank(x, y, z, color) {
        const tankGeometry = new THREE.CylinderGeometry(8, 8, 15, 16);
        const tankMaterial = new THREE.MeshLambertMaterial({ color: color });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(x, y + 7.5, z);
        this.scene.add(tank);
        this.buildings.push(tank);
    }
    
    createRunwayLights() {
        // Edge lights for main runway
        const lightGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
        const lightMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        
        for (let i = -95; i <= 95; i += 10) {
            // Left side
            const light1 = new THREE.Mesh(lightGeometry, lightMaterial);
            light1.position.set(i, 1, -12);
            this.scene.add(light1);
            this.lights.push(light1);
            
            // Right side
            const light2 = new THREE.Mesh(lightGeometry, lightMaterial);
            light2.position.set(i, 1, 12);
            this.scene.add(light2);
            this.lights.push(light2);
        }
    }
    
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1000, 1000, 500);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point lights around airbase
        for (let i = 0; i < 10; i++) {
            const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
            pointLight.position.set(
                (Math.random() - 0.5) * 400,
                20,
                (Math.random() - 0.5) * 400
            );
            this.scene.add(pointLight);
        }
    }
    
    createSky() {
        const skyGeometry = new THREE.SphereGeometry(8000, 32, 16);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    createMountains() {
        for (let i = 0; i < 20; i++) {
            const mountainGeometry = new THREE.ConeGeometry(
                Math.random() * 200 + 100,
                Math.random() * 300 + 200,
                8
            );
            const mountainMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.1, 0.3, Math.random() * 0.3 + 0.3)
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            const angle = (i / 20) * Math.PI * 2;
            const distance = 3000 + Math.random() * 2000;
            mountain.position.set(
                Math.cos(angle) * distance,
                -50,
                Math.sin(angle) * distance
            );
            
            this.scene.add(mountain);
        }
    }
    
    getGroundHeight(x, z) {
        // Simple ground height calculation
        return Math.sin(x * 0.01) * Math.cos(z * 0.01) * 20 + 
               Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5 - 5;
    }
}