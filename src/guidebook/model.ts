import type { CatalogData,GuideItem,Recipe,Scope,Availability,TutorialStep } from './types.js';
export type Message={text?:string;translate?:string;with?:string[];rawtext?:Message[]};
export const m=(translate:string,withValues?:string[]):Message=>withValues?{translate,with:withValues}:{translate};
export const text=(value:string):Message=>({text:value});
export const lines=(...values:Message[]):Message=>({rawtext:values.flatMap((v,i)=>i?[text('\n'),v]:[v])});
export function normalize(value:string):string{return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_/]+/g,' ').replace(/\s+/g,' ').trim();}
export interface Query {name?:string;category?:string;scope?:Scope|'all';status?:Availability|'all'}
export function pageOf<T>(values:readonly T[],requested=0,size=16):{values:T[];page:number;pages:number;total:number}{
 const pages=Math.max(1,Math.ceil(values.length/size)),page=Math.max(0,Math.min(pages-1,Math.floor(Number.isFinite(requested)?requested:0)));
 return {values:values.slice(page*size,(page+1)*size),page,pages,total:values.length};
}
export class CatalogIndex {
 readonly items=new Map<string,GuideItem>();
 readonly recipes=new Map<string,Recipe>();
 private readonly names=new Map<string,string>();
 private readonly producers=new Map<string,Recipe[]>();
 private readonly consumers=new Map<string,Recipe[]>();
 private readonly expanded=new Map<string,string[]>();
 constructor(readonly data:CatalogData){
  for(const item of data.items){this.items.set(item.id,item);this.names.set(item.id,normalize(item.names.es_MX+' '+item.names.en_US+' '+item.nativeId+' '+item.id));}
  for(const recipe of data.recipes){
   this.recipes.set(recipe.id,recipe);
   for(const out of new Set(recipe.outputs.map(o=>o.itemId)))this.add(this.producers,out,recipe);
   const options=[...recipe.inputs,...(recipe.steps??[]).flatMap(s=>s.inputs)].flatMap(i=>i.options);
   const used=new Set(options.flatMap(id=>this.members(id)));
   for(const id of used)this.add(this.consumers,id,recipe);
  }
 }
 private add(map:Map<string,Recipe[]>,id:string,recipe:Recipe):void{const values=map.get(id)??[];values.push(recipe);map.set(id,values);}
 private members(id:string):string[]{
  const cached=this.expanded.get(id);if(cached)return cached;
  const seen=new Set<string>(),queue=[id];
  for(let i=0;i<queue.length;i++){const next=queue[i]!;if(seen.has(next))continue;seen.add(next);for(const member of this.data.tagMembers[next]??[])queue.push(member);}
  const result=[...seen];this.expanded.set(id,result);return result;
 }
 search(query:Query):GuideItem[]{
  const tokens=normalize((query.name??'').slice(0,80)).split(' ').filter(Boolean);
  return this.data.items.filter(item=>(!query.category||item.category===query.category)&&(!query.scope||query.scope==='all'||item.scope===query.scope)&&(!query.status||query.status==='all'||item.status===query.status)&&tokens.every(t=>this.names.get(item.id)!.includes(t)))
   .sort((a,b)=>a.names.es_MX<b.names.es_MX?-1:a.names.es_MX>b.names.es_MX?1:0);
 }
 produces(id:string):Recipe[]{return this.producers.get(id)??[];}
 uses(id:string):Recipe[]{return this.consumers.get(id)??[];}
 related(id:string):Recipe[]{const recipe=this.recipes.get(id);return [...new Map((recipe?.outputs??[]).flatMap(o=>this.produces(o.itemId)).filter(r=>r.id!==id).map(r=>[r.id,r])).values()];}
 name(id:string):Message{return this.items.has(id)?m(this.items.get(id)!.nameKey):text(id);}
}
export function recipeBody(recipe:Recipe,index:CatalogIndex):Message{
 const result:Message[]=[m('manual.scope.'+recipe.scope),m('manual.status.'+recipe.status)];
 if(recipe.partialModel)result.push(m('manual.partial_model'));
 const ingredients=(inputs:Recipe['inputs']):Message[]=>inputs.map(i=>({rawtext:[i.count===null?m('manual.unknown_count'):m('manual.count',[String(i.count)]),...i.options.flatMap((id,n)=>n?[m('manual.or'),index.name(id)]:[index.name(id)]),...(i.unit==='mB'?[m('manual.unit.mB')]:[]),...(i.role==='catalyst'?[m('manual.catalyst')]:[])]}));
 const outputs=(values:Recipe['outputs']):Message[]=>values.map(o=>({rawtext:[m('manual.count',[String(o.count)]),index.name(o.itemId),...(o.unit==='mB'?[m('manual.unit.mB')]:[]),...(o.chanceMode==='weight'?[m('manual.weight',[String(o.chance)])]:o.chanceMode==='independent'?[m('manual.chance',[String(Number(((o.chance??1)*100).toFixed(4)))])]:[])]}));
 result.push(m('manual.ingredients'),...ingredients(recipe.inputs),m('manual.results'),...outputs(recipe.outputs));
 const machine=index.data.machines.find(v=>v.id===recipe.machineId);
 result.push(m('manual.machine'),machine?index.name(machine.itemId):text(recipe.machineId));
 if(recipe.pattern)result.push(m('manual.pattern'),text(recipe.pattern.join('\n')));
 if(recipe.steps){result.push(m('manual.sequence',[String(recipe.loops)]));recipe.steps.forEach((s,i)=>result.push(m('manual.step',[String(i+1),s.type]),m(index.data.processes.find(p=>p.id===s.type)?.nameKey??'manual.processes'),...ingredients(s.inputs),...outputs(s.outputs),m('manual.machine'),index.name(index.data.machines.find(machine=>machine.id===s.machineId)!.itemId)));}
 result.push(m('manual.conditions'),...recipe.conditions.map(c=>m(c.key,c.value?[c.value]:undefined)));
 return lines(...result);
}
export function matchesTutorial(step:TutorialStep,observed?:{itemId:string;status:string;rpm:number;capacity?:number;stress?:number;axis?:string}):boolean{
 if(!step.check||!observed||step.check.itemId!==observed.itemId||!Number.isFinite(observed.rpm))return false;
 for(const field of ['rpm','capacity','stress','axis'] as const)if(step.check[field]!==undefined&&step.check[field]!==observed[field])return false;
 return step.check.mode==='look'||step.check.mode==='running'&&observed.status==='running'&&observed.rpm!==0||step.check.mode==='overloaded'&&observed.status==='overloaded'&&observed.rpm===0||step.check.mode==='idle'&&observed.status==='idle'&&observed.rpm===0;
}
