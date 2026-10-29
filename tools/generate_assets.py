"""Original procedural voxel assets. No external images or Create resources."""
from pathlib import Path
import hashlib
import json
import math
import struct
import subprocess
import wave
import zlib

ROOT = Path(__file__).resolve().parents[1]
RP = ROOT / 'resource_pack'
SOURCE = ROOT / 'assets_source'


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n')


def png(path, size, pixel):
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data))
    raw = b''.join(b'\0' + bytes(c for x in range(size) for c in pixel(x, y)) for y in range(size))
    content = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', size, size, 8, 6, 0, 0, 0))
    content += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def metal(name, x, y):
    palette = {'gear': (171, 106, 49), 'shaft': (100, 117, 128)}
    color = palette[name]
    shade = ((x * 3 + y * 7) % 9 - 4) * 2
    if x % 16 in (0, 15) or y % 16 in (0, 15): shade -= 28
    if x % 16 in (3, 12) and y % 16 in (3, 12): return (205, 182, 106, 255)
    return tuple(max(0, min(255, c + shade)) for c in color) + (255,)


def icon(name, x, y):
    dx, dy = x - 15.5, y - 15.5
    if name == 'gear':
        angle, radius = math.atan2(dy, dx), math.hypot(dx, dy)
        outer = 14 if math.cos(angle * 8) > 0 else 11
        if radius > outer or radius < 4: return (0, 0, 0, 0)
        return metal('gear', x, y)
    if name == 'shaft':
        if abs(dx - dy * 0.5) > 4 or abs(dy) > 13: return (0, 0, 0, 0)
        return metal('shaft', x, y)
    if 5 <= x <= 26 and 3 <= y <= 28:
        if x in (5, 6, 25, 26) or y in (3, 4, 27, 28): return (159, 104, 50, 255)
        if 11 <= x <= 22 and y in (10, 15, 20): return (204, 181, 109, 255)
        return (46, 65, 69, 255)
    return (0, 0, 0, 0)


def cube(origin, size):
    return {'origin': origin, 'size': size, 'uv': {side: {'uv': [0, 0], 'uv_size': [32, 32]} for side in ('north', 'south', 'east', 'west', 'up', 'down')}}


def main():
    for name in ('gear', 'shaft'):
        png(RP / 'textures/blocks' / (name + '.png'), 32, lambda x, y: metal(name, x, y))
        png(RP / 'textures/items' / (name + '.png'), 32, lambda x, y: icon(name, x, y))
        if name == 'gear':
            cubes = [cube([-4, 0, -4], [8, 4, 8]), cube([-2, 0, -6], [4, 4, 12]), cube([-6, 0, -2], [12, 4, 4])]
            for x, z in [(-5, -5), (-5, 3), (3, -5), (3, 3)]: cubes.append(cube([x, 0, z], [2, 4, 2]))
            cubes.append(cube([-2, 4, -2], [4, 2, 4]))
        else:
            cubes = [cube([-2, 0, -2], [4, 16, 4]), cube([-3, 1, -3], [6, 2, 6]), cube([-3, 13, -3], [6, 2, 6])]
        model = {'format_version': '1.12.0', 'minecraft:geometry': [{'description': {'identifier': 'geometry.bedrockworks.' + name, 'texture_width': 32, 'texture_height': 32, 'visible_bounds_width': 2, 'visible_bounds_height': 2, 'visible_bounds_offset': [0, 0.5, 0]}, 'bones': [{'name': 'rotor', 'pivot': [0, 2 if name == 'gear' else 8, 0], 'cubes': cubes}]}]}
        save_json(RP / 'models/blocks' / (name + '.geo.json'), model)
    png(RP / 'textures/items/guidebook.png', 32, lambda x, y: icon('guidebook', x, y))
    for pack in ('resource_pack', 'behavior_pack'):
        png(ROOT / pack / 'pack_icon.png', 64, lambda x, y: icon('gear', x // 2, y // 2) if icon('gear', x // 2, y // 2)[3] else (36, 48, 54, 255))
    # Deterministic synthesis: damped metal partials plus seeded pseudo-noise.
    wav = SOURCE / 'audio/mechanical_click.wav'
    wav.parent.mkdir(parents=True, exist_ok=True)
    samples = []
    state = 123456789
    for i in range(14400):
        t = i / 48000
        state = (1664525 * state + 1013904223) % 2**32
        noise = state / 2**31 - 1
        value = sum(math.sin(2 * math.pi * f * t) * a * math.exp(-t * d) for f, a, d in [(420, .3, 25), (1173, .15, 35), (2861, .07, 45)])
        value += noise * .09 * math.exp(-t * 65)
        samples.append(struct.pack('<h', int(max(-1, min(1, value)) * 24000)))
    with wave.open(str(wav), 'wb') as stream:
        stream.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
        stream.writeframes(b''.join(samples))
    ogg = RP / 'sounds/mechanical_click.ogg'
    ogg.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-fflags', '+bitexact', '-i', str(wav), '-map_metadata', '-1', '-c:a', 'libvorbis', '-flags:a', '+bitexact', '-q:a', '4', str(ogg)], check=True)
    # Editable originals are retained independently from pack outputs.
    for folder in ('models', 'textures', 'animations'):
        for path in sorted((RP / folder).rglob('*')):
            if path.is_file():
                dest = SOURCE / path.relative_to(RP)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(path.read_bytes())
    (SOURCE / 'pack_icon.png').write_bytes((RP / 'pack_icon.png').read_bytes())
    paths = [p for p in RP.rglob('*') if p.is_file() and p.suffix in ('.png', '.ogg')]
    paths += list((RP / 'models').rglob('*.json')) + list((RP / 'animations').rglob('*.json'))
    entries = []
    for p in sorted(paths):
        relative = p.relative_to(ROOT).as_posix()
        source = 'assets_source/audio/mechanical_click.wav' if p.suffix == '.ogg' else 'assets_source/' + p.relative_to(RP).as_posix()
        entries.append({'path': relative, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'source': source, 'creation': 'Original procedural generation for this project by Codex; no external asset input', 'date': '2026-10-29', 'tool': 'tools/generate_assets.py; ffmpeg for Vorbis', 'license': 'Distribution license pending project owner decision'})
    save_json(SOURCE / 'provenance.json', entries)


if __name__ == '__main__': main()
