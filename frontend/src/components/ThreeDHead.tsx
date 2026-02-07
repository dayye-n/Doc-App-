import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { REGIONS, getRegionForMesh, type RegionId } from "./regions";

interface ThreeDHeadProps {
  selectedRegion: RegionId | null;
  onSelect: (region: RegionId | null) => void;
}

const baseColor = "#cbd5e1";
const accent = "#0f766e";

type Hotspot = {
  id: RegionId;
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
};

const HeadModel = ({ selectedRegion, onSelect }: ThreeDHeadProps) => {
  const hotspots = useMemo<Hotspot[]>(
    () => [
      { id: "Nose", position: [0, 0.25, 0.9], scale: [0.12, 0.16, 0.16], color: "#f97316" },
      { id: "Left Ear", position: [-0.78, 0.25, 0], scale: [0.14, 0.24, 0.08], color: "#22c55e" },
      { id: "Right Ear", position: [0.78, 0.25, 0], scale: [0.14, 0.24, 0.08], color: "#22c55e" },
      { id: "Throat", position: [0, -0.2, 0.45], scale: [0.22, 0.14, 0.18], color: "#3b82f6" },
      { id: "Neck", position: [0, -0.55, 0], scale: [0.35, 0.3, 0.25], color: "#6366f1" },
    ],
    [],
  );

  return (
    <>
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshStandardMaterial color={baseColor} roughness={0.55} metalness={0.1} />
      </mesh>

      {/* Neck */}
      <mesh castShadow receiveShadow position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.35, 0.45, 0.5, 24]} />
        <meshStandardMaterial color="#b8c5d6" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* Hotspots */}
      {hotspots.map((spot) => (
        <mesh
          key={spot.id}
          position={spot.position}
          scale={spot.scale}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onSelect(spot.id);
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "default";
          }}
        >
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color={selectedRegion === spot.id ? accent : spot.color}
            transparent
            opacity={selectedRegion === spot.id ? 0.8 : 0.55}
            emissive={selectedRegion === spot.id ? accent : spot.color}
            emissiveIntensity={selectedRegion === spot.id ? 0.4 : 0.15}
          />
        </mesh>
      ))}
    </>
  );
};

const Controls = ({ target }: { target: Vector3 }) => {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 3.2;
    controls.target.copy(target);
    controls.update();
    return () => controls.dispose();
  }, [camera, gl, target]);
  useFrame(() => {
    // Keep controls in sync each frame
  });
  return null;
};

// Component to render a single interactive mesh with proper event handling
const InteractiveMeshComponent = ({
  mesh,
  region,
  selectedRegion,
  hoveredRegion,
  onSelect,
  onHover,
  originalMaterial,
}: {
  mesh: Mesh;
  region: RegionId;
  selectedRegion: RegionId | null;
  hoveredRegion: RegionId | null;
  onSelect: (region: RegionId | null) => void;
  onHover: (region: RegionId | null) => void;
  originalMaterial: MeshStandardMaterial;
}) => {
  const meshRef = useRef<Mesh>(null);
  const regionConfig = REGIONS.find((r) => r.id === region);

  // Update material based on state
  useEffect(() => {
    if (!meshRef.current || !regionConfig) return;

    // Priority: selected > hovered > original
    if (selectedRegion === region) {
      // Selected: dark blue (stays dark blue even when hovered)
      meshRef.current.material = new MeshStandardMaterial({
        color: regionConfig.selectedColor,
        emissive: regionConfig.selectedColor,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
        roughness: originalMaterial.roughness,
        metalness: originalMaterial.metalness,
      });
    } else if (hoveredRegion === region) {
      // Hovered: light blue (only if not selected)
      meshRef.current.material = new MeshStandardMaterial({
        color: regionConfig.hoverColor,
        emissive: regionConfig.hoverColor,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
        roughness: originalMaterial.roughness,
        metalness: originalMaterial.metalness,
      });
    } else {
      // Original material
      meshRef.current.material = originalMaterial.clone();
    }
  }, [selectedRegion, hoveredRegion, region, regionConfig, originalMaterial]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(region);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null);
    document.body.style.cursor = "default";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Toggle selection: if already selected, deselect
    if (selectedRegion === region) {
      onSelect(null);
    } else {
      onSelect(region);
    }
  };

  // Extract geometry and material from the mesh
  const geometry = mesh.geometry;
  const material = mesh.material instanceof MeshStandardMaterial ? mesh.material : originalMaterial;

  // Use the mesh's matrix to get the full transform
  const matrix = mesh.matrix.clone();
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  matrix.decompose(position, quaternion, scale);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      quaternion={quaternion}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      castShadow
      receiveShadow
    />
  );
};

