import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validate } from '../tools/validate.mjs';
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'bedrockworks-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ['behavior_pack', 'resource_pack', 'src', 'package.json', 'assets_source', 'build/guide-catalog.json', 'data/guide/ui.json', 'data/reference/create-6.0.10-recipes.json', 'data/processing/recipes.json']) cpSync(path, join(root, path), { recursive: true });
  return root;
}
function edit(path, fn) { const data = JSON.parse(readFileSync(path, 'utf8')); fn(data); writeFileSync(path, JSON.stringify(data)); }
test('real project references and stable module versions validate', () => {
  const result = validate();
  assert.equal(result.geometry, 20);
  assert.equal(result.gameplayIdentifiers, 16);
});
test('missing texture is caught', t => {
  const root = fixture(t);
  unlinkSync(join(root, 'resource_pack/textures/blocks/gear.png'));
  assert.throws(() => validate(root), /Recurso faltante/);
});
test('duplicate gameplay identifiers across files are caught', t => {
  const root = fixture(t);
  cpSync(join(root, 'behavior_pack/items/guidebook.json'), join(root, 'behavior_pack/items/duplicate.json'));
  assert.throws(() => validate(root), /Identificador duplicado/);
});
test('missing model reference is caught', t => {
  const root = fixture(t);
  edit(join(root, 'behavior_pack/blocks/gear.json'), x => x['minecraft:block'].components['minecraft:geometry'] = 'geometry.missing');
  assert.throws(() => validate(root), /Geometría faltante/);
});
test('missing translation in one locale is caught', t => {
  const root = fixture(t), path = join(root, 'resource_pack/texts/en_US.lang');
  writeFileSync(path, readFileSync(path, 'utf8').replace(/^manual.title=.*\n/m, ''));
  assert.throws(() => validate(root), /Traducción faltante/);
});
test('missing translation in every locale is also caught', t => {
  const root = fixture(t);
  for (const pack of ['behavior_pack', 'resource_pack']) for (const lang of ['es_MX', 'en_US']) {
    const path = join(root, pack, 'texts', lang + '.lang');
    writeFileSync(path, readFileSync(path, 'utf8').replace(/^manual.title=.*\n/m, ''));
  }
  assert.throws(() => validate(root), /Traducción usada faltante/);
});
test('broken UUID link is caught', t => {
  const root = fixture(t);
  edit(join(root, 'behavior_pack/manifest.json'), x => x.dependencies[0].uuid = 'f051ef04-2ffb-49df-8098-cfce32bc1836');
  assert.throws(() => validate(root), /Packs no enlazados/);
});
test('beta dependency is rejected', t => {
  const root = fixture(t);
  edit(join(root, 'behavior_pack/manifest.json'), x => x.dependencies[1].version = '2.13.0-beta');
  assert.throws(() => validate(root), /API no estable/);
});
test('missing animation is caught', t => {
  const root = fixture(t);
  unlinkSync(join(root, 'resource_pack/animations/rotation.animation.json'));
  assert.throws(() => validate(root), /Animación faltante/);
});
test('malformed JSON is rejected', t => {
  const root = fixture(t);
  writeFileSync(join(root, 'behavior_pack/items/broken.json'), '{');
  assert.throws(() => validate(root), SyntaxError);
});

test('missing sound is caught', t => {
  const root = fixture(t);
  unlinkSync(join(root, 'resource_pack/sounds/mechanical_click.ogg'));
  assert.throws(() => validate(root), /Recurso faltante/);
});
test('animation bone mismatch is caught', t => {
  const root = fixture(t);
  edit(join(root, 'resource_pack/animations/rotation.animation.json'), x => {
    x.animations['animation.bedrockworks.rotation'].bones = { missing: { rotation: [0, 1, 0] } };
  });
  assert.throws(() => validate(root), /Hueso de animación faltante/);
});
test('changed resource requires provenance hash refresh', t => {
  const root = fixture(t);
  const path = join(root, 'resource_pack/textures/blocks/gear.png');
  const data = readFileSync(path);
  data[data.length - 1] ^= 1;
  writeFileSync(path, data);
  assert.throws(() => validate(root), /Hash de recurso divergente/);
});

test('art added without a provenance entry is rejected',t=>{
 const root=fixture(t);cpSync(join(root,'resource_pack/textures/blocks/gear.png'),join(root,'resource_pack/textures/unreviewed.png'));
 assert.throws(()=>validate(root),/Recurso sin procedencia/);
});
test('duplicate provenance entries cannot conceal missing art review',t=>{
 const root=fixture(t);edit(join(root,'assets_source/provenance.json'),a=>a.push(a[0]));assert.throws(()=>validate(root),/Identificador duplicado/);
});
test('geometry overrides in block permutations are validated',t=>{
 const root=fixture(t);edit(join(root,'behavior_pack/blocks/mechanical_funnel.json'),d=>d['minecraft:block'].permutations[0].components['minecraft:geometry']='geometry.missing');
 assert.throws(()=>validate(root),/Geometría de permutación faltante/);
});
test('translation parameter differences are rejected',t=>{
 const root=fixture(t),path=join(root,'resource_pack/texts/en_US.lang');writeFileSync(path,readFileSync(path,'utf8').replace(/^(kinetic.reading=).*$/m,'$1No parameters'));
 assert.throws(()=>validate(root),/Parámetros de traducción divergentes/);
});
test('additional runtime modules cannot silently expand the Realms API requirements',t=>{
 const root=fixture(t);edit(join(root,'behavior_pack/manifest.json'),x=>x.dependencies.push({module_name:'@minecraft/server-net',version:'1.0.0'}));
 assert.throws(()=>validate(root),/Dependencia no autorizada/);
});
test('experimental entities are rejected',t=>{
 const root=fixture(t);edit(join(root,'behavior_pack/entities/visual_mechanical_press.json'),x=>x['minecraft:entity'].description.is_experimental=true);
 assert.throws(()=>validate(root),/Entidad experimental/);
});
