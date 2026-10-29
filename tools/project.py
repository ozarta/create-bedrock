"""Local preparation tools; not a Minecraft runtime/API validator."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DOCS = ('INVENTARIO_CREATE', 'PARIDAD_FUNCIONAL', 'ARQUITECTURA', 'LICENCIAS', 'RECETAS', 'REALMS', 'ROADMAP')


def validate(root=ROOT):
    subprocess.run(['node', 'tools/validate.mjs'], cwd=root, check=True)
    return len(json.loads((root / 'config/inventory.json').read_text()))


def package(root=ROOT):
    subprocess.run(['npm', 'run', 'package:release'], cwd=root, check=True)
    return root / 'dist'


def audit_source(source, root=ROOT):
    """Enumerate candidate files; deliberately does not claim semantic coverage."""
    source = source.resolve(strict=True)
    sha = subprocess.check_output(['git', '-C', str(source), 'rev-parse', '--verify', 'HEAD^{commit}'], text=True).strip()
    if subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain', '--untracked-files=all'], text=True).strip():
        raise ValueError('La auditoría requiere fuentes sin cambios ni archivos no rastreados')
    files = subprocess.check_output(['git', '-C', str(source), 'ls-files', '-z']).decode().split('\0')
    entries = []
    for name in filter(None, files):
        path = source / name
        if path.is_symlink():
            raise ValueError('Symlink pendiente de inspección: ' + name)
        if not path.is_file():
            raise ValueError('Archivo o submódulo no disponible: ' + name)
        if path.suffix in ('.java', '.json', '.gradle', '.properties', '.toml') or any(t in name.lower() for t in ('license', 'notice', 'copying')):
            entries.append({'path': name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    output = root / 'build/source-audit.json'
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps({'commit': sha, 'version_verified': False, 'semantic_coverage_verified': False, 'files': entries}, indent=2) + '\n')
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['validate', 'package', 'audit-source'])
    parser.add_argument('source', nargs='?', type=Path)
    args = parser.parse_args()
    try:
        if args.command == 'validate':
            print(f'Validación local correcta: {validate()} familias preliminares; no valida Minecraft.')
        elif args.command == 'package':
            print(package())
        elif args.source:
            print(audit_source(args.source))
        else:
            parser.error('audit-source requiere ruta a checkout verificado')
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