// Component to render the model with interactive meshes
const InteractiveModel = ({
  model,
  modelScale,
  selectedRegion,
  hoveredRegion,
  onSelect,
  onHover,
}: {
  model: Group;
  modelScale: number;
  selectedRegion: RegionId | null;
  hoveredRegion: RegionId | null;
  onSelect: (region: RegionId | null) => void;
  onHover: (region: RegionId | null) => void;
}) => {
  const [interactiveMeshes, setInteractiveMeshes] = useState<Array<{ mesh: Mesh; region: RegionId; originalMaterial: MeshStandardMaterial }>>([]);
  const [useFallbackRegions, setUseFallbackRegions] = useState(false);
  const originalMaterials = useRef<Map<Mesh, MeshStandardMaterial>>(new Map());

  // Extract region meshes and store their properties
  useEffect(() => {
    if (!model) return;

    const meshes: Array<{ mesh: Mesh; region: RegionId; originalMaterial: MeshStandardMaterial }> = [];

    model.traverse((child) => {
      if (child instanceof Mesh) {
        const mesh = child as Mesh;
        const meshName = mesh.name || "";
        const region = getRegionForMesh(meshName);

        if (region) {
          // Store original material
          let originalMat: MeshStandardMaterial;
          if (mesh.material instanceof MeshStandardMaterial) {
            originalMat = mesh.material.clone();
          } else if (Array.isArray(mesh.material) && mesh.material[0] instanceof MeshStandardMaterial) {
            originalMat = mesh.material[0].clone();
          } else {
            // Fallback: create a default material
            originalMat = new MeshStandardMaterial({
              color: "#cbd5e1",
              roughness: 0.5,
              metalness: 0.1,
            });
          }
          
          // Update world matrix before cloning
          mesh.updateMatrixWorld();
          
          // Hide original mesh (we'll render interactive version instead)
          mesh.visible = false;
          
          // Clone mesh (preserves position, rotation, scale, geometry)
          const clonedMesh = mesh.clone();
          clonedMesh.material = originalMat;
          clonedMesh.visible = true;
          
          // Update the cloned mesh's matrix to match the world matrix
          clonedMesh.matrix.copy(mesh.matrixWorld);
          clonedMesh.matrix.decompose(clonedMesh.position, clonedMesh.quaternion, clonedMesh.scale);
          
          meshes.push({
            mesh: clonedMesh,
            region,
            originalMaterial: originalMat,
          });
        }
      }
    });

    if (meshes.length === 0) {
      // Store original material for the main mesh
      model.traverse((child) => {
        if (child instanceof Mesh) {
          if (child.material instanceof MeshStandardMaterial) {
            originalMaterials.current.set(child, child.material.clone());
          }
        }
      });
      setUseFallbackRegions(true);
    } else {
      setUseFallbackRegions(false);
    }
    setInteractiveMeshes(meshes);
  }, [model]);

  // Apply region-specific highlighting using shader-based approach
  useEffect(() => {
    if (!useFallbackRegions || !model) return;

    const mainMeshes: Mesh[] = [];
    model.traverse((child) => {
      if (child instanceof Mesh) {
        mainMeshes.push(child);
      }
    });

    if (mainMeshes.length === 0) return;

    const mainMesh = mainMeshes[0];
    const originalMat = originalMaterials.current.get(mainMesh);
    if (!originalMat) return;

    // Region center positions (local space, matching sphere positions)
    // These will be used in world space in the shader
    const noseY = 0.8;  // Higher
    const noseZ = 0.85;
    const baseRegionCenters: Record<RegionId, Vector3> = {
      "Nose": new Vector3(0, noseY, noseZ),
      "Left Ear": new Vector3(-1.3, noseY, noseZ),  // LEFT side, same height/depth as nose, further left
      "Right Ear": new Vector3(1.3, noseY, noseZ),   // RIGHT side, same height/depth as nose, further right
      "Neck": new Vector3(0, -0.45, 0.25),          // More spacing from throat
      "Throat": new Vector3(0, -0.8, 0.4),          // Lower, more spacing from neck
    };
    
    // Transform to world space accounting for model scale and position
    const regionCenters: Record<RegionId, Vector3> = {} as any;
    model.updateMatrixWorld(true);
    const modelWorldMatrix = model.matrixWorld.clone();
    
    Object.keys(baseRegionCenters).forEach((key) => {
      const regionId = key as RegionId;
      const localPos = baseRegionCenters[regionId].clone();
      // Apply model's world transform (includes scale)
      localPos.applyMatrix4(modelWorldMatrix);
      regionCenters[regionId] = localPos;
    });

    const regionRadii: Record<RegionId, number> = {
      "Nose": 0.4,      // Wider, more general highlighting
      "Left Ear": 0.4,  // Wider, more general highlighting
      "Right Ear": 0.4, // Wider, more general highlighting
      "Throat": 0.5,    // Wider, more general highlighting
      "Neck": 0.5,      // Wider, more general highlighting
    };

    // Get the active region (selected takes priority over hovered)
    const activeRegion = selectedRegion || hoveredRegion;
    const regionConfig = activeRegion ? REGIONS.find((r) => r.id === activeRegion) : null;

    if (activeRegion && regionConfig) {
      const center = regionCenters[activeRegion].clone();
      // Scale radius by model scale to match the scaled geometry
      const baseRadius = regionRadii[activeRegion];
      const radius = baseRadius * modelScale;
      const highlightColor = selectedRegion ? regionConfig.selectedColor : regionConfig.hoverColor;
      const intensity = selectedRegion ? 0.8 : 0.6;  // Increased for more prominence

      // Create a custom shader material that highlights based on distance from region center
      // IMPORTANT: Create new material each time to force recompilation
      const shaderMaterial = new MeshStandardMaterial({
        color: originalMat.color.clone(),
        roughness: originalMat.roughness,
        metalness: originalMat.metalness,
      });
      
      // Store original onBeforeCompile if it exists
      const originalOnBeforeCompile = shaderMaterial.onBeforeCompile;
      
      shaderMaterial.onBeforeCompile = (shader: any, renderer: any) => {
        // Call original if it exists
        if (originalOnBeforeCompile) {
          originalOnBeforeCompile(shader, renderer);
        }

        // Add our uniforms
        if (!shader.uniforms) shader.uniforms = {};
        shader.uniforms.regionCenter = { value: center.clone() };
        shader.uniforms.regionRadius = { value: radius };
        shader.uniforms.highlightColor = { value: highlightColor.clone() };
        shader.uniforms.highlightIntensity = { value: intensity };

        // Modify vertex shader to pass world position
        shader.vertexShader = `
          uniform vec3 regionCenter;
          varying vec3 vWorldPosition;
          ${shader.vertexShader}
        `.replace(
          `#include <worldpos_vertex>`,
          `
          #include <worldpos_vertex>
          vWorldPosition = worldPosition.xyz;
          `
        );

        // Modify fragment shader to add highlight - make it more visible
        shader.fragmentShader = `
          uniform vec3 regionCenter;
          uniform float regionRadius;
          uniform vec3 highlightColor;
          uniform float highlightIntensity;
          varying vec3 vWorldPosition;
          ${shader.fragmentShader}
        `.replace(
          `#include <dithering_fragment>`,
          `
          // Calculate distance from region center
          float dist = length(vWorldPosition - regionCenter);
          float influence = 1.0 - smoothstep(0.0, regionRadius * 1.8, dist);
          influence = pow(influence, 0.5); // Much wider, more general highlighting
          
          // Apply highlight - make it more general and visible
          vec3 highlight = highlightColor * influence * highlightIntensity * 2.5;
          gl_FragColor.rgb = gl_FragColor.rgb + highlight;
          
          #include <dithering_fragment>
          `
        );
      };

      // Force material update and ensure it's applied
      if (mainMesh.material && 'dispose' in mainMesh.material) {
        (mainMesh.material as any).dispose();
      }
      mainMesh.material = shaderMaterial;
      if (mainMesh.material instanceof MeshStandardMaterial) {
        mainMesh.material.needsUpdate = true;
      }
      
      // Also update the mesh to trigger render
      mainMesh.updateMatrixWorld(true);
    } else {
      // Restore original material
      mainMesh.material = originalMat.clone();
      if (mainMesh.material instanceof MeshStandardMaterial) {
        mainMesh.material.needsUpdate = true;
      }
    }
  }, [useFallbackRegions, model, selectedRegion, hoveredRegion, modelScale]);

  // Fallback: Create approximate interactive regions using invisible spheres
  // This is used when the model doesn't have separate meshes for each region
  const FallbackRegions = () => {
    if (!useFallbackRegions) return null;

    // Approximate positions for regions on a head model (relative to model center)
    // For LeePerrySmith model - adjust these based on actual model dimensions
    // Left/Right are from the model's perspective (left = negative X, right = positive X)
    // Z is forward/back (positive Z = forward toward camera, negative Z = back)
    // Y is up/down (positive Y = up, negative Y = down)
    const noseY = 0.8;  // Higher
    const noseZ = 0.85;
    const regionPositions: Record<RegionId, [number, number, number]> = {
      "Nose": [0, noseY, noseZ],                    // Center, high, forward (nose tip)
      "Left Ear": [-1.3, noseY, noseZ],            // LEFT side, same height/depth as nose, further left
      "Right Ear": [1.3, noseY, noseZ],             // RIGHT side, same height/depth as nose, further right
      "Neck": [0, -0.45, 0.25],                     // More spacing from throat
      "Throat": [0, -0.8, 0.4],                     // Lower, more spacing from neck
    };

    const regionSizes: Record<RegionId, number> = {
      "Nose": 0.18,      // Smaller clickable area to prevent overlap
      "Left Ear": 0.18,  // Smaller clickable area to prevent overlap
      "Right Ear": 0.18, // Smaller clickable area to prevent overlap
      "Throat": 0.2,     // Smaller clickable area to prevent overlap
      "Neck": 0.2,       // Smaller clickable area to prevent overlap
    };

    return (
      <>
        {REGIONS.map((regionConfig) => {
          const region = regionConfig.id;
          const position = regionPositions[region];
          const size = regionSizes[region];
          
          return (
            <mesh
              key={region}
              position={position}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                onHover(region);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                onHover(null);
                document.body.style.cursor = "default";
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                if (selectedRegion === region) {
                  onSelect(null);
                } else {
                  onSelect(region);
                }
              }}
            >
              <sphereGeometry args={[size, 16, 16]} />
              <meshStandardMaterial
                visible={false}
                transparent
                opacity={0}
                color={selectedRegion === region ? "#0b4da2" : hoveredRegion === region ? "#7ec8ff" : "#ff0000"}
                wireframe={false}
              />
            </mesh>
          );
        })}
      </>
    );
  };

  return (
    <group scale={[modelScale, modelScale, modelScale]}>
      {/* Render interactive meshes with hover/click handlers */}
      {interactiveMeshes.map(({ mesh, region, originalMaterial }) => (
        <InteractiveMeshComponent
          key={`${mesh.uuid}-${region}`}
          mesh={mesh}
          region={region}
          selectedRegion={selectedRegion}
          hoveredRegion={hoveredRegion}
          onSelect={onSelect}
          onHover={onHover}
          originalMaterial={originalMaterial}
        />
      ))}
      
      {/* Render non-region meshes (original model, but region meshes are hidden) */}
      <primitive object={model} />
      
      {/* Fallback regions for single-mesh models */}
      <FallbackRegions />
    </group>
  );
};

