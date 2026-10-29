# Estado funcional y revisión QA — 0.4.2

Fecha: 2026-10-29. Entrega: `dist/CreateBedrock-dev.mcaddon`, idéntico al paquete versionado 0.4.2. **Candidato de desarrollo para pruebas; no listo para producción. Minecraft Windows y Realms no ejecutados.**

## Evidencia por área

| Área | Verificación realizada | Resultado / alcance |
|---|---|---|
| Manifiestos | Cinco UUID únicos, versiones 0.4.2 coherentes, BP→RP, entrada JS y módulos | Automático aprobado; UUID anteriores preservados. No demuestra importación |
| API estable | npm latest y fuentes oficiales Microsoft fijadas; tipos instalados y tsc estricto | server 2.11.0 / server-ui 2.3.0; sin sufijos beta/rc, módulos extra rechazados. Compatibilidad declarada verificada; ejecución pendiente |
| Bedrock objetivo | version.json oficial Mojang del tag v1.26.60.5 | 1.26.60.5, fecha oficial 27-10-2026; mínimo interno [1,26,60]. No cliente local |
| JSON | Parser estricto de 146 JSON del proyecto y validación semántica propia de packs | Sin sintaxis inválida, claves duplicadas ni NaN. No se afirma cobertura de todos los esquemas oficiales Bedrock |
| IDs/assets | Registros duplicados, modelos, permutaciones, texturas, loot, sonidos, animaciones, huesos e imports | Automático aprobado para los tipos usados actualmente; 16 IDs bloque/objeto y 20 geometrías |
| Localización | es_MX y en_US en BP/RP, claves utilizadas, parámetros y catálogo | Automático aprobado. Presentación, sustituciones y selección de idioma dentro del cliente pendientes |
| Arte/licencias | Generadores propios, 64 entradas de procedencia/hashes y fuentes; comparación con 2.451 archivos ARR de Create exacto | Sin coincidencias byte a byte; 63 fuentes del mismo formato coinciden y el OGG deriva de WAV original. No evidencia de copia; auditoría legal exhaustiva/licencia pública propia pendientes |
| Recetas | Catálogo vs BP y motor; cantidades; máquinas, referencias, iconos/traducciones y snapshot técnico | 1.901 recetas: 13 JSON de mesa propios + 3 de prensado + 1 referencia vanilla + 1.884 Java. Java no fabricable; ocho familias dinámicas no enumeradas en runtime |
| Dominio/integración simulada | 106 casos Node, incluidos grafo, controlador con mundo simulado, fábrica, conservación, sesiones, errores y validadores | 106 aprobados, cero fallos/omitidos. Ninguno ejecuta Minecraft |
| Empaquetado/parser QA | Cuatro casos Python, ZIP determinista y JSON estricto | Aprobados. CRC/estructura/hashes del paquete revisados; importación pendiente |
| Persistencia | Journal v1, fases ambiguas, corrupción JSON, cambios de pila, reconstrucción de procesador | Pruebas puras aprobadas; propiedades dinámicas y guardado nativo bajo fallos requieren Minecraft |
| Multijugador | Exclusión síncrona de inventarios y sesiones asíncronas por jugador | Simulaciones aprobadas; dos cuentas nativas, tolvas, latencia y desconexión pendientes |
| Chunks | Caducidad, pausa en fronteras desconocidas, retiro tras 1.200 ticks y redescubrimiento | Pruebas del controlador aprobadas; callbacks y descarga real pendientes |
| CPU/memoria | Benchmark sintético V8/Node de redes y catálogo | Medido solo en Linux/Node; ningún dato de TPS/CPU/RAM de Minecraft o Realm disponible |
| Realms/experimentos | Solo dos módulos estables, JS empaquetado sin servicios externos, entidades no experimentales | Compatible por diseño/configuración. Compatibilidad operativa con Realms **sin verificar** |

Fuentes comprobadas de versiones, fecha y URLs: [evidencia/versiones-0.4.2.json](evidencia/versiones-0.4.2.json). Se respetó el proxy de red; las consultas HTTP requirieron permisos ampliados del ejecutor. No se modificó la configuración publicada del entorno.

## Módulos y alcance implementado en código

