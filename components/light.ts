import {
  DirectionalLight,
  PointLight,
  PointLightHelper,
  AmbientLight,
  DirectionalLightHelper,
} from "three";

function createLights() {
  const ambientLight = new AmbientLight(0x404040);

  const mainLight = new DirectionalLight(0xffffff, 2);
  mainLight.position.set(-60, 60, 60);

  const helper = new DirectionalLightHelper(mainLight, 5);

  const pointLight = new PointLight(0xff0000, 1, 100);
  pointLight.position.set(10, 10, 10);

  const sphereSize = 1;
  const pointLightHelper = new PointLightHelper(pointLight, sphereSize);

  return { ambientLight, mainLight, helper, pointLight, pointLightHelper };
}

export { createLights };
