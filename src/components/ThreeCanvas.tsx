import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Box, Printer, Download, Layers } from 'lucide-react';
import { TrailerConfig, PlacedEquipment, EquipmentModel } from '../types/trailer';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { LOGO_URL } from '../data/branding';

export interface ThreeCanvasExportHandlers {
  exportSTL: (options: { binary: boolean; includeRoof: boolean }) => void;
  exportGLTF: (options: { binary: boolean; includeRoof: boolean }) => void;
}

interface ThreeCanvasProps {
  config: TrailerConfig;
  selectedInstanceId: string | null;
  onSelectItem: (instanceId: string | null) => void;
  viewCameraPreset?: 'iso' | 'interior' | 'top' | 'customer';
  onOpenExport3D?: () => void;
  exportHandlerRef?: React.MutableRefObject<ThreeCanvasExportHandlers | null>;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  config,
  selectedInstanceId,
  onSelectItem,
  viewCameraPreset = 'iso',
  onOpenExport3D,
  exportHandlerRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const trailerGroupRef = useRef<THREE.Group | null>(null);
  const hatchPivotRef = useRef<THREE.Group | null>(null);
  const itemMeshesMapRef = useRef<Map<string, THREE.Group>>(new Map());

  // Expose export handlers via ref
  useEffect(() => {
    if (!exportHandlerRef) return;
    exportHandlerRef.current = {
      exportSTL: (options) => {
        if (!trailerGroupRef.current) return;
        const exporter = new STLExporter();
        const exportGroup = trailerGroupRef.current.clone(true);
        if (!options.includeRoof) {
          const toRemove: THREE.Object3D[] = [];
          exportGroup.traverse((child) => {
            if (child.name === 'roof' || child.userData?.isRoof) {
              toRemove.push(child);
            }
          });
          toRemove.forEach((c) => c.parent?.remove(c));
        }
        const result = exporter.parse(exportGroup, { binary: options.binary });
        const blob = new Blob([result], { type: options.binary ? 'application/octet-stream' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GASTRO-inox-BAU-Druk3D-${config.dimensions.length}cm-${Date.now().toString().slice(-6)}.stl`;
        link.click();
        URL.revokeObjectURL(url);
      },
      exportGLTF: (options) => {
        if (!trailerGroupRef.current) return;
        const exporter = new GLTFExporter();
        const exportGroup = trailerGroupRef.current.clone(true);
        if (!options.includeRoof) {
          const toRemove: THREE.Object3D[] = [];
          exportGroup.traverse((child) => {
            if (child.name === 'roof' || child.userData?.isRoof) {
              toRemove.push(child);
            }
          });
          toRemove.forEach((c) => c.parent?.remove(c));
        }
        exporter.parse(
          exportGroup,
          (gltf) => {
            let blob: Blob;
            const ext = options.binary ? 'glb' : 'gltf';
            if (gltf instanceof ArrayBuffer) {
              blob = new Blob([gltf], { type: 'application/octet-stream' });
            } else {
              const output = JSON.stringify(gltf, null, 2);
              blob = new Blob([output], { type: 'application/json' });
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `GASTRO-inox-BAU-Model-CAD-${config.dimensions.length}cm-${Date.now().toString().slice(-6)}.${ext}`;
            link.click();
            URL.revokeObjectURL(url);
          },
          (err) => console.error('Błąd eksportu GLTF:', err),
          { binary: options.binary }
        );
      },
    };
  }, [config, exportHandlerRef]);

  // Cached materials
  const materialsRef = useRef<{
    stainless: THREE.MeshStandardMaterial;
    stainlessDark: THREE.MeshStandardMaterial;
    bodyPaint: THREE.MeshStandardMaterial;
    roofPaint: THREE.MeshStandardMaterial;
    chassisMetal: THREE.MeshStandardMaterial;
    rubberTire: THREE.MeshStandardMaterial;
    chromeWheel: THREE.MeshStandardMaterial;
    glass: THREE.MeshPhysicalMaterial;
    countertop: THREE.MeshStandardMaterial;
    floor: THREE.MeshStandardMaterial;
    neonGlow: THREE.MeshStandardMaterial;
    blackAccent: THREE.MeshStandardMaterial;
    highlight: THREE.MeshStandardMaterial;
  } | null>(null);

  // Initialize Scene, Renderer, Lights, and OrbitControls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0e14);
    scene.fog = new THREE.FogExp2(0x0c0e14, 0.025);
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 3.2, 5.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // PMREM Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting
    const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x1a202c, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(6, 8, 5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.camera.left = -5;
      keyLight.shadow.camera.right = 5;
      keyLight.shadow.camera.top = 5;
      keyLight.shadow.camera.bottom = -5;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    // Ground plane with subtle grid pattern
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x11151f,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Circular contact shadow under trailer
    const shadowGeo = new THREE.PlaneGeometry(7, 4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0,0,0,0.65)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't go below ground
    controls.minDistance = 1.5;
    controls.maxDistance = 18;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // Pre-create materials
    materialsRef.current = {
      stainless: new THREE.MeshStandardMaterial({
        color: 0xd8dde4,
        roughness: 0.22,
        metalness: 0.92,
      }),
      stainlessDark: new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.35,
        metalness: 0.85,
      }),
      bodyPaint: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.wallColor),
        roughness: 0.3,
        metalness: 0.15,
      }),
      roofPaint: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.roofColor),
        roughness: 0.4,
        metalness: 0.1,
      }),
      chassisMetal: new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.45,
        metalness: 0.7,
      }),
      rubberTire: new THREE.MeshStandardMaterial({
        color: 0x1f242d,
        roughness: 0.85,
        metalness: 0.05,
      }),
      chromeWheel: new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.1,
        metalness: 0.95,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        metalness: 0.1,
        transmission: isSoftwareGl ? 0 : 0.85,
        ior: 1.5,
        depthWrite: false,
      }),
      countertop: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.25,
        metalness: 0.85,
      }),
      floor: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.3,
      }),
      neonGlow: new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      }),
      blackAccent: new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.5,
        metalness: 0.3,
      }),
      highlight: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
      }),
    };

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Smooth hatch movement if animating
      if (hatchPivotRef.current) {
        const targetAngle = config.hatchOpen ? (config.hatchAngle * Math.PI) / 180 : 0;
        hatchPivotRef.current.rotation.x = THREE.MathUtils.damp(
          hatchPivotRef.current.rotation.x,
          targetAngle,
          8,
          0.016
        );
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pointer Raycasting for clicking items in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const interactiveObjects: THREE.Object3D[] = [];
      itemMeshesMapRef.current.forEach((grp) => {
        grp.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData.instanceId = grp.userData.instanceId;
            interactiveObjects.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(interactiveObjects, false);
      if (intersects.length > 0) {
        const hitInstanceId = intersects[0].object.userData.instanceId;
        if (hitInstanceId) {
          onSelectItem(hitInstanceId);
        }
      } else {
        // clicked empty floor/ground
        onSelectItem(null);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Camera Presets
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (viewCameraPreset === 'iso') {
      camera.position.set(4.5, 3.2, 5.5);
      controls.target.set(0, 1.2, 0);
    } else if (viewCameraPreset === 'interior') {
      camera.position.set(0, 1.8, 0.4);
      controls.target.set(0, 1.4, -0.6);
    } else if (viewCameraPreset === 'top') {
      camera.position.set(0, 7.5, 0.01);
      controls.target.set(0, 0, 0);
    } else if (viewCameraPreset === 'customer') {
      camera.position.set(0, 1.4, 3.8);
      controls.target.set(0, 1.4, 1.1);
    }
    controls.update();
  }, [viewCameraPreset]);

  // Re-build 3D Trailer and Equipment when config changes
  useEffect(() => {
    const scene = sceneRef.current;
    const mats = materialsRef.current;
    if (!scene || !mats) return;

    // Update material colors
    mats.bodyPaint.color.set(config.wallColor);
    mats.roofPaint.color.set(config.roofColor);

    // Remove old trailer group
    if (trailerGroupRef.current) {
      scene.remove(trailerGroupRef.current);
      trailerGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
    }

    const trailerGroup = new THREE.Group();
    trailerGroupRef.current = trailerGroup;
    scene.add(trailerGroup);
    itemMeshesMapRef.current.clear();

    // Scale dimensions: 1 unit in Three.js = 1 meter (100 cm)
    const L = config.dimensions.length / 100;
    const W = config.dimensions.width / 100;
    const H = config.dimensions.height / 100;
    const groundY = 0.55; // Height of floor above ground
    const wallThick = 0.05;

    // --- 1. CHASSIS & TOWING HITCH (DYSZEL) ---
    const chassisGroup = new THREE.Group();
    // Main beam frames
    const beamGeo = new THREE.BoxGeometry(L + 0.2, 0.1, W - 0.2);
    const beamMesh = new THREE.Mesh(beamGeo, mats.chassisMetal);
    beamMesh.position.set(0, groundY - 0.06, 0);
    chassisGroup.add(beamMesh);

    // A-frame Towing Bar (dyszel trójkątny z przodu z lewej strony lub x < 0)
    const tongueLength = 1.35;
    const tongueGeo = new THREE.CylinderGeometry(0.04, 0.04, tongueLength);
    const tongueL = new THREE.Mesh(tongueGeo, mats.chassisMetal);
    tongueL.rotation.z = Math.PI / 2;
    tongueL.rotation.y = 0.24;
    tongueL.position.set(-(L / 2 + tongueLength / 2 * 0.9), groundY - 0.06, 0.22);
    chassisGroup.add(tongueL);

    const tongueR = new THREE.Mesh(tongueGeo, mats.chassisMetal);
    tongueR.rotation.z = Math.PI / 2;
    tongueR.rotation.y = -0.24;
    tongueR.position.set(-(L / 2 + tongueLength / 2 * 0.9), groundY - 0.06, -0.22);
    chassisGroup.add(tongueR);

    // Tow coupling hitch (zaczep kulowy AL-KO)
    const hitchGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.25);
    const hitchMesh = new THREE.Mesh(hitchGeo, mats.stainlessDark);
    hitchMesh.position.set(-(L / 2 + tongueLength * 0.95), groundY - 0.04, 0);
    chassisGroup.add(hitchMesh);

    // Support jockey wheel (koło podporowe)
    const jockeyGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16);
    const jockeyMesh = new THREE.Mesh(jockeyGeo, mats.rubberTire);
    jockeyMesh.rotation.z = Math.PI / 2;
    jockeyMesh.position.set(-(L / 2 + tongueLength * 0.7), 0.1, 0.08);
    chassisGroup.add(jockeyMesh);

    // --- 2. WHEELS (Single or Dual Axle) ---
    const wheelRadius = 0.28;
    const wheelThick = 0.18;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThick, 24);
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, wheelThick + 0.01, 16);

    const axleOffsets = config.dimensions.axles === 2 ? [-0.38, 0.38] : [0];
    axleOffsets.forEach((ox) => {
      // Left wheel (z < 0)
      const wheelL = new THREE.Group();
      const tireL = new THREE.Mesh(tireGeo, mats.rubberTire);
      tireL.rotation.x = Math.PI / 2;
      const rimL = new THREE.Mesh(rimGeo, mats.chromeWheel);
      rimL.rotation.x = Math.PI / 2;
      wheelL.add(tireL, rimL);
      wheelL.position.set(ox, wheelRadius, -(W / 2 + wheelThick / 2));
      chassisGroup.add(wheelL);

      // Right wheel (z > 0)
      const wheelR = new THREE.Group();
      const tireR = new THREE.Mesh(tireGeo, mats.rubberTire);
      tireR.rotation.x = Math.PI / 2;
      const rimR = new THREE.Mesh(rimGeo, mats.chromeWheel);
      rimR.rotation.x = Math.PI / 2;
      wheelR.add(tireR, rimR);
      wheelR.position.set(ox, wheelRadius, W / 2 + wheelThick / 2);
      chassisGroup.add(wheelR);

      // Wheel arches (nadkola czarne)
      const archGeo = new THREE.BoxGeometry(0.7, 0.22, 0.22);
      const archL = new THREE.Mesh(archGeo, mats.blackAccent);
      archL.position.set(ox, groundY + 0.1, -(W / 2 + 0.08));
      chassisGroup.add(archL);
      const archR = new THREE.Mesh(archGeo, mats.blackAccent);
      archR.position.set(ox, groundY + 0.1, W / 2 + 0.08);
      chassisGroup.add(archR);
    });

    trailerGroup.add(chassisGroup);

    // --- 3. FLOOR & INTERIOR ---
    const floorGeo = new THREE.BoxGeometry(L, wallThick, W);
    const floorMesh = new THREE.Mesh(floorGeo, mats.floor);
    floorMesh.position.set(0, groundY + wallThick / 2, 0);
    floorMesh.receiveShadow = true;
    trailerGroup.add(floorMesh);

    // Check Cutaway Mode
    const isRoofOff = config.cutawayMode === 'roof_off' || config.cutawayMode === 'exploded';
    const isTransparent = config.cutawayMode === 'transparent_walls';

    const wallMaterial = isTransparent ? mats.glass : mats.bodyPaint;

    // --- 4. WALLS ---
    // Back Wall (z = -W/2, technological wall where hoods, grills, sinks sit)
    const backWallGeo = new THREE.BoxGeometry(L, H, wallThick);
    const backWallMesh = new THREE.Mesh(backWallGeo, wallMaterial);
    backWallMesh.position.set(0, groundY + H / 2, -W / 2 + wallThick / 2);
    trailerGroup.add(backWallMesh);

    // Left End Wall (x = -L/2, entrance door wall)
    const leftWallGeo = new THREE.BoxGeometry(wallThick, H, W);
    const leftWallMesh = new THREE.Mesh(leftWallGeo, wallMaterial);
    leftWallMesh.position.set(-L / 2 + wallThick / 2, groundY + H / 2, 0);
    trailerGroup.add(leftWallMesh);

    // Right End Wall (x = +L/2)
    const rightWallGeo = new THREE.BoxGeometry(wallThick, H, W);
    const rightWallMesh = new THREE.Mesh(rightWallGeo, wallMaterial);
    rightWallMesh.position.set(L / 2 - wallThick / 2, groundY + H / 2, 0);
    trailerGroup.add(rightWallMesh);

    // Front Wall with Customer Service Hatch (z = +W/2)
    // Front wall is split into: Bottom sill, Left flank, Right flank, Top lintel
    const hatchW = config.dimensions.hatchWidth / 100;
    const hatchH = config.dimensions.hatchHeight / 100;
    const hatchBottomY = groundY + 0.95; // counter height
    const hatchTopY = hatchBottomY + hatchH;
    const frontZ = W / 2 - wallThick / 2;

    // Bottom sill under window
    const sillGeo = new THREE.BoxGeometry(L, 0.95, wallThick);
    const sillMesh = new THREE.Mesh(sillGeo, wallMaterial);
    sillMesh.position.set(0, groundY + 0.95 / 2, frontZ);
    trailerGroup.add(sillMesh);

    // Top lintel above window
    const topLintelHeight = H - (0.95 + hatchH);
    if (topLintelHeight > 0) {
      const topLintelGeo = new THREE.BoxGeometry(L, topLintelHeight, wallThick);
      const topLintelMesh = new THREE.Mesh(topLintelGeo, wallMaterial);
      topLintelMesh.position.set(0, hatchTopY + topLintelHeight / 2, frontZ);
      trailerGroup.add(topLintelMesh);
    }

    // Left flank & Right flank on front wall
    const flankWidth = (L - hatchW) / 2;
    if (flankWidth > 0.05) {
      const flankGeo = new THREE.BoxGeometry(flankWidth, hatchH, wallThick);
      const flankLeft = new THREE.Mesh(flankGeo, wallMaterial);
      flankLeft.position.set(-(L / 2 - flankWidth / 2), hatchBottomY + hatchH / 2, frontZ);
      trailerGroup.add(flankLeft);

      const flankRight = new THREE.Mesh(flankGeo, wallMaterial);
      flankRight.position.set(L / 2 - flankWidth / 2, hatchBottomY + hatchH / 2, frontZ);
      trailerGroup.add(flankRight);
    }

    // --- 5. HATCH FLAP WITH PISTONS (Klapa sprzedażowa otwierana) ---
    const hatchPivot = new THREE.Group();
    hatchPivot.position.set(0, hatchTopY, frontZ);
    hatchPivotRef.current = hatchPivot;

    const flapGeo = new THREE.BoxGeometry(hatchW + 0.06, hatchH, 0.04);
    const flapMesh = new THREE.Mesh(flapGeo, mats.bodyPaint);
    // Align flap so its top edge pivots at (0,0,0)
    flapMesh.position.set(0, -hatchH / 2, 0.02);
    hatchPivot.add(flapMesh);

    // Interior flap finish (brushed aluminum)
    const flapInnerGeo = new THREE.BoxGeometry(hatchW + 0.02, hatchH - 0.02, 0.01);
    const flapInner = new THREE.Mesh(flapInnerGeo, mats.stainless);
    flapInner.position.set(0, -hatchH / 2, 0);
    hatchPivot.add(flapInner);

    // Menu blackboard on open hatch with GASTRO inox BAU header
    const menuGeo = new THREE.PlaneGeometry(hatchW * 0.7, hatchH * 0.5);
    const menuCanvas = document.createElement('canvas');
    menuCanvas.width = 512;
    menuCanvas.height = 256;
    const mctx = menuCanvas.getContext('2d')!;
    mctx.fillStyle = '#111318';
    mctx.fillRect(0, 0, 512, 256);
    mctx.strokeStyle = '#dc2626';
    mctx.lineWidth = 4;
    mctx.strokeRect(8, 8, 496, 240);
    // GASTRO inox BAU banner
    mctx.fillStyle = '#ffffff';
    mctx.font = 'bold 22px sans-serif';
    mctx.fillText('GASTRO inox BAU', 130, 42);
    mctx.font = '13px sans-serif';
    mctx.fillStyle = '#38bdf8';
    mctx.fillText('FABRYKA ZABUDÓW • MADE IN POLAND', 115, 62);
    mctx.fillStyle = '#f59e0b';
    mctx.font = 'bold 24px sans-serif';
    mctx.fillText('MENU STREET FOOD', 125, 105);
    mctx.font = '19px sans-serif';
    mctx.fillStyle = '#cbd5e1';
    mctx.fillText('• Rzemieślnicze receptury & 100% Wołowina', 40, 145);
    mctx.fillText('• Chrupiące Frytki & Sosy Własnego Wyrobu', 40, 180);
    mctx.fillText('• Zimna Lemoniada & Kawa Specialty', 40, 215);
    const menuTex = new THREE.CanvasTexture(menuCanvas);
    const menuMat = new THREE.MeshBasicMaterial({ map: menuTex });
    const menuMesh = new THREE.Mesh(menuGeo, menuMat);
    menuMesh.position.set(0, -hatchH / 2, -0.01);
    menuMesh.rotation.y = Math.PI;
    hatchPivot.add(menuMesh);

    // Exterior Manufacturer Plaque (GASTRO inox BAU logo emblem)
    const logoTexture = new THREE.TextureLoader().load(LOGO_URL);
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    const plaqueWidth = 0.42;
    const plaqueHeight = 0.42;
    const plaqueGeo = new THREE.PlaneGeometry(plaqueWidth, plaqueHeight);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      roughness: 0.2,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.set(-L / 2 + 0.35, groundY + 0.55, frontZ + 0.035);
    trailerGroup.add(plaqueMesh);

    // Chrome/Stainless frame around the logo badge
    const frameGeo = new THREE.BoxGeometry(plaqueWidth + 0.04, plaqueHeight + 0.04, 0.015);
    const frameMesh = new THREE.Mesh(frameGeo, mats.stainless);
    frameMesh.position.set(-L / 2 + 0.35, groundY + 0.55, frontZ + 0.025);
    trailerGroup.add(frameMesh);

    trailerGroup.add(hatchPivot);

    // Initial hatch rotation
    if (config.hatchOpen) {
      hatchPivot.rotation.x = (config.hatchAngle * Math.PI) / 180;
    }

    // Customer Foldable Shelf (Zewnętrzna składana półka dla klienta pod oknem)
    if (config.customerShelfOut) {
      const shelfGeo = new THREE.BoxGeometry(hatchW, 0.03, 0.26);
      const shelfMesh = new THREE.Mesh(shelfGeo, mats.stainless);
      shelfMesh.position.set(0, hatchBottomY, frontZ + 0.16);
      trailerGroup.add(shelfMesh);

      // Support brackets
      const bracketGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28);
      const brL = new THREE.Mesh(bracketGeo, mats.stainlessDark);
      brL.rotation.x = 0.8;
      brL.position.set(-hatchW / 3, hatchBottomY - 0.12, frontZ + 0.1);
      const brR = new THREE.Mesh(bracketGeo, mats.stainlessDark);
      brR.rotation.x = 0.8;
      brR.position.set(hatchW / 3, hatchBottomY - 0.12, frontZ + 0.1);
      trailerGroup.add(brL, brR);
    }

    // --- 6. ROOF & LED STRIP CEILING ---
    if (!isRoofOff) {
      const roofGeo = new THREE.BoxGeometry(L + 0.1, wallThick, W + 0.1);
      const roofMesh = new THREE.Mesh(roofGeo, mats.roofPaint);
      roofMesh.name = 'roof';
      roofMesh.userData = { isRoof: true };
      roofMesh.position.set(0, groundY + H + wallThick / 2, 0);
      trailerGroup.add(roofMesh);

      // Corner trims (narożniki aluminiowe anodowane)
      const trimGeo = new THREE.BoxGeometry(0.07, H, 0.07);
      const corners = [
        [-L / 2, -W / 2],
        [L / 2, -W / 2],
        [-L / 2, W / 2],
        [L / 2, W / 2],
      ];
      corners.forEach(([cx, cz]) => {
        const trim = new THREE.Mesh(trimGeo, mats.stainless);
        trim.position.set(cx, groundY + H / 2, cz);
        trailerGroup.add(trim);
      });
    }

    // Interior Warm LED Strip Light
    if (config.lightsOn) {
      const interiorLight = new THREE.PointLight(0xffedd5, 1.4, 6);
      interiorLight.position.set(0, groundY + H - 0.2, 0);
      trailerGroup.add(interiorLight);

      // Light bar mesh on ceiling
      const lightBarGeo = new THREE.BoxGeometry(L * 0.8, 0.02, 0.06);
      const lightBarMesh = new THREE.Mesh(lightBarGeo, mats.neonGlow);
      lightBarMesh.position.set(0, groundY + H - 0.02, 0);
      trailerGroup.add(lightBarMesh);
    }

    // --- 7. PROCEDURAL EQUIPMENT MESHES ---
    const catalogMap = new Map(EQUIPMENT_CATALOG.map((m) => [m.id, m]));

    config.placedItems.forEach((placed) => {
      const model = catalogMap.get(placed.modelId);
      if (!model) return;

      const itemGroup = createEquipmentMesh(model, mats, placed.instanceId === selectedInstanceId);
      itemGroup.userData = { instanceId: placed.instanceId, modelId: model.id };

      // Convert cm to meters
      const posX = placed.x / 100;
      const posZ = placed.z / 100;
      const posY = groundY + wallThick + placed.y / 100;

      itemGroup.position.set(posX, posY, posZ);
      itemGroup.rotation.y = (placed.rotation * Math.PI) / 180;

      trailerGroup.add(itemGroup);
      itemMeshesMapRef.current.set(placed.instanceId, itemGroup);
    });
  }, [config, selectedInstanceId]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Export Button */}
      {onOpenExport3D && (
        <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
          <button
            onClick={onOpenExport3D}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-400 text-slate-200 hover:text-white text-xs font-bold shadow-xl backdrop-blur transition active:scale-95 group"
            title="Eksportuj model do STL (Druk 3D) lub GLTF (CAD)"
          >
            <Box className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Eksport 3D (STL / GLTF)</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded">
              Druk 3D / CAD
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

// Procedural Mesh Builder for Food Truck Equipment with accurate parts
function createEquipmentMesh(
  model: EquipmentModel,
  mats: any,
  isSelected: boolean
): THREE.Group {
  const group = new THREE.Group();
  const w = model.dimensions.width / 100;
  const d = model.dimensions.depth / 100;
  const h = model.dimensions.height / 100;

  const baseMat = isSelected ? mats.highlight : mats.stainless;
  const darkMat = isSelected ? mats.highlight : mats.stainlessDark;

  // Selection halo box
  if (isSelected) {
    const wireGeo = new THREE.BoxGeometry(w + 0.04, h + 0.04, d + 0.04);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    wireMesh.position.y = h / 2;
    group.add(wireMesh);
  }

  switch (model.threeType) {
    // 1. SANEPID COMPREHENSIVE SANITARY UNIT (HACCP REQUIRED)
    case 'sanitary_unit': {
      // Main stainless cabinet base
      const cabGeo = new THREE.BoxGeometry(w, h - 0.05, d);
      const cab = new THREE.Mesh(cabGeo, baseMat);
      cab.position.y = (h - 0.05) / 2;
      group.add(cab);

      // Top sink basin with divider (two compartments + separate handwash basin)
      const rimGeo = new THREE.BoxGeometry(w, 0.05, d);
      const rim = new THREE.Mesh(rimGeo, darkMat);
      rim.position.y = h - 0.025;
      group.add(rim);

      // Two gooseneck faucets with elbow levers (bateria łokciowa)
      const tapPositions = [-w * 0.25, w * 0.25];
      tapPositions.forEach((tx) => {
        const pipeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22);
        const pipe = new THREE.Mesh(pipeGeo, mats.stainlessDark);
        pipe.position.set(tx, h + 0.1, -d * 0.25);
        const spoutGeo = new THREE.BoxGeometry(0.012, 0.012, 0.12);
        const spout = new THREE.Mesh(spoutGeo, mats.stainlessDark);
        spout.position.set(tx, h + 0.21, -d * 0.25 + 0.06);
        group.add(pipe, spout);
      });

      // Water heater indicator box under sink
      const heaterGeo = new THREE.BoxGeometry(0.2, 0.3, 0.2);
      const heater = new THREE.Mesh(heaterGeo, mats.blackAccent);
      heater.position.set(-0.1, 0.25, 0);
      group.add(heater);
      break;
    }

    // 2. EXHAUST HOOD (Okap labiryntowy ze stali AISI 304)
    case 'exhaust_hood': {
      // Slanted canopy hood
      const hoodGeo = new THREE.BoxGeometry(w, h, d);
      const hood = new THREE.Mesh(hoodGeo, baseMat);
      hood.position.y = h / 2;
      group.add(hood);

      // Grease baffle filters (filtry labiryntowe)
      const numFilters = Math.max(2, Math.floor(w / 0.4));
      for (let i = 0; i < numFilters; i++) {
        const filterGeo = new THREE.BoxGeometry(w / numFilters - 0.04, 0.04, d * 0.6);
        const filter = new THREE.Mesh(filterGeo, darkMat);
        filter.position.set(-w / 2 + (i + 0.5) * (w / numFilters), 0.02, 0);
        group.add(filter);
      }

      // Exhaust vent pipe duct on top
      const ductGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16);
      const duct = new THREE.Mesh(ductGeo, darkMat);
      duct.position.set(0, h + 0.17, 0);
      group.add(duct);
      break;
    }

    // 3. GRILL PLATE (Płyta grillowa ryflowana)
    case 'grill_plate': {
      // Chassis box
      const bodyGeo = new THREE.BoxGeometry(w, h * 0.6, d);
      const body = new THREE.Mesh(bodyGeo, baseMat);
      body.position.y = (h * 0.6) / 2;
      group.add(body);

      // Thick steel/chrome griddle top
      const griddleGeo = new THREE.BoxGeometry(w - 0.04, 0.04, d - 0.06);
      const griddle = new THREE.Mesh(griddleGeo, darkMat);
      griddle.position.y = h * 0.6 + 0.02;
      group.add(griddle);

      // Splash guard back and sides
      const splashGeo = new THREE.BoxGeometry(w - 0.04, 0.12, 0.02);
      const splash = new THREE.Mesh(splashGeo, baseMat);
      splash.position.set(0, h * 0.6 + 0.06, -d / 2 + 0.02);
      group.add(splash);

      // Knobs on front panel
      [-0.18, 0.18].forEach((kx) => {
        const knobGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12);
        const knob = new THREE.Mesh(knobGeo, mats.blackAccent);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(kx, h * 0.3, d / 2 + 0.01);
        group.add(knob);
      });
      break;
    }

    // 4. DOUBLE FRYER (Frytownica dwukomorowa z koszami)
    case 'fryer_double':
    case 'fryer_large': {
      const fBodyGeo = new THREE.BoxGeometry(w, h * 0.8, d);
      const fBody = new THREE.Mesh(fBodyGeo, baseMat);
      fBody.position.y = (h * 0.8) / 2;
      group.add(fBody);

      // Twin oil vats
      [-w * 0.24, w * 0.24].forEach((vx) => {
        const vatGeo = new THREE.BoxGeometry(w * 0.38, 0.04, d * 0.65);
        const vat = new THREE.Mesh(vatGeo, darkMat);
        vat.position.set(vx, h * 0.8 + 0.02, 0.02);
        group.add(vat);

        // Frying wire basket with handle
        const basketGeo = new THREE.BoxGeometry(w * 0.32, 0.12, d * 0.45);
        const basket = new THREE.Mesh(basketGeo, mats.stainlessDark);
        basket.position.set(vx, h * 0.8 + 0.08, 0.02);
        group.add(basket);

        // Basket handle
        const handleGeo = new THREE.BoxGeometry(0.02, 0.02, 0.22);
        const handle = new THREE.Mesh(handleGeo, mats.blackAccent);
        handle.position.set(vx, h * 0.8 + 0.16, d / 2 - 0.02);
        group.add(handle);
      });
      break;
    }

    // 5. REFRIGERATED SALADETTE (Stół chłodniczy z nadstawą sałatkową GN)
    case 'saladette_table': {
      // Lower refrigerated counter
      const tableH = 0.85;
      const tGeo = new THREE.BoxGeometry(w, tableH, d);
      const table = new THREE.Mesh(tGeo, baseMat);
      table.position.y = tableH / 2;
      group.add(table);

      // Polyethylene cutting board front
      const boardGeo = new THREE.BoxGeometry(w, 0.03, 0.22);
      const board = new THREE.Mesh(boardGeo, mats.stainless);
      board.position.set(0, tableH + 0.015, d / 2 - 0.11);
      group.add(board);

      // Raised GN container well
      const wellGeo = new THREE.BoxGeometry(w - 0.08, 0.18, d - 0.26);
      const well = new THREE.Mesh(wellGeo, darkMat);
      well.position.set(0, tableH + 0.09, -0.1);
      group.add(well);

      // Glass sneeze guard cover
      const glassGeo = new THREE.BoxGeometry(w - 0.06, 0.22, 0.01);
      const glass = new THREE.Mesh(glassGeo, mats.glass);
      glass.position.set(0, tableH + 0.2, 0.02);
      group.add(glass);
      break;
    }

    // 6. UPRIGHT REFRIGERATOR / DRINK SHOWCASE
    case 'fridge_tall':
    case 'glass_showcase': {
      const isGlass = model.threeType === 'glass_showcase';
      const fGeo = new THREE.BoxGeometry(w, h, d);
      const fMesh = new THREE.Mesh(fGeo, isGlass ? mats.stainlessDark : baseMat);
      fMesh.position.y = h / 2;
      group.add(fMesh);

      if (isGlass) {
        // Transparent glass door panel
        const doorGeo = new THREE.BoxGeometry(w - 0.1, h - 0.3, 0.02);
        const door = new THREE.Mesh(doorGeo, mats.glass);
        door.position.set(0, h / 2, d / 2 + 0.01);
        group.add(door);

        // Shelves visible inside
        [0.4, 0.8, 1.2].forEach((sy) => {
          const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.02, d - 0.1), mats.stainless);
          shelf.position.set(0, sy, 0);
          group.add(shelf);
        });
      } else {
        // Vertical chrome door handle
        const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6);
        const handle = new THREE.Mesh(handleGeo, mats.chromeWheel);
        handle.position.set(w / 2 - 0.08, h / 2, d / 2 + 0.02);
        group.add(handle);
      }
      break;
    }

    // 7. KEBAB / GYROS ROTISSERIE
    case 'kebab_machine': {
      // Base housing with motor
      const baseGeo = new THREE.BoxGeometry(w, 0.2, d);
      const base = new THREE.Mesh(baseGeo, darkMat);
      base.position.y = 0.1;
      group.add(base);

      // Vertical back radiant panels
      const radGeo = new THREE.BoxGeometry(w * 0.7, h - 0.28, 0.12);
      const radiant = new THREE.Mesh(radGeo, mats.blackAccent);
      radiant.position.set(0, 0.2 + (h - 0.28) / 2, -d / 3);
      group.add(radiant);

      // Meat skewer spit (cylinder rotating)
      const spitGeo = new THREE.CylinderGeometry(0.015, 0.015, h - 0.2);
      const spit = new THREE.Mesh(spitGeo, mats.stainless);
      spit.position.set(0, h / 2, 0.05);
      group.add(spit);

      // Conical seasoned meat cone (procedural roasted kebab cylinder)
      const meatGeo = new THREE.CylinderGeometry(0.18, 0.12, h * 0.55, 16);
      const meatMat = new THREE.MeshStandardMaterial({
        color: 0x9a3412,
        roughness: 0.9,
      });
      const meat = new THREE.Mesh(meatGeo, meatMat);
      meat.position.set(0, 0.35 + (h * 0.55) / 2, 0.05);
      group.add(meat);
      break;
    }

    // 8. PIZZA OVEN (Piec szamotowy)
    case 'pizza_oven': {
      const ovenGeo = new THREE.BoxGeometry(w, h, d);
      const oven = new THREE.Mesh(ovenGeo, darkMat);
      oven.position.y = h / 2;
      group.add(oven);

      // Door opening with glass window
      const doorFrameGeo = new THREE.BoxGeometry(w * 0.75, h * 0.55, 0.04);
      const doorFrame = new THREE.Mesh(doorFrameGeo, baseMat);
      doorFrame.position.set(0, h / 2, d / 2 + 0.01);
      group.add(doorFrame);

      const glassWin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, h * 0.25, 0.02), mats.glass);
      glassWin.position.set(0, h / 2, d / 2 + 0.03);
      group.add(glassWin);

      // Thermometer dial & handle
      const thermoGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16);
      const thermo = new THREE.Mesh(thermoGeo, mats.stainless);
      thermo.rotation.x = Math.PI / 2;
      thermo.position.set(w * 0.3, h * 0.75, d / 2 + 0.02);
      group.add(thermo);
      break;
    }

    // 9. ESPRESSO COFFEE MACHINE (Ekspres kolbowy ciśnieniowy)
    case 'coffee_machine': {
      const machGeo = new THREE.BoxGeometry(w, h, d);
      const mach = new THREE.Mesh(machGeo, mats.blackAccent);
      mach.position.y = h / 2;
      group.add(mach);

      // Shiny stainless steel face plate
      const faceGeo = new THREE.BoxGeometry(w - 0.04, h * 0.7, 0.02);
      const face = new THREE.Mesh(faceGeo, baseMat);
      face.position.set(0, h * 0.45, d / 2 + 0.01);
      group.add(face);

      // 2 Portafilter groups (kolby do espresso)
      [-0.14, 0.14].forEach((px) => {
        const groupHead = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08), mats.chromeWheel);
        groupHead.position.set(px, h * 0.45, d / 2 + 0.06);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14), mats.blackAccent);
        handle.rotation.x = Math.PI / 2;
        handle.position.set(px, h * 0.42, d / 2 + 0.14);
        group.add(groupHead, handle);
      });

      // Cup warmer tray on top
      const cupTray = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.02, d - 0.1), mats.stainless);
      cupTray.position.set(0, h + 0.01, 0);
      group.add(cupTray);
      break;
    }

    // 10. WORKTABLES & STAINLESS STEEL CABINETS
    case 'worktable_open':
    case 'worktable_cabinet':
    case 'cool_counter_2door':
    case 'deep_sink':
    default: {
      // Main sturdy stainless steel body
      const mGeo = new THREE.BoxGeometry(w, h, d);
      const mMesh = new THREE.Mesh(mGeo, baseMat);
      mMesh.position.y = h / 2;
      group.add(mMesh);

      // Top work surface with back splash rim
      const splashGeo = new THREE.BoxGeometry(w, 0.06, 0.03);
      const splash = new THREE.Mesh(splashGeo, baseMat);
      splash.position.set(0, h + 0.03, -d / 2 + 0.015);
      group.add(splash);
      break;
    }
  }

  return group;
}
