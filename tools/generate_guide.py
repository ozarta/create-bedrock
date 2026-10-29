"""Build the guide from native recipes and a legally scoped, pinned Java reference snapshot."""
from pathlib import Path
import collections,hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
CATS=json.loads((ROOT/'data/guide/categories.json').read_text(encoding='utf-8'))
COMPONENTS=json.loads((ROOT/'data/guide/components.json').read_text(encoding='utf-8'))
REF=json.loads((ROOT/'data/reference/create-6.0.10-recipes.json').read_text(encoding='utf-8'))
if REF['commit']!='ac0c444d9828da3453ae8cc65338e8de063286fb':raise ValueError('Unverified upstream commit')
TRANSLATIONS={}
ITEMS={};MACHINES={};RECIPES=[]
def tr(key,es,en):TRANSLATIONS[key]={'es_MX':es,'en_US':en};return key
def read_lang(p):return dict(line.split('=',1) for line in p.read_text(encoding='utf-8').splitlines() if line and not line.startswith('#'))
LANGS={lang:read_lang(ROOT/'resource_pack/texts'/f'{lang}.lang') for lang in ['es_MX','en_US']}
def digest(value):return hashlib.sha256(value.encode()).hexdigest()[:20]
def item_meta(identifier,native,scope,kind,category,names,icon,status,implemented,fields=None):
 if identifier in ITEMS:return identifier
 nameKey=tr('manual.name.'+digest(identifier),names[0],names[1])
 keys={}
 for f in ['description','operation','energy','example','errors']:
  keys[f+'Key']=tr('manual.item.'+digest(identifier)+'.'+f,*fields[f]) if fields else 'manual.reference.'+f
 ITEMS[identifier]={'id':identifier,'nativeId':native,'scope':scope,'kind':kind,'category':category,'nameKey':nameKey,'names':dict(zip(['es_MX','en_US'],names)),'icon':icon,'status':status,'implemented':implemented,**keys}
 return identifier
NATIVE={'hopper':('Tolva','Hopper'),'iron_block':('Bloque de hierro','Iron block'),'piston':('Pistón','Piston'),'gold_ingot':('Lingote de oro','Gold ingot'),'barrel':('Barril','Barrel'),'crafting_table':('Mesa de trabajo','Crafting table'),'iron_ingot':('Lingote de hierro','Iron ingot'),'copper_ingot':('Lingote de cobre','Copper ingot'),'iron_nugget':('Pepita de hierro','Iron nugget'),'oak_planks':('Tablones de roble','Oak planks'),'redstone':('Polvo de redstone','Redstone dust'),'diamond':('Diamante','Diamond'),'compass':('Brújula','Compass'),'book':('Libro','Book')}
def native_item(id):
 if ':' not in id:id='minecraft:'+id
 if id in ITEMS:return id
 path=id.split(':',1)[1];names=NATIVE.get(path,(path.replace('_',' '),path.replace('_',' ').title()))
 if id.startswith('bedrockworks:'):raise ValueError('Missing custom item metadata '+id)
 fields={f:('Recurso nativo de Minecraft; el manual enlaza los usos del add-on.','Native Minecraft resource; this guide links its add-on uses.') for f in ['description','operation','example','errors']};fields['energy']=('No requiere energía cinética para usarse como ingrediente.','No kinetic power is required to use it as an ingredient.')
 return item_meta(id,id,'bedrock','item','machines' if path=='crafting_table' else 'materials',names,'textures/ui/manual_crafting_table' if path=='crafting_table' else 'textures/items/guidebook','functional',True,fields)
