import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer, AnimationClip, LoopRepeat, LoopOnce } from "three";

async function createAnimation(animationPath, animationName) {
  const loader = new GLTFLoader();
  const [animation] = await Promise.all([loader.loadAsync(animationPath)]);

  const animationClip = animation.animations;
  console.log("animationClip", animationClip);
  animationClip[0].name = animationName;

  return animationClip;
}
var animationsArray = [];

export async function createModel(scene, modelName, modelPath, keyPressed) {
  const loader = new GLTFLoader();

  const [modelData] = await Promise.all([loader.loadAsync(modelPath)]);

  const model = modelData.scene;
  // console.log("model dalem createModel", model);
  model.scale.set(2, 2, 2);
  model.position.set(0, 0, 0);

  var gltfAnimations = modelData.animations;
  animationsArray.push(gltfAnimations);
  const mixer = new AnimationMixer(model);

  return mixer;
}

export function update(delta, keyPressed, animationsMap, currentAction) {
  var play = "";

  if (keyPressed.w == true) {
    play = "walks";
    console.log(keyPressed);
  } else {
    play = "maximo.com";
  }

  if (currentAction != actions) {
    var actions = animationsMap.get(play);
    var currentActionAnimation = animationsMap.get(currentAction);

    currentActionAnimation.fadeOut(0.5);
    actions.reset().fadeIn(0.5).play();

    currentAction = play;
  }
  // actions.play();

  // actions.push(mixer.clipAction(x[0]));
  actions.setLoop(LoopRepeat);
  actions.play();
}
