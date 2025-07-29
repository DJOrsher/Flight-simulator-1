class Aircraft {
    constructor(type, position) {
        this.type = type;
        this.position = position.clone();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0; // knots
        this.throttle = 0; // 0 to 1
        this.isFlying = false;
        
        // Aircraft-specific properties
        this.setAircraftProperties(type);
        
        // Create 3D model
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        
        // Physics
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        this.forces = new THREE.Vector3(0, 0, 0);
    }
    
    setAircraftProperties(type) {
        switch (type) {
            case 'fighter':
                this.maxSpeed = 600; // knots
                this.maxThrust = 25000; // lbs
                this.weight = 19000; // lbs
                this.wingArea = 300; // sq ft
                this.color = 0x4444ff;
                this.size = { length: 20, width: 15, height: 6 };  // Made larger
                break;
            case 'cargo':
                this.maxSpeed = 350;
                this.maxThrust = 17000;
                this.weight = 75000;
                this.wingArea = 1745;
                this.color = 0x666666;
                this.size = { length: 40, width: 50, height: 12 };  // Made larger
                break;
            case 'helicopter':
                this.maxSpeed = 150;
                this.maxThrust = 5000;
                this.weight = 11000;
                this.wingArea = 0; // No wings
                this.color = 0x228833;
                this.size = { length: 20, width: 18, height: 8 };  // Made larger
                this.canHover = true;
                break;
            default:
                this.maxSpeed = 400;
                this.maxThrust = 15000;
                this.weight = 30000;
                this.wingArea = 500;
                this.color = 0x888888;
                this.size = { length: 25, width: 25, height: 8 };  // Made larger
        }
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Create more realistic materials
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 100,
            specular: 0x444444
        });
        const glassMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444488,
            transparent: true,
            opacity: 0.7,
            shininess: 100
        });
        const metalMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 200,
            specular: 0x666666
        });
        
        if (this.type === 'helicopter') {
            // Main fuselage - more rounded using CylinderGeometry
            const fuselageGeometry = new THREE.CylinderGeometry(
                this.size.width * 0.15,
                this.size.width * 0.15,
                this.size.length * 0.7,
                16
            );
            const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
            fuselage.rotation.z = Math.PI / 2;
            group.add(fuselage);
            
            // Cockpit bubble
            const cockpitGeometry = new THREE.SphereGeometry(this.size.width * 0.12, 16, 8);
            const cockpit = new THREE.Mesh(cockpitGeometry, glassMaterial);
            cockpit.position.set(-this.size.length * 0.25, this.size.height * 0.1, 0);
            cockpit.scale.set(1.2, 0.8, 1);
            group.add(cockpit);
            
            // Tail boom
            const tailGeometry = new THREE.CylinderGeometry(
                this.size.width * 0.05,
                this.size.width * 0.08,
                this.size.length * 0.6,
                12
            );
            const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
            tail.position.set(this.size.length * 0.35, 0, 0);
            tail.rotation.z = Math.PI / 2;
            group.add(tail);
            
            // Main rotor mast
            const mastGeometry = new THREE.CylinderGeometry(0.5, 0.8, this.size.height * 0.4, 8);
            const mast = new THREE.Mesh(mastGeometry, metalMaterial);
            mast.position.y = this.size.height * 0.4;
            group.add(mast);
            
            // Main rotor blades (4 blades)
            const rotorGroup = new THREE.Group();
            for (let i = 0; i < 4; i++) {
                const bladeGeometry = new THREE.BoxGeometry(
                    this.size.width * 0.8, 0.2, 1.5
                );
                const blade = new THREE.Mesh(bladeGeometry, metalMaterial);
                blade.position.x = (this.size.width * 0.4) * Math.cos(i * Math.PI / 2);
                blade.position.z = (this.size.width * 0.4) * Math.sin(i * Math.PI / 2);
                blade.rotation.y = i * Math.PI / 2;
                rotorGroup.add(blade);
            }
            rotorGroup.position.y = this.size.height * 0.7;
            group.add(rotorGroup);
            this.rotor = rotorGroup;
            
            // Tail rotor
            const tailRotorGroup = new THREE.Group();
            for (let i = 0; i < 4; i++) {
                const bladeGeometry = new THREE.BoxGeometry(0.3, this.size.height * 0.2, 0.3);
                const blade = new THREE.Mesh(bladeGeometry, metalMaterial);
                blade.position.y = (this.size.height * 0.1) * Math.cos(i * Math.PI / 2);
                blade.position.z = (this.size.height * 0.1) * Math.sin(i * Math.PI / 2);
                blade.rotation.x = i * Math.PI / 2;
                tailRotorGroup.add(blade);
            }
            tailRotorGroup.position.set(this.size.length * 0.5, this.size.height * 0.2, 0);
            group.add(tailRotorGroup);
            this.tailRotor = tailRotorGroup;
            
            // Landing skids
            const skidGeometry = new THREE.BoxGeometry(this.size.length * 0.8, 0.8, 2);
            for (let i = -1; i <= 1; i += 2) {
                const skid = new THREE.Mesh(skidGeometry, metalMaterial);
                skid.position.set(0, -this.size.height * 0.4, i * this.size.width * 0.25);
                group.add(skid);
            }
            
        } else {
            // AIRPLANE MODELS
            
            // Main fuselage - more aerodynamic shape
            const fuselageGeometry = new THREE.CylinderGeometry(
                this.size.width * 0.12,
                this.size.width * 0.08,
                this.size.length,
                16
            );
            const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
            fuselage.rotation.z = Math.PI / 2;
            group.add(fuselage);
            
            // Nose cone - more pointed
            const noseGeometry = new THREE.ConeGeometry(
                this.size.width * 0.12,
                this.size.length * 0.25,
                12
            );
            const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
            nose.position.x = -this.size.length * 0.62;
            nose.rotation.z = Math.PI / 2;
            group.add(nose);
            
            // Cockpit canopy
            const canopyGeometry = new THREE.SphereGeometry(this.size.width * 0.08, 12, 8);
            const canopy = new THREE.Mesh(canopyGeometry, glassMaterial);
            canopy.position.set(-this.size.length * 0.2, this.size.height * 0.15, 0);
            canopy.scale.set(2, 0.6, 1);
            group.add(canopy);
            
            // Main wings - swept design
            const wingGeometry = new THREE.BoxGeometry(
                this.size.length * 0.6, 
                this.size.height * 0.15, 
                this.size.width
            );
            const wings = new THREE.Mesh(wingGeometry, bodyMaterial);
            wings.position.set(this.size.length * 0.1, -this.size.height * 0.05, 0);
            
            // Add wing sweep for fighters
            if (this.type === 'fighter') {
                wings.rotation.y = Math.PI * 0.1;
            }
            group.add(wings);
            
            // Wing tips
            for (let i = -1; i <= 1; i += 2) {
                const tipGeometry = new THREE.BoxGeometry(
                    this.size.length * 0.15, 
                    this.size.height * 0.1, 
                    this.size.width * 0.08
                );
                const tip = new THREE.Mesh(tipGeometry, bodyMaterial);
                tip.position.set(this.size.length * 0.15, this.size.height * 0.05, i * this.size.width * 0.46);
                group.add(tip);
            }
            
            // Vertical stabilizer (tail fin) - taller and more realistic
            const tailGeometry = new THREE.BoxGeometry(
                this.size.length * 0.25, 
                this.size.height * 1.5, 
                this.size.width * 0.08
            );
            const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
            tail.position.set(this.size.length * 0.35, this.size.height * 0.4, 0);
            group.add(tail);
            
            // Horizontal stabilizers - swept
            const hTailGeometry = new THREE.BoxGeometry(
                this.size.length * 0.3, 
                this.size.height * 0.08, 
                this.size.width * 0.5
            );
            const hTail = new THREE.Mesh(hTailGeometry, bodyMaterial);
            hTail.position.set(this.size.length * 0.4, this.size.height * 0.05, 0);
            group.add(hTail);
            
            // Engine intakes (for fighters)
            if (this.type === 'fighter') {
                for (let i = -1; i <= 1; i += 2) {
                    const intakeGeometry = new THREE.CylinderGeometry(1.5, 2, 6, 12);
                    const intake = new THREE.Mesh(intakeGeometry, metalMaterial);
                    intake.position.set(this.size.length * 0.2, -this.size.height * 0.1, i * this.size.width * 0.15);
                    intake.rotation.z = Math.PI / 2;
                    group.add(intake);
                    
                    // Engine nozzles
                    const nozzleGeometry = new THREE.CylinderGeometry(1.2, 1.8, 4, 12);
                    const nozzle = new THREE.Mesh(nozzleGeometry, metalMaterial);
                    nozzle.position.set(this.size.length * 0.45, -this.size.height * 0.1, i * this.size.width * 0.15);
                    nozzle.rotation.z = Math.PI / 2;
                    group.add(nozzle);
                }
            }
            
            // Engine nacelles (for cargo planes)
            if (this.type === 'cargo') {
                for (let i = -1; i <= 1; i += 2) {
                    const engineGeometry = new THREE.CylinderGeometry(2.5, 2.5, 12, 16);
                    const engine = new THREE.Mesh(engineGeometry, metalMaterial);
                    engine.position.set(this.size.length * 0.05, -this.size.height * 0.4, i * this.size.width * 0.35);
                    engine.rotation.z = Math.PI / 2;
                    group.add(engine);
                    
                    // Propellers
                    const propGroup = new THREE.Group();
                    for (let j = 0; j < 4; j++) {
                        const bladeGeometry = new THREE.BoxGeometry(0.5, 0.1, 4);
                        const blade = new THREE.Mesh(bladeGeometry, metalMaterial);
                        blade.position.z = 2 * Math.cos(j * Math.PI / 2);
                        blade.position.y = 2 * Math.sin(j * Math.PI / 2);
                        blade.rotation.x = j * Math.PI / 2;
                        propGroup.add(blade);
                    }
                    propGroup.position.set(-this.size.length * 0.15, -this.size.height * 0.4, i * this.size.width * 0.35);
                    group.add(propGroup);
                    if (!this.propellers) this.propellers = [];
                    this.propellers.push(propGroup);
                }
            }
            
            // Landing gear
            const gearGeometry = new THREE.CylinderGeometry(1, 1, 4, 8);
            
            // Main landing gear
            for (let i = -1; i <= 1; i += 2) {
                const gear = new THREE.Mesh(gearGeometry, metalMaterial);
                gear.position.set(this.size.length * 0.1, -this.size.height * 0.6, i * this.size.width * 0.3);
                group.add(gear);
                
                // Wheels
                const wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 12);
                const wheel = new THREE.Mesh(wheelGeometry, metalMaterial);
                wheel.position.set(this.size.length * 0.1, -this.size.height * 0.8, i * this.size.width * 0.3);
                wheel.rotation.x = Math.PI / 2;
                group.add(wheel);
            }
            
            // Nose gear
            const noseGear = new THREE.Mesh(gearGeometry, metalMaterial);
            noseGear.position.set(-this.size.length * 0.25, -this.size.height * 0.6, 0);
            group.add(noseGear);
            
            const noseWheel = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 12);
            const noseWheelMesh = new THREE.Mesh(noseWheel, metalMaterial);
            noseWheelMesh.position.set(-this.size.length * 0.25, -this.size.height * 0.8, 0);
            noseWheelMesh.rotation.x = Math.PI / 2;
            group.add(noseWheelMesh);
        }
        
        // Add navigation lights
        const redLightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const redLight = new THREE.Mesh(redLightGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        redLight.position.set(0, 0, -this.size.width * 0.5);
        group.add(redLight);
        
        const greenLightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const greenLight = new THREE.Mesh(greenLightGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        greenLight.position.set(0, 0, this.size.width * 0.5);
        group.add(greenLight);
        
        return group;
    }
    
    update(deltaTime, flightInput) {
        if (!this.isFlying) return;
        
        // Update throttle with improved responsiveness
        const throttleRate = 0.8; // Increased throttle response rate
        this.throttle = Math.max(0, Math.min(1, this.throttle + flightInput.throttle * deltaTime * throttleRate));
        
        // Calculate thrust based on throttle
        const thrust = this.maxThrust * this.throttle;
        
        // Apply flight physics based on aircraft type
        if (this.type === 'helicopter') {
            this.updateHelicopterPhysics(deltaTime, flightInput, thrust);
        } else {
            this.updateAirplanePhysics(deltaTime, flightInput, thrust);
        }
        
        // Update position with velocity - this is crucial for movement!
        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(deltaPosition);
        
        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Update speed in knots for display
        this.speed = this.velocity.length() * 1.94384; // m/s to knots
        
        // Animate helicopter rotors
        if (this.type === 'helicopter') {
            if (this.rotor) {
                this.rotor.rotation.y += deltaTime * 20 * (0.5 + this.throttle);
            }
            if (this.tailRotor) {
                this.tailRotor.rotation.x += deltaTime * 30 * (0.5 + this.throttle);
            }
        }
        
        // Animate propellers for cargo planes
        if (this.type === 'cargo' && this.propellers) {
            this.propellers.forEach(prop => {
                prop.rotation.x += deltaTime * 15 * (0.5 + this.throttle);
            });
        }
        
        // Ground collision detection and handling
        // Note: This could be enhanced with world reference if needed
        if (this.position.y < 5) { // Basic ground level check
            if (this.velocity.y < 0) { // Only if moving downward
                this.position.y = 5; // Set to ground level
                this.velocity.y = Math.max(0, this.velocity.y * 0.5); // Reduce downward velocity
                
                // If speed is very low, consider landing
                if (this.velocity.length() < 5) {
                    console.log(`${this.type} aircraft has landed`);
                }
            }
        }
    }
    
    updateAirplanePhysics(deltaTime, flightInput, thrust) {
        // Use consistent coordinate system: aircraft nose points in negative Z direction when rotation.y = 0
        // This aligns with Three.js camera forward direction (-Z)
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(this.rotation);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyEuler(this.rotation);
        
        // Calculate thrust force with proper scaling
        const thrustNewtons = thrust * 4.448; // lbs to Newtons conversion
        const mass = this.weight * 0.453592; // lbs to kg conversion
        
        // Thrust force in forward direction - significantly increased effectiveness
        const thrustAcceleration = thrustNewtons / mass;
        const thrustForce = forward.clone().multiplyScalar(thrustAcceleration * 3.0);
        
        // Gravity - standard Earth gravity
        const gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Lift calculation - based on airspeed and angle of attack
        const airspeed = this.velocity.length();
        const minFlyingSpeed = 10; // Reduced minimum flying speed
        let liftForce = new THREE.Vector3(0, 0, 0);
        
        if (airspeed > minFlyingSpeed) {
            // Calculate angle of attack between velocity and forward direction
            const velocityDirection = this.velocity.clone().normalize();
            const dot = forward.dot(velocityDirection);
            const angleOfAttack = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            // Lift coefficient based on angle of attack and airspeed
            const liftCoeff = Math.sin(angleOfAttack * 1.5) * Math.min(airspeed / 25, 3);
            
            // Lift force perpendicular to velocity direction, in aircraft up direction
            const liftMagnitude = liftCoeff * 15 * (this.wingArea / 300); // Reduced lift to prevent excessive climbing
            liftForce = up.clone().multiplyScalar(liftMagnitude);
        }
        
        // Drag force opposing velocity - air resistance
        const airspeedSquared = airspeed * airspeed;
        const dragCoeff = 0.008; // Reduced drag coefficient
        const dragForce = this.velocity.clone().multiplyScalar(-dragCoeff * airspeedSquared * 0.01);
        
        // Combine all forces
        this.forces = new THREE.Vector3()
            .add(thrustForce)
            .add(gravity)
            .add(liftForce)
            .add(dragForce);
        
        // Debug logging for physics tuning
        if (Math.random() < 0.01) {
            console.log('Airplane Physics Debug:', {
                thrust: thrust,
                thrustForce: thrustForce.length(),
                airspeed: airspeed,
                liftForce: liftForce.y,
                gravityForce: gravity.y,
                netVerticalForce: thrustForce.y + gravity.y + liftForce.y,
                velocity: this.velocity.length(),
                position: { x: this.position.x, y: this.position.y, z: this.position.z },
                throttle: this.throttle,
                totalForce: this.forces.length()
            });
        }
        
        // Update velocity with improved integration
        this.velocity.add(this.forces.clone().multiplyScalar(deltaTime));
        
        // Apply control inputs using the helper method
        this.applyControlInputs(deltaTime, flightInput);
    }
    
    updateHelicopterPhysics(deltaTime, flightInput, thrust) {
        // Use consistent coordinate system: nose points in negative Z direction when rotation.y = 0
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(this.rotation);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyEuler(this.rotation);
        
        // Helicopter physics with specialized hover capability
        const thrustNewtons = thrust * 4.448; // lbs to Newtons conversion
        const mass = this.weight * 0.453592; // lbs to kg conversion
        
        // Vertical thrust (main rotor lift) - primary force for helicopters
        const rotorLiftAcceleration = thrustNewtons / mass;
        const verticalThrust = new THREE.Vector3(0, 1, 0).multiplyScalar(rotorLiftAcceleration * 1.1);
        
        // Gravity - standard Earth gravity
        const gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Cyclic control simulation - tilting the rotor disc for movement
        const cyclicForce = new THREE.Vector3();
        
        // Forward/backward movement (pitch input controls forward/backward tilt)
        cyclicForce.add(forward.clone().multiplyScalar(-flightInput.pitch * 20));
        
        // Left/right movement (yaw input controls left/right tilt for helicopters)
        cyclicForce.add(right.clone().multiplyScalar(flightInput.yaw * 20));
        
        // Drag (air resistance) - helicopters have significant drag
        const airspeed = this.velocity.length();
        const dragCoeff = 0.4; // Higher drag for helicopters
        const dragForce = this.velocity.clone().multiplyScalar(-dragCoeff * airspeed * 0.02);
        
        // Combine all forces
        this.forces = new THREE.Vector3()
            .add(verticalThrust)
            .add(gravity)
            .add(cyclicForce)
            .add(dragForce);
        
        // Debug logging for helicopters
        if (Math.random() < 0.01) {
            console.log('Helicopter Physics Debug:', {
                thrust: thrust,
                verticalThrust: verticalThrust.y,
                gravity: gravity.y,
                netVerticalForce: verticalThrust.y + gravity.y,
                cyclicForce: cyclicForce.length(),
                velocity: this.velocity.length(),
                position: { x: this.position.x, y: this.position.y, z: this.position.z },
                throttle: this.throttle
            });
        }
        
        // Update velocity
        this.velocity.add(this.forces.clone().multiplyScalar(deltaTime));
        
        // Apply control inputs using the shared helper method
        this.applyControlInputs(deltaTime, flightInput);
    }
    
    startFlying() {
        this.isFlying = true;
        this.throttle = 0.6; // Start with higher initial power
        
        if (this.type !== 'helicopter') {
            // Give initial forward velocity for airplanes using consistent coordinate system
            // Forward is negative Z direction when rotation.y = 0
            const forward = new THREE.Vector3(0, 0, -40); // Forward velocity in -Z direction
            const upward = new THREE.Vector3(0, 3, 0); // Slight upward velocity for takeoff
            
            // Apply current aircraft rotation to the initial velocity
            forward.applyEuler(this.rotation);
            
            this.velocity.copy(forward).add(upward);
        } else {
            // Helicopters start with upward thrust for immediate hover capability
            this.velocity.set(0, 8, 0); // Vertical velocity for lift-off
        }
        console.log(`${this.type} aircraft started flying with throttle: ${this.throttle}, initial velocity:`, this.velocity);
    }
    
    stopFlying() {
        this.isFlying = false;
        this.throttle = 0;
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
    }
    
    getDistanceToPoint(point) {
        return this.position.distanceTo(point);
    }
    
    isNearPosition(position, distance = 10) {
        return this.getDistanceToPoint(position) < distance;
    }

    /**
     * Calculate aircraft forces based on current state and inputs
     * @param {number} deltaTime - Time since last update
     * @param {Object} flightInput - Flight control inputs
     * @param {number} thrust - Engine thrust in lbs
     * @returns {Object} Object containing all calculated forces
     */
    calculateForces(deltaTime, flightInput, thrust) {
        const forces = {
            thrust: new THREE.Vector3(0, 0, 0),
            gravity: new THREE.Vector3(0, -9.81, 0),
            lift: new THREE.Vector3(0, 0, 0),
            drag: new THREE.Vector3(0, 0, 0)
        };
        
        // Convert thrust to metric units
        const thrustNewtons = thrust * 4.448; // lbs to Newtons conversion
        const mass = this.weight * 0.453592; // lbs to kg conversion
        
        // Calculate thrust direction using consistent coordinate system (negative Z forward)
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        forces.thrust = forward.clone().multiplyScalar(thrustNewtons / mass * 3.0);
        
        // Calculate lift for airplanes
        if (this.type !== 'helicopter') {
            const airspeed = this.velocity.length();
            const minFlyingSpeed = 10;
            
            if (airspeed > minFlyingSpeed) {
                const velocityDirection = this.velocity.clone().normalize();
                const dot = forward.dot(velocityDirection);
                const angleOfAttack = Math.acos(Math.max(-1, Math.min(1, dot)));
                const liftCoeff = Math.sin(angleOfAttack * 1.5) * Math.min(airspeed / 25, 3);
                
                const up = new THREE.Vector3(0, 1, 0);
                up.applyEuler(this.rotation);
                forces.lift = up.multiplyScalar(liftCoeff * 15 * (this.wingArea / 300));
            }
        }
        
        // Calculate drag
        const airspeed = this.velocity.length();
        const dragCoeff = this.type === 'helicopter' ? 0.4 : 0.008;
        const dragMultiplier = this.type === 'helicopter' ? 0.02 : 0.01;
        forces.drag = this.velocity.clone().multiplyScalar(-dragCoeff * airspeed * dragMultiplier);
        
        return forces;
    }
    
    /**
     * Apply control inputs to aircraft rotation
     * @param {number} deltaTime - Time since last update
     * @param {Object} flightInput - Flight control inputs
     */
    applyControlInputs(deltaTime, flightInput) {
        const rollRate = this.type === 'helicopter' ? 0.6 : 1.2;
        const pitchRate = this.type === 'helicopter' ? 0.6 : 0.8;
        const yawRate = this.type === 'helicopter' ? 0.8 : 0.6;
        
        // Apply rotations with correct mapping
        // Roll: positive input = roll right (positive Z rotation)
        this.rotation.z += flightInput.roll * deltaTime * rollRate;
        
        // Pitch: negative input = nose up (negative X rotation)
        this.rotation.x += flightInput.pitch * deltaTime * pitchRate;
        
        // Yaw: positive input = nose right (positive Y rotation)
        this.rotation.y += flightInput.yaw * deltaTime * yawRate;
        
        // Apply rotation limits based on aircraft type
        if (this.type === 'helicopter') {
            this.rotation.x = Math.max(-Math.PI/8, Math.min(Math.PI/8, this.rotation.x));
            this.rotation.z = Math.max(-Math.PI/8, Math.min(Math.PI/8, this.rotation.z));
        } else {
            this.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this.rotation.x));
            this.rotation.z = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.rotation.z));
        }
        
        // Auto-stabilization
        this.applyAutoStabilization(flightInput);
    }
    
    /**
     * Apply auto-stabilization when no input is given
     * @param {Object} flightInput - Flight control inputs
     */
    applyAutoStabilization(flightInput) {
        const airspeed = this.velocity.length();
        const minFlyingSpeed = 15;
        
        if (Math.abs(flightInput.roll) < 0.1) {
            this.rotation.z *= this.type === 'helicopter' ? 0.9 : 0.92;
        }
        
        if (Math.abs(flightInput.pitch) < 0.1) {
            const dampingFactor = (this.type === 'helicopter' || airspeed <= minFlyingSpeed) ? 0.9 : 0.95;
            this.rotation.x *= dampingFactor;
        }
        
        // Banking turns for airplanes
        if (this.type !== 'helicopter' && Math.abs(this.rotation.z) > 0.1) {
            this.rotation.y += this.rotation.z * 0.016 * 0.3; // Assuming ~60fps
        }
    }
}