for suffix,c in COMPONENTS.items():
 id='bedrockworks:'+suffix
 names=('Manual de Ingeniería Mecánica','Mechanical Engineering Manual') if suffix=='guidebook' else tuple(LANGS[l].get('tile.'+id+'.name',LANGS[l].get('item.'+id+'.name',suffix)) for l in ['es_MX','en_US'])
 fields={f:(c[f+'_es'],c[f+'_en']) for f in ['description','operation','energy','example','errors']}
 item_meta(id,id,'bedrock','item',c['category'],names,'textures/items/'+('gear' if suffix=='gear_component' else 'shaft' if suffix=='shaft_component' else suffix),'partial',True,fields)
 if (ROOT/'behavior_pack/blocks'/f'{suffix}.json').exists() and suffix!='mechanical_funnel':MACHINES[id]={'id':id,'itemId':id,'implemented':True,'builtin':False}
native_item('minecraft:crafting_table');MACHINES['builtin:crafting_table']={'id':'builtin:crafting_table','itemId':'minecraft:crafting_table','implemented':True,'builtin':True}
for p in sorted((ROOT/'behavior_pack/recipes').glob('*.json')):
 raw=json.loads(p.read_text(encoding='utf-8'));kind=next(k for k in raw if k.startswith('minecraft:recipe_'));data=raw[kind]
 inputs=[]
 ingredients=data.get('ingredients')
 if ingredients is None:
  ingredients=[]
  for char,spec in data['key'].items():ingredients.extend([spec]*sum(row.count(char) for row in data['pattern']))
 for entry in ingredients:
  options=[native_item(e['item']) for e in (entry if isinstance(entry,list) else [entry])]
  found=next((i for i in inputs if i['options']==options),None)
  if found:found['count']+=1
  else:inputs.append({'options':options,'count':1,'unit':'item','role':'consumed'})
 out=data['result'];native_item(out['item'])
 RECIPES.append({'id':data['description']['identifier'],'scope':'bedrock','status':'partial','implemented':True,'gameVerified':False,'type':'bedrock:crafting','machineId':'builtin:crafting_table','inputs':inputs,'outputs':[{'itemId':out['item'],'count':out.get('count',1),'unit':'item','chanceMode':'certain'}],'conditions':[{'key':'manual.condition.crafting'},{'key':'manual.condition.engine_pending'}],'source':p.relative_to(ROOT).as_posix(),'technical':raw,'partialModel':False,**({'pattern':data['pattern']} if 'pattern' in data else {})})
# Manufacturing recipes are interpreted by the server processor, not registered as fake native JSON types.
for definition in json.loads((ROOT/'data/processing/recipes.json').read_text(encoding='utf-8')):
 for a in definition['inputs']+definition['outputs']:native_item(a['item'])
 RECIPES.append({'id':definition['id'],'scope':'bedrock','status':'partial','implemented':True,'gameVerified':False,'type':'bedrock:'+definition['process'],'machineId':definition['machine'],'inputs':[{'options':[a['item']],'count':a['count'],'unit':'item','role':'consumed'} for a in definition['inputs']],'outputs':[{'itemId':a['item'],'count':a['count'],'unit':'item','chanceMode':'certain'} for a in definition['outputs']],'conditions':[{'key':'manual.processing.power','value':str(definition['minRpm'])+'–'+str(definition['maxRpm'])},{'key':'manual.processing.work','value':str(definition['work'])},{'key':'manual.processing.atomic'},{'key':'manual.condition.engine_pending'}],'source':'data/processing/recipes.json#'+definition['id'],'technical':definition,'partialModel':False})
