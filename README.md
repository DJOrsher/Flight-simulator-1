# Flight Simulator

A 3D flight simulator built with Three.js where you can walk around an airbase, select different aircraft, and fly around a detailed world.

## Features

- **First-Person Walking**: Walk around the airbase with realistic movement and mouse look
- **Multiple Aircraft Types**: Choose from Fighter Jets, Cargo Planes, and Helicopters
- **Realistic Flight Physics**: Each aircraft has unique flight characteristics
- **Detailed Airbase**: Complete with runways, hangars, control tower, and terminal
- **World Exploration**: Fly around a large terrain with mountains and varied landscape
- **Seamless Transitions**: Enter and exit aircraft smoothly

## Aircraft Types

### F-16 Fighter Jet
- **Speed**: Up to 600 knots
- **Characteristics**: Fast, agile, responsive controls
- **Best for**: High-speed flight and aerobatics

### C-130 Cargo Plane
- **Speed**: Up to 350 knots
- **Characteristics**: Stable, heavy, gradual controls
- **Best for**: Long-distance flying and cargo operations

### UH-60 Helicopter
- **Speed**: Up to 150 knots
- **Characteristics**: Can hover, vertical takeoff/landing
- **Best for**: Precision flying and landing in tight spaces

## Controls

### Walking Mode
- **WASD**: Move forward/backward/left/right
- **Mouse**: Look around
- **Shift**: Run
- **Space**: Jump
- **E**: Interact with nearby aircraft
- **Click**: Enable mouse look (pointer lock)

### Flying Mode
- **WASD** or **Arrow Keys**: Aircraft control (pitch/yaw)
- **Q/E**: Roll left/right
- **Space**: Increase throttle
- **Shift**: Decrease throttle
- **Mouse**: Additional flight control
- **ESC**: Exit aircraft

## How to Play

1. **Open the Game**: Open `index.html` in a modern web browser
2. **Start Walking**: Click to enable mouse look and use WASD to move around
3. **Find Aircraft**: Walk to any aircraft on the airbase (blue fighters, gray cargo planes, green helicopters)
4. **Enter Aircraft**: Press **E** when near an aircraft to enter it
5. **Take Off**: Use **Space** to increase throttle and **W** to pitch up
6. **Fly Around**: Explore the world - fly over mountains, return to base
7. **Land**: Reduce throttle with **Shift** and aim for flat ground
8. **Exit Aircraft**: Press **ESC** to exit and return to walking mode
9. **Switch Aircraft**: Walk to a different aircraft and press **E** to switch

## Installation

No installation required! Just open `index.html` in a web browser that supports WebGL.

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- WebGL support
- Keyboard and mouse

## Technical Details

- **Engine**: Three.js (WebGL)
- **Physics**: Custom flight dynamics for each aircraft type
- **World Size**: 10km x 10km terrain with detailed airbase
- **Aircraft Count**: 9 aircraft of various types
- **Performance**: Optimized for smooth 60 FPS gameplay

## Tips

- **Fighter Jets**: Best for speed - use gentle inputs for smooth flight
- **Cargo Planes**: More stable but slower - good for learning to fly
- **Helicopters**: Can hover - hold throttle to maintain altitude
- **Landing**: Approach slowly and aim for flat areas near the runways
- **Exploration**: The world extends far beyond the airbase - explore!

## Troubleshooting

- **Black Screen**: Ensure your browser supports WebGL
- **Poor Performance**: Try closing other browser tabs
- **Controls Not Working**: Click on the game area to focus it
- **Can't Look Around**: Click to enable mouse lock

## Future Enhancements

- More aircraft types
- Weapons systems
- Multiplayer support
- Weather effects
- Day/night cycle
- Mission objectives

Enjoy your flight!