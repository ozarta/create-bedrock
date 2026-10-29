# Instalación de prueba — 0.4.2

El paquete está preparado para **pruebas**, sin ejecución confirmada en Minecraft o Realms. No usar el único ejemplar de un mundo importante. [Estado y límites](ESTADO_FUNCIONAL.md).

## Windows

1. Exporta un respaldo del mundo y conserva una copia fuera de Minecraft. Descarga `dist/CreateBedrock-dev.mcaddon` y su `.sha256`. Comprueba el hash con `Get-FileHash .\CreateBedrock-dev.mcaddon -Algorithm SHA256` en PowerShell.
2. Usa Minecraft **Bedrock para Windows**, estable 26.60. La referencia técnica confirmada es `1.26.60.5`; registra la versión completa instalada. Java Edition y Preview no son los objetivos de esta prueba.
3. Abre el `.mcaddon` con Minecraft. Comprueba el resultado real de importación de Behavior Pack y Resource Pack; este documento no afirma que la importación haya funcionado. Si Windows renombra el archivo `.zip`, conserva la extensión `.mcaddon`.
4. Crea un mundo de prueba o una copia respaldada. Activa el BP Taller de Engranajes y verifica que su RP vinculado también esté activo. **Todos los experimentos apagados**, incluido Beta APIs. El pack solicita server 2.11.0 y server-ui 2.3.0.
5. Habilita el registro de contenido en Configuración → Creador, si está disponible en tu cliente. Entra y revisa errores de dependencias, JSON, scripts, texturas y geometrías. Registra el log disponible; no habilites experimentos para ocultar errores.
6. En supervivencia, fabrica el Manual de Ingeniería Mecánica con libro + lingote de cobre. Úsalo y abre Tutoriales → Primera fábrica de láminas sin comandos. Completa [PRUEBAS_WINDOWS.md](PRUEBAS_WINDOWS.md).

## Actualizar desde 0.4.0/0.4.1

Mantiene los UUID del proyecto; incrementa versiones BP/RP/módulos a 0.4.2. Cierra el mundo, respalda e importa la nueva versión; comprueba que el mundo utiliza 0.4.2 en ambos packs. Evita duplicados activos. No borres datos del mundo ni sus propiedades para resolver una actualización. Si Minecraft conserva la versión anterior, prueba primero una copia nueva del mundo e inspecciona los packs instalados. No se ha probado la migración en el motor; el esquema del progreso sigue en v1.

Para revertir, restaura el respaldo completo y la versión de pack con la que fue creado. No retirar el BP de un mundo con bloques personalizados como estrategia de rollback: Minecraft puede perder esos bloques.

## Realms

Primero completa la prueba Windows. El propietario debe respaldar y descargar el mundo actual, usar un **slot/mundo de prueba** y subir una copia que tenga ambos packs activados. Esta acción puede reemplazar el slot elegido: realizarla desde el cliente con el destino revisado. No se ha subido ningún mundo a Realms durante esta revisión.

Exige la descarga del RP a quienes entren, verifica versiones reales cliente/servicio y repite [PRUEBAS_REALMS.md](PRUEBAS_REALMS.md). No existe una instalación de Java, npm, Python ni servicios externos en runtime; esas herramientas son solo de desarrollo.

## Reproducir el paquete

Node 24, npm y Python 3.12; dependencias exactas en package-lock.json. En Linux/macOS:

```sh
npm ci --ignore-scripts
npm test
python3 -m unittest discover -s tests -v
npm run demo
npm run demo:factory
npm run benchmark
python3 tools/package_addon.py
```

En Windows, el build detecta `py -3`. Después de `npm test`, utiliza `py -3 -m unittest discover -s tests -v` y `py -3 tools/package_addon.py`; para los scripts npm que invocan explícitamente python3, usa directamente `py -3 tools/qa-static.py`. Los assets ya están incluidos; no necesitas FFmpeg para compilar ni jugar.

El empaquetador genera el archivo versionado y `dist/CreateBedrock-dev.mcaddon` con idénticos bytes, más sus hashes. Los anteriores se conservan. Para contrastar las fuentes Java opcionalmente: `python3 tools/qa-static.py --upstream /ruta/al/checkout/exacto`; nunca apuntar a una rama posterior. El alias de entrega es de desarrollo; `package:release` conserva bloqueos de licencia y pruebas de juego.
