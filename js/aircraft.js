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
        
        // Fuselage (main body)
        const fuselageGeometry = new THREE.BoxGeometry(
            this.size.length, 
            this.size.height, 
            this.size.width * 0.4
        );
        const fuselageMaterial = new THREE.MeshLambertMaterial({ color: this.color });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        group.add(fuselage);
        
        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(
            this.size.width * 0.15,
            this.size.length * 0.3,
            8
        );
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.position.x = -this.size.length * 0.65;
        nose.rotation.z = Math.PI / 2;
        group.add(nose);
        
        // Wings (if not helicopter)
        if (this.type !== 'helicopter') {
            const wingGeometry = new THREE.BoxGeometry(
                this.size.length * 0.7, 
                this.size.height * 0.3, 
                this.size.width
            );
            const wingMaterial = new THREE.MeshLambertMaterial({ color: this.color });
            const wings = new THREE.Mesh(wingGeometry, wingMaterial);
            wings.position.y = -this.size.height * 0.15;
            group.add(wings);
            
            // Vertical stabilizer (tail fin)
            const tailGeometry = new THREE.BoxGeometry(
                this.size.length * 0.3, 
                this.size.height * 1.2, 
                this.size.width * 0.15
            );
            const tail = new THREE.Mesh(tailGeometry, wingMaterial);
            tail.position.x = this.size.length * 0.4;
            tail.position.y = this.size.height * 0.3;
            group.add(tail);
            
            // Horizontal stabilizer
            const hTailGeometry = new THREE.BoxGeometry(
                this.size.length * 0.25, 
                this.size.height * 0.1, 
                this.size.width * 0.6
            );
            const hTail = new THREE.Mesh(hTailGeometry, wingMaterial);
            hTail.position.x = this.size.length * 0.45;
            hTail.position.y = this.size.height * 0.1;
            group.add(hTail);
            
            // Engine nacelles (for larger aircraft)
            if (this.type === 'cargo') {
                for (let i = -1; i <= 1; i += 2) {
                    const engineGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8);
                    const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
                    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
                    engine.position.set(-2, -3, i * this.size.width * 0.3);
                    engine.rotation.z = Math.PI / 2;
                    group.add(engine);
                }
            }
        } else {
            // Helicopter main rotor
            const rotorGeometry = new THREE.BoxGeometry(
                this.size.width * 1.2, 
                0.3, 
                0.8
            );
            const rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
            rotor.position.y = this.size.height * 0.7;
            group.add(rotor);
            this.rotor = rotor;
            
            // Tail rotor
            const tailRotorGeometry = new THREE.BoxGeometry(
                0.3,
                this.size.height * 0.4,
                0.3
            );
            const tailRotor = new THREE.Mesh(tailRotorGeometry, rotorMaterial);
            tailRotor.position.set(this.size.length * 0.45, this.size.height * 0.2, 0);
            group.add(tailRotor);
            this.tailRotor = tailRotor;
            
            // Landing skids
            const skidGeometry = new THREE.BoxGeometry(this.size.length * 0.8, 0.5, 2);
            for (let i = -1; i <= 1; i += 2) {
                const skid = new THREE.Mesh(skidGeometry, new THREE.MeshLambertMaterial({ color: 0x333333 }));
                skid.position.set(0, -this.size.height * 0.6, i * this.size.width * 0.3);
                group.add(skid);
            }
        }
        
        // Landing gear (for airplanes)
        if (this.type !== 'helicopter') {
            const gearGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3);
            const gearMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
            
            // Main landing gear
            for (let i = -1; i <= 1; i += 2) {
                const gear = new THREE.Mesh(gearGeometry, gearMaterial);
                gear.position.set(2, -this.size.height * 0.8, i * this.size.width * 0.25);
                group.add(gear);
            }
            
            // Nose gear
            const noseGear = new THREE.Mesh(gearGeometry, gearMaterial);
            noseGear.position.set(-this.size.length * 0.3, -this.size.height * 0.8, 0);
            group.add(noseGear);
        }
        
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
    }
    
    updateAirplanePhysics(deltaTime, flightInput, thrust) {
        // Forward direction based on aircraft rotation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        // Thrust force (adjusted for better control)
        const thrustForce = forward.clone().multiplyScalar(thrust / this.weight * 2);
        
        // Gravity
        const gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Lift (improved model)
        const airspeed = this.velocity.length();
        const liftCoeff = Math.min(airspeed / 50, 2); // More responsive lift
        const liftDirection = new THREE.Vector3(0, 1, 0);
        liftDirection.applyEuler(this.rotation);
        const lift = liftDirection.multiplyScalar(liftCoeff * 15);
        
        // Drag (improved)
        const dragCoeff = 0.015;
        const drag = this.velocity.clone().multiplyScalar(-dragCoeff);
        
        // Total force
        this.forces = thrustForce.clone().add(gravity).add(lift).add(drag);
        
        // Update velocity
        this.velocity.add(this.forces.clone().multiplyScalar(deltaTime));
        
        // Apply control inputs to rotation (more responsive)
        this.rotation.x += flightInput.pitch * deltaTime * 0.8;
        this.rotation.y += flightInput.yaw * deltaTime * 0.5;
        this.rotation.z += flightInput.roll * deltaTime * 0.8;
        
        // Limit rotation angles for stability
        this.rotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.rotation.x));
        this.rotation.z = Math.max(-Math.PI/4, Math.min(Math.PI/4, this.rotation.z));
        
        // Apply some automatic leveling for easier control
        if (Math.abs(flightInput.roll) < 0.1) {
            this.rotation.z *= 0.95; // Auto-level roll
        }
        if (Math.abs(flightInput.pitch) < 0.1) {
            this.rotation.x *= 0.98; // Auto-level pitch slightly
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
        this.throttle = 0.3; // Start with some power
        if (this.type !== 'helicopter') {
            // Give initial forward velocity for airplanes
            this.velocity.set(0, 0, -20);
        } else {
            // Helicopters start with slight upward thrust
            this.velocity.set(0, 2, 0);
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