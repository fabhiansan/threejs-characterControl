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

  // console.log("animationArray 1 ", animationsArray);
  // console.log("animationArray 1 length ", animationsArray.length);

  var animationsMap = new Map();

  // console.log("mixer", mixer);
  var x = [];

  // createAnimation("../../public/walker/walks.gltf", "walks").then((el) => {
  //   console.log("el", el);
  //   x.push(animationsArray[0][0]);
  //   x.push(...el);

  //   x.filter((a) => {
  //     return a.name != "Tpose";
  //   }).forEach((a) => {
  //     animationsMap.set(a.name, mixer.clipAction(a));
  //   });
  //   console.log("x", x);
  //   console.log("animation map", animationsMap);

  //   x.forEach((a) => {
  //     console.log("a", a);
  //     console.log("a.name", a.name);
  //   });

  //   // animationsMap
  //   //   .forEach((clip) => {
  //   //     console.log("each Clip: ", clip);
  //   //     mixer.clipAction(clip).setLoop(LoopOnce).play();
  //   //   })
  //   //   .then(() => {});
  // });

  // gltfAnimations.forEach((clip) => {
  //   mixer.clipAction(clip).play();
  // });

  // scene.add(model);

  // console.log("mixer", mixer);

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
