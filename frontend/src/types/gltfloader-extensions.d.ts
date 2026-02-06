declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  import { Loader, LoadingManager, Object3D } from "three";

  export interface GLTF {
    scene: Object3D;
  }

  export class GLTFLoader extends Loader<GLTF> {
    constructor(manager?: LoadingManager);
    load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
  }
}

