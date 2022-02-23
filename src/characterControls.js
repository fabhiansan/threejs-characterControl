import * as THREE from "three";;

export class CharacterControls {
  
  toggleRun = false;
  currentAction = "";
  constructor(
    model,
    mixer,
    animationsMap,
    orbitControl,
    camera,
    currentAction
  ) {
    this.model = model;
    this.mixer = mixer;
    this.animationsMap = animationsMap;
    this.orbitControl = orbitControl;
    this.camera = camera;
    this.currentAction = currentAction;
    this.animationsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play();
      }
    });
  }

  // temporary data
  walkDirection = new THREE.Vector3();
  rotateAngel = new THREE.Vector3(0, 1, 0);
  rotateQuartenion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  // constants
  walkSpeed = 1.8;
  runSpeed = 4;
  fadeDuration = 0.3;

  switchRunToggle() {
    this.toggleRun = !this.toggleRun;
  }

  DIRECTIONS = ["w", "a", "s", "d"];
  update = (delta, keyPressed) => {
    const directionPressed = this.DIRECTIONS.some(
      (key) => keyPressed[key] == true
    );
    var play = "";
    if (keyPressed.w || keyPressed.s || keyPressed.a || keyPressed.d) {
      play = "walking";
    } else if (keyPressed.c) {
      play = "mixamo.com";
    } else if (keyPressed.x) {
      play = "jumping";
    } else if (keyPressed == 90) {
      play = "mixamo.com";
    } else {
      play = "idle";
    }

    if (play != this.currentAction) {
      const action = this.animationsMap.get(play);
      const currentAction = this.animationsMap.get(this.currentAction);

      currentAction.fadeOut(this.fadeDuration);
      action.reset().fadeIn(this.fadeDuration).play();

      this.currentAction = play;
    }

    this.mixer.update(delta);

    if (this.currentAction == "walking") {
      //calculate direction towards camera
      var angleYCameraDirection = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z
      );

      // movement
      var directionOffset = this.directionOffset(keyPressed);

      // rotate model
      this.rotateQuartenion.setFromAxisAngle(
        this.rotateAngel,
        angleYCameraDirection + directionOffset
        // directionOffset
      );

      console.log("rotateAngel", this.rotateAngel);
      console.log("directionOffset", directionOffset);
      console.log("angleYcameraDirection", angleYCameraDirection);

      // console.log("quartenion", this.rotateQuartenion);

      this.model.quaternion.rotateTowards(this.rotateQuartenion, 0.1);

      // calculate direction
      this.camera.getWorldDirection(this.walkDirection);
      this.walkDirection.y = 0;
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngel, directionOffset);

      // run/walk speen
      const speed = this.toggleRun ? this.runSpeed : this.walkSpeed;

      // move model
      const moveX = this.walkDirection.x * speed * delta;
      const moveZ = this.walkDirection.z * speed * delta;
      //   const moveX = this.model.body.appl;
      this.model.position.x -= moveX;

      // console.log("model position x : ", this.model.position.x);
      this.model.position.z -= moveZ;
      // console.log("model position z : ", this.model.position.z);

      this.model.body.needUpdate = true;
      // update camera target
      this.updateCameraTarget(moveX, moveZ);
    }
  };

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
    var directionOffset = Math.PI;

    // if (keyPressed.w) {
    //   if (keyPressed.a) {
    //     directionOffset = Math.PI / 4;
    //     // console.log("w a");
    //   } else if (keyPressed.d) {
    //     directionOffset = -Math.PI / 4;
    //   }
    // } else if (keyPressed.s) {
    //   if (keyPressed.a) {
    //     directionOffset = Math.PI / 4 + Math.PI / 2;
    //   } else if (keyPressed.d) {
    //     directionOffset = -Math.PI / 4 - Math.PI / 2;
    //   } else {
    //     directionOffset = Math.PI;
    //   }
    // } else if (keyPressed.a) {
    //   directionOffset = Math.PI / 2;
    // } else if (keyPressed.d) {
    //   directionOffset = -Math.PI / 2;
    // }
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
        directionOffset = 0;
      }
    } else if (keyPressed.a) {
      directionOffset = d;
    } else if (keyPressed.d) {
      directionOffset = a;
    }

    return directionOffset;
  }
}
