/* eslint-disable no-undef */
import * as THREE from "three";
import { createScene } from "./components/scene";
import { createCamera } from "./components/camera";
import { createLights } from "./components/light";
import { createControls } from "./components/controls";

import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// import { JoyStick } from "./src/components/toon3d";

let controls, scene, renderer, mixer;
let sphereBody, sphereMesh;
let groundBody = new CANNON.Body();
let planeMesh, planeMesh2, planeMesh3;
let groundBody2 = new CANNON.Body();
let groundBody3 = new CANNON.Body();
var cameraTarget = new THREE.Vector3();
var rotateAngel = new THREE.Vector3(0, 1, 0);
var rotateQuartenion = new THREE.Quaternion();
var animationsArray = [];
var player, wallMesh, obstacle;
// physics variables
const gravityConstant = -9.8;
let clock = new THREE.Clock();
var world, shape, body;
var currentAction;
var wireframeBox;
var backwards;
let camera = new THREE.PerspectiveCamera();


initCannon();
init();
animate();

function initCannon() {
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, gravityConstant, 0),
  });
}

var gltfModel, idle, sdancing, running, walking;

var hotel, hotelobj;
async function init() {
  gltfModel = await load("/hhdancing/hhdancing.gltf");
  console.log("gltfModel", gltfModel);

  idle = await load("/idle_out/idle.gltf");
  sdancing = await load("/sdancing_out/sdancing.gltf");
  running = await load("/run_out/run.gltf");
  walking = await load("/walk_out/walk.gltf");
  backwards = await load("/backwards_out/backwards.gltf");

  hotel = await load("city/1_out/1.gltf");

  animationsArray.push(...idle.animations);
  animationsArray.push(...sdancing.animations);
  animationsArray.push(...running.animations);
  animationsArray.push(...walking.animations);
  animationsArray.push(...backwards.animations);
  // console.log("animationsArray", animationsArray);
  // init scene
  scene = createScene();
  scene.fog = new THREE.Fog(0xffffff, 1, 1000);

  hotelobj = hotel.scene;
  hotelobj.scale.set(3, 3, 3);
  hotelobj.position.set(40, 0, 40);

  scene.add(hotelobj);
  camera = createCamera();
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  controls = createControls(camera, renderer.domElement);
  camera.position.set(0, 15, -30);
  
  
  const { ambientLight, mainLight, helper } = createLights();
  scene.add(mainLight, helper);

  
  // load gltf
  player = gltfModel.scene;
  player.animations = gltfModel.animations;
  animationsArray.unshift(...gltfModel.animations);
  // player.position.set(0, 1, 0);
  mixer = new THREE.AnimationMixer(player);
  // var root = mixer.getRoot();
  player.animations[0].name = "hhdancing";
  
  scene.add(controls);

  console.log("player", player);
  mixer
    .clipAction(
      animationsArray.filter((animationClip) => animationClip.name == "idle")[0]
    )
    .play();

  currentAction = "idle";
  console.log("mixer", mixer);

  shape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 0.5));
  body = new CANNON.Body({ mass: 1 });
  body.addShape(shape);
  body.position.set(0, 2, 0);
  body.angularDamping = 1;
  world.addBody(body);

  const BoxGeometry = new THREE.BoxGeometry(1, 4, 1);
  wireframeBox = new THREE.Mesh(
    BoxGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
  );
  wireframeBox.position.set(0, 2, 0);

  // var player2 = new THREE.Object3D();
  //   player2.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
  player.applyMatrix(new THREE.Matrix4().makeTranslation(0, -2, 0));
  wireframeBox.add(player);
  scene.add(wireframeBox);

  //grid helper
  const gridHelper = new THREE.GridHelper(100, 10);
  scene.add(gridHelper);

  // add ground plane
  const phongMaterial = new THREE.MeshLambertMaterial({
    color: "#555260",
  });

  const planeGeometry = new THREE.BoxGeometry(200, 1, 200);

  planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
  planeMesh.castShadow = true;
  planeMesh.receiveShadow = true;
  scene.add(planeMesh);
  planeMesh.receiveShadow = true;
  // scene.add(planeMesh);
  //ground physics
  groundBody = new CANNON.Body({
    mass: 0,
    material: new CANNON.Material("groundMaterial"),
    shape: new CANNON.Box(new CANNON.Vec3(100, 0.5, 100)),
  });

  obstacle = new CANNON.Body({
    mass: 0,
    material: new CANNON.Material("groundMaterial"),
    shape: new CANNON.Box(new CANNON.Vec3(4, 5, 4)),
  });
  obstacle.position.set(-10, 6, 10);

  const wall = new THREE.BoxGeometry(8, 10, 8);
  wallMesh = new THREE.Mesh(
    wall,
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
  );
  scene.add(wallMesh);

  world.addBody(groundBody);
  world.addBody(groundBody2);
  world.addBody(groundBody3);
  world.addBody(obstacle);
  // add sphere
  const radius = 1;
  const geometry = new THREE.CylinderGeometry(radius);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
  });
  sphereMesh = new THREE.Mesh(geometry, material);
  scene.add(sphereMesh);

  // add sphere physics
  sphereBody = new CANNON.Body({
    mass: 0.4,
    material: new CANNON.Material("sphereMaterial"),
    shape: new CANNON.Cylinder(radius),
    // quaternion:
  });
  sphereBody.position.set(-10, 10, 20);

  // sphereBody.angularDamping = 1;
  world.addBody(sphereBody);
}
var delta = clock.getDelta();
function updatePhysics() {
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);

  wireframeBox.position.copy(body.position);
  wireframeBox.quaternion.copy(body.quaternion);

  wallMesh.position.copy(obstacle.position);
  // player.position.copy(body.position);
}

