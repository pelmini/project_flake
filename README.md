# 3D Croissant Model Viewer

A quick learning project exploring 3D modeling in Blender and importing 3D models onto a webpage using Three.js. The goal was to create a croissant model in Blender and display it on a webpage with interactive rotation controls.

## Features

- 🥐 3D croissant model created in Blender and exported as GLB
- 🎭 Interactive rotation controls (click and drag to rotate)
- 🖱️ Smooth animations and zoom controls

## Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd project_flake
   ```

2. **Start a local web server:**
   ```bash
   python3 -m http.server 8000
   ```

3. **Open your browser and navigate to:**
   ```
   http://localhost:8000
   ```

## Controls

- **Click and Drag**: Rotate the croissant
- **Scroll**: Zoom in/out
- **Single Click**: Stop rotation animation
- **Double Click**: Start rotation animation

## Project Structure

```
project_flake/
├── index.html          # Main HTML file
├── app.js              # Three.js application logic
├── styles.css          # Styling and layout
├── croissant_3d_web.glb # 3D model file (GLB format)
└── README.md           # This file
```

## Configuration

You can customize the croissant appearance by editing `app.js`:

### Color Stops
Modify the `colorStops` array in the `CONFIG` object:
```javascript
colorStops: [
    { pos: 0.50, color: 0xCC6812 }, // Rust
    { pos: 0.80, color: 0xE09555 }, // Transition hue
    { pos: 0.85, color: 0xDF9C60 }, // Earth Yellow
    { pos: 0.95, color: 0xF5E6D3 }  // Light cream
]
```

### Rotation Speed
```javascript
rotationSpeed: 0.004  // Higher = faster rotation
```

### Material Properties
```javascript
material: {
    roughness: 0.3,        // Lower = smoother/shiny
    metalness: 0.0,
    emissive: 0x8B6F47,
    emissiveIntensity: 0.25
}
```

## Troubleshooting

**CORS Error**: Make sure you're running the project through a local web server (not opening the HTML file directly).

**Model Not Loading**: Ensure `croissant_3d_web.glb` exists in the project directory and check the browser console for errors.

## Technologies Used

- [Three.js](https://threejs.org/) - 3D graphics library
- [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) - For loading GLB/GLTF models
- [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls) - Camera controls
