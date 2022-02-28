<script setup>
import * as THREE from "three";
import { createScene } from "./components/scene";
import { createCamera } from "./components/camera";
import { createLights } from "./components/light";
import { createControls } from "./components/controls";
import { createModel } from "./components/model";
import { Model, addAnimation } from "./components/modelClass";
// import Ammo from "ammojs-typed";


// console.log("ammo", Ammo);
// Ammo(Ammo).then(() => {
//   const v2 = new Ammo.btVector3(1, 2, 3); // <-- works
// });

var controls;
var camera, scene, renderer, mixer, clock;
var modelScene, model;
console.log("model", model);
init();
animate();

function init() {
  var penyanyi;
  console.log("penyanyi", penyanyi);
  scene = createScene();
  camera = createCamera();
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = createControls(camera, renderer.domElement);
  scene.add(controls);
  model = new Model("/hhdancing/hhdancing.gltf", "walker", camera, controls);
  camera.position.set(0, 10, 5);
  model.load().then((el) => {
    console.log("el", el);
    mixer = el._mixer;
    console.log(scene.add(el._model));
    modelScene = el._model;
    console.log("mixer", el._mixer);
    addAnimation("/walker/walks.gltf", "walk", el._animationsMap, el._mixer);
  });

  clock = new THREE.Clock();

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // light
  const { ambientLight, mainLight, helper } = createLights();
  scene.add(ambientLight, mainLight, helper);

  penyanyi = createModel(
    scene,
    "penyanyi",
    "./hhdancing/hhdancing.gltf",
    keyPressed
  );
}

function animate() {
  requestAnimationFrame(animate);

  var delta = clock.getDelta();
  // console.log("penyanyi", penyanyi);
  if (mixer && modelScene) {
    model.update(delta, keyPressed, modelScene);
  }

  renderer.render(scene, camera);
  controls.update();
  // load();
}

animate();

var keyPressed = {
  x: false,
  c: false,
  w: false,
  a: false,
  s: false,
  d: false,
};

document.addEventListener("keydown", (e) => {
  if (e.shiftKey) {
    // togle
    const tombol = e.key.toLocaleLowerCase();
    keyPressed[tombol] = true;
    const dokumen = document.getElementById(`${tombol}`);
    dokumen.style.color = "red";
  } else {
    console.log("e", e);
    const tombol = e.key.toLocaleLowerCase();
    keyPressed[tombol] = true;
    console.log(keyPressed);

    // console.log("e", e);
    const dokumen = document.getElementById(`${tombol}`);
    dokumen.style.color = "red";
  }
});

document.addEventListener("keyup", (e) => {
  const tombol = e.key.toLocaleLowerCase();
  keyPressed[tombol] = false;
  const dokumen = document.getElementById(`${tombol}`);
  dokumen.style.color = "white";
  // console.log(dokumen);
});
</script>

<template>
  <component :is="script" src="../public/ammo/ammo.js" async></component>
  <main>
    <div id="key">
      <div id="a">a</div>
      <div id="d">d</div>
      <div id="w">w</div>
      <div id="s">s</div>
      <div id="c">c</div>
      <div id="x">x</div>
    </div>
  </main>
</template>

<style>
@import "./assets/base.css";

#d {
  position: fixed;
  top: 5%;
  left: 30%;
  z-index: 1;
}

#s {
  position: fixed;
  top: 5%;
  left: 20%;

  z-index: 1;
}

#w {
  position: fixed;
  top: 0%;
  left: 20%;

  z-index: 1;
}

#shift {
  position: fixed;
  top: 5%;
  left: 0%;

  z-index: 1;
}

#a {
  position: fixed;
  top: 5%;
  left: 10%;

  z-index: 1;
}

#app {
  max-width: 1280px;
  margin: 0 0;
  padding: 0;

  font-weight: normal;
}

body {
  margin: 0;
  padding: 0;
}

header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

a,
.green {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1);
  transition: 0.4s;
}

@media (hover: hover) {
  a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}

@media (min-width: 1024px) {
  body {
    display: flex;
    place-items: center;
  }

  #app {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0 2rem;
  }

  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  .logo {
    margin: 0 2rem 0 0;
  }
}
</style>
