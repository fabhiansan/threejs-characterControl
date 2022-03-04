import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { Manager } from "socket.io-client";
const manager = new Manager("http://localhost:2002");
const socket = manager.socket("/");

manager.open((error) => {
  if (error) {
    console.log("error", error);
  } else {
    console.log("connected to server");
  }
});

// setInterval(() => {
//   console.log("socketid", socket.connected);
//   console.log('socketid', socket.id);

//   // sending ping to socket server
//   socket.emit("ping", {
//     message: "ping",
//     socketid: socket.id,
//   });
  
// }, 2000);

class Player {
  constructor(game, options) {
    this.local = true;
    let model;
    // this.assetsPath = "./assets/";

    if (options === undefined) {
      const people = ["hhdancing", "woman"];
      model = people[Math.floor(Math.random() * people.length)];
    } else if (typeof options == "object") {
      this.local = false;
      this.options = options;
      this.id = options.id;
      model = options.model;
    } else {
      model = options;
    }

    this.model = model;
    this.game = game;
    this.animationsArray = game.animationsArray;

    const loader = new GLTFLoader();
    var player = this;

    loader.load(
      `${this.game.assetsPath}/gltf/${model}_out/${model}.gltf`,
      (gltf) => {
        player = gltf.scene;

        if (model == "hhdancing") {
          player.scale.set(100, 100, 100);
          player.applyMatrix(new THREE.Matrix4().makeTranslation(0, -50, 0));
        } else {
          player.scale.set(200, 200, 200);
          player.applyMatrix(new THREE.Matrix4().makeTranslation(0, -275, 0));
        }

        // console.log("model", gltf.scene);

        this.mixer = new THREE.AnimationMixer(gltf.scene);

        // console.log("gltfanimations", gltf.animations);

        player.animations = gltf.animations;
        this.game.animationsArray.unshift(...player.animations);

        player.object = new THREE.Object3D();
        player.object.position.set(0, 50, -300);
        player.object.add(player);

        this.object = player.object;
        if (player.deleted == undefined) game.scene.add(player.object);

        // console.log(init socket)

        if (this.local) {
          console.log("player local ga?");
          if (this.initSocket !== undefined) {
            console.log("init dong!");
            this.initSocket();
          }
        } else {
          const geometry = new THREE.BoxGeometry(100, 300, 100);
          const material = new THREE.MeshBasicMaterial({ visible: false });
          const box = new THREE.Mesh(geometry, material);
          box.name = "Collider";
          box.position.set(0, 150, 0);
          player.object.add(box);
          player.collider = box;
          player.object.userData.id = player.id;
          player.object.userData.remotePlayer = true;

          const players = game.initialisingPlayers.splice(
            game.initialisingPlayers.indexOf(this),
            1
          );
          game.remotePlayers.push(players[0]);
        }
      }
    );

    var joy3Param = { title: "joystick3" };
    this.Joy3 = new JoyStick("joy3Div", joy3Param);
  }

  update(dt) {
    this.mixer.update(dt);

    if (this.game.remoteData.length > 0) {
      let found = false;
      for (let data of this.game.remoteData) {
        if (data.id != this.id) continue;

        this.player.object.position.set(data.x, data.y, data.z);
        const euler = new THREE.Euler(data.pb, data.heading, data.pb);

        this.player.object.quaternion.setFromEuler(euler);
      }
      if (!found) this.game.removePlayer(this);
    }
  }
}

class PlayerLocal extends Player {
  constructor(game, model) {
    super(game, model);
    console.log("local player", this.player);
    this.socket = socket;

    socket.emit("ping", {
      message: "ping",
      socketid: socket.id,
    });
    // receive pong from server
    socket.on("pong", (data) => {
      console.log("pong", data);
    });
    

    socket.on("setId", (data) => {
      this.player.id = data.id;
      console.log("ID SET AS", data.id);
    });

    socket.on("remoteData", (data) => {
      game.remoteData = data;
      console.log("remote Data", data);
    });

    socket.on("deletePlayer", (data) => {
      const players = game.remotePlayers.filter((player) => {
        if (player.id == data.id) {
          return player;
        }
      });
      if (players.length > 0) {
        let index = game.remotePlayer.indexOf(players[0]);
        if (index != -1) {
          game.remotePlayer.splice(index, 1);
          game.scene.remove(players[0].wireframeBox);
        }
      } else {
        let index = game.initialisingPlayers.indexOf(data.id);
        if (index != -1) {
          const player = game.initialisingPlayers[index];
          player.deleted = true;
          game.initialisingPlayers.splice(index, 1);
        }
      }
    });

    this.socket = socket;
  }

