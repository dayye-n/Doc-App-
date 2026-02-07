import { Color } from "three";

export type RegionId = "Nose" | "Left Ear" | "Right Ear" | "Throat" | "Neck";

export interface RegionConfig {
  id: RegionId;
  // Possible mesh names in the GLB file (try these in order)
  meshNames: string[];
  // Colors for highlighting
  hoverColor: Color;
  selectedColor: Color;
}

// Colors: hover #7EC8FF (light blue), selected #0B4DA2 (dark blue)
const HOVER_COLOR = new Color(0x7ec8ff);
const SELECTED_COLOR = new Color(0x0b4da2);

export const REGIONS: RegionConfig[] = [
  {
    id: "Nose",
    meshNames: ["nose", "Nose", "nose_mesh", "Nose_Mesh", "nasal", "Nasal"],
    hoverColor: HOVER_COLOR,
    selectedColor: SELECTED_COLOR,
  },
  {
    id: "Left Ear",
    meshNames: ["left_ear", "Left_Ear", "leftEar", "LeftEar", "ear_left", "Ear_Left", "earL", "EarL"],
    hoverColor: HOVER_COLOR,
    selectedColor: SELECTED_COLOR,
  },
  {
    id: "Right Ear",
    meshNames: ["right_ear", "Right_Ear", "rightEar", "RightEar", "ear_right", "Ear_Right", "earR", "EarR"],
    hoverColor: HOVER_COLOR,
    selectedColor: SELECTED_COLOR,
  },
  {
    id: "Throat",
    meshNames: ["throat", "Throat", "throat_mesh", "Throat_Mesh", "pharynx", "Pharynx"],
    hoverColor: HOVER_COLOR,
    selectedColor: SELECTED_COLOR,
  },
  {
    id: "Neck",
    meshNames: ["neck", "Neck", "neck_mesh", "Neck_Mesh", "cervical", "Cervical"],
    hoverColor: HOVER_COLOR,
    selectedColor: SELECTED_COLOR,
  },
];

/**
 * Find which region a mesh belongs to based on its name
 */
export function getRegionForMesh(meshName: string): RegionId | null {
  const normalizedName = meshName.toLowerCase().trim();
  for (const region of REGIONS) {
    if (region.meshNames.some((name) => normalizedName === name.toLowerCase())) {
      return region.id;
    }
  }
  // Also try partial matching for more flexibility
  for (const region of REGIONS) {
    if (region.meshNames.some((name) => normalizedName.includes(name.toLowerCase()))) {
      return region.id;
    }
  }
  return null;
}

/**
 * Get all mesh names that belong to a region
 */
export function getMeshNamesForRegion(regionId: RegionId): string[] {
  const region = REGIONS.find((r) => r.id === regionId);
  return region?.meshNames || [];
}
