"""Deterministic development archive. This does not test Minecraft import."""
from pathlib import Path
import argparse
import hashlib
import io
import json
import os
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def archive(entries):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        for name, content in sorted(entries):
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            output.writestr(info, content, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return stream.getvalue()


def package(root=ROOT, release=False):
    # Recompile and validate even when invoked directly; never package stale JS.
    subprocess.run(['node', 'tools/build.mjs'], cwd=root, check=True)
    if release:
        gates = json.loads((root / 'config/research.json').read_text())['release_gates']
        missing = [k for k, v in gates.items() if v is not True]
        if missing:
            raise ValueError('Release bloqueado: ' + ', '.join(missing))
    entries = []
    for folder in ('behavior_pack', 'resource_pack'):
        base = root / folder
        inner = []
        for path in sorted(base.rglob('*')):
            if path.is_symlink():
                raise ValueError('Symlink no permitido: ' + str(path))
            if path.is_file() and path.name != '.gitkeep':
                inner.append((path.relative_to(base).as_posix(), path.read_bytes()))
        entries.append((folder + '.mcpack', archive(inner)))
    content = archive(entries)
    dist = root / 'dist'
    dist.mkdir(exist_ok=True)
    version = json.loads((root / 'package.json').read_text())['version']
    name = 'create-bedrock-' + ('release' if release else 'dev') + '-' + version + '.mcaddon'
    destination = dist / name
    temporary = destination.with_suffix('.tmp')
    temporary.write_bytes(content)
    os.replace(temporary, destination)
    (dist / (name + '.sha256')).write_text(hashlib.sha256(content).hexdigest() + '  ' + name + '\n')
    if not release:
        # Stable delivery filename is an exact copy of the versioned development artifact.
        alias = dist / 'CreateBedrock-dev.mcaddon'
        staged = alias.with_suffix('.tmp')
        staged.write_bytes(content)
        os.replace(staged, alias)
        (dist / (alias.name + '.sha256')).write_text(hashlib.sha256(content).hexdigest() + '  ' + alias.name + '\n')
    return destination


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--release', action='store_true')
    args = parser.parse_args()
    try:
        print(package(release=args.release))
        if not args.release: print('DESARROLLO: importación Windows/Realms pendiente; no distribuir como versión validada.')
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, str(error) + '\n')
