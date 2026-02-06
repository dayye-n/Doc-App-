import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Color, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";

type RegionId = "Nose" | "Left Ear" | "Right Ear" | "Throat" | "Neck";
const regionOrder: RegionId[] = ["Nose", "Left Ear", "Right Ear", "Throat", "Neck"];

interface ThreeDHeadProps {
  selectedRegion: RegionId | null;
  onSelect: (region: RegionId) => void;
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

const ThreeDHead = ({ selectedRegion, onSelect }: ThreeDHeadProps) => {
  const [model, setModel] = useState<Group | null>(null);
  const [bbox, setBbox] = useState<{ center: Vector3; size: Vector3 } | null>(null);
  const [modelScale, setModelScale] = useState(1.1);
  const [controlsTarget, setControlsTarget] = useState<Vector3>(new Vector3(0, 0.05, 0));
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0.35, 0.25, 2.1]);
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const [regionData, setRegionData] = useState<
    { id: RegionId; position: Vector3; scale: Vector3; radius: number }[]
  >([]);

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
        // Recenter model on origin for easier hotspot math
        cloned.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.6 / maxDim;
        setModelScale(scale);
        setControlsTarget(new Vector3(0, size.y * 0.05 * scale, 0));
        setCameraPos([0.35, size.y * 0.08 * scale + 0.1, 2.2]);
        setModel(cloned);
        setBbox({ center: new Vector3(0, 0, 0), size });
      },
      undefined,
      (err) => {
        console.error("Failed to load head.glb", err);
      },
    );
  }, []);

  const bboxReady = bbox !== null;
  const hotspotPositions = useMemo(() => {
    if (!bboxReady || !bbox) return [];
    const { size } = bbox;
    const offsets: Record<RegionId, Vector3> = {
      Nose: new Vector3(0, size.y * 0.05, size.z * 0.45),
      "Left Ear": new Vector3(-size.x * 0.55, size.y * 0.1, 0),
      "Right Ear": new Vector3(size.x * 0.55, size.y * 0.1, 0),
      Throat: new Vector3(0, -size.y * 0.25, size.z * 0.15),
      Neck: new Vector3(0, -size.y * 0.45, 0),
    };
    const scales: Record<RegionId, Vector3> = {
      Nose: new Vector3(0.14, 0.16, 0.18),
      "Left Ear": new Vector3(0.16, 0.26, 0.12),
      "Right Ear": new Vector3(0.16, 0.26, 0.12),
      Throat: new Vector3(0.24, 0.16, 0.18),
      Neck: new Vector3(0.36, 0.32, 0.28),
    };
    const radii: Record<RegionId, number> = {
      Nose: size.z * 0.2,
      "Left Ear": size.x * 0.12,
      "Right Ear": size.x * 0.12,
      Throat: size.z * 0.18,
      Neck: size.y * 0.2,
    };
    const regions = Object.entries(offsets).map(([id, vec]) => ({
      id: id as RegionId,
      position: vec,
      scale: scales[id as RegionId],
      radius: radii[id as RegionId],
    }));
    setRegionData(regions);
    return regions;
  }, [bbox, bboxReady]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">3D Anatomy</p>
          <h3 className="text-lg font-semibold text-slate-900">Click a region on the 3D head</h3>
        </div>
        {selectedRegion && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{selectedRegion}</span>}
      </div>
      <div className="mt-4 h-[380px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <Canvas shadows camera={{ position: cameraPos, fov: 45 }}>
          <color attach="background" args={["#f8fafc"]} />
          <Suspense fallback={null}>
            {model ? (
              <primitive object={model} scale={[modelScale, modelScale, modelScale]} />
            ) : (
              <HeadModel selectedRegion={selectedRegion} onSelect={onSelect} />
            )}
            {hotspotPositions.map((spot) => (
              <mesh
                key={spot.id}
                position={spot.position.clone().multiplyScalar(modelScale * 1.02).toArray() as [number, number, number]}
                scale={[
                  spot.scale.x * modelScale,
                  spot.scale.y * modelScale,
                  spot.scale.z * modelScale,
                ]}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation();
                  onSelect(spot.id);
                }}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation();
                  setHovered(spot.id);
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  setHovered(null);
                  document.body.style.cursor = "default";
                }}
              >
                <sphereGeometry args={[1, 28, 28]} />
                <meshStandardMaterial
                  color={selectedRegion === spot.id ? accent : "#f59e0b"}
                  transparent
                  opacity={selectedRegion === spot.id || hovered === spot.id ? 0.32 : 0.14}
                  emissive={selectedRegion === spot.id ? accent : "#f59e0b"}
                  emissiveIntensity={selectedRegion === spot.id || hovered === spot.id ? 0.35 : 0.08}
                />
              </mesh>
            ))}
          </Suspense>
          <ambientLight intensity={0.55} />
          <spotLight position={[8, 10, 6]} angle={0.35} penumbra={0.4} intensity={1.2} castShadow />
          <directionalLight position={[-4, 2, -6]} intensity={0.45} />
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
            <planeGeometry args={[8, 8]} />
            <shadowMaterial opacity={0.15} />
          </mesh>
          <Controls target={controlsTarget} />
          {/* Apply shader-based highlight over the actual head geometry */}
          {model &&
            (() => {
              model.traverse((child) => {
                if ((child as Mesh).isMesh && (child as Mesh).material) {
                  const mesh = child as Mesh;
                  const mat = mesh.material as MeshStandardMaterial;
                  mat.onBeforeCompile = (shader) => {
                    shader.uniforms.regionCenters = {
                      value: regionData.map((r) => r.position.clone().multiplyScalar(modelScale)),
                    };
                    shader.uniforms.regionRadii = { value: regionData.map((r) => r.radius * modelScale) };
                    shader.uniforms.selectedIndex = {
                      value: selectedRegion ? regionOrder.indexOf(selectedRegion) : -1,
                    };
                    shader.uniforms.hoverIndex = { value: hovered ? regionOrder.indexOf(hovered) : -1 };
                    shader.uniforms.glowColor = { value: new Color(accent) };
                    shader.vertexShader = `
                      varying vec3 vWorldPosition;
                    ${shader.vertexShader}`.replace(
                      `#include <worldpos_vertex>`,
                      `
                      #include <worldpos_vertex>
                      vWorldPosition = worldPosition.xyz;
                      `,
                    );
                    shader.fragmentShader = `
                      uniform vec3 regionCenters[5];
                      uniform float regionRadii[5];
                      uniform int selectedIndex;
                      uniform int hoverIndex;
                      uniform vec3 glowColor;
                      varying vec3 vWorldPosition;
                    ${shader.fragmentShader}`.replace(
                      `#include <dithering_fragment>`,
                      `
                      float mask = 0.0;
                      for(int i=0; i<5; i++){
                        float dist = length(vWorldPosition - regionCenters[i]);
                        float r = regionRadii[i];
                        float influence = smoothstep(r, r*0.6, dist);
                        if(i == selectedIndex || i == hoverIndex){
                          mask = max(mask, 1.0 - influence);
                        }
                      }
                      vec3 glow = glowColor * mask * 0.75;
                      gl_FragColor.rgb += glow;
                      #include <dithering_fragment>
                      `,
                    );
                  };
                }
              });
              return null;
            })()}
        </Canvas>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
        {(["Nose", "Left Ear", "Right Ear", "Throat", "Neck"] as RegionId[]).map((r) => (
          <button
            key={r}
            onClick={() => onSelect(r)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              selectedRegion === r ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white hover:border-slate-300"
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
