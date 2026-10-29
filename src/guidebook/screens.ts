import { lines,m,pageOf,recipeBody,text,type CatalogIndex,type Message } from './model.js';
import type { Route } from './navigation.js';
export type Action={kind:'push';route:Route}|{kind:'replace';route:Route}|{kind:'back'}|{kind:'close'}|{kind:'search'}|{kind:'check'};
export interface Button {label:Message;icon?:string;action:Action}
export interface Screen {title:Message;body:Message;buttons:Button[]}
export function renderScreen(route:Route,index:CatalogIndex):Screen {
 const buttons:Button[]=[],body:Message[]=[];let title:Message=m('manual.title');
 const push=(label:Message,route:Route,icon?:string)=>buttons.push({label,icon,action:{kind:'push',route}});
 const itemButton=(id:string)=>{const item=index.items.get(id);if(item)push(index.name(id),{kind:'item',id},item.icon);};
 const pages=(data:{page:number;pages:number;total:number},make:(p:number)=>Route)=>{
  body.push(m('manual.page',[String(data.page+1),String(data.pages),String(data.total)]));
  if(data.page>0)buttons.push({label:m('manual.previous'),action:{kind:'replace',route:make(data.page-1)}});
  if(data.page+1<data.pages)buttons.push({label:m('manual.next'),action:{kind:'replace',route:make(data.page+1)}});
 };
 if(route.kind==='home'){
  body.push(m('manual.welcome'));buttons.push({label:m('manual.search'),action:{kind:'search'}});
  for(const category of index.data.categories){
   const destination:Route=category.id==='intro'?{kind:'item',id:'bedrockworks:guidebook'}:category.id==='tutorials'?{kind:'tutorials'}:category.id==='processing'?{kind:'processes',page:0}:{kind:'items',query:{category:category.id,scope:['transport','mobile','trains','machines'].includes(category.id)?'all':'bedrock'},page:0};
   push(m(category.nameKey),destination,category.icon);
  }
  push(m('manual.scope.java'),{kind:'items',query:{scope:'java'},page:0},'textures/ui/manual_reference');
 }else if(route.kind==='items'){
  const found=index.search(route.query),page=pageOf(found,route.page);
  title=route.query.category?m(index.data.categories.find(c=>c.id===route.query.category)?.nameKey??'manual.title'):m('manual.search');
  if(!found.length)body.push(m('manual.empty'));
  if(found.length&&found.every(i=>i.status==='upcoming'))body.push(m('manual.upcoming'));
  for(const item of page.values)push(lines(index.name(item.id),m('manual.status.'+item.status)),{kind:'item',id:item.id},item.icon);
  pages(page,p=>({...route,page:p}));buttons.push({label:m('manual.search'),action:{kind:'search'}});
 }else if(route.kind==='item'){
  const item=index.items.get(route.id);if(!item)throw new Error('Unknown guide item '+route.id);
  title=index.name(item.id);body.push(m('manual.scope.'+item.scope),m('manual.status.'+item.status),text(item.nativeId));
  for(const field of ['description','operation','energy','example','errors'] as const)body.push(m('manual.'+field),m(item[`${field}Key`]));
  if(item.scope==='java')body.push(m('manual.tag_notice'));
  push(m('manual.recipes'),{kind:'recipes',itemId:item.id,mode:'produces',page:0},item.icon);
  push(m('manual.uses'),{kind:'recipes',itemId:item.id,mode:'uses',page:0});
  push(m('manual.illustration'),{kind:'image',path:item.icon,titleKey:item.nameKey},item.icon);
 }else if(route.kind==='recipes'){
  title=m(route.mode==='uses'?'manual.uses':route.mode==='related'?'manual.related':'manual.recipes');
  const values=route.mode==='process'?index.data.recipes.filter(r=>r.type===route.type):route.mode==='produces'?index.produces(route.itemId!):route.mode==='uses'?index.uses(route.itemId!):index.related(route.itemId!);
  const page=pageOf(values,route.page);if(!values.length)body.push(m('manual.no_recipes'));
  for(const recipe of page.values){const output=recipe.outputs[0];push(lines(output?index.name(output.itemId):m('manual.special',[recipe.id]),text(recipe.id),m('manual.status.'+recipe.status)),{kind:'recipe',id:recipe.id},output?index.items.get(output.itemId)?.icon:'textures/ui/manual_reference');}
  pages(page,p=>({...route,page:p}));
 }else if(route.kind==='links'){
  const recipe=index.recipes.get(route.id);if(!recipe)throw new Error('Unknown recipe');
  title=m('manual.links');
  const ids=[...new Set([...recipe.inputs.flatMap(i=>i.options),...recipe.outputs.map(o=>o.itemId),...(recipe.steps??[]).flatMap(s=>[...s.inputs.flatMap(i=>i.options),...s.outputs.map(o=>o.itemId)])])];
  const page=pageOf(ids,route.page);for(const id of page.values)itemButton(id);pages(page,p=>({...route,page:p}));
 }else if(route.kind==='families'){
  title=m('manual.dynamic_families');body.push(m('manual.registry_gap'));
  const page=pageOf(index.data.reference.dynamicFamilies,route.page,4);for(const family of page.values)body.push(m(family.descriptionKey),text(family.source));pages(page,p=>({...route,page:p}));
 }else if(route.kind==='recipe'){
  const recipe=index.recipes.get(route.id);if(!recipe)throw new Error('Unknown recipe '+route.id);
  title=recipe.outputs[0]?index.name(recipe.outputs[0].itemId):m('manual.special',[recipe.id]);body.push(recipeBody(recipe,index));
  const ids=new Set([...recipe.inputs.flatMap(v=>v.options),...recipe.outputs.map(v=>v.itemId),...(recipe.steps??[]).flatMap(s=>[...s.inputs.flatMap(i=>i.options),...s.outputs.map(o=>o.itemId)])]);
  // Limit detail buttons; full ingredient/sequence data remains visible and searchable.
  for(const id of [...ids].slice(0,24))itemButton(id);
  if(ids.size>24)push(m('manual.links'),{kind:'links',id:recipe.id,page:0});
  for(const machineId of new Set([recipe.machineId,...(recipe.steps??[]).map(s=>s.machineId)])){const machine=index.data.machines.find(v=>v.id===machineId);if(machine)push(lines(m('manual.machine'),index.name(machine.itemId)),{kind:'item',id:machine.itemId},index.items.get(machine.itemId)?.icon);}
  push(m('manual.related'),{kind:'recipes',mode:'related',itemId:recipe.id,page:0});
  push(m('manual.technical'),{kind:'technical',id:recipe.id,page:0});
 }else if(route.kind==='technical'){
  const recipe=index.recipes.get(route.id);if(!recipe)throw new Error('Unknown recipe '+route.id);
  title=m('manual.technical');const serialized=JSON.stringify(recipe.technical,null,2);const slices=Array.from({length:Math.max(1,Math.ceil(serialized.length/2800))},(_,i)=>serialized.slice(i*2800,(i+1)*2800));
  const page=pageOf(slices,route.page,1);body.push(m('manual.source',[recipe.source]));if(recipe.scope==='java')body.push(text(index.data.reference.commit));body.push(text(page.values[0]??''));pages(page,p=>({...route,page:p}));
 }else if(route.kind==='processes'){
  title=m('manual.processes');push(m('manual.dynamic_families'),{kind:'families',page:0});body.push(m('manual.processing.overview'),m('manual.registry_gap'));
  const values=index.data.processes.map(p=>p.id).sort(),page=pageOf(values,route.page);
  for(const type of page.values)push(lines(m(index.data.processes.find(p=>p.id===type)!.nameKey),text(type)),{kind:'recipes',mode:'process',type,page:0},'textures/ui/manual_reference');
  pages(page,p=>({...route,page:p}));
 }else if(route.kind==='tutorials'){
  title=m('manual.tutorials');body.push(m('manual.runtime_warning'));
  for(const tutorial of index.data.tutorials)push(m(tutorial.titleKey),{kind:'tutorial',id:tutorial.id,step:0},tutorial.steps[0]?.image);
 }else if(route.kind==='tutorial'){
  const tutorial=index.data.tutorials.find(t=>t.id===route.id),step=tutorial?.steps[route.step];if(!tutorial||!step)throw new Error('Unknown tutorial step');
  title=m(step.titleKey);body.push(m('manual.tutorial_position',[String(route.step+1),String(tutorial.steps.length)]),m(step.bodyKey));if(route.feedback)body.push(m('manual.'+route.feedback));
  push(m('manual.illustration'),{kind:'image',path:step.image,titleKey:step.titleKey},step.image);
  if(step.check)buttons.push({label:m('manual.verify'),action:{kind:'check'}});
  for(const id of step.related)itemButton(id);
  if(route.step>0)buttons.push({label:m('manual.previous'),action:{kind:'replace',route:{...route,step:route.step-1,feedback:undefined}}});
  if(route.step+1<tutorial.steps.length)buttons.push({label:m('manual.next'),action:{kind:'replace',route:{...route,step:route.step+1,feedback:undefined}}});
 }
 if(route.kind!=='home')buttons.push({label:m('manual.back'),action:{kind:'back'}});
 buttons.push({label:m('manual.close'),action:{kind:'close'}});
 return {title,body:lines(...body),buttons};
}