| Módulo | Lo que existe | Evidencia que falta |
|---|---|---|
| core/main | IDs, traducción y registro de adaptadores/componentes | Arranque nativo sin errores |
| kinetic | Eje, engranajes pequeño/grande, caja, rueda, fuente de prueba y dos medidores; RPM/signo/ratios/esfuerzo/sobrecarga/división/ciclos | Agua real, orientación, eventos, render, persistencia y escala en juego |
| machines/recipes | Prensa animada, impacto 8 SU/RPM, tres procesos 1:1, entrada/producto en barril inferior; trabajo 240 por lingote | Producción nativa en supervivencia, animación, recuperación y conteos reales |
| logistics | Embudo pasivo filtrado, traslado nativo de pilas completas entre barriles | Native moveItem, concurrencia con jugadores/tolvas y chunks |
| persistence | Registro v1 de progreso sin propiedad de objetos, decoder de corrupción y recuperación sin replay | Orden/durabilidad del guardado nativo; no hay transacción ACID |
| multiplayer | Locks síncronos compartidos y tokens por sesión del manual | Dos cuentas reales, respuestas demoradas y protecciones de mundos |
| guidebook | Libro fabricable, once categorías, búsqueda, filtros, recetas/usos/alternativas, imágenes, cuatro tutoriales | Callbacks de uso y formularios, idiomas y latencia real |
| assets/tooling | Recursos industriales originales y generadores; build, validadores, benchmark, demos y empaquetador | Revisión visual/audio nativa y licencia pública final |

Diez bloques propios y seis objetos; solo prensa y embudo del nuevo grupo industrial están implementados. Mezcladora, trituradoras, molino, ventilador, sierra, taladro, cinta y depósito siguen pendientes. Contraptions/trenes y paridad Java completa tampoco existen. Los nombres en el catálogo Java no significan implementación Bedrock.

## Rendimiento: medición y límites

Ensayo único Linux, Node v24.19.0, V8 con `--expose-gc`: 3.000 nodos resueltos en 94 llamadas de hasta 128 operaciones (12.003 operaciones). En esta ejecución, ~23,8 ms de resolución total repartida y ~1,8 ms como mayor llamada; no es tiempo de un tick de Minecraft. La creación de 3.000 nodos en el benchmark fue un bucle síncrono de prueba, no el descubrimiento presupuestado nativo.

Catálogo: 3.177.260 bytes JSON; parseo+índice ~34,5 ms; 100 búsquedas ~20,5 ms; incremento de heap retenido ~6,5 MB. Datos de una sola ejecución con ruido JIT/GC, **sin garantía ni extrapolación a Bedrock/Realms**. Informe medido completo: `dist/qa-performance.json`; se reproduce con `npm run benchmark` y puede variar.

El runtime evita recorrer el mundo: cola de cambios y posiciones conocidas. Cinética: tres muestras en cola y 128 operaciones de grafo por tick, con presupuestos blandos; hasta cuatro actualizaciones/limpiezas visuales. Prensa: hasta ocho posiciones distintas/tick, 3 ms blandos. Embudos: hasta ocho cada 20 ticks, 2 ms blandos; inspección limitada de slots. 256 visuales rastreados; no hay entidades de objeto por cada traslado. Índice del manual compartido, una sesión por jugador e historial máximo de 64 rutas. Las propiedades huérfanas, nodos cargados a gran escala y primer índice siguen necesitando medición real.

## Reproducción y promoción

Comandos y montaje: [INSTALACION.md](INSTALACION.md), [FABRICA.md](FABRICA.md). Pruebas pendientes: [Windows](PRUEBAS_WINDOWS.md) y [Realms](PRUEBAS_REALMS.md). Límites y fallos: [PROBLEMAS_CONOCIDOS.md](PROBLEMAS_CONOCIDOS.md).

`npm test`, `python3 -m unittest discover -s tests -v`, `npm run demo`, `npm run demo:factory`, `npm run benchmark`; auditoría adicional: `python3 tools/qa-static.py --upstream /ruta/checkout-exacto`. Empaquetado: `python3 tools/package_addon.py`. Informes y logs de esta entrega: `dist/qa-report.json`, `dist/qa-static.json`, `dist/qa-performance.json`, `dist/qa-tests-node.txt`, `dist/qa-tests-python.txt`.

Promoción bloqueada hasta aprobar pruebas Windows/Realms con evidencia de conservación y recuperación, medir rendimiento nativo y cerrar revisión legal. `config/research.json` mantiene `windows_tested=false`, `realms_tested=false`, `licenses_reviewed=false`. No activar esos gates por el resultado de una compilación. No se publicó un release ni se accedió a un Realm.
