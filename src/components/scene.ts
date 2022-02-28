import { Scene, Color } from "three";

export function createScene() {
  const scene = new Scene();
  scene.background = new Color("#33d2f6");
  return scene;
}
