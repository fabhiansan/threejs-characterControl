import { PerspectiveCamera } from "three";

export function createCamera() {
  const camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
  );

  camera.position.set(0, 5, 10);

  return camera;
}
