from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
recipes=json.loads((ROOT/'data/processing/recipes.json').read_text(encoding='utf-8'))
machines=json.loads((ROOT/'data/processing/machines.json').read_text(encoding='utf-8'))
p=ROOT/'src/recipes/generated.ts'
p.write_text("// Generated from data/processing; do not edit.\nimport type { ProcessRecipe,MachineSpec } from './types.js';\nexport const PROCESS_RECIPES:ProcessRecipe[]="+json.dumps(recipes,ensure_ascii=True)+";\nexport const MACHINE_SPECS:MachineSpec[]="+json.dumps(machines,ensure_ascii=True)+";\n",encoding='utf-8',newline='\n')
