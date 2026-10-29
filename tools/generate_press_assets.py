"""Original industrial press and sheet assets; no Create artwork input."""
from generate_assets import ROOT,RP,SOURCE,png,cube,save_json
import json,hashlib

def main():
 colors={'mechanical_press':(83,111,127),'iron_sheet':(152,172,181),'copper_sheet':(189,113,64),'golden_sheet':(210,171,70)}
 for name,c in colors.items():
  def pixel(x,y):
   v=((x*3+y*5)%7-3)*3
   if x%16 in (0,15) or y%16 in (0,15):v-=30
   if x%16 in (3,12) and y%16 in (3,12):return (211,171,78,255)
   return tuple(max(0,min(255,a+v)) for a in c)+(255,)
  png(RP/'textures/items'/f'{name}.png',32,lambda x,y:pixel(x,y) if (4<=x<=27 and 7<=y<=24) or name=='mechanical_press' and 8<=x<=23 and 2<=y<=28 else (0,0,0,0))
  if name=='mechanical_press':png(RP/'textures/blocks/mechanical_press.png',32,pixel)
 base=[cube([-7,0,-7],[3,16,3]),cube([4,0,4],[3,16,3]),cube([-7,12,-7],[14,4,14])]
 moving=[{'name':'mount','pivot':[0,8,0]},{'name':'rotor','parent':'mount','pivot':[0,12,0],'cubes':[cube([-8,10,-2],[16,4,4])]},{'name':'ram','parent':'mount','pivot':[0,6,0],'cubes':[cube([-2,3,-2],[4,8,4]),cube([-5,1,-5],[10,2,10])]}]
 def model(identifier,bones):return {'format_version':'1.12.0','minecraft:geometry':[{'description':{'identifier':identifier,'texture_width':32,'texture_height':32,'visible_bounds_width':3,'visible_bounds_height':3,'visible_bounds_offset':[0,.5,0]},'bones':bones}]}
 save_json(RP/'models/blocks/mechanical_press_base.geo.json',model('geometry.bedrockworks.mechanical_press_base',[{'name':'base','pivot':[0,8,0],'cubes':base}]))
 save_json(RP/'models/blocks/mechanical_press.geo.json',model('geometry.bedrockworks.mechanical_press',moving))
 save_json(RP/'animations/mechanical_press.kinetic.animation.json',{'format_version':'1.8.0','animations':{'animation.bedrockworks.mechanical_press':{'loop':True,'bones':{'mount':{'rotation':[0,"query.property('bedrockworks:axis') == 2 ? 90 : 0",0]},'rotor':{'rotation':['variable.angle',0,0]},'ram':{'position':[0,"-(1 - math.cos(query.property('bedrockworks:progress') * 360)) * 2",0]}}}}})
 for folder in ['textures','models','animations']:
  for p in (RP/folder).rglob('*'):
   if p.is_file() and (p.stem.startswith('mechanical_press') or p.stem in colors):
    target=SOURCE/p.relative_to(RP);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(p.read_bytes())
 p=SOURCE/'provenance.json';entries={e['path']:e for e in json.loads(p.read_text(encoding='utf-8'))}
 for folder in ['textures','models','animations']:
  for file in (RP/folder).rglob('*'):
   if file.is_file() and (file.stem.startswith('mechanical_press') or file.stem in colors):
    relative=file.relative_to(ROOT).as_posix();entries[relative]={'path':relative,'source':(SOURCE/file.relative_to(RP)).relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'creation':'Original voxel press/sheet asset generated for this project','date':'2026-10-29','tool':'tools/generate_press_assets.py','license':'Distribution license pending project owner decision'}
 save_json(p,[entries[k] for k in sorted(entries)])
if __name__=='__main__':main()