# Factual native 2x2 recipe verified in Mojang samples; no external art or UI text copied.
planks=item_meta('builtin:tag:minecraft:planks','minecraft:planks','bedrock','tag','materials',('Cualquier tablón (etiqueta nativa)','Any planks (native tag)'),'textures/items/shaft','functional',True,{f:('Etiqueta nativa que acepta tablones de Minecraft, no un objeto de inventario.','Native tag matching Minecraft planks, not an inventory item.') for f in ['description','operation','energy','example','errors']})
RECIPES.append({'id':'builtin:crafting_table','scope':'bedrock','status':'functional','implemented':True,'gameVerified':False,'type':'bedrock:crafting','machineId':'builtin:crafting_table','inputs':[{'options':[planks],'count':4,'unit':'item','role':'consumed'}],'outputs':[{'itemId':'minecraft:crafting_table','count':1,'unit':'item','chanceMode':'certain'}],'conditions':[{'key':'manual.condition.native'}],'source':'https://github.com/Mojang/bedrock-samples/blob/15701fa9c13923f12662984c32c124327e40e3d3/behavior_pack/recipes/crafting_table.json','technical':{'pattern':['AA','AA'],'key':{'A':{'tag':'minecraft:planks'}},'count':4},'partialModel':False,'pattern':['AA','AA']})
MACHINE_TYPES={
 'create:crushing':'create:crushing_wheel','create:milling':'create:millstone','create:mixing':'create:mechanical_mixer','create:compacting':'create:mechanical_press','create:pressing':'create:mechanical_press','create:cutting':'create:mechanical_saw','create:deploying':'create:deployer','create:filling':'create:spout','create:emptying':'create:item_drain','create:mechanical_crafting':'create:mechanical_crafter','create:splashing':'create:encased_fan','create:haunting':'create:encased_fan','create:sandpaper_polishing':'create:sand_paper'}
SPECIAL={'create:item_copying','create:toolbox_dyeing'}
WORDS={'andesite':'andesita','alloy':'aleación','brass':'latón','copper':'cobre','iron':'hierro','gold':'oro','golden':'dorada','sheet':'lámina','shaft':'eje','cogwheel':'engranaje','large':'grande','small':'pequeño','precision':'precisión','mechanism':'mecanismo','mechanical':'mecánico','press':'prensa','mixer':'mezclador','crushing':'trituración','wheel':'rueda','millstone':'molino','water':'agua','gearbox':'caja de engranajes','deployer':'desplegador','spout':'surtidor','item':'objeto','drain':'drenaje','encased':'encapsulado','fan':'ventilador','crafter':'ensamblador','saw':'sierra','zinc':'zinc','raw':'bruto','crushed':'triturado','nugget':'pepita','ingot':'lingote','flour':'harina','wheat':'trigo','dough':'masa','train':'tren','track':'vía','station':'estación','schedule':'horario','filter':'filtro','belt':'cinta','funnel':'embudo','tunnel':'túnel','chute':'conducto','vault':'bóveda','bearing':'rodamiento','piston':'pistón','chassis':'chasis','glue':'pegamento','elevator':'ascensor','oak':'roble','planks':'tablones','stone':'piedra','block':'bloque','casing':'carcasa','redstone':'redstone','link':'enlace','stock':'existencias','package':'paquete','packager':'empaquetador','arm':'brazo','tank':'tanque','fluid':'fluido','pipe':'tubería','pump':'bomba','steam':'vapor','engine':'motor','paper':'papel','sand':'arena'}
def category(native):
 path=native.split(':',1)[-1]
 if native in MACHINE_TYPES.values() or native in ['minecraft:crafting_table','minecraft:furnace','minecraft:blast_furnace','minecraft:smoker','minecraft:stonecutter','minecraft:smithing_table','minecraft:campfire']:return 'machines'
 for group,words in [('trains',['train','track','station','bogey','schedule']),('mobile',['bearing','piston','chassis','contraption','gantry','glue','elevator','cart_']),('transport',['belt','funnel','tunnel','chute','vault','mechanical_arm']),('energy',['wheel','engine','windmill','blaze_burner']),('transmission',['shaft','cogwheel','gearbox','clutch','gearshift']),('automation',['redstone','link','stock','package','filter','observer'])]:
  if any(w in path for w in words):return group
 return 'materials'