  initSocket() {

    this.socket.emit("init", {
      model: this.model,
      x: game.player.object.position.x,
      y: game.player.object.position.y,
      z: game.player.object.position.z,
      pb: game.player.object.rotation.x,
      h: game.player.object.rotation.y,
    });
  }

  updateSocket() {
    if (this.socket !== undefined) {
      this.socket.emit("update", {
        x: game.player.object.position.x,
        y: game.player.object.position.y,
        z: game.player.object.position.z,
        pb: game.player.object.rotation.x,
        h: game.player.object.rotation.y,
      });
    }
  }

  playerControl(forward, turn, delta) {
    // console.log("playerControl", forward, turn);
    try {
      // console.log()
      // console.log("THIS GAME", this.game);

      const pos = this.object.position.clone();
      // console.log('pos', pos);
      let dir = new THREE.Vector3(0, 0, 0);

      // console.log(game.player.root)
      this.object.getWorldDirection(dir);
      // console.log('dir', dir)
      let raycaster = new THREE.Raycaster(pos, dir);
      let blocked = false;

      const colliders = this.game.colliders;

      if (colliders != undefined) {
        // console.log(game.colliders)
        let intersects = raycaster.intersectObjects(game.colliders);
        if (intersects.length > 0) {
          // console.log(intersects.length);
          if (intersects[0].distance < 30) {
            blocked = true;
          }
        }
      }

      if (Math.abs(forward) > 50 || Math.abs(turn) > 50) {
        this.doAction("run");
      } else if (
        (Math.abs(forward) > 1 && Math.abs(forward) < 50) ||
        (Math.abs(turn) > 1 && Math.abs(turn) < 50)
      ) {
        this.doAction("walk");
      } else {
        this.doAction("idle");
      }

      var angleYcameraDirection = Math.atan2(
        this.game.camera.position.x - this.object.position.x,
        this.game.camera.position.z - this.object.position.z
      );

      var diroffset = directionOffset3(forward, turn);
      // directionOffset(keyPressed) || directionOffset2(Joy3.GetDir());
      var pi2 = Math.PI / 2;
      this.game.rotateQuartenion.setFromAxisAngle(
        this.game.rotateAngel,
        diroffset + angleYcameraDirection + pi2
      );

      // console.log("rotateQuartenion", rotateQuartenion);
      this.object.quaternion.rotateTowards(this.game.rotateQuartenion, 0.1);

      if ((forward != 0 || turn != 0) && !blocked) {
        var walkDirection = new THREE.Vector3();

        this.game.camera.getWorldDirection(walkDirection);
        walkDirection.y = 0;
        walkDirection.normalize();
        walkDirection.applyAxisAngle(this.game.rotateAngel, diroffset);

        let moveX, moveZ;
        if (this.game.currentAction == "run") {
          moveX = walkDirection.x * 1000 * delta;
          moveZ = walkDirection.z * 1000 * delta;
        } else if (this.game.currentAction == "walk") {
          moveX = walkDirection.x * 500 * delta;
          moveZ = walkDirection.z * 500 * delta;
        }

        this.object.position.x -= moveZ;
        this.object.position.z += moveX;

        this.game.camera.position.x -= moveZ;
        this.game.camera.position.z += moveX;

        this.game.cameraTarget.x = this.object.position.x;
        this.game.cameraTarget.z = this.object.position.z;
        this.game.cameraTarget.y = this.object.position.y + 2;

        this.game.controls.target = this.game.cameraTarget;
      }
    } catch (error) {
      console.log(error);
    }
    // console.log("this", this);
    this.updateSocket();
  }

