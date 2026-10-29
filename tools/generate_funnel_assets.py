"""Original two-pose transfer gate. Block permutations animate real transfer; no extra entity."""
from generate_assets import ROOT,RP,SOURCE,png,cube,save_json
import hashlib,json
for folder in ['items','blocks']:
 png(RP/'textures'/folder/'mechanical_funnel.png',32,lambda x,y:(184,112,60,255) if x%8<2 or y%8<2 else (67,96,106,255))
for active in [False,True]:
 name='mechanical_funnel'+('_active' if active else '')
 bones=[{'name':'gate','pivot':[0,8,0],'cubes':[cube([-7,0,-7],[14,3,14]),cube([-7,3,-7],[3,9,14]),cube([4,3,-7],[3,9,14]),cube([-3,5 if active else 9,-3],[6,2,6])]}]
 data={'format_version':'1.12.0','minecraft:geometry':[{'description':{'identifier':'geometry.bedrockworks.'+name,'texture_width':32,'texture_height':32,'visible_bounds_width':2,'visible_bounds_height':2,'visible_bounds_offset':[0,.5,0]},'bones':bones}]}
 save_json(RP/'models/blocks'/f'{name}.geo.json',data)
p=SOURCE/'provenance.json';entries={e['path']:e for e in json.loads(p.read_text(encoding='utf-8'))}
for folder in ['textures','models']:
 for f in (RP/folder).rglob('*'):
  if f.is_file() and f.stem.startswith('mechanical_funnel'):
   dest=SOURCE/f.relative_to(RP);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(f.read_bytes());path=f.relative_to(ROOT).as_posix();entries[path]={'path':path,'source':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'creation':'Original voxel transfer gate with two native block poses','date':'2026-10-29','tool':'tools/generate_funnel_assets.py','license':'Distribution license pending project owner decision'}
save_json(p,[entries[k] for k in sorted(entries)])
