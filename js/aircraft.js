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
            // Main fuselage - more rounded
            const fuselageGeometry = new THREE.CapsuleGeometry(
                this.size.width * 0.15,
                this.size.length * 0.7,
                8, 16
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
        
        // Update throttle
        this.throttle = Math.max(0, Math.min(1, this.throttle + flightInput.throttle * deltaTime * 0.5));
        
        // Calculate thrust
        const thrust = this.maxThrust * this.throttle;
        
        // Apply flight physics based on aircraft type
        if (this.type === 'helicopter') {
            this.updateHelicopterPhysics(deltaTime, flightInput, thrust);
        } else {
            this.updateAirplanePhysics(deltaTime, flightInput, thrust);
        }
        
        // Update position and rotation
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // Update speed in knots
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
    }
    
    updateAirplanePhysics(deltaTime, flightInput, thrust) {
        // Forward direction based on aircraft rotation
        const forward = new THREE.Vector3(-1, 0, 0); // Forward is negative X
        forward.applyEuler(this.rotation);
        
        // Thrust force - much stronger for better flight performance
        const thrustForce = forward.clone().multiplyScalar(thrust / this.weight * 8);
        
        // Gravity
        const gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Lift - improved physics model
        const airspeed = this.velocity.length();
        const minFlyingSpeed = 25; // Minimum speed for lift
        
        if (airspeed > minFlyingSpeed) {
            // Calculate angle of attack effect
            const velocityDirection = this.velocity.clone().normalize();
            const dot = forward.dot(velocityDirection);
            const angleOfAttack = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            // Lift coefficient based on angle of attack and airspeed
            const liftCoeff = Math.sin(angleOfAttack * 2) * Math.min(airspeed / 50, 3);
            
            // Lift direction (perpendicular to forward direction and velocity)
            const up = new THREE.Vector3(0, 1, 0);
            up.applyEuler(this.rotation);
            const lift = up.multiplyScalar(liftCoeff * 25 * (this.wingArea / 500));
            
            this.forces = thrustForce.clone().add(gravity).add(lift);
        } else {
            // Below flying speed - mostly gravity and thrust
            this.forces = thrustForce.clone().add(gravity);
        }
        
        // Drag - air resistance
        const dragCoeff = 0.02;
        const drag = this.velocity.clone().multiplyScalar(-dragCoeff * airspeed * 0.01);
        this.forces.add(drag);
        
        // Update velocity
        this.velocity.add(this.forces.clone().multiplyScalar(deltaTime));
        
        // Apply control inputs to rotation - more realistic flight controls
        const rollRate = 1.2;
        const pitchRate = 0.8;
        const yawRate = 0.6;
        
        this.rotation.z += flightInput.roll * deltaTime * rollRate;
        this.rotation.x += flightInput.pitch * deltaTime * pitchRate;
        this.rotation.y += flightInput.yaw * deltaTime * yawRate;
        
        // Limit rotation angles for stability
        this.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, this.rotation.x));
        this.rotation.z = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.rotation.z));
        
        // Auto-stabilization when no input (realistic aircraft behavior)
        if (Math.abs(flightInput.roll) < 0.1) {
            this.rotation.z *= 0.92; // Auto-level roll
        }
        if (Math.abs(flightInput.pitch) < 0.1 && airspeed > minFlyingSpeed) {
            this.rotation.x *= 0.95; // Auto-level pitch when flying
        }
        
        // Banking turns - when rolling, add yaw for realistic turns
        if (Math.abs(this.rotation.z) > 0.1) {
            this.rotation.y += this.rotation.z * deltaTime * 0.3;
        }
    }
    
    updateHelicopterPhysics(deltaTime, flightInput, thrust) {
        // Hover capability (improved thrust model)
        const hoverThrust = new THREE.Vector3(0, thrust / this.weight * 1.5, 0);
        
        // Gravity
        const gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Movement based on tilt (more intuitive)
        const tiltForward = new THREE.Vector3(0, 0, -1);
        const tiltRight = new THREE.Vector3(1, 0, 0);
        tiltForward.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        tiltRight.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        
        const movement = new THREE.Vector3();
        movement.add(tiltForward.clone().multiplyScalar(-flightInput.pitch * 10));
        movement.add(tiltRight.clone().multiplyScalar(flightInput.yaw * 10));
        
        // Drag (air resistance)
        const drag = this.velocity.clone().multiplyScalar(-0.2);
        
        // Total force
        this.forces = hoverThrust.clone().add(gravity).add(movement).add(drag);
        
        // Update velocity
        this.velocity.add(this.forces.clone().multiplyScalar(deltaTime));
        
        // Apply control inputs to rotation (helicopter-style controls)
        this.rotation.x += flightInput.pitch * deltaTime * 0.6;
        this.rotation.y += flightInput.yaw * deltaTime * 0.8;
        this.rotation.z += flightInput.roll * deltaTime * 0.6;
        
        // Limit rotation angles for helicopter stability
        this.rotation.x = Math.max(-Math.PI/8, Math.min(Math.PI/8, this.rotation.x));
        this.rotation.z = Math.max(-Math.PI/8, Math.min(Math.PI/8, this.rotation.z));
        
        // Auto-stabilization when no input
        if (Math.abs(flightInput.pitch) < 0.1) {
            this.rotation.x *= 0.9;
        }
        if (Math.abs(flightInput.roll) < 0.1) {
            this.rotation.z *= 0.9;
        }
    }
    
    startFlying() {
        this.isFlying = true;
        this.throttle = 0.5; // Start with decent power
        
        if (this.type !== 'helicopter') {
            // Give initial forward velocity for airplanes (in correct direction)
            const forward = new THREE.Vector3(-30, 2, 0); // Forward with slight climb
            forward.applyEuler(this.rotation);
            this.velocity.copy(forward);
        } else {
            // Helicopters start with slight upward thrust
            this.velocity.set(0, 5, 0);
        }
        console.log(`${this.type} aircraft started flying`);
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
}