def java_item(native,kind='item'):
 id='java:'+('tag:' if kind=='tag' else 'fluid_tag:' if kind=='fluid_tag' else 'fluid:' if kind=='fluid' else 'selector:' if kind=='selector' else '')+native
 if id in ITEMS:return id
 name=native.split(':',1)[-1].replace('/',' ').replace('_',' ')
 es=' '.join(WORDS.get(w,w) for w in name.split())
 es={'create:mechanical_press':'Prensa mecánica','create:mechanical_mixer':'Mezclador mecánico','create:crushing_wheel':'Rueda trituradora','create:millstone':'Molino de piedra','create:mechanical_saw':'Sierra mecánica','create:deployer':'Desplegador mecánico','create:mechanical_crafter':'Ensamblador mecánico','create:spout':'Surtidor','create:item_drain':'Drenaje de objetos','create:encased_fan':'Ventilador encapsulado','create:andesite_alloy':'Aleación de andesita','create:brass_ingot':'Lingote de latón','create:brass_sheet':'Lámina de latón','create:precision_mechanism':'Mecanismo de precisión','create:sand_paper':'Papel de lija'}.get(native,es)
 if kind=='tag':es='Etiqueta Java: '+native;name='Java tag: '+native
 if kind=='fluid_tag':es='Etiqueta de fluido Java: '+native;name='Java fluid tag: '+native
 if kind=='fluid':es='Fluido Java: '+es;name='Java fluid: '+name
 if kind=='selector':es='Selector técnico Java: '+native;name='Java technical selector: '+native
 return item_meta(id,native,'java','tag' if kind=='fluid_tag' else kind,category(native),(es,name.title()),'textures/ui/manual_reference','upcoming',False)
def options(spec):
 if isinstance(spec,list):return [v for s in spec for v in options(s)]
 if isinstance(spec,str):return [java_item(spec)]
 if not isinstance(spec,dict):return []
 if spec.get('type')=='neoforge:compound':return options(spec['ingredients'])
 fluid='amount' in spec or spec.get('type','').startswith('neoforge:fluid')
 if 'tag' in spec:return [java_item(spec['tag'],'fluid_tag' if fluid else 'tag')]
 for field in ['item','items','fluid','fluids']:
  if field in spec:
   value=spec[field];values=value if isinstance(value,list) else [value]
   return [java_item(v,'fluid' if fluid or field in ['fluid','fluids'] else 'item') for v in values if isinstance(v,str)]
 return [java_item(digest(json.dumps(spec,sort_keys=True)),'selector')]
def inputs(raw,typ):
 specs=raw.get('ingredients')
 if specs is None:
  if 'pattern' in raw:
   specs=[]
   for char,spec in raw['key'].items():specs.extend([spec]*sum(row.count(char) for row in raw['pattern']))
  else:specs=[raw[k] for k in ['ingredient','template','base','addition'] if k in raw]
 result=[]
 for i,spec in enumerate(specs):
  op=options(spec);fluid=isinstance(spec,dict) and 'amount' in spec
  count=spec.get('amount',spec.get('count',1)) if isinstance(spec,dict) else 1
  unit='mB' if fluid else 'item'
  if any(ITEMS[o]['kind']=='selector' for o in op):count=None;unit='unknown'
  role='catalyst' if raw.get('keep_held_item') and i==1 else 'consumed'
  same=next((v for v in result if v['options']==op and v['unit']==unit and v['role']==role and v['count'] is not None and count is not None),None)
  if same:same['count']+=count
  else:result.append({'options':op,'count':count,'unit':unit,'role':role})
 return result
def outputs(raw,typ):
 specs=raw.get('results',[raw['result']] if 'result' in raw else [])
 result=[]
 for spec in specs:
  if isinstance(spec,str):spec={'id':spec,'count':raw.get('count',1)}
  native=spec.get('id',spec.get('item'))
  if not native:continue
  fluid='amount' in spec
  mode='weight' if typ=='create:sequenced_assembly' else 'independent' if 'chance' in spec else 'certain'
  result.append({'itemId':java_item(native,'fluid' if fluid else 'item'),'count':spec.get('amount',spec.get('count',1)),'unit':'mB' if fluid else 'item','chanceMode':mode,**({'chance':spec.get('chance',1)} if mode!='certain' else {})})
 return result
