// Main game class
class FlightSimulator {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Game components
        this.controls = null;
        this.world = null;
        this.player = null;
        this.aircraft = [];
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Initialize the game
        this.init();
    }
    
    init() {
        console.log('Initializing Flight Simulator...');
        
        // Create Three.js scene
        this.createScene();
        
        // Create game components
        this.createComponents();
        
        // Create aircraft
        this.createAircraft();
        
        // Start the game loop
        this.start();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 1000);
    }
    
    createScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 1000, 8000);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            10000 // Far plane
        );
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add to DOM
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createComponents() {
        // Controls
        this.controls = new Controls();
        
        // World
        this.world = new World(this.scene);
        
        // Player
        this.player = new Player(this.scene, this.camera, this.world);
    }
    
    createAircraft() {
        // Create different types of aircraft around the airbase
        const aircraftData = [
            { type: 'fighter', position: new THREE.Vector3(-60, 2, -20) },
            { type: 'fighter', position: new THREE.Vector3(-60, 2, 0) },
            { type: 'cargo', position: new THREE.Vector3(-40, 2, -40) },
            { type: 'cargo', position: new THREE.Vector3(-40, 2, 20) },
            { type: 'helicopter', position: new THREE.Vector3(-20, 2, -60) },
            { type: 'helicopter', position: new THREE.Vector3(-20, 2, 60) },
            
            // Additional aircraft at different locations
            { type: 'fighter', position: new THREE.Vector3(30, 2, -30) },
            { type: 'cargo', position: new THREE.Vector3(50, 2, 40) },
            { type: 'helicopter', position: new THREE.Vector3(20, 2, -50) },
        ];
        
        aircraftData.forEach(data => {
            const aircraft = new Aircraft(data.type, data.position);
            this.aircraft.push(aircraft);
            this.scene.add(aircraft.mesh);
        });
        
        console.log(`Created ${this.aircraft.length} aircraft`);
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Limit delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 1/30); // Max 30 FPS minimum
        
        // Update game components
        this.update();
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update player
        this.player.update(this.deltaTime, this.controls, this.aircraft);
        
        // Update aircraft
        this.aircraft.forEach(aircraft => {
            if (aircraft !== this.player.currentAircraft) {
                // Update non-player aircraft (idle state)
                aircraft.update(this.deltaTime, { pitch: 0, yaw: 0, roll: 0, throttle: 0 });
            }
        });
        
        // Update world elements (if needed)
        this.updateWorldElements();
    }
    
    updateWorldElements() {
        // Animate runway lights
        const time = performance.now() * 0.001;
        this.world.lights.forEach((light, index) => {
            if (light.material) {
                light.material.emissive.setHSL(0.15, 1, 0.5 + 0.5 * Math.sin(time * 2 + index * 0.1));
            }
        });
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Global functions for UI
function closeAircraftSelection() {
    if (window.game && window.game.player) {
        window.game.player.closeAircraftSelection();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting Flight Simulator...');
    window.game = new FlightSimulator();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.game) {
        if (document.hidden) {
            window.game.stop();
        } else {
            window.game.start();
        }
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Game Error:', event.error);
});

console.log('Flight Simulator scripts loaded successfully!');