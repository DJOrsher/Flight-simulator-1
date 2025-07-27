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
                this.size = { length: 15, width: 10, height: 4 };
                break;
            case 'cargo':
                this.maxSpeed = 350;
                this.maxThrust = 17000;
                this.weight = 75000;
                this.wingArea = 1745;
                this.color = 0x666666;
                this.size = { length: 30, width: 40, height: 8 };
                break;
            case 'helicopter':
                this.maxSpeed = 150;
                this.maxThrust = 5000;
                this.weight = 11000;
                this.wingArea = 0; // No wings
                this.color = 0x228833;
                this.size = { length: 16, width: 14, height: 5 };
                this.canHover = true;
                break;
            default:
                this.maxSpeed = 400;
                this.maxThrust = 15000;
                this.weight = 30000;
                this.wingArea = 500;
                this.color = 0x888888;
                this.size = { length: 20, width: 20, height: 6 };
        }
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Fuselage
        const fuselageGeometry = new THREE.BoxGeometry(
            this.size.length, 
            this.size.height, 
            this.size.width * 0.3
        );
        const fuselageMaterial = new THREE.MeshLambertMaterial({ color: this.color });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        group.add(fuselage);
        
        // Wings (if not helicopter)
        if (this.type !== 'helicopter') {
            const wingGeometry = new THREE.BoxGeometry(
                this.size.length * 0.6, 
                this.size.height * 0.2, 
                this.size.width
            );
            const wingMaterial = new THREE.MeshLambertMaterial({ color: this.color });
            const wings = new THREE.Mesh(wingGeometry, wingMaterial);
            wings.position.y = -this.size.height * 0.2;
            group.add(wings);
            
            // Vertical stabilizer
            const tailGeometry = new THREE.BoxGeometry(
                this.size.length * 0.2, 
                this.size.height * 0.8, 
                this.size.width * 0.1
            );
            const tail = new THREE.Mesh(tailGeometry, wingMaterial);
            tail.position.x = this.size.length * 0.4;
            tail.position.y = this.size.height * 0.2;
            group.add(tail);
        } else {
            // Helicopter rotor
            const rotorGeometry = new THREE.BoxGeometry(
                this.size.width * 0.8, 
                0.2, 
                0.5
            );
            const rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
            rotor.position.y = this.size.height * 0.6;
            group.add(rotor);
            this.rotor = rotor;
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
        
        // Animate helicopter rotor
        if (this.type === 'helicopter' && this.rotor) {
            this.rotor.rotation.y += deltaTime * 20 * this.throttle;
        }
    }
    
    updateAirplanePhysics(deltaTime, flightInput, thrust) {
        // Forward direction based on aircraft rotation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        
        // Thrust force
        const thrustForce = forward.clone().multiplyScalar(thrust / this.weight);
        
        // Gravity
        const gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Lift (simplified)
        const liftCoeff = Math.min(this.speed / 100, 1); // Simple lift model
        const lift = new THREE.Vector3(0, liftCoeff * 12, 0);
        
        // Drag
        const dragCoeff = 0.02;
        const drag = this.velocity.clone().multiplyScalar(-dragCoeff);
        
        // Total force
        this.forces = thrustForce.clone().add(gravity).add(lift).add(drag);
        
        // Update velocity
        this.velocity.add(this.forces.clone().multiplyScalar(deltaTime));
        
        // Apply control inputs to rotation
        this.rotation.x += flightInput.pitch * deltaTime * 0.5;
        this.rotation.y += flightInput.yaw * deltaTime * 0.3;
        this.rotation.z += flightInput.roll * deltaTime * 0.5;
        
        // Limit rotation angles
        this.rotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.rotation.x));
        this.rotation.z = Math.max(-Math.PI/4, Math.min(Math.PI/4, this.rotation.z));
    }
    
    updateHelicopterPhysics(deltaTime, flightInput, thrust) {
        // Hover capability
        const hoverThrust = new THREE.Vector3(0, thrust / this.weight, 0);
        
        // Gravity
        const gravity = new THREE.Vector3(0, -9.81, 0);
        
        // Movement based on tilt
        const forward = new THREE.Vector3(
            -flightInput.yaw * 5,
            0,
            -flightInput.pitch * 5
        );
        
        // Drag
        const drag = this.velocity.clone().multiplyScalar(-0.1);
        
        // Total force
        this.forces = hoverThrust.clone().add(gravity).add(forward).add(drag);
        
        // Update velocity
        this.velocity.add(this.forces.clone().multiplyScalar(deltaTime));
        
        // Apply control inputs to rotation (more responsive than airplane)
        this.rotation.x += flightInput.pitch * deltaTime * 0.8;
        this.rotation.y += flightInput.yaw * deltaTime * 0.5;
        this.rotation.z += flightInput.roll * deltaTime * 0.8;
        
        // Limit rotation angles
        this.rotation.x = Math.max(-Math.PI/6, Math.min(Math.PI/6, this.rotation.x));
        this.rotation.z = Math.max(-Math.PI/6, Math.min(Math.PI/6, this.rotation.z));
    }
    
    startFlying() {
        this.isFlying = true;
        this.throttle = 0.3; // Start with some power
        if (this.type !== 'helicopter') {
            // Give initial forward velocity for airplanes
            this.velocity.set(0, 0, -20);
        }
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