  doAction(name) {
    var actionClip;
    if (this.game.currentAction != name) {
      actionClip = this.mixer.clipAction(
        this.game.animationsArray.filter((clip) => clip.name == name)[0]
      );
      // actionClip.play();
      this.mixer
        .clipAction(
          this.animationsArray.filter((a) => a.name === game.currentAction)[0]
        )
        .fadeOut(0.3);

      actionClip.reset().fadeIn(0.3).play();
      this.game.currentAction = name;

      // console.log("animationArray[name]", actionClip);
      // console.log(
      //   "actionClip.reset().fadeIn(0.3).play();",
      //   actionClip.reset().fadeIn(0.3).play()
      // );
    }
  }
}

class Preloader {
  constructor(options) {
    this.assets = {};
    for (let asset of options.assets) {
      this.assets[asset] = { loaded: 0, complete: false };
      this.load(asset);
    }
    this.container = options.container;

    if (options.onprogress == undefined) {
      this.onprogress = onprogress;
      this.domElement = document.createElement("div");
      this.domElement.style.position = "absolute";
      this.domElement.style.top = "0";
      this.domElement.style.left = "0";
      this.domElement.style.width = "100%";
      this.domElement.style.height = "100%";
      this.domElement.style.background = "#000";
      this.domElement.style.opacity = "0.7";
      this.domElement.style.display = "flex";
      this.domElement.style.alignItems = "center";
      this.domElement.style.justifyContent = "center";
      this.domElement.style.zIndex = "1111";
      const barBase = document.createElement("div");
      barBase.style.background = "#aaa";
      barBase.style.width = "50%";
      barBase.style.minWidth = "250px";
      barBase.style.borderRadius = "10px";
      barBase.style.height = "15px";
      this.domElement.appendChild(barBase);
      const bar = document.createElement("div");
      bar.style.background = "#2a2";
      bar.style.width = "50%";
      bar.style.borderRadius = "10px";
      bar.style.height = "100%";
      bar.style.width = "0";
      barBase.appendChild(bar);
      this.progressBar = bar;
      if (this.container != undefined) {
        this.container.appendChild(this.domElement);
      } else {
        document.body.appendChild(this.domElement);
      }
    } else {
      this.onprogress = options.onprogress;
    }

    this.oncomplete = options.oncomplete;

    const loader = this;
    function onprogress(delta) {
      const progress = delta * 100;
      loader.progressBar.style.width = `${progress}%`;
    }
  }

  checkCompleted() {
    for (let prop in this.assets) {
      const asset = this.assets[prop];
      if (!asset.complete) return false;
    }
    return true;
  }

  get progress() {
    let total = 0;
    let loaded = 0;

    for (let prop in this.assets) {
      const asset = this.assets[prop];
      if (asset.total == undefined) {
        loaded = 0;
        break;
      }
      loaded += asset.loaded;
      total += asset.total;
    }

    return loaded / total;
  }

  load(url) {
    const loader = this;
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", url, true);
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {
        loader.assets[url].complete = true;
        if (loader.checkCompleted()) {
          if (loader.domElement != undefined) {
            if (loader.container != undefined) {
              loader.container.removeChild(loader.domElement);
            } else {
              document.body.removeChild(loader.domElement);
            }
          }
          loader.oncomplete();
        }
      }
    };
    xobj.onprogress = function (e) {
      const asset = loader.assets[url];
      asset.loaded = e.loaded;
      asset.total = e.total;
      loader.onprogress(loader.progress);
    };
    xobj.send(null);
  }
}

