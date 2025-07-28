class Controls {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
        this.isPointerLocked = false;
        this.sensitivity = 0.001;  // Reduced mouse sensitivity
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Prevent default for game controls
            const gameCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyE', 'Escape', 'KeyQ', 'KeyZ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (gameCodes.includes(event.code)) {
                event.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Mouse events
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                this.mouse.deltaX = event.movementX || 0;
                this.mouse.deltaY = event.movementY || 0;
            }
        });
        
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.requestPointerLock();
            }
        });
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
        });
    }
    
    /**
     * Request pointer lock for mouse look functionality
     */
    requestPointerLock() {
        document.body.requestPointerLock();
    }
    
    /**
     * Release pointer lock
     */
    releasePointerLock() {
        document.exitPointerLock();
    }
    
    /**
     * Check if a specific key is currently pressed
     * @param {string} keyCode - The key code to check
     * @returns {boolean} True if the key is pressed
     */
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    /**
     * Get mouse movement delta and reset it
     * @returns {Object} Mouse delta with x and y properties
     */
    getMouseDelta() {
        const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }
    
    /**
     * Get walking movement input from WASD keys
     * @returns {Object} Walking input with x and z properties
     */
    getWalkingInput() {
        const input = { x: 0, z: 0 };
        
        // Forward/backward movement (Z axis)
        if (this.isKeyPressed('KeyW')) input.z -= 1;  // W moves forward (negative Z in Three.js)
        if (this.isKeyPressed('KeyS')) input.z += 1;  // S moves backward (positive Z in Three.js)
        
        // Left/right movement (X axis)
        if (this.isKeyPressed('KeyA')) input.x -= 1;  // A moves left (negative X)
        if (this.isKeyPressed('KeyD')) input.x += 1;  // D moves right (positive X)
        
        return input;
    }
    
    /**
     * Get flight control input for aircraft
     * @returns {Object} Flight input with pitch, yaw, roll, and throttle
     */
    getFlightInput() {
        const input = {
            pitch: 0,   // Elevator control
            yaw: 0,     // Rudder control  
            roll: 0,    // Aileron control
            throttle: 0 // Engine throttle
        };
        
        // Pitch (elevator) - Controls nose up/down
        // W pulls stick back (nose up, negative pitch)
        // S pushes stick forward (nose down, positive pitch)
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) input.pitch = -1;
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) input.pitch = 1;
        
        // Yaw (rudder) - Controls nose left/right
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) input.yaw = -1;
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) input.yaw = 1;
        
        // Roll (ailerons) - Controls bank left/right
        if (this.isKeyPressed('KeyQ')) input.roll = -1;  // Roll left
        if (this.isKeyPressed('KeyZ')) input.roll = 1;   // Roll right
        
        // Throttle control
        if (this.isKeyPressed('Space')) input.throttle = 1;      // Increase throttle
        if (this.isKeyPressed('ShiftLeft')) input.throttle = -1; // Decrease throttle
        
        return input;
    }
    
    /**
     * Check if interact key (E) is pressed
     * @returns {boolean} True if interact key is pressed
     */
    isInteractPressed() {
        return this.isKeyPressed('KeyE');
    }
    
    /**
     * Check if exit/escape key is pressed
     * @returns {boolean} True if escape key is pressed  
     */
    isExitPressed() {
        return this.isKeyPressed('Escape');
    }
}