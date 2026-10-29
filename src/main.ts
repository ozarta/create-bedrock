import { registerLogistics } from './logistics/runtime.js';
registerLogistics();
import { registerMachines } from './machines/runtime.js';
registerMachines();
import { registerKinetics } from './kinetic/runtime.js';
registerKinetics();
import { world } from '@minecraft/server';
import { IDS } from './core/ids.js';
import { forgetPlayer, requestGuideOpen, registerGuidebook } from './guidebook/guidebook.js';
registerGuidebook();
world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack.typeId === IDS.guidebook) requestGuideOpen(source);
});
world.afterEvents.playerLeave.subscribe(({ playerId }) => forgetPlayer(playerId));
