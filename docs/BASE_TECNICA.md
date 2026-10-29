# Base técnica 0.1.0 — registro histórico

La versión actual es 0.2.0; consultar [CINETICA.md](CINETICA.md). Los resultados y tamaños de esta página corresponden a la base anterior, no al paquete actual.

Esta fase sustituye los directorios provisionales `packs/behavior`, `packs/resource` y `assets/source` por `behavior_pack`, `resource_pack` y `assets_source`. Las carpetas antiguas solo contenían placeholders creados en la fase anterior. Los documentos de investigación conservan sus pendientes upstream; las herramientas anteriores delegan al pipeline actual.

## Versiones y evidencia

Comprobación del 2026-10-29:

- El tag oficial [`v1.26.60.5`](https://github.com/Mojang/bedrock-samples/tree/15701fa9c13923f12662984c32c124327e40e3d3) resuelve al SHA mostrado. Su `version.json` declara `latest: 1.26.60.5`, fecha 27-10-2026; su `behavior_pack/manifest.json` usa `[1,26,60]`. Se respeta esa notación interna aunque el nombre comercial solicitado sea Bedrock 26.60.
- npm devolvió `@minecraft/server@2.11.0` y `@minecraft/server-ui@2.3.0`; `latest` de UI es 2.3.0, separado de beta/rc. UI declara peer `@minecraft/server: ^2.0.0`. El lockfile fija también common 1.3.0 y vanilla-data 1.26.60, ambos paquetes de desarrollo.
- Fuentes oficiales de documentación: [server](https://github.com/MicrosoftDocs/minecraft-creator/blob/1ee68c332206196f4fa177c32b55a0f5dad54354/creator/ScriptAPI/minecraft/server/minecraft-server.md) y [server-ui](https://github.com/MicrosoftDocs/minecraft-creator/blob/1ee68c332206196f4fa177c32b55a0f5dad54354/creator/ScriptAPI/minecraft/server-ui/minecraft-server-ui.md), junto con sus changelogs. Se consultaron los archivos de main y se observó ese HEAD durante la misma revisión. Ambos documentan las versiones sin sufijo como manifiestos estables; también mencionan previews posteriores como contexto. No se usaron módulos beta.
- Los tipos oficiales instalados verifican `world.afterEvents.itemUse`, `playerLeave`, `system.run`, `Player.sendMessage`, `RawMessage` y `ActionFormData` con sus métodos `title/body/button/show`. Compilación estricta sin stubs propios ni `skipLibCheck`.
- Microsoft Learn respondió HTTP 403. Se consultaron sus fuentes oficiales en GitHub mediante el proxy, con permisos ampliados del sandbox. npm y GitHub sí funcionaron con ese acceso. El bloqueo de red de la fase anterior no debe interpretarse como vigente para todos los destinos.

La evidencia confirma publicación estable y compatibilidad declarada de tipos entre módulos; **no prueba que Minecraft Windows/Realms cargue este pack**. Esa compatibilidad de ejecución y la importación siguen sin probarse. La auditoría de Create 6.0.10 no se abordó de nuevo en esta fase y permanece pendiente.

## Contenido implementado y límites

- BP y RP con UUID fijos distintos para headers/módulos. BP depende del UUID/versión del RP y de ambos módulos oficiales. RP no depende del BP para evitar un ciclo.
- Dos bloques de muestra: `bedrockworks:gear` y `bedrockworks:shaft`, con geometrías, materiales, selección, colisión y loot declarados. Permanecen estáticos; no existe transmisión cinética.
- Tres objetos: componentes de engranaje/eje y manual. Cinco recetas originales de desarrollo: cobre + pepita de hierro → componente de engranaje; hierro → componente de eje; cada componente → su bloque; libro + cobre → manual. No son recetas atribuidas a Create.
- Manual de dos páginas con formularios y exclusión por jugador; no consume inventarios ni administra máquinas. Cierre, error y desconexión tienen rutas de salida. Verificar en juego si el uso del objeto dispara el evento en todos los dispositivos objetivo.
- Entidad de exhibición `bedrockworks:gear_display`: enlaza geometría, textura, controlador de render y animación de rotación. Solo se obtiene con `/summon`; no es una máquina ni gira bloques colocados.
- Sonido sintetizado original: mono Vorbis, 48 kHz, 0.3 s, evento `bedrockworks.mechanical_click`. No hay reproducción automática; se prueba con `/playsound`.
- Dominio independiente: utilidad matemática de rotación y exclusión de sesiones UI por jugador. Los módulos machines/logistics/recipes/persistence están reservados con documentación; no contienen funciones simuladas ni persistencia inventada.

## Identidad y recursos originales

Nombre de trabajo: Taller de Engranajes. Hierro azulado para ejes, cobre cálido y remaches de latón para engranajes, fondo pizarra para manual/icono. Siluetas voxel de ocho dientes y collarines cuadrados, sin entradas visuales externas. La generación algorítmica conserva fuentes, hashes y receta de creación en `assets_source/provenance.json` y `tools/generate_assets.py`.

Los PNG/OGG y geometrías ya están disponibles: compilar no exige herramientas gráficas ni regenerarlos. Regeneración opcional requiere Python 3.12 y FFmpeg con libvorbis. Las fuentes geométricas y animaciones se guardan además en `assets_source`; los archivos bajo resource_pack son los usados por Minecraft. Tras editar una fuente, exportar/copiar al RP y actualizar procedencia deliberadamente; ejecutar el generador sobrescribe los ejemplos generados.

## Blockbench

No se creó un `.bbmodel` ficticio. Abrir/importar `assets_source/models/blocks/gear.geo.json` o `shaft.geo.json` como **Bedrock Model** (el nombre del menú depende de la versión de Blockbench). Importar el PNG correspondiente de `assets_source/textures/blocks`, mantener textura 32×32, hueso `rotor` e identificador `geometry.bedrockworks.*`. Exportar Bedrock Geometry al RP; guardar un `.bbmodel` propio si se necesita conservar el proyecto del editor.

La animación JSON puede importarse al proyecto Bedrock desde `assets_source/animations/rotation.animation.json`. Mantener `animation.bedrockworks.rotation` y el hueso rotor. El modelo de eje también tiene ese hueso para reutilización futura, pero no se publica una entidad de eje animado. No se presume que bloques Bedrock ejecuten animaciones de entidades.

## Pipeline y distribución

`npm ci --ignore-scripts` reproduce dependencias desde lockfile; `npm run build` limpia scripts anteriores, compila TS y valida. `npm test` ejecuta Node en el mismo proceso con `--test-isolation=none`: en este ejecutor el modo aislado solo reportaba archivos y no los casos internos. No se acepta ese reporte reducido como evidencia de ejecución de casos.

`npm run validate` revisa JSON, UUID/dependencias, IDs duplicados por registro, texturas, modelos, animaciones, controladores, sonido, loot, recetas propias y traducciones declaradas/usadas. Es un validador del contenido de este proyecto, no un sustituto de todos los esquemas oficiales ni del Content Log de Minecraft. No detecta exhaustivamente cualquier futura API o cadena de texto arbitraria; al añadir tipos de recursos se deben ampliar sus reglas y pruebas.

`npm run package` crea un **artefacto de desarrollo** con ambos `.mcpack` dentro del `.mcaddon`, sin node_modules, fuentes TS, assets fuente, credenciales ni documentación de investigación. ZIP ordenado y marcas temporales fijas, checksum SHA-256 externo y escritura atómica. La reproducción byte a byte se comprueba en el mismo toolchain; fijar Python/zlib si se requiere igualdad entre sistemas distintos.

`npm run package:release` mantiene los bloqueos de investigación/licencias/Windows/Realms de `config/research.json`. Se permite construir desarrollo por petición explícita del usuario sin afirmar publicación o certificación. Marcar un gate manualmente no sustituye adjuntar evidencia. No se ha elegido licencia pública para código/arte propios.


## Evidencia local final de esta fase

- `npm ci --offline --ignore-scripts --no-audit --no-fund --cache /tmp/bedrockworks-npm`: reinstaló cinco paquetes desde el lockfile y la caché con integridad verificada. La caché de esta máquina no sustituye acceso a npm para una primera instalación en otra máquina.
- `npm run package`: compiló TypeScript, ejecutó **17 pruebas Node** sin fallos/skips y generó el artefacto de desarrollo.
- `python3 -m unittest discover -s tests -v`: **2 pruebas Python** aprobadas para bytes y metadatos deterministas del ZIP.
- `npm run validate`: 26 documentos JSON, 2 geometrías, 5 IDs de bloques/objetos, 14 claves de traducción por locale. También comprueba sonido, huesos de animación, imports compilados y hashes de procedencia.
- Dos compilaciones/empaquetados consecutivos produjeron SHA-256 `f1969495c7fcac65d0cb64e82746f323a4230ff4c316704e04131e36aa44d5f0`, 18188 bytes. Archivo externo de checksum junto al .mcaddon.
- Integridad ZIP/CRC comprobada: BP 24 archivos y RP 20 archivos; sin dependencias npm ni fuentes TS dentro. Se confirmó rechazo de release por source_verified, licenses_reviewed, windows_tested y realms_tested.
- FFprobe confirmó Vorbis mono de 48 kHz y 0.3 s. Icono PNG inspeccionado visualmente. Importación/render/audio dentro del juego siguen pendientes.
