"""Original kinetic models/textures/animations. No upstream art input."""
from pathlib import Path
import hashlib,json,math
from generate_assets import ROOT,RP,SOURCE,png,cube,save_json
KINDS=['shaft','gear','large_gear','gearbox','water_wheel','test_source','speed_meter','stress_meter']
PALETTES=[(105,125,140),(183,111,53),(201,164,67),(69,91,101),(125,83,48),(145,72,61),(67,140,153),(153,119,52)]
def pixel(index,x,y):
 c=PALETTES[index];v=((x*7+y*3+index)%7-3)*3
 if x%16 in (0,15) or y%16 in (0,15):v-=25
 if x%16 in (3,12) and y%16 in (3,12):return (220,190,105,255)
 if index in (6,7) and 7<x<25 and 7<y<25:
  return (30,42,48,255) if x%5 else (185,190,167,255)
 return tuple(max(0,min(255,a+v)) for a in c)+(255,)
def icon(index,x,y):
 dx=x-15.5;dy=y-15.5;r=math.hypot(dx,dy)
 if index in (1,2,4):
  teeth=8 if index!=4 else 10
  radius=14 if math.cos(math.atan2(dy,dx)*teeth)>.1 else 11
  if r>radius or r<3:return (0,0,0,0)
 elif index==0:
  if abs(dx-dy*.4)>4 or abs(dy)>13:return (0,0,0,0)
 elif abs(dx)>12 or abs(dy)>12:return (0,0,0,0)
 return pixel(index,x,y)
def main():
 for i,name in enumerate(KINDS):
  png(RP/'textures/blocks'/f'{name}.png',32,lambda x,y:pixel(i,x,y))
  png(RP/'textures/items'/f'{name}.png',32,lambda x,y:icon(i,x,y))
  base=[cube([-3,0,-3],[6,2,6]),cube([-2,2,-2],[4,12,4])]
  rotor=[cube([-1,0,-1],[2,16,2])]
  needle=[]
  if name in ('gear','large_gear'):
   radius=7 if name=='gear' else 14
   rotor += [cube([-radius+2,6,-radius+2],[2*radius-4,4,2*radius-4])]
   for k in range(8 if name=='gear' else 12):
    angle=2*math.pi*k/(8 if name=='gear' else 12)
    x=round(math.sin(angle)*(radius-1));z=round(math.cos(angle)*(radius-1))
    rotor.append(cube([x-1,6,z-1],[2,4,2]))
  elif name=='shaft':rotor=[cube([-2,0,-2],[4,16,4])];base=[cube([-3,0,-3],[6,2,6]),cube([-3,14,-3],[6,2,6])]
  elif name=='gearbox':
   base=[cube([-6,0,-6],[12,5,12]),cube([-6,11,-6],[12,5,12]),cube([-6,5,-6],[3,6,3]),cube([3,5,3],[3,6,3])]
   rotor+=[cube([-5,6,-5],[10,4,10])]
  elif name=='water_wheel':
   base=[cube([-2,0,-2],[4,16,4])]
   for k in range(8):
    a=2*math.pi*k/8;x=round(math.sin(a)*11);z=round(math.cos(a)*11)
    rotor.append(cube([x-2,5,z-2],[4,6,4]))
   rotor += [cube([-11,7,-1],[22,2,2]),cube([-1,7,-11],[2,2,22])]
  elif name=='test_source':
   base=[cube([-6,0,-6],[12,5,12]),cube([-5,5,-5],[3,8,10])]
   rotor += [cube([-4,7,-4],[8,2,8]),cube([3,9,-1],[2,5,2])]
  else:
   base=[cube([-6,0,-6],[12,6,12]),cube([-5,6,-5],[10,1,10])]
   rotor=[cube([-1,7,-1],[2,9,2])]
   needle=[cube([-.5,8,0],[1,1,5])]
  def model(identifier,bones):return {'format_version':'1.12.0','minecraft:geometry':[{'description':{'identifier':identifier,'texture_width':32,'texture_height':32,'visible_bounds_width':3,'visible_bounds_height':3,'visible_bounds_offset':[0,.5,0]},'bones':bones}]}
  bones=[{'name':'mount','pivot':[0,8,0]},{'name':'rotor','parent':'mount','pivot':[0,8,0],'cubes':rotor}]
  if needle:bones.append({'name':'needle','parent':'mount','pivot':[0,8,0],'cubes':needle})
  # Keep geometry.bedrockworks.gear/shaft IDs for existing worlds and the old display sample.
  save_json(RP/'models/blocks'/f'{name}.geo.json',model('geometry.bedrockworks.'+name,bones))
  save_json(RP/'models/blocks'/f'{name}_base.geo.json',model('geometry.bedrockworks.'+name+'_base',[{'name':'base','pivot':[0,8,0],'cubes':base}]))
  animation={'loop':True,'bones':{'mount':{'rotation':["query.property('bedrockworks:axis') == 2 ? 90 : 0",0,"query.property('bedrockworks:axis') == 0 ? -90 : 0"]},'rotor':{'rotation':[0,'variable.angle',0]}}}
  if needle:animation['bones']['needle']={'rotation':[0,"query.property('bedrockworks:load') * 270" if name=='stress_meter' else "math.abs(query.property('bedrockworks:rpm')) / 256 * 270",0]}
  save_json(RP/'animations'/f'{name}.kinetic.animation.json',{'format_version':'1.8.0','animations':{'animation.bedrockworks.'+name:animation}})
 # Retain editable sources and update hashes for all original outputs, including legacy samples.
 for folder in ('models','textures','animations'):
  for p in (RP/folder).rglob('*'):
   if p.is_file():
    dest=SOURCE/p.relative_to(RP);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes())
 entries=json.loads((SOURCE/'provenance.json').read_text())
 existing={e['path']:e for e in entries}
 for p in RP.rglob('*'):
  if not p.is_file() or (p.suffix not in ('.png','.ogg') and not any(a in p.parts for a in ('models','animations'))):continue
  path=p.relative_to(ROOT).as_posix();source='assets_source/'+p.relative_to(RP).as_posix()
  if p.suffix=='.ogg':source='assets_source/audio/mechanical_click.wav'
  existing[path]={'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source':source,'creation':'Original procedural geometry/pixels for this project; no external art input','date':'2026-10-29','tool':'tools/generate_kinetic_assets.py' if any(name in p.name for name in KINDS) else 'tools/generate_assets.py','license':'Distribution license pending project owner decision'}
 save_json(SOURCE/'provenance.json',[existing[k] for k in sorted(existing)])
if __name__=='__main__':main()
