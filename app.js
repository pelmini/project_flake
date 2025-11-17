// Three.js 3D Croissant Viewer
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========== Configuration ==========
const CONFIG = {
    modelPath: './croissant_3d_web.glb',
    initialDistance: 2.3,
    azimuth: 90 * Math.PI / 180,
    polar: 70 * Math.PI / 180,
    rotationSpeed: 0.004,
    doubleClickTime: 300,
    colorStops: [
        { pos: 0.50, color: 0xCC6812 }, // Rust (covers ~2/3 from top)
        { pos: 0.80, color: 0xE09555 }, // Transition hue (more orange, between Rust and Earth Yellow)
        { pos: 0.85, color: 0xDF9C60 }, // Earth Yellow
        { pos: 0.95, color: 0xF5E6D3 }  // Very light cream
    ],
    backgroundGradient: {
        center: '#eee1ba',
        mid: '#f0d7a7',
        edge: '#c37960'
    },
    material: {
        roughness: 0.3,
        metalness: 0.0,
        emissive: 0x8B6F47,
        emissiveIntensity: 0.25
    },
    renderer: {
        toneMappingExposure: 1.4,
        pixelRatio: 2
    },
    lighting: {
        ambient: { color: 0xffffff, intensity: 1.3 },
        directional1: { color: 0xffffff, intensity: 0.7, position: [5, 5, 5] },
        directional2: { color: 0xffffff, intensity: 0.6, position: [-5, 3, -5] },
        fill: { color: 0xffffff, intensity: 0.6, position: [0, -3, 2] }
    }
};

// ========== Global State ==========
const scene = new THREE.Scene();
let model = null;
let camera, renderer, controls, container;

window.croissantRotation = {
    isRotating: true,
    rotationSpeed: CONFIG.rotationSpeed,
    rotationAngle: 0
};

// ========== Initialization ==========
function init() {
    const canvas = document.getElementById('canvas');
    container = canvas.parentElement;
    
    createBackground();
    setupCamera();
    setupRenderer(canvas);
    setupLighting();
    setupControls();
    setupEventListeners();
    loadModel();
    animate();
}

// ========== Scene Setup ==========
function createBackground() {
    const canvasBg = document.createElement('canvas');
    canvasBg.width = 512;
    canvasBg.height = 512;
    const ctxBg = canvasBg.getContext('2d');
    
    const gradient = ctxBg.createRadialGradient(256, 256, 0, 256, 256, 360);
    gradient.addColorStop(0, CONFIG.backgroundGradient.center);
    gradient.addColorStop(0.5, CONFIG.backgroundGradient.center);
    gradient.addColorStop(0.7, CONFIG.backgroundGradient.mid);
    gradient.addColorStop(0.9, CONFIG.backgroundGradient.edge);
    
    ctxBg.fillStyle = gradient;
    ctxBg.fillRect(0, 0, 512, 512);
    
    const bgTexture = new THREE.CanvasTexture(canvasBg);
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTexture;
}

function setupCamera() {
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    const x = CONFIG.initialDistance * Math.sin(CONFIG.polar) * Math.sin(CONFIG.azimuth);
    const y = CONFIG.initialDistance * Math.cos(CONFIG.polar);
    const z = CONFIG.initialDistance * Math.sin(CONFIG.polar) * Math.cos(CONFIG.azimuth);
    camera.position.set(CONFIG.initialDistance, y, z);
}

function setupRenderer(canvas) {
    renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true,
        powerPreference: "high-performance"
    });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.renderer.pixelRatio));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;
}

function setupLighting() {
    const { ambient, directional1, directional2, fill } = CONFIG.lighting;
    
    const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(directional1.color, directional1.intensity);
    dirLight1.position.set(...directional1.position);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(directional2.color, directional2.intensity);
    dirLight2.position.set(...directional2.position);
    scene.add(dirLight2);
    
    const fillLight = new THREE.DirectionalLight(fill.color, fill.intensity);
    fillLight.position.set(...fill.position);
    scene.add(fillLight);
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    
    setupControlLogging();
    setupRotationControls();
}

function setupControlLogging() {
    let lastZoom = null;
    let lastAzimuth = null;
    let lastPolar = null;
    
    controls.addEventListener('change', () => {
        const zoomLevel = camera.position.distanceTo(controls.target);
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, controls.target).normalize();
        const azimuth = Math.atan2(direction.x, direction.z) * 180 / Math.PI;
        const polar = Math.acos(direction.y) * 180 / Math.PI;
        
        const zoomChanged = lastZoom === null || Math.abs(lastZoom - zoomLevel) > 0.01;
        const azimuthChanged = lastAzimuth === null || Math.abs(lastAzimuth - azimuth) > 0.1;
        const polarChanged = lastPolar === null || Math.abs(lastPolar - polar) > 0.1;
        
        if (zoomChanged || azimuthChanged || polarChanged) {
            console.log('Croissant view adjusted:');
            console.log(`  Zoom level: ${zoomLevel.toFixed(2)}`);
            console.log(`  Azimuth (horizontal): ${azimuth.toFixed(2)}°`);
            console.log(`  Polar (vertical): ${polar.toFixed(2)}°`);
            lastZoom = zoomLevel;
            lastAzimuth = azimuth;
            lastPolar = polar;
        }
    });
}