class Game {
  constructor() {
    this.modes = Object.freeze({
      NONE: Symbol("none"),
      PRELOAD: Symbol("preload"),
      INITIALISING: Symbol("initialising"),
      CREATING_LEVEL: Symbol("creatingLevel"),
      ACTIVE: Symbol("active"),
      GAMEOVER: Symbol("gameover"),
    });

    this.mode = this.modes.NONE;
    this.container;
    this.player;
    this.camera;
    this.scene;
    this.renderer;
    this.assetsPath = "/assets";

    this.controls;
    this.cameraTarget = new THREE.Vector3();
    this.rotateAngel = new THREE.Vector3(0, 1, 0);
    this.currentAction = "idle";
    this.animationsArray = [];
    // this.wireframeBox;
    this.clock = new THREE.Clock();
    this.rotateQuartenion = new THREE.Quaternion();

    this.mixer;

    this.remotePlayers = [];
    this.remoteColliders = [];
    this.initialisingPlayers = [];
    this.remoteData = [];

    this.messages = {
      text: ["Welcome", "Good Luck Have Fun"],
      index: 0,
    };

    this.container = document.createElement("div");
    this.container.style.height = "100%";
    document.body.appendChild(this.container);

    // const sfxExt = SFX.supportsAudioType("mp3") ? "mp3" : "ogg";

    const game = this;
    this.anims = ["idle", "walk", "run", "sdancing"];

    const options = {
      assets: [
        `${this.assetsPath}/images/nx.jpg`,
        `${this.assetsPath}/images/px.jpg`,
        `${this.assetsPath}/images/ny.jpg`,
        `${this.assetsPath}/images/py.jpg`,
        `${this.assetsPath}/images/nz.jpg`,
        `${this.assetsPath}/images/pz.jpg`,
      ],
      oncomplete: () => {
        game.init();
      },
    };

    this.anims.forEach((anim) => {
      options.assets.push(`./public/${anim}_out/${anim}.gltf`);
    });
    options.assets.push(`${game.assetsPath}/fbx/town.fbx`);

    this.mode = this.modes.PRELOAD;

    const preloader = new Preloader(options);

    window.onerror = (error) => {
      console.error(JSON.stringify(error));
    };
  }

  init() {
    this.mode = this.modes.INITIALISING;
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      10,
      200000
    );