// ANIMATE //////////////////////////////////
function animate() {
  requestAnimationFrame(animate);

  var delta = clock.getDelta();
  if (mixer !== undefined) mixer.update(delta);

  world.fixedStep();
  if (gltfModel && backwards) {
    updatePhysics();
    renderer.render(scene, camera);
    controls.update();
  }
}

// setting key pressed
var keyPressed = {
  x: false,
  c: false,
  w: false,
  a: false,
  s: false,
  d: false,
};

var keyIsPress = false;
document.addEventListener("keydown", (e) => {
  keyIsPress = true;
  if (e.shiftKey) {
    const tombol = e.key.toLocaleLowerCase();
    keyPressed[tombol] = true;
    const dokumen = document.getElementById(`${tombol}`);
    dokumen.style.color = "red";
  } else {
    console.log("e", e.key);

    if (e.key == "x") {
      console.log("e", e);
      body.velocity.set(0, 10, 0);
    }

    const tombol = e.key.toLocaleLowerCase();
    // console.log(keyPressed);

    // console.log("e", e);
    // console.log(e.key.toLocaleLowerCase());
    const dokumen = document.getElementById(`${tombol}`);

    dokumen.style.color = "red";
  }
});

document.addEventListener("keyup", (e) => {
  const tombol = e.key.toLocaleLowerCase();
  keyPressed[tombol] = false;
  const dokumen = document.getElementById(`${tombol}`);
  dokumen.style.color = "white";
  console.log(dokumen);
  keyIsPress = false;
});

async function load(path) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(path);
  return gltf;
}

var counter = 0;
function togleAnimations() {
  var arrlength = animationsArray.length;
  var action;
  if (counter < arrlength) {
    if (currentAction != animationsArray[counter].name) {
      action = mixer.clipAction(animationsArray[counter]);
      // console.log(action);
      mixer
        .clipAction(animationsArray.filter((a) => a.name === currentAction)[0])
        .fadeOut(0.3);
      // .stop();

      // player.stopAllAction();
      action.reset().fadeIn(0.3).play();
      currentAction = animationsArray[counter].name;
      counter++;
    }
  } else {
    counter = 0;

    if (currentAction != animationsArray[counter].name) {
      action = mixer.clipAction(animationsArray[counter]);

      mixer
        .clipAction(animationsArray.filter((a) => a.name === currentAction)[0])
        .fadeOut(0.3);

      action.reset().fadeIn(1).play();
      currentAction = animationsArray[counter].name;
      counter++;
    }
  }
}

document.getElementById("x").addEventListener("click", () => {
  togleAnimations();
});

function action(name) {
  var actionClip;
  if (currentAction != name) {
    actionClip = mixer.clipAction(
      animationsArray.filter((a) => a.name === name)[0]
    );

    mixer
      .clipAction(animationsArray.filter((a) => a.name === currentAction)[0])
      .fadeOut(0.3);

    actionClip.reset().fadeIn(0.3).play();
    currentAction = name;
  }
}

var joy3Param = { title: "joystick3" };
var Joy3 = new JoyStick("joy3Div", joy3Param);
var x,y;

setInterval(function () {
  x = Joy3.GetX();
}, 1000 / 60);
setInterval(function () {
  y = Joy3.GetY();
}, 1000 / 60);

setInterval(() => {
  playerControl(y, x);
}, 1000 / 60);

