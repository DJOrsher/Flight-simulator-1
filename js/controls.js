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
            const gameCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyE', 'Escape'];
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
    
    requestPointerLock() {
        document.body.requestPointerLock();
    }
    
    releasePointerLock() {
        document.exitPointerLock();
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    getMouseDelta() {
        const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }
    
    // Walking controls
    getWalkingInput() {
        const input = { x: 0, z: 0 };
        
        if (this.isKeyPressed('KeyW')) input.z -= 1;  // W moves forward (negative Z in Three.js)
        if (this.isKeyPressed('KeyS')) input.z += 1;  // S moves backward (positive Z in Three.js)
        if (this.isKeyPressed('KeyA')) input.x -= 1;
        if (this.isKeyPressed('KeyD')) input.x += 1;
        
        return input;
    }
    
    // Flying controls
    getFlightInput() {
        const input = {
            pitch: 0,
            yaw: 0,
            roll: 0,
            throttle: 0
        };
        
        // Pitch (elevator) - W pulls stick back (nose up), S pushes stick forward (nose down)
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) input.pitch = 1;
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) input.pitch = -1;
        
        // Yaw (rudder)
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) input.yaw = -1;
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) input.yaw = 1;
        
        // Roll (ailerons)
        if (this.isKeyPressed('KeyQ')) input.roll = -1;
        if (this.isKeyPressed('KeyZ')) input.roll = 1;  // Changed from E to Z
        
        // Throttle
        if (this.isKeyPressed('Space')) input.throttle = 1;
        if (this.isKeyPressed('ShiftLeft')) input.throttle = -1;
        
        return input;
    }
    
    isInteractPressed() {
        return this.isKeyPressed('KeyE');
    }
}