function setupRotationControls() {
    let isUserDragging = false;
    let lastClickTime = 0;
    let clickTimeout = null;
    
    const stopRotation = () => {
        if (window.croissantRotation?.isRotating) {
            window.croissantRotation.isRotating = false;
            console.log('Rotation stopped');
        }
    };
    
    const startRotation = () => {
        if (window.croissantRotation && !window.croissantRotation.isRotating) {
            window.croissantRotation.isRotating = true;
            console.log('Rotation started');
        }
    };
    
    controls.addEventListener('start', () => {
        isUserDragging = true;
        stopRotation();
    });
    
    controls.addEventListener('end', () => {
        setTimeout(() => { isUserDragging = false; }, 150);
    });
    
    window.addEventListener('click', (e) => {
        if (isUserDragging) return;
        
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTime;
        
        if (timeSinceLastClick < CONFIG.doubleClickTime && timeSinceLastClick > 0) {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
            startRotation();
            lastClickTime = 0;
        } else {
            lastClickTime = now;
            if (clickTimeout) clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                stopRotation();
                clickTimeout = null;
            }, CONFIG.doubleClickTime);
        }
    });
    
    window.addEventListener('dblclick', () => {
        if (isUserDragging) return;
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }
        startRotation();
    });
}

function setupEventListeners() {
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}

// ========== Model Processing ==========
function smoothstep(edge0, edge1, x) {
    x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
}

function getColorAtPosition(t) {
    t = Math.max(0, Math.min(1, t));
    
    for (let i = 0; i < CONFIG.colorStops.length - 1; i++) {
        const stop1 = CONFIG.colorStops[i];
        const stop2 = CONFIG.colorStops[i + 1];
        
        if (t >= stop1.pos && t <= stop2.pos) {
            let tLocal = (t - stop1.pos) / (stop2.pos - stop1.pos);
            // Apply smoothstep for smoother blending
            tLocal = smoothstep(0, 1, tLocal);
            const color = new THREE.Color();
            color.lerpColors(
                new THREE.Color(stop1.color),
                new THREE.Color(stop2.color),
                tLocal
            );
            return color;
        }
    }
    
    if (t <= CONFIG.colorStops[0].pos) {
        return new THREE.Color(CONFIG.colorStops[0].color);
    }
    if (t >= CONFIG.colorStops[CONFIG.colorStops.length - 1].pos) {
        return new THREE.Color(CONFIG.colorStops[CONFIG.colorStops.length - 1].color);
    }
    return new THREE.Color(CONFIG.colorStops[0].color);
}

function applyVertexColors(mesh) {
    const geometry = mesh.geometry;
    if (!geometry.attributes.position) return;
    
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const minZ = bbox.min.z;
    const maxZ = bbox.max.z;
    const rangeZ = maxZ - minZ;
    
    const positions = geometry.attributes.position;
    const colors = [];
    
    for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        let normalizedZ = rangeZ > 0 ? 1 - (z - minZ) / rangeZ : 0.5;
        normalizedZ = Math.pow(normalizedZ, 0.6);
        
        const color = getColorAtPosition(normalizedZ);
        colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.color.needsUpdate = true;
    
    // Ensure smooth normals for smoother appearance
    geometry.computeVertexNormals();
    geometry.normalizeNormals();
}

function setupMaterial(material) {
    const { roughness, metalness, emissive, emissiveIntensity } = CONFIG.material;
    
    material.vertexColors = true;
    material.roughness = roughness;
    material.metalness = metalness;
    material.flatShading = false; // Smooth shading (not faceted)
    material.side = THREE.DoubleSide; // Render both sides smoothly
    material.color.setHex(0xFFFFFF);
    material.emissive.setHex(emissive);
    material.emissiveIntensity = emissiveIntensity;
    material.needsUpdate = true;
}

function processModel(gltf) {
    model = gltf.scene;
    let meshCount = 0;
    
    model.traverse((child) => {
        if (!child.isMesh) return;
        
        meshCount++;
        
        if (child.geometry) {
            // Compute smooth vertex normals for smoother appearance
            child.geometry.computeVertexNormals();
            child.geometry.normalizeNormals();
            
            // Force smooth normals by ensuring proper vertex sharing
            if (child.geometry.attributes.normal) {
                child.geometry.attributes.normal.needsUpdate = true;
            }
        }
        
        applyVertexColors(child);
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(setupMaterial);
        } else {
            child.material = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                vertexColors: true,
                roughness: CONFIG.material.roughness,
                metalness: CONFIG.material.metalness
            });
        }
    });
    
    if (meshCount === 0) {
        showError('No 3D geometry found in the model. Please check your Blender export settings.');
        return;
    }
    
    scene.add(model);
    centerAndScaleModel();
    controls.target.copy(model.position);
    controls.update();
}

function centerAndScaleModel() {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    if (size.x === 0 && size.y === 0 && size.z === 0) {
        showError('The model appears to have no size. Please check your Blender export.');
        return;
    }
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    model.scale.multiplyScalar(scale);
    
    model.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
    );
}

function loadModel() {
    const loader = new GLTFLoader();
    
    loader.load(
        CONFIG.modelPath,
        (gltf) => {
            console.log('Model loaded successfully');
            processModel(gltf);
        },
        (progress) => {
            if (progress.lengthComputable) {
                const percent = (progress.loaded / progress.total * 100).toFixed(2);
                console.log(`Loading progress: ${percent}%`);
            }
        },
        (error) => {
            console.error('Error loading model:', error);
            showError(`Error loading 3D model. ${error.message || ''}`);
        }
    );
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.innerHTML = `<h2>⚠️ Model Loading Error</h2><p>${message}</p>`;
        errorMessage.classList.add('show');
    } else {
        alert(message);
    }
}

// ========== Animation ==========
function animate() {
    requestAnimationFrame(animate);
    
    if (window.croissantRotation?.isRotating && model) {
        window.croissantRotation.rotationAngle += window.croissantRotation.rotationSpeed;
        model.rotation.y = window.croissantRotation.rotationAngle;
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Start the application
init();