    this.camera.position.set(0, 500, -500);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x00a0f0);

    const ambient = new THREE.AmbientLight(0xaaaaaa);
    this.scene.add(ambient);

    const light = new THREE.DirectionalLight(0xaaaaaa);
    light.position.set(30, 50, 40);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    const lightSize = 500;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = lightSize;
    light.shadow.camera.left = -lightSize;
    light.shadow.camera.right = lightSize;
    light.shadow.camera.bottom = -lightSize;
    light.shadow.camera.top = lightSize;

    light.shadow.bias = 0.0039;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    this.sun = light;
    this.scene.add(light);

    // load model
    const loader = new GLTFLoader();
    const game = this;
    this.player = new PlayerLocal(this);
    console.log("PLAYER", this.player);

    this.loadEnvirontment();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.scene.add(this.controls);

    this.controls.update();

    window.addEventListener(
      "resize",
      () => {
        game.onWindowResize();
      },
      false
    );
  }

  loadEnvirontment() {
    const game = this;
    const fbxLoader = new FBXLoader();
    fbxLoader.load(`/town.fbx`, (object) => {
      game.environment = object;
      game.colliders = [];
      game.scene.add(object);
      object.traverse((child) => {
        if (child.isMesh) {
          if (child.name.startsWith("proxy")) {
            game.colliders.push(child);
            child.material.visible = false;
          } else {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        }
      });

      const tloader = new THREE.CubeTextureLoader();
      tloader.setPath(`${game.assetsPath}/images/`);

      var textureCube = tloader.load([
        "px.jpg", // right
        "nx.jpg", // left
        "py.jpg", // top
        "ny.jpg", // bottom
        "pz.jpg", // back
        "nz.jpg", // front
      ]);

      game.scene.background = textureCube;

      game.loadNextAnim();
    });
  }

  loadNextAnim() {
    let anim = this.anims.pop();
    // console.log(anim);
    const game = this;
    const loader = new GLTFLoader();
    loader.load(`./public/${anim}_out/${anim}.gltf`, (gltf) => {
      this.animationsArray.push(...gltf.animations);
      if (game.anims.length > 0) {
        game.loadNextAnim();
      } else {
        delete game.anims;

        game.currentAction = "idle";
        game.mode = game.modes.ACTIVE;

        game.animate();
      }
    });
  }

  getMousePosition(clientX, clientY) {
    const pos = new THREE.Vector2();
    pos.x = (clientX / window.innerWidth) * 2 - 1;
    pos.y = -(clientY / window.innerHeight) * 2 + 1;
    return pos;
  }

  tap(evt) {
    if (!this.interactive) return;

    let clientX = evt.targetTouches ? evt.targetTouches[0].pageX : evt.clientX;
    let clientY = evt.targetTouches ? evt.targetTouches[0].pageY : evt.clientY;

    this.mouse = this.getMousePosition(clientX, clientY);
  }

  showMessage(msg, fontSize = 20, onOK = null) {
    const txt = document.getElementById("message_text");
    txt.innerHTML = msg;
    txt.style.fontSize = fontSize + "px";
    const btn = document.getElementById("message_ok");
    const panel = document.getElementById("message");
    const game = this;

    if (onOK != null) {
      btn.onclick = function () {
        panel.style.display = "none";
        onOK().call(game);
      };
    } else {
      btn.onclick = function () {
        panel.style.display = "none";
      };
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateRemotePlayers(dt) {
    if (
      this.remoteData === undefined ||
      this.remoteData.length == 0 ||
      this.player === undefined ||
      this.player.id === undefined
    )
      return;

    const newPlayers = [];
    const game = this;
    //Get all remotePlayers from remoteData array
    const remotePlayers = [];
    const remoteColliders = [];

    this.remoteData.forEach(function (data) {
      if (game.player.id != data.id) {
        //Is this player being initialised?
        let iplayer;
        game.initialisingPlayers.forEach(function (player) {
          if (player.id == data.id) iplayer = player;
        });
        //If not being initialised check the remotePlayers array
        if (iplayer === undefined) {
          let rplayer;
          game.remotePlayers.forEach(function (player) {
            if (player.id == data.id) rplayer = player;
          });
          if (rplayer === undefined) {
            //Initialise player
            game.initialisingPlayers.push(new Player(game, data));
          } else {
            //Player exists
            remotePlayers.push(rplayer);
            remoteColliders.push(rplayer.collider);
          }
        }
      }
    });

    this.scene.children.forEach(function (object) {
      if (
        object.userData.remotePlayer &&
        game.getRemotePlayerById(object.userData.id) == undefined
      ) {
        game.scene.remove(object);
      }
    });

    this.remotePlayers = remotePlayers;
    this.remoteColliders = remoteColliders;
    this.remotePlayers.forEach(function (player) {
      player.update(dt);
    });
  }

  animate() {
    const game = this;
    const dt = this.clock.getDelta();

    // console.log('animate!')

    requestAnimationFrame(() => {
      game.animate();
    });

    if (this.player.mixer != undefined && this.mode == this.modes.ACTIVE) {
      this.player.mixer.update(dt);
    }

    if (this.mode == this.modes.ACTIVE) {
      this.player.playerControl(
        this.player.Joy3.GetY(),
        this.player.Joy3.GetX(),
        dt
      );
    }

    this.renderer.render(this.scene, this.camera);

    this.controls.update();
  }
}

var game = new Game();
// console.log(game);

// var joy3Param = { title: "joystick3" };
// var Joy3 = new JoyStick("joy3Div", joy3Param);
// var x, y;

// setInterval(function () {
//   x = Joy3.GetX();
// }, 1000 / 60);
// setInterval(function () {
//   y = Joy3.GetY();
// }, 1000 / 60);

// setInterval(() => {
//   // playerControl(y, x);
//   // console.log(y,x);
// }, 1000 / 60);

var pos;
let intersects;

function doAction(name) {
  var actionClip;

  if (game.currentAction != name) {
    actionClip = game.mixer.clipAction(
      game.animationsArray.filter((clip) => clip.name == name)[0]
    );
    // actionClip.play();
    game.mixer
      .clipAction(
        game.animationsArray.filter((a) => a.name === game.currentAction)[0]
      )
      .fadeOut(0.3);

    actionClip.reset().fadeIn(0.3).play();
    game.currentAction = name;

    // console.log("animationArray[name]", actionClip);
    // console.log(
    //   "actionClip.reset().fadeIn(0.3).play();",
    //   actionClip.reset().fadeIn(0.3).play()
    // );
  }
}

var directionOffset3 = (forward, turn) => {
  // turn = -turn;
  var diroffset = Math.PI / 2;
  if (forward != 0 && turn != 0) {
    // diroffset = Math.atan(forward / turn);
    diroffset = Math.atan2(forward, turn);
  }

  return diroffset;
};

// console.log(game.player);

// function playerControl(forward, turn) {
//   if (game.player) {
//     try {
//       pos = game.wireframeBox.position.clone();
//       // console.log('pos', pos);
//       let dir = new THREE.Vector3(0, 0, 0);

//       // console.log(game.player.root)
//       game.wireframeBox.getWorldDirection(dir);
//       // console.log('dir', dir)
//       let raycaster = new THREE.Raycaster(pos, dir);
//       let blocked = false;

//       if (game.colliders) {
//         // console.log(game.colliders)
//         let intersects = raycaster.intersectObjects(game.colliders);
//         if (intersects.length > 0) {
//           // console.log(intersects.length);
//           if (intersects[0].distance < 30) {
//             console.log("blocked");
//             blocked = true;
//             console.log("blocked by " + intersects[0].object.name);
//           }
//         }
//       }

//       //   intersects = raycaster.intersectObjects([wallMesh, hotelobj]);
//       //   // let intersects = []

//       //   if (intersects.length > 0) {
//       //     if (intersects[0].distance < 2) {
//       //       console.log(intersects);
//       //       blocked = true;
//       //       console.log("blocked by " + intersects[0].object.name);
//       //     }
//       //   }
//       // }
//       // function doAction(mixer, name, animationArray, currentAction) {
//       if (Math.abs(forward) > 50 || Math.abs(turn) > 50) {
//         doAction("run");
//       } else if (
//         (Math.abs(forward) > 1 && Math.abs(forward) < 50) ||
//         (Math.abs(turn) > 1 && Math.abs(turn) < 50)
//       ) {
//         doAction("walk");
//       } else {
//         doAction("idle");
//       }

//       var angleYcameraDirection = Math.atan2(
//         game.camera.position.x - game.wireframeBox.position.x,
//         game.camera.position.z - game.wireframeBox.position.z
//       );

//       var diroffset = directionOffset3(forward, turn);
//       // directionOffset(keyPressed) || directionOffset2(Joy3.GetDir());
//       var pi2 = Math.PI / 2;
//       game.rotateQuartenion.setFromAxisAngle(
//         game.rotateAngel,
//         diroffset + angleYcameraDirection + pi2
//       );

//       // console.log("rotateQuartenion", rotateQuartenion);
//       game.wireframeBox.quaternion.rotateTowards(game.rotateQuartenion, 0.1);

//       if ((forward != 0 || turn != 0) && !blocked) {
//         var walkDirection = new THREE.Vector3();

//         game.camera.getWorldDirection(walkDirection);
//         walkDirection.y = 0;
//         walkDirection.normalize();
//         walkDirection.applyAxisAngle(game.rotateAngel, diroffset);

//         let moveX, moveZ;
//         // if (currentAction == "run") {
//         //   moveX = walkDirection.x * delta * 500;
//         //   moveZ = walkDirection.z * delta * 500;
//         // } else if (currentAction == "walk") {
//         // moveX = walkDirection.x * game.clock.getDelta() * 500;
//         // moveZ = walkDirection.z * game.clock.getDelta() * 500;
//         if (game.currentAction == "run") {
//           moveX = walkDirection.x * 20;
//           moveZ = walkDirection.z * 20;
//         } else if (game.currentAction == "walk") {
//           moveX = walkDirection.x * 10;
//           moveZ = walkDirection.z * 10;
//         }
//         // console.log("walkdirection ", walkDirection.z);
//         // console.log("moveX", moveX);
//         // console.log("moveZ", moveZ);
//         // console.log("game.clock.getDelta()", game.clock.getDelta());
//         // } else {
//         //   moveX = 0;
//         //   moveZ = 0;
//         // }

//         game.wireframeBox.position.x -= moveZ;
//         game.wireframeBox.position.z += moveX;

//         game.camera.position.x -= moveZ;
//         game.camera.position.z += moveX;

//         game.cameraTarget.x = game.wireframeBox.position.x;
//         game.cameraTarget.z = game.wireframeBox.position.z;
//         game.cameraTarget.y = game.wireframeBox.position.y + 2;

//         game.controls.target = game.cameraTarget;
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   }
// }

// // class PlayerLocal extends Player {
// //   constructor(game, model) {
// //     super(game, model);

// //     const player = this;
// //     const socket = io.connect("http://localhost:2002");
// //   }
// // }

// console.log("io", io);
