"""Strict project JSON/provenance audit; optional exact upstream byte comparison."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
def pairs(values):
    result={}
    for key,value in values:
        if key in result: raise ValueError('Clave JSON duplicada: '+key)
        result[key]=value
    return result
def reject(value):raise ValueError('Número JSON no finito: '+value)
def strict(path):return json.loads(path.read_text(encoding='utf-8'),object_pairs_hook=pairs,parse_constant=reject)
def audit(upstream=None):
    files=[p for folder in ['behavior_pack','resource_pack','data','config','assets_source','docs'] for p in (ROOT/folder).rglob('*.json')]+[ROOT/'package.json',ROOT/'package-lock.json',ROOT/'tsconfig.json']
    for path in files:
        try:strict(path)
        except (ValueError,OSError) as error:raise ValueError(str(path.relative_to(ROOT))+': '+str(error)) from error
    provenance=strict(ROOT/'assets_source/provenance.json')
    matching=0;different_formats=[]
    for entry in provenance:
        for field in ['source','tool']:
            path=(ROOT/entry[field]).resolve()
            if not path.is_relative_to(ROOT) or not path.is_file():raise ValueError('Fuente/herramienta de procedencia inválida: '+entry[field])
        if Path(entry['path']).suffix==Path(entry['source']).suffix:
            if (ROOT/entry['path']).read_bytes()!=(ROOT/entry['source']).read_bytes():raise ValueError('Fuente artística divergente: '+entry['path'])
            matching+=1
        else:different_formats.append({'asset':entry['path'],'source':entry['source']})
    result={'jsonFiles':len(files),'strictJson':True,'artProvenanceEntries':len(provenance),'sameFormatSourcesMatch':matching,'encodedFromDifferentSourceFormat':different_formats,'upstreamComparison':'not executed'}
    if upstream:
        upstream=Path(upstream).resolve();commit=subprocess.check_output(['git','-C',str(upstream),'rev-parse','HEAD'],text=True).strip()
        expected='ac0c444d9828da3453ae8cc65338e8de063286fb'
        if commit!=expected:raise ValueError('Commit Java incorrecto: '+commit)
        assets=upstream/'src/main/resources/assets'
        hashes={hashlib.sha256(p.read_bytes()).hexdigest() for p in assets.rglob('*') if p.is_file()}
        identical=[e['path'] for e in provenance if e['sha256'] in hashes]
        if identical:raise ValueError('Recurso idéntico a arte protegido: '+str(identical))
        reference=strict(ROOT/'data/reference/create-6.0.10-recipes.json')
        for recipe in reference['recipes']:
            path=upstream/recipe['source']
            if hashlib.sha256(path.read_bytes()).hexdigest()!=recipe['sha256'] or strict(path)!=recipe['raw']:raise ValueError('Referencia Java divergente: '+recipe['id'])
        result.update(upstreamComparison='exact byte hashes; no matches',upstreamCommit=commit,upstreamArtFiles=sum(1 for p in assets.rglob('*') if p.is_file()),referenceRecipesChecked=len(reference['recipes']))
    return result
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--upstream');parser.add_argument('--output');args=parser.parse_args()
    result=audit(args.upstream);encoded=json.dumps(result,indent=2)+'\n'
    if args.output:Path(args.output).write_text(encoded,encoding='utf-8')
    print(encoded,end='')