def machine(typ):
 id='java:process:'+typ
 if id not in MACHINES:
  if typ in ['create:item_application','create:sequenced_assembly']:
   action='manual_application' if typ=='create:item_application' else 'sequenced_line'
   names=('Aplicación manual sobre bloque','Manual block application') if action=='manual_application' else ('Línea de ensamblaje secuenciado','Sequenced assembly line')
   fields={f:('Ficha conceptual de referencia, no un bloque fabricable. Se aplica sobre el bloque objetivo con el objeto sostenido.' if action=='manual_application' else 'Ficha conceptual de referencia, no una máquina única. Consulta la estación de cada paso de la secuencia.','Conceptual reference, not a craftable block. Apply the held item to the target block.' if action=='manual_application' else 'Conceptual reference, not one machine. See the station for each sequence step.') for f in ['description','operation','energy','example','errors']}
   item=item_meta('java:action:'+action,typ,'java','selector','machines',names,'textures/ui/manual_reference','upcoming',False,fields)
   MACHINES[id]={'id':id,'itemId':item,'implemented':False,'builtin':False}
   return id
  native=MACHINE_TYPES.get(typ,'minecraft:crafting_table' if 'crafting' in typ or typ in SPECIAL else 'minecraft:smoker' if typ=='minecraft:smoking' else 'minecraft:blast_furnace' if typ=='minecraft:blasting' else 'minecraft:campfire' if typ=='minecraft:campfire_cooking' else 'minecraft:stonecutter' if typ=='minecraft:stonecutting' else 'minecraft:smithing_table' if typ=='minecraft:smithing_transform' else 'minecraft:furnace')
  item=java_item(native);MACHINES[id]={'id':id,'itemId':item,'implemented':False,'builtin':False}
 return id
for entry in REF['recipes']:
 raw=entry['raw'];typ=entry['type'];ins=inputs(raw,typ);outs=outputs(raw,typ)
 cond=[{'key':'manual.condition.java'},{'key':'manual.condition.not_fabricable'}]
 for name in ['heat_requirement','processing_time','cookingtime','experience','neoforge:conditions','accept_mirrored','keep_held_item','transitional_item']:
  if name in raw:cond.append({'key':'manual.condition.technical','value':name+' = '+json.dumps(raw[name],ensure_ascii=False)})
 if 'heat_requirement' in raw:cond.append({'key':'manual.heat.'+raw['heat_requirement']})
 if 'processing_time' in raw:cond.append({'key':'manual.processing_ticks','value':str(raw['processing_time'])})
 if raw.get('keep_held_item'):cond.append({'key':'manual.condition.retained'})
 for ingredient in raw.get('ingredients',[]):
  if isinstance(ingredient,dict) and 'components' in ingredient:cond.append({'key':'manual.condition.technical','value':'ingredient_components = '+json.dumps(ingredient['components'],ensure_ascii=False)})
 steps=[]
 for step in raw.get('sequence',[]):steps.append({'type':step['type'],'machineId':machine(step['type']),'inputs':inputs(step,step['type']),'outputs':outputs(step,step['type'])})
 RECIPES.append({'id':'java:'+entry['id'],'scope':'java','status':'upcoming','implemented':False,'gameVerified':False,'type':typ,'machineId':machine(typ),'inputs':ins,'outputs':outs,'conditions':cond,'source':entry['source'],'technical':raw,'partialModel':not ins or not outs or any(v['count'] is None for v in ins) or typ in SPECIAL,**({'pattern':raw['pattern']} if 'pattern' in raw else {}),**({'steps':steps,'loops':raw.get('loops',1)} if steps else {})})
