import { ActionFormData,ModalFormData,CustomForm } from '@minecraft/server-ui';
import { Player,system,type Block } from '@minecraft/server';
import { Sessions } from '../multiplayer/sessions.js';
import { kinetics } from '../kinetic/runtime.js';
import { key } from '../kinetic/model.js';
import { DATA } from './generated.js';
import { CatalogIndex,m,matchesTutorial,type Query } from './model.js';
import { Navigation,type Route } from './navigation.js';
import { renderScreen } from './screens.js';
const sessions=new Sessions(),lastRequest=new Map<string,number>();
let cachedIndex:CatalogIndex|undefined;
export function forgetPlayer(id:string):void{sessions.clear(id);lastRequest.delete(id);}
export function requestGuideOpen(player:Player):void{
 if(!player.isValid)return;
 const id=player.id,now=system.currentTick;
 if(now-(lastRequest.get(id)??-100)<10)return;
 lastRequest.set(id,now);
 system.run(()=>{if(player.isValid)void openGuide(player);});
}
export function registerGuidebook():void{
 system.beforeEvents.startup.subscribe(event=>event.itemComponentRegistry.registerCustomComponent('bedrockworks:open_manual',{
  onUse:event=>requestGuideOpen(event.source),
  onUseOn:event=>{if(event.source instanceof Player)requestGuideOpen(event.source);},
 }));
}
function observed(player:Player):{itemId:string;status:string;rpm:number;capacity:number;stress:number;axis?:string}|undefined{
 const block:Block|undefined=player.getBlockFromViewDirection({maxDistance:6})?.block;
 if(!block)return undefined;
 const state=kinetics.graph.state(key({...block.location,dimension:block.dimension.id}));
 return {itemId:block.typeId,status:state.status,rpm:state.rpm,capacity:state.capacity,stress:state.stress,axis:block.permutation.getAllStates()['bedrockworks:axis'] as string|undefined};
}
async function search(player:Player,index:CatalogIndex,current?:Query):Promise<Query|undefined>{
 const categories=index.data.categories.filter(c=>!['intro','tutorials'].includes(c.id));
 const scopes=['bedrock','java','all'] as const,statuses=['all','functional','partial','upcoming'] as const;
 const result=await new ModalFormData().title(m('manual.search'))
  .textField(m('manual.search_name'),m('manual.search_hint'),{defaultValue:current?.name??''})
  .dropdown(m('manual.category_label'),[m('manual.all'),...categories.map(c=>m(c.nameKey))],{defaultValueIndex:Math.max(0,categories.findIndex(c=>c.id===current?.category)+1)})
  .dropdown(m('manual.scope_label'),scopes.map(s=>m('manual.scope.'+s)),{defaultValueIndex:Math.max(0,scopes.indexOf(current?.scope??'bedrock'))})
  .dropdown(m('manual.status_label'),statuses.map(s=>m(s==='all'?'manual.all':'manual.status.'+s)),{defaultValueIndex:Math.max(0,statuses.indexOf(current?.status??'all'))})
  .submitButton(m('manual.search')).show(player);
 if(result.canceled||!result.formValues)return undefined;
 const [name,category,scope,status]=result.formValues;
 return {name:typeof name==='string'?name.trim().slice(0,80):'',category:typeof category==='number'?categories[category-1]?.id:undefined,scope:typeof scope==='number'?scopes[scope]??'bedrock':'bedrock',status:typeof status==='number'?statuses[status]??'all':'all'};
}
export async function openGuide(player:Player):Promise<void>{
 const id=player.id,token=sessions.acquire(id);if(!token)return;
 const navigation=new Navigation();let running=true;
 try{
  const index=cachedIndex??=new CatalogIndex(DATA);
  while(running&&player.isValid&&sessions.owns(id,token)){
   const route=navigation.current;
   if(route.kind==='image'){
    const form=new CustomForm(player,m(route.titleKey)).label(m('manual.no_ponder')).image(route.path+'.png',DATA.resourcePackId,{width:1});
    form.button(m('manual.back'),()=>{if(form.isShowing())form.close();}).closeButton();
    await form.show();
    if(!sessions.owns(id,token))break;
    navigation.back();continue;
   }
   const screen=renderScreen(route,index),form=new ActionFormData().title(screen.title).body(screen.body);
   for(const button of screen.buttons)form.button(button.label,button.icon);
   const response=await form.show(player);
   if(response.canceled||!sessions.owns(id,token))break;
   const action=response.selection===undefined?undefined:screen.buttons[response.selection]?.action;
   if(!action)break;
   if(action.kind==='close')running=false;
   else if(action.kind==='back')running=navigation.back();
   else if(action.kind==='push')navigation.push(action.route);
   else if(action.kind==='replace')navigation.replace(action.route);
   else if(action.kind==='search'){
    const query=await search(player,index,route.kind==='items'?route.query:undefined);
    if(!sessions.owns(id,token))break;
    if(query)navigation.push({kind:'items',query,page:0});
   }else if(action.kind==='check'&&route.kind==='tutorial'){
    const step=index.data.tutorials.find(t=>t.id===route.id)?.steps[route.step];
    const matched=step&&matchesTutorial(step,observed(player));
    navigation.replace({...route,feedback:matched?'verified':'not_verified'});
   }
  }
 }catch{
  try{if(player.isValid&&sessions.owns(id,token))player.onScreenDisplay.setActionBar(m('guide.error'));}catch{/* Player disconnected. */}
 }finally{sessions.release(id,token);}
}
