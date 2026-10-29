"""Create the in-game demonstration from the same fixture used by Node tests."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
fixture=json.loads((ROOT/'config/kinetic-demo.json').read_text())
lines=['# Development demo. Overwrites the explicitly listed positions. Use an empty test area only.']
def relative(n):return '~'+(str(n) if n else '')
def command(x,y,z,block,states=None):
 state=' ['+', '.join(json.dumps(k)+'='+json.dumps(v) for k,v in states.items())+']' if states else ''
 return 'setblock '+' '.join(map(relative,(x,y,z)))+' '+block+state
# A contained waterfall on the +Z tangential side; let vanilla fluids form the falling cells.
for y in (1,2,3):
 for x,z in [(-1,1),(1,1),(0,2),(0,0)]:
  if y==1 and x==0 and z==0:continue
  lines.append(command(x,y,z,'minecraft:glass'))
lines.append(command(0,0,1,'minecraft:stone'))
for p in fixture['blocks']:
 states={'bedrockworks:axis':p['axis']}
 if 'impact' in p:states['bedrockworks:brake']=p['impact']
 lines.append(command(p['x'],p['y'],p['z'],'bedrockworks:'+p['kind'],states))
lines.append(command(0,1,1,'minecraft:air'))
lines.append(command(0,2,1,'minecraft:air'))
lines.append(command(0,3,1,'minecraft:water',{'liquid_depth':0}))
p=ROOT/'behavior_pack/functions/bedrockworks/kinetic_demo.mcfunction';p.parent.mkdir(parents=True,exist_ok=True);p.write_text('\n'.join(lines)+'\n')