const ThreeDHead = ({ selectedRegion, onSelect }: ThreeDHeadProps) => {
  const [model, setModel] = useState<Group | null>(null);
  const [modelScale, setModelScale] = useState(1.1);
  const [controlsTarget, setControlsTarget] = useState<Vector3>(new Vector3(0, 0.05, 0));
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0.35, 0.25, 2.1]);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      "/head.glb",
      (gltf) => {
        const cloned = gltf.scene.clone(true) as Group;
        
        cloned.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        const box = new Box3().setFromObject(cloned);
        const center = new Vector3();
        const size = new Vector3();
        box.getCenter(center);
        box.getSize(size);
        // Recenter model on origin
        cloned.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.6 / maxDim;
        setModelScale(scale);
        setControlsTarget(new Vector3(0, size.y * 0.05 * scale, 0));
        setCameraPos([0.35, size.y * 0.08 * scale + 0.1, 2.2]);
        setModel(cloned);
      },
      undefined,
      (err) => {
        console.error("Failed to load head.glb", err);
      },
    );
  }, []);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">3D Anatomy</p>
          <h3 className="text-lg font-semibold text-slate-900">Click a region on the 3D head</h3>
        </div>
        {selectedRegion && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {selectedRegion}
          </span>
        )}
      </div>
      <div className="mt-4 h-[380px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <Canvas shadows camera={{ position: cameraPos, fov: 45 }}>
          <color attach="background" args={["#f8fafc"]} />
          <Suspense fallback={null}>
            {model ? (
              <InteractiveModel
                model={model}
                modelScale={modelScale}
                selectedRegion={selectedRegion}
                hoveredRegion={hoveredRegion}
                onSelect={onSelect}
                onHover={setHoveredRegion}
              />
            ) : (
              <HeadModel selectedRegion={selectedRegion} onSelect={onSelect} />
            )}
          </Suspense>
          <ambientLight intensity={0.55} />
          <spotLight position={[8, 10, 6]} angle={0.35} penumbra={0.4} intensity={1.2} castShadow />
          <directionalLight position={[-4, 2, -6]} intensity={0.45} />
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
            <planeGeometry args={[8, 8]} />
            <shadowMaterial opacity={0.15} />
          </mesh>
          <Controls target={controlsTarget} />
        </Canvas>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
        {(["Nose", "Left Ear", "Right Ear", "Throat", "Neck"] as RegionId[]).map((r) => (
          <button
            key={r}
            onClick={() => onSelect(selectedRegion === r ? null : r)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              selectedRegion === r
                ? "border-primary bg-primary/10 text-primary"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThreeDHead;
