import Ammo from 'ammo.js';

export function createWorld() {
  const world = new Ammo.btDiscreteDynamicsWorld(
    new Ammo.btDefaultCollisionConfiguration(),
    new Ammo.btDbvtBroadphase(),
    new Ammo.btSequentialImpulseConstraintSolver(),
    new Ammo.btDefaultCollisionConstructionInfo(),
  );

  world.setGravity(new Ammo.btVector3(0, -10, 0));

  return world;
}