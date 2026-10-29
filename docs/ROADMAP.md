# Roadmap verificable

Estado 0.2.0: base y subconjunto cinético implementados y probados en Node; Windows/Realms pendientes. CINETICA.md documenta redes, fuentes, medidores, recursos y demostración. No hay máquinas de procesamiento.

| Hito | Entregable | Condición de salida |
|---|---|---|
| 0 — Fuentes y legal | Commit Create 6.0.10/Java 1.21.1, auditoría de licencias y versiones Bedrock | Evidencia exacta; inventario por ID y recetas cotejadas; APIs estables fijadas |
| 1 — Pack mínimo | Manifiestos, UUID, es_MX/en_US, script de arranque, primer recurso original | Importación Windows y Realm sin errores ni experimentos |
| 2 — Primera vertical | Fuente cinética, eje, prensa, entrada/salida y página del manual | Receta obtenible en supervivencia; bloqueo por sobrecarga; recarga segura; dos jugadores |
| 3 — Producción | Molino, cuenco, mezclador y calor | Recetas y consumos confirmados; pruebas contra pérdida/duplicación |
| 4 — Transporte | Cintas, filtros, embudos y contenedores | Conservación bajo congestión, reinicio y chunks descargados |
| 5 — Automatización | Fluidos lógicos, despliegue limitado, ensamblaje | Acciones auditadas y progresión completa de materiales |
| 6 — Investigación móvil | Prototipos aislados de contraptions y trenes | Demostrar colisión, pasajeros, persistencia y rendimiento antes de aceptar alcance |
| 7 — Distribución | Arte/audio propios, manual completo, .mcaddon y avisos | Pruebas Windows/Realm, licencias cerradas y rollback ensayado |

## Primera implementación recomendada

Una vertical de **manivela → eje → prensa estacionaria**, con entrada/salida delimitada y manual en español. Incluye materiales/recetas mínimos obtenibles sin comandos; sus cantidades se definirán después de auditar fuentes y decidir si existe divergencia Bedrock. No implementarla como animación decorativa: debe consumir una entrada exactamente una vez, requerir velocidad y capacidad válidas y entregar una salida persistente.

Criterios: orientación correcta; arranque/parada; red partida al romper eje; conflicto de fuentes; sobrecarga sin producción; salida llena sin consumir; reconexión y reinicio sin duplicar; interacción simultánea de dos jugadores; receta visible y tutorial navegable en es_MX/en_US. Solo al aprobarlos declarar esa vertical funcional. La manivela deberá tener una ventana de actividad/requerimiento de interacción documentada; no simular que produce energía infinita sin jugador.

## Trabajo pendiente por red

Localizar y resolver tag/commit, verificar LICENSE.md y dependencias, completar listado individual y categorías/archivos exactos de recetas, auditar fórmulas cinéticas y algoritmos de transporte, completar pruebas de ejecución Windows/Realms. La versión estable oficial, los tipos de API, TypeScript y lockfile ya fueron comprobados/fijados en la fase de base técnica; véase BASE_TECNICA.md.

## Base disponible ahora

Documentación de diseño y evidencia, inventario preliminar por familias, BP/RP enlazados, TypeScript compilable, recursos originales con procedencia, validadores y pruebas Node. Existe .mcaddon de desarrollo; release público bloqueado por auditoría/licencias y pruebas de juego pendientes. Ninguna comprobación local sustituye una ejecución en Minecraft.


Actualización 0.3.0: manual por datos, búsqueda/filtros, fichas, usos, alternativas, imágenes y tres tutoriales integrados en código; referencias JSON de Create extraídas con estado no fabricable. Validación de la interfaz dentro del juego y Realms pendiente. Las máquinas de procesamiento y la progresión Java completa no se implementan por añadir sus referencias al manual.


## Actualización de fábrica 0.4.1

Prensa y embudo filtrado implementados en código con pruebas Node; integración Minecraft/Realms pendiente. Tres procesos de láminas, barriles nativos, inventarios conservadores y tutorial de supervivencia sin comandos. Ocho máquinas restantes pendientes. La descripción actual y las diferencias Java/Bedrock de esta vertical están en [FABRICA.md](FABRICA.md); las indicaciones anteriores sin procesamiento describen hitos previos.