# Tags are partial definitions supplied by this repo, not the complete Java runtime registry.
tags={}
for tag in REF['tags']:
 if tag['registry']!='item':continue
 tid=java_item(tag['id'],'tag');target=tags.setdefault(tid,[])
 if tag['data'].get('replace'):target.clear()
 for value in tag['data'].get('values',[]):
  v=value if isinstance(value,str) else value['id']
  member=java_item(v[1:],'tag') if v.startswith('#') else java_item(v)
  if member not in target:target.append(member)
# Localized UI strings are managed in a separate authored file.
UI=json.loads((ROOT/'data/guide/ui.json').read_text(encoding='utf-8'))
for k,v in UI.items():tr(k,v['es_MX'],v['en_US'])
for cat in CATS:cat['nameKey']=tr('manual.category.'+cat['id'],cat['names']['es_MX'],cat['names']['en_US']);del cat['names']
TUTORIALS=json.loads((ROOT/'data/guide/tutorials.json').read_text(encoding='utf-8'))
for tutorial in TUTORIALS:
 title=tutorial.pop('names');tutorial['titleKey']=tr('manual.tutorial.'+tutorial['id'],title['es_MX'],title['en_US'])
 for index,step in enumerate(tutorial['steps']):
  title=step.pop('names');body=step.pop('body');base='manual.tutorial.'+tutorial['id']+'.'+str(index)
  step['titleKey']=tr(base+'.title',title['es_MX'],title['en_US']);step['bodyKey']=tr(base+'.body',body['es_MX'],body['en_US'])
PROCESSES=[]
for identifier,names in json.loads((ROOT/'data/guide/processes.json').read_text(encoding='utf-8')).items():
 PROCESSES.append({'id':identifier,'nameKey':tr('manual.process.'+digest(identifier),names['es_MX'],names['en_US'])})
data={'processes':PROCESSES,'resourcePackId':json.loads((ROOT/'resource_pack/manifest.json').read_text(encoding='utf-8'))['header']['uuid'],'categories':CATS,'items':list(ITEMS.values()),'recipes':RECIPES,'machines':list(MACHINES.values()),'tutorials':TUTORIALS,'tagMembers':tags,'reference':{'commit':REF['commit'],'count':len(REF['recipes']),'runtimeFullyEnumerated':False,'dynamicFamilies':[{'id':v['id'],'source':v['source'],'descriptionKey':'manual.family.'+v['id']} for v in REF['dynamic_families']]}}
(ROOT/'build').mkdir(exist_ok=True)
(ROOT/'build/guide-catalog.json').write_text(json.dumps(data,ensure_ascii=False)+'\n', encoding='utf-8', newline='\n')
p=ROOT/'src/guidebook/generated.ts';p.write_text('// Generated from data/guide, native BP recipes and pinned MIT technical reference.\nimport type { CatalogData } from \'./types.js\';\nexport const DATA: CatalogData = JSON.parse('+json.dumps(json.dumps(data,ensure_ascii=False,separators=(',',':')),ensure_ascii=False)+');\n', encoding='utf-8', newline='\n')
for pack in ['behavior_pack','resource_pack']:
 for lang in ['es_MX','en_US']:
  p=ROOT/pack/'texts'/f'{lang}.lang';existing=read_lang(p)
  existing={k:v for k,v in existing.items() if not k.startswith('manual.')}
  existing.update({k:v[lang] for k,v in TRANSLATIONS.items()})
  existing['item.bedrockworks:guidebook.name']='Manual de Ingeniería Mecánica' if lang=='es_MX' else 'Mechanical Engineering Manual'
  p.write_text('\n'.join(k+'='+v.replace('\n','\\n') for k,v in existing.items())+'\n', encoding='utf-8', newline='\n')
print(f'Guide generated: {len(ITEMS)} entries, {len(RECIPES)} recipes, {len(TUTORIALS)} tutorials')
