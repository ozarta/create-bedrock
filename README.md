# Taller de Engranajes — Create Bedrock (desarrollo)

## Descargar e instalar

[**Descargar CreateBedrock-dev.mcaddon**](https://github.com/ozarta/create-bedrock/raw/refs/heads/main/dist/CreateBedrock-dev.mcaddon). Si GitHub muestra la página del archivo, pulsa **Download raw file**. Abre el archivo con Minecraft Bedrock para Windows y activa ambos packs en una copia de prueba, sin experimentos.

Para descargar todo el proyecto, usa **Code → Download ZIP** en este repositorio. Es una versión de desarrollo; la ejecución Windows/Realms sigue pendiente. Consulta [Instalación](docs/INSTALACION.md).


Versión de desarrollo **0.4.2** sobre el proyecto existente, destinada a Bedrock 26.60, Windows y Realms. **No se probó dentro de Minecraft ni Realms.** El código cinético y su adaptador compilan y tienen pruebas automatizadas; la integración de juego requiere las comprobaciones manuales.

Incluye ocho componentes: eje, engranajes pequeño/grande, caja, rueda hidráulica, fuente de desarrollo y medidores de velocidad/esfuerzo. El grafo resuelve RPM con signo, ratios, capacidad, demanda, sobrecarga, conflictos, separación y disponibilidad por presupuesto. La rueda usa una condición explícita de agua descendente; el medidor de esfuerzo añade un freno de prueba. Texturas/modelos/animaciones propios, manual es_MX/en_US y recetas de supervivencia originales.

Se estudió Create Java **6.0.10 / Minecraft 1.21.1**, tag y SHA exactos, sin incorporar su arte. Las reglas MIT consultadas y diferencias están en [CINETICA.md](docs/CINETICA.md); el inventario completo del mod sigue pendiente. La primera vertical de procesamiento añade prensa y embudos filtrados entre barriles. Las ocho máquinas restantes, contraptions y trenes siguen pendientes; consulta [FABRICA.md](docs/FABRICA.md).

Prensa: 1 lingote de hierro/cobre/oro → 1 lámina, con energía cinética, barril inferior y animación propia. Embudos: entrada/salida filtradas, pilas completas y destino vacío. Se conserva el sistema cinético y el manual anteriores. [Montaje y aceptación sin comandos](docs/FABRICA.md).

## Manual de Ingeniería Mecánica

Fabrica `bedrockworks:guidebook` con **1 libro + 1 lingote de cobre** en mesa y úsalo. Incluye once categorías, búsqueda bilingüe, filtros, ingredientes/cantidades, usos, alternativas, estación de fabricación, fichas de componentes, historial e ilustraciones ampliables. Cuatro tutoriales incluyen montaje de fábrica sin comandos y comprueban bloques y métricas del grafo real sin modificar construcciones automáticamente.

Las recetas de mesa se leen del BP y las tres de prensado de `data/processing/recipes.json`; las 1.884 recetas Java del tag exacto aparecen solo como referencia no fabricable. Los ocho grupos dinámicos de Java no se expandieron en un mundo Java. Los componentes propios siguen marcados disponibles parcialmente hasta probar su integración en el motor. Véase [MANUAL.md](docs/MANUAL.md).

## Revisión de calidad 0.4.2

Paquete de prueba: `dist/CreateBedrock-dev.mcaddon`. [Instalación](docs/INSTALACION.md), [estado funcional y evidencia](docs/ESTADO_FUNCIONAL.md), [problemas conocidos](docs/PROBLEMAS_CONOCIDOS.md), [pruebas Windows](docs/PRUEBAS_WINDOWS.md) y [pruebas Realms](docs/PRUEBAS_REALMS.md). No es una versión certificada ni lista para producción.

## Compilar y probar

Requisitos: Node.js 24 LTS recomendado, npm 11 y Python 3.12. TypeScript 5.9.3 y tipos oficiales server 2.11.0 / server-ui 2.3.0 están fijados en package-lock.json. Python 3.12 se usa en el build para generar el catálogo y empaquetar; FFmpeg solo es necesario para regenerar audio. Los recursos ya están guardados.

```sh
npm ci --ignore-scripts
npm run build
npm run validate
npm test
npm run package
npm run demo
npm run demo:factory
npm run benchmark
python3 tools/qa-static.py
```

En Windows sustituir `python3` por `py -3` en scripts npm si el comando no existe: después de `npm test`, ejecutar `py -3 tools/package_addon.py`. Para las comprobaciones adicionales de ZIP: `python3 -m unittest discover -s tests -v`.

Salida: `dist/CreateBedrock-dev.mcaddon` y su `.sha256`. `npm run package:release` rechaza versiones sin evidencia legal y de juego completa; el paquete de desarrollo se permite expresamente para pruebas. No distribuirlo como add-on validado. Para regenerar ejemplos originales: `npm run assets` (Python + FFmpeg; sobrescribe únicamente los ejemplos generados).

## Estructura

```text
behavior_pack/      manifiesto, bloques, objetos, recetas, loot, scripts compilados
resource_pack/      manifiesto, PNG, geometrías, animación, render, sonido, idiomas
src/
  core/            IDs y mensajes traducibles
  kinetic/         grafo incremental, reglas, agua, caducidad y adaptador servidor
  machines/        prensa, adaptador nativo y motor de sustitución de slot
  logistics/       embudo filtrado y traslado nativo entre barriles
  recipes/         contratos y recetas generadas desde datos
  guidebook/       catálogo, búsqueda, historial, pantallas y formularios del manual
  persistence/     reservado
  multiplayer/     exclusión de sesiones e inventarios compartidos
data/              textos estructurados y referencia técnica Java con procedencia
assets_source/     originales editables, WAV y procedencia SHA-256
tools/             build, validación, generación, empaquetado y auditoría upstream
tests/             pruebas Node y comprobaciones adicionales Python
docs/              diseño, investigación, evidencias y pruebas manuales
dist/              .mcaddon generado (ignorado por Git)
```

## Instalar en Windows

1. Respaldar el mundo. Usar Minecraft for Windows estable 26.60, no Java Edition ni Preview.
2. Abrir el archivo `.mcaddon` con Minecraft o doble clic si la extensión está asociada. Esperar el resultado real de importación de ambos packs; cualquier error debe revisarse en Content Log.
3. Crear una copia de mundo de prueba y activar el Behavior Pack y su Resource Pack vinculado. No habilitar experimentos para ocultar fallos.
4. Buscar los componentes/objetos en creativo o usar `/give @s bedrockworks:guidebook`, `/give @s bedrockworks:gear` y `/give @s bedrockworks:shaft` con trucos habilitados en ese mundo de prueba.
5. Usar el manual; colocar/romper bloques; probar recetas de mesa en supervivencia. Para la animación: `/summon bedrockworks:gear_display ~ ~ ~`. Para el audio: `/playsound bedrockworks.mechanical_click @s`.
6. Para demostrar la red, usar una copia de mundo con el volumen vacío indicado en [CINETICA.md](docs/CINETICA.md) y ejecutar `/function bedrockworks/kinetic_demo`. La función coloca bloques reales y un canal de agua; sobrescribe sus posiciones. El fixture Node verifica +8 RPM en rueda y -16 RPM a la salida, 128/256 SU; el resultado nativo está pendiente de prueba.
7. En los ocho bloques, agacharse e interactuar cambia X/Y/Z. Interacción normal con fuente de prueba cambia RPM; con medidor de esfuerzo alterna freno 0/8/64 SU por RPM. Mirar un medidor muestra los valores del grafo en barra de acción.
8. Eliminar entidades de muestra al terminar con `/kill @e[type=bedrockworks:gear_display]`. El antiguo gear_display sigue siendo una muestra aislada; los nuevos rotores visual_* reciben RPM del grafo del servidor. No crear visual_* a mano.

La importación puede fallar: estas instrucciones son el procedimiento de prueba, no una afirmación de funcionamiento. Subir a Realms solo una copia respaldada y completar [la lista manual](docs/PRUEBAS_MANUALES.md).

## Git y colaboración

Se conservó el repositorio existente, sin reset, commits automáticos, push ni cambios de identidad. Configuración local aplicada: `core.autocrlf=false`, `core.safecrlf=true`; `.gitattributes` fija LF para texto y binario para PNG/OGG/WAV. No cambiar UUID al editar recursos; aumentar versiones de ambos packs al preparar una actualización. Revisar `git diff --check` antes de un commit. Dependencias y scripts generados están ignorados; lockfile y recursos originales se versionan. Cada tarea ya está aislada: utilizar su checkout existente, sin crear worktrees salvo petición explícita.

## Documentación

- [Manual 0.3.0 y API estable](docs/MANUAL.md)
- [Cinética 0.2.0, fuentes y demostración](docs/CINETICA.md)
- [Base técnica y versiones verificadas](docs/BASE_TECNICA.md)
- [Pruebas manuales Windows/Realms](docs/PRUEBAS_MANUALES.md)
- [Inventario preliminar](docs/INVENTARIO_CREATE.md)
- [Paridad funcional](docs/PARIDAD_FUNCIONAL.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Licencias](docs/LICENCIAS.md)
- [Recetas](docs/RECETAS.md)
- [Realms](docs/REALMS.md)
- [Roadmap](docs/ROADMAP.md)
- [Fuentes y versiones](docs/FUENTES_Y_VERSIONES.md)

Proyecto independiente, sin afiliación con Mojang/Microsoft ni el equipo de Create. La licencia pública del trabajo original está pendiente de decisión del titular del proyecto; véase THIRD_PARTY_NOTICES.md para dependencias de desarrollo.
