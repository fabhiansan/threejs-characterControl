import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer, Vector3, Quaternion } from "three";

export class Model {
  constructor(modelPath, modelName, camera, controls) {
    this.modelPath = modelPath;
    this.modelName = modelName;
    this.mixer = null;
    this.currentAnimation = null;
    this.animationsMap = null;
    this.camera = camera;
    this.model = null;
    this.rotateAngel = new Vector3(0, 1, 0);
    this.rotateQuartenion = new Quaternion();
    this.play = "mixamo.com";
    this.cameraTarget = new Vector3();
    this.orbitControl = controls;
  }

  async load() {
    const loader = new GLTFLoader();
    var modelData = await loader.loadAsync(this.modelPath);

    this.model = modelData.scene;

    this.model.scale.set(1, 1, 1);
    this.model.position.set(0, 0, 0);

    var gltfAnimations = modelData.animations;
    console.log("gltfAnimations", gltfAnimations);
    this.animationsMap = new Map();
    this.mixer = new AnimationMixer(this.model);
    var _mixer = this.mixer;
    var _animationsMap = this.animationsMap;
    var _model = this.model;
    gltfAnimations.forEach((clip) => {
      this.animationsMap.set(clip.name, this.mixer.clipAction(clip));
    });

    return { _model, _animationsMap, _mixer };
  }

  update(delta, keyPressed, modelScene) {
    if (keyPressed.w || keyPressed.s || keyPressed.a || keyPressed.d) {
      this.play = "walk";
    } else {
      this.play = "mixamo.com";
    }

    if (this.play != this.currentAnimation) {
      const action = this.animationsMap.get(this.play);
      if (action) {
        if (this.currentAnimation) {
          this.animationsMap.get(this.currentAnimation).fadeOut(0.3);
        }
        this.currentAnimation = this.play;
        action.reset().fadeIn(0.5).play();
      }
    }

    this.mixer.update(delta);

    if (this.currentAnimation == "walk") {
      var angleYcameraDirection = Math.atan2(
        this.camera.position.x - modelScene.position.x,
        this.camera.position.z - modelScene.position.z
      );

      var directionOffset = this.directionOffset(keyPressed);

      // rotate model
      this.rotateQuartenion.setFromAxisAngle(
        this.rotateAngel,
        directionOffset + angleYcameraDirection
      );

      // console.log('rotateQuartenion', this.rotateQuartenion);

      // console.log(this.rotateQuartenion);
      // console.log('thismodel ', modelScene)
      modelScene.quaternion.rotateTowards(this.rotateQuartenion, 0.1);

      // calculate direction
      var walkDirection = new Vector3();


      this.camera.getWorldDirection(walkDirection);
      walkDirection.y = 0;
      walkDirection.normalize();
      walkDirection.applyAxisAngle(this.rotateAngel, directionOffset);

      // // move model
      const moveX = walkDirection.x * delta * 4;
      const moveZ = walkDirection.z * delta * 4;

      this.model.position.x -= moveX;
      this.model.position.z -= moveZ;

      this.updateCameraTarget(moveX, moveZ);
    }

    // this.model.body.needUpdate = true;
  }

  updateCameraTarget(moveX, moveZ) {
    // move camera target
    this.camera.position.x -= moveX;
    this.camera.position.z -= moveZ;

    // update camera target
    this.cameraTarget.x = this.model.position.x;
    this.cameraTarget.z = this.model.position.z;
    this.cameraTarget.y = this.model.position.y + 2;
    this.orbitControl.target = this.cameraTarget;
  }

  directionOffset(keyPressed) {
    var wa = Math.PI / 4;
    var wd = -Math.PI / 4;
    var sa = Math.PI / 4 + Math.PI / 2;
    var sd = -Math.PI / 4 - Math.PI / 2;
    var a = Math.PI / 2;
    var d = -Math.PI / 2;
    var s = Math.PI;
    var w = 0;

    var directionOffset = s;
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
  }
}

export async function addAnimation(
  animationPath,
  animationName,
  animationsMap,
  mixer
) {
  const loader = new GLTFLoader();
  const animation = await loader.loadAsync(animationPath);

  const animationClip = animation.animations;
  console.log("animationClip", animationClip);
  animationClip[0].name = animationName;
  animationsMap.set(animationName, mixer.clipAction(animationClip[0]));
}
