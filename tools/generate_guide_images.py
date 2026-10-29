"""Original schematic illustrations without external art or embedded language text."""
from generate_assets import ROOT,RP,SOURCE,png,save_json
import hashlib,json
colors={'manual_reference':(149,119,73,255),'manual_overview':(76,133,145,255),'manual_water':(57,137,191,255),'manual_shaft':(133,151,162,255),'manual_gears':(195,134,55,255),'manual_brake':(180,82,52,255),'manual_disconnect':(127,83,121,255),'manual_crafting_table':(146,103,56,255)}
for name,color in colors.items():
 def pixel(x,y):
  bg=(25,36,43,255)
  if name=='manual_crafting_table':
   if 20<x<108 and 20<y<108:
    return (205,166,91,255) if x%28<4 or y%28<4 else (104,69,41,255)
   return bg
  # Voxel diagram: three bearing housings, a shaft and direction arrows.
  if 12<y<18 or 110<y<115:return (64,83,89,255)
  if 18<=y<=94 and 8<x<40:
   if 15<x<33 and 25<y<85:return color
   return (82,100,107,255)
  if 57<=y<=66 and 39<=x<=115:
   if name=='manual_disconnect' and 65<x<83:return bg
   return (200,159,80,255)
  if 78<x<115 and 45<y<79:return color
  if 90<x<107 and 22<y<34:return (196,185,119,255)
  if 100<x<115 and 18<y<39 and x<115-abs(y-28):return (196,185,119,255)
  if name=='manual_water' and 42<x<53 and 20<y<97:return (55,164,221,255)
  if name=='manual_brake' and 80<x<113 and 45<y<79 and abs(x-y-36)<3:return (233,81,65,255)
  return bg
 path=RP/'textures/ui'/f'{name}.png';png(path,128,pixel)
 source=SOURCE/'textures/ui'/path.name;source.parent.mkdir(parents=True,exist_ok=True);source.write_bytes(path.read_bytes())
p=SOURCE/'provenance.json';entries={e['path']:e for e in json.loads(p.read_text(encoding='utf-8'))}
for name in colors:
 path=RP/'textures/ui'/f'{name}.png';relative=path.relative_to(ROOT).as_posix()
 entries[relative]={'path':relative,'source':(SOURCE/'textures/ui'/path.name).relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'creation':'Original schematic generated for this project; no external images','date':'2026-10-29','tool':'tools/generate_guide_images.py','license':'Distribution license pending project owner decision'}
save_json(p,[entries[k] for k in sorted(entries)])
