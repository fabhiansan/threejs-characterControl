import { Scene, Color } from "three";

export function createScene() {
  const scene = new Scene();
  scene.background = new Color("#013220");
  return scene;
}
