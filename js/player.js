class Player {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        
        // Player state
        this.position = new THREE.Vector3(0, 2, 50);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = true;
        
        // Movement properties
        this.walkSpeed = 10;
        this.runSpeed = 20;
        this.jumpPower = 8;
        this.gravity = -25;
        
        // Camera properties
        this.mouseSensitivity = 0.001;  // Reduced mouse sensitivity
        this.cameraOffset = new THREE.Vector3(0, 1.7, 0); // Eye height
        
        // Aircraft interaction
        this.currentAircraft = null;
        this.isFlying = false;
        this.nearbyAircraftCache = null;
        this.lastInteractTime = 0;
        
        // Initialize camera position
        this.updateCameraPosition();
    }
    
    update(deltaTime, controls, aircraft) {
        this.aircraft = aircraft; // Store reference for UI updates
        
        if (this.isFlying && this.currentAircraft) {
            this.updateFlightMode(deltaTime, controls);
        } else {
            this.updateWalkingMode(deltaTime, controls);
            this.checkAircraftInteraction(controls, aircraft, deltaTime);
        }
        
        this.updateCameraPosition();
        this.updateUI();
    }
    
    updateWalkingMode(deltaTime, controls) {
        // Get input
        const walkInput = controls.getWalkingInput();
        const mouseDelta = controls.getMouseDelta();
        
        // Mouse look
        this.rotation.y -= mouseDelta.x * this.mouseSensitivity;
        this.rotation.x -= mouseDelta.y * this.mouseSensitivity;
        this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
        
        // Movement
        const isRunning = controls.isKeyPressed('ShiftLeft');
        const speed = isRunning ? this.runSpeed : this.walkSpeed;
        
        // Calculate movement direction based on camera rotation
        const forward = new THREE.Vector3(0, 0, -1);  // Forward is negative Z in Three.js
        const right = new THREE.Vector3(1, 0, 0);
        
        forward.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        right.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        
        // Apply input (note: walkInput.z is now correct with fixed controls)
        const movement = new THREE.Vector3();
        movement.add(forward.clone().multiplyScalar(-walkInput.z));  // Negate to match Three.js coordinate system
        movement.add(right.clone().multiplyScalar(walkInput.x));
        
        if (movement.length() > 0) {
            movement.normalize().multiplyScalar(speed);
            this.velocity.x = movement.x;
            this.velocity.z = movement.z;
        } else {
            this.velocity.x *= 0.9; // Friction
            this.velocity.z *= 0.9;
        }
        
        // Jumping
        if (controls.isKeyPressed('Space') && this.onGround) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
        }
        
        // Gravity
        if (!this.onGround) {
            this.velocity.y += this.gravity * deltaTime;
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision
        const groundHeight = this.world.getGroundHeight(this.position.x, this.position.z);
        if (this.position.y <= groundHeight + 1.8) { // Player height
            this.position.y = groundHeight + 1.8;
            this.velocity.y = 0;
            this.onGround = true;
        }
        
        // Boundary checks
        const maxDistance = 4000;
        this.position.x = Math.max(-maxDistance, Math.min(maxDistance, this.position.x));
        this.position.z = Math.max(-maxDistance, Math.min(maxDistance, this.position.z));
    }
    
    updateFlightMode(deltaTime, controls) {
        if (!this.currentAircraft) return;
        
        // Get flight input
        const flightInput = controls.getFlightInput();
        const mouseDelta = controls.getMouseDelta();
        
        // Mouse flight controls (reduced sensitivity)
        if (controls.isPointerLocked) {
            this.currentAircraft.rotation.y -= mouseDelta.x * this.mouseSensitivity * 0.3;
            this.currentAircraft.rotation.x -= mouseDelta.y * this.mouseSensitivity * 0.3;
            
            // Limit pitch angle for aircraft stability
            this.currentAircraft.rotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, this.currentAircraft.rotation.x));
        }
        
        // Update aircraft
        this.currentAircraft.update(deltaTime, flightInput);
        
        // Follow aircraft position and rotation
        this.position.copy(this.currentAircraft.position);
        this.rotation.copy(this.currentAircraft.rotation);
        
        // Check for exit aircraft
        if (controls.isExitPressed()) {
            this.exitAircraft();
        }
        
        // Auto-land if too close to ground
        const groundHeight = this.world.getGroundHeight(this.position.x, this.position.z);
        if (this.position.y < groundHeight + 5 && this.currentAircraft.velocity.y < 0) {
            this.autoLand();
        }
    }
    
    checkAircraftInteraction(controls, aircraft, deltaTime) {
        // Throttle aircraft checking to improve performance
        if (Date.now() - this.lastInteractTime < 100) return;
        this.lastInteractTime = Date.now();
        
        const nearbyAircraft = aircraft.filter(plane => 
            plane.getDistanceToPoint(this.position) < 15
        );
        
        this.nearbyAircraftCache = nearbyAircraft;
        
        if (controls.isInteractPressed() && nearbyAircraft.length > 0) {
            if (nearbyAircraft.length === 1) {
                this.enterAircraft(nearbyAircraft[0]);
            } else {
                this.showAircraftSelection(nearbyAircraft);
            }
        }
    }
    
    enterAircraft(aircraft) {
        this.currentAircraft = aircraft;
        this.isFlying = true;
        aircraft.startFlying();
        
        // Position player in aircraft
        this.position.copy(aircraft.position);
        this.rotation.copy(aircraft.rotation);
        
        console.log(`Entered ${aircraft.type} aircraft`);
    }
    
    exitAircraft() {
        if (!this.currentAircraft) return;
        
        // Stop aircraft
        this.currentAircraft.stopFlying();
        
        // Position player next to aircraft
        const exitPosition = this.currentAircraft.position.clone();
        exitPosition.x += 10; // Exit to the side
        exitPosition.y = this.world.getGroundHeight(exitPosition.x, exitPosition.z) + 1.8;
        
        this.position.copy(exitPosition);
        this.velocity.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.onGround = true;
        
        this.currentAircraft = null;
        this.isFlying = false;
        
        console.log('Exited aircraft');
    }
    
    autoLand() {
        if (!this.currentAircraft) return;
        
        // Gentle landing
        const groundHeight = this.world.getGroundHeight(this.position.x, this.position.z);
        this.currentAircraft.position.y = groundHeight + 3;
        this.currentAircraft.velocity.set(0, 0, 0);
        this.currentAircraft.rotation.set(0, this.currentAircraft.rotation.y, 0);
        
        console.log('Aircraft landed');
    }
    
    showAircraftSelection(nearbyAircraft) {
        const selection = document.getElementById('aircraft-selection');
        selection.style.display = 'block';
        
        // Clear existing options except cancel button
        const options = selection.querySelectorAll('.aircraft-option:not(:last-child)');
        options.forEach(option => option.remove());
        
        // Add options for nearby aircraft
        nearbyAircraft.forEach((aircraft, index) => {
            const button = document.createElement('button');
            button.className = 'aircraft-option';
            button.textContent = `${aircraft.type.toUpperCase()} (${Math.round(aircraft.getDistanceToPoint(this.position))}m away)`;
            button.onclick = () => {
                this.enterAircraft(aircraft);
                this.closeAircraftSelection();
            };
            selection.insertBefore(button, selection.lastElementChild);
        });
    }
    
    closeAircraftSelection() {
        document.getElementById('aircraft-selection').style.display = 'none';
    }
    
    updateCameraPosition() {
        if (this.isFlying && this.currentAircraft) {
            // Cockpit view with better positioning
            let cockpitOffset;
            if (this.currentAircraft.type === 'helicopter') {
                cockpitOffset = new THREE.Vector3(-3, 2, 0);  // Helicopter cockpit
            } else if (this.currentAircraft.type === 'cargo') {
                cockpitOffset = new THREE.Vector3(-15, 4, 0); // Cargo plane cockpit
            } else {
                cockpitOffset = new THREE.Vector3(-8, 2, 0);  // Fighter cockpit
            }
            
            cockpitOffset.applyEuler(this.currentAircraft.rotation);
            this.camera.position.copy(this.currentAircraft.position).add(cockpitOffset);
            this.camera.rotation.copy(this.currentAircraft.rotation);
        } else {
            // First person view
            const cameraPosition = this.position.clone().add(this.cameraOffset);
            this.camera.position.copy(cameraPosition);
            this.camera.rotation.copy(this.rotation);
        }
    }
    
    updateUI() {
        // Update HUD
        const modeElement = document.getElementById('mode');
        const positionElement = document.getElementById('position');
        const speedElement = document.getElementById('speed-indicator');
        const altitudeElement = document.getElementById('altitude-indicator');
        
        if (this.isFlying && this.currentAircraft) {
            modeElement.textContent = `Mode: Flying ${this.currentAircraft.type.toUpperCase()}`;
            speedElement.textContent = `Speed: ${Math.round(this.currentAircraft.speed)} kt`;
            altitudeElement.textContent = `Altitude: ${Math.round(this.position.y * 3.28084)} ft`;
        } else {
            modeElement.textContent = 'Mode: Walking';
            speedElement.textContent = `Speed: ${Math.round(this.velocity.length() * 1.94384)} kt`;
            altitudeElement.textContent = `Altitude: ${Math.round(this.position.y * 3.28084)} ft`;
            
            // Show nearby aircraft info
            if (this.nearbyAircraftCache && this.nearbyAircraftCache.length > 0) {
                const nearest = this.nearbyAircraftCache[0];
                const distance = Math.round(nearest.getDistanceToPoint(this.position));
                modeElement.textContent += ` | Press E to enter ${nearest.type.toUpperCase()} (${distance}m)`;
                
                // Highlight nearby aircraft
                this.nearbyAircraftCache.forEach(aircraft => {
                    aircraft.mesh.traverse((child) => {
                        if (child.material) {
                            child.material.emissive.setHex(0x002200);
                        }
                    });
                });
            } else {
                // Remove highlighting from all aircraft
                this.aircraft.forEach(aircraft => {
                    aircraft.mesh.traverse((child) => {
                        if (child.material) {
                            child.material.emissive.setHex(0x000000);
                        }
                    });
                });
            }
        }
        
        positionElement.textContent = `Position: (${Math.round(this.position.x)}, ${Math.round(this.position.y)}, ${Math.round(this.position.z)})`;
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getCamera() {
        return this.camera;
    }
}