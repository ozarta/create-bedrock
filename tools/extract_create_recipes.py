"""Extract only MIT technical recipe data, never assets, from the exact Create tag."""
from pathlib import Path
import argparse,collections,hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
SHA='ac0c444d9828da3453ae8cc65338e8de063286fb'
DYNAMIC={
 'fan_smoking_blasting':('content/kinetics/fan/processing/AllFanProcessingTypes.java','Reuses world smoking, smelting and blasting recipe registries; filters automation exclusions.'),
 'basin_shapeless':('content/processing/basin/BasinRecipe.java','Converts eligible shapeless crafting recipes; evaluated against the world recipe registry.'),
 'potion_mixing':('content/fluids/potion/PotionMixingRecipes.java','Enumerates supported containers and potion brewing mixes from runtime registries.'),
 'generic_filling':('content/fluids/transfer/GenericItemFilling.java','Registered filling recipes plus supported fluid container capabilities.'),
 'generic_emptying':('content/fluids/transfer/GenericItemEmptying.java','Registered emptying recipes plus supported fluid container capabilities.'),
 'toolbox_dyeing':('content/equipment/toolbox/ToolboxDyeingRecipe.java','Special crafting serializer; match/color logic rather than a fixed ingredient/result JSON.'),
 'item_copying':('foundation/recipe/ItemCopyingRecipe.java','Special copying serializer with component-dependent behavior.'),
 'jei_conversion':('compat/jei/ConversionRecipe.java','Conversion display recipes; not automatically player crafting recipes.'),
}
def extract(source):
 source=source.resolve(strict=True)
 sha=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
 if sha!=SHA:raise ValueError('Requires exact Create 6.0.10 commit '+SHA)
 if subprocess.check_output(['git','-C',str(source),'status','--porcelain'],text=True).strip():raise ValueError('Reference checkout has changes')
 license=(source/'LICENSE.md').read_text(encoding='utf-8')
 if 'Assets License (All Rights Reserved)' not in license or 'Code License (MIT)' not in license:raise ValueError('License scope requires review')
 recipes=[];seen=set();counts=collections.Counter()
 for folder in ['src/generated/resources/data','src/main/resources/data']:
  base=source/folder
  if not base.exists():continue
  for p in sorted(base.glob('*/recipe/**/*.json')):
   if p.is_symlink():raise ValueError('No symlinks permitted')
   relative=p.relative_to(base);namespace=relative.parts[0];identifier=namespace+':'+Path(*relative.parts[2:]).with_suffix('').as_posix()
   if identifier in seen:raise ValueError('Duplicate source ID requires explicit override review: '+identifier)
   seen.add(identifier);raw=json.loads(p.read_text(encoding='utf-8'));counts[raw['type']]+=1
   recipes.append({'id':identifier,'type':raw['type'],'status':'upcoming','bedrock_implemented':False,'source':p.relative_to(source).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'raw':raw})
 tags=[]
 for folder in ['src/generated/resources/data','src/main/resources/data']:
  for p in sorted((source/folder).glob('*/tags/*/**/*.json')):
   parts=p.relative_to(source/folder).parts
   tags.append({'id':parts[0]+':'+Path(*parts[3:]).with_suffix('').as_posix(),'registry':parts[2],'source':p.relative_to(source).as_posix(),'data':json.loads(p.read_text(encoding='utf-8'))})
 families=[]
 for name,(path,rule) in DYNAMIC.items():
  p=source/'src/main/java/com/simibubi/create'/path
  if not p.exists():raise ValueError('Missing dynamic source '+str(p))
  families.append({'id':name,'status':'upcoming','expanded':False,'source':p.relative_to(source).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rule':rule,'blocker':'Requires Java runtime registry/configuration, not a fixed JSON enumeration.'})
 types=(source/'src/main/java/com/simibubi/create/AllRecipeTypes.java').read_text(encoding='utf-8')
 registered=re.findall(r'^\s*([A-Z_]+)\(',types,re.M)
 providers=sorted(p.relative_to(source).as_posix() for p in (source/'src/main/java/com/simibubi/create/foundation/data/recipe').glob('*RecipeGen.java'))
 result={'schema_version':1,'repository':'Creators-of-Create/Create','tag':'mc1.21.1-6.0.10','commit':sha,'minecraft_java':'1.21.1','license_source':'LICENSE.md','coverage':{'materialized_json_files':len(recipes),'counts_by_type':dict(sorted(counts.items())),'registered_create_serializers':registered,'providers':providers,'runtime_fully_enumerated':False},'dynamic_families':families,'tags':tags,'recipes':recipes}
 out=ROOT/'data/reference/create-6.0.10-recipes.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n', encoding='utf-8', newline='\n')
 print(f'{len(recipes)} technical JSON recipes, {len(counts)} materialized types; {len(families)} unexpanded runtime families')
 return result
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('checkout',type=Path);args=parser.parse_args();extract(args.checkout)
