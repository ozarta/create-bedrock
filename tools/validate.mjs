import { validateGuide } from './validate-guide.mjs';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const fail = message => { throw new Error(message); };
export function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(e => {
    if (e.isSymbolicLink()) fail(`Symlink no permitido: ${e.name}`);
    return e.isDirectory() ? files(join(root, e.name)) : [join(root, e.name)];
  });
}
function unique(map, id, path) {
  if (map.has(id)) fail(`Identificador duplicado ${id}: ${path}, ${map.get(id)}`);
  map.set(id, path);
}
export function parseLang(path) {
  const map = new Map();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index <= 0 || !line.slice(index + 1).trim()) fail(`Traducción inválida: ${path}`);
    unique(map, line.slice(0, index), path);
    map.set(line.slice(0, index), line.slice(index + 1));
  }
  return map;
}
export function validate(root = process.cwd()) {
  const bp = join(root, 'behavior_pack'), rp = join(root, 'resource_pack');
  const json = path => JSON.parse(readFileSync(path, 'utf8'));
  const all = [...files(bp), ...files(rp)];
  const documents = all.filter(p => p.endsWith('.json')).map(p => [p, json(p)]);
  const b = json(join(bp, 'manifest.json')), r = json(join(rp, 'manifest.json'));
  const uuids = new Map();
  for (const [path, m] of [[bp, b], [rp, r]]) {
    if (m.format_version !== 2) fail('Formato de manifiesto no soportado');
    for (const part of [m.header, ...m.modules]) {
      if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(part.uuid)) fail('UUID inválido');
      unique(uuids, part.uuid, path);
    }
    if (JSON.stringify(m.header.min_engine_version) !== '[1,26,60]') fail('Versión mínima inesperada');
  }
  const link = b.dependencies.find(d => d.uuid === r.header.uuid);
  if (!link || JSON.stringify(link.version) !== JSON.stringify(r.header.version)) fail('Packs no enlazados');
  if (b.dependencies.length!==3 || b.dependencies.some(d=>d.uuid ? d.uuid!==r.header.uuid : !['@minecraft/server','@minecraft/server-ui'].includes(d.module_name))) fail('Dependencia no autorizada');
  if (r.dependencies?.length || b.capabilities?.length || r.capabilities?.length) fail('Capacidades o dependencias adicionales sin revisar');
  const pkg = json(join(root, 'package.json'));
  const version = pkg.version.split('.').map(Number);
  for (const manifest of [b, r]) {
    if (JSON.stringify(manifest.header.version) !== JSON.stringify(version)) fail('Versión de pack divergente');
    for (const module of manifest.modules) if (JSON.stringify(module.version) !== JSON.stringify(version)) fail('Versión de módulo divergente');
  }
  for (const name of ['@minecraft/server', '@minecraft/server-ui']) {
    const dep = b.dependencies.find(d => d.module_name === name);
    if (!dep || dep.version !== pkg.devDependencies[name] || !/^\d+\.\d+\.\d+$/.test(dep.version)) fail(`API no estable o divergente: ${name}`);
  }
  const entry = b.modules.find(m => m.type === 'script')?.entry;
  if (!entry || !existsSync(join(bp, entry))) fail('Falta script compilado');
  const geometries = new Map(), animations = new Map(), renders = new Map();
  const registries = new Map();
  const registry = name => { if (!registries.has(name)) registries.set(name, new Map()); return registries.get(name); };
  for (const [path, data] of documents) {
    if (data['minecraft:entity']?.description?.is_experimental===true) fail('Entidad experimental no permitida');
    for (const g of data['minecraft:geometry'] ?? []) unique(geometries, g.description.identifier, path);
    for (const id of Object.keys(data.animations ?? {})) unique(animations, id, path);
    for (const id of Object.keys(data.render_controllers ?? {})) unique(renders, id, path);
    for (const [kind, obj] of Object.entries(data)) {
      const id = obj?.description?.identifier;
      if (kind.startsWith('minecraft:') && id) {
        // Block and item identifiers share a gameplay namespace; entity client/server are intentionally paired.
        const scope = ['minecraft:block', 'minecraft:item'].includes(kind) ? 'block/item' : kind.startsWith('minecraft:recipe_') ? 'recipes' : kind;
        unique(registry(scope), id, path);
      }
    }
  }
  const texture = (name, extension = '.png') => {
    if (name.startsWith('/') || name.includes('..') || !existsSync(join(rp, name + extension))) fail(`Recurso faltante o ruta inválida: ${name}${extension}`);
  };
  const terrain = json(join(rp, 'textures/terrain_texture.json')).texture_data;
  const items = json(join(rp, 'textures/item_texture.json')).texture_data;
  for (const atlas of [terrain, items]) for (const data of Object.values(atlas)) texture(data.textures);
  for (const [path, data] of documents) {
    const block = data['minecraft:block'];
    if (block) {
      const c = block.components;
      for (const permutation of block.permutations ?? []) {
        const overrides = permutation.components ?? {};
        const geometry = overrides['minecraft:geometry'];
        const id = typeof geometry === 'string' ? geometry : geometry?.identifier;
        if (id && !geometries.has(id)) fail(`Geometría de permutación faltante ${id}`);
        for (const material of Object.values(overrides['minecraft:material_instances'] ?? {})) if (!terrain[material.texture]) fail(`Textura de permutación faltante ${material.texture}`);
      }
      const geo = typeof c['minecraft:geometry'] === 'string' ? c['minecraft:geometry'] : c['minecraft:geometry']?.identifier;
      if (!geometries.has(geo)) fail(`Geometría faltante ${geo}`);
      const inventoryGeometry = c['minecraft:item_visual']?.geometry;
      if (inventoryGeometry && !geometries.has(inventoryGeometry)) fail(`Geometría de inventario faltante ${inventoryGeometry}`);
      for (const material of Object.values(c['minecraft:item_visual']?.material_instances ?? {})) if (!terrain[material.texture]) fail(`Textura de inventario faltante ${material.texture}`);
      for (const m of Object.values(c['minecraft:material_instances'] ?? {})) if (!terrain[m.texture]) fail(`Textura de bloque faltante: ${m.texture}`);
      if (c['minecraft:loot'] && !existsSync(join(bp, c['minecraft:loot']))) fail(`Loot faltante: ${path}`);
    }
    const item = data['minecraft:item'];
    if (item && !items[item.components['minecraft:icon']]) fail(`Icono faltante: ${path}`);
    const entity = data['minecraft:client_entity']?.description;
    if (entity) {
      if (!registry('minecraft:entity').has(entity.identifier)) fail('Entidad de cliente sin servidor');
      for (const g of Object.values(entity.geometry)) if (!geometries.has(g)) fail(`Geometría de entidad faltante ${g}`);
      for (const t of Object.values(entity.textures)) texture(t);
      for (const a of Object.values(entity.animations)) {
        if (!animations.has(a)) fail(`Animación faltante ${a}`);
        const animation = json(animations.get(a)).animations[a];
        const bones = new Set(Object.values(entity.geometry).flatMap(id => json(geometries.get(id))['minecraft:geometry'].filter(g => g.description.identifier === id).flatMap(g => g.bones.map(bone => bone.name))));
        for (const bone of Object.keys(animation.bones ?? {})) if (!bones.has(bone)) fail(`Hueso de animación faltante ${bone}`);
      }
      for (const a of entity.scripts?.animate ?? []) if (!entity.animations[a]) fail(`Alias de animación faltante ${a}`);
      for (const c of entity.render_controllers) if (!renders.has(c)) fail(`Render controller faltante ${c}`);
    }
    for (const recipe of Object.entries(data).filter(([k]) => k.startsWith('minecraft:recipe_')).map(([, v]) => v)) {
      for (const item of [...recipe.ingredients, recipe.result]) {
        if (!item.item.startsWith('minecraft:') && !registry('block/item').has(item.item)) fail(`Item de receta desconocido ${item.item}`);
      }
    }
    for (const sound of Object.values(data.sound_definitions ?? {})) for (const value of sound.sounds) texture(typeof value === 'string' ? value : value.name, '.ogg');
  }
  for (const [path, data] of documents) for (const pool of data.pools ?? []) for (const entry of pool.entries) {
    if (entry.type === 'item' && !entry.name.startsWith('minecraft:') && !registry('block/item').has(entry.name)) fail(`Drop desconocido ${entry.name}`);
  }
  for (const path of files(join(bp, 'scripts')).filter(p => p.endsWith('.js'))) {
    const text = readFileSync(path, 'utf8');
    for (const match of text.matchAll(/from ['"]([^'"]+)['"]/g)) {
      const name = match[1];
      if (name.startsWith('.')) {
        if (!existsSync(resolve(path, '..', name))) fail(`Import de script faltante ${name}`);
      } else if (!['@minecraft/server', '@minecraft/server-ui'].includes(name)) fail(`Import runtime no permitido ${name}`);
    }
  }
  const languageSets = [];
  for (const pack of [bp, rp]) {
    const locales = json(join(pack, 'texts/languages.json'));
    if (JSON.stringify(locales) !== '["es_MX","en_US"]') fail('Locales o idioma principal inesperados');
    const maps = locales.map(locale => parseLang(join(pack, 'texts', locale + '.lang')));
    for (const map of maps) for (const key of new Set(maps.flatMap(m => [...m.keys()]))) if (!map.has(key)) fail(`Traducción faltante ${key}`);
    const placeholders = value => [...value.matchAll(/%(?:\d+\$)?[sd]|\{\d+\}/g)].map(m => m[0]).sort().join('|');
    for (const [key,value] of maps[0]) if (placeholders(value) !== placeholders(maps[1].get(key))) fail(`Parámetros de traducción divergentes ${key}`);
    languageSets.push(...maps);
  }
  const keys = new Set(['pack.name', 'pack.description', 'entity.bedrockworks:gear_display.name']);
  for (const [path, data] of documents) {
    const block = data['minecraft:block'];
    if (block) keys.add('tile.' + block.description.identifier + '.name');
    const item = data['minecraft:item'];
    if (item) keys.add(item.components['minecraft:display_name'].value);
  }
  for (const path of files(join(root, 'src')).filter(p => p.endsWith('.ts'))) {
    const text = readFileSync(path, 'utf8');
    for (const match of text.matchAll(/\bt\('([^']+)'\)/g)) keys.add(match[1]);
    for (const match of text.matchAll(/'(guide\.[a-z_]+\.(?:title|body))'/g)) keys.add(match[1]);
  }
  for (const status of ['pending','running','idle','overloaded','conflict','overspeed','unloaded']) keys.add('kinetic.status.'+status);
  for (const role of ['input','output']) keys.add('factory.funnel.role.'+role);
  for (const direction of ['north','east','south','west']) keys.add('factory.funnel.direction.'+direction);
  for (const key of keys) for (const map of languageSets) if (!map.has(key)) fail(`Traducción usada faltante ${key}`);
  for (const path of all.filter(p => p.endsWith('.png'))) {
    if (!readFileSync(path).subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) fail(`PNG inválido ${path}`);
  }
  const provenance = new Map();
  for (const entry of json(join(root, 'assets_source/provenance.json'))) {
    unique(provenance,entry.path,'assets_source/provenance.json');
    const path = resolve(root, entry.path);
    if (!path.startsWith(resolve(root) + sep) || !existsSync(path)) fail(`Procedencia inválida ${entry.path}`);
    if (!existsSync(join(root, entry.source))) fail(`Fuente original faltante ${entry.source}`);
    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== entry.sha256) fail(`Hash de recurso divergente ${entry.path}`);
  }
  for (const path of files(rp)) {
    const name=relative(root,path).split(sep).join('/');
    if ((/\.(png|ogg)$/.test(path)||name.startsWith('resource_pack/models/')||name.startsWith('resource_pack/animations/'))&&!provenance.has(name)) fail(`Recurso sin procedencia ${name}`);
  }
  const guide = validateGuide(root);
  return { guide, json: documents.length, geometry: geometries.size, gameplayIdentifiers: registry('block/item').size, translationKeys: languageSets[0].size };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(validate());