var pos;
let intersects;
function playerControl(forward, turn) {
  // raycasting

  // scene.add(
  //   new THREE.ArrowHelper(
  //     raycaster.ray.direction,
  //     raycaster.ray.origin,
  //     300,
  //     0xff0000
  //   )
  // );

  

  if (body) {
    pos = wireframeBox.position.clone();
    // console.log('pos', pos);
    let dir = new THREE.Vector3(0, 0, 0);

    player.getWorldDirection(dir);
    // console.log('dir', dir)
    let raycaster = new THREE.Raycaster(pos, dir);
    let blocked = false;

    if (wallMesh) {
      // let intersects = raycaster.intersectObjects(wallMesh);
      intersects = raycaster.intersectObjects([wallMesh, hotelobj]);
      // let intersects = []
  
      if (intersects.length > 0) {
        if (intersects[0].distance < 2) {
          console.log(intersects);
          blocked = true;
          console.log("blocked by " + intersects[0].object.name);
        }
      }
    }

    if (Math.abs(forward) > 50 || Math.abs(turn) > 50) {
      action("run");
    } else if (
      (Math.abs(forward) > 0 && Math.abs(forward) < 50) ||
      (Math.abs(turn) > 0 && Math.abs(turn) < 50)
    ) {
      action("walk");
    } else {
      action("idle");
    }

    var angleYcameraDirection = Math.atan2(
      camera.position.x - body.position.x,
      camera.position.z - body.position.z
    );

    var diroffset = directionOffset3(forward, turn);
    // directionOffset(keyPressed) || directionOffset2(Joy3.GetDir());
    var pi2 = Math.PI / 2;
    rotateQuartenion.setFromAxisAngle(
      rotateAngel,
      diroffset + angleYcameraDirection + pi2
    );

    // console.log("rotateQuartenion", rotateQuartenion);
    player.quaternion.rotateTowards(rotateQuartenion, 0.1);

    if ((forward != 0 || turn != 0) && !blocked) {
      var walkDirection = new THREE.Vector3();

      camera.getWorldDirection(walkDirection);
      walkDirection.y = 0;
      walkDirection.normalize();
      walkDirection.applyAxisAngle(rotateAngel, diroffset);

      const moveX = walkDirection.x * delta * 1000;
      const moveZ = walkDirection.z * delta * 1000;

      body.position.x -= moveZ;
      body.position.z += moveX;

      camera.position.x -= moveZ;
      camera.position.z += moveX;

      cameraTarget.x = body.position.x;
      cameraTarget.z = body.position.z;
      cameraTarget.y = body.position.y + 2;

      controls.target = cameraTarget;
    }

    // if (keyPressed.x) {
    //   body.velocity.set(0, 5, 0);
    // }
  }

  // console.log(delta)

  // cameraTarget.y = sphereBody.position.y + 10;

  //   if (turn > 0) {
  //     console.log("turn right", turn);
  //     player.position.z += forward * 0.005
  //     player.position.x += turn * 0.005
  //   } else if (turn < 0) {
  //     console.log("turn left", turn);
  //     player.position.z += forward * 0.005
  //     player.position.x += turn * 0.005
  //   }
  // } else if (forward < 0) {
  //   console.log("backward", forward);

  //   if (turn > 0) {
  //     console.log("turn right", turn);
  //     player.position.z += forward * 0.005
  //     player.position.x += turn * 0.005
  //   } else if (turn < 0) {
  //     console.log("turn left", turn);
  //     player.position.z += forward * 0.005
  //     player.position.x += turn * 0.005
  //   }
  // } else {
  //   console.log("idle");
  // }
}

var directionOffset2 = (dir) => {
  var directionOffset = 0;

  if (dir == "C") {
    directionOffset = Math.PI / 2;
  } else if (dir == "N") {
    directionOffset = Math.PI / 2;
  } else if (dir == "NE") {
    directionOffset = Math.PI / 4;
  } else if (dir == "E") {
    directionOffset = 0;
  } else if (dir == "SE") {
    directionOffset = (7 * Math.PI) / 4;
  } else if (dir == "S") {
    directionOffset = (3 * Math.PI) / 2;
  } else if (dir == "SW") {
    directionOffset = (5 / 4) * Math.PI;
  } else if (dir == "W") {
    directionOffset = Math.PI;
  } else if (dir == "NW") {
    directionOffset = (3 / 4) * Math.PI;
  }

  console.log("directionOffset", directionOffset);
  return directionOffset;
};

var directionOffset = (keyPressed) => {
  var directionOffset = s;
  var wa = Math.PI / 4;
  var wd = -Math.PI / 4;
  var sa = Math.PI / 4 + Math.PI / 2;
  var sd = -Math.PI / 4 - Math.PI / 2;
  var a = Math.PI / 2;
  var d = -Math.PI / 2;
  var s = Math.PI;
  var w = 0;

  if (keyPressed.w) {
    if (keyPressed.a) {
      directionOffset = sd;
    } else if (keyPressed.d) {
      directionOffset = sa;
    }
  } else if (keyPressed.s) {
    if (keyPressed.a) {
      directionOffset = wd;
    } else if (keyPressed.d) {
      directionOffset = wa;
    } else {
      directionOffset = w;
    }
  } else if (keyPressed.a) {
    directionOffset = d;
  } else if (keyPressed.d) {
    directionOffset = a;
  }

  return directionOffset;
};

var directionOffset3 = (forward, turn) => {
  // turn = -turn;
  var diroffset = Math.PI / 2;
  if (forward != 0 && turn != 0) {
    // diroffset = Math.atan(forward / turn);
    diroffset = Math.atan2(forward, turn);
  }

  return diroffset;
};
